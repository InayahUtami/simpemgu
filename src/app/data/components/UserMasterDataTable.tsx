"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Download, Search, FileJson } from "lucide-react";
import UserNavbar from "../../User/UserNavbar";
import { utils, writeFile } from "xlsx";

const Footer = dynamic(() => import("../../components/Footer"), { ssr: false });

type MasterDataRow = {
  no?: number;
  kecamatan_id?: number;
  kecamatan: string;
  tahun: string;
  jumlah_sekolah?: number;
  [key: string]: string | number | undefined;
};

type ApiResponse = {
  success?: boolean;
  data?: MasterDataRow[];
  error?: string;
};

type UserMasterDataTableProps = {
  title: string;
  description: string;
  endpoint: string;
  valueKey: "total_guru" | "total_siswa" | "total_rombel";
  valueLabel: string;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function UserMasterDataTable({
  title,
  description,
  endpoint,
  valueKey,
  valueLabel,
}: UserMasterDataTableProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [rows, setRows] = useState<MasterDataRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const YEARS_PER_PAGE = 5;
  const [yearPage, setYearPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await fetch(endpoint, { cache: "no-store" });
        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Gagal memuat data");
        }

        setRows(Array.isArray(result.data) ? result.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  const availableDistricts = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.kecamatan))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchSearch = !q || row.kecamatan.toLowerCase().includes(q);
      const matchDistrict = !kecamatanFilter || row.kecamatan === kecamatanFilter;
      return matchSearch && matchDistrict;
    });
  }, [rows, searchTerm, kecamatanFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, kecamatanFilter]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(filteredRows.map((row) => row.tahun))).sort((a, b) => a.localeCompare(b));
  }, [filteredRows]);

  useEffect(() => {
    setYearPage(0);
  }, [availableYears.length]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, { kecamatan_id?: number; kecamatan: string; perYear: Record<string, MasterDataRow> }>();

    filteredRows.forEach((row) => {
      const key = `${row.kecamatan_id ?? row.kecamatan}-${row.kecamatan}`;
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
  const paginatedGroupedRows = useMemo(
    () => groupedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [groupedRows, currentPage]
  );

  const totalByYear = useMemo(() => {
    return availableYears.map((year) =>
      filteredRows.reduce((sum, row) => {
        if (row.tahun !== year) return sum;
        const value = Number(row[valueKey] ?? 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0)
    );
  }, [availableYears, filteredRows, valueKey]);

  const totalYearPages = Math.max(1, Math.ceil(availableYears.length / YEARS_PER_PAGE));
  const yearStart = yearPage * YEARS_PER_PAGE;
  const pagedYears = availableYears.length > 0 ? availableYears.slice(yearStart, yearStart + YEARS_PER_PAGE) : ["-"];
  const pagedTotals = totalByYear.slice(yearStart, yearStart + YEARS_PER_PAGE);

  const exportCSV = () => {
    const allYears = availableYears; // semua tahun, bukan hanya yang tampil di halaman
    const headers = ["No", "Kecamatan", ...allYears.map((y) => `${valueLabel} ${y}`)];
    const csvRows = groupedRows.map((gr, index) => [
      index + 1,
      gr.kecamatan,
      ...allYears.map((y) => Number(gr.perYear[y]?.[valueKey] ?? 0)),
    ]);
    const csvContent = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-semua-tahun.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLS = () => {
    const allYears = availableYears; // semua tahun, bukan hanya yang tampil di halaman
    const wb = utils.book_new();
    const headers = ["No", "Kecamatan", ...allYears.map((y) => `${valueLabel} ${y}`)];
    const xlsxRows = groupedRows.map((gr, index) => [
      index + 1,
      gr.kecamatan,
      ...allYears.map((y) => Number(gr.perYear[y]?.[valueKey] ?? 0)),
    ]);
    
    const ws = utils.aoa_to_sheet([headers, ...xlsxRows]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      ...allYears.map(() => ({ wch: 18 })),
    ];
    
    // Style header row
    const headerRange = utils.decode_range(ws['!ref'] || 'A1');
    for (let i = 0; i <= headerRange.e.c; i++) {
      const cell = ws[utils.encode_col(i) + '1'];
      if (cell) {
        cell.s = {
          fill: { fgColor: { rgb: "E5E7EB" } },
          font: { bold: true },
          alignment: { horizontal: 'center' }
        };
      }
    }
    
    utils.book_append_sheet(wb, ws, "Data");
    writeFile(wb, `${title.toLowerCase().replace(/\s+/g, "-")}-semua-tahun.xlsx`);
  };

  return (
    <>
      <UserNavbar />
      <div
        className="user-content-zoom"
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          paddingBottom: "40px",
          paddingTop: "60px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "16px 0" : "32px 16px" }}>
          <h1 style={{ fontSize: isMobile ? "26px" : "32px", fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>
            {title}
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 18, fontSize: isMobile ? "14px" : "16px", fontWeight: 500 }}>
            {description}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: "stretch" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Cari kecamatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: isMobile ? "10px 12px 10px 36px" : "12px 14px 12px 40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    fontSize: isMobile ? 13 : 15,
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>
              <select
                value={kecamatanFilter}
                onChange={(e) => setKecamatanFilter(e.target.value)}
                style={{
                  minWidth: isMobile ? "100%" : "220px",
                  padding: isMobile ? "10px 12px" : "12px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  fontSize: isMobile ? 13 : 14,
                  background: "#fff",
                  color: "#1f2937",
                  outline: "none",
                }}
              >
                <option value="">Semua Kecamatan</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 10 : 12, flexDirection: isMobile ? "row" : "row", justifyContent: "flex-end" }}>
              <button
                onClick={exportCSV}
                disabled={filteredRows.length === 0}
                title="Export ke format CSV"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  padding: isMobile ? "9px 12px" : "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: filteredRows.length === 0 ? "#94a3b8" : "#16a34a",
                  color: "white",
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 13,
                  cursor: filteredRows.length === 0 ? "not-allowed" : "pointer",
                  opacity: filteredRows.length === 0 ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                <Download size={isMobile ? 14 : 16} />
                {isMobile ? "CSV" : "Export CSV"}
              </button>
              <button
                onClick={exportXLS}
                disabled={filteredRows.length === 0}
                title="Export ke format Excel"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isMobile ? 6 : 8,
                  padding: isMobile ? "9px 12px" : "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: filteredRows.length === 0 ? "#94a3b8" : "#0ea5e9",
                  color: "white",
                  fontWeight: 600,
                  fontSize: isMobile ? 12 : 13,
                  cursor: filteredRows.length === 0 ? "not-allowed" : "pointer",
                  opacity: filteredRows.length === 0 ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                <FileJson size={isMobile ? 14 : 16} />
                {isMobile ? "XLS" : "Export XLS"}
              </button>
            </div>
          </div>

          <div style={{ background: "#f3f4f6", borderRadius: 8, marginBottom: 12, padding: "10px 14px", color: "#374151", fontSize: 12 }}>
            Menampilkan {filteredRows.length} baris data {title.toLowerCase()} {searchTerm && `dengan pencarian "${searchTerm}"`}.
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            {isLoading ? (
              <div style={{ padding: 20, color: "#64748b" }}>Memuat data...</div>
            ) : error ? (
              <div style={{ padding: 20, color: "#dc2626", fontWeight: 600 }}>{error}</div>
            ) : filteredRows.length === 0 ? (
              <div style={{ padding: 20, color: "#64748b" }}>Data tidak ditemukan.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, border: "1px solid #9ca3af" }}>
                  <thead>
                    <tr style={{ background: "#e5e7eb" }}>
                      <th rowSpan={2} style={thHeaderStyle}>No</th>
                      <th rowSpan={2} style={thHeaderStyle}>Kecamatan</th>
                      <th colSpan={Math.max(pagedYears.length, 1)} style={thHeaderStyle}>{valueLabel}</th>
                    </tr>
                    <tr style={{ background: "#e5e7eb" }}>
                      {pagedYears.map((year, index) => (
                        <th key={`year-${year}-${index}`} style={thHeaderStyle}>
                          {year === "-" ? "-" : `Tahun ${year}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGroupedRows.map((row, index) => (
                      <tr key={`${row.kecamatan_id ?? row.kecamatan}-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f3f4f6" }}>
                        <td style={tdStyle}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td style={tdStyle}>
                          {row.kecamatan_id ? (
                            <span
                              onClick={() => router.push(`/data/kecamatan-detail/${row.kecamatan_id}?type=${valueKey.replace('total_', '')}&name=${encodeURIComponent(row.kecamatan)}`)}
                              style={{ color: '#1d4ed8', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              {row.kecamatan}
                            </span>
                          ) : row.kecamatan}
                        </td>
                        {pagedYears.map((year) => (
                          <td key={`${row.kecamatan}-${year}`} style={{ ...tdStyle, textAlign: "right" }}>
                            {Number(row.perYear[year]?.[valueKey] ?? 0).toLocaleString("id-ID")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {!isLoading && filteredRows.length > 0 && (
                    <tfoot>
                      <tr style={{ background: "#d1d5db" }}>
                        <td colSpan={2} style={{ ...tdStyle, fontWeight: 800, background: "#d1d5db" }}>Total</td>
                        {pagedTotals.map((value, index) => (
                          <td key={`total-${index}`} style={{ ...tdStyle, textAlign: "right", fontWeight: 800, background: "#d1d5db" }}>
                            {value.toLocaleString("id-ID")}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb" }}>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Halaman {currentPage} dari {totalPages} (total {groupedRows.length} data)</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={pagerButtonStyle(currentPage === 1)}>
                    Sebelumnya
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pagerButtonStyle(currentPage === totalPages)}>
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}

            {totalYearPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                <button disabled={yearPage === 0} onClick={() => setYearPage((p) => p - 1)} style={yearPagerStyle(yearPage === 0)}>
                  ← Sebelumnya
                </button>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Kolom Tahun: Halaman {yearPage + 1} dari {totalYearPages}
                </span>
                <button disabled={yearPage >= totalYearPages - 1} onClick={() => setYearPage((p) => p + 1)} style={yearPagerStyle(yearPage >= totalYearPages - 1)}>
                  Selanjutnya →
                </button>
              </div>
            )}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#0369a1' }}>📌</span>
              <span style={{ fontSize: '12px', color: '#475569' }}><strong>Sumber:</strong> Dinas Pendidikan Kota Palembang, Data Semester Ganjil</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 13,
  fontWeight: 700,
  color: "#1e293b",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const thHeaderStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "12px",
  color: "#1e293b",
  border: "1px solid #9ca3af",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#334155",
  border: "1px solid #d1d5db",
  whiteSpace: "nowrap",
};

const pagerButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "12px",
  backgroundColor: disabled ? "#f9fafb" : "white",
  color: disabled ? "#9ca3af" : "#374151",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 500,
});

const yearPagerStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "6px 14px",
  background: disabled ? "#e5e7eb" : "#1e3a8a",
  color: disabled ? "#9ca3af" : "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: disabled ? "default" : "pointer",
});
