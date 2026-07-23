"use client";
// Tambah import untuk grafik
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProfileMenu from '../../components/ProfileMenu';
import { 
  Users,
  Download,
  BarChart3,
  Search,
  Plus,
  Edit,
  X,
  Save
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useSidebar } from '../../components/SidebarContext';
// import ConfirmationModal from '../../components/ConfirmationModal';

// Add global styles to hide number input spinners
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type="number"] {
      -moz-appearance: textfield;
    }
  `;
  document.head.appendChild(style);
}

interface JumlahPendudukData {
  id: number;
  nomor: number;
  kecamatan: string;
  dataByYear: {[key: number]: {total: string}};
  tahun: number;
  jumlahPenduduk: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupedJumlahPendudukData {
  id: number;
  nomor: number;
  kecamatan: string;
  dataByYear: {[key: number]: {total: string}};
  tahun: number;
  jumlahPenduduk: number;
  createdAt: string;
  updatedAt: string;
}

export default function JumlahPenduduk() {
  // Modal state for delete year column
  const [deleteYearModalOpen, setDeleteYearModalOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState<number | null>(null);
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'districts' | 'demographics' | 'growth' | 'map' | 'data' | 'statistics' | 'profile' >('statistics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Modal state (move here)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState<() => void>(() => () => {});

  // State untuk data
  const [jumlahPendudukData, setJumlahPendudukData] = useState<JumlahPendudukData[]>([]);

  // Function to fetch data from API
  const fetchJumlahPendudukData = () => {
    setIsLoading(true);
    fetch('/api/data/jumlah-penduduk')
      .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
      .then(json => {
        if (json && json.data) {
          setJumlahPendudukData(json.data);
        }
      })
      .catch(err => console.error('Error fetching jumlah penduduk:', err))
      .finally(() => setIsLoading(false));
  };

  // Load data from API on component mount
  useEffect(() => {
    fetchJumlahPendudukData();
  }, []);

  // Auto-refresh when tab becomes visible (user returns to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchJumlahPendudukData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for storage events (when data is updated in another tab/window)
  useEffect(() => {
    // Tidak perlu lagi listen storage event, semua update langsung fetch ke database
    // (localStorage sync removed)
  }, []);


  const [filteredData, setFilteredData] = useState<GroupedJumlahPendudukData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 items per page
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedData, setSelectedData] = useState<JumlahPendudukData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<{[key: string]: {[key: number]: {total: string}}}>({});
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  const YEARS_PER_PAGE = 5;
  const [yearPage, setYearPage] = useState(0);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // Function to show notification
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Form state
  const [formData, setFormData] = useState({
    kecamatan: '',
    jumlahPenduduk: 0,
    tahun: new Date().getFullYear()
  });

  // Available years from data - get all years from dataByYear objects - memoized to prevent infinite loop
  const availableYears = useMemo(() => {
    return Array.from(new Set(
      jumlahPendudukData.flatMap(d => Object.keys(d.dataByYear).map(year => parseInt(year)))
    )).sort();
  }, [jumlahPendudukData]);

  // Calculate total for each year
  const calculateTotalByYear = () => {
    const totals: {[key: number]: number} = {};
    availableYears.forEach((year: number) => {
      const values = filteredData
        .map(data => {
          const val = data.dataByYear[year]?.total;
          if (!val) return 0;
          return parseInt((val + '').replace(/\./g, ''));
        })
        .filter(value => value !== null && value !== undefined);
      const sum = values.reduce((acc, val) => acc + val, 0);
      totals[year] = sum;
    });
    return totals;
  };

  const totalsByYear = calculateTotalByYear();

  const totalYearPages = Math.max(1, Math.ceil(availableYears.length / YEARS_PER_PAGE));
  const yearStart = yearPage * YEARS_PER_PAGE;
  const pagedYears = availableYears.slice(yearStart, yearStart + YEARS_PER_PAGE);

  // Group data by kecamatan - ALWAYS show ALL kecamatan even without data
  useEffect(() => {
    // Use the data directly from API (which includes all kecamatan via LEFT JOIN)
    let groupedData = jumlahPendudukData;

    // Filter berdasarkan search term
    if (searchTerm) {
      groupedData = groupedData.filter(item =>
        item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(groupedData);
    setCurrentPage(1);
  }, [searchTerm, jumlahPendudukData]); // Removed availableYears to prevent infinite loop

  // Reset year page when years list changes (e.g. year added/deleted)
  useEffect(() => { setYearPage(0); }, [availableYears.length]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Debug pagination
  console.log('Pagination Debug:', {
    filteredDataLength: filteredData.length,
    itemsPerPage,
    totalPages,
    currentPage,
    startIndex,
    endIndex,
    currentDataLength: currentData.length
  });

  // Modal functions
  const handleOpenModal = (mode: 'add' | 'edit', data?: JumlahPendudukData) => {
    setModalMode(mode);
    setSelectedData(data || null);
    
    // For "Tambah Tahun", just set default year
    setFormData({
      kecamatan: '',
      jumlahPenduduk: 0,
      tahun: new Date().getFullYear()
    });
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedData(null);
    setFormData({
      kecamatan: '',
      jumlahPenduduk: 0,
      tahun: new Date().getFullYear()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if year already exists
    if (availableYears.includes(formData.tahun)) {
      showNotification('error', 'Tahun Sudah Ada', `Tahun ${formData.tahun} sudah ada dalam data!`);
      return;
    }

    // Add new year column to all kecamatan in database
    try {
      const updates = jumlahPendudukData.map(d => ({
        kecamatanId: d.id,
        tahun: formData.tahun,
        jumlahPenduduk: 0 // Default value 0 for new year
      }));

      const response = await fetch('/api/data/jumlah-penduduk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const 
       result= await response.json();
      
      if (result.success) {
        showNotification('success', 'Tambah Tahun Berhasil!', `Kolom tahun ${formData.tahun} berhasil ditambahkan ke semua kecamatan.`);
        fetchJumlahPendudukData(); // Refresh data from database
        handleCloseModal();
      } else {
        showNotification('error', 'Gagal Tambah Tahun', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error adding year:', error);
      showNotification('error', 'Gagal Tambah Tahun', 'Terjadi kesalahan saat menambah tahun');
    }
      {/* Beautiful Notification Toast for Success */}
      {notification.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '320px',
            maxWidth: '500px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: `3px solid ${
              notification.type === 'success' ? '#10b981' :
              notification.type === 'error' ? '#1e3a8a' :
              notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
            }`,
            animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: `linear-gradient(135deg, ${
              notification.type === 'success' ? '#1e3a8a, #93c5fd' :
              notification.type === 'error' ? '#1e3a8a, #93c5fd' :
              notification.type === 'warning' ? '#f59e0b, #fbbf24' : '#3b82f6, #60a5fa'
            })`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {notification.type === 'success' ? '✓' :
               notification.type === 'error' ? '✕' :
               notification.type === 'warning' ? '⚠' : 'ℹ'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{
                margin: '0 0 4px 0',
                color: 'white',
                fontSize: '16px',
                fontWeight: '700'
              }}>
                {notification.title}
              </h4>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          </div>
        </div>
      )}
  };

  // Modal Komponen Konfirmasi
  interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
  }
  function ConfirmationModal({ open, onClose, onConfirm, title, message }: ConfirmationModalProps) {
    if (!open) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,41,59,0.25)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeInModal 0.3s'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 12px 32px rgba(30,41,59,0.18)',
          padding: '32px 28px',
          minWidth: '340px',
          maxWidth: '90vw',
          textAlign: 'center',
          position: 'relative',
          animation: 'popUpModal 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          zoom: 0.8
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'color 0.2s',
              borderRadius: '8px',
              padding: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1e3a8a'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            ×
          </button>
          <div style={{ marginBottom: '18px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #93c5fd 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 2px 8px rgba(239,68,68,0.12)'
            }}>
              <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>×</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>{title}</h2>
            <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>{message}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '18px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 28px',
                background: '#f3f4f6',
                color: '#64748b',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(100,116,139,0.08)',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(90deg, #1e3a8a 0%, #93c5fd 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239,68,68,0.12)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e3a8a'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(90deg, #1e3a8a 0%, #93c5fd 100%)'}
            >
              Hapus
            </button>
          </div>
        </div>
        <style>{`
          @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popUpModal {
            0% { transform: scale(0.85); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // Replace handleDelete and handleDeleteByYear to use modal
  const handleDelete = async (id: number) => {
    // Not implemented for individual row delete
    showNotification('info', 'Info', 'Hapus data individual belum diimplementasikan');
  };

  // Confirmation modal for delete year column
  const handleDeleteYearColumn = (year: number) => {
    setYearToDelete(year);
    setDeleteYearModalOpen(true);
  };

  const confirmDeleteYear = async () => {
    if (yearToDelete === null) return;

    try {
      const response = await fetch(`/api/data/jumlah-penduduk?tahun=${yearToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const 
       result= await response.json();
      
      if (result.success) {
        showNotification('success', 'Tahun Dihapus!', `Kolom tahun ${yearToDelete} berhasil dihapus dari semua kecamatan`);
        fetchJumlahPendudukData(); // Refresh data from database
        setDeleteYearModalOpen(false);
        setYearToDelete(null);
      } else {
        showNotification('error', 'Gagal Menghapus', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error deleting year:', error);
      showNotification('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus tahun');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nomor', 'Kecamatan', ...availableYears.map((year: number) => `Tahun ${year} (jiwa)`), 'Tahun'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.nomor,
        item.kecamatan,
        ...availableYears.map((year: number) => item.dataByYear[year]?.total || '0'),
        item.tahun
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
  link.download = 'jumlah_penduduk.csv';
    link.click();
  };

  const handleEditMode = () => {
    if (isEditMode) {
      // Cancel edit mode
      setIsEditMode(false);
      setEditData({});
      setInputValues({});
      showNotification('info', 'Edit Dibatalkan', 'Perubahan data telah dibatalkan');
    } else {
      // Enter edit mode
      setIsEditMode(true);
      // Initialize edit data
      const initialEditData: {[key: string]: {[key: number]: {total: string}}} = {};
      const initialInputValues: {[key: string]: string} = {};
      
      filteredData.forEach(data => {
        const byYear: {[key: number]: { total: string }} = {};
        availableYears.forEach(year => {
          const val = data.dataByYear[year]?.total ?? '0';
          byYear[year] = { total: val };
          const key = `${data.kecamatan}-${year}`;
          initialInputValues[key] = formatToIndonesianNumber(parseInt(val.replace(/\./g, '')));
        });
        initialEditData[data.kecamatan] = byYear;
      });
      
      setEditData(initialEditData);
      setInputValues(initialInputValues);
    }
  };

  const handleEditChange = (kecamatan: string, year: number, value: number) => {
    setEditData(prev => ({
      ...prev,
      [kecamatan]: {
        ...prev[kecamatan],
        [year]: { total: value.toString() }
      }
    }));
  };

  // Function to parse Indonesian number format (68.300,5 -> 68300.5)
  const parseIndonesianNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    
    // Replace Indonesian format: 68.300,5 becomes 68300.5
    // Remove dots (thousand separators) and replace comma with dot (decimal separator)
    const cleanValue = value
      .replace(/\./g, '') // Remove dots (thousand separators)
      .replace(',', '.'); // Replace comma with dot (decimal separator)
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Function to format number to Indonesian format (68300.5 -> 68.300,5)
  const formatToIndonesianNumber = (value: number): string => {
    if (value === 0) return '0';
    
    // Convert to string and split by decimal point
    const parts = value.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Add thousand separators (dots) to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Return with Indonesian decimal separator (comma)
    return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
  };

  // Format khusus untuk baris JUMLAH dengan 3 angka di belakang koma
  const formatToIndonesianNumberJumlah = (value: number): string => {
  if (value === 0) return '0';

  // Bulatkan ke 3 desimal, tapi hilangkan trailing zero
  const roundedValue = Math.round(value * 1000) / 1000;
  // Ubah ke string, lalu hapus trailing zero di belakang koma
  let fixed = roundedValue.toFixed(3);
  fixed = fixed.replace(/\.0+$/, ''); // Hapus .000
  fixed = fixed.replace(/(\.[0-9]*[1-9])0+$/, '$1'); // Hapus nol di belakang koma kecuali ada angka

  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousand separators (dots) to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Return with comma as decimal separator, only if ada decimal
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare updates array
      const updates: any[] = [];
      
      jumlahPendudukData.forEach(d => {
        const editDataForKecamatan = editData[d.kecamatan];
        if (editDataForKecamatan) {
          Object.entries(editDataForKecamatan).forEach(([year, val]) => {
            const jumlahPenduduk = parseInt(val.total.replace(/\./g, ''));
            updates.push({
              kecamatanId: d.id,
              tahun: parseInt(year),
              jumlahPenduduk: jumlahPenduduk
            });
          });
        }
      });

      // Save to database
      const response = await fetch('/api/data/jumlah-penduduk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const 
       result= await response.json();
      
      if (result.success) {
        showNotification('success', 'Data Tersimpan!', 'Perubahan data berhasil disimpan ke database');
        fetchJumlahPendudukData(); // Refresh data from database
        setIsEditMode(false);
        setEditData({});
        setInputValues({});
      } else {
        showNotification('error', 'Gagal Menyimpan', result.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      showNotification('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data');
    }
  };

  // Data kecamatan sekarang sinkron otomatis via API database

  // Dropdown kecamatan
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const kecamatanList = useMemo(() => jumlahPendudukData.map(d => d.kecamatan), [jumlahPendudukData]);

  // Data untuk grafik batang
  const chartData = useMemo(() => {
    if (!selectedKecamatan) {
      // Semua kecamatan: tampilkan total per kecamatan (tahun terakhir)
      const tahunTerbaru = availableYears[availableYears.length - 1];
      return jumlahPendudukData.map(d => ({
        kecamatan: d.kecamatan,
        jumlahPenduduk: d.dataByYear[tahunTerbaru]?.total ? parseInt(d.dataByYear[tahunTerbaru].total.replace(/\./g, '')) : 0
      }));
    } else {
      // Satu kecamatan: tampilkan data per tahun
      const data = jumlahPendudukData.find(d => d.kecamatan === selectedKecamatan);
      if (!data) return [];
      return availableYears.map(tahun => ({
        tahun,
        jumlahPenduduk: data.dataByYear[tahun]?.total ? parseInt(data.dataByYear[tahun].total.replace(/\./g, '')) : 0
      }));
    }
  }, [selectedKecamatan, jumlahPendudukData, availableYears]);

  return (
    <>
      {/* Shimmer Animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      {/* Confirmation Modal for Delete Year Column - rendered outside table to prevent shifting */}
      {deleteYearModalOpen && yearToDelete !== null && (
        <ConfirmationModal
          open={deleteYearModalOpen}
          onClose={() => setDeleteYearModalOpen(false)}
          onConfirm={confirmDeleteYear}
          title={`Hapus Kolom Tahun ${yearToDelete}`}
          message={`Apakah Anda yakin ingin menghapus kolom tahun ${yearToDelete} dari semua kecamatan? Data tahun ini akan dihapus permanen dari database.`}
        />
      )}
      
      {/* Beautiful Notification Toast */}
      {notification.show && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              minWidth: '320px',
              maxWidth: '500px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -1px rgba(0, 0, 0, 0.1)',
              border: `3px solid ${
                notification.type === 'success' ? '#10b981' :
                notification.type === 'error' ? '#1e3a8a' :
                notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }`,
              animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${
                notification.type === 'success' ? '#10b981, #34d399' :
                notification.type === 'error' ? '#1e3a8a, #93c5fd' :
                notification.type === 'warning' ? '#f59e0b, #fbbf24' : '#3b82f6, #60a5fa'
              })`,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                {notification.type === 'success' ? '✓' :
                 notification.type === 'error' ? '✕' :
                 notification.type === 'warning' ? '⚠' : 'ℹ'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  margin: '0 0 4px 0',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700'
                }}>
                  {notification.title}
                </h4>
                <p style={{
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>
          </div>
        )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
            display: none !important;
          }
          
          input[type="number"] {
            -moz-appearance: textfield !important;
            appearance: textfield !important;
          }
          
          input[type="number"]:focus::-webkit-outer-spin-button,
          input[type="number"]:focus::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
            display: none !important;
          }
        `
      }} />
      
      <div className="admin-page-zoom" style={{ 
        minHeight: '100vh',
        background: 'white'
      }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar  />
      <main style={{ 
        marginLeft: isMobile ? '0' : (isSidebarOpen ? '260px' : '64px'), 
        flex: 1, 
        padding: isMobile ? '80px 16px 16px 16px' : '32px 16px',
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        {/* Menu profil di ujung kanan atas - hanya tampil di desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
            <ProfileMenu />
          </div>
        )}
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#1e3a8a20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users style={{ width: '32px', height: '32px', color: '#1e3a8a' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#1e3a8a',
                  margin: '0 0 8px 0'
                }}>
                  Jumlah Penduduk
                </h1>
                <p style={{ 
                  color: '#6b7280', 
                  margin: 0, 
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  Data jumlah penduduk per kecamatan di Kota Palembang
                </p>
                 </div>
            </div>
          </div>

            {/* Filter dan Search */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
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
                  placeholder="Cari kecamatan..."
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
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Info hasil filter */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div>
                <p style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Menampilkan <strong>{filteredData.length}</strong> data kecamatan
                  {searchTerm && ` dengan pencarian "${searchTerm}"`}
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    (Data tersinkronisasi dengan halaman Per-Kecamatan)
                  </span>
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '12px',
                  color: '#92400e',
                  lineHeight: '1.6'
                }}>
                  <strong>Petunjuk:</strong> Klik tombol Edit Data untuk mengubah nilai jumlah penduduk, kemudian tekan Simpan Semua untuk menyimpan data ke dalam basis data. Datanya akan menghitung otomatis. Gunakan tombol Tambah Tahun untuk menambah tahun dan ikon X untuk menghapus kolom tahun.
                </p>
              </div>
            </div>

            {/* Tombol Export dan Tambah */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginBottom: '16px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={exportToCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              >
                <Download size={16} />
                Export CSV
              </button>

              <button
                onClick={handleEditMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: isEditMode ? '#1e3a8a' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = isEditMode ? '#b91c1c' : '#d97706'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = isEditMode ? '#1e3a8a' : '#f59e0b'}
              >
                <Edit size={16} />
                {isEditMode ? 'Batal Edit' : 'Edit Data'}
              </button>

              {isEditMode && (
                <button
                  onClick={handleSaveChanges}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  <Save size={16} />
                  Simpan Perubahan
                </button>
              )}

              <button
                onClick={() => handleOpenModal('add')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: '#7c3aed', // purple
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.15)',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
              >
                <BarChart3 size={16} color="#fff" />
                Tambah Tahun
              </button>
            </div>

            {/* Tabel */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    {/* Header Level 1 */}
                    <tr style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #93c5fd 100%)',
                      color: 'white'
                    }}>
                      <th rowSpan={2} style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        fontSize: '13px',
                        borderRight: '2px solid rgba(255, 255, 255, 0.2)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        width: '80px',
                        verticalAlign: 'middle'
                      }}>Nomor</th>
                      <th rowSpan={2} style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        fontSize: '13px',
                        borderRight: '2px solid rgba(255, 255, 255, 0.2)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        width: '180px',
                        minWidth: '180px',
                        maxWidth: '180px',
                        verticalAlign: 'middle'
                      }}>Kecamatan</th>
                      <th colSpan={pagedYears.length} style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        fontWeight: '700', 
                        fontSize: '13px',
                        borderRight: '2px solid rgba(255, 255, 255, 0.2)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        Jumlah Penduduk (jiwa)
                      </th>
                    </tr>
                    {/* Header Level 2 - Years */}
                    <tr style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #93c5fd 100%)',
                      color: 'white'
                    }}>
                      {pagedYears.map((year: number, index: number) => (
                        <th key={year} style={{ 
                          padding: '8px 12px', 
                          textAlign: 'center', 
                          fontWeight: '700', 
                          fontSize: '16px',
                          borderRight: index === pagedYears.length - 1 ? '2px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
                          width: '120px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span>Tahun {year}</span>
                            <button
                              onClick={() => handleDeleteYearColumn(year)}
                              style={{
                                background: '#ef4444', // merah
                                border: 'none',
                                borderRadius: '4px',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#b91c1c';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title={`Hapus kolom tahun ${year}`}
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                          <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '2px solid #e5e7eb' }}>
                            <div style={{ 
                              height: '20px', 
                              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '4px',
                              margin: '0 auto',
                              width: '30px'
                            }} />
                          </td>
                          <td style={{ padding: '8px 12px', borderRight: '2px solid #e5e7eb' }}>
                            <div style={{ 
                              height: '20px', 
                              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '4px',
                              width: '140px'
                            }} />
                          </td>
                          {pagedYears.map((year: number, yearIndex: number) => (
                            <td key={year} style={{ 
                              padding: '8px 12px', 
                              textAlign: 'center',
                              borderRight: yearIndex === pagedYears.length - 1 ? '2px solid #e5e7eb' : '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                height: '20px', 
                                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                                borderRadius: '4px',
                                margin: '0 auto',
                                width: '80px'
                              }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      currentData.map((data, index) => (
                      <tr
                        key={data.id || (data.kecamatan + '-' + (data.tahun || index))}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                          borderBottom: '2px solid #e5e7eb',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9fafb' : 'white'}
                      >
                        <td style={{ 
                          padding: '8px 12px',
                          textAlign: 'center',
                          borderRight: '2px solid #e5e7eb',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {data.nomor}
                        </td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '2px solid #e5e7eb',
                          width: '180px',
                          minWidth: '180px',
                          maxWidth: '180px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: '#1e3a8a20'
                            }}>
                              <Users style={{ width: '16px', height: '16px', color: '#1e3a8a' }} />
                            </div>
                            <div>
                              <p style={{ margin: '0', fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                                {data.kecamatan}
                              </p>
                            </div>
                          </div>
                        </td>
                        {pagedYears.map((year: number, yearIndex: number) => (
                          <td key={year} style={{ 
                            padding: '8px 12px', 
                            textAlign: 'center',
                            borderRight: yearIndex === pagedYears.length - 1 ? '2px solid #e5e7eb' : '1px solid #e5e7eb'
                          }}>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={inputValues[`${data.kecamatan}-${year}`] !== undefined ? inputValues[`${data.kecamatan}-${year}`] : formatToIndonesianNumber(parseInt(editData[data.kecamatan]?.[year]?.total ?? data.dataByYear[year]?.total ?? '0'))}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  const key = `${data.kecamatan}-${year}`;
                                  
                                  // Allow user to type freely including dots and commas
                                  // Only allow numbers, dots, and commas
                                  if (/^[0-9.,]*$/.test(inputValue) || inputValue === '') {
                                    setInputValues(prev => ({
                                      ...prev,
                                      [key]: inputValue
                                    }));
                                  }
                                }}
                                onBlur={(e) => {
                                  const inputValue = e.target.value;
                                  const key = `${data.kecamatan}-${year}`;
                                  
                                  // Parse and update the actual data when user finishes editing
                                  if (inputValue === '') {
                                    handleEditChange(data.kecamatan, year, 0);
                                    setInputValues(prev => ({
                                      ...prev,
                                      [key]: '0'
                                    }));
                                  } else {
                                    const parsedValue = parseIndonesianNumber(inputValue);
                                    handleEditChange(data.kecamatan, year, parsedValue);
                                    // Update input with properly formatted value
                                    setInputValues(prev => ({
                                      ...prev,
                                      [key]: formatToIndonesianNumber(parsedValue)
                                    }));
                                  }
                                  
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.backgroundColor = 'white';
                                }}
                                placeholder="Contoh: 68.300,5"
                                style={{
                                  width: '120px',
                                  padding: '6px 8px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  fontSize: '14px',
                                  color: '#000000',
                                  backgroundColor: 'white',
                                  outline: 'none',
                                  transition: 'all 0.2s',
                                  cursor: 'text'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#2563eb';
                                  e.target.style.backgroundColor = 'white';
                                }}
                              />
                            ) : (
                              <span style={{
                                fontSize: '14px',
                                color: '#000000',
                                fontWeight: '500'
                              }}>
                                {data.dataByYear[year]?.total ?? 0}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                    
                    {/* Baris Jumlah */}
                    <tr style={{ 
                      backgroundColor: '#f1f5f9', 
                      borderTop: '2px solid #e2e8f0',
                      fontWeight: 'bold'
                    }}>
                      <td style={{ 
                        padding: '12px', 
                        borderRight: '1px solid #e5e7eb',
                        color: '#1e40af',
                        fontWeight: '700',
                        textAlign: 'center'
                      }} colSpan={2}>
                        JUMLAH
                      </td>
                      {pagedYears.map((year: number, yearIndex: number) => (
                        <td key={`total-${year}`} style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          borderRight: yearIndex === pagedYears.length - 1 ? '2px solid #e5e7eb' : '1px solid #e5e7eb',
                          color: '#1e40af',
                          fontWeight: '700'
                        }}>
                          {formatToIndonesianNumberJumlah(totalsByYear[year] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Year Column Pagination */}
              {totalYearPages > 1 && (
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:'1px solid #e5e7eb',background:'#f9fafb' }}>
                  <button disabled={yearPage===0} onClick={()=>setYearPage(p=>p-1)} style={{ padding:'6px 14px',background:yearPage===0?'#e5e7eb':'#1e3a8a',color:yearPage===0?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage===0?'default':'pointer' }}>← Sebelumnya</button>
                  <span style={{ fontSize:'12px',color:'#6b7280',fontWeight:'600' }}>Kolom Tahun: Halaman {yearPage+1} dari {totalYearPages}</span>
                  <button disabled={yearPage>=totalYearPages-1} onClick={()=>setYearPage(p=>p+1)} style={{ padding:'6px 14px',background:yearPage>=totalYearPages-1?'#e5e7eb':'#1e3a8a',color:yearPage>=totalYearPages-1?'#9ca3af':'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:'600',cursor:yearPage>=totalYearPages-1?'default':'pointer' }}>Selanjutnya →</button>
                </div>
              )}

              {/* Keterangan Singkatan */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderLeft: '4px solid #3b82f6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Keterangan:</span>
                  <span><strong>Jiwa</strong> = Jumlah penduduk dalam satuan jiwa per tahun</span>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '12px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
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
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <Plus style={{ width: '28px', height: '28px', color: '#7c3aed' }} />
                      Tambah Tahun Baru
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000000' }}>
                        Tahun *
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        step="1"
                        value={formData.tahun}
                        onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || new Date().getFullYear() })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          color: '#000000',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield',
                          appearance: 'textfield'
                        } as React.CSSProperties & { WebkitAppearance?: string; MozAppearance?: string; appearance?: string }}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <p style={{ 
                        margin: '8px 0 0 0', 
                        fontSize: '12px', 
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        Menambahkan kolom tahun baru ke tabel untuk semua kecamatan
                      </p>
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
                        <Save style={{ width: '20px', height: '20px', color: '#fff' }} />
                        Tambah Tahun
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Render modal at root */}
            {modalOpen && (
              <ConfirmationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={modalAction}
                title={modalTitle}
                message={modalMessage}
              />
            )}
          </div>
        </div>
      </main>
        </div>
      </div>
    </>
  );
}



