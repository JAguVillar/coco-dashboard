import { createVentasRepo } from "@/lib/repositories/ventas.repo";

export function useVentas() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const repo = createVentasRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  // 1. Crear una nueva venta
  async function createVenta({ cliente_id, metodo_pago, notas }) {
    loading.value = true;
    error.value = null;
    try {
      // Normalizar cliente_id
      const normalizedClienteId =
        cliente_id == null
          ? null
          : typeof cliente_id === "object"
            ? (cliente_id.value ?? null)
            : cliente_id;

      const payload = {
        cliente_id: normalizedClienteId,
        vendedor_id: user.value?.id,
        notas,
        subtotal: 0,
        descuento: 0,
        total: 0,
      };

      const data = await repo.createVenta(payload);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 2. Agregar item a la venta
  async function addItem({ venta_id, articulo_id, cantidad, precio_unitario, descuento = 0 }) {
    loading.value = true;
    error.value = null;
    try {
      const subtotal = cantidad * precio_unitario;
      const total = subtotal - descuento;

      const payload = {
        venta_id,
        articulo_id,
        cantidad,
        precio_unitario,
        subtotal,
        descuento,
        total,
      };

      const data = await repo.addItem(payload);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 3. Obtener items de una venta
  async function getItemsVenta(venta_id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.getItemsVenta(venta_id);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 4. Eliminar item de la venta
  async function deleteItem(item_id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.deleteItem(item_id);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 5. Completar venta
  async function completeVenta(venta_id, { metodo_pago_id, numero_comprobante, tipo_comprobante }) {
    loading.value = true;
    error.value = null;
    try {
      const payload = {
        metodo_pago_id,
        numero_comprobante,
        tipo_comprobante,
      };

      const data = await repo.completeVenta(venta_id, payload);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 6. Cancelar venta (restaura stock automáticamente con el trigger)
  async function cancelVenta(venta_id, motivo) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.cancelVenta(venta_id, motivo);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 7. Obtener venta con sus items
  async function getVenta(venta_id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.getVenta(venta_id);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 8. Listar ventas
  async function loadVentas({ desde, hasta, search, page = 1, pageSize = 10 } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await repo.list({ from, to, desde, hasta, search });

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

  // 9. Actualizar venta
  async function updateVenta(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.updateVenta(id, payload);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 10. Eliminar venta
  async function deleteVenta(id) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.delete(id);
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    createVenta,
    addItem,
    getItemsVenta,
    deleteItem,
    completeVenta,
    cancelVenta,
    getVenta,
    loadVentas,
    updateVenta,
    deleteVenta,
    loading,
    error,
  };
}