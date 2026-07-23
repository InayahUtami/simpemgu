import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper function to format number with dot separator
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

type LinkageType = 'single' | 'complete' | 'average' | 'ward';

type AHPVariableKey = 'penduduk' | 'guru' | 'siswa' | 'rombel' | 'rasio';

type AHPWeightConfig = Record<AHPVariableKey, number>;

const DEFAULT_AHP_WEIGHTS: AHPWeightConfig = {
  penduduk: 1,
  guru: 1,
  siswa: 1,
  rombel: 1,
  rasio: 4,
};

const AHP_VARIABLES: AHPVariableKey[] = ['penduduk', 'guru', 'siswa', 'rombel', 'rasio'];

function buildAhpMatrix(weights: AHPWeightConfig) {
  return AHP_VARIABLES.map((rowKey) =>
    AHP_VARIABLES.map((colKey) => {
      if (rowKey === colKey) return 1;
      const rowWeight = Math.max(Number(weights[rowKey]) || 1, 0.1);
      const colWeight = Math.max(Number(weights[colKey]) || 1, 0.1);
      return rowWeight / colWeight;
    })
  );
}

function getAhpWeights(matrix: number[][]) {
  const colSum = Array(matrix[0].length).fill(0);
  for (let j = 0; j < matrix[0].length; j++) {
    for (let i = 0; i < matrix.length; i++) colSum[j] += matrix[i][j];
  }

  const normalized = matrix.map((row) => row.map((value, j) => value / colSum[j]));
  return normalized.map((row) => row.reduce((sum, value) => sum + value, 0) / row.length);
}

async function getActiveAHPWeights(): Promise<AHPWeightConfig> {
  const rows = await query<Partial<AHPWeightConfig>>(
    `SELECT penduduk, guru, siswa, rombel, rasio
     FROM pembobotan_ahp
     WHERE is_active = TRUE
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`
  );

  const row = rows[0];
  if (!row) return DEFAULT_AHP_WEIGHTS;

  return {
    penduduk: Number(row.penduduk ?? DEFAULT_AHP_WEIGHTS.penduduk),
    guru: Number(row.guru ?? DEFAULT_AHP_WEIGHTS.guru),
    siswa: Number(row.siswa ?? DEFAULT_AHP_WEIGHTS.siswa),
    rombel: Number(row.rombel ?? DEFAULT_AHP_WEIGHTS.rombel),
    rasio: Number(row.rasio ?? DEFAULT_AHP_WEIGHTS.rasio),
  };
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}


// MinMax Normalization sesuai notebook (0-1 range)
function minMaxNormalize(data: number[][]): number[][] {
  if (data.length === 0) return data;
  const dim = data[0].length;
  const mins = Array(dim).fill(Number.MAX_VALUE);
  const maxs = Array(dim).fill(Number.MIN_VALUE);

  // Find min and max for each dimension
  data.forEach((row) => {
    for (let j = 0; j < dim; j++) {
      const val = row[j] || 0;
      mins[j] = Math.min(mins[j], val);
      maxs[j] = Math.max(maxs[j], val);
    }
  });

  // Normalize to [0, 1]
  return data.map((row) => row.map((v, j) => {
    const range = maxs[j] - mins[j];
    return range === 0 ? 0 : ((v || 0) - mins[j]) / range;
  }));
}

function buildDistanceMatrix(points: number[][]): number[][] {
  const n = points.length;
  const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Use standard Euclidean distance (weights already applied to points)
      const d = euclideanDistance(points[i], points[j]);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  return dist;
}

function clusterDistance(a: number[], b: number[], dist: number[][], linkage: LinkageType, points: number[][]): number {
  if (linkage === 'ward') {
    const dim = points[0]?.length || 0;
    const centroidA = Array(dim).fill(0);
    const centroidB = Array(dim).fill(0);

    a.forEach((idx) => {
      for (let d = 0; d < dim; d++) centroidA[d] += points[idx][d] || 0;
    });
    b.forEach((idx) => {
      for (let d = 0; d < dim; d++) centroidB[d] += points[idx][d] || 0;
    });

    for (let d = 0; d < dim; d++) {
      centroidA[d] /= Math.max(a.length, 1);
      centroidB[d] /= Math.max(b.length, 1);
    }

    let sq = 0;
    for (let d = 0; d < dim; d++) {
      const diff = centroidA[d] - centroidB[d];
      sq += diff * diff;
    }

    return (a.length * b.length) / Math.max(a.length + b.length, 1) * sq;
  }

  const values: number[] = [];
  for (const i of a) {
    for (const j of b) values.push(dist[i][j]);
  }
  if (values.length === 0) return 0;
  if (linkage === 'single') return Math.min(...values);
  if (linkage === 'complete') return Math.max(...values);
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function agglomerativeClustering(dist: number[][], points: number[][], k: number, linkage: LinkageType): { labels: number[], linkageMatrix: number[][] } {
  type Cluster = { id: number; members: number[] };
  const n = dist.length;
  let clusters: Cluster[] = dist.map((_, idx) => ({ id: idx, members: [idx] }));
  const linkageMatrix: number[][] = [];
  let nextClusterIdx = n;

  while (clusters.length > k) {
    let bestI = 0;
    let bestJ = 1;
    let bestDist = Infinity;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = clusterDistance(clusters[i].members, clusters[j].members, dist, linkage, points);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }

    const cluster1 = clusters[bestI];
    const cluster2 = clusters[bestJ];
    const merged: Cluster = {
      id: nextClusterIdx++,
      members: [...cluster1.members, ...cluster2.members],
    };

    linkageMatrix.push([
      cluster1.id,
      cluster2.id,
      bestDist,
      merged.members.length
    ]);

    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
    clusters.push(merged);
  }

  const labels = Array(n).fill(0);
  clusters.forEach((cluster, clusterIndex) => {
    cluster.members.forEach((pointIdx) => {
      labels[pointIdx] = clusterIndex;
    });
  });

  return { labels, linkageMatrix };
}

function buildCopheneticMatrix(linkageMatrix: number[][], n: number): number[][] {
  const cophenetic = Array.from({ length: n }, () => Array(n).fill(0));
  const members = new Map<number, number[]>();

  for (let idx = 0; idx < n; idx++) {
    members.set(idx, [idx]);
  }

  let nextClusterId = n;
  for (const [leftId, rightId, dist] of linkageMatrix) {
    const leftMembers = members.get(leftId) || [];
    const rightMembers = members.get(rightId) || [];

    for (const i of leftMembers) {
      for (const j of rightMembers) {
        cophenetic[i][j] = dist;
        cophenetic[j][i] = dist;
      }
    }

    members.set(nextClusterId, [...leftMembers, ...rightMembers]);
    nextClusterId += 1;
  }

  return cophenetic;
}

function copheneticCorrelation(originalDist: number[][], copheneticDist: number[][]): number {
  const n = originalDist.length;
  const originalFlat: number[] = [];
  const copheneticFlat: number[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      originalFlat.push(originalDist[i][j]);
      copheneticFlat.push(copheneticDist[i][j]);
    }
  }

  const m = originalFlat.length;
  if (m === 0) return 0;

  const meanX = originalFlat.reduce((sum, v) => sum + v, 0) / m;
  const meanY = copheneticFlat.reduce((sum, v) => sum + v, 0) / m;

  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let idx = 0; idx < m; idx++) {
    const dx = originalFlat[idx] - meanX;
    const dy = copheneticFlat[idx] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  const denominator = Math.sqrt(varX * varY);
  return denominator === 0 ? 0 : cov / denominator;
}

function silhouetteScore(labels: number[], dist: number[][]): number {
  const n = labels.length;
  if (n <= 1) return 0;
  const uniqueLabels = Array.from(new Set(labels));
  const clusterSizes = new Map<number, number>();
  labels.forEach((label) => {
    clusterSizes.set(label, (clusterSizes.get(label) ?? 0) + 1);
  });

  const scorePerPoint: number[] = [];
  for (let i = 0; i < n; i++) {
    const own = labels[i];
    if ((clusterSizes.get(own) ?? 0) <= 1) {
      scorePerPoint.push(0);
      continue;
    }
    const ownMembers = labels.map((l, idx) => ({ l, idx })).filter((x) => x.l === own && x.idx !== i).map((x) => x.idx);
    const a = ownMembers.length > 0 ? ownMembers.reduce((s, idx) => s + dist[i][idx], 0) / ownMembers.length : 0;

    let b = Infinity;
    for (const other of uniqueLabels) {
      if (other === own) continue;
      const otherMembers = labels.map((l, idx) => ({ l, idx })).filter((x) => x.l === other).map((x) => x.idx);
      if (otherMembers.length === 0) continue;
      const avg = otherMembers.reduce((s, idx) => s + dist[i][idx], 0) / otherMembers.length;
      b = Math.min(b, avg);
    }
    if (!isFinite(b)) b = 0;
    const denom = Math.max(a, b);
    const s = denom === 0 ? 0 : (b - a) / denom;
    scorePerPoint.push(s);
  }

  return scorePerPoint.reduce((s, v) => s + v, 0) / scorePerPoint.length;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const numberOfClusters = parseInt(searchParams.get('clusters') || '3');
    const linkage = (searchParams.get('linkage') || 'average') as LinkageType;

    const activeAHPWeights = await getActiveAHPWeights();
    const ahpMatrix = buildAhpMatrix(activeAHPWeights);
    const variableWeightsArray = getAhpWeights(ahpMatrix);

    // Validasi input
    if (!tahun) {
      return NextResponse.json(
        { success: false, error: 'Parameter tahun diperlukan' },
        { status: 400 }
      );
    }

    if (numberOfClusters < 2 || numberOfClusters > 10) {
      return NextResponse.json(
        { success: false, error: 'Jumlah cluster harus antara 2-10' },
        { status: 400 }
      );
    }
    if (!['single', 'complete', 'average', 'ward'].includes(linkage)) {
      return NextResponse.json(
        { success: false, error: 'linkage harus single, complete, average, atau ward' },
        { status: 400 }
      );
    }

    // Ambil data variabel pemerataan guru per kecamatan (master data)
    const results: Record<string, unknown>[] = await query(`
      SELECT 
        k.id,
        k.nomor,
        k.nama as kecamatan,
        COALESCE(jp.jumlah_penduduk, 0) as jumlah_penduduk,
        COALESCE(vg.total_guru, 0) as total_guru,
        COALESCE(vs.total_siswa, 0) as total_siswa,
        COALESCE(vr.total_rombel, 0) as total_rombel
      FROM kecamatan k
      LEFT JOIN jumlah_penduduk jp ON k.id = jp.kecamatan_id AND jp.tahun = ?
      LEFT JOIN (
        SELECT kecamatan_id, SUM(total_guru) AS total_guru
        FROM view_guru_per_kecamatan
        WHERE tahun = ? OR tahun LIKE CONCAT(?, '/%') OR tahun LIKE CONCAT(?, '-%')
        GROUP BY kecamatan_id
      ) vg ON vg.kecamatan_id = k.id
      LEFT JOIN (
        SELECT kecamatan_id, SUM(total_siswa) AS total_siswa
        FROM view_siswa_per_kecamatan
        WHERE tahun = ? OR tahun LIKE CONCAT(?, '/%') OR tahun LIKE CONCAT(?, '-%')
        GROUP BY kecamatan_id
      ) vs ON vs.kecamatan_id = k.id
      LEFT JOIN (
        SELECT kecamatan_id, SUM(total_rombel) AS total_rombel
        FROM view_rombel_per_kecamatan
        WHERE tahun = ? OR tahun LIKE CONCAT(?, '/%') OR tahun LIKE CONCAT(?, '-%')
        GROUP BY kecamatan_id
      ) vr ON vr.kecamatan_id = k.id
      ORDER BY k.nomor ASC
    `, [
      tahun,
      tahun, tahun, tahun,
      tahun, tahun, tahun,
      tahun, tahun, tahun,
    ]);

    const schoolRows: Record<string, unknown>[] = await query(`
      SELECT kecamatan_id, nama_sekolah
      FROM sekolah_dasar
      ORDER BY nama_sekolah ASC
    `);

    const schoolMap = new Map<number, string[]>();
    schoolRows.forEach((row: Record<string, unknown>) => {
      const arr = schoolMap.get(row.kecamatan_id as number) || [];
      arr.push(row.nama_sekolah as string);
      schoolMap.set(row.kecamatan_id as number, arr);
    });

    const validResults = results.filter((row: Record<string, unknown>) =>
      Number(row.jumlah_penduduk || 0) > 0 &&
      Number(row.total_guru || 0) > 0 &&
      Number(row.total_siswa || 0) > 0 &&
      Number(row.total_rombel || 0) > 0
    );

    if (validResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Tidak ada data lengkap multivariabel untuk tahun ${tahun}`,
          details: 'Pastikan data penduduk, guru, siswa, dan rombel tersedia (tidak 0) pada tahun yang dipilih.'
        },
        { status: 404 }
      );
    }
    if (validResults.length < numberOfClusters) {
      return NextResponse.json(
        { success: false, error: `Jumlah data (${validResults.length}) kurang dari jumlah cluster (${numberOfClusters})` },
        { status: 400 }
      );
    }

    // Variabel: jumlah_penduduk, total_guru, total_siswa, total_rombel, rasio_siswa_guru
    const rawPoints = validResults.map((row: any) => {
      const guru = Number(row.total_guru || 0);
      const siswa = Number(row.total_siswa || 0);
      const rasio = guru > 0 ? siswa / guru : 0;
      return [
        Number(row.jumlah_penduduk || 0),
        guru,
        siswa,
        Number(row.total_rombel || 0),
        rasio,
      ];
    });

    // Normalize dengan MinMax (0-1 range) sesuai notebook
    const normalizedPoints = minMaxNormalize(rawPoints);
    
    // Apply weights to normalized points (indeks berbobot per variabel)
    const weightedPoints = normalizedPoints.map((point) =>
      point.map((val, idx) => val * variableWeightsArray[idx])
    );
    
    const rowsWithScore = validResults.map((row: any, idx: number) => {
      const avgScore = weightedPoints[idx].reduce((s, v) => s + v, 0) / weightedPoints[idx].length;
      return {
        ...row,
        skor_pemerataan: Number(avgScore.toFixed(4)),
        indeksGuru: Number(normalizedPoints[idx][1]).toFixed(4),
        indeksSiswa: Number(normalizedPoints[idx][2]).toFixed(4),
        indeksRombel: Number(normalizedPoints[idx][3]).toFixed(4),
        indeksRasio: Number(normalizedPoints[idx][4]).toFixed(4),
      };
    });
    
    // Use standard Euclidean distance (weights already applied to points)
    const distanceMatrix = buildDistanceMatrix(weightedPoints);
    const { labels, linkageMatrix } = agglomerativeClustering(distanceMatrix, weightedPoints, numberOfClusters, linkage);
    const silhouette = silhouetteScore(labels, distanceMatrix);

    // Compute silhouette scores for k = 2..9 (or up to number of points)
    const silhouetteByK: { k: number; score: number }[] = [];
    const maxK = Math.min(9, weightedPoints.length);
    for (let kk = 2; kk <= maxK; kk++) {
      const resK = agglomerativeClustering(distanceMatrix, weightedPoints, kk, linkage);
      const labelsK = Array.isArray(resK) ? resK : (resK as any).labels;
      const sK = silhouetteScore(labelsK, distanceMatrix);
      silhouetteByK.push({ k: kk, score: Number(sK.toFixed(4)) });
    }

    const linkages: LinkageType[] = ['single', 'complete', 'average', 'ward'];
    const copheneticByLinkage = linkages.reduce((acc, method) => {
      const hierarchy = agglomerativeClustering(distanceMatrix, weightedPoints, 1, method);
      const copheneticMatrix = buildCopheneticMatrix(hierarchy.linkageMatrix, weightedPoints.length);
      acc[method] = Number(copheneticCorrelation(distanceMatrix, copheneticMatrix).toFixed(4));
      return acc;
    }, {} as Record<LinkageType, number>);

    const copheneticCorrelationCoefficient = copheneticByLinkage[linkage];

    // Hitung statistik untuk setiap cluster
    const clusterStats: any = {};
    labels.forEach((clusterIndex: number, dataIndex: number) => {
      if (!clusterStats[clusterIndex]) {
        clusterStats[clusterIndex] = {
          items: [],
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity
        };
      }
      
      const score = rowsWithScore[dataIndex].skor_pemerataan;
      clusterStats[clusterIndex].items.push(rowsWithScore[dataIndex]);
      clusterStats[clusterIndex].sum += score;
      clusterStats[clusterIndex].count++;
      clusterStats[clusterIndex].min = Math.min(clusterStats[clusterIndex].min, score);
      clusterStats[clusterIndex].max = Math.max(clusterStats[clusterIndex].max, score);
    });

    // Format hasil clustering - urutkan berdasarkan rasio guru-siswa (seperti di notebook)
    const clusters = Object.keys(clusterStats)
      .sort((a, b) => {
        // Hitung rata-rata rasio guru-siswa untuk setiap cluster
        const avgRatioA = clusterStats[a].items.reduce((sum: number, item: any) => {
          const guru = Number(item.total_guru || 0);
          const siswa = Number(item.total_siswa || 0);
          return sum + (guru > 0 ? siswa / guru : 0);
        }, 0) / clusterStats[a].count;
        
        const avgRatioB = clusterStats[b].items.reduce((sum: number, item: any) => {
          const guru = Number(item.total_guru || 0);
          const siswa = Number(item.total_siswa || 0);
          return sum + (guru > 0 ? siswa / guru : 0);
        }, 0) / clusterStats[b].count;
        
        return avgRatioA - avgRatioB;
      })
      .map((clusterKey, index) => {
        const stats = clusterStats[clusterKey];
        const average = stats.sum / stats.count;
        
        // Hitung rata-rata rasio guru-siswa untuk cluster ini
        const avgRatioCluster = stats.items.reduce((sum: number, item: any) => {
          const guru = Number(item.total_guru || 0);
          const siswa = Number(item.total_siswa || 0);
          return sum + (guru > 0 ? siswa / guru : 0);
        }, 0) / stats.count;
        
        // Dynamic classification removed: let frontend decide labels/colors
        let category = '';
        let color = '';

        return {
          cluster: index + 1,
          category,
          color,
          count: stats.count,
          average: Number(average.toFixed(4)),
          averageFormatted: Number(average.toFixed(4)).toFixed(4),
          min: stats.min,
          minFormatted: Number(stats.min).toFixed(4),
          max: stats.max,
          maxFormatted: Number(stats.max).toFixed(4),
          averageRatioGuruSiswa: Number(avgRatioCluster.toFixed(2)),
          kecamatanList: stats.items.map((item: any, itemIdx: number) => {
            const jumlahGuru = Number(item.total_guru || 0);
            const jumlahSiswa = Number(item.total_siswa || 0);
            const rasioSiswaGuru = jumlahGuru > 0 ? Number((jumlahSiswa / jumlahGuru).toFixed(2)) : 0;
            
            return {
              id: item.id,
              nomor: item.nomor,
              kecamatan: item.kecamatan,
              skorPemerataan: item.skor_pemerataan,
              skorPemerataanFormatted: Number(item.skor_pemerataan).toFixed(4),
              jumlahPenduduk: item.jumlah_penduduk,
              jumlahPendudukFormatted: formatNumber(item.jumlah_penduduk),
              jumlahGuru,
              jumlahSiswa,
              jumlahRombel: Number(item.total_rombel || 0),
              rasioSiswaGuru,
              indeksGuru: item.indeksGuru,
              indeksSiswa: item.indeksSiswa,
              indeksRombel: item.indeksRombel,
              indeksRasio: item.indeksRasio,
              kondisiPemerataan: '',
              namaSekolahList: schoolMap.get(item.id) || []
            };
          })
        };
      });

    const allKecamatan = clusters.flatMap((cluster: any) => cluster.kecamatanList || []);

    // Hitung total dan rata-rata keseluruhan
    const totalPenduduk = validResults.reduce((sum: number, row: any) => sum + row.jumlah_penduduk, 0);
    const averageOverall = Number(
      (rowsWithScore.reduce((sum: number, row: any) => sum + row.skor_pemerataan, 0) / rowsWithScore.length).toFixed(4)
    );

    const rawData = validResults.map((row: any) => {
      const jumlahGuru = Number(row.total_guru || 0);
      const jumlahSiswa = Number(row.total_siswa || 0);
      const rasioSiswaGuru = jumlahGuru > 0 ? Number((jumlahSiswa / jumlahGuru).toFixed(2)) : 0;

      return {
        id: row.id,
        nomor: row.nomor,
        kecamatan: row.kecamatan,
        jumlahPenduduk: Number(row.jumlah_penduduk || 0),
        jumlahPendudukFormatted: formatNumber(row.jumlah_penduduk),
        jumlahGuru,
        jumlahSiswa,
        jumlahRombel: Number(row.total_rombel || 0),
        rasioSiswaGuru,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        tahun: parseInt(tahun),
        method: 'AHC',
        linkage,
        silhouetteCoefficient: Number(silhouette.toFixed(4)),
        copheneticCorrelationCoefficient: Number(copheneticCorrelationCoefficient.toFixed(4)),
        copheneticByLinkage,
        numberOfClusters,
        totalKecamatan: validResults.length,
        totalPenduduk,
        totalPendudukFormatted: formatNumber(totalPenduduk),
        averageOverall,
        averageOverallFormatted: averageOverall.toFixed(4),
        rawData,
        clusters,
        centroids: clusters.map((c: any) => ({
          value: c.average,
          valueFormatted: c.averageFormatted
        })),
        linkageMatrix,
        silhouetteByK
      }
    });
  } catch (error) {
    console.error('Error AHC clustering pemerataan guru:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal melakukan clustering data' },
      { status: 500 }
    );
  }
}

