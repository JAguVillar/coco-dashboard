import { createProductsRepo } from "@/lib/repositories/products.repo";

export function useProducts() {
  const supabase = useSupabaseClient();
  const repo = createProductsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadProducts() {
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

  async function createProduct(payload) {
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

  async function deleteProduct(id) {
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

  return { loadProducts, createProduct, deleteProduct, loading, error };
}
