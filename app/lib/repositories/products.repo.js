export function createProductsRepo(supabase) {
  return {
    async list({ from, to, search } = {}) {
      let query = supabase.from("articulos").select("*", { count: "exact" });

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`nombre.ilike.${q}`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("articulos")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from("articulos")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("articulos")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
