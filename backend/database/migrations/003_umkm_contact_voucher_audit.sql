-- Migrasi 003: kontak publik UMKM + audit penandaan voucher terpakai
-- HANYA untuk database yang SUDAH menjalankan schema.sql versi sebelumnya.
-- Database baru cukup memakai schema.sql terbaru (tidak perlu file ini). Aman dijalankan ulang.
BEGIN;

ALTER TABLE umkm_profiles
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

ALTER TABLE reward_redemptions
  ADD COLUMN IF NOT EXISTS marked_used_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
