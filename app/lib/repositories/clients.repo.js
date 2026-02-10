export function createClientsRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("full_name");

      if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("clients")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        // unique violation (phone ya existe)
        if (error.code === "23505") {
          const e = new Error("Ya existe un cliente con ese teléfono.");
          e.code = "CLIENT_PHONE_EXISTS";
          throw e;
        }
        throw error;
      }

      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
