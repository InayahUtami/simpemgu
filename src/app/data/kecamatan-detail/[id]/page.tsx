'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download } from 'lucide-react';
import UserNavbar from '../../../User/UserNavbar';
import { utils, writeFile } from 'xlsx';

const Footer = dynamic(() => import('../../../components/Footer'), { ssr: false });

interface GuruPerSekolah {
  nama_sekolah: string;
  tahun: string;
  jumlah_guru: number;
}

interface SiswaPerSekolah {
  nama_sekolah: string;
  tahun: string;
  jumlah_siswa: number;
}

interface RombelPerSekolah {
  nama_sekolah: string;
  tahun: string;
  jumlah_rombel: number;
}

interface SekolahData {
  id: number;
  nama_sekolah: string;
  status: 'Negeri' | 'Swasta';
}

type DataType = 'guru' | 'siswa' | 'rombel' | 'rasio';

const YEARS_PER_PAGE = 5;

export default function UserKecamatanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const kecamatanId = params?.id as string;
  const rawType = searchParams.get('type') || 'guru';
  const initialType = (['guru', 'siswa', 'rombel', 'rasio'].includes(rawType) ? rawType : 'guru') as DataType;
  const kecamatanName = searchParams.get('name') || 'Kecamatan';

  const [isMobile, setIsMobile] = useState(false);
  const [dataType, setDataType] = useState<DataType>(initialType);
  const [guruData, setGuruData] = useState<GuruPerSekolah[]>([]);
  const [siswaData, setSiswaData] = useState<SiswaPerSekolah[]>([]);
  const [rombelData, setRombelData] = useState<RombelPerSekolah[]>([]);
  const [sekolahData, setSekolahData] = useState<SekolahData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearPage, setYearPage] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchData = useCallback(async () => {
    if (!kecamatanId) return;
    setIsLoading(true);
    setError('');
    try {
      const [guruRes, siswaRes, rombelRes, sekolahRes] = await Promise.all([
        fetch(`/api/data/guru-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/siswa-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/rombel-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/nama-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
      ]);
      if (guruRes.ok) { const r = await guruRes.json(); if (r.success) setGuruData(r.data || []); }
      if (siswaRes.ok) { const r = await siswaRes.json(); if (r.success) setSiswaData(r.data || []); }
      if (rombelRes.ok) { const r = await rombelRes.json(); if (r.success) setRombelData(r.data || []); }
      if (sekolahRes.ok) { const r = await sekolahRes.json(); if (r.success) setSekolahData(r.data || []); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [kecamatanId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setYearPage(0); }, [dataType]);

  const sekolahStatusMap = useMemo(() => {
    return new Map<string, 'Negeri' | 'Swasta'>(sekolahData.map(s => [s.nama_sekolah, s.status]));
  }, [sekolahData]);

  // ── Guru ──────────────────────────────────────────────────
  const guruYears = useMemo(() =>
    Array.from(new Set(guruData.map(r => r.tahun))).sort((a, b) => a.localeCompare(b)),
  [guruData]);

  const guruGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, GuruPerSekolah> }>();
    guruData.forEach(row => {
      if (!map.has(row.nama_sekolah)) map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });
    const base = new Map(Array.from(map));
    sekolahData.forEach(s => { if (!base.has(s.nama_sekolah)) base.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} }); });
    return Array.from(base.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [guruData, sekolahData]);

  const guruDisplayYears = guruYears.length > 0 ? guruYears : ['-'];
  const totalGuruByYear = useMemo(() =>
    guruDisplayYears.map(year => year === '-' ? 0 : guruData.reduce((s, r) => r.tahun === year ? s + Number(r.jumlah_guru || 0) : s, 0)),
  [guruData, guruDisplayYears]);

  // ── Siswa ─────────────────────────────────────────────────
  const siswaYears = useMemo(() =>
    Array.from(new Set(siswaData.map(r => r.tahun))).sort((a, b) => a.localeCompare(b)),
  [siswaData]);

  const siswaGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, SiswaPerSekolah> }>();
    siswaData.forEach(row => {
      if (!map.has(row.nama_sekolah)) map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });
    const base = new Map(Array.from(map));
    sekolahData.forEach(s => { if (!base.has(s.nama_sekolah)) base.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} }); });
    return Array.from(base.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [siswaData, sekolahData]);

  const siswaDisplayYears = siswaYears.length > 0 ? siswaYears : ['-'];
  const totalSiswaByYear = useMemo(() =>
    siswaDisplayYears.map(year => year === '-' ? 0 : siswaData.reduce((s, r) => r.tahun === year ? s + Number(r.jumlah_siswa || 0) : s, 0)),
  [siswaData, siswaDisplayYears]);

  // ── Rombel ────────────────────────────────────────────────
  const rombelYears = useMemo(() =>
    Array.from(new Set(rombelData.map(r => r.tahun))).sort((a, b) => a.localeCompare(b)),
  [rombelData]);

  const rombelGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, RombelPerSekolah> }>();
    rombelData.forEach(row => {
      if (!map.has(row.nama_sekolah)) map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });
    const base = new Map(Array.from(map));
    sekolahData.forEach(s => { if (!base.has(s.nama_sekolah)) base.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} }); });
    return Array.from(base.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [rombelData, sekolahData]);

  const rombelDisplayYears = rombelYears.length > 0 ? rombelYears : ['-'];
  const totalRombelByYear = useMemo(() =>
    rombelDisplayYears.map(year => year === '-' ? 0 : rombelData.reduce((s, r) => r.tahun === year ? s + Number(r.jumlah_rombel || 0) : s, 0)),
  [rombelData, rombelDisplayYears]);

  // ── Rasio per sekolah (guru+siswa combined) ─────────────
  const rasioYears = useMemo(() => {
    const allYears = new Set([...guruYears, ...siswaYears]);
    return Array.from(allYears).sort((a, b) => a.localeCompare(b));
  }, [guruYears, siswaYears]);

  // Map: nama_sekolah -> tahun -> { guru, siswa }
  const rasioGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, { guru: number; siswa: number; rasio: number }> }>();
    // collect all school names
    const allNames = new Set<string>([
      ...guruData.map(r => r.nama_sekolah),
      ...siswaData.map(r => r.nama_sekolah),
      ...sekolahData.map(s => s.nama_sekolah),
    ]);
    allNames.forEach(name => map.set(name, { nama_sekolah: name, perYear: {} }));
    guruData.forEach(r => {
      if (!map.has(r.nama_sekolah)) map.set(r.nama_sekolah, { nama_sekolah: r.nama_sekolah, perYear: {} });
      const entry = map.get(r.nama_sekolah)!;
      if (!entry.perYear[r.tahun]) entry.perYear[r.tahun] = { guru: 0, siswa: 0, rasio: 0 };
      entry.perYear[r.tahun].guru = Number(r.jumlah_guru || 0);
    });
    siswaData.forEach(r => {
      if (!map.has(r.nama_sekolah)) map.set(r.nama_sekolah, { nama_sekolah: r.nama_sekolah, perYear: {} });
      const entry = map.get(r.nama_sekolah)!;
      if (!entry.perYear[r.tahun]) entry.perYear[r.tahun] = { guru: 0, siswa: 0, rasio: 0 };
      entry.perYear[r.tahun].siswa = Number(r.jumlah_siswa || 0);
    });
    // calculate rasio
    map.forEach(school => {
      Object.keys(school.perYear).forEach(tahun => {
        const d = school.perYear[tahun];
        d.rasio = d.guru > 0 ? Math.round((d.siswa / d.guru) * 100) / 100 : 0;
      });
    });
    return Array.from(map.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [guruData, siswaData, sekolahData]);

  const rasioDisplayYears = rasioYears.length > 0 ? rasioYears : ['-'];

  // ── Active paged years ────────────────────────────────────
  const activeDisplayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : dataType === 'rombel' ? rombelDisplayYears : rasioDisplayYears;
  const totalYearPages = Math.max(1, Math.ceil(activeDisplayYears.filter(y => y !== '-').length / YEARS_PER_PAGE));
  const yearStart = yearPage * YEARS_PER_PAGE;

  const pagedGuruYears = guruDisplayYears[0] !== '-' ? guruDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : guruDisplayYears;
  const pagedGuruTotals = totalGuruByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const pagedSiswaYears = siswaDisplayYears[0] !== '-' ? siswaDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : siswaDisplayYears;
  const pagedSiswaTotals = totalSiswaByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const pagedRombelYears = rombelDisplayYears[0] !== '-' ? rombelDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : rombelDisplayYears;
  const pagedRombelTotals = totalRombelByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const pagedRasioYears = rasioDisplayYears[0] !== '-' ? rasioDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : rasioDisplayYears;

  // ── Export ────────────────────────────────────────────────
  const exportCSV = () => {
    if (dataType === 'rasio') {
      const headers = ['No', 'Nama Sekolah', 'Status', ...rasioDisplayYears.flatMap(y => [`Guru ${y}`, `Siswa ${y}`, `Rasio ${y}`])];
      const csvRows = rasioGrouped.map((row, idx) => [
        idx + 1,
        `"${row.nama_sekolah}"`,
        sekolahStatusMap.get(row.nama_sekolah) || '-',
        ...rasioDisplayYears.flatMap(y => [row.perYear[y]?.guru || 0, row.perYear[y]?.siswa || 0, row.perYear[y]?.rasio || 0]),
      ]);
      const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `data_rasio_${kecamatanName}.csv`; link.click();
      return;
    }
    const displayRows = dataType === 'guru' ? guruGrouped : dataType === 'siswa' ? siswaGrouped : rombelGrouped;
    const displayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : rombelDisplayYears;
    const vKey = dataType === 'guru' ? 'jumlah_guru' : dataType === 'siswa' ? 'jumlah_siswa' : 'jumlah_rombel';
    const headers = ['No', 'Nama Sekolah', 'Status', ...displayYears.map(y => `Tahun ${y}`)];
    const csvRows = displayRows.map((row, idx) => [
      idx + 1,
      `"${row.nama_sekolah}"`,
      sekolahStatusMap.get(row.nama_sekolah) || '-',
      ...displayYears.map(y => (row.perYear as unknown as Record<string, Record<string, number>>)[y]?.[vKey] || 0),
    ]);
    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_${dataType}_${kecamatanName}.csv`;
    link.click();
  };

  const exportXLS = () => {
    if (dataType === 'rasio') {
      const headers = ['No', 'Nama Sekolah', 'Status', ...rasioDisplayYears.flatMap(y => [`Guru ${y}`, `Siswa ${y}`, `Rasio ${y}`])];
      const xlsRows = rasioGrouped.map((row, idx) => [
        idx + 1, row.nama_sekolah, sekolahStatusMap.get(row.nama_sekolah) || '-',
        ...rasioDisplayYears.flatMap(y => [row.perYear[y]?.guru || 0, row.perYear[y]?.siswa || 0, row.perYear[y]?.rasio || 0]),
      ]);
      const wb = utils.book_new();
      const ws = utils.aoa_to_sheet([headers, ...xlsRows]);
      ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, ...rasioDisplayYears.flatMap(() => [{ wch: 10 }, { wch: 10 }, { wch: 8 }])];
      utils.book_append_sheet(wb, ws, 'Data');
      writeFile(wb, `data_rasio_${kecamatanName}.xlsx`);
      return;
    }
    const displayRows = dataType === 'guru' ? guruGrouped : dataType === 'siswa' ? siswaGrouped : rombelGrouped;
    const displayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : rombelDisplayYears;
    const vKey = dataType === 'guru' ? 'jumlah_guru' : dataType === 'siswa' ? 'jumlah_siswa' : 'jumlah_rombel';
    const headers = ['No', 'Nama Sekolah', 'Status', ...displayYears.map(y => `Tahun ${y}`)];
    const xlsRows = displayRows.map((row, idx) => [
      idx + 1,
      row.nama_sekolah,
      sekolahStatusMap.get(row.nama_sekolah) || '-',
      ...displayYears.map(y => (row.perYear as unknown as Record<string, Record<string, number>>)[y]?.[vKey] || 0),
    ]);
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet([headers, ...xlsRows]);
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, ...displayYears.map(() => ({ wch: 12 }))];
    utils.book_append_sheet(wb, ws, 'Data');
    writeFile(wb, `data_${dataType}_${kecamatanName}.xlsx`);
  };

  const thStyle: React.CSSProperties = {
    padding: '10px',
    textAlign: 'left',
    color: '#1f2937',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid #9ca3af',
    whiteSpace: 'nowrap',
    background: '#e5e7eb',
  };
  const thCenterStyle: React.CSSProperties = { ...thStyle, textAlign: 'center' };
  const tdStyle: React.CSSProperties = { padding: '10px', fontSize: '12px', border: '1px solid #e5e7eb' };
  const tdCenterStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center' };

  const tabBtn = (type: DataType, label: string) => (
    <button
      onClick={() => setDataType(type)}
      style={{
        padding: isMobile ? '8px 14px' : '10px 22px',
        fontSize: isMobile ? 12 : 14,
        fontWeight: 700,
        border: 'none',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        background: dataType === type ? '#1e3a8a' : '#e5e7eb',
        color: dataType === type ? 'white' : '#374151',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  const yearNavBar = (
    totalPages: number,
    current: number,
    setCurrent: (fn: (p: number) => number) => void
  ) => totalPages > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '0 0 12px 12px' }}>
      <button disabled={current === 0} onClick={() => setCurrent(p => p - 1)} style={{ padding: '6px 14px', background: current === 0 ? '#e5e7eb' : '#1e3a8a', color: current === 0 ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: current === 0 ? 'default' : 'pointer' }}>← Sebelumnya</button>
      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Halaman {current + 1} dari {totalPages}</span>
      <button disabled={current >= totalPages - 1} onClick={() => setCurrent(p => p + 1)} style={{ padding: '6px 14px', background: current >= totalPages - 1 ? '#e5e7eb' : '#1e3a8a', color: current >= totalPages - 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: current >= totalPages - 1 ? 'default' : 'pointer' }}>Selanjutnya →</button>
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <UserNavbar />
      <div
        className="user-content-zoom"
        style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: '40px', paddingTop: '60px' }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '16px 12px' : '32px 16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => router.back()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <div>
              <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                Kecamatan {kecamatanName}
              </h1>
              <p style={{ color: '#6b7280', fontSize: isMobile ? 13 : 15, margin: 0, fontWeight: 500 }}>
                Data per Sekolah Dasar (SD)
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 0, flexWrap: 'wrap' }}>
            {tabBtn('guru', 'Data Guru')}
            {tabBtn('siswa', 'Data Siswa')}
            {tabBtn('rombel', 'Data Rombel')}
            {tabBtn('rasio', 'Rasio Guru-Siswa')}
          </div>

          {/* Card */}
          <div style={{ background: 'white', border: '1px solid #9ca3af', borderRadius: '0 8px 8px 8px', padding: isMobile ? '12px' : '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#059669', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={14} /> Export CSV
              </button>
              <button onClick={exportXLS} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#2563eb', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={14} /> Export XLS
              </button>
            </div>

            {isLoading ? (
              <div style={{ padding: 20, color: '#64748b', textAlign: 'center' }}>Memuat data...</div>
            ) : error ? (
              <div style={{ padding: 20, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>{error}</div>
            ) : (
              <>
                {/* Guru Table */}
                {dataType === 'guru' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={thStyle}>No</th>
                          <th rowSpan={2} style={thStyle}>Nama Sekolah</th>
                          <th rowSpan={2} style={{ ...thStyle, whiteSpace: 'nowrap' }}>Status</th>
                          <th colSpan={pagedGuruYears.length} style={thCenterStyle}>Jumlah Guru</th>
                        </tr>
                        <tr>
                          {pagedGuruYears.map((y, i) => (
                            <th key={`gy-${y}-${i}`} style={thCenterStyle}>{y === '-' ? '-' : `Tahun ${y}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {guruGrouped.length > 0 ? (
                          <>
                            {guruGrouped.map((row, i) => (
                              <tr key={row.nama_sekolah} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{i + 1}</td>
                                <td style={tdStyle}>{row.nama_sekolah}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah) || '-'}</td>
                                {pagedGuruYears.map(y => (
                                  <td key={`gv-${row.nama_sekolah}-${y}`} style={tdCenterStyle}>
                                    {(row.perYear[y]?.jumlah_guru || 0).toLocaleString('id-ID')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            <tr style={{ background: '#e5e7eb' }}>
                              <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, background: '#e5e7eb' }}>Total per Tahun</td>
                              {pagedGuruTotals.map((v, i) => (
                                <td key={`tg-${i}`} style={{ ...tdCenterStyle, fontWeight: 700, background: '#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                              ))}
                            </tr>
                          </>
                        ) : (
                          <tr><td colSpan={3 + pagedGuruYears.length} style={{ ...tdCenterStyle, color: '#6b7280', padding: 28 }}>Data guru per sekolah tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {yearNavBar(totalYearPages, yearPage, setYearPage)}
                  </div>
                )}

                {/* Siswa Table */}
                {dataType === 'siswa' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={thStyle}>No</th>
                          <th rowSpan={2} style={thStyle}>Nama Sekolah</th>
                          <th rowSpan={2} style={{ ...thStyle, whiteSpace: 'nowrap' }}>Status</th>
                          <th colSpan={pagedSiswaYears.length} style={thCenterStyle}>Jumlah Siswa</th>
                        </tr>
                        <tr>
                          {pagedSiswaYears.map((y, i) => (
                            <th key={`sy-${y}-${i}`} style={thCenterStyle}>{y === '-' ? '-' : `Tahun ${y}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {siswaGrouped.length > 0 ? (
                          <>
                            {siswaGrouped.map((row, i) => (
                              <tr key={row.nama_sekolah} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{i + 1}</td>
                                <td style={tdStyle}>{row.nama_sekolah}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah) || '-'}</td>
                                {pagedSiswaYears.map(y => (
                                  <td key={`sv-${row.nama_sekolah}-${y}`} style={tdCenterStyle}>
                                    {(row.perYear[y]?.jumlah_siswa || 0).toLocaleString('id-ID')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            <tr style={{ background: '#e5e7eb' }}>
                              <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, background: '#e5e7eb' }}>Total per Tahun</td>
                              {pagedSiswaTotals.map((v, i) => (
                                <td key={`ts-${i}`} style={{ ...tdCenterStyle, fontWeight: 700, background: '#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                              ))}
                            </tr>
                          </>
                        ) : (
                          <tr><td colSpan={3 + pagedSiswaYears.length} style={{ ...tdCenterStyle, color: '#6b7280', padding: 28 }}>Data siswa per sekolah tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {yearNavBar(totalYearPages, yearPage, setYearPage)}
                  </div>
                )}

                {/* Rombel Table */}
                {dataType === 'rombel' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={thStyle}>No</th>
                          <th rowSpan={2} style={thStyle}>Nama Sekolah</th>
                          <th rowSpan={2} style={{ ...thStyle, whiteSpace: 'nowrap' }}>Status</th>
                          <th colSpan={pagedRombelYears.length} style={thCenterStyle}>Jumlah Rombel</th>
                        </tr>
                        <tr>
                          {pagedRombelYears.map((y, i) => (
                            <th key={`ry-${y}-${i}`} style={thCenterStyle}>{y === '-' ? '-' : `Tahun ${y}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rombelGrouped.length > 0 ? (
                          <>
                            {rombelGrouped.map((row, i) => (
                              <tr key={row.nama_sekolah} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{i + 1}</td>
                                <td style={tdStyle}>{row.nama_sekolah}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah) || '-'}</td>
                                {pagedRombelYears.map(y => (
                                  <td key={`rv-${row.nama_sekolah}-${y}`} style={tdCenterStyle}>
                                    {(row.perYear[y]?.jumlah_rombel || 0).toLocaleString('id-ID')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            <tr style={{ background: '#e5e7eb' }}>
                              <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, background: '#e5e7eb' }}>Total per Tahun</td>
                              {pagedRombelTotals.map((v, i) => (
                                <td key={`tr-${i}`} style={{ ...tdCenterStyle, fontWeight: 700, background: '#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                              ))}
                            </tr>
                          </>
                        ) : (
                          <tr><td colSpan={3 + pagedRombelYears.length} style={{ ...tdCenterStyle, color: '#6b7280', padding: 28 }}>Data rombel per sekolah tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {yearNavBar(totalYearPages, yearPage, setYearPage)}
                  </div>
                )}

                {/* Rasio Table */}
                {dataType === 'rasio' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={thStyle}>No</th>
                          <th rowSpan={2} style={thStyle}>Nama Sekolah</th>
                          <th rowSpan={2} style={{ ...thStyle, whiteSpace: 'nowrap' }}>Status</th>
                          {pagedRasioYears.map((y, i) => (
                            <th key={`rh-${y}-${i}`} colSpan={3} style={thCenterStyle}>{y === '-' ? '-' : `Tahun ${y}`}</th>
                          ))}
                        </tr>
                        <tr>
                          {pagedRasioYears.map((y, i) => (
                            <React.Fragment key={`rsub-${i}`}>
                              <th style={{ ...thCenterStyle, fontSize: 11, background: '#f3f4f6' }}>Guru</th>
                              <th style={{ ...thCenterStyle, fontSize: 11, background: '#f3f4f6' }}>Siswa</th>
                              <th style={{ ...thCenterStyle, fontSize: 11, background: '#f3f4f6' }}>Rasio</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rasioGrouped.length > 0 ? (
                          <>
                            {rasioGrouped.map((row, i) => (
                              <tr key={row.nama_sekolah} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{i + 1}</td>
                                <td style={tdStyle}>{row.nama_sekolah}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah) || '-'}</td>
                                {pagedRasioYears.map(y => {
                                  const d = row.perYear[y];
                                  const rasio = d?.rasio ?? 0;
                                  return (
                                    <React.Fragment key={`rv-${row.nama_sekolah}-${y}`}>
                                      <td style={tdCenterStyle}>{(d?.guru || 0).toLocaleString('id-ID')}</td>
                                      <td style={tdCenterStyle}>{(d?.siswa || 0).toLocaleString('id-ID')}</td>
                                      <td style={tdCenterStyle}>
                                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                                          {rasio === 0 ? '-' : rasio.toFixed(2)}
                                        </span>
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                              </tr>
                            ))}
                          </>
                        ) : (
                          <tr><td colSpan={3 + pagedRasioYears.length * 3} style={{ ...tdCenterStyle, color: '#6b7280', padding: 28 }}>Data rasio per sekolah tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {yearNavBar(totalYearPages, yearPage, setYearPage)}
                  </div>
                )}
              </>
            )}

            {/* Sumber Data */}
            <div style={{ marginTop: 12, padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '12px', color: '#0369a1' }}>📌</span>
              <span style={{ fontSize: '12px', color: '#475569' }}><strong>Sumber:</strong> Dinas Pendidikan Kota Palembang, Data Semester Ganjil</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
