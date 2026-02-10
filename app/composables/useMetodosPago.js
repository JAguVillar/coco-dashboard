import { createMetodosPagoRepo } from "@/lib/repositories/metodosPago.repo";

export function useMetodosPago() {
  const supabase = useSupabaseClient();
  const repo = createMetodosPagoRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadMetodosPago() {
    loading.value = true;
    error.value = null;
    try {
      const rows = await repo.list();
      return rows;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createMetodoPago(payload) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.create(payload);
      return row;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMetodoPago(id) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.delete(id);
      return row;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { loadMetodosPago, createMetodoPago, deleteMetodoPago, loading, error };
}
