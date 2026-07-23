# Next.js Website dengan Role Admin dan User

Website ini menggunakan Next.js, TypeScript, Tailwind CSS, dan App Router. Terdapat dua role utama: admin dan user, dengan halaman dashboard terpisah untuk masing-masing role.

## Fitur
- Autentikasi dan otorisasi sederhana
- Halaman dashboard untuk admin dan user
- Struktur project modern (src/, app/)

## Cara Menjalankan
1. Install dependencies (otomatis setelah scaffolding)
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka di browser: http://localhost:3000

## Struktur Awal
- src/app/(admin)/dashboard/page.tsx — Dashboard Admin
- src/app/(user)/dashboard/page.tsx — Dashboard User
- src/app/login/page.tsx — Halaman Login

## Catatan
- Implementasi autentikasi/otorisasi menggunakan state sederhana, bisa diintegrasikan dengan library seperti NextAuth.js jika diperlukan.
- Ganti placeholder sesuai kebutuhan.
