export function createCategoriasRepo(supabase) {
  return {
    async list() {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("categorias")
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
        .from("categorias")
        .delete()
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      return data;
    },
  };
}
