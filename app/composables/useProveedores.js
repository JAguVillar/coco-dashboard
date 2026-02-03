import { createProveedoresRepo } from "@/lib/repositories/proveedores.repo";

export function useProveedores() {
  const supabase = useSupabaseClient();
  const repo = createProveedoresRepo(supabase);  

  const loading = ref(false);
  const error = ref(null);

  async function loadProveedores() {
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

  async function createProveedor(payload) {
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

  async function deleteProveedor(id) {
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

  return { loadProveedores, createProveedor, deleteProveedor, loading, error };
}
