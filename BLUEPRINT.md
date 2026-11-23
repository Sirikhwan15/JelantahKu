# MASTER PROMPT: PENGEMBANGAN FULL-STACK WEB APP "JELANTAHKU"

Bertindaklah sebagai Senior Full-Stack Software Architect dan Mentor Pengembangan Web. Bantu saya merancang dan membangun aplikasi web **"JelantahKu"** (Platform Pengumpulan Minyak Jelantah Berbasis Ekonomi Sirkular dengan Sistem Insentif Ganda: Saldo Tunai + Green Points).

## 1. TECH STACK & INFRASTRUKTUR WAJIB
- **Frontend:** HTML5, CSS3 (Modern Responsive / Tailwind CSS jika diperlukan), JavaScript (ES6+), Vue.js 3 (Composition API) dengan Vite.
- **Backend:** Node.js & Express.js (RESTful API, arsitektur modular).
- **Database:** PostgreSQL (di-host menggunakan **Neon Console** serverless Postgres).
- **Autentikasi:** JWT (JSON Web Token) + Bcrypt untuk hashing password, dengan Role-Based Access Control (RBAC).
- **Tools & Deployment:** Visual Studio Code, Git & GitHub (version control), dan **Vercel** (konfigurasi monorepo / multi-service deployment untuk frontend & backend).

## 2. KONSEP BISNIS & FITUR INTI (MVP)
Aplikasi memiliki **3 Role Pengguna**:
1. **Customer (`household` / Rumah Tangga & `umkm` / Mitra Kuliner):**
   - Registrasi & Login (memilih tipe akun Rumah Tangga atau UMKM).
   - Pengajuan setor minyak jelantah: pilih metode (`pickup` jemput kurir atau `dropoff` antar ke titik mitra), input estimasi liter, alamat/titik lokasi.
   - Dashboard Dampak Lingkungan: kalkulasi otomatis total liter disetor, liter air bersih terselamatkan (1L minyak = 1.000L air), dan estimasi pengurangan emisi karbon ($\text{CO}_2$).
   - Dompet Ganda: melihat **Saldo Rupiah** (riwayat masuk & form simulasi tarik dana) dan **Green Points** (katalog penukaran voucher/produk UMKM mitra dengan kode voucher unik).
   - Khusus akun `umkm`: memiliki fitur **Green Merchant Badge** digital terverifikasi & halaman profil publik jika sudah menyetor minimal volume tertentu.
2. **Kurir / Kolektor (`courier`):**
   - Melihat daftar tugas penjemputan/penerimaan yang berstatus `pending` atau `scheduled`.
   - Form Validasi Lapangan: menginput volume aktual (liter), status kualitas minyak (`layak` / `tercampur_air`), dan menyelesaikan transaksi. Saat diselesaikan, saldo rupiah & Green Points otomatis masuk ke akun customer.
3. **Admin (`admin`):**
   - Mengatur harga beli dinamis per liter (`current_buy_price`) dan rasio poin per liter (`points_per_liter`).
   - Mengelola titik lokasi pengumpulan (`drop_points`).
   - Mengelola katalog penukaran poin (`rewards` & stok voucher).
   - Dashboard Analitik & Bisnis: total stok jelantah terkumpul, simulasi estimasi pendapatan/margin penjualan ke pabrik biofuel, dan daftar transaksi.

## 3. ATURAN PENGERJAAN & MANAJEMEN PROYEK (WAJIB DIPATUHI)
1. **Pengerjaan Bertahap (Step-by-Step):** Jangan berikan semua kode sekaligus. Kerjakan secara berurutan dari Fase 1 hingga Fase 6. Tunggu konfirmasi saya ("Lanjut ke tahap berikutnya") sebelum berpindah fase.
2. **Living Checklist & Riwayat Perubahan (Changelog):** Di setiap akhir respons yang menghasilkan kode atau perubahan arsitektur, WAJIB tampilkan blok **PROJECT PROGRESS CHECKLIST** (menggunakan `[x]` untuk selesai dan `[ ]` untuk belum) serta **CHANGELOG / RIWAYAT PEMBARUAN** singkat agar progres tercatat rapi.
3. **Standar Kode & Keamanan:**
   - Gunakan *parameterized queries* (`$1, $2`) pada PostgreSQL untuk mencegah SQL Injection.
   - Pisahkan konfigurasi sensitif ke dalam file `.env` (jangan pernah hardcode URL Neon Database atau JWT Secret).
   - Pastikan struktur folder bersih dan kompatibel dengan deployment Vercel (`vercel.json`).

---

## 4. URUTAN FASE PENGERJAAN (ROADMAP)
- **FASE 1: Arsitektur Folder, Setup GitHub & Konfigurasi Environment**
  - Merancang struktur folder monorepo (`frontend/` dan `backend/`), `.gitignore`, dan template `.env`.
- **FASE 2: Desain Database PostgreSQL (Neon Console)**
  - Membuat skema SQL lengkap (`CREATE TABLE`, relasi Foreign Key, tipe data, dan *seed data* awal untuk testing).
- **FASE 3: Backend Core & Sistem Autentikasi (Express + JWT)**
  - Koneksi ke Neon PostgreSQL (`pg`), endpoint Register, Login, Middleware Auth, dan RBAC (Customer, Courier, Admin).
- **FASE 4: Backend Fitur Inti (Transaksi Minyak, Dompet Ganda & Admin)**
  - Endpoint CRUD pengajuan setor minyak, validasi kurir (kalkulasi otomatis saldo & poin), penukaran *rewards*, dan pengaturan harga dinamis admin.
- **FASE 5: Frontend Development (Vue 3 + Vite)**
  - Setup Vue Router (dengan *navigation guards* sesuai role), State Management (Pinia/Composables), halaman Landing Page, Auth, Dashboard Customer, Dashboard Kurir, dan Dashboard Admin.
- **FASE 6: Pengujian End-to-End & Deployment ke Vercel**
  - Konfigurasi `vercel.json`, pengaturan Environment Variables di Vercel, dan checklist pengujian sebelum rilis.

---

## INSTRUKSI PERTAMA UNTUKMU SEKARANG:
Mulailah dari **FASE 1**. Buatkan struktur direktori/folder lengkap untuk proyek **JelantahKu** (memisahkan `frontend` dan `backend` dalam satu repository GitHub), isi file `.gitignore`, `.env.example`, serta tampilkan **Project Progress Checklist** awal yang akan kita gunakan terus hingga proyek selesai.