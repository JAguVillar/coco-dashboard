export function createProveedoresRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let query = supabase
        .from("proveedores")
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
        .from("proveedores")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("proveedores")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("proveedores")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
