# 📚 MIGRASI DATA SEKOLAH DASAR - DOCUMENTATION

## Ringkasan
Dokumentasi ini menjelaskan struktur database dan langkah-langkah implementasi untuk fitur **Data Guru, Siswa, dan Rombel** yang terintegrasi dengan dashboard admin.

---

## 📊 Struktur Database

### 1. **Master Table: `sekolah_dasar`**
Tabel master untuk menyimpan informasi sekolah dasar.

```sql
CREATE TABLE sekolah_dasar (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  status ENUM('Negeri', 'Swasta') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);
```

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INT | Primary key, auto increment |
| kecamatan_id | INT | Foreign key ke tabel kecamatan |
| nama_sekolah | VARCHAR(255) | Nama lengkap sekolah |
| status | ENUM | Negeri atau Swasta |
| created_at | TIMESTAMP | Waktu pembuatan record |
| updated_at | TIMESTAMP | Waktu update terakhir |

---

### 2. **Detail Table: `data_guru_sekolah`**
Menyimpan jumlah guru per sekolah per tahun akademik.

```sql
CREATE TABLE data_guru_sekolah (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,        -- Format: YYYY-YYYY (e.g., 2019-2020)
  jumlah_guru INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);
```

---

### 3. **Detail Table: `data_siswa_sekolah`**
Menyimpan jumlah siswa per sekolah per tahun akademik.

```sql
CREATE TABLE data_siswa_sekolah (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,
  jumlah_siswa INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);
```

---

### 4. **Detail Table: `data_rombel_sekolah`**
Menyimpan jumlah rombel (rombongan belajar/kelas) per sekolah per tahun akademik.

```sql
CREATE TABLE data_rombel_sekolah (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  sekolah_id INT(11) NOT NULL,
  kecamatan_id INT(11) NOT NULL,
  nama_sekolah VARCHAR(255) NOT NULL,
  tahun VARCHAR(9) NOT NULL,
  jumlah_rombel INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sekolah_id) REFERENCES sekolah_dasar(id) ON DELETE CASCADE,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);
```

---

### 5. **Aggregated Views**

#### View: `view_guru_per_kecamatan`
Menampilkan total guru per kecamatan per tahun (untuk halaman "Data Guru")

```sql
SELECT 
  no,                      -- Row number
  kecamatan_id,
  kecamatan,               -- Nama kecamatan
  tahun,
  jumlah_sekolah,          -- Berapa banyak sekolah
  total_guru               -- Total guru
FROM view_guru_per_kecamatan
ORDER BY tahun DESC, kecamatan ASC;
```

---

#### View: `view_guru_per_sekolah`
Detail guru per sekolah (ketika user klik kecamatan di halaman Data Guru)

```sql
SELECT 
  no,
  kecamatan_id,
  kecamatan,
  nama_sekolah,
  tahun,
  jumlah_guru
FROM view_guru_per_sekolah
WHERE kecamatan_id = ?
ORDER BY tahun DESC, nama_sekolah ASC;
```

---

Sama untuk `data_siswa` dan `data_rombel`:
- `view_siswa_per_kecamatan` / `view_siswa_per_sekolah`
- `view_rombel_per_kecamatan` / `view_rombel_per_sekolah`

---

## 🚀 Langkah-Langkah Implementasi

### Step 1: Jalankan Migration (Buat Tabel)

```bash
node scripts/setup-sekolah-tables.js
```

Output yang diharapkan:
```
🔗 Connecting to database...
✅ Connected!

📋 Found 32 SQL statements to execute
[1/32] Executing...
✅ Success
...
✅ MIGRATION COMPLETE
```

Ini akan membuat:
- ✅ Tabel `sekolah_dasar`
- ✅ Tabel `data_guru_sekolah`
- ✅ Tabel `data_siswa_sekolah`
- ✅ Tabel `data_rombel_sekolah`
- ✅ 6 Views untuk agregasi data

---

### Step 2: Import Data dari CSV

```bash
node scripts/import-sekolah-data.js
```

Script ini akan:
1. 📖 Membaca file CSV: `output/nama_sd/nama_sd_all_kecamatan_all_tahun.csv`
2. 🔍 Mencari `kecamatan_id` berdasarkan nama kecamatan
3. 📝 Membuat record di tabel `sekolah_dasar` (jika belum ada)
4. 📥 Insert data ke 3 tabel: `data_guru_sekolah`, `data_siswa_sekolah`, `data_rombel_sekolah`

Output yang diharapkan:
```
🔗 Connecting to database...
✅ Connected!
📥 Starting import...
📖 Read 2545 records from CSV

⏳ Processed: 100 rows, Inserted: 100 records
⏳ Processed: 200 rows, Inserted: 200 records
...

==================================================
✅ IMPORT COMPLETE
==================================================
Total rows read: 2545
Total rows inserted: 2545
Total sekolah masters created/reused: 342

Verifying data in tables...
  sekolah_dasar: 342 records
  data_guru_sekolah: 2545 records
  data_siswa_sekolah: 2545 records
  data_rombel_sekolah: 2545 records

✨ All done!
```

---

## 📱 Integrasi Frontend (Next.js)

### API Endpoints yang Diperlukan

#### 1. **GET `/api/data/guru-per-kecamatan`** 
Untuk menampilkan tabel Data Guru per Kecamatan

```javascript
// Request
GET /api/data/guru-per-kecamatan?tahun=2023-2024

// Response
{
  success: true,
  data: [
    {
      no: 1,
      kecamatan_id: 1,
      kecamatan: "Alang-Alang Lebar",
      tahun: "2023-2024",
      jumlah_sekolah: 42,
      total_guru: 1250
    },
    ...
  ]
}
```

---

#### 2. **GET `/api/data/guru-per-sekolah`**
Detail guru per sekolah ketika user klik kecamatan

```javascript
// Request
GET /api/data/guru-per-sekolah?kecamatan_id=1&tahun=2023-2024

// Response
{
  success: true,
  kecamatan: {
    id: 1,
    nama: "Alang-Alang Lebar"
  },
  data: [
    {
      no: 1,
      nama_sekolah: "SD BINA POTENSI PALEMBANG",
      tahun: "2023-2024",
      jumlah_guru: 9
    },
    ...
  ]
}
```

---

#### 3. **GET `/api/data/siswa-per-kecamatan`** & **GET `/api/data/siswa-per-sekolah`**
Sama dengan guru, tapi untuk siswa

---

#### 4. **GET `/api/data/rombel-per-kecamatan`** & **GET `/api/data/rombel-per-sekolah`**
Sama dengan guru, tapi untuk rombel

---

### UI/UX Structure

#### Halaman: `/admin/data/data-guru`
**Tampilan 1: Per Kecamatan (Default)**
```
┌─────────────────────────────────────────────────────┐
│  Guru (Icon)                   Data Guru            │
├─────────────────────────────────────────────────────┤
│  [Search] [Tahun Dropdown] [Tambah Data]            │
├─────────────────────────────────────────────────────┤
│ No. │ Kecamatan              │ Tahun      │ Guru   │
│─────┼────────────────────────┼────────────┼────────│
│ 1   │ Alang-Alang Lebar >>>  │ 2023-2024  │ 1,250  │
│ 2   │ Bukit Kecil >>>        │ 2023-2024  │   850  │
│ 3   │ Gandus >>>             │ 2023-2024  │ 1,050  │
└─────────────────────────────────────────────────────┘
```

[User klik "Alang-Alang Lebar"] → Navigasi ke `/admin/data/data-guru/[kecamatan_id]`

**Tampilan 2: Per Sekolah (Detail Kecamatan)**
```
┌─────────────────────────────────────────────────────┐
│  Guru (Icon)         Data Guru - Alang-Alang Lebar  │
├─────────────────────────────────────────────────────┤
│  [Search] [Tahun Dropdown] [Tambah Data]            │
├─────────────────────────────────────────────────────┤
│ No. │ Nama Sekolah                    │ Tahun │ Guru│
│─────┼─────────────────────────────────┼───────┼─────│
│ 1   │ SD BINA POTENSI PALEMBANG       │ ...   │  9  │
│ 2   │ SD IGNATIUS GLOBAL SCHOOL...    │ ...   │  8  │
│ 3   │ SD ISLAM FATIMAH PALEMBANG      │ ...   │ 31  │
└─────────────────────────────────────────────────────┘
```

---

### Komponent React yang Diperlukan

#### 1. **DataGuruPage** (`/admin/data/data-guru/page.tsx`)
```typescript
// Halaman per kecamatan
- Fetch dari API /api/data/guru-per-kecamatan
- Tampilkan tabel dengan Row Kecamatan yang clickable
- onClick kecamatan → router.push(`/admin/data/data-guru/${kecamatan_id}`)
```

#### 2. **DataGuruDetailPage** (`/admin/data/data-guru/[kecamatan_id]/page.tsx`)
```typescript
// Halaman detail per sekolah
- Fetch dari API /api/data/guru-per-sekolah?kecamatan_id=...
- Breadcrumb: Admin > Master Data > Data Guru > Alang-Alang Lebar
- Tampilkan tabel dengan row nama sekolah
```

---

## 🔧 Quick Start Commands

```bash
# 1. Setup database (buat tabel & views)
node scripts/setup-sekolah-tables.js

# 2. Import data dari CSV
node scripts/import-sekolah-data.js

# 3. Verify data (optional)
# Akses MySQL console dan jalankan:
# SELECT * FROM view_guru_per_kecamatan ORDER BY tahun DESC LIMIT 10;
# SELECT * FROM view_guru_per_sekolah WHERE kecamatan_id = 1 LIMIT 10;
```

---

## 📋 Data Statistics

Berdasarkan CSV Anda:
- **Total Records**: ~2,545
- **Unique Sekolah**: ~342
- **Unique Kecamatan**: ~31
- **Tahun**: 2019-2020, 2020-2021, 2021-2022, 2022-2023, ...
- **Status**: Negeri, Swasta

---

## ⚠️ Catatan Penting

### 1. **Konsistensi Format Tahun**
Pastikan format tahun di CSV **selalu YYYY-YYYY** (contoh: "2019-2020")

### 2. **Nama Kecamatan Harus Cocok**
CSV nama kecamatan harus **persis sama** dengan yang ada di tabel `kecamatan`. Jika tidak cocok, script import akan skip row tersebut.

**Contoh kecamatan yang ada di database:**
```sql
SELECT nama FROM kecamatan ORDER BY nama;
```

### 3. **Duplikasi Data**
Jika Anda menjalankan import 2x, data akan **duplikat**. Untuk membersihkan:

```sql
DELETE FROM data_guru_sekolah WHERE 1=1;
DELETE FROM data_siswa_sekolah WHERE 1=1;
DELETE FROM data_rombel_sekolah WHERE 1=1;
DELETE FROM sekolah_dasar WHERE 1=1;
```

### 4. **Foreign Key Constraints**
Tabel detail (guru, siswa, rombel) **harus** punya `sekolah_id` yang valid. Script import sudah handle ini otomatis.

---

## 🐛 Troubleshooting

### Error: "Kecamatan not found: Alang-Alang Lebar"
**Solusi**: Cek di MySQL apakah nama kecamatan di database cocok dengan CSV
```sql
SELECT DISTINCT nama FROM kecamatan WHERE nama LIKE '%Alang%';
```

### Error: "CSV file not found"
**Solusi**: Pastikan file ada di path `output/nama_sd/nama_sd_all_kecamatan_all_tahun.csv`

### Data tidak muncul di views
**Solusi**: Verify tabelnya ada data:
```sql
SELECT COUNT(*) FROM data_guru_sekolah;
SELECT COUNT(*) FROM sekolah_dasar;
```

---

## 📝 Next Steps

1. ✅ Jalankan setup script
2. ✅ Jalankan import script
3. ⬜ Buat API endpoints (`/api/data/guru-*`, `/api/data/siswa-*`, `/api/data/rombel-*`)
4. ⬜ Buat React components untuk halaman Data Guru, Siswa, Rombel
5. ⬜ Add breadcrumb & navigation untuk detail pages
6. ⬜ Add search, filter, sort functionality
7. ⬜ Add CRUD operations (Create, Update, Delete guru/siswa/rombel)

---

**Dibuat**: 2026-03-19  
**Author**: AI Assistant  
**Status**: Ready for Implementation
