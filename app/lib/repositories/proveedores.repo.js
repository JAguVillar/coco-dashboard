export function createProveedoresRepo(supabase) {
  return {
    async list() {
      const { data, error } = await supabase
        .from("proveedores")
        .select("*")
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("proveedores")
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
