import { createClientsRepo } from "@/lib/repositories/clients.repo";

export function useClients() {
  const supabase = useSupabaseClient();
  const repo = createClientsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadClients() {
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

  async function createClient(payload) {
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

  return { loadClients, createClient, loading, error };
}
