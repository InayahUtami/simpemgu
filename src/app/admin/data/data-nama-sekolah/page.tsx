'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { School, Search, Download, Eye, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import ProfileMenu from '../../components/ProfileMenu';
import { useSidebar } from '../../components/SidebarContext';

interface NamaSekolahRow {
  id: number;
  kecamatan_id: number;
  kecamatan: string;
  nama_sekolah: string;
  status: 'Negeri' | 'Swasta';
}

type ModalMode = 'add' | 'edit' | 'view';

interface Notification {
  text: string;
  type: 'success' | 'error';
  visible: boolean;
}

export default function DataNamaSekolahPage() {
  const { isSidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [kecamatanFilter, setKecamatanFilter] = useState('');
  const [rows, setRows] = useState<NamaSekolahRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableKecamatan, setAvailableKecamatan] = useState<{ id: number; nama: string }[]>([]);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState('');
  const [newNamaSekolah, setNewNamaSekolah] = useState('');
  const [newStatus, setNewStatus] = useState<'Negeri' | 'Swasta'>('Negeri');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [selectedSekolah, setSelectedSekolah] = useState<NamaSekolahRow | null>(null);
  const [notification, setNotification] = useState<Notification>({ text: '', type: 'success', visible: false });
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile' >('data');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/data/nama-sekolah', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat data nama sekolah');
      }

      setRows(Array.isArray(result.data) ? result.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKecamatanOptions = async () => {
    try {
      const response = await fetch('/api/data/kecamatan', { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.success) {
        setAvailableKecamatan(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Gagal memuat daftar kecamatan:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchKecamatanOptions();
  }, []);

  const availableDistricts = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.kecamatan))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const keyword = searchTerm.toLowerCase();
      const matchSearch =
        row.nama_sekolah.toLowerCase().includes(keyword) ||
        row.kecamatan.toLowerCase().includes(keyword);
      const matchDistrict = !kecamatanFilter || row.kecamatan === kecamatanFilter;
      return matchSearch && matchDistrict;
    });
  }, [rows, searchTerm, kecamatanFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, kecamatanFilter]);

  const showNotif = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type, visible: true });
    setTimeout(() => setNotification({ ...notification, visible: false }), 2000);
  };

  const handleOpenModal = (mode: ModalMode, sekolah?: NamaSekolahRow) => {
    setModalMode(mode);
    if (mode === 'add') {
      setSelectedSekolah(null);
      setSelectedKecamatanId('');
      setNewNamaSekolah('');
      setNewStatus('Negeri');
    } else if (sekolah) {
      setSelectedSekolah(sekolah);
      setSelectedKecamatanId(String(sekolah.kecamatan_id));
      setNewNamaSekolah(sekolah.nama_sekolah);
      setNewStatus(sekolah.status);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalMode('add');
    setSelectedSekolah(null);
    setNewNamaSekolah('');
    setSelectedKecamatanId('');
    setNewStatus('Negeri');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedKecamatanId) {
      showNotif('Silahkan pilih kecamatan.', 'error');
      return;
    }

    if (!newNamaSekolah.trim()) {
      showNotif('Silahkan masukkan nama sekolah.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = modalMode === 'add' ? '/api/data/nama-sekolah' : `/api/data/nama-sekolah`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = modalMode === 'add'
        ? {
            kecamatan_id: Number(selectedKecamatanId),
            nama_sekolah: newNamaSekolah.trim(),
            status: newStatus,
          }
        : {
            id: selectedSekolah!.id,
            kecamatan_id: Number(selectedKecamatanId),
            nama_sekolah: newNamaSekolah.trim(),
            status: newStatus,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotif(result.message || (modalMode === 'add' ? 'Data berhasil ditambah.' : 'Data berhasil diupdate.'), 'success');
        await fetchData();
        handleCloseModal();
      } else {
        showNotif(result.error || (modalMode === 'add' ? 'Gagal menambah sekolah.' : 'Gagal mengupdate sekolah.'), 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotif('Terjadi kesalahan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/data/nama-sekolah?id=${deleteConfirm.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotif(result.message || 'Data berhasil dihapus.', 'success');
        await fetchData();
        setDeleteConfirm({ visible: false, id: null });
      } else {
        showNotif(result.error || 'Gagal menghapus sekolah.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotif('Terjadi kesalahan saat menghapus.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['No', 'Kecamatan', 'Nama Sekolah', 'Status'];
    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      `"${row.kecamatan}"`,
      `"${row.nama_sekolah}"`,
      row.status,
    ]);
    const csvContent = [headers, ...csvRows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-nama-sekolah.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Shimmer Animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="admin-page-zoom" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar  />
        <main
          style={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? '260px' : '64px',
            flex: 1,
            padding: isMobile ? '80px 16px 16px 16px' : '32px 16px',
            transition: 'margin-left 0.3s ease-in-out',
          }}
        >
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
              <ProfileMenu />
            </div>
          )}
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#dbeafe40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <School style={{ width: '32px', height: '32px', color: '#1e3a8a' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: '#1e3a8a' }}>
                    Data Nama Sekolah
                  </h1>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '13px', fontWeight: '500' }}>
                    Kelola data nama sekolah per kecamatan
                  </p>
                </div>
              </div>
            </div>

            {/* Notification */}
            {notification.visible && (
              <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: notification.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 9999,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'slideIn 0.3s ease-out'
              }}>
                {notification.type === 'success' ? (
                  <CheckCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                ) : (
                  <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{notification.text}</span>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.visible && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '12px' : '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  maxWidth: '400px',
                  width: '100%',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #e5e7eb',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <AlertCircle style={{ width: '24px', height: '24px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Hapus Data?</h3>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button
                      onClick={() => setDeleteConfirm({ visible: false, id: null })}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '10px 14px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      style={{ flex: 1, padding: '10px 14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', opacity: isSubmitting ? 0.6 : 1 }}
                    >
                      {isSubmitting ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal */}
            {showModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '12px' : '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  maxWidth: '640px',
                  width: '100%',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #e5e7eb',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                      {modalMode === 'add' && 'Tambah Data Nama Sekolah'}
                      {modalMode === 'edit' && 'Edit Data Nama Sekolah'}
                      {modalMode === 'view' && 'Lihat Data Nama Sekolah'}
                    </h3>
                    <button onClick={handleCloseModal} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}>×</button>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
                    <div>
                      <label htmlFor="modal-kecamatan" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Kecamatan</label>
                      <select
                        id="modal-kecamatan"
                        value={selectedKecamatanId}
                        onChange={(e) => setSelectedKecamatanId(e.target.value)}
                        disabled={modalMode === 'view'}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: modalMode === 'view' ? '#f9fafb' : 'white' }}
                        required
                      >
                        <option value="">Pilih Kecamatan</option>
                        {availableKecamatan.map((kec) => (
                          <option key={kec.id} value={kec.id}>{kec.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="modal-nama-sekolah" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nama Sekolah</label>
                      <input
                        id="modal-nama-sekolah"
                        type="text"
                        value={newNamaSekolah}
                        onChange={(e) => setNewNamaSekolah(e.target.value)}
                        disabled={modalMode === 'view'}
                        placeholder="Masukkan nama sekolah"
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: modalMode === 'view' ? '#f9fafb' : 'white' }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="modal-status" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Status</label>
                      <select
                        id="modal-status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as 'Negeri' | 'Swasta')}
                        disabled={modalMode === 'view'}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: modalMode === 'view' ? '#f9fafb' : 'white' }}
                        required
                      >
                        <option value="Negeri">Negeri</option>
                        <option value="Swasta">Swasta</option>
                      </select>
                    </div>
                    {modalMode !== 'view' && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '10px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                      >
                        {isSubmitting ? 'Menyimpan...' : (modalMode === 'add' ? 'Tambah' : 'Update')}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>Data Nama Sekolah</div>
              <button
                onClick={() => handleOpenModal('add')}
                style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
              >
                + Tambah Nama Sekolah
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Cari nama sekolah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 44px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', color: '#000', outline: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <select
                value={kecamatanFilter}
                onChange={(e) => setKecamatanFilter(e.target.value)}
                style={{ padding: '12px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', minWidth: '220px', color: '#000', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Semua Kecamatan</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <button
                onClick={exportCSV}
                disabled={filteredRows.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: filteredRows.length === 0 ? 'not-allowed' : 'pointer', opacity: filteredRows.length === 0 ? 0.5 : 1, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', marginLeft: 'auto' }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Export CSV
              </button>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '16px', padding: '12px 16px', color: '#374151', fontSize: '12px' }}>
              Menampilkan {filteredRows.length} nama sekolah {searchTerm && `dengan pencarian "${searchTerm}"`}.
            </div>

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', padding: '0', overflowX: 'auto' }}>
              {!isLoading && error && <p style={{ margin: 0, color: '#b91c1c', padding: '24px' }}>Gagal: {error}</p>}
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb', color: '#1f2937' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#1f2937', border: '1px solid #d1d5db', fontSize: '13px' }}>No</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#1f2937', border: '1px solid #d1d5db', fontSize: '13px' }}>Kecamatan</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#1f2937', border: '1px solid #d1d5db', fontSize: '13px' }}>Nama Sekolah</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#1f2937', border: '1px solid #d1d5db', fontSize: '13px' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '12px', color: '#1f2937', border: '1px solid #d1d5db', fontSize: '13px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skeleton-${i}`} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                          <div style={{
                            height: '16px',
                            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            borderRadius: '4px',
                            width: '30px',
                            margin: '0 auto'
                          }} />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                          <div style={{
                            height: '16px',
                            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            borderRadius: '4px',
                            width: '120px'
                          }} />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                          <div style={{
                            height: '16px',
                            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            borderRadius: '4px',
                            width: '160px'
                          }} />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                          <div style={{
                            height: '16px',
                            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite',
                            borderRadius: '4px',
                            width: '100px',
                            margin: '0 auto'
                          }} />
                        </td>
                      </tr>
                    ))
                  ) : paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 700 }}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 700 }}>
                          {row.kecamatan}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>{row.nama_sekolah}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: row.status === 'Negeri' ? '#166534' : '#9a3412',
                              backgroundColor: row.status === 'Negeri' ? '#dcfce7' : '#ffedd5',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenModal('view', row)}
                              title="Lihat"
                              style={{ padding: '6px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
                            >
                              <Eye style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => handleOpenModal('edit', row)}
                              title="Edit"
                              style={{ padding: '6px 8px', backgroundColor: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
                            >
                              <Edit style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ visible: true, id: row.id })}
                              title="Hapus"
                              style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
                            >
                              <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '28px 12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontWeight: 600 }}>
                        Data nama sekolah tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!isLoading && totalPages > 1 && (
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>Halaman {currentPage} dari {totalPages} (total {filteredRows.length} data)</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', backgroundColor: currentPage === 1 ? '#f9fafb' : 'white', color: currentPage === 1 ? '#9ca3af' : '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Sebelumnya</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white', color: currentPage === totalPages ? '#9ca3af' : '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Selanjutnya</button>
                  </div>
                </div>
              )}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#0369a1' }}>📌</span>
                <span style={{ fontSize: '12px', color: '#475569' }}><strong>Sumber:</strong> Dinas Pendidikan Kota Palembang</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

