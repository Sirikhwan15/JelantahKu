-- =====================================================================
-- JelantahKu - Skema Database (PostgreSQL 15+ / Neon)
-- Jalankan SEKALI di Neon SQL Editor, lalu jalankan seed.sql.
-- =====================================================================
-- Untuk mengulang dari nol saat development, hapus tanda komentar blok ini:
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

BEGIN;

-- ---------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------
CREATE TYPE user_role         AS ENUM ('household', 'umkm', 'courier', 'admin');
CREATE TYPE deposit_method    AS ENUM ('pickup', 'dropoff');
CREATE TYPE deposit_status    AS ENUM ('pending', 'scheduled', 'completed', 'rejected', 'cancelled');
CREATE TYPE oil_quality       AS ENUM ('layak', 'tercampur_air');
CREATE TYPE wallet_asset      AS ENUM ('cash', 'points');
CREATE TYPE wallet_tx_type    AS ENUM ('deposit_reward', 'withdrawal', 'withdrawal_refund', 'reward_redeem', 'adjustment');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'paid', 'rejected');
CREATE TYPE voucher_status    AS ENUM ('active', 'used', 'expired');

-- ---------------------------------------------------------------------
-- 2. FUNGSI UTILITAS: updated_at otomatis
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 3. USERS
--    Role "customer" pada rancangan = household ATAU umkm.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          user_role    NOT NULL DEFAULT 'household',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- Email unik tanpa membedakan huruf besar/kecil
CREATE UNIQUE INDEX users_email_lower_key ON users (LOWER(email));
CREATE INDEX users_role_idx ON users (role);
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profil khusus UMKM + Green Merchant Badge + halaman profil publik (via slug)
CREATE TABLE umkm_profiles (
  user_id           BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name     VARCHAR(150) NOT NULL,
  business_type     VARCHAR(60),
  address           TEXT,
  slug              VARCHAR(80)  NOT NULL UNIQUE,
  description       TEXT,
  contact_phone     VARCHAR(20),     -- kontak PUBLIK usaha (terpisah dari telepon akun)
  contact_email     VARCHAR(255),    -- kontak PUBLIK usaha (terpisah dari email login)
  badge_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
  badge_verified_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER umkm_profiles_set_updated_at BEFORE UPDATE ON umkm_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 4. APP SETTINGS (tepat 1 baris; diatur admin)
--    Faktor dampak disimpan di sini agar bisa dikoreksi tanpa mengubah kode.
-- ---------------------------------------------------------------------
CREATE TABLE app_settings (
  id                           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_buy_price            NUMERIC(12,2) NOT NULL CHECK (current_buy_price >= 0),   -- Rp per liter
  points_per_liter             INTEGER       NOT NULL CHECK (points_per_liter >= 0),
  water_liters_per_liter_oil   NUMERIC(10,2) NOT NULL DEFAULT 1000 CHECK (water_liters_per_liter_oil >= 0),
  co2_kg_per_liter             NUMERIC(10,4) NOT NULL CHECK (co2_kg_per_liter >= 0),
  umkm_badge_min_liters        NUMERIC(10,2) NOT NULL DEFAULT 50 CHECK (umkm_badge_min_liters >= 0),
  min_withdrawal_amount        NUMERIC(12,2) NOT NULL DEFAULT 10000 CHECK (min_withdrawal_amount >= 0),
  factory_sell_price_per_liter NUMERIC(12,2) NOT NULL CHECK (factory_sell_price_per_liter >= 0), -- simulasi margin
  updated_by                   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 5. DROP POINTS (titik antar mitra)
-- ---------------------------------------------------------------------
CREATE TABLE drop_points (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  address         TEXT         NOT NULL,
  latitude        NUMERIC(9,6) CHECK (latitude  BETWEEN -90  AND 90),
  longitude       NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
  operating_hours VARCHAR(100),
  contact_phone   VARCHAR(20),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,   -- nonaktifkan, jangan hapus (riwayat setoran)
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE TRIGGER drop_points_set_updated_at BEFORE UPDATE ON drop_points
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 6. DEPOSITS (pengajuan setor minyak jelantah)
--    Harga & rasio poin di-SNAPSHOT saat transaksi selesai, sehingga
--    perubahan harga admin tidak mengubah transaksi lama.
-- ---------------------------------------------------------------------
CREATE TABLE deposits (
  id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  method                    deposit_method NOT NULL,
  drop_point_id             BIGINT REFERENCES drop_points(id) ON DELETE RESTRICT,
  pickup_address            TEXT,
  pickup_latitude           NUMERIC(9,6) CHECK (pickup_latitude  BETWEEN -90  AND 90),
  pickup_longitude          NUMERIC(9,6) CHECK (pickup_longitude BETWEEN -180 AND 180),
  estimated_liters          NUMERIC(8,2) NOT NULL CHECK (estimated_liters > 0),
  preferred_at              TIMESTAMPTZ,
  notes                     TEXT,
  status                    deposit_status NOT NULL DEFAULT 'pending',

  -- diisi kurir saat validasi lapangan
  courier_id                BIGINT REFERENCES users(id) ON DELETE RESTRICT,
  actual_liters             NUMERIC(8,2) CHECK (actual_liters IS NULL OR actual_liters > 0),
  quality                   oil_quality,
  courier_notes             TEXT,
  buy_price_snapshot        NUMERIC(12,2),
  points_per_liter_snapshot INTEGER,
  cash_awarded              NUMERIC(14,2) CHECK (cash_awarded IS NULL OR cash_awarded >= 0),
  points_awarded            INTEGER       CHECK (points_awarded IS NULL OR points_awarded >= 0),
  completed_at              TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT deposits_location_chk CHECK (
    (method = 'pickup'  AND pickup_address IS NOT NULL AND drop_point_id IS NULL) OR
    (method = 'dropoff' AND drop_point_id  IS NOT NULL)
  ),
  CONSTRAINT deposits_completed_chk CHECK (
    status <> 'completed' OR (
      courier_id IS NOT NULL AND actual_liters IS NOT NULL AND quality IS NOT NULL AND
      buy_price_snapshot IS NOT NULL AND points_per_liter_snapshot IS NOT NULL AND
      cash_awarded IS NOT NULL AND points_awarded IS NOT NULL AND completed_at IS NOT NULL
    )
  ),
  -- Kebijakan: minyak tercampur_air TIDAK boleh berstatus completed (harus rejected, tanpa saldo/poin)
  CONSTRAINT deposits_completed_quality_chk CHECK (status <> 'completed' OR quality = 'layak')
);
CREATE INDEX deposits_user_idx    ON deposits (user_id, created_at DESC);
CREATE INDEX deposits_status_idx  ON deposits (status);
CREATE INDEX deposits_courier_idx ON deposits (courier_id) WHERE courier_id IS NOT NULL;
CREATE TRIGGER deposits_set_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 7. WITHDRAWALS (simulasi tarik dana)
-- ---------------------------------------------------------------------
CREATE TABLE withdrawals (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount               NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  destination_type     VARCHAR(20)  NOT NULL CHECK (destination_type IN ('bank', 'ewallet')),
  destination_provider VARCHAR(50)  NOT NULL,
  account_name         VARCHAR(100) NOT NULL,
  account_number       VARCHAR(50)  NOT NULL,
  status               withdrawal_status NOT NULL DEFAULT 'pending',
  processed_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
  processed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX withdrawals_user_idx ON withdrawals (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 8. REWARDS & REDEMPTIONS (katalog penukaran Green Points)
-- ---------------------------------------------------------------------
CREATE TABLE rewards (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  partner_name VARCHAR(150),               -- UMKM mitra penyedia voucher/produk
  points_cost  INTEGER NOT NULL CHECK (points_cost > 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER rewards_set_updated_at BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE reward_redemptions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  reward_id    BIGINT NOT NULL REFERENCES rewards(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),   -- snapshot harga poin
  voucher_code VARCHAR(32) NOT NULL UNIQUE,
  status       voucher_status NOT NULL DEFAULT 'active',
  expires_at   TIMESTAMPTZ,
  used_at      TIMESTAMPTZ,
  marked_used_by BIGINT REFERENCES users(id) ON DELETE SET NULL,   -- admin yang menandai terpakai
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX redemptions_user_idx ON reward_redemptions (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 9. WALLET GANDA + BUKU MUTASI (ledger)
--    wallets       = saldo saat ini (dibaca cepat)
--    wallet_tx     = riwayat; setiap perubahan saldo HARUS punya 1 baris
-- ---------------------------------------------------------------------
CREATE TABLE wallets (
  user_id        BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cash_balance   NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cash_balance >= 0),
  points_balance INTEGER       NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE TRIGGER wallets_set_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE wallet_transactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  asset         wallet_asset   NOT NULL,
  type          wallet_tx_type NOT NULL,
  amount        NUMERIC(14,2)  NOT NULL CHECK (amount <> 0),       -- + masuk, - keluar
  balance_after NUMERIC(14,2)  NOT NULL CHECK (balance_after >= 0),
  deposit_id    BIGINT REFERENCES deposits(id)           ON DELETE RESTRICT,
  withdrawal_id BIGINT REFERENCES withdrawals(id)        ON DELETE RESTRICT,
  redemption_id BIGINT REFERENCES reward_redemptions(id) ON DELETE RESTRICT,
  description   VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_tx_points_integer_chk CHECK (asset = 'cash' OR amount = TRUNC(amount))
);
CREATE INDEX wallet_tx_user_idx ON wallet_transactions (user_id, asset, created_at DESC);
-- Mencegah satu setoran memberi hadiah dua kali untuk aset yang sama
CREATE UNIQUE INDEX wallet_tx_deposit_reward_once
  ON wallet_transactions (deposit_id, asset) WHERE type = 'deposit_reward';

COMMIT;
