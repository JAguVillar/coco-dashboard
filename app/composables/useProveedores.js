import { createProveedoresRepo } from "@/lib/repositories/proveedores.repo";

export function useProveedores() {
  const supabase = useSupabaseClient();
  const repo = createProveedoresRepo(supabase);  

  const loading = ref(false);
  const error = ref(null);

  async function loadProveedores({ page = 1, pageSize = 10 } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await repo.list({ from, to });
      
      return {
        data: data ?? [],
        count: count ?? 0,
        page,
        pageSize,
      };
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

  async function updateProveedor(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      const row = await repo.update(id, payload);
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

  return { loadProveedores, createProveedor, updateProveedor, deleteProveedor, loading, error };
}
