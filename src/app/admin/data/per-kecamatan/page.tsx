'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileMenu from '../../components/ProfileMenu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  MapPin,
  X,
  Save,
  Eye,
  Download
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useSidebar } from '../../components/SidebarContext';

interface Kecamatan {
  id: number;
  nomor: number;
  nama: string;
  created_at: string;
  updated_at: string;
}


export default function DataPerKecamatan() {
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile' >('data');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [kecamatanData, setKecamatanData] = useState<Kecamatan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from API
  const fetchKecamatanData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/data/kecamatan');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setKecamatanData(data.data);
      }
    } catch (error) {
      console.error('Error fetching kecamatan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKecamatanData();
  }, []);

  const [filteredData, setFilteredData] = useState<Kecamatan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'semua' | 'nama_asc' | 'nama_desc'>('semua');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedKecamatan, setSelectedKecamatan] = useState<Kecamatan | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  // Notification state
  const [showNotif, setShowNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nama: ''
  });

  // Filter dan search effect
  useEffect(() => {
    if (kecamatanData.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...kecamatanData];

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter((item: Kecamatan) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan kategori
    switch (filterBy) {
      case 'nama_asc':
        filtered = [...filtered].sort((a: Kecamatan, b: Kecamatan) =>
          a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
        );
        break;
      case 'nama_desc':
        filtered = [...filtered].sort((a: Kecamatan, b: Kecamatan) =>
          b.nama.localeCompare(a.nama, 'id', { sensitivity: 'base' })
        );
        break;
      default:
        break;
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterBy, kecamatanData]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Pastikan render tabel menggunakan currentItems yang berasal dari state kecamatanData
  const handleOpenModal = (mode: 'add' | 'edit' | 'view', kecamatan?: Kecamatan) => {
    setModalMode(mode);
    setSelectedKecamatan(kecamatan || null);
    
    if (mode === 'add') {
      setFormData({
        nama: ''
      });
    } else if (kecamatan) {
      setFormData({
        nama: kecamatan.nama
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedKecamatan(null);
    setFormData({
      nama: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'add') {
        // Tambah data baru
        const response = await fetch('/api/data/kecamatan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: formData.nama
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setNotifMsg('Data berhasil ditambah!');
          setShowNotif(true);
          setTimeout(() => setShowNotif(false), 2000);
          fetchKecamatanData(); // Refresh data
          handleCloseModal();
        } else {
          setNotifMsg(result.error || `Gagal menambah data! (HTTP ${response.status})`);
          setShowNotif(true);
          setTimeout(() => setShowNotif(false), 2000);
        }
      } else if (modalMode === 'edit') {
        // Update data
        const response = await fetch('/api/data/kecamatan', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedKecamatan!.id,
            nama: formData.nama
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setNotifMsg('Data berhasil diupdate!');
          setShowNotif(true);
          setTimeout(() => setShowNotif(false), 2000);
          fetchKecamatanData(); // Refresh data
          handleCloseModal();
        } else {
          setNotifMsg(result.error || `Gagal mengupdate data! (HTTP ${response.status})`);
          setShowNotif(true);
          setTimeout(() => setShowNotif(false), 2000);
        }
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setNotifMsg('Terjadi kesalahan!');
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/data/kecamatan?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNotifMsg('Data kecamatan berhasil dihapus!');
        setShowNotif(true);
        setTimeout(() => setShowNotif(false), 2000);
        fetchKecamatanData(); // Refresh data
      } else {
        setNotifMsg(result.error || `Gagal menghapus data! (HTTP ${response.status})`);
        setShowNotif(true);
        setTimeout(() => setShowNotif(false), 2000);
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      setNotifMsg('Terjadi kesalahan!');
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 2000);
    }
  };

  const exportToCSV = () => {
    const headers = ['No', 'Nama Kecamatan'];
    const rows = filteredData.map(item => [
      item.nomor,
      item.nama
    ]);
    // Tidak ada JUMLAH row karena hanya data kecamatan
    const BOM = '\uFEFF';
    const csvContent = [headers, ...rows]
      .map(e => e.join(';'))
      .join('\r\n');
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_kecamatan.xls';
    link.click();
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
      
      {/* Notification Popup */}
      {showNotif && (
        <div style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          background: notifMsg.includes('berhasil')
            ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
            : 'linear-gradient(135deg, #1e3a8a 0%, #93c5fd 100%)',
          color: 'white',
          padding: '16px 32px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '18px',
          boxShadow: notifMsg.includes('berhasil')
            ? '0 8px 24px rgba(34,197,94,0.15)'
            : '0 8px 24px rgba(220,38,38,0.15)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {notifMsg.includes('berhasil') ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="12" fill="#22c55e" />
              <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            // X icon for duplicate data
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <circle cx="12" cy="12" r="12" fill="#1e3a8a" />
              <path d="M15 9L9 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 9L15 15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {notifMsg}
        </div>
      )}
      
      <div className="admin-page-zoom" style={{ 
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ 
          display: 'flex', 
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#ffffff'
        }}>
      <Sidebar  />
      <main style={{ 
        marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '64px'), 
        flex: 1, 
        padding: isMobile ? '80px 16px 16px 16px' : '32px 16px',
        transition: 'margin-left 0.3s ease-in-out',
        backgroundColor: '#ffffff',
        minHeight: '100vh'
      }}>
        {/* Menu profil di ujung kanan atas - hanya tampil di desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
            <ProfileMenu />
          </div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#dbeafe40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin style={{ width: '32px', height: '32px', color: '#1e3a8a' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              color: '#1e3a8a'
            }}>
              Data Per Kecamatan
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: '0'
            }}>
              Kelola data kecamatan di Kota Palembang
            </p>
          </div>
          </div>

        </div>

        {/* Filter dan Search */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Cari nama kecamatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#000000',
                transition: 'border-color 0.2s',
                outline: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#6b7280'
            }} />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              style={{
                padding: '12px 12px 12px 44px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#000000',
                minWidth: '200px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="semua" style={{ color: '#000000' }}>Semua Kecamatan</option>
              <option value="nama_asc" style={{ color: '#000000' }}>Nama A-Z</option>
              <option value="nama_desc" style={{ color: '#000000' }}>Nama Z-A</option>
            </select>
          </div>
        </div>

        {/* Info hasil filter */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#374151',
          fontSize: '12px'
        }}>
          <div>
            <p style={{
              margin: '0 0 8px 0',
              color: '#374151',
              fontSize: '14px'
            }}>
              Menampilkan <strong>{filteredData.length}</strong> kecamatan
              {searchTerm && ` dengan pencarian "${searchTerm}"`}
              {filterBy !== 'semua' && ` dengan sorting ${filterBy === 'nama_asc' ? 'A-Z' : 'Z-A'}`}
            </p>
            <p style={{
              margin: '0',
              fontSize: '12px',
              color: '#92400e',
              lineHeight: '1.6'
            }}>
              <strong>Petunjuk:</strong> Klik tombol Tambah Data untuk menambahkan kecamatan baru. Gunakan ikon pensil untuk mengubah data kecamatan, ikon mata untuk melihat detail, dan ikon tempat sampah untuk menghapus data. Setiap perubahan akan langsung tersimpan ke dalam basis data.
            </p>
          </div>
        </div>

        {/* Tombol Export dan Tambah */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '16px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={exportToCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '12px 18px' : '10px 14px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '14px' : '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#15803d';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download style={{ width: '20px', height: '20px' }} />
            Export CSV
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '12px 18px' : '10px 14px',
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '14px' : '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e3a8a';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus style={{ width: '20px', height: '20px' }} />
            Tambah Data
          </button>
        </div>

        {/* Tabel */}
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          marginBottom: '16px'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: '#e5e7eb',
                  color: '#1f2937'
                }}>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    fontWeight: '700', 
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    width: '80px'
                  }}>No</th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    fontWeight: '700', 
                    fontSize: '13px',
                    border: '1px solid #d1d5db'
                  }}>Kecamatan</th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    fontWeight: '700', 
                    fontSize: '13px',
                    border: '1px solid #d1d5db'
                  }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, index) => (
                    <tr key={`skeleton-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ 
                          height: '20px', 
                          background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                          borderRadius: '4px',
                          margin: '0 auto',
                          width: '40px'
                        }} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ 
                          height: '20px', 
                          background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                          borderRadius: '4px',
                          width: '60%'
                        }} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ 
                          height: '36px', 
                          background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite',
                          borderRadius: '8px',
                          margin: '0 auto',
                          width: '120px'
                        }} />
                      </td>
                    </tr>
                  ))
                ) : currentItems.map((kecamatan, index) => (
                  <tr
                    key={kecamatan.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eef2ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'}
                  >
                    <td style={{ 
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#1f2937',
                      fontSize: '13px'
                    }}>
                      {kecamatan.nomor}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: '#dbeafe40'
                        }}>
                          <MapPin style={{ width: '20px', height: '20px', color: '#1e3a8a' }} />
                        </div>
                        <div>
                          <p style={{ margin: '0', fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>
                            {kecamatan.nama}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenModal('view', kecamatan)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', kecamatan)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#d97706';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f59e0b';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(kecamatan.id)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#1e3a8a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1e3a8a';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1e3a8a';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'between',
              alignItems: 'center'
            }}>
              <p style={{
                margin: '0',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Halaman {currentPage} dari {totalPages} ({filteredData.length} total data)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '12px'
                  }}
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '12px'
                  }}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#0369a1' }}>📌</span>
            <span style={{ fontSize: '12px', color: '#475569' }}><strong>Sumber:</strong> Badan Pusat Statistik (BPS) Kota Palembang</span>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: window.innerWidth <= 768 ? '12px' : '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
              padding: window.innerWidth <= 768 ? '20px' : '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: window.innerWidth <= 768 ? '20px' : '24px', gap: '12px' }}>
                <h2 style={{
                  fontSize: window.innerWidth <= 768 ? '18px' : '24px',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  lineHeight: '1.3',
                  flex: 1
                }}>
                  <MapPin style={{ width: window.innerWidth <= 768 ? '24px' : '28px', height: window.innerWidth <= 768 ? '24px' : '28px', color: '#1e3a8a', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {modalMode === 'add' ? 'Tambah Data Kecamatan' : modalMode === 'edit' ? 'Edit Data Kecamatan' : 'Detail Kecamatan'}
                  </span>
                </h2>
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: window.innerWidth <= 768 ? '6px' : '8px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  <X style={{ width: window.innerWidth <= 768 ? '18px' : '20px', height: window.innerWidth <= 768 ? '18px' : '20px', color: '#6b7280' }} />
                </button>
              </div>

              {modalMode === 'view' && selectedKecamatan ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                      {selectedKecamatan.nama}
                    </h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <p style={{ margin: '0', color: '#000000' }}>
                        <strong>Dibuat:</strong> {new Date(selectedKecamatan.created_at).toLocaleDateString('id-ID')}
                      </p>
                      <p style={{ margin: '0', color: '#000000' }}>
                        <strong>Diperbarui:</strong> {new Date(selectedKecamatan.updated_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000000' }}>
                      Nama Kecamatan *
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        color: '#000000',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#f3f4f6',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
                    >
                      <Save style={{ width: '20px', height: '20px' }} />
                      {modalMode === 'add' ? 'Simpan' : 'Update'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
        </div>
      </div>
    </>
  );
}


