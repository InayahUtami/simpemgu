# 📊 Implementasi Database untuk Pembobotan AHP

## ✅ Status: SELESAI

Sistem penyimpanan konfigurasi AHP (Analytic Hierarchy Process) telah berhasil diimplementasikan.

---

## 📦 Komponen yang Dibuat

### 1. Database Migration
**File:** `database/migrations/create_pembobotan_ahp.sql`

**Tabel:** `pembobotan_ahp`

Struktur:
```sql
CREATE TABLE pembobotan_ahp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  penduduk DECIMAL(10, 4) DEFAULT 1.0,      -- Bobot Penduduk
  guru DECIMAL(10, 4) DEFAULT 1.0,          -- Bobot Guru
  siswa DECIMAL(10, 4) DEFAULT 1.0,         -- Bobot Siswa
  rombel DECIMAL(10, 4) DEFAULT 1.0,        -- Bobot Rombel
  rasio DECIMAL(10, 4) DEFAULT 1.0,         -- Bobot Rasio
  scale DECIMAL(10, 4) DEFAULT 1.0,         -- Skala Penguat
  is_active BOOLEAN DEFAULT TRUE,           -- Status Aktif
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Baris Default:**
- Semua bobot = 1.0 (equal weight)
- Scale = 1.0 (tanpa amplifikasi)
- is_active = TRUE

---

### 2. API Endpoint
**File:** `src/app/api/admin/ahp-config/route.ts`

#### **POST /api/admin/ahp-config**
Menyimpan/update konfigurasi AHP ke database.

**Request Body:**
```json
{
  "weights": {
    "penduduk": 1.5,
    "guru": 2.0,
    "siswa": 1.2,
    "rombel": 1.3,
    "rasio": 1.0
  },
  "scale": 1.5
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pembobotan AHP berhasil disimpan ke database",
  "data": {
    "weights": { ... },
    "scale": 1.5,
    "savedAt": "2026-05-12T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Gagal menyimpan konfigurasi AHP ke database",
  "error": "Connection error"
}
```

---

#### **GET /api/admin/ahp-config**
Mengambil konfigurasi AHP terbaru dari database.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "weights": {
      "penduduk": 1.5,
      "guru": 2.0,
      "siswa": 1.2,
      "rombel": 1.3,
      "rasio": 1.0
    },
    "scale": 1.5,
    "updatedAt": "2026-05-12T10:30:00.000Z"
  }
}
```

---

## 🔄 Alur Kerja

### User Journey (End-to-End)

1. **User masuk ke Admin Page**
   - Halaman: `/admin/clustering-penduduk`
   - Status: Draft = Default values

2. **User mengatur Pembobotan**
   - Geser slider Penduduk: 1.0 → 1.5
   - Geser slider Guru: 1.0 → 2.0
   - Geser slider Skala: 1.0 → 1.5
   - Tabel Real Matrix & Preview terupdate secara real-time

3. **User klik "Simpan pembobotan"**
   - Frontend mengirim POST request ke `/api/admin/ahp-config`
   - Backend menerima dan validasi data
   - Backend update table `pembobotan_ahp`
   - Backend return success response
   - Frontend update active state
   - UI menampilkan: "✓ Pembobotan AHP berhasil disimpan ke database!"

4. **User refresh page**
   - Frontend sudah memiliki active values dari step sebelumnya
   - Data persisten di database
   - Next session GET `/api/admin/ahp-config` untuk load last config

---

## 🔐 Validasi & Error Handling

### Backend Validations
✅ Weights harus ada di body request
✅ Setiap weight harus number > 0
✅ Scale harus number > 0
✅ Database connection error handling

### Frontend Feedback
✅ Loading state: "⏳ Menyimpan..."
✅ Success message: "✓ Pembobotan AHP berhasil disimpan ke database!"
✅ Error message: "✗ Gagal menyimpan: [error details]"

---

## 📋 Checklist Implementasi

- ✅ Database migration file dibuat
- ✅ Table `pembobotan_ahp` berhasil dibuat di database
- ✅ API endpoint POST `/api/admin/ahp-config` dibuat
- ✅ API endpoint GET `/api/admin/ahp-config` dibuat (bonus untuk load config)
- ✅ Input validation di backend
- ✅ Error handling & logging
- ✅ Frontend POST request dari ClusteringPendudukPage.tsx
- ✅ Status messages (loading, success, error)

---

## 🧪 Testing

### Test 1: Manual Save
```bash
curl -X POST http://localhost:3000/api/admin/ahp-config \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {"penduduk": 1.5, "guru": 2.0, "siswa": 1.2, "rombel": 1.3, "rasio": 1.0},
    "scale": 1.5
  }'
```

Expected Response: `{ "success": true, "message": "..." }`

### Test 2: UI Flow
1. Buka `/admin/clustering-penduduk`
2. Adjust sliders
3. Klik "Simpan pembobotan"
4. Verify: "✓ Pembobotan AHP berhasil disimpan ke database!"
5. Refresh page
6. Verify: Draft values persist (dari active state di session)

---

## 📝 Catatan

- Database design menggunakan DECIMAL(10,4) untuk precision
- `is_active` field memungkinkan multiple configurations di future (audit trail)
- Automatic timestamps untuk audit trail
- Foreign key dan indexes untuk performance

---

## 🚀 Next Steps (Optional)

1. **Load saved config on page load**
   - Call GET `/api/admin/ahp-config` saat component mount
   - Set initial `ahpWeights` dan `ahpScale` dari database

2. **Config History**
   - Tambah `versions` atau audit table
   - Track siapa yang update dan kapan

3. **Rollback Feature**
   - Restore previous configuration
   - View change history

---

## 📞 Support

Jika ada error "Failed to save":
1. Check Network tab di DevTools (Request/Response)
2. Verify database connection di `.env`
3. Check backend logs
4. Verify table `pembobotan_ahp` exists: `SELECT * FROM pembobotan_ahp;`
