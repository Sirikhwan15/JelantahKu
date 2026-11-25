<script setup>
import { computed, onMounted, ref } from 'vue';
import { BadgeCheck, Coins, Droplets, Leaf, RefreshCw, Wallet } from 'lucide-vue-next';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StatCard from '@/components/shared/StatCard.vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { formatKg, formatLiters, formatNumber, formatPoints, formatRupiah } from '@/utils/format';

const auth = useAuthStore();
const impact = ref(null);
const loading = ref(true);
const error = ref('');

const wallet = computed(() => auth.user?.wallet ?? { cashBalance: 0, pointsBalance: 0 });
const badge = computed(() => impact.value?.badge ?? null);
const badgePercent = computed(() => {
  if (!badge.value || !badge.value.requiredLiters) return 100;
  return Math.min(100, Math.round((badge.value.progressLiters / badge.value.requiredLiters) * 100));
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [data] = await Promise.all([api.get('/impact'), auth.fetchMe()]);
    impact.value = data.impact;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="text-2xl font-extrabold sm:text-3xl">Halo, {{ auth.user?.name }}</h1>
    <p class="mt-1 text-muted">Ringkasan saldo dan dampak setoran Anda.</p>

    <AppAlert v-if="error" tone="error" class="mt-6">
      <p>{{ error }}</p>
      <AppButton variant="secondary" class="mt-3" @click="load"><RefreshCw class="size-4" aria-hidden="true" /> Coba lagi</AppButton>
    </AppAlert>

    <section aria-labelledby="dompet" class="mt-8">
      <h2 id="dompet" class="text-lg font-bold">Dompet</h2>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <StatCard label="Saldo Rupiah" :value="formatRupiah(wallet.cashBalance)" :icon="Wallet" />
        <StatCard label="Green Points" :value="formatPoints(wallet.pointsBalance)" :icon="Coins" tone="accent" />
      </div>
    </section>

    <section aria-labelledby="dampak" class="mt-8">
      <h2 id="dampak" class="text-lg font-bold">Dampak lingkungan</h2>
      <div v-if="loading" class="mt-3 grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Memuat data dampak">
        <div v-for="n in 3" :key="n" class="card h-32 animate-pulse motion-reduce:animate-none bg-line/60"></div>
      </div>
      <template v-else-if="impact">
        <div class="mt-3 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total jelantah disetor" :value="formatLiters(impact.totalLiters)" :hint="`${impact.completedDeposits} setoran selesai`" :icon="Droplets" />
          <StatCard label="Estimasi air terlindungi" :value="`${formatNumber(impact.estimatedWaterProtectedLiters)} L`" hint="Perkiraan potensi pencemaran yang dicegah" :icon="Leaf" />
          <StatCard label="Estimasi emisi CO₂ terhindar" :value="formatKg(impact.estimatedCo2AvoidedKg)" hint="Perkiraan, bukan hasil pengukuran" :icon="Leaf" />
        </div>
        <p class="mt-3 text-sm text-muted">
          Semua angka dampak adalah <strong class="text-ink">estimasi</strong> berdasarkan faktor
          {{ formatNumber(impact.assumptions.waterLitersPerLiterOil) }} L air dan {{ formatNumber(impact.assumptions.co2KgPerLiter) }} kg CO₂ per liter minyak.
        </p>
      </template>
    </section>

    <section v-if="badge" aria-labelledby="badge" class="mt-8">
      <h2 id="badge" class="text-lg font-bold">Green Merchant Badge</h2>
      <div class="card mt-3 p-5">
        <div v-if="badge.verified" class="flex items-center gap-3">
          <BadgeCheck class="size-8 text-accent-700" aria-hidden="true" />
          <p class="font-semibold">Usaha Anda sudah terverifikasi sebagai Green Merchant.</p>
        </div>
        <template v-else>
          <p class="font-semibold">{{ formatLiters(badge.progressLiters) }} dari {{ formatLiters(badge.requiredLiters) }}</p>
          <div class="mt-3 h-3 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="badgePercent" aria-valuemin="0" aria-valuemax="100" aria-label="Progres menuju Green Merchant Badge">
            <div class="h-full rounded-full bg-brand-700 transition-[width] duration-300" :style="{ width: badgePercent + '%' }"></div>
          </div>
          <p class="mt-2 text-sm text-muted">Setor {{ formatLiters(badge.remainingLiters) }} lagi untuk mendapatkan badge.</p>
        </template>
      </div>
    </section>
  </div>
</template>
