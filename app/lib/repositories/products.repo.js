export function createProductsRepo(supabase) {
  return {
    async list() {
      const { data, error } = await supabase
        .from("articulos")
        .select("*")
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("articulos")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
  
        throw error;
      }

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
