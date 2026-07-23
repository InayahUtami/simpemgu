"use client";

import React, { useState, useEffect } from 'react';
import { Home, Workflow, UserCheck, Users, TrendingUp, LineChart as LineChartIcon, BarChart3, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import UserNavbar from './UserNavbar';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  suffix?: string;
  color?: string;
  change?: number | null;
  year?: number | null;
}

const ROMBEL_PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#14b8a6', '#eab308'];

function StatCard({ icon: Icon, title, value, suffix = '', color = '#3b82f6', change = null, year = null }: StatCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1.5px solid #e5e7eb',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          background: `${color}15`,
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 24, height: 24, color: color }} />
        </div>
        {change && (
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '6px',
            background: change > 0 ? '#dcfce7' : '#fee2e2',
            color: change > 0 ? '#16a34a' : '#dc2626'
          }}>
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <h3 style={{
        fontSize: '13px',
        fontWeight: '500',
        color: '#6b7280',
        margin: '0 0 4px 0',
        letterSpacing: '0.5px'
      }}>
        {title}
        {year && <span style={{ fontSize: '12px', color: '#9ca3af' }}> ({year})</span>}
      </h3>
      <p style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0',
        letterSpacing: '-0.5px'
      }}>
        {value.toLocaleString('id-ID')}{suffix}
      </p>
    </div>
  );
}

type TabType = 'overview' | 'rombel' | 'statistics';

export default function UserDashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState({ totalSekolah: 0, totalRombel: 0, tahunRombel: 0, totalGuru: 0, tahunGuru: 0, totalSiswa: 0, tahunSiswa: 0, totalPenduduk: 0, tahunPenduduk: 0 });
  const [guruPerKecamatan, setGuruPerKecamatan] = useState<any[]>([]);
  const [siswaPerKecamatan, setSiswaPerKecamatan] = useState<any[]>([]);
  const [rombelPerKecamatan, setRombelPerKecamatan] = useState<any[]>([]);
  const [pendudukPerKecamatan, setPendudukPerKecamatan] = useState<any[]>([]);
  const [guruPerSekolah, setGuruPerSekolah] = useState<any[]>([]);
  const [siswaPerSekolah, setSiswaPerSekolah] = useState<any[]>([]);
    const [rombelPerSekolah, setRombelPerSekolah] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDistrictGuru, setSelectedDistrictGuru] = useState('');
  const [yearRange, setYearRange] = useState<{ from: number; to: number }>({ from: 2024, to: 2024 });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
  const [pieRombelMode, setPieRombelMode] = useState<'kecamatan' | 'tahun'>('kecamatan');
  const [pieRombelYear, setPieRombelYear] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    setMounted(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchAll = async () => {
      try {
        const [statsRes, guruRes, siswaRes, rombelRes, pendudukRes, guruSekolahRes, siswaSekolahRes, rombelSekolahRes] = await Promise.all([
          fetch('/api/dashboard/stats', { cache: 'no-store' }),
          fetch('/api/dashboard/guru-per-kecamatan', { cache: 'no-store' }),
          fetch('/api/dashboard/siswa-per-kecamatan', { cache: 'no-store' }),
          fetch('/api/dashboard/rombel-per-kecamatan', { cache: 'no-store' }),
          fetch('/api/dashboard/penduduk-per-kecamatan', { cache: 'no-store' }),
          fetch('/api/dashboard/guru-per-sekolah', { cache: 'no-store' }),
          fetch('/api/dashboard/siswa-per-sekolah', { cache: 'no-store' }),
          fetch('/api/dashboard/rombel-per-sekolah', { cache: 'no-store' }),
        ]);
        if (statsRes.ok) { const d = await statsRes.json(); if (d.success && d.data) setStats({ totalSekolah: d.data.totalSekolah || 0, totalRombel: d.data.totalRombel || 0, tahunRombel: d.data.tahunRombel || 0, totalGuru: d.data.totalGuru || 0, tahunGuru: d.data.tahunGuru || 0, totalSiswa: d.data.totalSiswa || 0, tahunSiswa: d.data.tahunSiswa || 0, totalPenduduk: d.data.totalPenduduk || 0, tahunPenduduk: d.data.tahunPenduduk || 0 }); }
        if (guruRes.ok) { const d = await guruRes.json(); if (d.success && d.data?.detail) setGuruPerKecamatan(d.data.detail); }
        if (siswaRes.ok) { const d = await siswaRes.json(); if (d.success && d.data?.detail) setSiswaPerKecamatan(d.data.detail); }
        if (rombelRes.ok) { const d = await rombelRes.json(); if (d.success && d.data?.detail) setRombelPerKecamatan(d.data.detail); }
        if (pendudukRes.ok) { const d = await pendudukRes.json(); if (d.success && d.data?.detail) setPendudukPerKecamatan(d.data.detail); }
        if (guruSekolahRes.ok) { const d = await guruSekolahRes.json(); if (d.success && d.data?.detail) setGuruPerSekolah(d.data.detail); }
        if (siswaSekolahRes.ok) { const d = await siswaSekolahRes.json(); if (d.success && d.data?.detail) setSiswaPerSekolah(d.data.detail); }
          if (rombelSekolahRes.ok) { const d = await rombelSekolahRes.json(); if (d.success && d.data?.detail) setRombelPerSekolah(d.data.detail); }
      } catch (e) { console.error(e); }
    };
    fetchAll();
  }, [mounted]);

  useEffect(() => {
    const allData = [...guruPerKecamatan, ...siswaPerKecamatan, ...rombelPerKecamatan, ...pendudukPerKecamatan];
    const kecamatanSet = new Set<string>();
    allData.forEach((item: any) => { if (item.kecamatan) kecamatanSet.add(item.kecamatan); });
    setAllKecamatan(Array.from(kecamatanSet).sort());
    const yearSet = new Set<number>();
    allData.forEach((item: any) => { if (item.tahun) { const y = typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun; if (!isNaN(y)) yearSet.add(y); } });
    const years = Array.from(yearSet).sort((a, b) => a - b);
    setAvailableYears(years);
    if (years.length > 0) setYearRange({ from: years[years.length - 1], to: years[years.length - 1] });
  }, [guruPerKecamatan, siswaPerKecamatan, rombelPerKecamatan, pendudukPerKecamatan]);

  useEffect(() => {
    const years = Array.from(new Set(rombelPerKecamatan.map((item: any) => typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun).filter((y: number) => !isNaN(y)))).sort((a, b) => a - b);
    if (years.length > 0 && pieRombelYear === null) setPieRombelYear(years[years.length - 1]);
  }, [rombelPerKecamatan, pieRombelYear]);

  const parseYear = (tahun: any) => typeof tahun === 'string' ? parseInt(tahun.split(/[-/]/)[0]) : tahun;
  const formatAcademicYear = (tahun: any) => typeof tahun === 'string' ? tahun.replace('-', '/') : String(tahun ?? '-');

  const filterAndAggregate = (data: any[]) => {
    const filtered = data.filter(item => {
      const matchesDistrict = !selectedDistrictGuru || item.kecamatan === selectedDistrictGuru;
      const y = parseYear(item.tahun);
      return matchesDistrict && y >= yearRange.from && y <= yearRange.to;
    });
    const agg: any = {};
    filtered.forEach(item => {
      const key = item.tahun;
      if (!agg[key]) agg[key] = { tahun: item.tahun, jumlahGuru: 0, jumlahSiswa: 0, jumlahRombel: 0, jumlahPenduduk: 0 };
      Object.keys(item).forEach(k => { if (typeof item[k] === 'number' && k !== 'kecamatan_id' && k !== 'tahun') agg[key][k] = (agg[key][k] || 0) + item[k]; });
    });
    return Object.values(agg).map((item: any) => ({ ...item, tahunLabel: formatAcademicYear(item.tahun) }));
  };

  const filterBySekolah = (data: any[]) => {
    const filtered = data.filter(item => {
      const matchesDistrict = !selectedDistrictGuru || item.kecamatan === selectedDistrictGuru;
      const y = parseYear(item.tahun);
      return matchesDistrict && y >= yearRange.from && y <= yearRange.to;
    });
    const agg: any = {};
    filtered.forEach(item => {
      const key = `${item.nama_sekolah}|${item.tahun}`;
      if (!agg[key]) agg[key] = { nama_sekolah: item.nama_sekolah, tahun: item.tahun, jumlahGuru: 0, jumlahSiswa: 0 };
      if (typeof item.jumlahGuru === 'number') agg[key].jumlahGuru += item.jumlahGuru;
      if (typeof item.jumlahSiswa === 'number') agg[key].jumlahSiswa += item.jumlahSiswa;
    });
    return Object.values(agg).sort((a: any, b: any) => (b.jumlahGuru || b.jumlahSiswa || 0) - (a.jumlahGuru || a.jumlahSiswa || 0));
  };

  const mergeSekolahData = () => {
    const guruData = filterBySekolah(guruPerSekolah);
    const siswaData = filterBySekolah(siswaPerSekolah);
      // key includes tahun so each year-school is a separate row
      const merged: any = {};
      guruData.forEach((item: any) => {
        const key = `${item.nama_sekolah}|${item.tahun}`;
        if (!merged[key]) merged[key] = { nama_sekolah: item.nama_sekolah, tahun: item.tahun, jumlahGuru: 0, jumlahSiswa: 0 };
        merged[key].jumlahGuru = item.jumlahGuru;
      });
      siswaData.forEach((item: any) => {
        const key = `${item.nama_sekolah}|${item.tahun}`;
        if (!merged[key]) merged[key] = { nama_sekolah: item.nama_sekolah, tahun: item.tahun, jumlahGuru: 0, jumlahSiswa: 0 };
        merged[key].jumlahSiswa = item.jumlahSiswa;
      });
      return Object.values(merged).sort((a: any, b: any) => a.tahun.localeCompare(b.tahun) || a.nama_sekolah.localeCompare(b.nama_sekolah));
  };

    const mergeRombelSekolahData = () => {
      const filtered = rombelPerSekolah.filter((item: any) => {
        const matchesDistrict = !selectedDistrictGuru || item.kecamatan === selectedDistrictGuru;
        const y = parseYear(item.tahun);
        return matchesDistrict && y >= yearRange.from && y <= yearRange.to;
      });
      return filtered
        .map((item: any) => ({ nama_sekolah: item.nama_sekolah, tahun: item.tahun, jumlahRombel: Number(item.jumlahRombel || 0) }))
        .sort((a: any, b: any) => a.tahun.localeCompare(b.tahun) || a.nama_sekolah.localeCompare(b.nama_sekolah));
    };

  const getYearLabel = (data: any[]) => {
    if (!data.length) return '-';
    const years = data.map((item: any) => parseYear(item.tahun)).filter((y: number) => !isNaN(y)).sort((a: number, b: number) => a - b);
    if (!years.length) return '-';
    return years[0] === years[years.length - 1] ? `${years[0]}` : `${years[0]}/${years[years.length - 1]}`;
  };

  const filteredGuru = filterAndAggregate(guruPerKecamatan);
  const filteredSiswa = filterAndAggregate(siswaPerKecamatan);
  const filteredRombel = filterAndAggregate(rombelPerKecamatan);
  const filteredPenduduk = filterAndAggregate(pendudukPerKecamatan);

  const ratioGuruSiswaTrend = (() => {
    const yearSet = new Set<number>();
    filteredGuru.forEach((item: any) => {
      const y = parseYear(item.tahun);
      if (!isNaN(y)) yearSet.add(y);
    });
    filteredSiswa.forEach((item: any) => {
      const y = parseYear(item.tahun);
      if (!isNaN(y)) yearSet.add(y);
    });
    const years = Array.from(yearSet).sort((a, b) => a - b);

    return years.map((year) => {
      const guruTotal = filteredGuru.reduce((sum: number, item: any) => {
        return parseYear(item.tahun) === year ? sum + Number(item.jumlahGuru || 0) : sum;
      }, 0);
      const siswaTotal = filteredSiswa.reduce((sum: number, item: any) => {
        return parseYear(item.tahun) === year ? sum + Number(item.jumlahSiswa || 0) : sum;
      }, 0);
      const rasioGuruSiswa = guruTotal > 0 ? Number((siswaTotal / guruTotal).toFixed(2)) : 0;

      return {
        tahun: year,
        tahunLabel: String(year),
        totalGuru: guruTotal,
        totalSiswa: siswaTotal,
        rasioGuruSiswa,
      };
    });
  })();

  const guruSiswaPyramidData = ratioGuruSiswaTrend.map((item: any) => ({
    ...item,
    guru: -Number(item.totalGuru || 0),
    siswa: Number(item.totalSiswa || 0),
  }));

  const totalGuruFiltered = ratioGuruSiswaTrend.reduce((sum: number, item: any) => sum + Number(item.totalGuru || 0), 0);
  const totalSiswaFiltered = ratioGuruSiswaTrend.reduce((sum: number, item: any) => sum + Number(item.totalSiswa || 0), 0);
  const rasioTotalFiltered = totalGuruFiltered > 0 ? Number((totalSiswaFiltered / totalGuruFiltered).toFixed(2)) : 0;
  const rasioSiswaGuru = stats.totalGuru > 0 ? Number((stats.totalSiswa / stats.totalGuru).toFixed(2)) : 0;

  const maxPyramidValue = guruSiswaPyramidData.reduce((max: number, item: any) => {
    return Math.max(max, Math.abs(Number(item.guru || 0)), Math.abs(Number(item.siswa || 0)));
  }, 0);

  const pieYears = Array.from(new Set(rombelPerKecamatan.map((item: any) => parseYear(item.tahun)).filter((y: number) => !isNaN(y)))).sort((a, b) => a - b);
  const activePieYear = pieRombelYear ?? pieYears[pieYears.length - 1];

  const pieByKec = rombelPerKecamatan.filter((item: any) => parseYear(item.tahun) === activePieYear).map((item: any) => ({ name: item.kecamatan, value: Number(item.jumlahSekolah || 0) })).filter((item: any) => item.value > 0).sort((a: any, b: any) => b.value - a.value);
  const pieByTahun = pieYears.map((year: number) => ({ name: `Tahun ${year}`, value: rombelPerKecamatan.reduce((sum: number, item: any) => parseYear(item.tahun) === year ? sum + Number(item.jumlahSekolah || 0) : sum, 0) })).filter((item: any) => item.value > 0);
  const activePieData = pieRombelMode === 'kecamatan' ? pieByKec : pieByTahun;
  const totalPie = activePieData.reduce((sum: number, item: any) => sum + item.value, 0);
  const sekolahYearLabel = pieRombelMode === 'kecamatan' ? String(activePieYear || '-') : (pieYears.length ? `${pieYears[0]}-${pieYears[pieYears.length - 1]}` : '-');

  const filterSection = (
    <div style={{ background: 'white', borderRadius: '12px', padding: isMobile ? '16px 12px' : '20px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '24px', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
      <div style={{ flex: 1, minWidth: isMobile ? 'auto' : '280px' }}>
        <label style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Pilih atau Cari Kecamatan</label>
        <div style={{ position: 'relative' }}>
          <input type="text" placeholder="Cari kecamatan..." value={selectedDistrictGuru} onChange={(e) => setSelectedDistrictGuru(e.target.value)} onFocus={() => setDropdownOpen(true)}
            style={{ width: '100%', padding: isMobile ? '8px 12px' : '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: isMobile ? '13px' : '14px', boxSizing: 'border-box', background: '#f9fafb' }} />
          <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af', width: isMobile ? 16 : 18, height: isMobile ? 16 : 18 }} onClick={() => { setDropdownOpen(!dropdownOpen); if (!dropdownOpen) setSelectedDistrictGuru(''); }} />
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div onClick={() => { setSelectedDistrictGuru(''); setDropdownOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', color: '#2563eb', fontWeight: '600', borderBottom: '1px solid #f3f4f6', background: !selectedDistrictGuru ? '#f0f9ff' : 'white', fontSize: isMobile ? '12px' : '13px' }}>Semua Kecamatan</div>
              {allKecamatan.filter(k => k.toLowerCase().includes(selectedDistrictGuru.toLowerCase())).map(kecamatan => (
                <div key={kecamatan} onClick={() => { setSelectedDistrictGuru(kecamatan); setDropdownOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', color: '#374151', fontWeight: '500', borderBottom: '1px solid #f3f4f6', background: selectedDistrictGuru === kecamatan ? '#f3f4f6' : 'white', transition: 'background 0.2s', fontSize: isMobile ? '12px' : '13px' }}>{kecamatan}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ minWidth: isMobile ? 'auto' : '200px' }}>
        <label style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#374151', marginBottom: isMobile ? '6px' : '4px', display: 'block' }}>Tahun</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
          <input type="number" min={availableYears[0] || 2020} max={yearRange.to} value={yearRange.from} onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))} style={{ width: isMobile ? '60px' : '70px', padding: isMobile ? '6px' : '8px', border: '1.5px solid #e5e7eb', borderRadius: '6px', textAlign: 'center', fontSize: isMobile ? '12px' : '13px', fontWeight: '600', background: '#f9fafb' }} />
          <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>-</span>
          <input type="number" min={yearRange.from} max={availableYears[availableYears.length - 1] || 2027} value={yearRange.to} onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))} style={{ width: isMobile ? '60px' : '70px', padding: isMobile ? '6px' : '8px', border: '1.5px solid #e5e7eb', borderRadius: '6px', textAlign: 'center', fontSize: isMobile ? '12px' : '13px', fontWeight: '600', background: '#f9fafb' }} />
        </div>
      </div>
    </div>
  );

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#ffffff' }} />;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <UserNavbar />
      <main style={{ paddingTop: '76px', paddingLeft: isMobile ? '12px' : '16px', paddingRight: isMobile ? '12px' : '16px', paddingBottom: '32px' }}>
        <div style={{ padding: isMobile ? '16px' : '24px' }}>
          <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>Dashboard SIMPEMGU</h1>
            <p style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '500', color: '#6b7280', margin: '0' }}>(Sistem Pemerataan Guru Kota Palembang)</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '32px', overflowX: 'auto' }}>
            <StatCard icon={Home} title="Total Sekolah" value={stats.totalSekolah} suffix=" unit" color="#f59e42" />
            <StatCard icon={Workflow} title="Total Rombel Kecamatan" value={stats.totalRombel} suffix=" rombel" color="#3b82f6" year={stats.tahunRombel} />
            <StatCard icon={UserCheck} title="Total Guru Kecamatan" value={stats.totalGuru} suffix=" guru" color="#10b981" year={stats.tahunGuru} />
            <StatCard icon={Users} title="Total Siswa Kecamatan" value={stats.totalSiswa} suffix=" siswa" color="#a16207" year={stats.tahunSiswa} />
            <StatCard icon={Users} title="Total Penduduk Kecamatan" value={stats.totalPenduduk} suffix=" jiwa" color="#166534" year={stats.tahunPenduduk} />
            <StatCard icon={TrendingUp} title="Rasio Siswa / Guru" value={rasioSiswaGuru} color="#7c3aed" year={stats.tahunSiswa || stats.tahunGuru} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px', overflowX: 'auto', background: '#f1f5f9', borderRadius: '14px', padding: '6px' }}>
            {(['overview', 'rombel', 'statistics'] as TabType[]).map((tab) => {
              const labels: Record<TabType, string> = { overview: 'Tinjauan Umum', rombel: 'Rombel', statistics: 'Populasi' };
              const icons: Record<TabType, React.ReactNode> = {
                overview: <LineChartIcon style={{ width: 15, height: 15 }} />,
                rombel: <BarChart3 style={{ width: 15, height: 15 }} />,
                statistics: <Users style={{ width: 15, height: 15 }} />,
              };
              const isActive = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: isActive ? 'white' : 'transparent', border: 'none', borderRadius: '10px', color: isActive ? '#1e40af' : '#64748b', fontWeight: isActive ? '700' : '500', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease', whiteSpace: 'nowrap', boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.10)' : 'none', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}>
                  {icons[tab]}
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filterSection}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LineChartIcon style={{ width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, color: '#10b981' }} />
                    Tren Data Guru (Tahun {getYearLabel(filteredGuru)}) - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={filteredGuru} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <defs><linearGradient id="colorGuru" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tahunLabel" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#6b7280" />
                      <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} guru`, 'Jumlah Guru']} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Area type="monotone" dataKey="jumlahGuru" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGuru)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, color: '#a16207' }} />
                    Perbandingan Data Siswa (Tahun {getYearLabel(filteredSiswa)}) - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={filteredSiswa} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="tahunLabel" type="category" stroke="#6b7280" width={50} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} siswa`, 'Jumlah Siswa']} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Bar dataKey="jumlahSiswa" fill="#a16207" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LineChartIcon style={{ width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, color: '#10b981' }} />
                    Data Guru dan Siswa Per Sekolah - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <div style={{ overflowX: 'auto', fontSize: isMobile ? '12px' : 'inherit' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                      <thead>
                        <tr style={{ background: '#e5e7eb' }}>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>No</th>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>Nama Sekolah</th>
                            <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>Tahun</th>
                            <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>Guru</th>
                            <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderBottom: '2px solid #9ca3af' }}>Siswa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mergeSekolahData().map((row: any, idx: number) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', color: '#6b7280', fontSize: isMobile ? '11px' : '13px', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>{idx + 1}</td>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', color: '#374151', fontSize: isMobile ? '11px' : '13px', fontWeight: '500', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', maxWidth: isMobile ? '120px' : 'auto', whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: isMobile ? 'hidden' : 'visible', textOverflow: isMobile ? 'ellipsis' : 'clip' }}>{row.nama_sekolah}</td>
                              <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', color: '#6b7280', fontSize: isMobile ? '11px' : '13px', fontWeight: '600', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>{formatAcademicYear(row.tahun)}</td>
                              <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', color: '#10b981', fontSize: isMobile ? '11px' : '13px', fontWeight: '700', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>{row.jumlahGuru?.toLocaleString('id-ID') || 0}</td>
                              <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', color: '#a16207', fontSize: isMobile ? '11px' : '13px', fontWeight: '700', borderBottom: '1px solid #d1d5db' }}>{row.jumlahSiswa?.toLocaleString('id-ID') || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '12px', padding: isMobile ? '8px 10px' : '12px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#1f2937', margin: '0', lineHeight: isMobile ? 1.4 : 1.5 }}>
                       <strong>Total Guru:</strong> {mergeSekolahData().reduce((sum: number, item: any) => sum + (item.jumlahGuru || 0), 0).toLocaleString('id-ID')} | <strong>Total Siswa:</strong> {mergeSekolahData().reduce((sum: number, item: any) => sum + (item.jumlahSiswa || 0), 0).toLocaleString('id-ID')} | <strong>Total Sekolah:</strong> {new Set(mergeSekolahData().map((r: any) => r.nama_sekolah)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rombel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filterSection}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#3b82f6' }} />
                    Distribusi Rombel (Tahun {getYearLabel(filteredRombel)}) - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 320 : 450}>
                      <AreaChart data={filteredRombel} margin={{ top: 10, right: isMobile ? 8 : 30, left: 0, bottom: isMobile ? 55 : 80 }}>
                        <defs><linearGradient id="colorRombel" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tahunLabel" stroke="#6b7280" angle={isMobile ? 0 : -45} textAnchor={isMobile ? 'middle' : 'end'} height={isMobile ? 50 : 100} tick={{ fontSize: isMobile ? 11 : 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: isMobile ? 11 : 12 }} width={isMobile ? 32 : 40} />
                        <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} rombel`, 'Jumlah Rombel']} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }} />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: isMobile ? '6px' : '12px', fontSize: isMobile ? '11px' : '13px' }} />
                        <Area type="monotone" dataKey="jumlahRombel" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRombel)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#3b82f6' }} />
                    Pie Jumlah Sekolah (Tahun {sekolahYearLabel}) - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button onClick={() => setPieRombelMode('kecamatan')} style={{ padding: isMobile ? '8px 12px' : '10px 20px', borderRadius: '10px', border: '2px solid #3b82f6', background: pieRombelMode === 'kecamatan' ? '#3b82f6' : 'white', color: pieRombelMode === 'kecamatan' ? 'white' : '#3b82f6', fontWeight: 600, fontSize: isMobile ? '12px' : '14px', cursor: 'pointer' }}>Semua Kecamatan</button>
                      <button onClick={() => setPieRombelMode('tahun')} style={{ padding: isMobile ? '8px 12px' : '10px 20px', borderRadius: '10px', border: '2px solid #64748b', background: pieRombelMode === 'tahun' ? '#64748b' : 'white', color: pieRombelMode === 'tahun' ? 'white' : '#64748b', fontWeight: 600, fontSize: isMobile ? '12px' : '14px', cursor: 'pointer' }}>Total per Tahun</button>
                    </div>
                    {pieRombelMode === 'kecamatan' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>Pilih Tahun:</label>
                        <select value={activePieYear || ''} onChange={(e) => setPieRombelYear(Number(e.target.value))} style={{ padding: '8px 16px', borderRadius: '10px', border: '2px solid #10b981', fontWeight: 600, fontSize: '14px', background: 'white', color: '#059669', minWidth: '100px', cursor: 'pointer' }}>
                          {pieYears.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 390 : 430}>
                      <PieChart>
                        <Pie data={activePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={isMobile ? 96 : 130} labelLine={true}
                          label={({ value, x, y, textAnchor }: any) => (<text x={x} y={y} fill="#475569" textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 600 }}>{`${Number(value || 0).toLocaleString('id-ID')} unit`}</text>)}>
                          {activePieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={ROMBEL_PIE_COLORS[index % ROMBEL_PIE_COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} unit`, 'Jumlah Sekolah']} />
                        <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ display: isMobile ? 'none' : 'block', paddingTop: '12px', fontSize: '13px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: isMobile ? 18 : 22, height: isMobile ? 18 : 22, color: '#3b82f6' }} />
                    Data Rombel Per Sekolah - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <div style={{ overflowX: 'auto', fontSize: isMobile ? '12px' : 'inherit' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                      <thead>
                        <tr style={{ background: '#e5e7eb' }}>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>No</th>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>Nama Sekolah</th>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderRight: '1px solid #9ca3af', borderBottom: '2px solid #9ca3af' }}>Tahun</th>
                          <th style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', fontWeight: '700', color: '#374151', fontSize: isMobile ? '12px' : '14px', borderBottom: '2px solid #9ca3af' }}>Rombel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mergeRombelSekolahData().map((row: any, idx: number) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', color: '#6b7280', fontSize: isMobile ? '11px' : '13px', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>{idx + 1}</td>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'left', color: '#374151', fontSize: isMobile ? '11px' : '13px', fontWeight: '500', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', maxWidth: isMobile ? '120px' : 'auto', whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: isMobile ? 'hidden' : 'visible', textOverflow: isMobile ? 'ellipsis' : 'clip' }}>{row.nama_sekolah}</td>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', color: '#6b7280', fontSize: isMobile ? '11px' : '13px', fontWeight: '600', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>{formatAcademicYear(row.tahun)}</td>
                            <td style={{ padding: isMobile ? '8px 6px' : '12px', textAlign: 'center', color: '#3b82f6', fontSize: isMobile ? '11px' : '13px', fontWeight: '700', borderBottom: '1px solid #d1d5db' }}>{row.jumlahRombel?.toLocaleString('id-ID') || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '12px', padding: isMobile ? '8px 10px' : '12px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#1f2937', margin: '0', lineHeight: isMobile ? 1.4 : 1.5 }}>
                      <strong>Total Rombel:</strong> {mergeRombelSekolahData().reduce((sum: number, item: any) => sum + (item.jumlahRombel || 0), 0).toLocaleString('id-ID')} | <strong>Total Sekolah:</strong> {new Set(mergeRombelSekolahData().map((r: any) => r.nama_sekolah)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {filterSection}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#166534' }} />
                    Distribusi Jumlah Penduduk (Tahun {getYearLabel(filteredPenduduk)}) - BPS
                  </h2>
                  <ResponsiveContainer width="100%" height={isMobile ? 320 : 430}>
                    <BarChart data={filteredPenduduk} margin={{ top: 10, right: 30, left: 12, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tahunLabel" stroke="#6b7280" angle={isMobile ? 0 : -45} textAnchor={isMobile ? 'middle' : 'end'} height={isMobile ? 50 : 80} />
                      <YAxis stroke="#6b7280" />
                      <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} jiwa`, 'Jumlah Penduduk']} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Bar dataKey="jumlahPenduduk" fill="#166534" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '20px 16px' : '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LineChartIcon style={{ width: 22, height: 22, color: '#0ea5e9' }} />
                    Piramida Guru-Siswa (Tahun {getYearLabel(filteredGuru)}) - Dinas Pendidikan Kota Palembang (Data Semester Ganjil)
                  </h2>
                  <ResponsiveContainer width="100%" height={isMobile ? 320 : 430}>
                    <BarChart data={guruSiswaPyramidData} layout="vertical" margin={{ top: 10, right: 24, left: 12, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        stroke="#6b7280"
                        domain={[-Math.max(maxPyramidValue, 1), Math.max(maxPyramidValue, 1)]}
                        tickFormatter={(value: number) => Math.abs(value).toLocaleString('id-ID')}
                      />
                      <YAxis type="category" dataKey="tahunLabel" stroke="#6b7280" width={60} />
                      <Tooltip
                        labelFormatter={(label: any, payload: any) => {
                          const row = payload?.[0]?.payload;
                          const rasio = Number(row?.rasioGuruSiswa || 0);
                          return `Tahun ${label} | Rasio: ${rasio === 0 ? '-' : rasio.toFixed(2)}`;
                        }}
                        formatter={(value: any, name: any, payload: any) => {
                        const row = payload?.[0]?.payload;
                        if (name === 'Guru') return [`${Math.abs(Number(value || 0)).toLocaleString('id-ID')} guru`, 'Guru (kiri)'];
                        if (name === 'Siswa') return [`${Number(value || 0).toLocaleString('id-ID')} siswa`, 'Siswa (kanan)'];
                        if (name === 'rasioGuruSiswa') return [Number(value || 0).toFixed(2), 'Rasio Guru-Siswa'];
                        return [value, name];
                      }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '12px' }} />
                      <Bar dataKey="guru" name="Guru" fill="#10b981" radius={[6, 0, 0, 6]} />
                      <Bar dataKey="siswa" name="Siswa" fill="#a16207" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '10px', background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '8px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#eff6ff' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '12px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe' }}>Tahun</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe' }}>Total Guru</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe' }}>Total Siswa</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#1e3a8a', borderBottom: '1px solid #dbeafe' }}>Rasio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratioGuruSiswaTrend.map((row: any, idx: number) => (
                          <tr key={`ratio-row-${idx}`} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                            <td style={{ padding: '8px 10px', fontSize: '12px', color: '#334155', borderBottom: '1px solid #f1f5f9' }}>{row.tahunLabel}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#059669', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{Number(row.totalGuru || 0).toLocaleString('id-ID')}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#a16207', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{Number(row.totalSiswa || 0).toLocaleString('id-ID')}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', color: '#0f172a', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{Number(row.rasioGuruSiswa || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
