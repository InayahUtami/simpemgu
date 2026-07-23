-- ==============================================================================
-- MIGRATION: Create Pembobotan AHP Configuration Table
-- ==============================================================================
-- Table untuk menyimpan konfigurasi pembobotan AHP (Analytic Hierarchy Process)
-- yang digunakan dalam clustering analysis

USE ahc1;

-- ==============================================================================
-- Create table: pembobotan_ahp
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pembobotan_ahp (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  
  -- Weights untuk setiap variabel (nilai 0.0 - 10.0)
  penduduk DECIMAL(10, 4) NOT NULL DEFAULT 1.0,      -- Bobot untuk Jumlah Penduduk
  guru DECIMAL(10, 4) NOT NULL DEFAULT 1.0,          -- Bobot untuk Jumlah Guru
  siswa DECIMAL(10, 4) NOT NULL DEFAULT 1.0,         -- Bobot untuk Jumlah Siswa
  rombel DECIMAL(10, 4) NOT NULL DEFAULT 1.0,        -- Bobot untuk Jumlah Rombel
  rasio DECIMAL(10, 4) NOT NULL DEFAULT 1.0,         -- Bobot untuk Rasio (Siswa/Guru)
  
  -- Scale factor untuk amplifikasi pairwise comparison matrix
  scale DECIMAL(10, 4) NOT NULL DEFAULT 1.0,         -- Skala penguat (default 1.0)
  
  -- Status dan timestamp
  is_active BOOLEAN NOT NULL DEFAULT TRUE,            -- Apakah konfigurasi ini aktif
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes untuk query cepat
  KEY idx_active (is_active),
  KEY idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Insert default configuration
-- ==============================================================================
INSERT INTO pembobotan_ahp (penduduk, guru, siswa, rombel, rasio, scale, is_active)
VALUES (1.0, 1.0, 1.0, 1.0, 1.0, 1.0, TRUE)
ON DUPLICATE KEY UPDATE 
  updated_at = CURRENT_TIMESTAMP;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
