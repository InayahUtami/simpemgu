"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Download } from "lucide-react";
import dynamic from "next/dynamic";
import UserNavbar from "../../User/UserNavbar";

const Footer = dynamic(() => import("../../components/Footer"), { ssr: false });

type SekolahRow = {
  id: number;
  kecamatan_id: number;
  kecamatan: string;
  nama_sekolah: string;
  status: string;
};

export default function NamaSekolahUserPage() {
  const [rows, setRows] = useState<SekolahRow[]>([]);
  const [filtered, setFiltered] = useState<SekolahRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Fetch all data once
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/data/nama-sekolah");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Gagal mengambil data");
        setRows(json.data ?? []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter whenever dependencies change
  useEffect(() => {
    let result = rows;
    if (kecamatanFilter !== "Semua") {
      result = result.filter((r) => r.kecamatan === kecamatanFilter);
    }
    if (statusFilter !== "Semua") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.nama_sekolah.toLowerCase().includes(q) ||
          r.kecamatan.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
    setPage(1);
  }, [rows, search, kecamatanFilter, statusFilter]);

  const kecamatanList = Array.from(new Set(rows.map((r) => r.kecamatan))).sort();
  const statusList = Array.from(new Set(rows.map((r) => r.status))).sort();

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = useCallback(() => {
    if (filtered.length === 0) return;
    const header = ["No", "Nama Sekolah", "Kecamatan", "Status"];
    const csvRows = [
      header.join(","),
      ...filtered.map((r, i) =>
        [
          i + 1,
          `"${r.nama_sekolah.replace(/"/g, '""')}"`,
          `"${r.kecamatan}"`,
          `"${r.status}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-nama-sekolah.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <UserNavbar />
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "76px 16px 40px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>
            Data Nama Sekolah
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 18, fontSize: "16px", fontWeight: 500 }}>
            Daftar sekolah dasar (SD) di Kota Palembang berdasarkan kecamatan dan status.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flexGrow: 1, minWidth: 220 }}>
            <Search
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              placeholder="Cari nama sekolah / kecamatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                background: "#f9fafb",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filter Kecamatan */}
          <select
            value={kecamatanFilter}
            onChange={(e) => setKecamatanFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              background: "#f9fafb",
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            <option value="Semua">Semua Kecamatan</option>
            {kecamatanList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              background: "#f9fafb",
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            <option value="Semua">Semua Status</option>
            {statusList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              background: filtered.length === 0 ? "#d1d5db" : "#059669",
              color: filtered.length === 0 ? "#9ca3af" : "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: filtered.length === 0 ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <Download style={{ width: 15, height: 15 }} />
            Export CSV
          </button>
        </div>

        {/* Info bar */}
        {!loading && !error && (
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
            Menampilkan <strong>{filtered.length}</strong> sekolah
            {filtered.length !== rows.length && (
              <span> dari total {rows.length}</span>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #d1d5db", background: "#ffffff" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Memuat data...</div>
          ) : error ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>Error: {error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Tidak ada data yang cocok.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["No", "Nama Sekolah", "Kecamatan", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: h === "No" ? "center" : "left",
                        background: "#e5e7eb",
                        color: "#374151",
                        fontWeight: 700,
                        fontSize: 13,
                        border: "1px solid #9ca3af",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, idx) => {
                  const globalIdx = (page - 1) * PER_PAGE + idx + 1;
                  const isEven = idx % 2 === 1;
                  return (
                    <tr key={row.id} style={{ background: isEven ? "#f3f4f6" : "#ffffff" }}>
                      <td style={{ padding: "10px 16px", border: "1px solid #d1d5db", textAlign: "center", color: "#6b7280", width: 50 }}>
                        {globalIdx}
                      </td>
                      <td style={{ padding: "10px 16px", border: "1px solid #d1d5db", color: "#1e293b", fontWeight: 500 }}>
                        {row.nama_sekolah}
                      </td>
                      <td style={{ padding: "10px 16px", border: "1px solid #d1d5db", color: "#374151" }}>
                        {row.kecamatan}
                      </td>
                      <td style={{ padding: "10px 16px", border: "1px solid #d1d5db" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            background: row.status === "Negeri" ? "#d1fae5" : "#fef3c7",
                            color: row.status === "Negeri" ? "#065f46" : "#92400e",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr style={{ background: "#d1d5db" }}>
                  <td colSpan={4} style={{ padding: "10px 16px", border: "1px solid #9ca3af", fontWeight: 700, color: "#374151", fontSize: 13 }}>
                    Total: {filtered.length} Sekolah
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: page === 1 ? "#f3f4f6" : "#ffffff",
                color: page === 1 ? "#9ca3af" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ‹ Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "..." ? (
                  <span key={`ellipsis-${i}`} style={{ padding: "7px 4px", color: "#9ca3af" }}>…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: page === item ? "#059669" : "#d1d5db",
                      background: page === item ? "#059669" : "#ffffff",
                      color: page === item ? "#ffffff" : "#374151",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: page === totalPages ? "#f3f4f6" : "#ffffff",
                color: page === totalPages ? "#9ca3af" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Berikutnya ›
            </button>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
