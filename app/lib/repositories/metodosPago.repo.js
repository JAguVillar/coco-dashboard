export function createMetodosPagoRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let query = supabase
        .from("metodos_pago")
        .select("*", { count: "exact" });

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("metodos_pago")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("metodos_pago")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("metodos_pago")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
