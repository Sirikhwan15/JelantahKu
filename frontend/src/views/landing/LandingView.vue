<script setup>
import { ArrowRight, BadgeCheck, ClipboardCheck, Coins, Droplets, Factory, Leaf, Recycle, Store, Truck, Wallet } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const steps = [
  { icon: ClipboardCheck, title: 'Ajukan setoran', text: 'Isi estimasi liter, pilih dijemput kurir atau diantar ke titik mitra terdekat.' },
  { icon: Truck, title: 'Kurir memvalidasi', text: 'Kurir mengukur volume dan memeriksa kualitas minyak langsung di lapangan.' },
  { icon: Wallet, title: 'Terima insentif', text: 'Saldo Rupiah dan Green Points otomatis masuk ke akun Anda setelah divalidasi.' },
];

const benefits = [
  { icon: Wallet, tone: 'bg-brand-100 text-brand-800', title: 'Saldo Rupiah', text: 'Setiap liter minyak layak dihargai sesuai harga beli terbaru. Saldo bisa disimulasikan untuk ditarik.' },
  { icon: Coins, tone: 'bg-accent-100 text-accent-900', title: 'Green Points', text: 'Tukarkan poin dengan voucher dan produk dari UMKM mitra, lengkap dengan kode voucher unik.' },
];
</script>

<template>
  <!-- Hero -->
  <section class="bg-gradient-to-b from-brand-50 to-surface">
    <div class="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-900">
          <Recycle class="size-4" aria-hidden="true" /> Ekonomi sirkular untuk dapur Indonesia
        </p>
        <h1 class="mt-5 text-4xl font-extrabold sm:text-5xl">Minyak jelantah Anda bernilai. Jangan dibuang.</h1>
        <p class="mt-5 max-w-xl text-lg text-muted">
          Setor minyak jelantah, dapatkan saldo Rupiah dan Green Points. Minyak yang terkumpul diolah kembali sehingga tidak mencemari saluran air.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <AppButton v-if="auth.isAuthenticated" :to="auth.homePath" size="lg">Buka dashboard <ArrowRight class="size-5" aria-hidden="true" /></AppButton>
          <template v-else>
            <AppButton to="/daftar" size="lg">Mulai setor gratis <ArrowRight class="size-5" aria-hidden="true" /></AppButton>
            <AppButton to="/masuk" variant="secondary" size="lg">Saya sudah punya akun</AppButton>
          </template>
        </div>
      </div>

      <div class="card mx-auto w-full max-w-md p-6" aria-hidden="true">
        <div class="flex items-center gap-3">
          <span class="flex size-12 items-center justify-center rounded-xl bg-brand-700 text-white"><Droplets class="size-6" /></span>
          <div>
            <p class="font-bold">Setoran selesai</p>
            <p class="text-sm text-muted">Contoh tampilan notifikasi</p>
          </div>
        </div>
        <div class="mt-5 grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-brand-50 p-4">
            <p class="text-sm font-semibold text-muted">Saldo Rupiah</p>
            <p class="mt-1 text-xl font-extrabold text-brand-900">+ Rp75.000</p>
          </div>
          <div class="rounded-xl bg-accent-50 p-4">
            <p class="text-sm font-semibold text-muted">Green Points</p>
            <p class="mt-1 text-xl font-extrabold text-accent-900">+ 125</p>
          </div>
        </div>
        <p class="mt-4 text-sm text-muted">Angka di atas hanya ilustrasi. Nilai sebenarnya mengikuti harga beli yang berlaku.</p>
      </div>
    </div>
  </section>

  <!-- Cara kerja -->
  <section id="cara-kerja" class="container-page scroll-mt-20 py-16">
    <h2 class="text-3xl font-extrabold">Cara kerjanya sederhana</h2>
    <p class="mt-2 max-w-2xl text-muted">Tiga langkah dari dapur Anda sampai insentif masuk ke akun.</p>
    <ol class="mt-8 grid gap-5 md:grid-cols-3">
      <li v-for="(s, i) in steps" :key="s.title" class="card p-6">
        <div class="flex items-center gap-3">
          <span class="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><component :is="s.icon" class="size-6" aria-hidden="true" /></span>
          <span class="text-sm font-bold text-muted">Langkah {{ i + 1 }}</span>
        </div>
        <h3 class="mt-4 text-xl font-bold">{{ s.title }}</h3>
        <p class="mt-2 text-muted">{{ s.text }}</p>
      </li>
    </ol>
  </section>

  <!-- Insentif ganda -->
  <section id="insentif" class="scroll-mt-20 bg-card py-16">
    <div class="container-page">
      <h2 class="text-3xl font-extrabold">Dua insentif sekaligus</h2>
      <p class="mt-2 max-w-2xl text-muted">Anda dihargai dengan uang tunai dan poin yang bisa dipakai di UMKM mitra.</p>
      <div class="mt-8 grid gap-5 md:grid-cols-2">
        <article v-for="b in benefits" :key="b.title" class="rounded-2xl border border-line bg-surface p-6">
          <span class="flex size-12 items-center justify-center rounded-xl" :class="b.tone"><component :is="b.icon" class="size-6" aria-hidden="true" /></span>
          <h3 class="mt-4 text-xl font-bold">{{ b.title }}</h3>
          <p class="mt-2 text-muted">{{ b.text }}</p>
        </article>
      </div>
    </div>
  </section>

  <!-- UMKM -->
  <section id="mitra" class="container-page scroll-mt-20 py-16">
    <div class="grid items-center gap-8 lg:grid-cols-2">
      <div>
        <p class="inline-flex items-center gap-2 text-sm font-bold text-accent-700"><Store class="size-4" aria-hidden="true" /> Untuk UMKM kuliner</p>
        <h2 class="mt-2 text-3xl font-extrabold">Tunjukkan usaha Anda peduli lingkungan</h2>
        <p class="mt-3 text-muted">
          Warung, kafe, dan katering yang rutin menyetor jelantah mendapatkan <strong class="text-ink">Green Merchant Badge</strong>
          beserta halaman profil publik yang bisa dibagikan ke pelanggan.
        </p>
      </div>
      <div class="card flex items-center gap-4 p-6">
        <span class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-900"><BadgeCheck class="size-8" aria-hidden="true" /></span>
        <div>
          <p class="text-lg font-bold">Green Merchant Badge</p>
          <p class="text-muted">Diberikan otomatis saat total setoran usaha Anda mencapai ambang volume yang ditetapkan.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Dampak -->
  <section id="dampak" class="scroll-mt-20 bg-brand-900 py-16 text-white">
    <div class="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
      <div>
        <h2 class="text-3xl font-extrabold">Kenapa jelantah tidak boleh dibuang ke saluran?</h2>
        <p class="mt-3 text-brand-100">
          Satu liter minyak jelantah yang terbuang berpotensi mencemari sekitar seribu liter air. Angka ini adalah estimasi yang
          umum dikutip, dan dashboard dampak di aplikasi juga menampilkan perkiraan, bukan hasil pengukuran.
        </p>
      </div>
      <ul class="space-y-3">
        <li class="flex gap-3 rounded-xl bg-white/10 p-4"><Leaf class="mt-0.5 size-6 shrink-0 text-brand-200" aria-hidden="true" /><span>Menekan pencemaran air dan penyumbatan saluran.</span></li>
        <li class="flex gap-3 rounded-xl bg-white/10 p-4"><Factory class="mt-0.5 size-6 shrink-0 text-brand-200" aria-hidden="true" /><span>Minyak terkumpul bisa diolah kembali menjadi bahan biofuel.</span></li>
        <li class="flex gap-3 rounded-xl bg-white/10 p-4"><Recycle class="mt-0.5 size-6 shrink-0 text-brand-200" aria-hidden="true" /><span>Mencegah minyak bekas dipakai ulang untuk menggoreng.</span></li>
      </ul>
    </div>
  </section>

  <!-- CTA -->
  <section class="container-page py-16 text-center">
    <h2 class="text-3xl font-extrabold">Siap mulai menyetor?</h2>
    <p class="mx-auto mt-2 max-w-xl text-muted">Pendaftaran gratis dan hanya butuh satu menit.</p>
    <div class="mt-6 flex justify-center">
      <AppButton :to="auth.isAuthenticated ? auth.homePath : '/daftar'" size="lg">
        {{ auth.isAuthenticated ? 'Buka dashboard' : 'Daftar sekarang' }} <ArrowRight class="size-5" aria-hidden="true" />
      </AppButton>
    </div>
  </section>
</template>
