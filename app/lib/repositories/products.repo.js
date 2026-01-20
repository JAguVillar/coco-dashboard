export function createProductsRepo(supabase) {
  return {
    async list() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("products")
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
        .from("products")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
