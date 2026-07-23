# 🚀 QUICK START GUIDE - Sekolah Data Setup

## ✅ Status Saat Ini
- ✅ Database tables created (4 tables)
- ✅ SQL views created (6 views)
- ✅ Data imported (2,318 records dari CSV)
- ✅ API endpoints created (6 endpoints)
- ⬜ Frontend components (ready to code)

---

## 📋 Command Reference

### 1. Verify Database & Data
```bash
# MySQL CLI - check if all data exists
mysql -u root -h localhost -e "
  USE ahc1;
  SELECT 'sekolah_dasar' as table_name, COUNT(*) as count FROM sekolah_dasar
  UNION ALL
  SELECT 'data_guru_sekolah', COUNT(*) FROM data_guru_sekolah
  UNION ALL
  SELECT 'data_siswa_sekolah', COUNT(*) FROM data_siswa_sekolah
  UNION ALL
  SELECT 'data_rombel_sekolah', COUNT(*) FROM data_rombel_sekolah;
"

# Expected output:
# table_name               count
# sekolah_dasar              410
# data_guru_sekolah        2,318
# data_siswa_sekolah       2,318
# data_rombel_sekolah      2,318
```

### 2. Test API Endpoints
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test endpoints
# Per Kecamatan
curl "http://localhost:3000/api/data/guru-per-kecamatan?tahun=2023-2024"
curl "http://localhost:3000/api/data/siswa-per-kecamatan?tahun=2023-2024"
curl "http://localhost:3000/api/data/rombel-per-kecamatan?tahun=2023-2024"

# Per Sekolah (need kecamatan_id, bisa dapat dari response sebelumnya)
curl "http://localhost:3000/api/data/guru-per-sekolah?kecamatan_id=6&tahun=2023-2024"
curl "http://localhost:3000/api/data/siswa-per-sekolah?kecamatan_id=6&tahun=2023-2024"
curl "http://localhost:3000/api/data/rombel-per-sekolah?kecamatan_id=6&tahun=2023-2024"
```

### 3. View Sample Data (MySQL)
```bash
mysql -u root -h localhost ahc1 << EOF
-- View guru per kecamatan
SELECT * FROM view_guru_per_kecamatan ORDER BY tahun DESC LIMIT 5;

-- View guru per sekolah (untuk kecamatan_id=6)
SELECT * FROM view_guru_per_sekolah 
WHERE kecamatan_id = 6 ORDER BY nama_sekolah ASC LIMIT 5;

-- Details of specific school
SELECT * FROM sekolah_dasar WHERE kecamatan_id = 6 LIMIT 3;
EOF
```

---

## 🎯 Tasks for Frontend Development

### Task 1: Update Data Guru Component
File: `src/app/admin/data/data-guru/page.tsx`

**Structure:**
```
View: kecamatan (default)
├── Table: [No] [Kecamatan] [Tahun] [Jumlah Sekolah] [Total Guru] [Aksi]
├── Click row → setView('detail'), setSelectedKecamatan({id, nama})
└── API call: /api/data/guru-per-kecamatan?tahun=X&kecamatan=Y

View: detail
├── [← Back] heading
├── Table: [No] [Nama Sekolah] [Tahun] [Jumlah Guru]
└── API call: /api/data/guru-per-sekolah?kecamatan_id=X&tahun=Y
```

**Component State:**
```typescript
const [view, setView] = useState<'kecamatan' | 'detail'>('kecamatan');
const [selectedKecamatan, setSelectedKecamatan] = useState(null);
const [dataPerKecamatan, setDataPerKecamatan] = useState([]);
const [dataPerSekolah, setDataPerSekolah] = useState([]);
const [tahunFilter, setTahunFilter] = useState('');
const [searchFilter, setSearchFilter] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

**useEffect Hooks:**
```typescript
// Fetch per kecamatan
useEffect(() => {
  if (view !== 'kecamatan') return;
  // fetch /api/data/guru-per-kecamatan
}, [view, tahunFilter, searchFilter]);

// Fetch per sekolah
useEffect(() => {
  if (view !== 'detail' || !selectedKecamatan) return;
  // fetch /api/data/guru-per-sekolah
}, [view, selectedKecamatan, tahunFilter]);
```

### Task 2: Duplicate untuk Data Siswa
- Copy Data Guru component
- Replace: `guru` → `siswa`
- Replace: `/api/data/guru-*` → `/api/data/siswa-*`
- Replace: `jumlah_guru` → `jumlah_siswa`
- Replace icon: Users → GraduationCap

### Task 3: Duplicate untuk Data Rombel
- Copy dari Task 1
- Replace: `guru` → `rombel`
- Replace: `/api/data/guru-*` → `/api/data/rombel-*`
- Replace: `jumlah_guru` → `jumlah_rombel`
- Replace icon: Users → Users2

### Task 4 (Optional): Data Nama Sekolah
Bisa menjadi simpler version:
- Hanya view per kecamatan (no detail)
- Columns: [No] [Kecamatan] [Nama Sekolah] [Status] [Tahun]
- Sort by sekolah_dasar table

---

## 📊 Data Field Reference

### GUI Per Kecamatan (dari views)
```
- no               (ROW_NUMBER)
- kecamatan_id     (INT)
- kecamatan        (string nama kecamatan)
- tahun            (YYYY-YYYY format)
- jumlah_sekolah   (COUNT distinct sekolah)
- total_guru/siswa/rombel (SUM dari nilai)
```

### Detail Per Sekolah (dari views)
```
- no               (ROW_NUMBER)
- nama_sekolah     (string)
- tahun            (YYYY-YYYY)
- jumlah_guru/siswa/rombel (INT)
```

---

## 🎨 Visual Design Reference

### Color Scheme
- **Guru**: Blue (#3b82f6)
- **Siswa**: Purple (#8b5cf6)
- **Rombel**: Cyan (#06b6d4)
- **Sekolah**: Amber (#f59e0b)

### Icons (lucide-react)
```typescript
import { 
  Users,        // Guru
  GraduationCap, // Siswa
  Users2,       // Rombel
  BookOpen      // Sekolah
} from 'lucide-react';
```

### Background Gradient (sama untuk semua pages)
```css
linear-gradient(to bottom right, 
  #dbeafe 0%,   /* light blue */
  #e0e7ff 33%,  /* blue */
  #f3e8ff 66%,  /* purple */
  #fdf2f8 100%  /* light pink */
)
```

---

## 📁 File Locations

```
Database:
- Table schemas: database/migrations/create_sekolah_tables.sql
- Data import script: scripts/import-sekolah-data-v2.js
- Setup script: scripts/setup-sekolah-tables.js

API:
- src/app/api/data/guru-per-kecamatan/route.ts
- src/app/api/data/guru-per-sekolah/route.ts
- src/app/api/data/siswa-per-kecamatan/route.ts
- src/app/api/data/siswa-per-sekolah/route.ts
- src/app/api/data/rombel-per-kecamatan/route.ts
- src/app/api/data/rombel-per-sekolah/route.ts

Components (to be updated):
- src/app/admin/data/data-guru/page.tsx
- src/app/admin/data/data-siswa/page.tsx
- src/app/admin/data/data-rombel/page.tsx
- src/app/admin/data/data-nama-sekolah/page.tsx
```

---

## ✨ Expected Results

After implementing all 3 components, user should see:

1. **Admin > Master Data > Data Guru**
   - Table with kecamatan list (clickable)
   - Search & year filter
   - Click → View detail sekolah per kecamatan

2. **Admin > Master Data > Data Siswa**
   - Same structure as Data Guru

3. **Admin > Master Data > Data Rombel**
   - Same structure as Data Guru

---

## 🔍 Testing Checklist

- [ ] API `/api/data/guru-per-kecamatan` returns data
- [ ] API `/api/data/guru-per-sekolah?kecamatan_id=6` returns data
- [ ] Data Guru page loads without errors
- [ ] Click kecamatan row → switches to detail view
- [ ] Detail view shows sekolah list for that kecamatan
- [ ] Back button → returns to kecamatan view
- [ ] Search filter works
- [ ] Year filter works
- [ ] Same tests for Data Siswa
- [ ] Same tests for Data Rombel

---

## 💻 Example: Minimal Data Guru Component

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Users, ChevronRight, ArrowLeft } from 'lucide-react';

export default function DataGuruPage() {
  const [view, setView] = useState('kecamatan');
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [dataKec, setDataKec] = useState([]);
  const [dataSek, setDataSek] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch kecamatan level
  useEffect(() => {
    if (view !== 'kecamatan') return;
    setLoading(true);
    fetch('/api/data/guru-per-kecamatan')
      .then(r => r.json())
      .then(result => setDataKec(result.data || []))
      .finally(() => setLoading(false));
  }, [view]);

  // Fetch sekolah detail
  useEffect(() => {
    if (view !== 'detail' || !selectedKecamatan) return;
    setLoading(true);
    fetch(`/api/data/guru-per-sekolah?kecamatan_id=${selectedKecamatan.id}`)
      .then(r => r.json())
      .then(result => setDataSek(result.data || []))
      .finally(() => setLoading(false));
  }, [view, selectedKecamatan]);

  if (view === 'kecamatan') {
    return (
      <div>
        <h1>Data Guru - Per Kecamatan</h1>
        {loading && <p>Loading...</p>}
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Kecamatan</th>
              <th>Tahun</th>
              <th>Jumlah Sekolah</th>
              <th>Total Guru</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataKec.map((row, i) => (
              <tr key={i}>
                <td>{row.no}</td>
                <td>{row.kecamatan}</td>
                <td>{row.tahun}</td>
                <td>{row.jumlah_sekolah}</td>
                <td>{row.total_guru}</td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedKecamatan({ id: row.kecamatan_id, nama: row.kecamatan });
                      setView('detail');
                    }}
                  >
                    Lihat Detail <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setView('kecamatan')}>
        <ArrowLeft size={16} /> Kembali
      </button>
      <h2>Data Guru - {selectedKecamatan?.nama}</h2>
      {loading && <p>Loading...</p>}
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Nama Sekolah</th>
            <th>Tahun</th>
            <th>Jumlah Guru</th>
          </tr>
        </thead>
        <tbody>
          {dataSek.map((row, i) => (
            <tr key={i}>
              <td>{row.no}</td>
              <td>{row.nama_sekolah}</td>
              <td>{row.tahun}</td>
              <td>{row.jumlah_guru}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

**Good luck dengan implementasi! Let me know jika ada pertanyaan.** 🚀
