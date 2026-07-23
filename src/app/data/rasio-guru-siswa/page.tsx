"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Download, Search, FileJson, BookOpen } from "lucide-react";
import UserNavbar from "../../User/UserNavbar";
import { utils, writeFile } from "xlsx";

const Footer = dynamic(() => import("../../components/Footer"), { ssr: false });

type RasioRow = {
  kecamatan_id?: number;
  kecamatan: string;
  tahun: string;
  jumlah_sekolah: number;
  total_guru: number;
  total_siswa: number;
  rasio_guru_siswa: number;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function RasioGuruSiswaPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [rows, setRows] = useState<RasioRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const YEARS_PER_PAGE = 4;
  const [yearPage, setYearPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch("/api/data/rasio-guru-siswa", { cache: "no-store" });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.error || "Gagal memuat data");
        setRows(Array.isArray(result.data) ? result.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableDistricts = useMemo(
    () => Array.from(new Set(rows.map((r) => r.kecamatan))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.kecamatan.toLowerCase().includes(q);
      const matchDistrict = !kecamatanFilter || r.kecamatan === kecamatanFilter;
      return matchSearch && matchDistrict;
    });
  }, [rows, searchTerm, kecamatanFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, kecamatanFilter]);
  useEffect(() => { setYearPage(0); }, [filteredRows.length]);

  const availableYears = useMemo(
    () => Array.from(new Set(filteredRows.map((r) => r.tahun))).sort((a, b) => a.localeCompare(b)),
    [filteredRows]
  );

  const groupedRows = useMemo(() => {
    const map = new Map<string, { kecamatan_id?: number; kecamatan: string; perYear: Record<string, RasioRow> }>();
    filteredRows.forEach((row) => {
      const key = `${row.kecamatan_id ?? row.kecamatan}-${row.kecamatan}`;
      if (!map.has(key)) map.set(key, { kecamatan_id: row.kecamatan_id, kecamatan: row.kecamatan, perYear: {} });
      map.get(key)!.perYear[row.tahun] = row;
    });
    return Array.from(map.values()).sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
  }, [filteredRows]);

  const totalPages = Math.ceil(groupedRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(
    () => groupedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [groupedRows, currentPage]
  );

  const totalYearPages = Math.max(1, Math.ceil(availableYears.length / YEARS_PER_PAGE));
  const yearStart = yearPage * YEARS_PER_PAGE;
  const pagedYears = availableYears.length > 0 ? availableYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : ["-"];

  // Summary totals per year
  const totalsByYear = useMemo(() => {
    return pagedYears.map((year) => {
      const yearRows = filteredRows.filter((r) => r.tahun === year);
      const guru = yearRows.reduce((s, r) => s + Number(r.total_guru ?? 0), 0);
      const siswa = yearRows.reduce((s, r) => s + Number(r.total_siswa ?? 0), 0);
      const rasio = guru === 0 ? 0 : parseFloat((siswa / guru).toFixed(2));
      return { guru, siswa, rasio };
    });
  }, [filteredRows, pagedYears]);

  const exportCSV = () => {
    const headers = ["No", "Kecamatan", "Tahun", "Jumlah Sekolah", "Total Guru", "Total Siswa", "Rasio Guru:Siswa"];
    const csvRows = filteredRows.map((row, i) => [
      i + 1, row.kecamatan, row.tahun,
      Number(row.jumlah_sekolah ?? 0),
      Number(row.total_guru ?? 0),
      Number(row.total_siswa ?? 0),
      Number(row.rasio_guru_siswa ?? 0),
    ]);
    const content = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rasio-guru-siswa.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = () => {
    const wb = utils.book_new();
    const headers = ["No", "Kecamatan", "Tahun", "Jumlah Sekolah", "Total Guru", "Total Siswa", "Rasio Guru:Siswa"];
    const xlsRows = filteredRows.map((row, i) => [
      i + 1, row.kecamatan, row.tahun,
      Number(row.jumlah_sekolah ?? 0),
      Number(row.total_guru ?? 0),
      Number(row.total_siswa ?? 0),
      Number(row.rasio_guru_siswa ?? 0),
    ]);
    const ws = utils.aoa_to_sheet([headers, ...xlsRows]);
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
    utils.book_append_sheet(wb, ws, "Rasio Guru Siswa");
    writeFile(wb, "rasio-guru-siswa.xlsx");
  };

  const thStyle: React.CSSProperties = {
    textAlign: "center", padding: "10px 12px", color: "#1e293b",
    border: "1px solid #9ca3af", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "10px 12px", fontSize: 13, color: "#334155",
    border: "1px solid #d1d5db", whiteSpace: "nowrap",
  };

  return (
    <>
      <UserNavbar />
      <div className="user-content-zoom" style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: 40, paddingTop: 60 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "16px 12px" : "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 10, backgroundColor: "#dbeafe", display: "flex" }}>
              <BookOpen style={{ width: 28, height: 28, color: "#1e3a8a" }} />
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#1f2937", margin: 0 }}>
                Rasio Guru : Siswa
              </h1>
              <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: isMobile ? 13 : 15, fontWeight: 500 }}>
                Perbandingan jumlah guru terhadap siswa per kecamatan
              </p>
            </div>
          </div>

          {/* Filter & Export */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: "stretch" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} />
                <input
                  type="text" placeholder="Cari kecamatan..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: isMobile ? "10px 12px 10px 34px" : "11px 14px 11px 36px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: isMobile ? 13 : 14, outline: "none", background: "#fff" }}
                />
              </div>
              <select
                value={kecamatanFilter} onChange={(e) => setKecamatanFilter(e.target.value)}
                style={{ minWidth: isMobile ? "100%" : 200, padding: isMobile ? "10px 12px" : "11px 14px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: isMobile ? 13 : 14, background: "#fff", color: "#1f2937", outline: "none" }}
              >
                <option value="">Semua Kecamatan</option>
                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={exportCSV} disabled={filteredRows.length === 0}
                title="Export ke CSV"
                style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 7, padding: isMobile ? "8px 11px" : "9px 13px", borderRadius: 7, border: "none", background: filteredRows.length === 0 ? "#94a3b8" : "#16a34a", color: "white", fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: filteredRows.length === 0 ? "not-allowed" : "pointer", opacity: filteredRows.length === 0 ? 0.6 : 1 }}>
                <Download size={isMobile ? 13 : 15} />
                {isMobile ? "CSV" : "Export CSV"}
              </button>
              <button onClick={exportXLS} disabled={filteredRows.length === 0}
                title="Export ke Excel"
                style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 7, padding: isMobile ? "8px 11px" : "9px 13px", borderRadius: 7, border: "none", background: filteredRows.length === 0 ? "#94a3b8" : "#0ea5e9", color: "white", fontWeight: 600, fontSize: isMobile ? 12 : 13, cursor: filteredRows.length === 0 ? "not-allowed" : "pointer", opacity: filteredRows.length === 0 ? 0.6 : 1 }}>
                <FileJson size={isMobile ? 13 : 15} />
                {isMobile ? "XLS" : "Export XLS"}
              </button>
            </div>
          </div>

          <div style={{ background: "#f3f4f6", borderRadius: 7, marginBottom: 12, padding: "9px 14px", color: "#374151", fontSize: 12 }}>
            Menampilkan {filteredRows.length} baris data {searchTerm && `dengan pencarian "${searchTerm}"`}.
          </div>

          {/* Table */}
          <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}>
            {isLoading ? (
              <div style={{ padding: 20, color: "#64748b" }}>Memuat data...</div>
            ) : error ? (
              <div style={{ padding: 20, color: "#dc2626", fontWeight: 600 }}>{error}</div>
            ) : filteredRows.length === 0 ? (
              <div style={{ padding: 20, color: "#64748b" }}>Data tidak ditemukan.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, border: "1px solid #9ca3af" }}>
                  <thead>
                    <tr style={{ background: "#e5e7eb" }}>
                      <th rowSpan={2} style={thStyle}>No</th>
                      <th rowSpan={2} style={thStyle}>Kecamatan</th>
                      {pagedYears.map((year, i) => (
                        <th key={i} colSpan={3} style={thStyle}>{year === "-" ? "-" : `Tahun ${year}`}</th>
                      ))}
                    </tr>
                    <tr style={{ background: "#f3f4f6" }}>
                      {pagedYears.map((year, i) => (
                        <React.Fragment key={i}>
                          <th style={{ ...thStyle, fontSize: 11, background: "#f3f4f6" }}>Guru</th>
                          <th style={{ ...thStyle, fontSize: 11, background: "#f3f4f6" }}>Siswa</th>
                          <th style={{ ...thStyle, fontSize: 11, background: "#f3f4f6" }}>Rasio</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={`${row.kecamatan}-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                        <td style={{ ...tdStyle, textAlign: "center" }}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {row.kecamatan_id ? (
                            <span
                              onClick={() => router.push(`/data/kecamatan-detail/${row.kecamatan_id}?type=rasio&name=${encodeURIComponent(row.kecamatan)}`)}
                              style={{ color: '#1d4ed8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              {row.kecamatan}
                            </span>
                          ) : row.kecamatan}
                        </td>
                        {pagedYears.map((year) => {
                          const d = row.perYear[year];
                          const rasio = Number(d?.rasio_guru_siswa ?? 0);
                          return (
                            <React.Fragment key={year}>
                              <td style={{ ...tdStyle, textAlign: "right" }}>{Number(d?.total_guru ?? 0).toLocaleString("id-ID")}</td>
                              <td style={{ ...tdStyle, textAlign: "right" }}>{Number(d?.total_siswa ?? 0).toLocaleString("id-ID")}</td>
                              <td style={{ ...tdStyle, textAlign: "center" }}>
                                <span style={{ padding: "3px 7px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                                  {rasio === 0 ? "-" : rasio.toFixed(2)}
                                </span>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#d1d5db" }}>
                      <td colSpan={2} style={{ ...tdStyle, fontWeight: 800, background: "#d1d5db" }}>Total</td>
                      {totalsByYear.map((t, i) => {
                        return (
                          <React.Fragment key={i}>
                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, background: "#d1d5db" }}>{t.guru.toLocaleString("id-ID")}</td>
                            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, background: "#d1d5db" }}>{t.siswa.toLocaleString("id-ID")}</td>
                            <td style={{ ...tdStyle, textAlign: "center", background: "#d1d5db" }}>
                              <span style={{ padding: "3px 7px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                                {t.rasio === 0 ? "-" : t.rasio.toFixed(2)}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Row Pagination */}
            {!isLoading && totalPages > 1 && (
              <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb" }}>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Halaman {currentPage} dari {totalPages} (total {groupedRows.length} data)</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, backgroundColor: currentPage === 1 ? "#f9fafb" : "white", color: currentPage === 1 ? "#9ca3af" : "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 500 }}>Sebelumnya</button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, backgroundColor: currentPage === totalPages ? "#f9fafb" : "white", color: currentPage === totalPages ? "#9ca3af" : "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 500 }}>Selanjutnya</button>
                </div>
              </div>
            )}

            {/* Year Pagination */}
            {totalYearPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <button disabled={yearPage === 0} onClick={() => setYearPage((p) => p - 1)}
                  style={{ padding: "6px 14px", background: yearPage === 0 ? "#e5e7eb" : "#1e3a8a", color: yearPage === 0 ? "#9ca3af" : "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: yearPage === 0 ? "default" : "pointer" }}>← Sebelumnya</button>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Kolom Tahun: Halaman {yearPage + 1} dari {totalYearPages}</span>
                <button disabled={yearPage >= totalYearPages - 1} onClick={() => setYearPage((p) => p + 1)}
                  style={{ padding: "6px 14px", background: yearPage >= totalYearPages - 1 ? "#e5e7eb" : "#1e3a8a", color: yearPage >= totalYearPages - 1 ? "#9ca3af" : "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: yearPage >= totalYearPages - 1 ? "default" : "pointer" }}>Selanjutnya →</button>
              </div>
            )}

            {/* Sumber */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", backgroundColor: "#f0f9ff", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#0369a1" }}>📌</span>
              <span style={{ fontSize: 12, color: "#475569" }}><strong>Sumber:</strong> Dinas Pendidikan Kota Palembang, Data Semester Ganjil</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
