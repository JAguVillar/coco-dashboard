export function createCourtsRepo(supabase) {
    return {
      async list() {
        const { data, error } = await supabase
          .from("courts")
          .select("id, slug, name, color_main, color_container, color_on_container")
          .order("name")
          if (error) throw error;
        return data ?? [];
      },
  
      async create(payload) {
        const { data, error } = await supabase
          .from("courts")
          .insert(payload)
          .select("*")
          .single();
  
        if (error) throw error;
        return data;
      },
    };
  }
  