"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users2, Search, Download } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ProfileMenu from "../../components/ProfileMenu";
import { useSidebar } from "../../components/SidebarContext";

interface SekolahPerKecamatanRow {
  no: number;
  kecamatan_id: number;
  kecamatan: string;
  tahun: string;
  jumlah_sekolah: number;
}

interface MasterKecamatanRow {
  id: number;
  nama: string;
}

export default function DataJumlahSekolahPage() {
  const router = useRouter();
  const { isSidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [rows, setRows] = useState<SekolahPerKecamatanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("data");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [response, kecamatanResponse] = await Promise.all([
        fetch("/api/data/rombel-per-kecamatan", { cache: "no-store" }),
        fetch("/api/data/kecamatan", { cache: "no-store" }),
      ]);

      const [result, kecamatanResult] = await Promise.all([
        response.json(),
        kecamatanResponse.json(),
      ]);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memuat data jumlah sekolah");
      }

      if (!kecamatanResponse.ok || !kecamatanResult.success) {
        throw new Error(kecamatanResult.error || "Gagal memuat data kecamatan");
      }

      const sourceRows = Array.isArray(result.data) ? result.data : [];
      const masterKecamatan = Array.isArray(kecamatanResult.data) ? kecamatanResult.data : [];
      const availableYearsSource: string[] = Array.from(new Set<string>(sourceRows.map((row: SekolahPerKecamatanRow) => String(row.tahun)))).sort((a, b) => a.localeCompare(b));

      let syncedRows: SekolahPerKecamatanRow[] = sourceRows;

      if (masterKecamatan.length > 0) {
        if (availableYearsSource.length === 0) {
          syncedRows = masterKecamatan.map((kecamatan: MasterKecamatanRow, index: number) => ({
            no: index + 1,
            kecamatan_id: kecamatan.id,
            kecamatan: kecamatan.nama,
            tahun: '-',
            jumlah_sekolah: 0,
          }));
        } else {
          const sourceMap = new Map<string, SekolahPerKecamatanRow>(sourceRows.map((row: SekolahPerKecamatanRow) => [`${row.kecamatan_id}-${row.tahun}`, row]));
          syncedRows = [];

          masterKecamatan.forEach((kecamatan: MasterKecamatanRow) => {
            availableYearsSource.forEach((tahun: string) => {
              const key = `${kecamatan.id}-${tahun}`;
              const existing = sourceMap.get(key);

              if (existing) {
                syncedRows.push(existing);
              } else {
                syncedRows.push({
                  no: 0,
                  kecamatan_id: kecamatan.id,
                  kecamatan: kecamatan.nama,
                  tahun,
                  jumlah_sekolah: 0,
                });
              }
            });
          });
        }
      }

      setRows(syncedRows.map((row, index) => ({ ...row, no: index + 1 })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableDistricts = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.kecamatan))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchSearch = row.kecamatan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDistrict = !kecamatanFilter || row.kecamatan === kecamatanFilter;
      return matchSearch && matchDistrict;
    });
  }, [rows, searchTerm, kecamatanFilter]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(filteredRows.map((row) => row.tahun))).sort((a, b) => a.localeCompare(b));
  }, [filteredRows]);

  const displayYears = availableYears.length > 0 ? availableYears : ['-'];

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, kecamatanFilter]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, { kecamatan_id: number; kecamatan: string; perYear: Record<string, SekolahPerKecamatanRow> }>();

    filteredRows.forEach((row) => {
      const key = `${row.kecamatan_id}-${row.kecamatan}`;
      if (!map.has(key)) {
        map.set(key, {
          kecamatan_id: row.kecamatan_id,
          kecamatan: row.kecamatan,
          perYear: {},
        });
      }

      map.get(key)!.perYear[row.tahun] = row;
    });

    return Array.from(map.values()).sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
  }, [filteredRows]);

  const totalPages = Math.ceil(groupedRows.length / ITEMS_PER_PAGE);
  const paginatedGroupedRows = useMemo(() => groupedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [groupedRows, currentPage]);

  const totalSekolahByYear = useMemo(() => {
    return availableYears.map((year) =>
      filteredRows.reduce((acc, row) => (row.tahun === year ? acc + Number(row.jumlah_sekolah || 0) : acc), 0)
    );
  }, [filteredRows, availableYears]);

  const YEARS_PER_PAGE = 5;
  const [yearPage, setYearPage] = useState(0);
  useEffect(() => { setYearPage(0); }, [availableYears.length]);
  const totalYearPages = Math.max(1, Math.ceil(availableYears.length / YEARS_PER_PAGE));
  const yearStart = yearPage * YEARS_PER_PAGE;
  const pagedYears = availableYears.length > 0 ? availableYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : ['-'];
  const pagedSekolahTotals = totalSekolahByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);

  const exportCSV = () => {
    const headers = ['No', 'Kecamatan', 'Tahun', 'Jumlah Sekolah'];
    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      `"${row.kecamatan}"`,
      row.tahun,
      row.jumlah_sekolah,
    ]);
    const csvContent = [headers, ...csvRows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jumlah-sekolah-per-kecamatan.csv';
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
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#1e3a8a20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users2 style={{ width: '32px', height: '32px', color: '#1e3a8a' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: '#1e3a8a' }}>
                    Jumlah Sekolah per Kecamatan
                  </h1>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '13px', fontWeight: '500' }}>
                    Data jumlah sekolah per kecamatan
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Cari kecamatan..."
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
              Menampilkan {filteredRows.length} baris data jumlah sekolah {searchTerm && `dengan pencarian "${searchTerm}"`}.
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginBottom: '16px', padding: '10px 14px', color: '#0c4a6e', fontSize: '12px', fontWeight: 600 }}>
              Data tersinkronisasi dengan halaman Per-Kecamatan.
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.06)', padding: '0', overflowX: 'auto' }}>
              {!isLoading && error && <p style={{ margin: 0, color: '#b91c1c', padding: '24px' }}>Gagal: {error}</p>}
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb' }}>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '12px', color: 'white', border: '1px solid #93c5fd', fontSize: '13px' }}>No</th>
                    <th rowSpan={2} style={{ textAlign: 'left', padding: '12px', color: 'white', border: '1px solid #93c5fd', fontSize: '13px' }}>Kecamatan</th>
                    <th colSpan={Math.max(pagedYears.length, 1)} style={{ textAlign: 'center', padding: '12px', color: 'white', border: '1px solid #93c5fd', fontSize: '13px' }}>Jumlah Sekolah</th>
                  </tr>
                  <tr style={{ background: '#e5e7eb' }}>
                    {pagedYears.map((year, index) => (
                      <th key={`sekolah-${year}-${index}`} style={{ textAlign: 'center', padding: '12px', color: 'white', border: '1px solid #93c5fd', fontSize: '13px' }}>
                        {year === '-' ? '-' : `Tahun ${year}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={`skeleton-${i}`} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>
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
                        {pagedYears.map((year, yearIndex) => (
                          <td key={`skeleton-sekolah-${year}-${yearIndex}`} style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right' }}>
                            <div style={{
                              height: '16px',
                              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 1.5s infinite',
                              borderRadius: '4px',
                              width: '50px',
                              marginLeft: 'auto'
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedGroupedRows.length > 0 ? (
                    paginatedGroupedRows.map((row, index) => (
                      <tr key={`${row.kecamatan_id}-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 700 }}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td 
                          onClick={() => router.push(`/admin/data/per-kecamatan/${row.kecamatan_id}?type=sekolah&name=${encodeURIComponent(row.kecamatan)}`)}
                          style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#2563eb' }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {row.kecamatan}
                        </td>
                        {pagedYears.map((year) => (
                          <td key={`sekolah-${row.kecamatan_id}-${year}`} style={{ padding: '12px', textAlign: 'right', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                            {Number(row.perYear[year]?.jumlah_sekolah || 0).toLocaleString('id-ID')}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2 + Math.max(pagedYears.length, 1)} style={{ padding: '28px 12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px', fontWeight: 600 }}>
                        Data jumlah sekolah tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
                {!isLoading && filteredRows.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#e5e7eb' }}>
                      <td colSpan={2} style={{ padding: '12px', fontWeight: 700, border: '1px solid #e5e7eb', fontSize: '13px', background: '#e5e7eb' }}>Total</td>
                      {pagedSekolahTotals.map((value, index) => (
                        <td key={`total-sekolah-${index}`} style={{ padding: '12px', textAlign: 'right', fontWeight: 700, border: '1px solid #e5e7eb', fontSize: '13px', background: '#e5e7eb' }}>
                          {value.toLocaleString('id-ID')}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '0 0 12px 12px' }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: '6px 14px', background: currentPage === 1 ? '#e5e7eb' : '#1e3a8a', color: currentPage === 1 ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: currentPage === 1 ? 'default' : 'pointer' }}>← Sebelumnya</button>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Halaman {currentPage} dari {totalPages}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: '6px 14px', background: currentPage >= totalPages ? '#e5e7eb' : '#1e3a8a', color: currentPage >= totalPages ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: currentPage >= totalPages ? 'default' : 'pointer' }}>Selanjutnya →</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      </div>
    </>
  );
}
