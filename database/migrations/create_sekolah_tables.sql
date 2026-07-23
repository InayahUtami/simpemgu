-- ==============================================================================
-- MIGRATION: Create School Data Tables (Data Guru, Siswa, Rombel)
-- ==============================================================================
-- Struktur yang konsisten dengan jumlah_penduduk
-- Support hierarchical view: Kecamatan -> Sekolah

USE ahc1;

-- ==============================================================================
-- 1. MASTER TABLE: sekolah_dasar
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sekolah_dasar (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  status ENUM('Negeri', 'Swasta') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_kecamatan (kecamatan_id),
  KEY idx_nama_sekolah (nama_sekolah),
  CONSTRAINT fk_sekolah_kecamatan FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. DATA TABLE: data_guru_sekolah
-- Format: Per Sekolah Per Tahun
-- ==============================================================================
CREATE TABLE IF NOT EXISTS data_guru_sekolah (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,
  jumlah_guru INT(11) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sekolah (sekolah_id),
  KEY idx_kecamatan (kecamatan_id),
  KEY idx_tahun (tahun),
  KEY idx_kecamatan_tahun (kecamatan_id, tahun),
  CONSTRAINT fk_guru_sekolah FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  CONSTRAINT fk_guru_kecamatan FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. DATA TABLE: data_siswa_sekolah
-- Format: Per Sekolah Per Tahun
-- ==============================================================================
CREATE TABLE IF NOT EXISTS data_siswa_sekolah (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,
  jumlah_siswa INT(11) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sekolah (sekolah_id),
  KEY idx_kecamatan (kecamatan_id),
  KEY idx_tahun (tahun),
  KEY idx_kecamatan_tahun (kecamatan_id, tahun),
  CONSTRAINT fk_siswa_sekolah FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  CONSTRAINT fk_siswa_kecamatan FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. DATA TABLE: data_rombel_sekolah
-- Rombel = Rombongan Belajar (Class Group)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS data_rombel_sekolah (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,
  jumlah_rombel INT(11) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sekolah (sekolah_id),
  KEY idx_kecamatan (kecamatan_id),
  KEY idx_tahun (tahun),
  KEY idx_kecamatan_tahun (kecamatan_id, tahun),
  CONSTRAINT fk_rombel_sekolah FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  CONSTRAINT fk_rombel_kecamatan FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. AGGREGATED VIEW: view_guru_per_kecamatan
-- Untuk halaman "Data Guru" - menampilkan total per kecamatan per tahun
-- ==============================================================================
CREATE OR REPLACE VIEW view_guru_per_kecamatan AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY k.id, dg.tahun ORDER BY k.id) as no,
  k.id as kecamatan_id,
  k.nama as kecamatan,
  dg.tahun,
  COUNT(DISTINCT dg.sekolah_id) as jumlah_sekolah,
  SUM(dg.jumlah_guru) as total_guru
FROM data_guru_sekolah dg
JOIN kecamatan k ON dg.kecamatan_id = k.id
GROUP BY dg.kecamatan_id, dg.tahun, k.nama, k.id
ORDER BY dg.tahun DESC, k.nama ASC;

-- ==============================================================================
-- 6. AGGREGATED VIEW: view_guru_per_sekolah
-- Untuk halaman"Data Guru - Detail Sekolah" - ketika diklik kecamatan
-- ==============================================================================
CREATE OR REPLACE VIEW view_guru_per_sekolah AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY dg.kecamatan_id, dg.tahun ORDER BY dg.nama_sekolah) as no,
  dg.kecamatan_id,
  (SELECT nama FROM kecamatan WHERE id = dg.kecamatan_id LIMIT 1) as kecamatan,
  dg.nama_sekolah,
  dg.tahun,
  dg.jumlah_guru
FROM data_guru_sekolah dg
ORDER BY dg.tahun DESC, dg.kecamatan_id ASC, dg.nama_sekolah ASC;

-- ==============================================================================
-- 7. AGGREGATED VIEW: view_siswa_per_kecamatan
-- Untuk halaman "Data Siswa" - menampilkan total per kecamatan per tahun
-- ==============================================================================
CREATE OR REPLACE VIEW view_siswa_per_kecamatan AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY k.id, ds.tahun ORDER BY k.id) as no,
  k.id as kecamatan_id,
  k.nama as kecamatan,
  ds.tahun,
  COUNT(DISTINCT ds.sekolah_id) as jumlah_sekolah,
  SUM(ds.jumlah_siswa) as total_siswa
FROM data_siswa_sekolah ds
JOIN kecamatan k ON ds.kecamatan_id = k.id
GROUP BY ds.kecamatan_id, ds.tahun, k.nama, k.id
ORDER BY ds.tahun DESC, k.nama ASC;

-- ==============================================================================
-- 8. AGGREGATED VIEW: view_siswa_per_sekolah
-- Untuk halaman "Data Siswa - Detail Sekolah"
-- ==============================================================================
CREATE OR REPLACE VIEW view_siswa_per_sekolah AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY ds.kecamatan_id, ds.tahun ORDER BY ds.nama_sekolah) as no,
  ds.kecamatan_id,
  (SELECT nama FROM kecamatan WHERE id = ds.kecamatan_id LIMIT 1) as kecamatan,
  ds.nama_sekolah,
  ds.tahun,
  ds.jumlah_siswa
FROM data_siswa_sekolah ds
ORDER BY ds.tahun DESC, ds.kecamatan_id ASC, ds.nama_sekolah ASC;

-- ==============================================================================
-- 9. AGGREGATED VIEW: view_rombel_per_kecamatan
-- Untuk halaman "Data Rombel" - menampilkan total per kecamatan per tahun
-- ==============================================================================
CREATE OR REPLACE VIEW view_rombel_per_kecamatan AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY k.id, dr.tahun ORDER BY k.id) as no,
  k.id as kecamatan_id,
  k.nama as kecamatan,
  dr.tahun,
  COUNT(DISTINCT dr.sekolah_id) as jumlah_sekolah,
  SUM(dr.jumlah_rombel) as total_rombel
FROM data_rombel_sekolah dr
JOIN kecamatan k ON dr.kecamatan_id = k.id
GROUP BY dr.kecamatan_id, dr.tahun, k.nama, k.id
ORDER BY dr.tahun DESC, k.nama ASC;

-- ==============================================================================
-- 10. AGGREGATED VIEW: view_rombel_per_sekolah
-- Untuk halaman "Data Rombel - Detail Sekolah"
-- ==============================================================================
CREATE OR REPLACE VIEW view_rombel_per_sekolah AS
SELECT 
  ROW_NUMBER() OVER (PARTITION BY dr.kecamatan_id, dr.tahun ORDER BY dr.nama_sekolah) as no,
  dr.kecamatan_id,
  (SELECT nama FROM kecamatan WHERE id = dr.kecamatan_id LIMIT 1) as kecamatan,
  dr.nama_sekolah,
  dr.tahun,
  dr.jumlah_rombel
FROM data_rombel_sekolah dr
ORDER BY dr.tahun DESC, dr.kecamatan_id ASC, dr.nama_sekolah ASC;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
