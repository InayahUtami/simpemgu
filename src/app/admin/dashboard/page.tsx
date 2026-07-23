"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Workflow, UserCheck, Users, TrendingUp, LineChart as LineChartIcon, BarChart3, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import Sidebar from '../components/Sidebar';
import ProfileMenu from '../components/ProfileMenu';
import { useSidebar } from '../components/SidebarContext';

// StatCard component for displaying statistics
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

function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  suffix = '', 
  color = '#3b82f6',
  change = null,
  year = null 
}: StatCardProps) {
  return (
    <div style={{
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
    }}>
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

export default function AdminDashboard() {
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState({
    totalSekolah: 0,
    totalRombel: 0,
    tahunRombel: 0,
    totalGuru: 0,
    tahunGuru: 0,
    totalSiswa: 0,
    tahunSiswa: 0,
    totalPenduduk: 0,
    tahunPenduduk: 0
  });
  const [guruPerKecamatan, setGuruPerKecamatan] = useState<any[]>([]);
  const [siswaPerKecamatan, setSiswaPerKecamatan] = useState<any[]>([]);
  const [rombelPerKecamatan, setRombelPerKecamatan] = useState<any[]>([]);
  const [pendudukPerKecamatan, setPendudukPerKecamatan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDistrictGuru, setSelectedDistrictGuru] = useState('');
  const [yearRange, setYearRange] = useState<{ from: number; to: number }>({ from: 2024, to: 2024 });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
  const [pieRombelMode, setPieRombelMode] = useState<'kecamatan' | 'tahun'>('kecamatan');
  const [pieRombelYear, setPieRombelYear] = useState<number | null>(null);

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [router]);

  // Mobile detection and mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    setMounted(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch school statistics and guru per kecamatan
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setStats({
              totalSekolah: data.data.totalSekolah || 0,
              totalRombel: data.data.totalRombel || 0,
              tahunRombel: data.data.tahunRombel || 0,
              totalGuru: data.data.totalGuru || 0,
              tahunGuru: data.data.tahunGuru || 0,
              totalSiswa: data.data.totalSiswa || 0,
              tahunSiswa: data.data.tahunSiswa || 0,
              totalPenduduk: data.data.totalPenduduk || 0,
              tahunPenduduk: data.data.tahunPenduduk || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchGuruPerKecamatan = async () => {
      try {
        const response = await fetch('/api/dashboard/guru-per-kecamatan', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.detail) {
            setGuruPerKecamatan(data.data.detail);
          }
        }
      } catch (error) {
        console.error('Error fetching guru per kecamatan:', error);
      }
    };
    
    const fetchSiswaPerKecamatan = async () => {
      try {
        const response = await fetch('/api/dashboard/siswa-per-kecamatan', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.detail) {
            setSiswaPerKecamatan(data.data.detail);
          }
        }
      } catch (error) {
        console.error('Error fetching siswa per kecamatan:', error);
      }
    };
    
    const fetchRombelPerKecamatan = async () => {
      try {
        const response = await fetch('/api/dashboard/rombel-per-kecamatan', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.detail) {
            setRombelPerKecamatan(data.data.detail);
          }
        }
      } catch (error) {
        console.error('Error fetching rombel per kecamatan:', error);
      }
    };
    
    const fetchPendudukPerKecamatan = async () => {
      try {
        const response = await fetch('/api/dashboard/penduduk-per-kecamatan', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.detail) {
            setPendudukPerKecamatan(data.data.detail);
          }
        }
      } catch (error) {
        console.error('Error fetching penduduk per kecamatan:', error);
      }
    };
    
    if (mounted) {
      fetchStats();
      fetchGuruPerKecamatan();
      fetchSiswaPerKecamatan();
      fetchRombelPerKecamatan();
      fetchPendudukPerKecamatan();
    }
  }, [mounted]);

  // Extract available kecamatan and years from fetched data
  useEffect(() => {
    const allData = [...guruPerKecamatan, ...siswaPerKecamatan, ...rombelPerKecamatan, ...pendudukPerKecamatan];
    
    // Get unique kecamatan names
    const kecamatanSet = new Set<string>();
    allData.forEach((item: any) => {
      if (item.kecamatan) {
        kecamatanSet.add(item.kecamatan);
      }
    });
    setAllKecamatan(Array.from(kecamatanSet).sort());
    
    // Get unique years
    const yearSet = new Set<number>();
    allData.forEach((item: any) => {
      if (item.tahun) {
        const year = typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun;
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    const years = Array.from(yearSet).sort((a, b) => a - b);
    setAvailableYears(years);
    
    // Set default year range to latest year
    if (years.length > 0) {
      const latestYear = years[years.length - 1];
      setYearRange({ from: latestYear, to: latestYear });
    }
  }, [guruPerKecamatan, siswaPerKecamatan, rombelPerKecamatan, pendudukPerKecamatan]);

  useEffect(() => {
    const rombelYears = Array.from(new Set(
      rombelPerKecamatan
        .map((item: any) => typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun)
        .filter((year: number) => !isNaN(year))
    )).sort((a, b) => a - b);

    if (rombelYears.length > 0 && pieRombelYear === null) {
      setPieRombelYear(rombelYears[rombelYears.length - 1]);
    }
  }, [rombelPerKecamatan, pieRombelYear]);

  // Filter data and aggregate by year for chart axes
  const filterDataByDistrictAndYear = (data: any[]) => {
    const filtered = data.filter(item => {
      const matchesDistrict = !selectedDistrictGuru || item.kecamatan === selectedDistrictGuru;
      const itemYear = typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun;
      const matchesYear = itemYear >= yearRange.from && itemYear <= yearRange.to;
      return matchesDistrict && matchesYear;
    });

    const aggregated: any = {};
    filtered.forEach(item => {
      const key = item.tahun;
      if (!aggregated[key]) {
        aggregated[key] = {
          tahun: item.tahun,
          kecamatan: item.tahun,
          jumlahGuru: 0,
          jumlahSiswa: 0,
          jumlahRombel: 0,
          jumlahPenduduk: 0
        };
      }

      Object.keys(item).forEach(k => {
        if (typeof item[k] === 'number' && k !== 'kecamatan_id' && k !== 'tahun') {
          aggregated[key][k] = (aggregated[key][k] || 0) + item[k];
        }
      });
    });

    return Object.values(aggregated).map((item: any) => ({
      ...item,
      tahunLabel: item.tahun
    }));
  };

  const getYearLabel = (data: any[]) => {
    if (!data.length) return '-';
    const years = data
      .map((item: any) => typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun)
      .filter((year: number) => !isNaN(year))
      .sort((a: number, b: number) => a - b);

    if (!years.length) return '-';
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
  };

  // Prepare filtered data for display
  const filteredGuruData = filterDataByDistrictAndYear(guruPerKecamatan);
  const filteredSiswaData = filterDataByDistrictAndYear(siswaPerKecamatan);
  const filteredRombelData = filterDataByDistrictAndYear(rombelPerKecamatan);
  const filteredPendudukData = filterDataByDistrictAndYear(pendudukPerKecamatan);
  const pieRombelAvailableYears = Array.from(new Set(
    rombelPerKecamatan
      .map((item: any) => typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun)
      .filter((year: number) => !isNaN(year))
  )).sort((a, b) => a - b);
  const activePieRombelYear = pieRombelYear ?? pieRombelAvailableYears[pieRombelAvailableYears.length - 1];
  const pieJumlahSekolahDataKecamatan = rombelPerKecamatan
    .filter((item: any) => {
      const itemYear = typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun;
      return itemYear === activePieRombelYear;
    })
    .map((item: any) => ({
      name: item.kecamatan,
      value: Number(item.jumlahSekolah || 0)
    }))
    .filter((item: any) => item.value > 0)
    .sort((a: any, b: any) => b.value - a.value);
  const pieJumlahSekolahDataTahun = pieRombelAvailableYears
    .map((year: number) => ({
      name: `Tahun ${year}`,
      value: rombelPerKecamatan.reduce((sum: number, item: any) => {
        const itemYear = typeof item.tahun === 'string' ? parseInt(item.tahun.split('-')[0]) : item.tahun;
        return itemYear === year ? sum + Number(item.jumlahSekolah || 0) : sum;
      }, 0)
    }))
    .filter((item: any) => item.value > 0);
  const activePieJumlahSekolahData = pieRombelMode === 'kecamatan' ? pieJumlahSekolahDataKecamatan : pieJumlahSekolahDataTahun;
  const totalActivePieJumlahSekolah = activePieJumlahSekolahData.reduce((sum: number, item: any) => sum + item.value, 0);
  const guruYearLabel = getYearLabel(filteredGuruData);
  const siswaYearLabel = getYearLabel(filteredSiswaData);
  const rombelYearLabel = getYearLabel(filteredRombelData);
  const pendudukYearLabel = getYearLabel(filteredPendudukData);
  const sekolahYearLabel = pieRombelMode === 'kecamatan'
    ? String(activePieRombelYear || '-')
    : (pieRombelAvailableYears.length
      ? `${pieRombelAvailableYears[0]}-${pieRombelAvailableYears[pieRombelAvailableYears.length - 1]}`
      : '-');

  // Prevent rendering until mounted (hydration fix)
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#ffffff'
      }} />
    );
  }

  return (
    <div className="admin-page-zoom" style={{ 
      minHeight: '100vh',
      background: '#ffffff'
    }}>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        <Sidebar />
        <main style={{ 
          marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '64px'), 
          flex: 1, 
          padding: isMobile ? '80px 16px 16px 16px' : '32px 16px',
          transition: 'margin-left 0.3s ease-in-out'
        }}>
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
              <ProfileMenu />
            </div>
          )}
          
          {/* Dashboard with Tabs */}
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                Dashboard SIMPEMGU
              </h1>
              <p style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', margin: '0' }}>
                (Sistem Pemerataan Guru Kota Palembang)
              </p>
            </div>

            {/* Stat Cards - Always Visible */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px', overflowX: 'auto' }}>
              <StatCard
                icon={Home}
                title="Total Sekolah"
                value={stats.totalSekolah}
                suffix=" unit"
                color="#f59e42"
              />
              <StatCard
                icon={Workflow}
                title="Total Rombel Kecamatan"
                value={stats.totalRombel}
                suffix=" rombel"
                color="#3b82f6"
                year={stats.tahunRombel}
              />
              <StatCard
                icon={UserCheck}
                title="Total Guru Kecamatan"
                value={stats.totalGuru}
                suffix=" guru"
                color="#10b981"
                year={stats.tahunGuru}
              />
              <StatCard
                icon={Users}
                title="Total Siswa Kecamatan"
                value={stats.totalSiswa}
                suffix=" siswa"
                color="#a16207"
                year={stats.tahunSiswa}
              />
              <StatCard
                icon={Users}
                title="Total Penduduk Kecamatan"
                value={stats.totalPenduduk}
                suffix=" jiwa"
                color="#166534"
                year={stats.tahunPenduduk}
              />
            </div>

            {/* Tab Navigation - Below StatCards */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '0',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '12px 20px',
                  background: activeTab === 'overview' ? '#ffffff' : 'transparent',
                  border: activeTab === 'overview' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                  borderBottom: activeTab === 'overview' ? 'none' : '1.5px solid #e5e7eb',
                  borderRadius: '8px 8px 0 0',
                  color: activeTab === 'overview' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'overview' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Tinjauan Umum
              </button>
              <button
                onClick={() => setActiveTab('rombel')}
                style={{
                  padding: '12px 20px',
                  background: activeTab === 'rombel' ? '#ffffff' : 'transparent',
                  border: activeTab === 'rombel' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                  borderBottom: activeTab === 'rombel' ? 'none' : '1.5px solid #e5e7eb',
                  borderRadius: '8px 8px 0 0',
                  color: activeTab === 'rombel' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'rombel' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Rombel
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                style={{
                  padding: '12px 20px',
                  background: activeTab === 'statistics' ? '#ffffff' : 'transparent',
                  border: activeTab === 'statistics' ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                  borderBottom: activeTab === 'statistics' ? 'none' : '1.5px solid #e5e7eb',
                  borderRadius: '8px 8px 0 0',
                  color: activeTab === 'statistics' ? '#3b82f6' : '#6b7280',
                  fontWeight: activeTab === 'statistics' ? '600' : '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Populasi
              </button>
            </div>

            {/* Tinjauan Umum Tab - dengan AreaChart */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Filter Section Inside Tab */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end'
                }}>
                  {/* Kecamatan Search */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
                      Pilih atau Cari Kecamatan
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Cari kecamatan..."
                        value={selectedDistrictGuru}
                        onChange={(e) => setSelectedDistrictGuru(e.target.value)}
                        onFocus={() => setDropdownOpen(true)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          background: '#f9fafb'
                        }}
                      />
                      <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af', width: 18, height: 18 }}
                        onClick={() => {
                          setDropdownOpen(!dropdownOpen);
                          if (!dropdownOpen) setSelectedDistrictGuru('');
                        }}
                      />
                      
                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 50,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}>
                          <div
                            onClick={() => {
                              setSelectedDistrictGuru('');
                              setDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              color: '#2563eb',
                              fontWeight: '600',
                              borderBottom: '1px solid #f3f4f6',
                              background: !selectedDistrictGuru ? '#f0f9ff' : 'white'
                            }}
                          >
                            Semua Kecamatan
                          </div>
                          {allKecamatan
                            .filter(k => k.toLowerCase().includes(selectedDistrictGuru.toLowerCase()))
                            .map(kecamatan => (
                              <div
                                key={kecamatan}
                                onClick={() => {
                                  setSelectedDistrictGuru(kecamatan);
                                  setDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  color: '#374151',
                                  fontWeight: '500',
                                  borderBottom: '1px solid #f3f4f6',
                                  background: selectedDistrictGuru === kecamatan ? '#f3f4f6' : 'white',
                                  transition: 'background 0.2s'
                                }}
                              >
                                {kecamatan}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Year Range Filter */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Tahun
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min={availableYears[0] || 2020}
                          max={yearRange.to}
                          value={yearRange.from}
                          onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                        <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                        <input
                          type="number"
                          min={yearRange.from}
                          max={availableYears[availableYears.length - 1] || 2027}
                          value={yearRange.to}
                          onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' }}>
                {/* Guru Per Kecamatan - AreaChart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LineChartIcon style={{ width: 22, height: 22, color: '#10b981' }} />
                    Tren Data Guru (Tahun {guruYearLabel}) - Dinas Pendidikan
                  </h2>
                  
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart
                      data={filteredGuruData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="colorGuru" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tahunLabel" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} guru`, 'Jumlah Guru']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Area type="monotone" dataKey="jumlahGuru" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGuru)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Siswa Per Kecamatan - BarChart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#a16207' }} />
                    Perbandingan Data Siswa (Tahun {siswaYearLabel}) - Dinas Pendidikan
                  </h2>
                  
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={filteredSiswaData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="tahunLabel" type="category" stroke="#6b7280" width={50} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} siswa`, 'Jumlah Siswa']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Bar dataKey="jumlahSiswa" fill="#a16207" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            )}

            {/* Rombel Per Kecamatan Tab - dengan AreaChart dan gradient */}
            {activeTab === 'rombel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Filter Section Inside Tab */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end'
                }}>
                  {/* Kecamatan Search */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
                      Pilih atau Cari Kecamatan
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Cari kecamatan..."
                        value={selectedDistrictGuru}
                        onChange={(e) => setSelectedDistrictGuru(e.target.value)}
                        onFocus={() => setDropdownOpen(true)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          background: '#f9fafb'
                        }}
                      />
                      <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af', width: 18, height: 18 }}
                        onClick={() => {
                          setDropdownOpen(!dropdownOpen);
                          if (!dropdownOpen) setSelectedDistrictGuru('');
                        }}
                      />
                      
                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 50,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}>
                          <div
                            onClick={() => {
                              setSelectedDistrictGuru('');
                              setDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              color: '#2563eb',
                              fontWeight: '600',
                              borderBottom: '1px solid #f3f4f6',
                              background: !selectedDistrictGuru ? '#f0f9ff' : 'white'
                            }}
                          >
                            Semua Kecamatan
                          </div>
                          {allKecamatan
                            .filter(k => k.toLowerCase().includes(selectedDistrictGuru.toLowerCase()))
                            .map(kecamatan => (
                              <div
                                key={kecamatan}
                                onClick={() => {
                                  setSelectedDistrictGuru(kecamatan);
                                  setDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  color: '#374151',
                                  fontWeight: '500',
                                  borderBottom: '1px solid #f3f4f6',
                                  background: selectedDistrictGuru === kecamatan ? '#f3f4f6' : 'white',
                                  transition: 'background 0.2s'
                                }}
                              >
                                {kecamatan}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Year Range Filter */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                      Tahun
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min={availableYears[0] || 2020}
                        max={yearRange.to}
                        value={yearRange.from}
                        onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                      <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                      <input
                        type="number"
                        min={yearRange.from}
                        max={availableYears[availableYears.length - 1] || 2027}
                        value={yearRange.to}
                        onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                        style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                      />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: isMobile ? '20px 16px' : '32px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1.5px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}>
                    <div style={{ minHeight: isMobile ? 'auto' : '120px', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 style={{ width: 22, height: 22, color: '#3b82f6' }} />
                        Distribusi Rombel (Tahun {rombelYearLabel}) - Dinas Pendidikan
                      </h2>
                    </div>

                    <div style={{ flex: 1 }}>
                      <ResponsiveContainer width="100%" height={isMobile ? 320 : 450}>
                        <AreaChart
                          data={filteredRombelData}
                          margin={{ top: 10, right: isMobile ? 8 : 30, left: 0, bottom: isMobile ? 55 : 80 }}
                        >
                          <defs>
                            <linearGradient id="colorRombel" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="tahunLabel" 
                            stroke="#6b7280"
                            angle={isMobile ? 0 : -45}
                            textAnchor={isMobile ? 'middle' : 'end'}
                            height={isMobile ? 50 : 100}
                            tick={{ fontSize: isMobile ? 11 : 12 }}
                          />
                          <YAxis stroke="#6b7280" tick={{ fontSize: isMobile ? 11 : 12 }} width={isMobile ? 32 : 40} />
                          <Tooltip
                            formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} rombel`, 'Jumlah Rombel']}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '12px'
                            }}
                          />
                          <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            iconType="line"
                            wrapperStyle={{
                              paddingTop: isMobile ? '6px' : '12px',
                              fontSize: isMobile ? '11px' : '13px',
                              lineHeight: isMobile ? '16px' : '20px'
                            }}
                          />
                          <Area type="monotone" dataKey="jumlahRombel" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRombel)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ marginTop: '24px', padding: '16px', background: '#eff6ff', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                      <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#1f2937', margin: '0', lineHeight: 1.6 }}>
                        <strong>Total Rombel:</strong> {stats.totalRombel.toLocaleString('id-ID')} ({stats.tahunRombel}) | 
                        <strong style={{ marginLeft: '16px' }}>Kecamatan Tertinggi:</strong> {filteredRombelData[0]?.kecamatan || rombelPerKecamatan[0]?.kecamatan || '-'} ({(filteredRombelData[0]?.jumlahRombel || rombelPerKecamatan[0]?.jumlahRombel || 0).toLocaleString('id-ID')} rombel)
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: isMobile ? '20px 16px' : '32px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1.5px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}>
                    <div style={{ minHeight: isMobile ? 'auto' : '120px', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 style={{ width: 22, height: 22, color: '#3b82f6' }} />
                        Pie Jumlah Sekolah (Tahun {sekolahYearLabel}) - Dinas Pendidikan
                      </h2>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                          <button
                            onClick={() => setPieRombelMode('kecamatan')}
                            style={{
                              padding: isMobile ? '8px 12px' : '10px 20px',
                              borderRadius: '10px',
                              border: '2px solid #3b82f6',
                              background: pieRombelMode === 'kecamatan' ? '#3b82f6' : 'white',
                              color: pieRombelMode === 'kecamatan' ? 'white' : '#3b82f6',
                              fontWeight: 600,
                              fontSize: isMobile ? '12px' : '14px',
                              cursor: 'pointer',
                              boxShadow: pieRombelMode === 'kecamatan' ? '0 4px 8px rgba(59,130,246,0.2)' : '0 2px 4px rgba(59,130,246,0.1)',
                              flex: isMobile ? 1 : 'none'
                            }}
                          >
                            Semua Kecamatan
                          </button>
                          <button
                            onClick={() => setPieRombelMode('tahun')}
                            style={{
                              padding: isMobile ? '8px 12px' : '10px 20px',
                              borderRadius: '10px',
                              border: '2px solid #64748b',
                              background: pieRombelMode === 'tahun' ? '#64748b' : 'white',
                              color: pieRombelMode === 'tahun' ? 'white' : '#64748b',
                              fontWeight: 600,
                              fontSize: isMobile ? '12px' : '14px',
                              cursor: 'pointer',
                              boxShadow: pieRombelMode === 'tahun' ? '0 4px 8px rgba(100,116,139,0.2)' : '0 2px 4px rgba(100,116,139,0.1)',
                              flex: isMobile ? 1 : 'none'
                            }}
                          >
                            Total per Tahun
                          </button>
                        </div>
                        {pieRombelMode === 'kecamatan' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                            <label htmlFor="pieRombelYearSelect" style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '14px', color: '#374151' }}>
                              Pilih Tahun:
                            </label>
                            <select
                              id="pieRombelYearSelect"
                              value={activePieRombelYear || ''}
                              onChange={(e) => setPieRombelYear(Number(e.target.value))}
                              style={{
                                padding: isMobile ? '7px 12px' : '8px 16px',
                                borderRadius: '10px',
                                border: '2px solid #10b981',
                                fontWeight: 600,
                                fontSize: isMobile ? '12px' : '14px',
                                background: 'white',
                                color: '#059669',
                                minWidth: '100px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(16,185,129,0.1)',
                                flex: isMobile ? 1 : 'none'
                              }}
                            >
                              {pieRombelAvailableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <ResponsiveContainer width="100%" height={isMobile ? 390 : 430}>
                        <PieChart>
                          <Pie
                            data={activePieJumlahSekolahData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy={isMobile ? '44%' : '45%'}
                            outerRadius={isMobile ? 96 : 130}
                            labelLine={true}
                            label={({ value, x, y, textAnchor }: any) => {
                              const text = `${Number(value || 0).toLocaleString('id-ID')} unit`;
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill="#475569"
                                  textAnchor={textAnchor}
                                  dominantBaseline="central"
                                  style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 600 }}
                                >
                                  {text}
                                </text>
                              );
                            }}
                          >
                            {activePieJumlahSekolahData.map((entry, index) => (
                              <Cell key={`rombel-sekolah-${entry.name}-${index}`} fill={ROMBEL_PIE_COLORS[index % ROMBEL_PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} unit`, 'Jumlah Sekolah']} />
                          <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{
                              display: isMobile ? 'none' : 'block',
                              paddingTop: isMobile ? '6px' : '12px',
                              fontSize: isMobile ? '11px' : '13px',
                              lineHeight: isMobile ? '16px' : '20px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {isMobile && activePieJumlahSekolahData.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                      }}>
                        {activePieJumlahSekolahData.map((item: any, index: number) => {
                          return (
                            <div
                              key={`mobile-rombel-legend-${item.name}-${index}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                padding: '10px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                background: '#f8fafc'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                <span style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '999px',
                                  background: ROMBEL_PIE_COLORS[index % ROMBEL_PIE_COLORS.length],
                                  flexShrink: 0
                                }} />
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#1f2937',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {item.name}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>
                                  {item.value.toLocaleString('id-ID')}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  unit
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ marginTop: '16px', padding: '16px', background: '#eff6ff', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                      <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#1f2937', margin: '0', lineHeight: 1.6 }}>
                        <strong>{pieRombelMode === 'kecamatan' ? `Total Sekolah (Tahun ${activePieRombelYear || '-'})` : 'Total Sekolah Semua Tahun'}:</strong> {totalActivePieJumlahSekolah.toLocaleString('id-ID')} |
                        <strong style={{ marginLeft: '16px' }}>{pieRombelMode === 'kecamatan' ? 'Kecamatan Tertinggi' : 'Tahun Tertinggi'}:</strong> {activePieJumlahSekolahData[0]?.name || '-'} ({(activePieJumlahSekolahData[0]?.value || 0).toLocaleString('id-ID')} unit)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistik Tab - Jumlah Penduduk Per Kecamatan dengan BarChart */}
            {activeTab === 'statistics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Filter Section Inside Tab */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end'
                }}>
                  {/* Kecamatan Search */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
                      Pilih atau Cari Kecamatan
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Cari kecamatan..."
                        value={selectedDistrictGuru}
                        onChange={(e) => setSelectedDistrictGuru(e.target.value)}
                        onFocus={() => setDropdownOpen(true)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1.5px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          background: '#f9fafb'
                        }}
                      />
                      <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af', width: 18, height: 18 }}
                        onClick={() => {
                          setDropdownOpen(!dropdownOpen);
                          if (!dropdownOpen) setSelectedDistrictGuru('');
                        }}
                      />
                      
                      {/* Dropdown Menu */}
                      {dropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 50,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}>
                          <div
                            onClick={() => {
                              setSelectedDistrictGuru('');
                              setDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              color: '#2563eb',
                              fontWeight: '600',
                              borderBottom: '1px solid #f3f4f6',
                              background: !selectedDistrictGuru ? '#f0f9ff' : 'white'
                            }}
                          >
                            Semua Kecamatan
                          </div>
                          {allKecamatan
                            .filter(k => k.toLowerCase().includes(selectedDistrictGuru.toLowerCase()))
                            .map(kecamatan => (
                              <div
                                key={kecamatan}
                                onClick={() => {
                                  setSelectedDistrictGuru(kecamatan);
                                  setDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  color: '#374151',
                                  fontWeight: '500',
                                  borderBottom: '1px solid #f3f4f6',
                                  background: selectedDistrictGuru === kecamatan ? '#f3f4f6' : 'white',
                                  transition: 'background 0.2s'
                                }}
                              >
                                {kecamatan}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Year Range Filter */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }}>
                        Tahun
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min={availableYears[0] || 2020}
                          max={yearRange.to}
                          value={yearRange.from}
                          onChange={(e) => setYearRange(r => ({ ...r, from: Math.max(availableYears[0] || 2020, Math.min(Number(e.target.value), r.to)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                        <span style={{ fontWeight: '700', color: '#9ca3af', fontSize: '12px' }}>–</span>
                        <input
                          type="number"
                          min={yearRange.from}
                          max={availableYears[availableYears.length - 1] || 2027}
                          value={yearRange.to}
                          onChange={(e) => setYearRange(r => ({ ...r, to: Math.min(availableYears[availableYears.length - 1] || 2027, Math.max(Number(e.target.value), r.from)) }))}
                          style={{
                            width: '70px',
                            padding: '8px 8px',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1.5px solid #e5e7eb'
                }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#166534' }} />
                    Distribusi Jumlah Penduduk (Tahun {pendudukYearLabel}) - BPS
                  </h2>
                  
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart
                        data={filteredPendudukData}
                      margin={{ top: 10, right: 30, left: 12, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="tahunLabel"
                        stroke="#6b7280"
                        angle={0}
                        textAnchor="middle"
                        height={50}
                        tick={{ fontSize: 12 }}
                        tickMargin={8}
                        minTickGap={16}
                        padding={{ left: 16, right: 16 }}
                        tickFormatter={(value: any) => String(value)}
                      />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value: any) => [`${value?.toLocaleString('id-ID') || '0'} jiwa`, 'Jumlah Penduduk']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="line" wrapperStyle={{ paddingTop: '12px' }} />
                      <Bar
                        dataKey="jumlahPenduduk"
                        fill="#166534"
                        name="Jumlah Penduduk"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
