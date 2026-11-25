# JelantahKu - Referensi API (Fase 3-4)

Basis URL lokal: `http://localhost:5000/api`. Semua respons berbentuk:
`{ "success": true|false, "message": "...", "data": {...} }` (galat validasi menambah `errors: [{field, message}]`).
Autentikasi: header `Authorization: Bearer <token>` (token dari `/auth/login`).
Uang (Rp) dan volume (liter) dikirim sebagai angka. Daftar memakai `?page=1&limit=20` (limit maks. 100) dan
mengembalikan `{ items, pagination: { page, limit, total, totalPages } }`.

## Publik
| Method | Rute | Keterangan |
|---|---|---|
| GET | `/health` | Cek server + database |
| POST | `/auth/register` | `accountType`: `household` / `umkm` (umkm wajib `businessName`) |
| POST | `/auth/login` | Mengembalikan `token` + `user` |
| GET | `/public/umkm/:slug` | Profil publik mitra UMKM (hanya bila badge terverifikasi). Memuat deskripsi, alamat, dan kontak usaha yang diisi pemiliknya; data akun (email login, telepon akun) tidak pernah ikut |

## Semua pengguna login
| Method | Rute | Keterangan |
|---|---|---|
| GET | `/auth/me` | Profil + saldo (customer) + profil UMKM |
| GET | `/settings/public` | Harga beli/liter, poin/liter, minimal tarik, ambang badge |
| GET | `/drop-points` | Titik pengumpulan aktif |

## Customer (household & umkm)
| Method | Rute | Keterangan |
|---|---|---|
| POST | `/deposits` | `method`: `pickup` (+`pickupAddress`) atau `dropoff` (+`dropPointId`); `estimatedLiters` |
| GET | `/deposits` | Riwayat; filter `status` |
| GET | `/deposits/:id` | Detail (hanya milik sendiri) |
| POST | `/deposits/:id/cancel` | Hanya saat `pending` / `scheduled` |
| GET | `/wallet` | Saldo tunai + poin |
| GET | `/wallet/transactions` | Mutasi; filter `asset=cash|points` |
| POST | `/wallet/withdrawals` | Simulasi tarik dana (nominal Rupiah bulat); saldo langsung ditahan |
| GET | `/wallet/withdrawals` | Riwayat penarikan |
| GET | `/rewards` | Katalog aktif (`available` = aktif dan stok > 0) |
| POST | `/rewards/:id/redeem` | Tukar poin -> kode voucher `JLK-XXXX-XXXX` |
| GET | `/rewards/redemptions` | Voucher milik sendiri |
| GET | `/impact` | Total liter, estimasi air/CO2, progres badge (umkm) |

## Akun UMKM
| Method | Rute | Keterangan |
|---|---|---|
| GET | `/umkm/profile` | Profil usaha sendiri |
| PATCH | `/umkm/profile` | Ubah `businessName`, `businessType`, `description`, `address`, `contactPhone`, `contactEmail` (kirim `null` / string kosong untuk menghapus). `slug` dan badge tidak bisa diubah. Alamat dan kontak yang diisi **tampil publik** di halaman mitra setelah badge terverifikasi |

## Kurir
| Method | Rute | Keterangan |
|---|---|---|
| GET | `/courier/tasks` | Antrean `pending` + tugas `scheduled` milik sendiri; filter `status` |
| GET | `/courier/tasks/:id` | Detail tugas |
| POST | `/courier/tasks/:id/claim` | Ambil tugas dari antrean (`pending` -> `scheduled`) |
| POST | `/courier/tasks/:id/complete` | `actualLiters`, `quality` (`layak` / `tercampur_air`), `notes`. `layak` -> saldo + poin masuk; `tercampur_air` -> `rejected`, tanpa pembayaran |

## Admin
| Method | Rute | Keterangan |
|---|---|---|
| POST | `/users/staff` | Buat akun kurir / admin |
| GET / PUT | `/admin/settings` | Harga beli, poin/liter, faktor dampak, ambang badge, minimal tarik, harga jual pabrik |
| GET / POST | `/admin/drop-points` | Daftar semua / buat |
| PUT | `/admin/drop-points/:id` | Ubah / nonaktifkan (`isActive: false`) |
| GET / POST | `/admin/rewards` | Daftar semua / buat |
| PUT | `/admin/rewards/:id` | Ubah harga poin, stok, aktif/nonaktif |
| GET | `/admin/deposits` | Semua transaksi; filter `status` |
| GET | `/admin/vouchers` | Cari/daftar voucher; filter `status` (`active`/`used`/`expired`) dan `code` (sebagian, tanpa pengaruh huruf besar/kecil) |
| POST | `/admin/vouchers/:code/use` | Tandai voucher terpakai (409 bila sudah terpakai atau kedaluwarsa) |
| GET | `/admin/withdrawals` | Permintaan tarik dana; filter `status` |
| PATCH | `/admin/withdrawals/:id` | `status`: `paid` / `rejected` (rejected = saldo dikembalikan) |
| GET | `/admin/analytics/summary` | Stok terkumpul, status setoran, payout, simulasi margin, dampak, seri bulanan |

## Kode status umum
`400` validasi / aturan bisnis, `401` belum login atau token tidak valid, `403` role tidak berhak,
`404` tidak ditemukan, `409` konflik keadaan (mis. tugas sudah diambil, stok habis), `429` terlalu banyak percobaan.
