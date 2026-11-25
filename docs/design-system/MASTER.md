# JelantahKu - Design System (MASTER)

Sumber kebenaran visual untuk frontend. Token ada di `frontend/src/assets/styles/main.css` (blok `@theme`);
komponen memakai nama semantik, tidak menulis warna heksadesimal.

> **Asal dokumen ini.** Skrip pencarian skill UI/UX tidak tersedia di lingkungan pembuatan (hanya `SKILL.md`), sehingga
> sistem ini **tidak** diambil dari basis data palet/gaya skill. Ia disusun dari kategori prioritas skill
> (aksesibilitas, sentuhan, tata letak, tipografi, formulir, navigasi) dan **semua angka kontras dihitung ulang**
> (rumus WCAG 2.x), bukan diasumsikan.

## 1. Arah desain
- **Produk:** platform ekonomi sirkular (rumah tangga, UMKM kuliner, kurir, admin). Konteks pakai: ponsel, di dapur atau di jalan; admin di desktop.
- **Gaya:** bersih, ramah, kartu berpinggir lembut, latar terang hangat. Tanpa glassmorphism/gradasi berlebihan. Mode terang saja untuk MVP (token sudah dipisah sehingga mode gelap bisa ditambah kemudian).
- **Suara:** bahasa Indonesia sehari-hari yang jelas; klaim dampak selalu berlabel **estimasi**.

## 2. Warna (token semantik)
| Token | Nilai | Pemakaian |
|---|---|---|
| `brand-700` | `#15803d` | Tombol utama, tautan, fokus. Putih di atasnya **5,02:1** |
| `brand-800` / `-900` | `#166534` / `#14532d` | Hover/aktif, latar bagian gelap (putih 7,13 / 9,11:1) |
| `brand-50/100/200` | hijau pucat | Latar lembut, lencana, ikon |
| `accent-100/700/900` | emas minyak | **Green Points** dan lencana UMKM (`accent-900` di `accent-100` 8,15:1) |
| `ink` | `#1c1917` | Teks utama (16,74:1 di `surface`) |
| `muted` | `#57534e` | Teks sekunder (7,30:1 di `surface`) |
| `surface` / `card` / `line` | netral hangat | Latar halaman / kartu / garis dekoratif |
| `field` | `#78716c` | **Garis tepi kontrol formulir** (4,80:1 di putih, 4,59:1 di `surface`; syarat 3:1) |
| `danger-700`, `success-700`, `info-700`, `warning-700` | status | Teks status >= 4,8:1 di latar pucatnya |

Aturan: jangan pernah membedakan status **hanya dengan warna**; selalu sertakan ikon dan teks.

## 3. Tipografi
- Keluarga tunggal **Plus Jakarta Sans (variable)**, dipasang lewat paket npm (tanpa permintaan ke CDN font).
- Dasar 16 px, tinggi baris 1,6; judul 1,2 dengan `letter-spacing: -0.02em` dan `text-wrap: balance`.
- Teks sekunder minimal 14 px (`text-sm`); tidak ada teks isi di bawah 12 px.
- Angka uang memakai `Intl` lokal `id-ID` (`Rp30.000`; sen hanya tampil bila ada).

## 4. Tata letak & ruang
- Mobile-first; kontainer `max-w-5xl` (aplikasi) / `72rem` (publik); tanpa gulir horizontal.
- Skala ruang kelipatan 4 px; jarak antarkontrol sentuh minimal 8 px.
- Navigasi: sidebar di >= 1024 px; bilah atas + **navigasi bawah (maks. 5 item)** di ponsel, memperhitungkan `safe-area-inset-bottom`. Navigasi bawah baru muncul bila ada lebih dari satu menu.
- Setiap halaman punya URL sendiri (deep link); tautan lewati-ke-konten tersedia di semua layout.

## 5. Komponen inti (`src/components/`)
`AppButton` (primary/secondary/ghost/danger, `loading`), `AppInput` (label tampak, hint, galat dekat field, tampil/sembunyi password),
`AppAlert` (info/success/warning/error; `role="alert"` hanya untuk error), `StatCard`, `BrandLogo`.
- **Target sentuh >= 44 px** (`min-h-11`); tombol hanya ikon wajib `aria-label`; ikon dekoratif `aria-hidden`.
- Ikon: SVG `lucide-vue-next`. **Tanpa emoji** sebagai ikon.
- Fokus keyboard selalu terlihat (outline 3 px `brand-700`, offset 2 px); tidak pernah dihapus.

## 6. Formulir
Label selalu tampak (bukan placeholder saja), galat tepat di bawah field dengan `aria-invalid` + `aria-describedby`,
petunjuk di bawah field, atribut `autocomplete`/`inputmode` yang sesuai, validasi sisi klien meniru aturan server,
galat server dipetakan ke field lewat `useFormErrors`. Placeholder >= 5,15:1.

## 7. Gerak
Transisi 150-300 ms hanya pada warna/opacity/transform/lebar-bar; spinner memutar. `prefers-reduced-motion` mematikan
animasi dan transisi secara global.

## 8. Istilah tampilan yang sudah diputuskan
- Admin: **"Total Jelantah Terkumpul"** dan **"Estimasi Margin Kotor"** (angka simulasi).
- Dampak lingkungan: selalu "Estimasi ..." beserta faktor yang dipakai.

## 9. Daftar periksa sebelum rilis tiap layar
Kontras >= 4,5:1 (teks) dan >= 3:1 (kontrol/ikon bermakna) - target sentuh >= 44 px - fokus terlihat - tanpa gulir horizontal di 360 px -
keadaan memuat, kosong, dan galat tersedia - tidak bergantung pada warna semata - judul halaman (`document.title`) benar.
