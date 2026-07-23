'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Save, X, Download } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import ProfileMenu from '../../../components/ProfileMenu';
import { useSidebar } from '../../../components/SidebarContext';

interface Kecamatan {
  id: number;
  nama: string;
}

interface GuruPerSekolah {
  no: number;
  nama_sekolah: string;
  tahun: string;
  jumlah_guru: number;
}

interface SiswaPerSekolah {
  no: number;
  nama_sekolah: string;
  tahun: string;
  jumlah_siswa: number;
}

interface RombelPerSekolah {
  no: number;
  nama_sekolah: string;
  tahun: string;
  jumlah_rombel: number;
}

interface SekolahData {
  id: number;
  nama_sekolah: string;
  status: 'Negeri' | 'Swasta';
}

export default function KecamatanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isSidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile' >('data');
  
  const kecamatanId = params?.id;
  const dataType = searchParams.get('type') || 'guru';
  const kecamatanName = searchParams.get('name') || 'Kecamatan';
  
  const [kecamatan, setKecamatan] = useState<Kecamatan | null>(null);
  const [guruData, setGuruData] = useState<GuruPerSekolah[]>([]);
  const [siswaData, setSiswaData] = useState<SiswaPerSekolah[]>([]);
  const [rombelData, setRombelData] = useState<RombelPerSekolah[]>([]);
  const [sekolahData, setSekolahData] = useState<SekolahData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ── New feature state ──────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [deleteYearModal, setDeleteYearModal] = useState({ open: false, tahun: '' });
  const [notification, setNotification] = useState({ show: false, type: 'success' as 'success' | 'error' | 'info', title: '', message: '' });

  const YEARS_PER_PAGE = 5;
  const [yearPage, setYearPage] = useState(0);

  const showNotif = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => setNotification(p => ({ ...p, show: false })), 4000);
  }, []);

  const apiBase = dataType === 'guru'
    ? '/api/data/guru-per-sekolah'
    : dataType === 'siswa'
    ? '/api/data/siswa-per-sekolah'
    : '/api/data/rombel-per-sekolah';

  const getEditKey = (nama_sekolah: string, tahun: string) => `${nama_sekolah}||${tahun}`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch semua data secara parallel
      const [kecRes, guruRes, siswaRes, rombelRes, sekolahRes] = await Promise.all([
        fetch(`/api/data/kecamatan-detail?id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/guru-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/siswa-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/rombel-per-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
        fetch(`/api/data/nama-sekolah?kecamatan_id=${kecamatanId}`, { cache: 'no-store' }),
      ]);

      // Process kecamatan info
      if (kecRes.ok) {
        const kecData = await kecRes.json();
        if (kecData.success && kecData.data) {
          setKecamatan(kecData.data);
        }
      }

      // Process guru data per sekolah
      if (guruRes.ok) {
        const guruResult = await guruRes.json();
        if (guruResult.success) {
          setGuruData(guruResult.data || []);
        }
      }

      // Process siswa data per sekolah
      if (siswaRes.ok) {
        const siswaResult = await siswaRes.json();
        if (siswaResult.success) {
          setSiswaData(siswaResult.data || []);
        }
      }

      // Process rombel data per sekolah
      if (rombelRes.ok) {
        const rombelResult = await rombelRes.json();
        if (rombelResult.success) {
          setRombelData(rombelResult.data || []);
        }
      }

      // Process sekolah data per kecamatan
      if (sekolahRes.ok) {
        const sekolahResult = await sekolahRes.json();
        if (sekolahResult.success) {
          setSekolahData(sekolahResult.data || []);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [kecamatanId]);

  useEffect(() => {
    if (kecamatanId) {
      fetchData();
    }
  }, [kecamatanId, fetchData]);

  useEffect(() => { setYearPage(0); }, [dataType]);

  // ── Feature handlers ──────────────────────────────────────
  const handleEnterEdit = () => {
    const displayRows = dataType === 'guru' ? guruDisplayRows : dataType === 'siswa' ? siswaDisplayRows : rombelDisplayRows;
    const displayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : rombelDisplayYears;
    const vals: Record<string, number> = {};
    displayRows.forEach(row => {
      displayYears.forEach(tahun => {
        const perYear = row.perYear as any;
        const val = dataType === 'guru' ? perYear[tahun]?.jumlah_guru : dataType === 'siswa' ? perYear[tahun]?.jumlah_siswa : perYear[tahun]?.jumlah_rombel;
        vals[getEditKey(row.nama_sekolah, tahun)] = Number(val || 0);
      });
    });
    setEditValues(vals);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => { setIsEditMode(false); setEditValues({}); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(editValues).map(([key, value]) => {
        const [nama_sekolah, tahun] = key.split('||');
        return { nama_sekolah, kecamatan_id: Number(kecamatanId), tahun, value };
      });
      const res = await fetch(apiBase, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const result = await res.json();
      if (result.success) {
        showNotif('success', 'Data Tersimpan!', 'Perubahan berhasil disimpan ke database');
        setIsEditMode(false);
        setEditValues({});
        fetchData();
      } else {
        showNotif('error', 'Gagal Menyimpan', result.error || 'Terjadi kesalahan');
      }
    } catch {
      showNotif('error', 'Gagal Menyimpan', 'Terjadi kesalahan jaringan');
    }
    setIsSaving(false);
  };

  const handleAddYear = async () => {
    if (!newYear.trim()) return;
    setIsAddingYear(true);
    try {
      const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kecamatan_id: Number(kecamatanId), tahun: newYear.trim() }) });
      const result = await res.json();
      if (result.success) {
        showNotif('success', 'Tahun Ditambahkan!', `Tahun ${newYear} berhasil ditambahkan untuk semua sekolah`);
        setShowAddYearModal(false);
        setNewYear('');
        fetchData();
      } else {
        showNotif('error', 'Gagal Tambah Tahun', result.error || 'Terjadi kesalahan');
      }
    } catch {
      showNotif('error', 'Gagal', 'Terjadi kesalahan jaringan');
    }
    setIsAddingYear(false);
  };

  const confirmDeleteYear = async () => {
    try {
      const res = await fetch(`${apiBase}?kecamatan_id=${kecamatanId}&tahun=${encodeURIComponent(deleteYearModal.tahun)}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showNotif('success', 'Tahun Dihapus!', `Tahun ${deleteYearModal.tahun} berhasil dihapus`);
        setDeleteYearModal({ open: false, tahun: '' });
        fetchData();
      } else {
        showNotif('error', 'Gagal Hapus', result.error || 'Terjadi kesalahan');
      }
    } catch {
      showNotif('error', 'Gagal', 'Terjadi kesalahan jaringan');
    }
  };

  const getEditValue = (nama_sekolah: string, year: string, defaultValue: number) => {
    const key = getEditKey(nama_sekolah, year);
    if (isEditMode && Object.prototype.hasOwnProperty.call(editValues, key)) {
      return Number(editValues[key] || 0);
    }
    return defaultValue;
  };

  const exportCSV = () => {
    const displayRows = dataType === 'guru' ? guruDisplayRows : dataType === 'siswa' ? siswaDisplayRows : rombelDisplayRows;
    const displayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : rombelDisplayYears;
    const valueKey = dataType === 'guru' ? 'jumlah_guru' : dataType === 'siswa' ? 'jumlah_siswa' : 'jumlah_rombel';
    const headers = ['No', 'Nama Sekolah', 'Status', ...displayYears.map(y => `Tahun ${y}`)];
    const csvRows = displayRows.map((row, idx) => [
      idx + 1,
      `"${row.nama_sekolah}"`,
      sekolahStatusMap.get(row.nama_sekolah) || '-',
      ...displayYears.map(y => {
        const defaultValue = (row.perYear as any)[y]?.[valueKey] || 0;
        return getEditValue(row.nama_sekolah, y, defaultValue);
      }),
    ]);
    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_${dataType}_kecamatan_${kecamatanName}.csv`;
    link.click();
  };

  const totalGuru = guruData.reduce((sum, row) => sum + Number(row.jumlah_guru || 0), 0);
  const totalSiswa = siswaData.reduce((sum, row) => sum + Number(row.jumlah_siswa || 0), 0);
  const totalRombel = rombelData.reduce((sum, row) => sum + Number(row.jumlah_rombel || 0), 0);
  const totalSekolah = sekolahData.length;
  const sekolahNegeri = sekolahData.filter(s => s.status === 'Negeri').length;
  const sekolahSwasta = sekolahData.filter(s => s.status === 'Swasta').length;

  const sekolahStatusMap = useMemo(() => {
    const map = new Map<string, 'Negeri' | 'Swasta'>(sekolahData.map((s) => [s.nama_sekolah, s.status]));
    return map;
  }, [sekolahData]);

  const guruYears = useMemo(() => {
    return Array.from(new Set(guruData.map((row) => row.tahun))).sort((a, b) => a.localeCompare(b));
  }, [guruData]);

  const siswaYears = useMemo(() => {
    return Array.from(new Set(siswaData.map((row) => row.tahun))).sort((a, b) => a.localeCompare(b));
  }, [siswaData]);

  const rombelYears = useMemo(() => {
    return Array.from(new Set(rombelData.map((row) => row.tahun))).sort((a, b) => a.localeCompare(b));
  }, [rombelData]);

  const guruDisplayYears = guruYears.length > 0 ? guruYears : ['-'];
  const siswaDisplayYears = siswaYears.length > 0 ? siswaYears : ['-'];
  const rombelDisplayYears = rombelYears.length > 0 ? rombelYears : ['-'];

  const guruGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, GuruPerSekolah> }>();

    guruData.forEach((row) => {
      if (!map.has(row.nama_sekolah)) {
        map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      }
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });

    return Array.from(map.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [guruData]);

  const guruDisplayRows = useMemo(() => {
    const baseMap = new Map<string, { nama_sekolah: string; perYear: Record<string, GuruPerSekolah> }>();
    guruGrouped.forEach((row) => baseMap.set(row.nama_sekolah, row));
    sekolahData.forEach((s) => {
      if (!baseMap.has(s.nama_sekolah)) {
        baseMap.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} });
      }
    });
    return Array.from(baseMap.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [guruGrouped, sekolahData]);

  const siswaGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, SiswaPerSekolah> }>();

    siswaData.forEach((row) => {
      if (!map.has(row.nama_sekolah)) {
        map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      }
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });

    return Array.from(map.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [siswaData]);

  const siswaDisplayRows = useMemo(() => {
    const baseMap = new Map<string, { nama_sekolah: string; perYear: Record<string, SiswaPerSekolah> }>();
    siswaGrouped.forEach((row) => baseMap.set(row.nama_sekolah, row));
    sekolahData.forEach((s) => {
      if (!baseMap.has(s.nama_sekolah)) {
        baseMap.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} });
      }
    });
    return Array.from(baseMap.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [siswaGrouped, sekolahData]);

  const rombelGrouped = useMemo(() => {
    const map = new Map<string, { nama_sekolah: string; perYear: Record<string, RombelPerSekolah> }>();

    rombelData.forEach((row) => {
      if (!map.has(row.nama_sekolah)) {
        map.set(row.nama_sekolah, { nama_sekolah: row.nama_sekolah, perYear: {} });
      }
      map.get(row.nama_sekolah)!.perYear[row.tahun] = row;
    });

    return Array.from(map.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [rombelData]);

  const rombelDisplayRows = useMemo(() => {
    const baseMap = new Map<string, { nama_sekolah: string; perYear: Record<string, RombelPerSekolah> }>();
    rombelGrouped.forEach((row) => baseMap.set(row.nama_sekolah, row));
    sekolahData.forEach((s) => {
      if (!baseMap.has(s.nama_sekolah)) {
        baseMap.set(s.nama_sekolah, { nama_sekolah: s.nama_sekolah, perYear: {} });
      }
    });
    return Array.from(baseMap.values()).sort((a, b) => a.nama_sekolah.localeCompare(b.nama_sekolah));
  }, [rombelGrouped, sekolahData]);

  const totalGuruByYear = useMemo(() => {
    return guruDisplayYears.map((year) =>
      year === '-' ? 0 : guruDisplayRows.reduce((sum, row) => {
        const defaultValue = row.perYear[year]?.jumlah_guru || 0;
        return sum + getEditValue(row.nama_sekolah, year, defaultValue);
      }, 0)
    );
  }, [guruDisplayRows, guruDisplayYears, isEditMode, editValues]);

  const totalSiswaByYear = useMemo(() => {
    return siswaDisplayYears.map((year) =>
      year === '-' ? 0 : siswaDisplayRows.reduce((sum, row) => {
        const defaultValue = row.perYear[year]?.jumlah_siswa || 0;
        return sum + getEditValue(row.nama_sekolah, year, defaultValue);
      }, 0)
    );
  }, [siswaDisplayRows, siswaDisplayYears, isEditMode, editValues]);

  const totalRombelByYear = useMemo(() => {
    return rombelDisplayYears.map((year) =>
      year === '-' ? 0 : rombelDisplayRows.reduce((sum, row) => {
        const defaultValue = row.perYear[year]?.jumlah_rombel || 0;
        return sum + getEditValue(row.nama_sekolah, year, defaultValue);
      }, 0)
    );
  }, [rombelDisplayRows, rombelDisplayYears, isEditMode, editValues]);

  const yearStart = yearPage * YEARS_PER_PAGE;
  const pagedGuruYears = guruDisplayYears[0] !== '-' ? guruDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : guruDisplayYears;
  const pagedGuruTotals = totalGuruByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const pagedSiswaYears = siswaDisplayYears[0] !== '-' ? siswaDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : siswaDisplayYears;
  const pagedSiswaTotals = totalSiswaByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const pagedRombelYears = rombelDisplayYears[0] !== '-' ? rombelDisplayYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : rombelDisplayYears;
  const pagedRombelTotals = totalRombelByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);
  const activeDisplayYears = dataType === 'guru' ? guruDisplayYears : dataType === 'siswa' ? siswaDisplayYears : rombelDisplayYears;
  const totalYearPages = Math.max(1, Math.ceil(activeDisplayYears.filter(y => y !== '-').length / YEARS_PER_PAGE));

  return (
    <div className="admin-page-zoom" style={{ minHeight: '100vh', background: 'white' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skeleton-loading { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmer 0.5s infinite; }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeInModal { from{opacity:0}to{opacity:1} }
        @keyframes popUpModal { 0%{transform:scale(0.85)}100%{transform:scale(1)} }
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>

      {/* Notification Toast */}
      {notification.show && (
        <div style={{ position:'fixed',top:'20px',right:'20px',zIndex:9999,minWidth:'300px',maxWidth:'460px',backgroundColor:'white',borderRadius:'12px',boxShadow:'0 20px 40px rgba(0,0,0,0.18)',border:`2px solid ${notification.type==='success'?'#10b981':notification.type==='error'?'#ef4444':'#3b82f6'}`,animation:'slideInRight 0.3s ease',overflow:'hidden' }}>
          <div style={{ background:`${notification.type==='success'?'#10b981':notification.type==='error'?'#ef4444':'#3b82f6'}`,padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px' }}>
            <span style={{ color:'white',fontWeight:'700',fontSize:'16px' }}>{notification.type==='success'?'✓':notification.type==='error'?'✕':'ℹ'}</span>
            <div style={{ flex:1 }}>
              <div style={{ color:'white',fontWeight:'700',fontSize:'13px' }}>{notification.title}</div>
              <div style={{ color:'rgba(255,255,255,0.9)',fontSize:'12px' }}>{notification.message}</div>
            </div>
            <button onClick={()=>setNotification(p=>({...p,show:false}))} style={{ background:'none',border:'none',color:'white',fontSize:'18px',cursor:'pointer',padding:'2px' }}>×</button>
          </div>
        </div>
      )}

      {/* Add Year Modal */}
      {showAddYearModal && (
        <div style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(30,41,59,0.25)',backdropFilter:'blur(4px)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeInModal 0.2s' }}>
          <div style={{ background:'white',borderRadius:'16px',boxShadow:'0 12px 32px rgba(30,41,59,0.18)',padding:'28px 24px',minWidth:'320px',maxWidth:'90vw',animation:'popUpModal 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <h2 style={{ fontSize:'16px',fontWeight:'700',color:'#1f2937',margin:'0 0 16px 0' }}>Tambah Tahun</h2>
            <p style={{ fontSize:'12px',color:'#6b7280',margin:'0 0 12px 0' }}>Format: 2025-2026 atau 2025</p>
            <input
              type="text"
              value={newYear}
              onChange={e => setNewYear(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') handleAddYear(); if(e.key==='Escape') { setShowAddYearModal(false); setNewYear(''); }}}
              placeholder="cth: 2025-2026"
              autoFocus
              style={{ width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',outline:'none',boxSizing:'border-box',marginBottom:'16px' }}
            />
            <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end' }}>
              <button onClick={()=>{setShowAddYearModal(false);setNewYear('');}} style={{ padding:'8px 16px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',color:'#374151',cursor:'pointer',fontWeight:'600' }}>Batal</button>
              <button onClick={handleAddYear} disabled={isAddingYear||!newYear.trim()} style={{ padding:'8px 16px',background:'#1e3a8a',border:'none',borderRadius:'8px',fontSize:'12px',color:'white',cursor:'pointer',fontWeight:'600',opacity:isAddingYear||!newYear.trim()?0.6:1 }}>
                {isAddingYear ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Year Confirmation Modal */}
      {deleteYearModal.open && (
        <div style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(30,41,59,0.25)',backdropFilter:'blur(4px)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeInModal 0.2s' }}>
          <div style={{ background:'white',borderRadius:'16px',boxShadow:'0 12px 32px rgba(30,41,59,0.18)',padding:'28px 24px',minWidth:'320px',maxWidth:'90vw',textAlign:'center',animation:'popUpModal 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <div style={{ width:'48px',height:'48px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px auto' }}>
              <span style={{ fontSize:'24px',color:'#ef4444' }}>×</span>
            </div>
            <h2 style={{ fontSize:'16px',fontWeight:'700',color:'#1f2937',margin:'0 0 8px 0' }}>Hapus Tahun {deleteYearModal.tahun}?</h2>
            <p style={{ fontSize:'12px',color:'#6b7280',margin:'0 0 20px 0' }}>Semua data {dataType} untuk tahun ini akan dihapus permanen.</p>
            <div style={{ display:'flex',gap:'10px',justifyContent:'center' }}>
              <button onClick={()=>setDeleteYearModal({open:false,tahun:''})} style={{ padding:'8px 20px',background:'#f3f4f6',border:'none',borderRadius:'8px',fontSize:'12px',color:'#374151',cursor:'pointer',fontWeight:'600' }}>Batal</button>
              <button onClick={confirmDeleteYear} style={{ padding:'8px 20px',background:'#ef4444',border:'none',borderRadius:'8px',fontSize:'12px',color:'white',cursor:'pointer',fontWeight:'600' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar  />
        <main style={{ marginLeft:isMobile?0:isSidebarOpen?'260px':'64px',flex:1,padding:isMobile?'80px 16px 16px 16px':'32px 16px',transition:'margin-left 0.3s ease-in-out' }}>
          {!isMobile && (
            <div style={{ display:'flex',justifyContent:'flex-end',alignItems:'center',marginBottom:24 }}>
              <ProfileMenu />
            </div>
          )}
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <button onClick={() => router.back()} style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'24px',padding:'8px 16px',border:'none',borderRadius:'8px',backgroundColor:'#f3f4f6',color:'#1f2937',cursor:'pointer',fontSize:'13px' }}>
              <ArrowLeft size={16} />
              Kembali
            </button>

            {isLoading ? (
              <>
                <div style={{ marginBottom:'32px' }}>
                  <div className="skeleton-loading" style={{ height:'28px',borderRadius:'6px',marginBottom:'8px',width:'280px' }}></div>
                  <div className="skeleton-loading" style={{ height:'14px',borderRadius:'6px',width:'200px' }}></div>
                </div>
                <div style={{ background:'white',borderRadius:'12px',marginBottom:'32px',boxShadow:'0 4px 6px rgba(0,0,0,0.06)',overflowX:'auto' }}>
                  <table style={{ minWidth:'100%',borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#e5e7eb' }}>
                        {['No','Nama Sekolah','Status','Data'].map(h=><th key={h} style={{ padding:'12px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[1,2,3,4,5].map(i=><tr key={i}><td colSpan={4} style={{ padding:'12px',border:'1px solid #e5e7eb' }}><div className="skeleton-loading" style={{ height:'14px',borderRadius:'2px' }}></div></td></tr>)}
                    </tbody>
                  </table>
                </div>
              </>
            ) : error ? (
              <div style={{ padding:'40px',textAlign:'center',color:'#ef4444' }}>Gagal: {error}</div>
            ) : (
              <>
                {/* Header + Toolbar */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px',flexWrap:'wrap',gap:'12px' }}>
                  <div>
                    <h1 style={{ fontSize:'22px',fontWeight:'700',margin:'0 0 2px 0',color:'#1f2937' }}>
                      {dataType==='rombel'?'Data Rombel Per Sekolah':dataType==='guru'?'Data Guru Per Sekolah':'Data Siswa Per Sekolah'}
                    </h1>
                    <p style={{ color:'#6b7280',margin:0,fontSize:'14px',fontWeight:'600' }}>Kecamatan {kecamatanName}</p>
                  </div>
                  <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',marginLeft:'auto' }}>
                    <button onClick={()=>setShowAddYearModal(true)} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#1e3a8a',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer' }}>
                      <Plus size={14}/> Tambah Tahun
                    </button>
                    {isEditMode ? (
                      <>
                        <button onClick={handleSave} disabled={isSaving} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#10b981',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer',opacity:isSaving?0.7:1 }}>
                          <Save size={14}/> {isSaving?'Menyimpan...':'Simpan'}
                        </button>
                        <button onClick={handleCancelEdit} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#f3f4f6',border:'none',borderRadius:'8px',color:'#374151',fontSize:'12px',fontWeight:'600',cursor:'pointer' }}>
                          <X size={14}/> Batal
                        </button>
                      </>
                    ) : (
                      <button onClick={handleEnterEdit} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#f59e0b',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer' }}>
                        <Edit size={14}/> Edit Data
                      </button>
                    )}
                    <button onClick={exportCSV} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'#059669',border:'none',borderRadius:'8px',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer' }}>
                      <Download size={14}/> Export CSV
                    </button>
                  </div>
                </div>

                {/* Data Guru Table */}
                {dataType === 'guru' && (
                <div style={{ background:'white',borderRadius:'12px',marginBottom:'32px',boxShadow:'0 4px 6px rgba(0,0,0,0.06)',overflowX:'auto' }}>
                  <table style={{ minWidth:'100%',borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#e5e7eb' }}>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>No</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Nama Sekolah</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>Status</th>
                        <th colSpan={pagedGuruYears.length} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Jumlah Guru</th>
                      </tr>
                      <tr style={{ background:'#e5e7eb' }}>
                        {pagedGuruYears.map((year,i)=>(
                          <th key={`gy-${year}-${i}`} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}>
                              <span>{year==='-'?'-':`Tahun ${year}`}</span>
                              {year!=='-' && (
                                <button title="Hapus tahun ini" onClick={()=>setDeleteYearModal({open:true,tahun:year})} style={{ background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:'0',display:'flex',alignItems:'center',lineHeight:1 }}>
                                  <X size={12}/>
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {guruDisplayRows.length > 0 ? (
                        <>
                          {guruDisplayRows.map((row,i)=>(
                            <tr key={i} style={{ backgroundColor:i%2===0?'#ffffff':'#f9fafb' }}>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',fontWeight:'700' }}>{i+1}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb' }}>{row.nama_sekolah}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah)||'-'}</td>
                              {pagedGuruYears.map(year=>(
                                <td key={`gv-${row.nama_sekolah}-${year}`} style={{ padding:'6px 10px',fontSize:'12px',border:'1px solid #e5e7eb',textAlign:'center' }}>
                                  {isEditMode ? (
                                    <input type="number" min={0} value={editValues[getEditKey(row.nama_sekolah,year)]??row.perYear[year]?.jumlah_guru??0}
                                      onChange={e=>setEditValues(p=>({...p,[getEditKey(row.nama_sekolah,year)]:Number(e.target.value)||0}))}
                                      style={{ width:'70px',padding:'4px 6px',border:'1px solid #93c5fd',borderRadius:'4px',fontSize:'12px',textAlign:'center' }}/>
                                  ) : (row.perYear[year]?.jumlah_guru||0).toLocaleString('id-ID')}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr style={{ background:'#e5e7eb' }}>
                            <td colSpan={3} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Total per Tahun</td>
                            {pagedGuruTotals.map((v,i)=>(
                              <td key={`tg-${i}`} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',textAlign:'center',background:'#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                            ))}
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan={3+pagedGuruYears.length} style={{ padding:'28px 12px',fontSize:'13px',color:'#6b7280',fontWeight:'600',border:'1px solid #e5e7eb',textAlign:'center' }}>Data guru per sekolah tidak ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {totalYearPages > 1 && (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:'1px solid #e5e7eb',background:'#f9fafb',borderRadius:'0 0 12px 12px' }}>
                      <button disabled={yearPage===0} onClick={()=>setYearPage(p=>p-1)} style={{ padding:'6px 14px',background:yearPage===0?'#e5e7eb':'#1e3a8a',color:yearPage===0?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage===0?'default':'pointer' }}>← Sebelumnya</button>
                      <span style={{ fontSize:'12px',color:'#6b7280',fontWeight:'600' }}>Halaman {yearPage+1} dari {totalYearPages}</span>
                      <button disabled={yearPage>=totalYearPages-1} onClick={()=>setYearPage(p=>p+1)} style={{ padding:'6px 14px',background:yearPage>=totalYearPages-1?'#e5e7eb':'#1e3a8a',color:yearPage>=totalYearPages-1?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage>=totalYearPages-1?'default':'pointer' }}>Selanjutnya →</button>
                    </div>
                  )}
                </div>
                )}

                {/* Data Siswa Table */}
                {dataType === 'siswa' && (
                <div style={{ background:'white',borderRadius:'12px',marginBottom:'32px',boxShadow:'0 4px 6px rgba(0,0,0,0.06)',overflowX:'auto' }}>
                  <table style={{ minWidth:'100%',borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#e5e7eb' }}>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>No</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Nama Sekolah</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>Status</th>
                        <th colSpan={pagedSiswaYears.length} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Jumlah Siswa</th>
                      </tr>
                      <tr style={{ background:'#e5e7eb' }}>
                        {pagedSiswaYears.map((year,i)=>(
                          <th key={`sy-${year}-${i}`} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}>
                              <span>{year==='-'?'-':`Tahun ${year}`}</span>
                              {year!=='-' && (
                                <button title="Hapus tahun ini" onClick={()=>setDeleteYearModal({open:true,tahun:year})} style={{ background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:'0',display:'flex',alignItems:'center',lineHeight:1 }}>
                                  <X size={12}/>
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {siswaDisplayRows.length > 0 ? (
                        <>
                          {siswaDisplayRows.map((row,i)=>(
                            <tr key={i} style={{ backgroundColor:i%2===0?'#ffffff':'#f9fafb' }}>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',fontWeight:'700' }}>{i+1}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb' }}>{row.nama_sekolah}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah)||'-'}</td>
                              {pagedSiswaYears.map(year=>(
                                <td key={`sv-${row.nama_sekolah}-${year}`} style={{ padding:'6px 10px',fontSize:'12px',border:'1px solid #e5e7eb',textAlign:'center' }}>
                                  {isEditMode ? (
                                    <input type="number" min={0} value={editValues[getEditKey(row.nama_sekolah,year)]??row.perYear[year]?.jumlah_siswa??0}
                                      onChange={e=>setEditValues(p=>({...p,[getEditKey(row.nama_sekolah,year)]:Number(e.target.value)||0}))}
                                      style={{ width:'70px',padding:'4px 6px',border:'1px solid #93c5fd',borderRadius:'4px',fontSize:'12px',textAlign:'center' }}/>
                                  ) : (row.perYear[year]?.jumlah_siswa||0).toLocaleString('id-ID')}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr style={{ background:'#e5e7eb' }}>
                            <td colSpan={3} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Total per Tahun</td>
                            {pagedSiswaTotals.map((v,i)=>(
                              <td key={`ts-${i}`} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',textAlign:'center',background:'#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                            ))}
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan={3+pagedSiswaYears.length} style={{ padding:'28px 12px',fontSize:'13px',color:'#6b7280',fontWeight:'600',border:'1px solid #e5e7eb',textAlign:'center' }}>Data siswa per sekolah tidak ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {totalYearPages > 1 && (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:'1px solid #e5e7eb',background:'#f9fafb',borderRadius:'0 0 12px 12px' }}>
                      <button disabled={yearPage===0} onClick={()=>setYearPage(p=>p-1)} style={{ padding:'6px 14px',background:yearPage===0?'#e5e7eb':'#1e3a8a',color:yearPage===0?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage===0?'default':'pointer' }}>← Sebelumnya</button>
                      <span style={{ fontSize:'12px',color:'#6b7280',fontWeight:'600' }}>Halaman {yearPage+1} dari {totalYearPages}</span>
                      <button disabled={yearPage>=totalYearPages-1} onClick={()=>setYearPage(p=>p+1)} style={{ padding:'6px 14px',background:yearPage>=totalYearPages-1?'#e5e7eb':'#1e3a8a',color:yearPage>=totalYearPages-1?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage>=totalYearPages-1?'default':'pointer' }}>Selanjutnya →</button>
                    </div>
                  )}
                </div>
                )}

                {/* Data Rombel Table */}
                {dataType === 'rombel' && (
                <div style={{ background:'white',borderRadius:'12px',marginBottom:'32px',boxShadow:'0 4px 6px rgba(0,0,0,0.06)',overflowX:'auto' }}>
                  <table style={{ minWidth:'100%',borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#e5e7eb' }}>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>No</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Nama Sekolah</th>
                        <th rowSpan={2} style={{ padding:'10px',textAlign:'left',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>Status</th>
                        <th colSpan={pagedRombelYears.length} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Jumlah Rombel</th>
                      </tr>
                      <tr style={{ background:'#e5e7eb' }}>
                        {pagedRombelYears.map((year,i)=>(
                          <th key={`ry-${year}-${i}`} style={{ padding:'10px',textAlign:'center',color:'#1f2937',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px' }}>
                              <span>{year==='-'?'-':`Tahun ${year}`}</span>
                              {year!=='-' && (
                                <button title="Hapus tahun ini" onClick={()=>setDeleteYearModal({open:true,tahun:year})} style={{ background:'none',border:'none',color:'#ef4444',cursor:'pointer',padding:'0',display:'flex',alignItems:'center',lineHeight:1 }}>
                                  <X size={12}/>
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rombelDisplayRows.length > 0 ? (
                        <>
                          {rombelDisplayRows.map((row,i)=>(
                            <tr key={i} style={{ backgroundColor:i%2===0?'#ffffff':'#f9fafb' }}>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',fontWeight:'700' }}>{i+1}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb' }}>{row.nama_sekolah}</td>
                              <td style={{ padding:'10px',fontSize:'12px',border:'1px solid #e5e7eb',whiteSpace:'nowrap' }}>{sekolahStatusMap.get(row.nama_sekolah)||'-'}</td>
                              {pagedRombelYears.map(year=>(
                                <td key={`rv-${row.nama_sekolah}-${year}`} style={{ padding:'6px 10px',fontSize:'12px',border:'1px solid #e5e7eb',textAlign:'center' }}>
                                  {isEditMode ? (
                                    <input type="number" min={0} value={editValues[getEditKey(row.nama_sekolah,year)]??row.perYear[year]?.jumlah_rombel??0}
                                      onChange={e=>setEditValues(p=>({...p,[getEditKey(row.nama_sekolah,year)]:Number(e.target.value)||0}))}
                                      style={{ width:'70px',padding:'4px 6px',border:'1px solid #93c5fd',borderRadius:'4px',fontSize:'12px',textAlign:'center' }}/>
                                  ) : (row.perYear[year]?.jumlah_rombel||0).toLocaleString('id-ID')}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr style={{ background:'#e5e7eb' }}>
                            <td colSpan={3} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb' }}>Total per Tahun</td>
                            {pagedRombelTotals.map((v,i)=>(
                              <td key={`tr-${i}`} style={{ padding:'10px',fontSize:'12px',fontWeight:'700',border:'1px solid #e5e7eb',textAlign:'center',background:'#e5e7eb' }}>{v.toLocaleString('id-ID')}</td>
                            ))}
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan={3+pagedRombelYears.length} style={{ padding:'28px 12px',fontSize:'13px',color:'#6b7280',fontWeight:'600',border:'1px solid #e5e7eb',textAlign:'center' }}>Data rombel per sekolah tidak ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {totalYearPages > 1 && (
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:'1px solid #e5e7eb',background:'#f9fafb',borderRadius:'0 0 12px 12px' }}>
                      <button disabled={yearPage===0} onClick={()=>setYearPage(p=>p-1)} style={{ padding:'6px 14px',background:yearPage===0?'#e5e7eb':'#1e3a8a',color:yearPage===0?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage===0?'default':'pointer' }}>← Sebelumnya</button>
                      <span style={{ fontSize:'12px',color:'#6b7280',fontWeight:'600' }}>Halaman {yearPage+1} dari {totalYearPages}</span>
                      <button disabled={yearPage>=totalYearPages-1} onClick={()=>setYearPage(p=>p+1)} style={{ padding:'6px 14px',background:yearPage>=totalYearPages-1?'#e5e7eb':'#1e3a8a',color:yearPage>=totalYearPages-1?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage>=totalYearPages-1?'default':'pointer' }}>Selanjutnya →</button>
                    </div>
                  )}
                </div>
                )}

              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
