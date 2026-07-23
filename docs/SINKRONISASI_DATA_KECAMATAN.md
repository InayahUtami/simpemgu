# Dokumentasi Sinkronisasi Data Kecamatan

## Overview

Halaman **Data Per Kecamatan** (`/admin/dashboard/data/per-kecamatan`) sekarang menjadi **Master Data** yang tersinkronisasi dengan **semua halaman** lainnya di sistem.

## Perubahan yang Dilakukan

### 1. Database Schema Update

✅ **Semua tabel** sekarang menggunakan `kecamatan_id` sebagai foreign key yang mereferensi `kecamatan.id`

✅ **ON DELETE CASCADE** diterapkan pada semua foreign key - data akan otomatis terhapus saat kecamatan dihapus

✅ **ON UPDATE CASCADE** diterapkan - data akan otomatis terupdate saat kecamatan berubah

### 2. Tabel yang Tersinkronisasi

Ketika Anda menambah/edit/hapus kecamatan di **Data Per Kecamatan**, perubahan akan otomatis ter-sinkronisasi ke:

1. ✅ **jumlah_penduduk** - Jumlah Penduduk
2. ✅ **kepadatan_penduduk** - Kepadatan Penduduk  
3. ✅ **luas_wilayah_kecamatan** - Luas Wilayah Kecamatan
4. ✅ **laju_pertumbuhan** - Laju Pertumbuhan Penduduk
5. ✅ **persentase_penduduk** - Persentase Penduduk
6. ✅ **rasio_jenis_kelamin** - Rasio Jenis Kelamin
7. ✅ **jumlah_penduduk_disdukcapil** - Jumlah Penduduk Disdukcapil (LKJP)
8. ✅ **kelahiran** - Data Kelahiran (LKJP)
9. ✅ **kematian** - Data Kematian (LKJP)
10. ✅ **migrasi** - Data Migrasi (LKJP)
11. ✅ **lplkm** - Data LPLKM (LKJP)
12. ✅ **jumlah_penduduk_umurjk** - Jumlah Penduduk Menurut Kelompok Umur & Jenis Kelamin

## Cara Kerja Sinkronisasi

### A. Menambah Kecamatan Baru

**Langkah:**
1. Buka `/admin/dashboard/data/per-kecamatan`
2. Klik tombol **"Tambah Data"**
3. Isi Nama Kecamatan (required)
4. Isi Kode Kecamatan (optional)
5. Klik **"Simpan"**

**Hasil:**
- Kecamatan baru akan otomatis tersedia di **dropdown/pilihan kecamatan** di semua halaman
- Data kecamatan akan muncul di semua tabel dengan `kecamatan_id` yang sesuai

### B. Mengedit Nama Kecamatan

**Langkah:**
1. Klik tombol **Edit** (ikon pensil) pada kecamatan yang ingin diubah
2. Ubah nama kecamatan
3. Klik **"Update"**

**Hasil:**
- **TIDAK MEMPENGARUHI** data yang sudah ada (karena menggunakan ID, bukan nama)
- Nama kecamatan akan terupdate di tampilan, tetapi relasi data tetap terjaga

### C. Menghapus Kecamatan

**Langkah:**
1. Klik tombol **Delete** (ikon sampah) pada kecamatan yang ingin dihapus
2. Konfirmasi penghapusan

**Hasil:**
- Kecamatan **terhapus** dari tabel `kecamatan`
- **Semua data terkait** kecamatan tersebut **otomatis terhapus** dari semua tabel:
  - Data jumlah penduduk per tahun
  - Data kepadatan penduduk
  - Data luas wilayah
  - Data laju pertumbuhan
  - Data persentase penduduk
  - Data rasio jenis kelamin
  - Data kelahiran, kematian, migrasi
  - Data LPLKM dan Disdukcapil
  - Dll.

⚠️ **PERINGATAN**: Penghapusan bersifat **PERMANEN** dan akan menghapus **SEMUA** data historis kecamatan tersebut!

## Keuntungan Sistem Sinkronisasi

✅ **Konsistensi Data**: Tidak ada duplikasi atau inkonsistensi nama kecamatan

✅ **Efisiensi**: Cukup kelola kecamatan di 1 tempat

✅ **Integritas Data**: Foreign key constraints memastikan data selalu valid

✅ **Mudah Maintenance**: Update kecamatan tidak perlu update manual di semua halaman

✅ **Cascade Delete**: Penghapusan kecamatan otomatis membersihkan semua data terkait

## Technical Details

### Foreign Key Constraints

Semua tabel memiliki constraint seperti ini:

```sql
ALTER TABLE [nama_tabel] 
  ADD CONSTRAINT fk_[nama_tabel]_kecamatan 
  FOREIGN KEY (kecamatan_id) 
  REFERENCES kecamatan(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
```

### Migration Files

1. **update_laju_pertumbuhan_foreign_key.sql** - Update tabel laju_pertumbuhan dari kolom `kecamatan` (nama) ke `kecamatan_id`
2. **add_foreign_key_constraints.sql** - Menambahkan/update foreign key constraints dengan CASCADE di semua tabel

## Testing

### Test Case 1: Tambah Kecamatan Baru
1. Tambah kecamatan "Kecamatan Baru" di halaman per-kecamatan
2. Buka halaman Jumlah Penduduk
3. Kecamatan "Kecamatan Baru" harus muncul di dropdown

### Test Case 2: Edit Nama Kecamatan
1. Edit nama kecamatan "Alang-Alang Lebar" menjadi "Alang Alang Lebar" (tanpa tanda hubung)
2. Buka halaman Jumlah Penduduk
3. Data dengan kecamatan_id yang sama tetap utuh, hanya nama yang berubah

### Test Case 3: Hapus Kecamatan
1. Cek jumlah data di tabel jumlah_penduduk untuk kecamatan tertentu
2. Hapus kecamatan tersebut
3. Data di jumlah_penduduk untuk kecamatan tersebut harus ikut terhapus

## Rekomendasi

⚠️ **JANGAN** menghapus kecamatan yang sudah memiliki data historis kecuali benar-benar diperlukan

✅ **BACKUP** database secara berkala sebelum melakukan penghapusan

✅ **VALIDASI** data kecamatan baru sebelum input massal

## Troubleshooting

**Q: Kecamatan baru tidak muncul di halaman lain?**
- Refresh halaman atau clear cache browser
- Pastikan API endpoint sudah ter-update

**Q: Error saat menghapus kecamatan?**
- Cek apakah ada foreign key constraint yang conflict
- Lihat error log di console browser/server

**Q: Data tidak terhapus otomatis?**
- Verifikasi foreign key constraints dengan query:
```sql
SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'ahc1' 
AND REFERENCED_TABLE_NAME = 'kecamatan';
```

## Contact

Untuk pertanyaan atau issue, silakan hubungi tim developer.
