import { reactive, ref } from 'vue';

/** Menyimpan galat per field + pesan umum, termasuk pemetaan dari galat validasi server. */
export function useFormErrors() {
  const fields = reactive({});
  const general = ref('');

  function clear(field) {
    if (field) delete fields[field];
    else {
      Object.keys(fields).forEach((k) => delete fields[k]);
      general.value = '';
    }
  }

  function set(field, message) {
    fields[field] = message;
  }

  function fromApiError(err) {
    clear();
    if (err?.details?.length) {
      err.details.forEach((d) => {
        if (!fields[d.field]) fields[d.field] = d.message;
      });
      general.value = 'Periksa kembali isian yang ditandai.';
    } else {
      general.value = err?.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  const hasErrors = () => Object.keys(fields).length > 0;

  return { fields, general, clear, set, fromApiError, hasErrors };
}
