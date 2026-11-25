// =====================================================================
// Uji end-to-end API JelantahKu (Fase 2-4). Jalankan: npm run test:e2e
//
// PERHATIAN: skrip ini MENGUBAH DATA (membuat user, setoran, penarikan, dll.) dan
// bergantung pada data seed.sql yang masih segar. Pakai HANYA pada database lokal/dev
// yang baru dibuat dari schema.sql + seed.sql. Jangan jalankan di database produksi.
// Server harus sedang berjalan, dan AUTH_RATE_LIMIT_MAX di .env dinaikkan (mis. 1000)
// agar tidak terkena pembatas login. API_URL bisa diganti lewat variabel lingkungan.
// =====================================================================
const B = process.env.API_URL || 'http://localhost:5000/api';
let pass = 0, fail = 0;
const t = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra); } };
async function api(method, path, token, body) {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch {}
  return { s: r.status, b: json, d: json && json.data };
}
const login = async (email, password = 'Password123!') => (await api('POST', '/auth/login', null, { email, password })).d.token;
const sec = (n) => console.log(`\n## ${n}`);
const approx = (a, b) => Math.abs(a - b) < 0.005;
const cents = (x) => Math.round(x * 100);

(async () => {
  const admin = await login('admin@jelantahku.test'), k1 = await login('kurir1@jelantahku.test');
  const budi = await login('budi@jelantahku.test'), warung = await login('warung@jelantahku.test');
  let r = await api('POST', '/users/staff', admin, { name: 'Kurir Dua', email: 'kurir2@jelantahku.test', password: 'rahasia123', role: 'courier' });
  const k2 = await login('kurir2@jelantahku.test', 'rahasia123');
  await api('POST', '/auth/register', null, { accountType: 'household', name: 'Limit User', email: 'limit@mail.com', password: 'rahasia123' });
  const lim = await login('limit@mail.com', 'rahasia123');

  sec('A. Settings & RBAC');
  r = await api('GET', '/settings/public', budi); t('settings publik 200', r.s === 200 && r.d.currentBuyPrice === 6000 && r.d.pointsPerLiter === 10);
  t('settings publik TIDAK membocorkan harga jual pabrik', r.d.factorySellPricePerLiter === undefined);
  r = await api('GET', '/settings/public'); t('tanpa token 401', r.s === 401);
  r = await api('GET', '/admin/settings', budi); t('customer ke admin/settings 403', r.s === 403);
  r = await api('GET', '/admin/settings', k1); t('kurir ke admin/settings 403', r.s === 403);
  r = await api('PUT', '/admin/settings', admin, {}); t('PUT kosong 400', r.s === 400);
  r = await api('PUT', '/admin/settings', admin, { currentBuyPrice: -5 }); t('harga negatif 400', r.s === 400);
  r = await api('PUT', '/admin/settings', admin, { role: 'x', currentBuyPrice: 6000 }); t('PUT valid (field asing diabaikan) 200', r.s === 200);

  sec('B. Drop points');
  r = await api('GET', '/drop-points', budi); t('list aktif = 3', r.s === 200 && r.d.items.length === 3);
  r = await api('POST', '/admin/drop-points', admin, { name: 'Titik D', address: 'Jl. Uji No. 9', latitude: -0.9, longitude: 100.3 }); t('admin buat 201', r.s === 201); const dpNew = r.d.id;
  r = await api('POST', '/admin/drop-points', admin, { name: 'X', address: 'Jl. Uji No. 9' }); t('nama terlalu pendek 400', r.s === 400);
  r = await api('POST', '/admin/drop-points', admin, { name: 'Titik E', address: 'Jl. Uji No. 9', latitude: -0.9 }); t('lat tanpa lon 400', r.s === 400);
  r = await api('POST', '/admin/drop-points', budi, { name: 'Titik F', address: 'Jl. Uji No. 9' }); t('customer buat drop point 403', r.s === 403);
  r = await api('PUT', `/admin/drop-points/${dpNew}`, admin, { isActive: false }); t('nonaktifkan 200', r.s === 200 && r.d.isActive === false);
  r = await api('GET', '/drop-points', budi); t('nonaktif hilang dari list customer', r.d.items.length === 3);
  r = await api('PUT', '/admin/drop-points/99999', admin, { name: 'Zzz' }); t('update id tak ada 404', r.s === 404);
  r = await api('PUT', '/admin/drop-points/abc', admin, { name: 'Zzz' }); t('id bukan angka 400', r.s === 400);

  sec('C. Setoran customer');
  const pick = { method: 'pickup', estimatedLiters: 12.5, pickupAddress: 'Jl. Contoh No. 5, Padang' };
  r = await api('POST', '/deposits', budi, pick); t('pickup 201 pending', r.s === 201 && r.d.deposit.status === 'pending' && r.d.deposit.estimatedLiters === 12.5); const dX = r.d.deposit.id;
  r = await api('POST', '/deposits', budi, { ...pick, estimatedLiters: 0 }); t('0 liter 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { ...pick, estimatedLiters: 501 }); t('>500 liter 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { method: 'pickup', estimatedLiters: 2 }); t('pickup tanpa alamat 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { ...pick, pickupLatitude: -0.9 }); t('lat tanpa lon 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { ...pick, preferredAt: '2020-01-01T00:00:00Z' }); t('waktu lampau 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { ...pick, preferredAt: new Date(Date.now() + 86400000).toISOString() }); t('waktu depan OK', r.s === 201); const dFuture = r.d.deposit.id;
  r = await api('POST', '/deposits', budi, { method: 'dropoff', estimatedLiters: 2, dropPointId: 99999 }); t('drop point tak ada 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { method: 'dropoff', estimatedLiters: 2, dropPointId: dpNew }); t('drop point nonaktif 400', r.s === 400);
  r = await api('POST', '/deposits', budi, { method: 'dropoff', estimatedLiters: 2, dropPointId: 1 }); t('dropoff 201', r.s === 201 && r.d.deposit.dropPoint.id === 1 && r.d.deposit.pickupAddress === null); const dDrop = r.d.deposit.id;
  r = await api('POST', '/deposits', budi, { method: 'teleport', estimatedLiters: 2 }); t('method asing 400', r.s === 400);
  r = await api('POST', '/deposits', k1, pick); t('kurir buat setoran 403', r.s === 403);
  r = await api('GET', `/deposits/${dX}`, warung); t('akses setoran milik orang lain 404', r.s === 404);
  r = await api('GET', `/deposits/${dX}`, budi); t('detail milik sendiri 200', r.s === 200);
  r = await api('GET', '/deposits?limit=2&page=2', budi); t('paginasi', r.s === 200 && r.d.pagination.limit === 2 && r.d.pagination.page === 2 && r.d.pagination.total >= 4);
  r = await api('GET', '/deposits?limit=1000', budi); t('limit 1000 ditolak', r.s === 400);
  r = await api('GET', '/deposits?status=completed', budi); t('filter status', r.s === 200 && r.d.items.every((i) => i.status === 'completed') && r.d.items.length === 1);
  r = await api('POST', `/deposits/${dFuture}/cancel`, budi); t('cancel 200', r.s === 200 && r.d.deposit.status === 'cancelled');
  r = await api('POST', `/deposits/${dFuture}/cancel`, budi); t('cancel ulang 409', r.s === 409);
  r = await api('POST', '/deposits/3/cancel', budi); t('cancel yang sudah completed 409', r.s === 409);
  r = await api('POST', `/deposits/${dX}/cancel`, warung); t('cancel milik orang lain 404', r.s === 404);
  let n = 0; for (let i = 0; i < 6; i++) { r = await api('POST', '/deposits', lim, pick); if (r.s === 201) n++; }
  t('batas 5 pengajuan aktif (6 percobaan -> 5 sukses)', n === 5 && r.s === 409, `n=${n} last=${r.s}`);

  sec('D. Antrean kurir');
  r = await api('GET', '/courier/tasks', k1); t('kurir1 lihat tugas', r.s === 200 && r.d.items.some((i) => i.id === 2) && r.d.items.some((i) => i.id === dX));
  const t1 = r.d.items.find((i) => i.id === dX), t2 = r.d.items.find((i) => i.id === 2);
  t('telepon customer disembunyikan untuk tugas pending', t1.customer.phone === null && t1.customer.name);
  t('telepon terlihat untuk tugas milik sendiri', t2.customer.phone !== null);
  r = await api('GET', '/courier/tasks', k2); t('kurir2 tidak melihat tugas scheduled milik kurir1', !r.d.items.some((i) => i.id === 2));
  r = await api('GET', '/courier/tasks?status=scheduled', k1); t('filter scheduled', r.d.items.length >= 1 && r.d.items.every((i) => i.status === 'scheduled'));
  r = await api('GET', '/courier/tasks', budi); t('customer ke /courier 403', r.s === 403);
  r = await api('GET', '/courier/tasks', admin); t('admin ke /courier 403', r.s === 403);
  r = await api('GET', '/courier/tasks/3', k1); t('kurir yang menangani boleh melihat riwayat tugasnya', r.s === 200);
  r = await api('GET', '/courier/tasks/3', k2); t('kurir lain tak bisa melihat tugas completed orang lain 404', r.s === 404);
  r = await api('POST', `/courier/tasks/${dX}/claim`, k1); t('claim 200', r.s === 200 && r.d.task.status === 'scheduled' && r.d.task.customer.phone !== null);
  r = await api('POST', `/courier/tasks/${dX}/claim`, k2); t('claim oleh kurir lain 409', r.s === 409);
  const [c1, c2] = await Promise.all([api('POST', `/courier/tasks/${dDrop}/claim`, k1), api('POST', `/courier/tasks/${dDrop}/claim`, k2)]);
  t('claim paralel: tepat satu menang', [c1.s, c2.s].sort().join() === '200,409', `${c1.s},${c2.s}`);
  r = await api('POST', `/courier/tasks/${dX}/complete`, k2, { actualLiters: 5, quality: 'layak' }); t('kurir lain menyelesaikan tugas orang lain 403', r.s === 403);

  sec('E. Validasi lapangan & dompet');
  r = await api('GET', '/wallet', budi); const w0 = r.d.wallet; t('saldo awal seed 30000 / 50', w0.cashBalance === 30000 && w0.pointsBalance === 50);
  r = await api('POST', `/courier/tasks/${dX}/complete`, k1, { actualLiters: 0, quality: 'layak' }); t('0 liter 400', r.s === 400);
  r = await api('POST', `/courier/tasks/${dX}/complete`, k1, { actualLiters: 1000.5, quality: 'layak' }); t('>1000 liter 400', r.s === 400);
  r = await api('POST', `/courier/tasks/${dX}/complete`, k1, { actualLiters: 5, quality: 'bagus' }); t('quality asing 400', r.s === 400);
  r = await api('POST', `/courier/tasks/${dX}/complete`, budi, { actualLiters: 5, quality: 'layak' }); t('customer complete 403', r.s === 403);
  r = await api('POST', `/courier/tasks/${dX}/complete`, k1, { actualLiters: 12.5, quality: 'layak', notes: 'Bersih' });
  t('complete layak 200', r.s === 200 && r.d.outcome === 'completed' && r.d.deposit.status === 'completed');
  t('12.5 L x Rp6000 = Rp75.000 + 125 poin', r.d.reward.cash === 75000 && r.d.reward.points === 125, JSON.stringify(r.d.reward));
  t('snapshot harga di setoran', r.d.deposit.buyPriceSnapshot === 6000 && r.d.deposit.pointsPerLiterSnapshot === 10 && r.d.deposit.cashAwarded === 75000);
  r = await api('GET', '/wallet', budi); t('saldo naik 105000 / 175', r.d.wallet.cashBalance === 105000 && r.d.wallet.pointsBalance === 175, JSON.stringify(r.d.wallet));
  r = await api('GET', '/wallet/transactions?limit=2', budi);
  t('2 mutasi terbaru (poin & tunai) dengan balanceAfter benar', r.d.items.length === 2 && r.d.items.every((i) => i.type === 'deposit_reward' && i.depositId === dX) &&
    r.d.items.some((i) => i.asset === 'cash' && i.amount === 75000 && i.balanceAfter === 105000) && r.d.items.some((i) => i.asset === 'points' && i.amount === 125 && i.balanceAfter === 175), JSON.stringify(r.d.items));
  r = await api('POST', `/courier/tasks/${dX}/complete`, k1, { actualLiters: 12.5, quality: 'layak' }); t('complete ulang 409', r.s === 409);
  r = await api('GET', '/wallet', budi); t('saldo tidak bertambah lagi', r.d.wallet.cashBalance === 105000);

  // Balapan: dua permintaan complete bersamaan untuk setoran yang sama
  r = await api('POST', '/deposits', budi, { method: 'pickup', estimatedLiters: 4, pickupAddress: 'Jl. Balapan No. 1' }); const dRace = r.d.deposit.id;
  const [a, b2] = await Promise.all([1, 2].map(() => api('POST', `/courier/tasks/${dRace}/complete`, k1, { actualLiters: 4, quality: 'layak' })));
  t('complete paralel: tepat satu berhasil', [a.s, b2.s].sort().join() === '200,409', `${a.s},${b2.s}`);
  r = await api('GET', '/wallet', budi); t('saldo hanya bertambah SEKALI (24000 + 40)', r.d.wallet.cashBalance === 129000 && r.d.wallet.pointsBalance === 215, JSON.stringify(r.d.wallet));

  // Tercampur air -> rejected
  r = await api('POST', '/deposits', budi, { method: 'pickup', estimatedLiters: 6, pickupAddress: 'Jl. Air No. 3' }); const dWater = r.d.deposit.id;
  r = await api('POST', `/courier/tasks/${dWater}/complete`, k1, { actualLiters: 6, quality: 'tercampur_air', notes: 'Ada lapisan air' });
  t('tercampur_air -> rejected, tanpa reward', r.s === 200 && r.d.outcome === 'rejected' && r.d.reward === null && r.d.deposit.status === 'rejected' && r.d.deposit.quality === 'tercampur_air' && r.d.deposit.cashAwarded === null);
  r = await api('GET', '/wallet', budi); t('saldo TIDAK berubah setelah penolakan', r.d.wallet.cashBalance === 129000 && r.d.wallet.pointsBalance === 215);
  r = await api('POST', `/courier/tasks/${dWater}/complete`, k1, { actualLiters: 6, quality: 'layak' }); t('setoran rejected tidak bisa dibayar belakangan 409', r.s === 409);

  // Pembulatan kecil: 0.07 L
  r = await api('POST', '/deposits', budi, { method: 'pickup', estimatedLiters: 0.07, pickupAddress: 'Jl. Kecil No. 2' }); const dTiny = r.d.deposit.id;
  r = await api('POST', `/courier/tasks/${dTiny}/complete`, k1, { actualLiters: 0.07, quality: 'layak' });
  t('0.07 L -> Rp420, 0 poin, tanpa error (baris mutasi poin dilewati)', r.s === 200 && r.d.reward.cash === 420 && r.d.reward.points === 0, JSON.stringify(r.d));

  sec('F. Snapshot harga & presisi uang');
  r = await api('PUT', '/admin/settings', admin, { currentBuyPrice: 6333.33, pointsPerLiter: 7 }); t('admin ubah harga', r.s === 200 && r.d.currentBuyPrice === 6333.33);
  r = await api('POST', '/deposits', budi, { method: 'pickup', estimatedLiters: 3.33, pickupAddress: 'Jl. Harga No. 4' }); const dP = r.d.deposit.id;
  r = await api('POST', `/courier/tasks/${dP}/complete`, k1, { actualLiters: 3.33, quality: 'layak' });
  t('3.33 x 6333.33 = 21089.99 (NUMERIC, bukan float) & 23 poin', r.d.reward.cash === 21089.99 && r.d.reward.points === 23, JSON.stringify(r.d.reward));
  r = await api('GET', `/deposits/${dX}`, budi); t('setoran lama tetap memakai harga snapshot 6000', r.d.deposit.buyPriceSnapshot === 6000 && r.d.deposit.cashAwarded === 75000);
  await api('PUT', '/admin/settings', admin, { currentBuyPrice: 6000, pointsPerLiter: 10 });

  sec('G. Tarik dana');
  r = await api('GET', '/wallet', budi); const bal = r.d.wallet.cashBalance; t('saldo dibaca', bal > 100000, String(bal));
  const wd = { destinationType: 'bank', destinationProvider: 'BRI', accountName: 'Budi', accountNumber: '1234567890' };
  r = await api('POST', '/wallet/withdrawals', budi, { ...wd, amount: 5000 }); t('di bawah minimum 400', r.s === 400);
  r = await api('POST', '/wallet/withdrawals', budi, { ...wd, amount: Math.ceil(bal) + 1000 }); t('melebihi saldo 400', r.s === 400 && /Saldo/.test(r.b.message));
  r = await api('POST', '/wallet/withdrawals', budi, { ...wd, amount: 20000.5 }); t('nominal desimal 400', r.s === 400);
  r = await api('POST', '/wallet/withdrawals', budi, { ...wd, amount: 20000, accountNumber: 'abc' }); t('no rekening huruf 400', r.s === 400);
  r = await api('POST', '/wallet/withdrawals', k1, { ...wd, amount: 20000 }); t('kurir tarik dana 403', r.s === 403);
  r = await api('POST', '/wallet/withdrawals', budi, { ...wd, amount: 20000 }); t('tarik 20000 -> 201 pending', r.s === 201 && r.d.withdrawal.status === 'pending' && cents(r.d.wallet.cashBalance) === cents(bal - 20000)); const wdA = r.d.withdrawal.id;
  const big = Math.floor((bal - 20000) * 0.6);
  const race = await Promise.all([1, 2].map(() => api('POST', '/wallet/withdrawals', budi, { ...wd, amount: big })));
  t('tarik paralel 2x60% saldo: tepat satu lolos', race.map((x) => x.s).sort().join() === '201,400', race.map((x) => x.s).join());
  r = await api('GET', '/wallet', budi); t('saldo tidak minus', r.d.wallet.cashBalance >= 0 && cents(r.d.wallet.cashBalance) === cents(bal - 20000 - big), JSON.stringify(r.d.wallet));
  const wdB = race.find((x) => x.s === 201).d.withdrawal.id; const balBeforeRefund = r.d.wallet.cashBalance;
  r = await api('GET', '/admin/withdrawals?status=pending', admin); t('admin lihat pending', r.s === 200 && r.d.items.length === 2 && r.d.items[0].user.email);
  r = await api('GET', '/admin/withdrawals', budi); t('customer ke admin/withdrawals 403', r.s === 403);
  r = await api('PATCH', `/admin/withdrawals/${wdB}`, admin, { status: 'rejected' }); t('admin tolak', r.s === 200 && r.d.withdrawal.status === 'rejected');
  r = await api('GET', '/wallet', budi); t('saldo dikembalikan', cents(r.d.wallet.cashBalance) === cents(balBeforeRefund + big));
  r = await api('PATCH', `/admin/withdrawals/${wdB}`, admin, { status: 'paid' }); t('proses ulang 409 (tidak refund dua kali)', r.s === 409);
  r = await api('PATCH', `/admin/withdrawals/${wdA}`, admin, { status: 'paid' }); t('admin bayar', r.s === 200 && r.d.withdrawal.status === 'paid');
  r = await api('PATCH', `/admin/withdrawals/${wdA}`, admin, { status: 'selesai' }); t('status asing 400', r.s === 400);
  r = await api('GET', '/wallet/withdrawals', budi); t('riwayat tarik dana customer', r.s === 200 && r.d.items.length === 2);
  r = await api('GET', '/wallet/transactions?asset=cash&limit=100', budi); t('mutasi memuat withdrawal & refund', r.d.items.some((i) => i.type === 'withdrawal' && i.amount < 0) && r.d.items.some((i) => i.type === 'withdrawal_refund' && i.amount > 0));

  sec('H. Rewards');
  r = await api('GET', '/rewards', budi); t('katalog 4 reward', r.s === 200 && r.d.items.length === 4);
  const tote = r.d.items.find((i) => i.name.startsWith('Tote')), coffee = r.d.items.find((i) => i.name.startsWith('Voucher Kopi'));
  r = await api('GET', '/wallet', budi); const pts0 = r.d.wallet.pointsBalance;
  r = await api('POST', `/rewards/${tote.id}/redeem`, budi);
  if (pts0 >= 300) { t('(poin cukup) tote berhasil', r.s === 201); } else { t('poin kurang 400', r.s === 400 && /Poin/.test(r.b.message)); }
  let s = (await api('GET', '/admin/rewards', admin)).d.items.find((i) => i.id === tote.id).stock;
  t('stok setelah redeem sesuai hasil', pts0 >= 300 ? s === tote.stock - 1 : s === tote.stock, `stok=${s}`);
  // customer dengan poin 0 mencoba
  r = await api('POST', `/rewards/${coffee.id}/redeem`, lim); t('poin 0 -> 400 & stok utuh', r.s === 400 && (await api('GET', '/admin/rewards', admin)).d.items.find((i) => i.id === coffee.id).stock === coffee.stock);
  r = await api('GET', '/wallet', budi); const pts1 = r.d.wallet.pointsBalance;
  r = await api('POST', `/rewards/${coffee.id}/redeem`, budi); t('tukar kopi 201 + kode voucher', r.s === 201 && /^JLK-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(r.d.voucher.code) && r.d.wallet.pointsBalance === pts1 - 100, JSON.stringify(r.d));
  const code = r.d.voucher.code;
  r = await api('GET', '/rewards/redemptions', budi); t('riwayat voucher', r.s === 200 && r.d.items.some((i) => i.code === code && i.status === 'active'));
  r = await api('POST', '/rewards/99999/redeem', budi); t('reward tak ada 404', r.s === 404);
  r = await api('POST', '/admin/rewards', admin, { name: 'Reward Uji', pointsCost: 0, stock: 1 }); t('harga poin 0 ditolak', r.s === 400);
  r = await api('POST', '/admin/rewards', admin, { name: 'Reward Uji', pointsCost: 10, stock: 1, imageUrl: 'javascript:alert(1)' }); t('imageUrl javascript: ditolak', r.s === 400);
  r = await api('POST', '/admin/rewards', admin, { name: 'Reward Satu-satunya', pointsCost: 1, stock: 1, imageUrl: 'https://example.com/a.png' }); t('admin buat reward 201', r.s === 201); const rLast = r.d.id;
  r = await api('POST', '/admin/rewards', budi, { name: 'Curang', pointsCost: 1, stock: 99 }); t('customer buat reward 403', r.s === 403);

  sec('I. Badge UMKM & dampak');
  r = await api('GET', '/public/umkm/warung-sari-rasa'); t('profil publik 404 sebelum badge', r.s === 404);
  r = await api('POST', '/courier/tasks/2/complete', k1, { actualLiters: 20, quality: 'layak' }); t('setoran UMKM 20 L: Rp120.000 + 200 poin', r.s === 200 && r.d.reward.cash === 120000 && r.d.reward.points === 200);
  t('badge belum (ambang 50 L)', r.d.badgeAwarded === false);
  r = await api('GET', '/impact', warung); t('progres badge 20/50', r.d.impact.badge.verified === false && r.d.impact.badge.progressLiters === 20 && r.d.impact.badge.remainingLiters === 30 && r.d.impact.badge.publicProfileSlug === null);
  await api('PUT', '/admin/settings', admin, { umkmBadgeMinLiters: 20 });
  r = await api('POST', '/deposits', warung, { method: 'dropoff', estimatedLiters: 1, dropPointId: 1 }); const dW = r.d.deposit.id;
  r = await api('POST', `/courier/tasks/${dW}/complete`, k1, { actualLiters: 1, quality: 'layak' }); t('ambang turun ke 20 -> badge diberikan', r.s === 200 && r.d.badgeAwarded === true);
  r = await api('GET', '/public/umkm/warung-sari-rasa'); const p = r.d && r.d.profile;
  t('profil publik 200 tanpa login', r.s === 200 && p.businessName === 'Warung Sari Rasa' && p.totalLiters === 21);
  t('profil publik tanpa data akun privat & kontak masih kosong', !JSON.stringify(p).includes('warung@jelantahku.test') && !JSON.stringify(p).includes('081200000004') && p.contactPhone === null && p.contactEmail === null);
  r = await api('GET', '/public/umkm/TIDAK ADA!'); t('slug tidak valid 400', r.s === 400);
  r = await api('GET', '/auth/me', warung); t('/auth/me menampilkan badge', r.d.user.umkmProfile.badgeVerified === true);
  await api('PUT', '/admin/settings', admin, { umkmBadgeMinLiters: 50 });
  r = await api('GET', '/impact', budi);
  const im = r.d.impact; t('dampak customer: air = liter x 1000, CO2 = liter x faktor', approx(im.estimatedWaterProtectedLiters, im.totalLiters * 1000) && approx(im.estimatedCo2AvoidedKg, im.totalLiters * 2) && im.assumptions.isEstimate === true && im.badge === null, JSON.stringify(im));
  t('total liter budi = 5 + 12.5 + 4 + 0.07 + 3.33 = 24.9; 1 ditolak', approx(im.totalLiters, 24.9) && im.completedDeposits === 5 && im.rejectedDeposits === 1, JSON.stringify(im));
  r = await api('GET', '/impact', admin); t('admin ke /impact 403', r.s === 403);

  sec('H2. Balapan stok reward (stok 1, 2 pembeli)');
  r = await api('GET', '/wallet', warung); const wPts = r.d.wallet.pointsBalance;
  const stockRace = await Promise.all([api('POST', `/rewards/${rLast}/redeem`, budi), api('POST', `/rewards/${rLast}/redeem`, warung)]);
  t('tepat satu pembeli berhasil', stockRace.map((x) => x.s).sort().join() === '201,409', stockRace.map((x) => x.s).join());
  s = (await api('GET', '/admin/rewards', admin)).d.items.find((i) => i.id === rLast); t('stok 0, tidak negatif', s.stock === 0 && s.available === false);
  r = await api('GET', '/wallet', warung); const loser = stockRace[1].s === 409;
  t('pembeli yang kalah TIDAK dipotong poin', loser ? r.d.wallet.pointsBalance === wPts : r.d.wallet.pointsBalance === wPts - 1, `${wPts} -> ${r.d.wallet.pointsBalance}`);
  await api('PUT', `/admin/rewards/${tote.id}`, admin, { isActive: false });
  r = await api('POST', `/rewards/${tote.id}/redeem`, budi); t('reward nonaktif 404', r.s === 404);

  sec('J. Analitik admin');
  r = await api('GET', '/admin/analytics/summary', admin); const sm = r.d;
  t('summary 200', r.s === 200);
  t('stok = 24.9 (budi) + 21 (warung) = 45.9', approx(sm.collected.totalLiters, 45.9), String(sm.collected.totalLiters));
  t('ada simulasi margin berlabel', sm.marginSimulation.isSimulation === true && approx(sm.marginSimulation.estimatedMargin, sm.marginSimulation.estimatedRevenue - sm.marginSimulation.cashCost));
  t('hitungan status & user', sm.deposits.rejected === 1 && sm.users.admin === 1 && sm.users.courier === 2 && sm.pendingWithdrawals.count === 0);
  t('seri bulanan ada', Array.isArray(sm.monthly) && sm.monthly.length >= 1);
  console.log('  ringkasan:', JSON.stringify({ liter: sm.collected.totalLiters, cashPaid: sm.payouts.cashPaid, poin: sm.payouts.pointsIssued, margin: sm.marginSimulation.estimatedMargin }));
  r = await api('GET', '/admin/deposits?status=rejected', admin); t('admin daftar setoran + filter', r.s === 200 && r.d.items.length === 1 && r.d.items[0].customer.email);
  r = await api('GET', '/admin/analytics/summary', budi); t('customer ke analytics 403', r.s === 403);

  sec('K. Voucher: admin menandai terpakai');
  r = await api('GET', '/admin/vouchers?status=active', admin); t('admin lihat voucher aktif', r.s === 200 && r.d.items.some((i) => i.code === code && i.customer.email === 'budi@jelantahku.test'));
  r = await api('GET', `/admin/vouchers?code=${code.slice(0, 8).toLowerCase()}`, admin); t('cari kode (huruf kecil, sebagian)', r.s === 200 && r.d.items.some((i) => i.code === code));
  r = await api('GET', '/admin/vouchers?code=%25', admin); t('wildcard % ditolak', r.s === 400);
  r = await api('GET', '/admin/vouchers', budi); t('customer ke admin/vouchers 403', r.s === 403);
  r = await api('POST', `/admin/vouchers/${code}/use`, budi); t('customer menandai voucher 403', r.s === 403);
  r = await api('POST', `/admin/vouchers/${code.toLowerCase()}/use`, admin); t('tandai terpakai (kode huruf kecil dinormalkan)', r.s === 200 && r.d.voucher.status === 'used' && !!r.d.voucher.usedAt);
  r = await api('POST', `/admin/vouchers/${code}/use`, admin); t('tandai ulang 409', r.s === 409 && /terpakai/.test(r.b.message));
  r = await api('POST', '/admin/vouchers/JLK-AAAA-BBBB/use', admin); t('kode tidak ada 404', r.s === 404);
  r = await api('POST', '/admin/vouchers/ABC/use', admin); t('format kode salah 400', r.s === 400);
  r = await api('GET', '/rewards/redemptions', budi); t('customer melihat status used', r.d.items.some((i) => i.code === code && i.status === 'used'));
  r = await api('GET', '/admin/vouchers?status=used', admin); t('filter used', r.d.items.length >= 1 && r.d.items.every((i) => i.status === 'used'));
  const winner = stockRace.find((x) => x.s === 201).d.voucher.code;
  const useRace = await Promise.all([1, 2].map(() => api('POST', `/admin/vouchers/${winner}/use`, admin)));
  t('tandai paralel: tepat satu berhasil', useRace.map((x) => x.s).sort().join() === '200,409', useRace.map((x) => x.s).join());

  sec('L. Profil UMKM');
  r = await api('PATCH', '/umkm/profile', warung, { description: 'Warung makan keluarga, bahan segar tiap hari.', address: 'Jl. Contoh No. 10, Padang', contactPhone: '081377788899', contactEmail: 'Kontak@Warung.id' });
  t('update 200 (email dinormalkan huruf kecil)', r.s === 200 && r.d.profile.contactEmail === 'kontak@warung.id' && r.d.profile.description.startsWith('Warung'));
  r = await api('PATCH', '/umkm/profile', warung, { contactPhone: 'abc' }); t('telepon tidak valid 400', r.s === 400);
  r = await api('PATCH', '/umkm/profile', warung, { contactEmail: 'bukan-email' }); t('email tidak valid 400', r.s === 400);
  r = await api('PATCH', '/umkm/profile', warung, {}); t('body kosong 400', r.s === 400);
  r = await api('PATCH', '/umkm/profile', budi, { description: 'x' }); t('household 403', r.s === 403);
  r = await api('PATCH', '/umkm/profile', warung, { slug: 'curang', badgeVerified: false, businessName: 'Warung Sari Rasa Baru' });
  t('slug & badge tidak bisa diubah, nama bisa', r.s === 200 && r.d.profile.slug === 'warung-sari-rasa' && r.d.profile.badgeVerified === true && r.d.profile.businessName === 'Warung Sari Rasa Baru');
  r = await api('GET', '/public/umkm/warung-sari-rasa'); const p2 = r.d.profile;
  t('profil publik menampilkan alamat, deskripsi, kontak usaha', p2.contactPhone === '081377788899' && p2.contactEmail === 'kontak@warung.id' && p2.address.includes('Padang') && p2.description.includes('Warung makan'));
  t('data akun privat tidak bocor', !JSON.stringify(p2).includes('warung@jelantahku.test') && !JSON.stringify(p2).includes('081200000004'));
  r = await api('PATCH', '/umkm/profile', warung, { contactPhone: '', contactEmail: null }); t('kosongkan kontak (string kosong & null)', r.s === 200 && r.d.profile.contactPhone === null && r.d.profile.contactEmail === null);
  r = await api('GET', '/public/umkm/warung-sari-rasa'); t('kontak hilang dari halaman publik', r.d.profile.contactPhone === null && r.d.profile.contactEmail === null);
  r = await api('GET', '/auth/me', warung); t('/auth/me memuat deskripsi & kontak', r.d.user.umkmProfile.description.startsWith('Warung') && 'contactPhone' in r.d.user.umkmProfile);
  r = await api('GET', '/umkm/profile', warung); t('GET profil UMKM sendiri', r.s === 200 && r.d.profile.slug === 'warung-sari-rasa');

  console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
