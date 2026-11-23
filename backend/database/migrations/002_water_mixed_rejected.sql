-- Migrasi 002: kebijakan minyak tercampur_air = rejected (tanpa saldo/poin)
-- HANYA untuk database yang SUDAH menjalankan schema.sql versi sebelumnya.
-- Database baru cukup memakai schema.sql terbaru (tidak perlu file ini).
BEGIN;

ALTER TABLE app_settings DROP COLUMN IF EXISTS mixed_water_payout_factor;

ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_completed_quality_chk;
ALTER TABLE deposits ADD CONSTRAINT deposits_completed_quality_chk
  CHECK (status <> 'completed' OR quality = 'layak');

COMMIT;
