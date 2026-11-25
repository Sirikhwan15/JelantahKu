<script setup>
import { onMounted, ref } from 'vue';
import { ClipboardCheck, RefreshCw, Truck } from 'lucide-vue-next';
import AppAlert from '@/components/ui/AppAlert.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StatCard from '@/components/shared/StatCard.vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const pending = ref(null);
const scheduled = ref(null);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [p, s] = await Promise.all([
      api.get('/courier/tasks?status=pending&limit=1'),
      api.get('/courier/tasks?status=scheduled&limit=1'),
    ]);
    pending.value = p.pagination.total;
    scheduled.value = s.pagination.total;
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
    <p class="mt-1 text-muted">Ringkasan tugas penjemputan dan penerimaan.</p>

    <AppAlert v-if="error" tone="error" class="mt-6">
      <p>{{ error }}</p>
      <AppButton variant="secondary" class="mt-3" @click="load"><RefreshCw class="size-4" aria-hidden="true" /> Coba lagi</AppButton>
    </AppAlert>

    <div v-else class="mt-8 grid gap-4 sm:grid-cols-2" :aria-busy="loading">
      <StatCard label="Tugas menunggu diambil" :value="loading ? '…' : String(pending)" :icon="ClipboardCheck" />
      <StatCard label="Tugas saya (terjadwal)" :value="loading ? '…' : String(scheduled)" :icon="Truck" tone="accent" />
    </div>
  </div>
</template>
