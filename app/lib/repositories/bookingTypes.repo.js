export function createBookingsTypesRepo(supabase) {
    return {
      async list() {
        const { data, error } = await supabase
          .from("turnos_types")
          .select("*")
          .order("name");
        if (error) throw error;
        return data ?? [];
      },
  
      async create(payload) {
        const { data, error } = await supabase
          .from("turnos_types")
          .insert(payload)
          .select("*")
          .single();
  
        if (error) throw error;
        return data;
      },
    };
  }
  