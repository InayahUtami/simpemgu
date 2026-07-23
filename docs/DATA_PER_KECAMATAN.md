# Dokumentasi Data Per Kecamatan

## Migrasi dari localStorage ke Database

### Perubahan yang Dilakukan

1. **Database Table**: `kecamatan`
   - Struktur tabel sudah ada di database `ahc1`
   - Kolom: id, nomor, nama, kode_kecamatan, created_at, updated_at

2. **API Route**: `/api/data/kecamatan`
   - **GET**: Mengambil semua data kecamatan
   - **POST**: Menambah data kecamatan baru
   - **PUT**: Mengupdate data kecamatan
   - **DELETE**: Menghapus data kecamatan

3. **Frontend**: `src/app/admin/dashboard/data/per-kecamatan/page.tsx`
   - Mengganti localStorage dengan API calls
   - Fetch data dari database saat halaman dimuat
   - Submit data ke database via API

### Struktur Tabel Kecamatan

```sql
CREATE TABLE kecamatan (
  id INT(11) AUTO_INCREMENT PRIMARY KEY,
  nomor INT(11) NOT NULL,
  nama VARCHAR(255) NOT NULL UNIQUE,
  kode_kecamatan VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(nomor)
);
```

### Fitur

- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Validasi Duplikat**: Tidak bisa menambah kecamatan dengan nama yang sama
- ✅ **Auto Increment Nomor**: Nomor urut otomatis saat menambah data baru
- ✅ **Search**: Cari berdasarkan nama atau kode kecamatan
- ✅ **Sorting**: A-Z atau Z-A
- ✅ **Export CSV**: Download data ke file CSV
- ✅ **Real-time Update**: Data langsung diupdate dari database

### Cara Penggunaan

1. **Menambah Data**:
   - Klik tombol "Tambah Data"
   - Isi nama kecamatan (required)
   - Isi kode kecamatan (optional)
   - Klik "Simpan"

2. **Mengedit Data**:
   - Klik tombol edit (ikon pensil)
   - Ubah data yang diperlukan
   - Klik "Update"

3. **Melihat Detail**:
   - Klik tombol view (ikon mata)
   - Lihat informasi lengkap kecamatan

4. **Menghapus Data**:
   - Klik tombol delete (ikon sampah)
   - Data akan terhapus dari database

### Catatan Penting

- Data sekarang tersimpan di database MySQL, bukan localStorage
- Semua perubahan langsung tersimpan ke database
- Data dapat diakses dari berbagai perangkat
- Pastikan server MySQL running di localhost
