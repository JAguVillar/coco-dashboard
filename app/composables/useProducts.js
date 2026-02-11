import { createProductsRepo } from "@/lib/repositories/products.repo";

export function useProducts() {
  const supabase = useSupabaseClient();
  const repo = createProductsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadProducts({ page = 1, pageSize = 10, search } = {}) {
    console.log("search", search);
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await repo.list({ from, to, search });
      
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

  async function updateProduct(id, payload) {
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

  return { loadProducts, createProduct, updateProduct, deleteProduct, loading, error };
}
