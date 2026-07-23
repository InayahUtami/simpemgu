"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Users, TrendingUp, BarChart3, Download, Info, MapPin } from "lucide-react";
import UserNavbar from "../../User/UserNavbar";
import dynamicImport from 'next/dynamic';
import * as XLSX from "xlsx";
import KecamatanTableBody from './KecamatanTableBody';

const Footer = dynamicImport(() => import('../../components/Footer'), { ssr: false });
const KelurahanMapVisualization = dynamicImport(() => import('./KelurahanMapVisualization'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '600px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      borderRadius: '16px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
          Memuat peta kelurahan...
        </div>
      </div>
    </div>
  )
});

// Hook untuk detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

const formalHeadStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 800,
  color: '#334155',
  borderBottom: '1px solid #dbe2ea',
  whiteSpace: 'nowrap'
};

const formalCellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '13px',
  color: '#0f172a',
  verticalAlign: 'top'
};

const formalMetricCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #dbe2ea',
  borderRadius: '10px',
  padding: '12px'
};

const formalMetricLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: '4px'
};

const formalMetricValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 800,
  color: '#0f172a'
};

const mobileMetricWrapStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 10px'
};

const mobileMetricLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  fontWeight: 700,
  marginBottom: '2px'
};

const mobileMetricValueStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#0f172a',
  fontWeight: 800
};

const idFormatter = new Intl.NumberFormat('id-ID');
const decimalFormatter = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type AHPVariableKey = 'penduduk' | 'guru' | 'siswa' | 'rombel' | 'rasio';

const AHP_VARIABLES: Array<{ key: AHPVariableKey; label: string }> = [
  { key: 'penduduk', label: 'Penduduk' },
  { key: 'guru', label: 'Guru' },
  { key: 'siswa', label: 'Siswa' },
  { key: 'rombel', label: 'Rombel' },
  { key: 'rasio', label: 'Rasio' },
];

type AHPWeightConfig = Record<AHPVariableKey, number>;

const defaultAHPWeights: AHPWeightConfig = {
  penduduk: 1,
  guru: 1,
  siswa: 1,
  rombel: 1,
  rasio: 4,
};

function buildAHPMatrix(weights: AHPWeightConfig) {
  const keys = AHP_VARIABLES.map((item) => item.key);
  const safeWeights = keys.reduce((acc, key) => {
    const value = Number(weights[key]);
    acc[key] = Math.max(Number.isFinite(value) ? value : 1, 0.1);
    return acc;
  }, {} as AHPWeightConfig);

  return keys.map((rowKey) =>
    keys.map((colKey) => {
      if (rowKey === colKey) return 1;
      return safeWeights[rowKey] / safeWeights[colKey];
    })
  );
}

interface ClusteringPendudukPageProps {
  showChrome?: boolean;
}

interface KecamatanData {
  id: number;
  nomor: number;
  kecamatan: string;
  skorPemerataan?: number;
  skorPemerataanFormatted?: string;
  jumlahPenduduk: number;
  jumlahPendudukFormatted: string;
  jumlahGuru?: number;
  jumlahSiswa?: number;
  jumlahRombel?: number;
  rasioSiswaGuru?: number;
  kondisiPemerataan?: 'Kelebihan Guru' | 'Seimbang' | 'Kekurangan Guru';
  namaSekolahList?: string[];
}

interface ClusterData {
  cluster: number;
  category: string;
  color: string;
  count: number;
  average: number;
  averageFormatted: string;
  min: number;
  minFormatted: string;
  max: number;
  maxFormatted: string;
  kecamatanList: KecamatanData[];
}

interface ClusteringResult {
  tahun: number;
  method?: string;
  linkage?: 'single' | 'complete' | 'average';
  silhouetteCoefficient?: number;
  silhouetteByK?: { k: number; score: number }[];
  copheneticCorrelationCoefficient?: number;
  copheneticByLinkage?: Record<'single' | 'complete' | 'average', number>;
  numberOfClusters: number;
  totalKecamatan: number;
  totalPenduduk: number;
  totalPendudukFormatted: string;
  averageOverall: number;
  averageOverallFormatted: string;
  rawData?: KecamatanData[];
  clusters: ClusterData[];
  centroids: { value: number; valueFormatted: string }[];
  linkageMatrix?: number[][];
}

function getClusterMeaning(category: string, totalClusters?: number) {
  // Return concise profiling text matching requested table
  if (!category) return '';

  if (category.includes('Relatif Merata')) {
    return 'Wilayah dengan kondisi demografi dan layanan pendidikan yang relatif seimbang.';
  }

  if (category.includes('Cukup Merata')) {
    return 'Wilayah dengan kondisi layanan pendidikan yang cukup seimbang namun masih menunjukkan variasi pada kebutuhan guru dan rombel.';
  }

  if (category.includes('Belum Merata')) {
    return 'Wilayah dengan tekanan kebutuhan layanan pendidikan yang lebih tinggi dibanding cluster lainnya.';
  }

  return 'Ringkasan profil cluster tidak tersedia.';
}

function getClusterCategoryStyle(category: string, clusterNumber?: number, totalClusters?: number) {
  // Dynamic labels based on total number of clusters
  const getLabelForClusters = (clusterNum: number, total: number) => {
    if (total === 2) {
      return clusterNum === 1 ? 'Distribusi Guru Relatif Merata' : 'Distribusi Guru Belum Merata';
    } else if (total === 3) {
      if (clusterNum === 1) return 'Distribusi Guru Relatif Merata';
      if (clusterNum === 2) return 'Distribusi Guru Cukup Merata';
      if (clusterNum === 3) return 'Distribusi Guru Belum Merata';
    }
    return `Cluster ${clusterNum}`;
  };

  const label = getLabelForClusters(clusterNumber || 1, totalClusters || 3);

  // Color coding based on cluster type - darker, more solid colors
  const getColorScheme = (label: string) => {
    if (label.includes('Relatif Merata')) {
      return { color: '#ffffff', bg: '#15803d', border: '#15803d' }; // Dark green
    } else if (label.includes('Cukup Merata')) {
      return { color: '#ffffff', bg: '#1e3a8a', border: '#1e3a8a' }; // Dark blue
    } else if (label.includes('Belum Merata')) {
      return { color: '#ffffff', bg: '#dc2626', border: '#dc2626' }; // Dark red
    }
    return { color: '#ffffff', bg: '#475569', border: '#475569' }; // Default dark gray
  };

  const colorScheme = getColorScheme(label);

  return {
    label,
    ...colorScheme,
  };
}

function ClusteringPendudukUserPage({ showChrome = true }: ClusteringPendudukPageProps) {

  const pathname = usePathname();
  const isAdmin = pathname?.includes('/admin/') || false;

  const [mountKey, setMountKey] = useState(1);
  const [loading, setLoading] = useState(true);
  const [clusteringData, setClusteringData] = useState<ClusteringResult | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [numberOfClusters, setNumberOfClusters] = useState<number>(2);
  const [linkageMethod, setLinkageMethod] = useState<'single' | 'complete' | 'average'>('average');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const isMobile = useIsMobile();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isYearsLoading, setIsYearsLoading] = useState(false);
  const [ahpWeights, setAHPWeights] = useState<AHPWeightConfig>(defaultAHPWeights);
  const [ahpDraftWeights, setAHPDraftWeights] = useState<AHPWeightConfig>(defaultAHPWeights);
  const [ahpSaveLoading, setAHPSaveLoading] = useState(false);
  const [ahpSaveMessage, setAHPSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load persisted AHP config from server on mount
  useEffect(() => {
    let mounted = true;

    const loadAHPConfig = async () => {
      try {
        const res = await fetch('/api/admin/ahp-config');
        if (!res.ok) return;
        const payload = await res.json();
        if (!mounted) return;

        if (payload && payload.success && payload.data) {
          const d = payload.data;
          const loaded: AHPWeightConfig = {
            penduduk: Number(d.penduduk),
            guru: Number(d.guru),
            siswa: Number(d.siswa),
            rombel: Number(d.rombel),
            rasio: Number(d.rasio),
          };
          setAHPWeights(loaded);
          setAHPDraftWeights(loaded);
        }
      } catch (err) {
        // ignore - keep defaults
        console.error('Failed to load AHP config', err);
      }
    };

    loadAHPConfig();

    return () => { mounted = false; };
  }, []);

  const updateAHPWeight = (key: AHPVariableKey, value: number) => {
    setAHPDraftWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveAHPConfig = async () => {
    setAHPSaveLoading(true);
    setAHPSaveMessage(null);
    
    try {
      const response = await fetch('/api/admin/ahp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            weights: ahpDraftWeights,
          }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan konfigurasi AHP');
      }

      setAHPWeights(ahpDraftWeights);
      setAHPSaveMessage({ type: 'success', text: '✓ Pembobotan AHP berhasil disimpan!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setAHPSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error saving AHP config:', err);
      setAHPSaveMessage({ 
        type: 'error', 
        text: `✗ Gagal menyimpan: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
    } finally {
      setAHPSaveLoading(false);
    }
  };

  const resetAHPConfig = () => {
    setAHPDraftWeights(defaultAHPWeights);
    setAHPWeights(defaultAHPWeights);
    
    setAHPSaveMessage(null);
  };

  const [mapControls, setMapControls] = useState({
    showPopup: true,
    showJumlahPenduduk: true,
    showClustering: true,
    showOutlineOnly: false,
  });

  const toggleControl = (key: keyof typeof mapControls) => {
    setMapControls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const orderedClusters = useMemo(
    () => clusteringData?.clusters.slice().sort((a, b) => a.cluster - b.cluster) ?? [],
    [clusteringData]
  );

  const clusterProfiling = useMemo(() => {
    if (!clusteringData?.clusters?.length) return [];

    return clusteringData.clusters.map((cluster) => {
      const members = cluster.kecamatanList || [];
      const count = members.length;
      const totals = members.reduce((acc, kec) => {
        const penduduk = Number(kec.jumlahPenduduk || 0);
        const guru = Number(kec.jumlahGuru || 0);
        const siswa = Number(kec.jumlahSiswa || 0);
        const rombel = Number(kec.jumlahRombel || 0);
        const rasio = Number(kec.rasioSiswaGuru ?? 0);
        return {
          penduduk: acc.penduduk + penduduk,
          guru: acc.guru + guru,
          siswa: acc.siswa + siswa,
          rombel: acc.rombel + rombel,
          rasio: acc.rasio + rasio,
        };
      }, { penduduk: 0, guru: 0, siswa: 0, rombel: 0, rasio: 0 });

      const avgPenduduk = count > 0 ? totals.penduduk / count : 0;
      const avgGuru = count > 0 ? totals.guru / count : 0;
      const avgSiswa = count > 0 ? totals.siswa / count : 0;
      const avgRombel = count > 0 ? totals.rombel / count : 0;
      const avgRasio = count > 0 ? totals.rasio / count : 0;

      const statusRasio = avgRasio <= 20
        ? 'Distribusi Guru Relatif Merata'
        : 'Distribusi Guru Belum Merata';

      const profile = avgRasio <= 20
        ? 'Baik'
        : 'Perlu Perbaikan';

      const profileSummary = cluster.category.includes('Relatif Merata')
        ? 'Wilayah dengan kondisi demografi dan layanan pendidikan yang relatif seimbang.'
        : cluster.category.includes('Belum Merata')
          ? 'Wilayah dengan tekanan kebutuhan layanan pendidikan yang lebih tinggi dibanding cluster lainnya.'
          : 'Wilayah dengan kondisi layanan pendidikan yang cukup seimbang namun masih menunjukkan variasi pada kebutuhan guru dan rombel.';

      return {
        clusterId: cluster.cluster,
        label: cluster.category || `Cluster ${cluster.cluster}`,
        color: cluster.color,
        count,
        avgPenduduk,
        avgGuru,
        avgSiswa,
        avgRombel,
        avgRasio,
        statusRasio,
        profile,
        profileSummary,
      };
    });
  }, [clusteringData]);

  // Fetch available years
  useEffect(() => {
    if (mountKey === 0) return;

    setIsYearsLoading(true);
    const timestamp = new Date().getTime();
    const endpoint = `/api/data/jumlah-penduduk?t=${timestamp}`;

    fetch(endpoint, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(res => res.json())
      .then(json => {
        if (json && json.data) {
          const years = new Set<number>();
          json.data.forEach((item: Record<string, unknown>) => {
            Object.keys(item.dataByYear as Record<string, unknown>).forEach(year => {
              years.add(parseInt(year));
            });
          });
          const sortedYears = Array.from(years).sort((a, b) => b - a);
          setAvailableYears(sortedYears);

          if (sortedYears.length > 0) {
            setSelectedYear(sortedYears[0]);
          }
        }
      })
      .catch(err => console.error('[Years] Error fetching years:', err))
      .finally(() => setIsYearsLoading(false));
  }, [mountKey]);

  // Fetch clustering data
  useEffect(() => {
    if (mountKey === 0) return;
    if (!selectedYear || !numberOfClusters) {
      setLoading(false);
      return;
    }

    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const timestamp = new Date().getTime();
    const clusteringUrl = `/api/data/clustering/jumlah-penduduk?tahun=${selectedYear}&clusters=${numberOfClusters}&linkage=${linkageMethod}&t=${timestamp}`;

    fetch(clusteringUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const totalClusters = result.data?.numberOfClusters || numberOfClusters;
          
          const normalizedData: ClusteringResult = {
            ...result.data,
            clusters: (result.data?.clusters || []).map((cluster: ClusterData) => {
              // Apply new descriptive category labels based on cluster number and total clusters
              const categoryStyle = getClusterCategoryStyle('', cluster.cluster, totalClusters);

              return {
                ...cluster,
                category: categoryStyle.label, // Use new descriptive label
                // Preserve backend-provided color when available; otherwise fall back to our scheme
                color: cluster.color || categoryStyle.bg,
              };
            }),
          };

          setClusteringData(normalizedData);
          setErrorMessage(null);
        } else {
          const errorText = String(result.error || '');
          const detailsText = String(result.details || '');
          const isIncompleteDataError = errorText.toLowerCase().includes('tidak ada data lengkap multivariabel');

          if (isIncompleteDataError) {
            const currentIndex = availableYears.indexOf(selectedYear);
            const fallbackYear = currentIndex >= 0 ? availableYears[currentIndex + 1] : undefined;

            if (fallbackYear) {
              setErrorMessage(`Data tahun ${selectedYear} belum lengkap. Mengalihkan ke tahun ${fallbackYear}...`);
              setSelectedYear(fallbackYear);
              return;
            }

            setErrorMessage(
              `Tidak ada tahun dengan data lengkap multivariabel pada sumber data ini. ${detailsText}`.trim()
            );
            setClusteringData(null);
            return;
          }

          setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
          setClusteringData(null);
        }
      })
      .catch(err => {
        console.error('[Clustering] Fetch error:', err);
        setErrorMessage(`Error fetching data: ${err.message || String(err)}`);
        setClusteringData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, numberOfClusters, linkageMethod, mountKey, availableYears]);

  // State untuk show/hide rumus dan perhitungan
  const [showFormula, setShowFormula] = useState(false);

  // State untuk expandable SD rows
  const [expandedKecamatan, setExpandedKecamatan] = useState<Set<number>>(new Set());
  const [sekolahDataCache, setSekolahDataCache] = useState<Map<number, any>>(new Map());
  const [loadingSekolah, setLoadingSekolah] = useState<Set<number>>(new Set());

  // Function untuk fetch SD data per kecamatan
  const fetchSekolahData = async (kecamatanId: number) => {
    if (sekolahDataCache.has(kecamatanId) || !selectedYear) return;

    setLoadingSekolah(prev => new Set([...prev, kecamatanId]));
    try {
      const res = await fetch(`/api/data/sekolah-per-kecamatan?kecamatan_id=${kecamatanId}&tahun=${selectedYear}`, {
        cache: 'no-store'
      });
      const result = await res.json();
      if (result.success) {
        setSekolahDataCache(prev => new Map([...prev, [kecamatanId, result.data]]));
      } else {
        setSekolahDataCache(prev => new Map([
          ...prev,
          [kecamatanId, { sekolahList: [], error: result.error || 'Gagal mengambil data sekolah' }]
        ]));
      }
    } catch (err) {
      console.error('Error fetching sekolah data:', err);
      setSekolahDataCache(prev => new Map([
        ...prev,
        [kecamatanId, { sekolahList: [], error: 'Terjadi gangguan saat mengambil data sekolah' }]
      ]));
    } finally {
      setLoadingSekolah(prev => {
        const next = new Set(prev);
        next.delete(kecamatanId);
        return next;
      });
    }
  };

  // Toggle expand kecamatan
  const toggleExpandKecamatan = (kecamatanId: number) => {
    const newExpanded = new Set(expandedKecamatan);
    if (newExpanded.has(kecamatanId)) {
      newExpanded.delete(kecamatanId);
    } else {
      newExpanded.add(kecamatanId);
      fetchSekolahData(kecamatanId);
    }
    setExpandedKecamatan(newExpanded);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!clusteringData?.rawData?.length) return;

    const exportData: any[][] = [];
    
    exportData.push(['DATA AWAL MENTAH (SEBELUM CLUSTERING)']);
    exportData.push([`Tahun: ${clusteringData.tahun}`]);
    exportData.push([`Total Kecamatan: ${clusteringData.rawData.length}`]);
    exportData.push([]);
    exportData.push(['No', 'Kecamatan', 'Penduduk', 'Guru', 'Siswa', 'Rombel', 'Rasio (S/G)']);

    clusteringData.rawData.forEach((row) => {
      exportData.push([
        row.nomor,
        row.kecamatan,
        row.jumlahPendudukFormatted ?? row.jumlahPenduduk.toLocaleString('id-ID'),
        row.jumlahGuru ?? 0,
        row.jumlahSiswa ?? 0,
        row.jumlahRombel ?? 0,
        row.rasioSiswaGuru?.toFixed(2) ?? '0.00'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Awal");
    XLSX.writeFile(wb, `data_awal_mentah_${clusteringData.tahun}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!clusteringData?.rawData?.length) return;

    const headers = ['No', 'Kecamatan', 'Penduduk', 'Guru', 'Siswa', 'Rombel', 'Rasio (S/G)'];
    const rows = clusteringData.rawData.map((row) => [
      row.nomor,
      row.kecamatan,
      row.jumlahPendudukFormatted ?? row.jumlahPenduduk.toLocaleString('id-ID'),
      row.jumlahGuru ?? 0,
      row.jumlahSiswa ?? 0,
      row.jumlahRombel ?? 0,
      row.rasioSiswaGuru?.toFixed(2) ?? '0.00'
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_awal_mentah_${clusteringData?.tahun ?? 'semua'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const manualCalc = useMemo(() => {
    if (!clusteringData) return null;

    // Order kecamatan by their skor_pemerataan (average) so dendrogram leaves
    // reflect score ordering instead of alphabetical order
    const flattenedKecamatan = clusteringData.clusters
      .flatMap((cluster) => cluster.kecamatanList.map((kec) => ({ kec, clusterId: cluster.cluster })))
      .sort((a, b) => {
        const scoreA = Number(a.kec.skorPemerataan ?? 0);
        const scoreB = Number(b.kec.skorPemerataan ?? 0);
        if (scoreA !== scoreB) return scoreA - scoreB; // ascending order; swap sign for descending
        // fallback to nomor then name for tie-break
        const nomorA = Number(a.kec.nomor || 0);
        const nomorB = Number(b.kec.nomor || 0);
        if (nomorA !== nomorB) return nomorA - nomorB;
        return String(a.kec.kecamatan).localeCompare(String(b.kec.kecamatan));
      });

    const sample = flattenedKecamatan
      .map(({ kec, clusterId }) => {
        const guru = Number(kec.jumlahGuru || 0);
        const siswa = Number(kec.jumlahSiswa || 0);
        const rasio = guru > 0 ? siswa / guru : 0;
        return {
          nama: kec.kecamatan,
          nomor: Number(kec.nomor || 0),
          clusterId,
          penduduk: Number(kec.jumlahPenduduk || 0),
          guru,
          siswa,
          rombel: Number(kec.jumlahRombel || 0),
          rasio,
        };
      });

    if (sample.length < 2) return null;

    const columns = {
      penduduk: sample.map((d) => d.penduduk),
      guru: sample.map((d) => d.guru),
      siswa: sample.map((d) => d.siswa),
      rombel: sample.map((d) => d.rombel),
      rasio: sample.map((d) => d.rasio),
    };

    const mins = {
      penduduk: Math.min(...columns.penduduk),
      guru: Math.min(...columns.guru),
      siswa: Math.min(...columns.siswa),
      rombel: Math.min(...columns.rombel),
      rasio: Math.min(...columns.rasio),
    };

    const maxs = {
      penduduk: Math.max(...columns.penduduk),
      guru: Math.max(...columns.guru),
      siswa: Math.max(...columns.siswa),
      rombel: Math.max(...columns.rombel),
      rasio: Math.max(...columns.rasio),
    };

    const ahpMatrix = buildAHPMatrix(ahpWeights);

    const ahpColSum = ahpMatrix[0].map((_, colIdx) =>
      ahpMatrix.reduce((sum, row) => sum + row[colIdx], 0)
    );

    const ahpNorm = ahpMatrix.map((row) => row.map((value, colIdx) => value / ahpColSum[colIdx]));
    const ahpWeightsArray = ahpNorm.map((row) => row.reduce((sum, value) => sum + value, 0) / row.length);

    const ahpEigen = ahpMatrix.map((row) =>
      row.reduce((sum, value, idx) => sum + value * ahpWeightsArray[idx], 0)
    );

    const lambdaMax = ahpEigen.reduce((sum, value, idx) => sum + value / ahpWeightsArray[idx], 0) / ahpWeightsArray.length;
    const matrixSize = ahpWeightsArray.length;
    const RI_VALUES: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0.58,
      4: 0.90,
      5: 1.12,
      6: 1.24,
      7: 1.32,
      8: 1.41,
      9: 1.45,
      10: 1.49,
    };
    const CI = matrixSize <= 1 ? 0 : (lambdaMax - matrixSize) / (matrixSize - 1);
    const RI = RI_VALUES[matrixSize] ?? 1.12;
    const CR = RI === 0 ? 0 : CI / RI;

    const ahpResult = {
      weights: {
        penduduk: ahpWeightsArray[0],
        guru: ahpWeightsArray[1],
        siswa: ahpWeightsArray[2],
        rombel: ahpWeightsArray[3],
        rasio: ahpWeightsArray[4]
      },
      CI,
      CR,
      lambdaMax
    };
    const AHP_WEIGHTS = ahpResult.weights;

    // Create normalized values (range 0-1)
    const normalizedRows = sample.map((d) => ({
      nama: d.nama,
      penduduk: (d.penduduk - mins.penduduk) / (maxs.penduduk - mins.penduduk),
      guru: (d.guru - mins.guru) / (maxs.guru - mins.guru),
      siswa: (d.siswa - mins.siswa) / (maxs.siswa - mins.siswa),
      rombel: (d.rombel - mins.rombel) / (maxs.rombel - mins.rombel),
      rasio: (d.rasio - mins.rasio) / (maxs.rasio - mins.rasio),
    }));

    // Create weighted indices z_v = r_v × w_v (indeks berbobot)
    const weightedRows = normalizedRows.map((row) => ({
      nama: row.nama,
      penduduk: row.penduduk * AHP_WEIGHTS.penduduk,
      guru: row.guru * AHP_WEIGHTS.guru,
      siswa: row.siswa * AHP_WEIGHTS.siswa,
      rombel: row.rombel * AHP_WEIGHTS.rombel,
      rasio: row.rasio * AHP_WEIGHTS.rasio,
    }));

    // Distance uses weighted indices z_v directly:
    // d(i,j) = sqrt(sum_v (z_v(i) - z_v(j))^2)
    const distance = (a: number, b: number) => {
      const da = weightedRows[a];
      const db = weightedRows[b];
      const diffPenduduk = da.penduduk - db.penduduk;
      const diffGuru = da.guru - db.guru;
      const diffSiswa = da.siswa - db.siswa;
      const diffRombel = da.rombel - db.rombel;
      const diffRasio = da.rasio - db.rasio;

      return Math.sqrt(
        diffPenduduk * diffPenduduk +
        diffGuru * diffGuru +
        diffSiswa * diffSiswa +
        diffRombel * diffRombel +
        diffRasio * diffRasio
      );
    };

    // Display pair details using weighted components per variable.
    const pairDetail = (a: number, b: number) => {
      const da = weightedRows[a];
      const db = weightedRows[b];
      const diffPenduduk = da.penduduk - db.penduduk;
      const diffGuru = da.guru - db.guru;
      const diffSiswa = da.siswa - db.siswa;
      const diffRombel = da.rombel - db.rombel;
      const diffRasio = da.rasio - db.rasio;
      const components = {
        penduduk: diffPenduduk * diffPenduduk,
        guru: diffGuru * diffGuru,
        siswa: diffSiswa * diffSiswa,
        rombel: diffRombel * diffRombel,
        rasio: diffRasio * diffRasio,
      };
      const sumSq =
        components.penduduk +
        components.guru +
        components.siswa +
        components.rombel +
        components.rasio;
      return {
        a,
        b,
        nameA: sample[a].nama,
        nameB: sample[b].nama,
        components,
        sumSq,
        distance: Math.sqrt(sumSq),
      };
    };

    const pairDetails: Array<ReturnType<typeof pairDetail>> = [];
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        pairDetails.push(pairDetail(i, j));
      }
    }
    const pairs = pairDetails
      .map((p) => ({ i: p.a, j: p.b, d: p.distance }))
      .sort((a, b) => a.d - b.d);

    const distanceMatrix = sample.map((_, i) =>
      sample.map((__, j) => (i === j ? 0 : distance(i, j)))
    );

    const firstMerge = pairs[0];
    const remainingIndices = sample
      .map((_, idx) => idx)
      .filter((idx) => idx !== firstMerge.i && idx !== firstMerge.j);

    const distToRemaining = remainingIndices.map((idx) => {
      const toI = distance(firstMerge.i, idx);
      const toJ = distance(firstMerge.j, idx);
      const mergedVector = {
        penduduk: (normalizedRows[firstMerge.i].penduduk + normalizedRows[firstMerge.j].penduduk) / 2,
        guru: (normalizedRows[firstMerge.i].guru + normalizedRows[firstMerge.j].guru) / 2,
        siswa: (normalizedRows[firstMerge.i].siswa + normalizedRows[firstMerge.j].siswa) / 2,
        rombel: (normalizedRows[firstMerge.i].rombel + normalizedRows[firstMerge.j].rombel) / 2,
        rasio: (normalizedRows[firstMerge.i].rasio + normalizedRows[firstMerge.j].rasio) / 2,
      };
      const singletonVector = normalizedRows[idx];
      const diffPenduduk = mergedVector.penduduk - singletonVector.penduduk;
      const diffGuru = mergedVector.guru - singletonVector.guru;
      const diffSiswa = mergedVector.siswa - singletonVector.siswa;
      const diffRombel = mergedVector.rombel - singletonVector.rombel;
      const diffRasio = mergedVector.rasio - singletonVector.rasio;

      return {
        idx,
        toI,
        toJ,
        single: Math.min(toI, toJ),
        complete: Math.max(toI, toJ),
        average: (toI + toJ) / 2,
      };
    });

    const nearestBySingle = distToRemaining.length > 0
      ? distToRemaining.reduce((best, cur) => (cur.single < best.single ? cur : best), distToRemaining[0])
      : null;
    const nearestByComplete = distToRemaining.length > 0
      ? distToRemaining.reduce((best, cur) => (cur.complete < best.complete ? cur : best), distToRemaining[0])
      : null;
    const nearestByAverage = distToRemaining.length > 0
      ? distToRemaining.reduce((best, cur) => (cur.average < best.average ? cur : best), distToRemaining[0])
      : null;

    const clusterToIndices = new Map<number, number[]>();
    sample.forEach((row, idx) => {
      const arr = clusterToIndices.get(row.clusterId) ?? [];
      arr.push(idx);
      clusterToIndices.set(row.clusterId, arr);
    });

    const silhouetteRows = sample.map((row, idx) => {
      const ownCluster = row.clusterId;
      const ownMembers = clusterToIndices.get(ownCluster) ?? [];
      const ownNeighbors = ownMembers.filter((memberIdx) => memberIdx !== idx);

      let b = Infinity;
      clusterToIndices.forEach((members, clusterId) => {
        if (clusterId === ownCluster || members.length === 0) return;
        const avgDist = members.reduce((sum, memberIdx) => sum + distance(idx, memberIdx), 0) / members.length;
        if (avgDist < b) b = avgDist;
      });

      const safeB = Number.isFinite(b) ? b : 0;

      if (ownMembers.length <= 1) {
        return {
          nama: row.nama,
          clusterId: row.clusterId,
          a: null,
          b: safeB,
          s: 0,
          isSingleton: true,
        };
      }

      const a = ownNeighbors.length > 0
        ? ownNeighbors.reduce((sum, memberIdx) => sum + distance(idx, memberIdx), 0) / ownNeighbors.length
        : 0;
      const denom = Math.max(a, safeB);
      const s = denom > 0 ? (safeB - a) / denom : 0;

      return {
        nama: row.nama,
        clusterId: row.clusterId,
        a,
        b: safeB,
        s,
        isSingleton: false,
      };
    });

    const silhouetteAvg = silhouetteRows.length > 0
      ? silhouetteRows.reduce((sum, row) => sum + row.s, 0) / silhouetteRows.length
      : 0;
    const silhouetteMin = silhouetteRows.length > 0
      ? Math.min(...silhouetteRows.map((row) => row.s))
      : 0;
    const silhouetteMax = silhouetteRows.length > 0
      ? Math.max(...silhouetteRows.map((row) => row.s))
      : 0;
    const targetK = Math.max(1, Math.min(numberOfClusters, sample.length));

    return {
      sample,
      mins,
      maxs,
      normalizedRows,
      ahpResult,
      distanceMatrix,
      pairDetails,
      firstMerge,
      remainingIndices,
      distToRemaining,
      nearestBySingle,
      nearestByComplete,
      nearestByAverage,
      targetK,
      silhouette: { silhouetteAvg, silhouetteMin, silhouetteMax, rows: silhouetteRows },
    };
  }, [clusteringData, numberOfClusters, ahpWeights]);

  const dendrogramData = useMemo(() => {
    if (!manualCalc) return null;

    type ClusterNode = {
      id: string;
      members: number[];
      height: number;
      left?: ClusterNode;
      right?: ClusterNode;
      y?: number;
      label?: string;
    };

    const distanceMatrix = manualCalc.distanceMatrix;
    const sample = manualCalc.sample;
    const method = linkageMethod;
    const targetK = manualCalc.targetK;

    const clusterColorById = new Map<number, string>();
    clusteringData?.clusters.forEach((cluster) => {
      clusterColorById.set(cluster.cluster, cluster.color);
    });

    // Map leaf index -> clusterId for direct coloring
    const leafClusterIdByIdx = new Map<number, number>();
    sample.forEach((s, idx) => {
      leafClusterIdByIdx.set(idx, Number(s.clusterId));
    });

    const toVector = (idx: number) => {
      const row = manualCalc.normalizedRows[idx];
      return [row.penduduk, row.guru, row.siswa, row.rombel, row.rasio];
    };

    const clusterDistance = (a: ClusterNode, b: ClusterNode) => {
      const values: number[] = [];
      a.members.forEach((i) => {
        b.members.forEach((j) => {
          values.push(distanceMatrix[i][j]);
        });
      });

      if (values.length === 0) return 0;
      if (method === 'single') return Math.min(...values);
      if (method === 'complete') return Math.max(...values);
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    };

    let clusters: ClusterNode[] = sample.map((row, idx) => ({
      id: `leaf-${idx}`,
      members: [idx],
      height: 0,
      label: row.nama,
    }));

    const merges: Array<{ left: ClusterNode; right: ClusterNode; height: number; node: ClusterNode }> = [];
    let mergeCounter = 0;

    while (clusters.length > 1) {
      let bestI = 0;
      let bestJ = 1;
      let bestDist = clusterDistance(clusters[0], clusters[1]);

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const d = clusterDistance(clusters[i], clusters[j]);
          if (d < bestDist) {
            bestDist = d;
            bestI = i;
            bestJ = j;
          }
        }
      }

      const left = clusters[bestI];
      const right = clusters[bestJ];
      const node: ClusterNode = {
        id: `merge-${mergeCounter}`,
        members: [...left.members, ...right.members],
        height: bestDist,
        left,
        right,
      };

      merges.push({ left, right, height: bestDist, node });
      mergeCounter += 1;

      clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
      clusters.push(node);
    }

    const root = clusters[0];
    const leafGap = isMobile ? 26 : 30;
    const topPadding = 24;
    const labelWidth = isMobile ? 180 : 240;
    const chartWidth = isMobile ? 520 : 760;
    const maxHeight = Math.max(...merges.map((m) => m.height), 1);

    const yByLeafIndex = new Map<number, number>();
    sample.forEach((_, idx) => {
      yByLeafIndex.set(idx, topPadding + idx * leafGap);
    });

    const assignY = (node: ClusterNode): number => {
      if (!node.left || !node.right) {
        const leafIdx = node.members[0];
        const y = yByLeafIndex.get(leafIdx) ?? topPadding;
        node.y = y;
        return y;
      }
      const yLeft = assignY(node.left);
      const yRight = assignY(node.right);
      const y = (yLeft + yRight) / 2;
      node.y = y;
      return y;
    };

    const xForHeight = (height: number) => labelWidth + (height / maxHeight) * chartWidth;
    assignY(root);

    type Segment = { x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth?: number };

    const cutMergeCount = Math.max(0, sample.length - targetK);
    const cutHeight = cutMergeCount < merges.length ? merges[cutMergeCount].height : maxHeight;

    let activeAtCut: ClusterNode[] = sample.map((_, idx) => ({
      id: `leaf-${idx}`,
      members: [idx],
      height: 0,
      label: sample[idx].nama,
    }));

    for (let idx = 0; idx < cutMergeCount; idx++) {
      const merge = merges[idx];
      activeAtCut = activeAtCut.filter((c) => c.id !== merge.left.id && c.id !== merge.right.id);
      activeAtCut.push(merge.node);
    }

    const finalGroups = activeAtCut.map((node) => node.members);
    const leafGroupIndex = new Map<number, number>();
    finalGroups.forEach((group, groupIdx) => {
      group.forEach((leafIdx) => leafGroupIndex.set(leafIdx, groupIdx));
    });

    const fallbackPalette = ['#15803d', '#1e3a8a', '#dc2626', '#a16207', '#0f766e', '#6d28d9'];
    // Build cluster-color mapping for k=3 based on cluster average values
    const clusterIdToColorForK3 = new Map<number, string>();
    if (targetK === 3 && clusteringData?.clusters) {
      const clusterAverages = (clusteringData.clusters || []).map((c: any) => ({ id: c.cluster, avg: Number(c.average ?? c.averageFormatted ?? 0) }));
      // sort ascending: lowest avg -> index 0 -> green; middle -> blue; highest -> red
      clusterAverages.sort((a: any, b: any) => a.avg - b.avg);
      const k3colors = ['#15803d', '#1e3a8a', '#dc2626'];
      clusterAverages.forEach((c: any, idx: number) => {
        clusterIdToColorForK3.set(c.id, k3colors[idx] ?? fallbackPalette[idx % fallbackPalette.length]);
      });
    }

    const groupColor = new Map<number, string>();
    finalGroups.forEach((group, groupIdx) => {
      const clusterCounts = new Map<number, number>();
      group.forEach((leafIdx) => {
        const clusterId = sample[leafIdx]?.clusterId;
        if (typeof clusterId === 'number') {
          clusterCounts.set(clusterId, (clusterCounts.get(clusterId) ?? 0) + 1);
        }
      });

      let dominantClusterId: number | undefined;
      let dominantCount = -1;
      clusterCounts.forEach((count, clusterId) => {
        if (count > dominantCount) {
          dominantCount = count;
          dominantClusterId = clusterId;
        }
      });

      if (targetK === 3 && typeof dominantClusterId === 'number') {
        // For k=3 we want a deterministic green/blue/red mapping based on cluster averages.
        // Use our ordered k3 colors first; fall back to backend color only if ordered color missing.
        const orderedColor = clusterIdToColorForK3.get(dominantClusterId);
        const backendColor = clusterColorById.get(dominantClusterId);
        groupColor.set(groupIdx, orderedColor ?? backendColor ?? fallbackPalette[groupIdx % fallbackPalette.length]);
        return;
      }

      const clusterColor = typeof dominantClusterId === 'number' ? clusterColorById.get(dominantClusterId) : undefined;
      groupColor.set(groupIdx, clusterColor ?? fallbackPalette[groupIdx % fallbackPalette.length]);
    });

    const nodeColor = (node: ClusterNode) => {
      // For k=3 we color nodes by the most common clusterId among its leaves.
      const counts = new Map<number, number>();
      node.members.forEach((leafIdx) => {
        const clusterId = leafClusterIdByIdx.get(leafIdx);
        if (typeof clusterId === 'number') counts.set(clusterId, (counts.get(clusterId) ?? 0) + 1);
      });
      if (counts.size === 0) return '#0f766e';
      let majorityCluster = -1;
      let maxCount = -1;
      counts.forEach((c, clusterId) => {
        if (c > maxCount) {
          maxCount = c;
          majorityCluster = clusterId;
        }
      });

      // Prefer ordered k=3 palette when available, otherwise backend color, then fallback
      const ordered = clusterIdToColorForK3.get(majorityCluster);
      const backend = clusterColorById.get(majorityCluster);
      return ordered ?? backend ?? '#0f766e';
    };

    const segments: Segment[] = [];

    const buildSegments = (node: ClusterNode) => {
      if (!node.left || !node.right || node.y === undefined) return;

      const xNode = xForHeight(node.height);
      const xLeft = xForHeight(node.left.height);
      const xRight = xForHeight(node.right.height);
      const yLeft = node.left.y ?? 0;
      const yRight = node.right.y ?? 0;

      // Use majority-group color for segments (avoid forcing red for mixed nodes)
      const leftColor = nodeColor(node.left);
      const rightColor = nodeColor(node.right);
      const verticalColor = nodeColor(node);

      segments.push({ x1: xLeft, y1: yLeft, x2: xNode, y2: yLeft, stroke: leftColor, strokeWidth: 2 });
      segments.push({ x1: xRight, y1: yRight, x2: xNode, y2: yRight, stroke: rightColor, strokeWidth: 2 });
      segments.push({ x1: xNode, y1: yLeft, x2: xNode, y2: yRight, stroke: verticalColor, strokeWidth: 2 });

      buildSegments(node.left);
      buildSegments(node.right);
    };

    buildSegments(root);

    const leafLabelColor = sample.map((_, idx) => {
      const clusterId = leafClusterIdByIdx.get(idx);
      if (typeof clusterId === 'number') {
        return clusterIdToColorForK3.get(clusterId) ?? clusterColorById.get(clusterId) ?? '#334155';
      }
      return '#334155';
    });

    return {
      sample,
      root,
      segments,
      maxHeight,
      cutHeight,
      cutX: xForHeight(cutHeight),
      targetK,
      leafLabelColor,
      labelWidth,
      width: labelWidth + chartWidth + 40,
      height: topPadding + sample.length * leafGap + 20,
      xForHeight,
      method,
      methodLabel: method,
      methodDescription: 'Single, complete, dan average menggunakan jarak antar cluster sesuai definisi linkage masing-masing.',
    };
  }, [manualCalc, linkageMethod, isMobile, clusteringData]);

  const silhouetteInterpretation = useMemo(() => {
    const score = clusteringData?.silhouetteCoefficient;
    if (typeof score !== 'number') {
      return {
        label: 'Belum tersedia',
        note: 'Nilai silhouette belum tersedia pada respons data saat ini.',
        color: '#64748b',
        bg: '#f1f5f9',
        border: '#cbd5e1',
      };
    }

    if (score > 0.7) {
      return {
        label: 'Kuat',
        note: 'Struktur cluster kuat dan pemisahan antar cluster jelas.',
        color: '#166534',
        bg: '#dcfce7',
        border: '#86efac',
      };
    }

    if (score > 0.5) {
      return {
        label: 'Sedang',
        note: 'Struktur cluster sedang, pemisahan antar cluster cukup terlihat.',
        color: '#92400e',
        bg: '#fef3c7',
        border: '#fcd34d',
      };
    }

    if (score > 0.25) {
      return {
        label: 'Lemah',
        note: 'Struktur cluster lemah, overlap antar cluster masih cukup tinggi.',
        color: '#9a3412',
        bg: '#ffedd5',
        border: '#fdba74',
      };
    }

    return {
      label: 'Tidak ada',
      note: 'Struktur cluster tidak terbentuk dengan jelas berdasarkan silhouette coefficient.',
      color: '#991b1b',
      bg: '#fee2e2',
      border: '#fca5a5',
    };
  }, [clusteringData]);

  const getSilhouetteCategoryStyle = (value: number, isSingleton: boolean = false) => {
    if (value > 0.7) {
      return {
        label: 'Kuat',
        text: '#166534',
        bg: '#dcfce7',
        border: '#86efac',
      };
    }

    if (value > 0.5) {
      return {
        label: 'Sedang',
        text: '#92400e',
        bg: '#fef3c7',
        border: '#fcd34d',
      };
    }

    if (value > 0.25) {
      return {
        label: 'Lemah',
        text: '#9a3412',
        bg: '#ffedd5',
        border: '#fdba74',
      };
    }

    return {
      label: 'Tidak ada',
      text: '#991b1b',
      bg: '#fee2e2',
      border: '#fca5a5',
    };
  };

  const manualSilhouetteStyles = useMemo(() => {
    if (!manualCalc) return null;
    return {
      min: getSilhouetteCategoryStyle(manualCalc.silhouette.silhouetteMin),
      avg: getSilhouetteCategoryStyle(manualCalc.silhouette.silhouetteAvg),
      max: getSilhouetteCategoryStyle(manualCalc.silhouette.silhouetteMax),
    };
  }, [manualCalc]);

  const linkageMergeStages = useMemo(() => {
    if (!manualCalc) return [];

    type TempCluster = {
      id: string;
      members: number[];
      label: string;
    };

    const distanceMatrix = manualCalc.distanceMatrix;
    const sample = manualCalc.sample;
    const clusterDistance = (a: TempCluster, b: TempCluster) => {
      const values: number[] = [];
      a.members.forEach((i) => {
        b.members.forEach((j) => {
          values.push(distanceMatrix[i][j]);
        });
      });
      if (values.length === 0) return 0;

      if (linkageMethod === 'single') {
        return Math.min(...values);
      }

      if (linkageMethod === 'complete') {
        return Math.max(...values);
      }

      return values.reduce((sum, v) => sum + v, 0) / values.length;
    };

    const compactLabel = (members: number[]) => {
      const names = members.map((idx) => sample[idx].nama);
      if (names.length <= 2) return names.join(' + ');
      return `${names[0]} + ${names[1]} + ${names.length - 2} kecamatan lain`;
    };

    const describeCluster = (cluster: TempCluster) => {
      if (cluster.members.length === 1) return cluster.label;
      return `Cluster (${compactLabel(cluster.members)})`;
    };

    let clusters: TempCluster[] = sample.map((row, idx) => ({
      id: `leaf-${idx}`,
      members: [idx],
      label: row.nama,
    }));

    let mergeCounter = 0;
    let tahap = 1;
    const stages: Array<{
      tahap: number;
      cluster1: string;
      cluster2: string;
      jarak: number;
      jumlah: number;
      clusterBaru: string;
    }> = [];

    // Run full linkage sequence until one cluster remains (like scipy.linkage output)
    while (clusters.length > 1) {
      let bestI = 0;
      let bestJ = 1;
      let bestDist = clusterDistance(clusters[0], clusters[1]);

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const d = clusterDistance(clusters[i], clusters[j]);
          if (d < bestDist) {
            bestDist = d;
            bestI = i;
            bestJ = j;
          }
        }
      }

      const left = clusters[bestI];
      const right = clusters[bestJ];
      const mergedMembers = [...left.members, ...right.members];

      stages.push({
        tahap,
        cluster1: describeCluster(left),
        cluster2: describeCluster(right),
        jarak: bestDist,
        jumlah: mergedMembers.length,
        clusterBaru: compactLabel(mergedMembers),
      });

      const mergedCluster: TempCluster = {
        id: `avg-merge-${mergeCounter}`,
        members: mergedMembers,
        label: compactLabel(mergedMembers),
      };

      clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ);
      clusters.push(mergedCluster);
      mergeCounter += 1;
      tahap += 1;
    }

    return stages;
  }, [manualCalc]);

  const clusterSilhouetteStats = useMemo(() => {
    const stats = new Map<number, { avg: number; min: number; max: number; count: number }>();
    if (!manualCalc) return stats;

    const grouped = new Map<number, number[]>();
    manualCalc.silhouette.rows.forEach((row) => {
      const arr = grouped.get(row.clusterId) ?? [];
      arr.push(row.s);
      grouped.set(row.clusterId, arr);
    });

    grouped.forEach((scores, clusterId) => {
      if (scores.length === 0) return;
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      stats.set(clusterId, {
        avg,
        min: Math.min(...scores),
        max: Math.max(...scores),
        count: scores.length,
      });
    });

    return stats;
  }, [manualCalc]);

  const clusterAverageRatio = useMemo(() => {
    const stats = new Map<number, number>();
    if (orderedClusters.length === 0) return stats;

    orderedClusters.forEach((cluster) => {
      const ratios = (cluster.kecamatanList || [])
        .map((kec) => Number(kec.rasioSiswaGuru || 0))
        .filter((value) => Number.isFinite(value));

      const avgRatio = ratios.length > 0
        ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length
        : 0;

      stats.set(cluster.cluster, avgRatio);
    });

    return stats;
  }, [orderedClusters]);

  const clusterPresentation = useMemo(() => {
    const styles = new Map<number, { label: string; description: string; color: string; bg: string; border: string }>();
    if (orderedClusters.length === 0) return styles;

    orderedClusters.forEach((cluster) => {
      const categoryStyle = getClusterCategoryStyle(cluster.category);

      styles.set(cluster.cluster, {
        label: categoryStyle.label,
        description: getClusterMeaning(cluster.category),
        color: categoryStyle.color,
        bg: categoryStyle.bg,
        border: categoryStyle.border,
      });
    });

    return styles;
  }, [orderedClusters, clusterSilhouetteStats]);

  const clusterDisplayNumberById = useMemo(() => {
    const map = new Map<number, number>();

    orderedClusters.forEach((cluster) => {
      map.set(cluster.cluster, cluster.cluster);
    });

    return map;
  }, [orderedClusters, clusterSilhouetteStats]);

  const displayedClusters = useMemo(() => {
    return orderedClusters
      .slice()
      .sort((a, b) => {
        const displayA = clusterDisplayNumberById.get(a.cluster) ?? a.cluster;
        const displayB = clusterDisplayNumberById.get(b.cluster) ?? b.cluster;
        return displayA - displayB;
      });
  }, [orderedClusters, clusterDisplayNumberById]);

  const silhouetteByKecamatan = useMemo(() => {
    const map = new Map<string, number>();
    if (!manualCalc) return map;

    manualCalc.silhouette.rows.forEach((row) => {
      map.set(String(row.nama || '').trim().toLowerCase(), row.s);
    });

    return map;
  }, [manualCalc]);

  const variableClusterMatrix = useMemo(() => {
    const clusterIds = displayedClusters.map((cluster) => cluster.cluster);

    const averageFromTotal = (values: number[]) => {
      if (values.length === 0) return 0;
      const total = values.reduce((sum, value) => sum + value, 0);
      return total / values.length;
    };

    const rows = [
      {
        label: 'Jumlah Penduduk',
        decimals: 0,
        extractor: (kec: KecamatanData) => Number(kec.jumlahPenduduk || 0),
      },
      {
        label: 'Jumlah Guru',
        decimals: 0,
        extractor: (kec: KecamatanData) => Number(kec.jumlahGuru || 0),
      },
      {
        label: 'Jumlah Siswa',
        decimals: 0,
        extractor: (kec: KecamatanData) => Number(kec.jumlahSiswa || 0),
      },
      {
        label: 'Jumlah Rombel',
        decimals: 0,
        extractor: (kec: KecamatanData) => Number(kec.jumlahRombel || 0),
      },
      {
        label: 'Rasio Siswa/Guru',
        decimals: 2,
        extractor: (kec: KecamatanData) => Number(kec.rasioSiswaGuru || 0),
      },
    ].map((rowDef) => {
      const values = displayedClusters.map((cluster) => {
        const members = cluster.kecamatanList || [];
        if (rowDef.label === 'Rasio Siswa/Guru') {
          const totalGuru = members.reduce((sum, kec) => sum + Number(kec.jumlahGuru || 0), 0);
          const totalSiswa = members.reduce((sum, kec) => sum + Number(kec.jumlahSiswa || 0), 0);
          return totalGuru > 0 ? totalSiswa / totalGuru : 0;
        }
        return averageFromTotal(members.map((kec) => rowDef.extractor(kec)));
      });

      if (values.length === 0) {
        return {
          label: rowDef.label,
          decimals: rowDef.decimals,
          values,
          maxIndices: [] as number[],
          minIndices: [] as number[],
        };
      }

      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);

      const maxIndices = values
        .map((value, idx) => ({ value, idx }))
        .filter((item) => Math.abs(item.value - maxValue) < 1e-9)
        .map((item) => item.idx);

      const minIndices = values
        .map((value, idx) => ({ value, idx }))
        .filter((item) => Math.abs(item.value - minValue) < 1e-9)
        .map((item) => item.idx);

      return {
        label: rowDef.label,
        decimals: rowDef.decimals,
        values,
        maxIndices,
        minIndices,
      };
    });

    return { clusterIds, rows };
  }, [displayedClusters]);



  return (
    <>
      {showChrome && <UserNavbar />}
      <div className="user-content-zoom" style={{ 
        minHeight: '100vh',
        background: '#ffffff',
        paddingBottom: showChrome ? '40px' : '0',
        paddingTop: showChrome ? '60px' : '0',
        overflowX: 'clip'
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "16px 0" : "32px 16px" }} className="page-container lkjip-card">
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>
            Pemetaan Distribusi Guru SD Kota Palembang
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 24, fontSize: "16px", fontWeight: 500 }}>
            Pengelompokan kecamatan menggunakan Hybrid AHP dan AHC berbasis variabel pemerataan guru: jumlah guru, jumlah siswa, jumlah rombel, jumlah penduduk, dan rasio siswa/guru.
          </p>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '0 16px' : '32px 16px', width: '100%', overflowX: 'clip' }} className="page-container">
          
          {/* Control Panel */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: isMobile ? '12px' : '20px',
            padding: isMobile ? '16px' : '28px 32px',
            marginBottom: isMobile ? '16px' : '28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '16px' : '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '16px' : '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '14px' }}>
                <label style={{ fontWeight: '600', fontSize: '15px', color: '#475569', minWidth: isMobile ? 'auto' : '45px' }}>
                  Tahun:
                </label>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={availableYears.length === 0}
                  style={{
                    padding: '12px 18px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: availableYears.length === 0 ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                    minWidth: isMobile ? 'auto' : '120px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '14px' }}>
                <label style={{ fontWeight: '600', fontSize: '15px', color: '#475569', minWidth: isMobile ? 'auto' : '110px' }}>
                  Jumlah Cluster:
                </label>
                <select
                  value={numberOfClusters}
                  onChange={(e) => setNumberOfClusters(parseInt(e.target.value))}
                  style={{
                    padding: '12px 18px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                    minWidth: isMobile ? 'auto' : '100px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                >
                  {[2, 3].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '14px' }}>
                <label style={{ fontWeight: '600', fontSize: '15px', color: '#475569', minWidth: isMobile ? 'auto' : '110px' }}>
                  Linkage:
                </label>
                <select
                  value={linkageMethod}
                  onChange={(e) => setLinkageMethod(e.target.value as 'single' | 'complete' | 'average')}
                  style={{
                    padding: '12px 18px',
                    border: '2px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                    minWidth: isMobile ? 'auto' : '140px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                >
                  <option value="single">Single</option>
                  <option value="complete">Complete</option>
                  <option value="average">Average</option>
                </select>
              </div>


            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '80px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ fontSize: '18px', color: '#64748b', fontWeight: '500' }}>
                Memproses analisis clustering...
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && errorMessage && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: isMobile ? '24px' : '40px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
              border: '2px solid #93c5fd',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div style={{ fontSize: '20px', color: '#1e3a8a', fontWeight: '700', marginBottom: '12px' }}>
                Gagal Memuat Data
              </div>
              <div style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
                {errorMessage}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#64748b', 
                backgroundColor: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: '700', marginBottom: '8px', color: '#475569' }}>
                  Kemungkinan penyebab:
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>Tidak ada data jumlah penduduk untuk tahun {selectedYear}</li>
                  <li>Jumlah data kurang dari jumlah cluster yang diminta</li>
                  <li>Koneksi database bermasalah</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setMountKey(prev => prev + 1);
                }}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Summary Cards */}
          {clusteringData && !loading && !errorMessage && (
            <>

              {/* Visualizations Section */}
              <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <h2 style={{ 
                  fontSize: isMobile ? '22px' : '28px', 
                  fontWeight: '800', 
                  marginBottom: isMobile ? '20px' : '32px', 
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '10px' : '14px',
                  letterSpacing: '-0.5px'
                }}>
                  <div style={{
                    backgroundColor: '#3b82f6',
                    padding: isMobile ? '8px' : '10px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BarChart3 size={isMobile ? 22 : 28} color="white" strokeWidth={2.5} />
                  </div>
                  Visualisasi Data Clustering
                </h2>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gap: isMobile ? '16px' : '28px', marginBottom: isMobile ? '24px' : '40px' }}>
                  
                  {/* Peta Kelurahan */}
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '12px' : '20px',
                    padding: isMobile ? '16px' : '32px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: isMobile ? '16px' : '24px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                        Peta Kota Palembang
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b', fontWeight: '500' }}>
                          {clusteringData.tahun}
                        </span>
                        <span style={{
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: '#eff6ff',
                          color: '#1e3a8a',
                          border: '1px solid #bfdbfe',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{ padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dbeafe', color: '#1e40af' }}>BPS</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Map Controls Panel */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: isMobile ? '12px' : '20px',
                      marginBottom: '20px',
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                          </svg>
                          <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '700', color: '#1e293b' }}>
                            Kontrol Peta
                          </span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '500',
                          padding: '4px 10px',
                          backgroundColor: '#e0f2fe',
                          borderRadius: '6px',
                          display: isMobile ? 'none' : 'block'
                        }}>
                          Sesuaikan tampilan peta
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: isMobile ? '10px' : '14px'
                      }}>
                        {/* Pop up Toggle */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: isMobile ? '10px' : '12px 14px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `2px solid ${mapControls.showPopup ? '#3b82f6' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease',
                          boxShadow: mapControls.showPopup ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
                        }}>
                          <input
                            type="checkbox"
                            checked={mapControls.showPopup}
                            onChange={() => toggleControl('showPopup')}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#1e293b' }}>
                              Pop-up Chat
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Informasi detail
                            </div>
                          </div>
                        </label>

                        {/* Clustering Toggle */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: isMobile ? '10px' : '12px 14px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `2px solid ${mapControls.showClustering ? '#8b5cf6' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease',
                          boxShadow: mapControls.showClustering ? '0 0 0 3px rgba(139, 92, 246, 0.1)' : 'none'
                        }}>
                          <input
                            type="checkbox"
                            checked={mapControls.showClustering}
                            onChange={() => toggleControl('showClustering')}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#8b5cf6'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#1e293b' }}>
                              Warna Clustering
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Pewarnaan wilayah
                            </div>
                          </div>
                        </label>

                        {/* Outline Only Toggle */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: isMobile ? '10px' : '12px 14px',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: `2px solid ${mapControls.showOutlineOnly ? '#64748b' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease',
                          boxShadow: mapControls.showOutlineOnly ? '0 0 0 3px rgba(100, 116, 139, 0.1)' : 'none'
                        }}>
                          <input
                            type="checkbox"
                            checked={mapControls.showOutlineOnly}
                            onChange={() => toggleControl('showOutlineOnly')}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#64748b'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#1e293b' }}>
                              Garis Batas Saja
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Tanpa warna
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <KelurahanMapVisualization 
                      clusters={clusteringData.clusters} 
                      mapControls={mapControls}
                    />

                    {/* Legend */}
                    <div style={{ 
                      marginTop: '20px', 
                      display: 'flex', 
                      gap: '16px', 
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px'
                    }}>
                      {clusteringData.clusters.map((cluster, index) => {
                        const style = getClusterCategoryStyle(cluster.category, index + 1, numberOfClusters);
                        return (
                          <div key={cluster.cluster} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              backgroundColor: style.bg,
                              border: `2px solid ${style.border}`
                            }}></div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                              {style.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Cluster Profiling Table */}
                    {clusterProfiling.length > 0 && (
                      <div style={{
                        marginTop: '26px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: isMobile ? '16px' : '24px',
                        fontFamily: 'inherit',
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#0f172a'
                      }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '18px' }}>
                          <div>
                            <h3 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, margin: 0, color: '#111827' }}>
                              Profil Cluster
                            </h3>
                            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: isMobile ? '13px' : '14px', lineHeight: 1.6 }}>
                              Karakteristik tiap cluster berdasarkan rata-rata penduduk, guru, siswa, rombel, dan rasio siswa/guru. Hubungkan distribusi wilayah dengan beban rombel untuk melihat cluster 'Relatif Merata' atau 'Belum Merata'.
                            </p>
                          </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Cluster</th>
                                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Cluster ID</th>
                                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Nama Kecamatan</th>
                                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Jumlah Kecamatan</th>
                                <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Avg Penduduk</th>
                                <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Avg Guru</th>
                                <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Avg Siswa</th>
                                <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Avg Rombel</th>
                                <th style={{ textAlign: 'right', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Avg Rasio</th>
                                
                                <th style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 700 }}>Profil Cluster</th>
                                
                              </tr>
                            </thead>
                            <tbody>
                              {clusterProfiling.map((profile) => (
                                <tr key={profile.clusterId} style={{ borderTop: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '14px 14px', color: '#0f172a', fontWeight: 700 }}>{profile.label}</td>
                                  <td style={{ padding: '14px 14px', color: '#475569', fontWeight: 700 }}>{profile.clusterId}</td>
                                  <td style={{ padding: '14px 14px', color: '#475569' }}>
                                    {(clusteringData?.clusters.find(c => c.cluster === profile.clusterId)?.kecamatanList || []).map(k => k.kecamatan).join(', ') || '-'}
                                  </td>
                                  <td style={{ padding: '14px 14px', color: '#475569' }}>{profile.count}</td>
                                  <td style={{ padding: '14px 14px', textAlign: 'right', color: '#0f172a' }}>{idFormatter.format(Math.round(profile.avgPenduduk))}</td>
                                  <td style={{ padding: '14px 14px', textAlign: 'right', color: '#0f172a' }}>{idFormatter.format(Math.round(profile.avgGuru))}</td>
                                  <td style={{ padding: '14px 14px', textAlign: 'right', color: '#0f172a' }}>{idFormatter.format(Math.round(profile.avgSiswa))}</td>
                                  <td style={{ padding: '14px 14px', textAlign: 'right', color: '#0f172a' }}>{idFormatter.format(Math.round(profile.avgRombel))}</td>
                                  <td style={{ padding: '14px 14px', textAlign: 'right', color: '#0f172a' }}>{decimalFormatter.format(profile.avgRasio)}</td>
                                  
                                  <td style={{ padding: '14px 14px', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{profile.profileSummary}</td>
                                  
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Silhouette per k (2..9) */}
                    {clusteringData.silhouetteByK && clusteringData.silhouetteByK.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Silhouette per jumlah cluster</div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {clusteringData.silhouetteByK.map((s: any) => (
                              <div key={s.k} style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>{s.k} cluster</div>
                                <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 800 }}>{s.score.toFixed(3)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {clusteringData.copheneticByLinkage && (
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '680px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>Cophenetic Correlation Coefficient</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#475569' }}>Metode saat ini</div>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{clusteringData.linkage || '-'}</div>
                            <div style={{ fontSize: '12px', color: '#475569' }}>Nilai saat ini</div>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{typeof clusteringData.copheneticCorrelationCoefficient === 'number' ? clusteringData.copheneticCorrelationCoefficient.toFixed(4) : '-'}</div>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>Metode</th>
                                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>Nilai Cophenetic</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(['single', 'complete', 'average'] as const).map((method) => (
                                  <tr key={method} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: 600 }}>{method.charAt(0).toUpperCase() + method.slice(1)}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                                      {typeof clusteringData.copheneticByLinkage?.[method] === 'number' ? clusteringData.copheneticByLinkage[method].toFixed(4) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metodologi AHC - Collapsible Button - Only show for admin */}
                  {isAdmin && (
                    <div style={{
                      backgroundColor: 'white',
                      border: '2px solid #e0e7ff',
                      borderRadius: isMobile ? '12px' : '16px',
                      marginTop: isMobile ? '20px' : '32px',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
                      overflow: 'hidden'
                    }}>
                    {/* Header Button */}
                    <button
                      onClick={() => setShowFormula(!showFormula)}
                      className="formula-button"
                      style={{
                        width: '100%',
                        background: showFormula
                          ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        padding: isMobile ? '18px 20px' : '22px 28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: 'white',
                        transform: 'translateZ(0)',
                        willChange: 'transform, box-shadow'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile && !showFormula) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile && !showFormula) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="formula-icon" style={{
                          backgroundColor: showFormula ? '#93c5fd' : '#1e40af',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          transform: 'translateZ(0)'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ 
                            fontSize: isMobile ? '16px' : '18px', 
                            fontWeight: '700',
                            margin: 0
                          }}>
                            Metodologi AHC (Agglomerative Hierarchical Clustering)
                          </h3>
                          <p style={{ 
                            fontSize: isMobile ? '12px' : '13px', 
                            margin: '4px 0 0 0',
                            opacity: 0.9
                          }}>
                            {showFormula ? 'Klik untuk menyembunyikan' : 'Klik untuk melihat rumus dan perhitungan dengan data riil'}
                          </p>
                        </div>
                      </div>
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="arrow-icon"
                        style={{
                          transform: showFormula ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {/* Collapsible Content - Metodologi AHC */}
                    {showFormula && (
                      <div style={{
                        padding: isMobile ? '20px' : '28px',
                        transition: 'all 0.3s ease',
                        opacity: showFormula ? 1 : 0,
                        transform: showFormula ? 'translateY(0)' : 'translateY(-10px)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                          {manualCalc && (
                            <div style={{
                              background: '#ffffff',
                              padding: isMobile ? '16px' : '20px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1'
                            }}>
                              <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#0f172a', lineHeight: 1.8, display: 'grid', gap: '12px' }}>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button
                                      onClick={handleExportCSV}
                                      disabled={!manualCalc?.sample?.length}
                                      style={{
                                        padding: '5px 12px',
                                        backgroundColor: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontSize: '11px',
                                        boxShadow: '0 3px 10px rgba(22, 163, 74, 0.20)',
                                        transition: 'all 0.2s',
                                        opacity: !manualCalc?.sample?.length ? 0.6 : 1,
                                        width: 'auto'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.backgroundColor = '#15803d';
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.backgroundColor = '#16a34a';
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                      }}
                                    >
                                      <Download size={12} />
                                      Export CSV
                                    </button>
                                    <button
                                      onClick={handleExportExcel}
                                      disabled={!clusteringData}
                                      style={{
                                        padding: '5px 12px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontSize: '11px',
                                        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.20)',
                                        transition: 'all 0.2s',
                                        opacity: !clusteringData ? 0.6 : 1,
                                        width: 'auto'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.backgroundColor = '#1d4ed8';
                                          e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                          e.currentTarget.style.backgroundColor = '#2563eb';
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                      }}
                                    >
                                      <Download size={12} />
                                      Export XLS
                                    </button>
                                  </div>
                                <div style={{
                                  marginBottom: '12px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '10px',
                                  padding: isMobile ? '10px' : '12px'
                                }}>
                                  <div style={{ marginBottom: '8px', fontWeight: 700, color: '#0f172a' }}>
                                    <span style={{ backgroundColor: '#64748b', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Langkah 1</span>
                                    Tabel Data Awal (5 Variabel)
                                  </div>
                                  {isMobile ? (
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                      {manualCalc.sample.map((row) => (
                                        <div key={`raw5-mobile-${row.nama}`} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{row.nama}</div>
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>Penduduk: <strong style={{ color: '#0f172a' }}>{row.penduduk.toLocaleString('id-ID')}</strong></div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>Guru: <strong style={{ color: '#0f172a' }}>{row.guru}</strong></div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>Siswa: <strong style={{ color: '#0f172a' }}>{row.siswa}</strong></div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>Rombel: <strong style={{ color: '#0f172a' }}>{row.rombel}</strong></div>
                                            <div style={{ fontSize: '11px', color: '#475569', gridColumn: '1 / -1' }}>Rasio (S/G): <strong style={{ color: '#0f172a' }}>{row.rasio.toFixed(2)}</strong></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                                        <thead>
                                          <tr style={{ backgroundColor: '#f1f5f9' }}>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Kecamatan</th>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Penduduk</th>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Guru</th>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Siswa</th>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Rombel</th>
                                            <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Rasio (S/G)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {manualCalc.sample.map((row) => (
                                            <tr key={`raw5-${row.nama}`}>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{row.nama}</td>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.penduduk.toLocaleString('id-ID')}</td>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.guru}</td>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.siswa}</td>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.rombel}</td>
                                              <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.rasio.toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                </div>


                                <div style={{ marginTop: '4px', marginBottom: '8px', fontWeight: 700, color: '#0f172a' }}>
                                  <span style={{ backgroundColor: '#0ea5e9', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Langkah 2-3</span>
                                  Min dan Max Sampel
                                </div>
                                {isMobile ? (
                                  <div style={{ display: 'grid', gap: '8px' }}>
                                    {[
                                      ['Penduduk', manualCalc.mins.penduduk, manualCalc.maxs.penduduk],
                                      ['Guru', manualCalc.mins.guru, manualCalc.maxs.guru],
                                      ['Siswa', manualCalc.mins.siswa, manualCalc.maxs.siswa],
                                      ['Rombel', manualCalc.mins.rombel, manualCalc.maxs.rombel],
                                      ['Rasio', manualCalc.mins.rasio, manualCalc.maxs.rasio],
                                    ].map((row) => (
                                      <div key={`minmax-mobile-${String(row[0])}`} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{String(row[0])}</div>
                                        <div style={{ fontSize: '11px', color: '#475569' }}>Min: <strong style={{ color: '#0f172a' }}>{Number(row[1]).toFixed(4)}</strong></div>
                                        <div style={{ fontSize: '11px', color: '#475569' }}>Max: <strong style={{ color: '#0f172a' }}>{Number(row[2]).toFixed(4)}</strong></div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Variabel</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Min</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Max</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {[
                                          ['Penduduk', manualCalc.mins.penduduk, manualCalc.maxs.penduduk],
                                          ['Guru', manualCalc.mins.guru, manualCalc.maxs.guru],
                                          ['Siswa', manualCalc.mins.siswa, manualCalc.maxs.siswa],
                                          ['Rombel', manualCalc.mins.rombel, manualCalc.maxs.rombel],
                                          ['Rasio', manualCalc.mins.rasio, manualCalc.maxs.rasio],
                                        ].map((row) => (
                                          <tr key={String(row[0])}>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{row[0]}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{Number(row[1]).toFixed(4)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{Number(row[2]).toFixed(4)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                <div style={{ marginTop: '4px', marginBottom: '8px', fontWeight: 700, color: '#0f172a' }}>
                                  <span style={{ backgroundColor: '#2563eb', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Langkah 4</span>
                                  Tabel Normalisasi Min-Max (X' = (x - min) / (max - min))
                                </div>
                                {isMobile ? (
                                  <div style={{ display: 'grid', gap: '8px' }}>
                                    {manualCalc.normalizedRows.map((row) => (
                                      <div key={`z-mobile-${row.nama}`} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>{row.nama}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                                          <div style={{ fontSize: '11px', color: '#475569' }}>Penduduk: <strong style={{ color: '#0f172a' }}>{row.penduduk.toFixed(2)}</strong></div>
                                          <div style={{ fontSize: '11px', color: '#475569' }}>Guru: <strong style={{ color: '#0f172a' }}>{row.guru.toFixed(2)}</strong></div>
                                          <div style={{ fontSize: '11px', color: '#475569' }}>Siswa: <strong style={{ color: '#0f172a' }}>{row.siswa.toFixed(2)}</strong></div>
                                          <div style={{ fontSize: '11px', color: '#475569' }}>Rombel: <strong style={{ color: '#0f172a' }}>{row.rombel.toFixed(2)}</strong></div>
                                          <div style={{ fontSize: '11px', color: '#475569' }}>Rasio: <strong style={{ color: '#0f172a' }}>{row.rasio.toFixed(2)}</strong></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Kecamatan</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Penduduk</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Guru</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Siswa</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Rombel</th>
                                          <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Rasio</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {manualCalc.normalizedRows.map((row) => (
                                          <tr key={`z-${row.nama}`}>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{row.nama}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.penduduk.toFixed(2)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.guru.toFixed(2)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.siswa.toFixed(2)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.rombel.toFixed(2)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.rasio.toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {isAdmin && (
                                  <div style={{
                                    background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
                                    padding: isMobile ? '16px' : '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #bfdbfe',
                                    marginTop: '12px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                      <div>
                                        <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 800, color: '#1e3a8a' }}>
                                          Konfigurasi AHP Dinamis
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.6 }}>
                                          Atur bobot dasar tiap variabel dan faktor skala untuk menguatkan atau melemahkan perbedaan prioritas.
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                          type="button"
                                          onClick={saveAHPConfig}
                                          disabled={ahpSaveLoading}
                                          style={{
                                            padding: '8px 12px',
                                            backgroundColor: ahpSaveLoading ? '#9ca3af' : '#1d4ed8',
                                            color: '#ffffff',
                                            border: `1px solid ${ahpSaveLoading ? '#9ca3af' : '#1d4ed8'}`,
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            cursor: ahpSaveLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '12px',
                                            opacity: ahpSaveLoading ? 0.7 : 1
                                          }}
                                        >
                                          {ahpSaveLoading ? '⏳ Menyimpan...' : 'Simpan pembobotan'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={resetAHPConfig}
                                          style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#ffffff',
                                            color: '#1e3a8a',
                                            border: '1px solid #93c5fd',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                        >
                                          Reset default
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '12px' }}>
                                      {AHP_VARIABLES.map((item) => (
                                        <div key={item.key} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '160px 1fr 72px', gap: '10px', alignItems: 'center' }}>
                                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                                          <input
                                            type="range"
                                            min="0.5"
                                            max="10"
                                            step="0.1"
                                            value={ahpDraftWeights[item.key]}
                                            onChange={(e) => updateAHPWeight(item.key, Number(e.target.value))}
                                            style={{ width: '100%', accentColor: '#2563eb' }}
                                          />
                                          <input
                                            type="number"
                                            min="0.5"
                                            max="10"
                                            step="0.1"
                                            value={ahpDraftWeights[item.key]}
                                            onChange={(e) => updateAHPWeight(item.key, Number(e.target.value) || 0.5)}
                                            style={{
                                              width: '72px',
                                              padding: '8px 10px',
                                              borderRadius: '8px',
                                              border: '1px solid #cbd5e1',
                                              fontSize: '12px',
                                              fontWeight: 700,
                                              color: '#0f172a'
                                            }}
                                          />
                                        </div>
                                      ))}

                                      
                                    </div>

                                    {/* Status message */}
                                    {ahpSaveMessage && (
                                      <div style={{
                                        marginTop: '12px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        backgroundColor: ahpSaveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                                        color: ahpSaveMessage.type === 'success' ? '#166534' : '#991b1b',
                                        border: `1px solid ${ahpSaveMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
                                      }}>
                                        {ahpSaveMessage.text}
                                      </div>
                                    )}

                                    

                                    {/* Tabel Matriks AHP Real (Draft) - HANYA 1 TABEL */}
                                    <div style={{ marginTop: '16px', backgroundColor: '#f5f3ff', padding: '14px', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', marginBottom: '12px' }}>
                                        📊 Matriks Perbandingan AHP (Real)
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#6b21a8', marginBottom: '10px', lineHeight: 1.6 }}>
                                        Matriks pairwise comparison dengan konfigurasi saat ini. Nilai = (bobot baris / bobot kolom)
                                      </div>
                                      
                                      <div style={{ overflowX: 'auto', backgroundColor: 'white', border: '1px solid #ddd6fe', borderRadius: '8px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '360px', fontSize: '11px', fontFamily: 'monospace' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: '#ede9fe' }}>
                                              <th style={{ padding: '8px 10px', border: '1px solid #ddd6fe', textAlign: 'center', fontWeight: 700, color: '#4c1d95' }}>vs</th>
                                              {AHP_VARIABLES.map((v) => (
                                                <th key={v.key} style={{ padding: '8px 6px', border: '1px solid #ddd6fe', textAlign: 'center', fontWeight: 600, color: '#7c3aed' }}>
                                                  {v.label.substring(0, 4)}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(() => {
                                              const matrix = buildAHPMatrix(ahpDraftWeights);
                                              return AHP_VARIABLES.map((row, i) => (
                                                <tr key={row.key} style={{ borderBottom: '1px solid #f3e8ff' }}>
                                                  <td style={{ padding: '8px 10px', border: '1px solid #ddd6fe', fontWeight: 600, color: '#7c3aed', backgroundColor: '#f3e8ff' }}>
                                                    {row.label.substring(0, 4)}
                                                  </td>
                                                  {matrix[i].map((val, j) => (
                                                    <td key={j} style={{ 
                                                      padding: '8px 6px', 
                                                      border: '1px solid #ddd6fe', 
                                                      textAlign: 'center', 
                                                      color: '#4c1d95',
                                                      backgroundColor: i === j ? '#fef3c7' : 'white',
                                                      fontWeight: i === j ? 700 : 500
                                                    }}>
                                                      {val.toFixed(2)}
                                                    </td>
                                                  ))}
                                                </tr>
                                              ));
                                            })()}
                                          </tbody>
                                        </table>
                                      </div>

                                      <div style={{ fontSize: '10px', color: '#6b21a8', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd6fe', display: 'grid', gap: '4px' }}>
                                        <div>💡 <strong>Cara baca:</strong></div>
                                        <div>• Diagonal (kuning) = 1 (perbandingan variabel dengan dirinya)</div>
                                        <div>• Nilai &gt; 1 = baris lebih penting dari kolom</div>
                                        <div>• Nilai &lt; 1 = kolom lebih penting dari baris</div>
                                        <div>• Ubah skala untuk melihat nilai berubah, lalu klik "Simpan pembobotan"</div>
                                      </div>
                                    </div>


                                  </div>
                                )}

                                <div style={{
                                  border: '1px solid #c7d2fe',
                                  backgroundColor: '#eff6ff',
                                  borderRadius: '10px',
                                  padding: isMobile ? '10px' : '12px',
                                  marginTop: '12px'
                                }}>
                                  <div style={{ marginBottom: '8px', fontWeight: 700, color: '#3730a3' }}>
                                    <span style={{ backgroundColor: '#4338ca', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Pembobotan AHP</span>
                                    Pembobotan Variabel dengan AHP
                                  </div>
                                  <div style={{ marginBottom: '10px', color: '#1e3a8a' }}>
                                    Indeks yang dipakai adalah indeks normalisasi Min-Max (z).
                                  </div>
                                  <div style={{ overflowX: 'auto', border: '1px solid #c7d2fe', borderRadius: '8px', backgroundColor: 'white' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#e0e7ff' }}>
                                          <th style={{ padding: '8px', border: '1px solid #c7d2fe', textAlign: 'left' }}>Variabel</th>
                                          <th style={{ padding: '8px', border: '1px solid #c7d2fe', textAlign: 'right' }}>Bobot AHP</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.entries(manualCalc.ahpResult.weights).map(([key, value]) => (
                                          <tr key={key}>
                                            <td style={{ padding: '8px', border: '1px solid #c7d2fe' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                                            <td style={{ padding: '8px', border: '1px solid #c7d2fe', textAlign: 'right' }}>{value.toFixed(4)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#374151' }}>
                                    <div>CI (Consistency Index): {manualCalc.ahpResult.CI.toFixed(4)}</div>
                                    <div>CR (Consistency Ratio): {manualCalc.ahpResult.CR.toFixed(4)}</div>
                                  </div>
                                </div>

                                <div style={{ marginTop: '12px', border: '1px solid #fdecea', backgroundColor: '#fff7f6', borderRadius: '10px', padding: isMobile ? '10px' : '12px' }}>
                                  <div style={{ marginBottom: '8px', fontWeight: 700, color: '#7c2d12' }}>
                                    <span style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Tabel Indeks Berbobot</span>
                                    Indeks berbobot per variabel
                                  </div>

                                  {isMobile ? (
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                      {manualCalc.normalizedRows.map((row: any, idx: number) => {
                                        const w = manualCalc.ahpResult.weights as any;
                                        const zPend = row.penduduk * w.penduduk;
                                        const zGuru = row.guru * w.guru;
                                        const zSiswa = row.siswa * w.siswa;
                                        const zRombel = row.rombel * w.rombel;
                                        const zRasio = row.rasio * w.rasio;
                                        return (
                                          <div key={`z-mobile-${row.nama}`} style={{ backgroundColor: 'white', border: '1px solid #fdecea', borderRadius: '8px', padding: '10px' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 6 }}>{row.nama}</div>
                                            <div style={{ fontSize: 12 }}>
                                              <div>z_penduduk: {zPend.toFixed(4)}</div>
                                              <div>z_guru: {zGuru.toFixed(4)}</div>
                                              <div>z_siswa: {zSiswa.toFixed(4)}</div>
                                              <div>z_rombel: {zRombel.toFixed(4)}</div>
                                              <div>z_rasio: {zRasio.toFixed(4)}</div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid #fdecea', borderRadius: '8px', backgroundColor: 'white' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                        <thead>
                                          <tr style={{ backgroundColor: '#fff1f2' }}>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'left' }}>Kecamatan</th>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>v_penduduk</th>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>v_guru</th>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>v_siswa</th>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>v_rombel</th>
                                            <th style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>v_rasio</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {manualCalc.normalizedRows.map((row: any, idx: number) => {
                                            const w = manualCalc.ahpResult.weights as any;
                                            const zPend = row.penduduk * w.penduduk;
                                            const zGuru = row.guru * w.guru;
                                            const zSiswa = row.siswa * w.siswa;
                                            const zRombel = row.rombel * w.rombel;
                                            const zRasio = row.rasio * w.rasio;
                                            return (
                                              <tr key={`z-${row.nama}`}> 
                                                <td style={{ padding: '8px', border: '1px solid #fdecea' }}>{row.nama}</td>
                                                <td style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>{zPend.toFixed(4)}</td>
                                                <td style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>{zGuru.toFixed(4)}</td>
                                                <td style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>{zSiswa.toFixed(4)}</td>
                                                <td style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>{zRombel.toFixed(4)}</td>
                                                <td style={{ padding: '8px', border: '1px solid #fdecea', textAlign: 'right' }}>{zRasio.toFixed(4)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                <div style={{
                                  border: '1px solid #fde68a',
                                  backgroundColor: '#fffbeb',
                                  borderRadius: '10px',
                                  padding: isMobile ? '10px' : '12px'
                                }}>
                                  <div style={{ marginBottom: '8px', fontWeight: 700, color: '#78350f' }}>
                                    <span style={{ backgroundColor: '#f59e0b', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Langkah 5</span>
                                     Euclidean Distance (5 variabel: penduduk, guru, siswa, rombel, rasio)
                                  </div>
                                  <div style={{ marginBottom: '8px', fontSize: '13px', color: '#92400e' }}>
                                    d(i,j) = √((x1_i - x1_j)² + (y2_i - y2_j)² )
                                  </div>
                                
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '8px', maxHeight: isMobile ? '320px' : '420px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {manualCalc.pairDetails.map((p) => (
                                      <div key={`pair-list-${p.nameA}-${p.nameB}`} style={{ backgroundColor: 'white', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 10px' }}>
                                        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>{p.nameA} - {p.nameB}</div>
                                        <div style={{ color: '#78350f' }}>d(i,j) = <strong>{p.distance.toFixed(4)}</strong></div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div style={{ marginTop: '4px', marginBottom: '8px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                  <div>
                                    <span style={{ backgroundColor: '#7c3aed', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px' }}>Langkah 6</span>
                                    Matriks Jarak Lengkap
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => {
                                        if (!manualCalc?.sample || !manualCalc?.distanceMatrix) return;
                                        const headers = ['Kecamatan', ...manualCalc.sample.map((s: { nama: string }) => s.nama)];
                                        const rows = manualCalc.sample.map((row: { nama: string }, i: number) => [
                                          row.nama,
                                          ...manualCalc.distanceMatrix[i].map((v: number) => Math.abs(Number(v)) < 1e-12 ? 0 : Number(Number(v).toFixed(4)))
                                        ]);
                                        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `matriks_jarak_lengkap_${selectedYear ?? 'semua'}.csv`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                      <Download size={12} /> CSV
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!manualCalc?.sample || !manualCalc?.distanceMatrix) return;
                                        const headers = ['Kecamatan', ...manualCalc.sample.map((s: { nama: string }) => s.nama)];
                                        const rows = manualCalc.sample.map((row: { nama: string }, i: number) => [
                                          row.nama,
                                          ...manualCalc.distanceMatrix[i].map((v: number) => Math.abs(Number(v)) < 1e-12 ? 0 : Number(Number(v).toFixed(4)))
                                        ]);
                                        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, 'Matriks Jarak');
                                        XLSX.writeFile(wb, `matriks_jarak_lengkap_${selectedYear ?? 'semua'}.xlsx`);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                      <Download size={12} /> XLS
                                    </button>
                                  </div>
                                </div>
                                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                  <div style={{
                                    padding: '8px 10px',
                                    borderBottom: '1px solid #e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    fontSize: '11px',
                                    color: '#334155',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                  }}>
                                    <span style={{
                                      display: 'inline-block',
                                      width: '14px',
                                      height: '14px',
                                      borderRadius: '4px',
                                      backgroundColor: '#dcfce7',
                                      border: '1px solid #86efac'
                                    }} />
                                    Nilai <strong>0</strong> = jarak kecamatan terhadap dirinya sendiri (diagonal matriks)
                                    <span style={{
                                      display: 'inline-block',
                                      width: '14px',
                                      height: '14px',
                                      borderRadius: '4px',
                                      backgroundColor: '#fef3c7',
                                      border: '1px solid #f59e0b',
                                      marginLeft: '8px'
                                    }} />
                                    Sel kuning = nilai yang dipakai untuk <strong>merge pertama</strong> (jarak minimum)
                                  </div>
                                  {isMobile ? (
                                    <div style={{ padding: '10px', fontSize: '11px', color: '#334155', lineHeight: 1.6, backgroundColor: '#ffffff' }}>
                                      Matriks jarak lengkap disederhanakan di mobile agar tampilan tidak melebar. Data inti tetap ditampilkan pada bagian Weighted Euclidean Distance (Langkah 5), merge pertama, dan linkage.
                                    </div>
                                  ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${220 + manualCalc.sample.length * 90}px` }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0' }}>Kecamatan</th>
                                        {manualCalc.sample.map((col, colIdx) => (
                                          <th
                                            key={`col-${col.nama}`}
                                            style={{
                                              padding: '8px',
                                              border: '1px solid #e2e8f0',
                                              whiteSpace: 'nowrap',
                                              backgroundColor: colIdx === manualCalc.firstMerge.i || colIdx === manualCalc.firstMerge.j ? '#fff7ed' : '#f8fafc',
                                              color: colIdx === manualCalc.firstMerge.i || colIdx === manualCalc.firstMerge.j ? '#9a3412' : '#334155'
                                            }}
                                          >
                                            {col.nama}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {manualCalc.sample.map((row, i) => (
                                        <tr key={`row-${row.nama}`}>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: i === manualCalc.firstMerge.i || i === manualCalc.firstMerge.j ? '#fff7ed' : 'white', color: i === manualCalc.firstMerge.i || i === manualCalc.firstMerge.j ? '#9a3412' : '#0f172a' }}>{row.nama}</td>
                                          {manualCalc.distanceMatrix[i].map((value, j) => (
                                            (() => {
                                              const isZero = Math.abs(Number(value)) < 1e-12;
                                              const isFirstMergePair = (i === manualCalc.firstMerge.i && j === manualCalc.firstMerge.j) || (i === manualCalc.firstMerge.j && j === manualCalc.firstMerge.i);
                                              return (
                                            <td
                                              key={`cell-${i}-${j}`}
                                              style={{
                                                padding: '8px',
                                                border: '1px solid #e2e8f0',
                                                textAlign: 'right',
                                                backgroundColor: isFirstMergePair ? '#fef3c7' : isZero ? '#dcfce7' : 'white',
                                                color: isFirstMergePair ? '#9a3412' : isZero ? '#166534' : '#0f172a',
                                                fontWeight: isFirstMergePair || isZero ? 800 : 500
                                              }}
                                            >
                                              {isZero ? '0' : Number(value).toFixed(2)}
                                            </td>
                                              );
                                            })()
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  )}
                                </div>


                              </div>
                            </div>
                          )}

                          {/* TAHAPAN AHC block: after Matriks Baru Jarak */}
                          {linkageMergeStages && linkageMergeStages.length > 0 && (
                            <div style={{ marginTop: '16px', border: '1px solid #e6edf8', borderRadius: '10px', backgroundColor: '#ffffff', padding: isMobile ? '10px' : '14px', fontFamily: 'inherit', fontSize: isMobile ? '13px' : '14px', color: '#0f172a' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                <span style={{ backgroundColor: '#111827', color: 'white', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', marginRight: '8px', fontFamily: 'inherit' }}>TAHAPAN AHC ({linkageMethod.toUpperCase()})</span>
                                Urutan penggabungan cluster ({linkageMethod} linkage)
                              </div>

                              {isMobile ? (
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {linkageMergeStages.map((s) => (
                                    <div key={`stage-mobile-${s.tahap}`} style={{ border: '1px solid #e6edf8', borderRadius: '8px', padding: '8px', backgroundColor: '#f8fafc' }}>
                                      <div style={{ fontWeight: 700 }}>Tahap {s.tahap}</div>
                                      <div style={{ fontSize: '13px' }}>Cluster 1: <strong>{s.cluster1}</strong></div>
                                      <div style={{ fontSize: '13px' }}>Cluster 2: <strong>{s.cluster2}</strong></div>
                                      <div style={{ fontSize: '13px' }}>Jarak: <strong>{s.jarak.toFixed(3)}</strong></div>
                                      <div style={{ fontSize: '13px' }}>Jumlah: <strong>{s.jumlah}</strong></div>
                                      <div style={{ fontSize: '13px' }}>Cluster Baru: <strong>{s.clusterBaru}</strong></div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Tahap</th>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Cluster 1</th>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Cluster 2</th>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Jarak</th>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Jumlah</th>
                                        <th style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Cluster Baru</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {linkageMergeStages.map((s) => (
                                        <tr key={`stage-${s.tahap}`}>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.tahap}</td>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.cluster1}</td>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.cluster2}</td>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{s.jarak.toFixed(3)}</td>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>{s.jumlah}</td>
                                          <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.clusterBaru}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                  </div>

                  )}

                  {isAdmin && (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: isMobile ? '12px' : '20px',
                    padding: isMobile ? '16px' : '32px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      flexDirection: isMobile ? 'column' : 'row',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                        Dendrogram AHC
                      </h3>
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #86efac',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'capitalize'
                      }}>
                        Linkage: {linkageMethod}
                      </span>
                    </div>

                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: isMobile ? '10px 12px' : '12px 14px',
                      marginBottom: '12px',
                      color: '#334155',
                      fontSize: isMobile ? '12px' : '13px',
                      lineHeight: 1.7
                    }}>
                      Dendrogram menampilkan urutan penggabungan cluster dari jarak terkecil ke terbesar. Warna cabang mengikuti kelompok cluster akhir, dan garis putus-putus menunjukkan batas pemotongan ke k cluster.
                    </div>

                    {dendrogramData && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                        <svg
                          width="100%"
                          height={isMobile ? Math.max(320, Math.min(460, dendrogramData.height)) : dendrogramData.height}
                          viewBox={`0 0 ${dendrogramData.width} ${dendrogramData.height}`}
                          preserveAspectRatio="xMidYMid meet"
                          role="img"
                          aria-label="Dendrogram AHC"
                        >
                          <rect x={0} y={0} width={dendrogramData.width} height={dendrogramData.height} fill="#ffffff" />

                          {dendrogramData.sample.map((row, idx) => {
                            const y = 24 + idx * (isMobile ? 26 : 30);
                            return (
                              <text
                                key={`label-${row.nama}`}
                                x={8}
                                y={y + 4}
                                fill={dendrogramData.leafLabelColor[idx]}
                                fontSize={isMobile ? 11 : 12}
                                fontWeight={700}
                              >
                                {row.nama}
                              </text>
                            );
                          })}

                          {dendrogramData.segments.map((segment, idx) => (
                            <line
                              key={`seg-${idx}`}
                              x1={segment.x1}
                              y1={segment.y1}
                              x2={segment.x2}
                              y2={segment.y2}
                              stroke={segment.stroke}
                              strokeWidth={segment.strokeWidth ?? 2}
                            />
                          ))}

                          {dendrogramData.targetK > 1 && dendrogramData.targetK < dendrogramData.sample.length && (
                            <>
                              <line
                                x1={dendrogramData.cutX}
                                y1={8}
                                x2={dendrogramData.cutX}
                                y2={dendrogramData.height - 24}
                                stroke="#64748b"
                                strokeWidth={1.8}
                                strokeDasharray="6 6"
                              />
                              <text
                                x={dendrogramData.cutX + 6}
                                y={16}
                                fill="#475569"
                                fontSize={10}
                                fontWeight={700}
                              >
                                Cut k={dendrogramData.targetK}
                              </text>
                            </>
                          )}

                          <line
                            x1={dendrogramData.labelWidth}
                            y1={dendrogramData.height - 18}
                            x2={dendrogramData.width - 20}
                            y2={dendrogramData.height - 18}
                            stroke="#94a3b8"
                            strokeWidth={1}
                          />

                          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                            const value = dendrogramData.maxHeight * tick;
                            const x = dendrogramData.xForHeight(value);
                            return (
                              <g key={`tick-${tick}`}>
                                <line x1={x} y1={dendrogramData.height - 18} x2={x} y2={dendrogramData.height - 12} stroke="#94a3b8" strokeWidth={1} />
                                <text x={x} y={dendrogramData.height - 2} textAnchor="middle" fill="#64748b" fontSize={10}>
                                  {value.toFixed(2)}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </div>
                  )}

                </div>
              </div>

              

            </>
          )}
        </div>
      </div>
      
      {showChrome && <Footer />}
    </>
  );
}

// Add loading overlay wrapper at the end
const ClusteringPageWrapper = ({ showChrome = true }: ClusteringPendudukPageProps) => {
  const [isPageReady, setIsPageReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isPageReady) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0a2972',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }
  
  return <ClusteringPendudukUserPage showChrome={showChrome} />;
};

export default ClusteringPageWrapper;



