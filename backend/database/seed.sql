-- =====================================================================
-- JelantahKu - Seed Data (HANYA UNTUK DEVELOPMENT / TESTING)
-- Semua akun memakai password:  Password123!
-- Jangan jalankan seed ini di database produksi.
-- Semua angka, nama, dan alamat di bawah adalah data contoh (dummy).
-- =====================================================================

BEGIN;

-- 1. PENGATURAN (nilai contoh, ganti sesuai kebijakan bisnis)
--    co2_kg_per_liter = NILAI SEMENTARA. Ganti dengan faktor dari sumber rujukan.
INSERT INTO app_settings (id, current_buy_price, points_per_liter, co2_kg_per_liter,
                          factory_sell_price_per_liter)
VALUES (1, 6000, 10, 2.0, 8000);

-- 2. USERS (bcrypt cost 10 untuk "Password123!")
INSERT INTO users (name, email, password_hash, phone, role) VALUES
  ('Admin JelantahKu', 'admin@jelantahku.test',  '$2b$10$h1beolAUHuQCHqwqpvrKh.jZyBmDoP6Qq2//WCIi2VJpBY/UZkr6e', '081200000001', 'admin'),
  ('Kurir Satu',       'kurir1@jelantahku.test', '$2b$10$h1beolAUHuQCHqwqpvrKh.jZyBmDoP6Qq2//WCIi2VJpBY/UZkr6e', '081200000002', 'courier'),
  ('Budi Rumah Tangga','budi@jelantahku.test',   '$2b$10$h1beolAUHuQCHqwqpvrKh.jZyBmDoP6Qq2//WCIi2VJpBY/UZkr6e', '081200000003', 'household'),
  ('Warung Sari Rasa', 'warung@jelantahku.test', '$2b$10$h1beolAUHuQCHqwqpvrKh.jZyBmDoP6Qq2//WCIi2VJpBY/UZkr6e', '081200000004', 'umkm');

INSERT INTO umkm_profiles (user_id, business_name, business_type, address, slug, description)
SELECT id, 'Warung Sari Rasa', 'Warung makan', 'Jl. Contoh No. 10 (dummy)', 'warung-sari-rasa',
       'Warung makan contoh yang menyetor minyak jelantah secara rutin.'
FROM users WHERE email = 'warung@jelantahku.test';

-- 3. WALLET (satu per customer)
INSERT INTO wallets (user_id)
SELECT id FROM users WHERE role IN ('household', 'umkm');

-- 4. DROP POINTS
INSERT INTO drop_points (name, address, latitude, longitude, operating_hours, contact_phone) VALUES
  ('Titik Mitra A - Kafe Hijau',  'Jl. Contoh No. 1 (dummy)', -0.949100, 100.354300, '08.00-20.00', '081200000011'),
  ('Titik Mitra B - Toko Lestari','Jl. Contoh No. 2 (dummy)', -0.935200, 100.366800, '09.00-18.00', '081200000012'),
  ('Titik Mitra C - Bank Sampah', 'Jl. Contoh No. 3 (dummy)', -0.960400, 100.381900, '08.00-16.00', '081200000013');

-- 5. REWARDS
INSERT INTO rewards (name, description, partner_name, points_cost, stock) VALUES
  ('Voucher Kopi Gratis',       'Satu gelas kopi susu',            'Kafe Hijau',       100, 20),
  ('Diskon 10% Belanja Dapur',  'Berlaku untuk pembelian minimal Rp50.000', 'Toko Lestari', 150, 15),
  ('Tote Bag Daur Ulang',       'Tas belanja dari bahan daur ulang','Bank Sampah',     300, 10),
  ('Paket Sabun Ramah Lingkungan','Sabun cuci piring 500 ml',      'UMKM Bersih Alam', 250,  8);

-- 6. DEPOSITS CONTOH (3 status berbeda)
-- 6a. pending (pickup) - Budi
INSERT INTO deposits (user_id, method, pickup_address, estimated_liters, notes)
SELECT id, 'pickup', 'Jl. Contoh No. 5, rumah cat hijau (dummy)', 3.0, 'Dalam 2 botol bekas'
FROM users WHERE email = 'budi@jelantahku.test';

-- 6b. scheduled (dropoff) - Warung, sudah ditugaskan ke kurir
INSERT INTO deposits (user_id, method, drop_point_id, estimated_liters, status, courier_id)
SELECT u.id, 'dropoff', dp.id, 20.0, 'scheduled', c.id
FROM users u, drop_points dp, users c
WHERE u.email = 'warung@jelantahku.test'
  AND dp.name LIKE 'Titik Mitra A%'
  AND c.email = 'kurir1@jelantahku.test';

-- 6c. completed (pickup) - Budi, 5 L layak -> Rp30.000 + 50 poin
INSERT INTO deposits (user_id, method, pickup_address, estimated_liters, status, courier_id,
                      actual_liters, quality, buy_price_snapshot, points_per_liter_snapshot,
                      cash_awarded, points_awarded, completed_at)
SELECT u.id, 'pickup', 'Jl. Contoh No. 5 (dummy)', 5.0, 'completed', c.id,
       5.0, 'layak', 6000, 10, 30000, 50, NOW() - INTERVAL '2 days'
FROM users u, users c
WHERE u.email = 'budi@jelantahku.test' AND c.email = 'kurir1@jelantahku.test';

-- Ledger + saldo untuk setoran 6c (harus konsisten satu sama lain)
INSERT INTO wallet_transactions (user_id, asset, type, amount, balance_after, deposit_id, description)
SELECT d.user_id, 'cash'::wallet_asset,   'deposit_reward'::wallet_tx_type, 30000, 30000, d.id, 'Setoran jelantah 5 L'
FROM deposits d WHERE d.status = 'completed'
UNION ALL
SELECT d.user_id, 'points'::wallet_asset, 'deposit_reward'::wallet_tx_type, 50,    50,    d.id, 'Setoran jelantah 5 L'
FROM deposits d WHERE d.status = 'completed';

UPDATE wallets SET cash_balance = 30000, points_balance = 50
WHERE user_id = (SELECT id FROM users WHERE email = 'budi@jelantahku.test');

COMMIT;
