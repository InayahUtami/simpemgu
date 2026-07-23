-- ==============================================================================
-- IMPORT DATA: Nama SD, Guru, Siswa, Rombel dari CSV ke 4 tabel
-- ==============================================================================
-- Jalankan setelah create_sekolah_tables.sql

USE ahc1;

-- ==============================================================================
-- A. POPULATE DATA_GURU_SEKOLAH (dari CSV)
-- ==============================================================================
-- Format INSERT yang akan diisi secara programmatic dari Node.js

-- Contoh struktur INSERT:
-- INSERT INTO data_guru_sekolah 
-- (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_guru) 
-- VALUES 
-- (1, 1, 'SD BINA POTENSI PALEMBANG', '2019-2020', 9),
-- (2, 1, 'SD IGNATIUS GLOBAL SCHOOL CITRAGRAND CITY', '2019-2020', 9),
-- ...

-- ==============================================================================
-- B. POPULATE DATA_SISWA_SEKOLAH
-- ==============================================================================
-- INSERT INTO data_siswa_sekolah 
-- (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_siswa) 
-- VALUES 
-- (1, 1, 'SD BINA POTENSI PALEMBANG', '2019-2020', 44),
-- ...

-- ==============================================================================
-- C. POPULATE DATA_ROMBEL_SEKOLAH
-- ==============================================================================
-- INSERT INTO data_rombel_sekolah 
-- (sekolah_id, kecamatan_id, nama_sekolah, tahun, jumlah_rombel) 
-- VALUES 
-- (1, 1, 'SD BINA POTENSI PALEMBANG', '2019-2020', 6),
-- ...

-- Gunakan script Node.js di bawah untuk automated import
