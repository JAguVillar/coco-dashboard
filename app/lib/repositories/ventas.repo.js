export function createVentasRepo(supabase) {
  return {
    async list({ from, to, desde, hasta, search } = {}) {
      let query = supabase
        .from("ventas")
        .select(
          `
          *,
          clients ( id, full_name ),
          venta_estados(*),
          metodos_pago(*)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }

      if (desde) query = query.gte("created_at", desde);
      if (hasta) query = query.lte("created_at", hasta);
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(
          `
          numero_comprobante.ilike.${q},
          clients.full_name.ilike.${q}
        `
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async getVenta(id) {
      const { data, error } = await supabase
        .from("ventas")
        .select(
          `
          *,
          clients (
            id,
            full_name,
            phone
          ),
          profiles (
            id,
            full_name
          ),
          venta_items (
            *,
            articulos (
              id,
              nombre,
              codigo,
              unidad_medida
            )
          ),
          venta_estados(*),
          metodos_pago(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },

    async getItemsVenta(ventaId) {
      const { data, error } = await supabase
        .from("venta_items")
        .select(
          `
          *,
          articulos (
            id,
            nombre,
            codigo,
            unidad_medida,
            stock_actual
          )
        `
        )
        .eq("venta_id", ventaId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },

    async createVenta(payload) {
      const { data, error } = await supabase
        .from("ventas")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async addItem(payload) {
      const { data, error } = await supabase
        .from("venta_items")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deleteItem(itemId) {
      const { error } = await supabase
        .from("venta_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },

    async completeVenta(id, payload) {
      const { data, error } = await supabase
        .from("ventas")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async cancelVenta(id, motivo) {
      const { data, error } = await supabase
        .from("ventas")
        .update({
          estado: "cancelada",
          notas: motivo,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from("ventas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  };
}
