<script setup>
import { computed, onMounted, ref } from 'vue';
import { Droplets, RefreshCw, TrendingUp, Wallet } from 'lucide-vue-next';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StatCard from '@/components/shared/StatCard.vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { formatLiters, formatRupiah } from '@/utils/format';

const auth = useAuthStore();
const summary = ref(null);
const loading = ref(true);
const error = ref('');

const margin = computed(() => summary.value?.marginSimulation ?? null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    summary.value = await api.get('/admin/analytics/summary');
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
    <p class="mt-1 text-muted">Ringkasan bisnis JelantahKu.</p>

    <AppAlert v-if="error" tone="error" class="mt-6">
      <p>{{ error }}</p>
      <AppButton variant="secondary" class="mt-3" @click="load"><RefreshCw class="size-4" aria-hidden="true" /> Coba lagi</AppButton>
    </AppAlert>

    <div v-else-if="loading" class="mt-8 grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Memuat ringkasan">
      <div v-for="n in 3" :key="n" class="card h-32 animate-pulse motion-reduce:animate-none bg-line/60"></div>
    </div>

    <template v-else-if="summary">
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Jelantah Terkumpul" :value="formatLiters(summary.collected.totalLiters)" hint="Kumulatif; belum dikurangi penjualan ke pabrik" :icon="Droplets" />
        <StatCard label="Total saldo dibayarkan" :value="formatRupiah(summary.payouts.cashPaid)" :icon="Wallet" tone="accent" />
        <StatCard label="Estimasi Margin Kotor" :value="formatRupiah(margin.estimatedMargin)" hint="Simulasi; belum termasuk biaya operasional dan nilai poin" :icon="TrendingUp" tone="neutral" />
      </div>
    </template>
  </div>
</template>
