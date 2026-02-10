export function createMetodosPagoRepo(supabase) {
  return {
    async list() {
      const { data, error } = await supabase
        .from("metodos_pago")
        .select("*")
      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("metodos_pago")
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
