export function createBookingsRepo(supabase) {
  return {
    async listByRange({ fromISO, toISO } = {}) {
      let query = supabase
        .from("turnos")
        .select(
          "id, title, start_at, end_at, court:courts ( id, slug, name ), booking_type:turnos_types ( id, slug, name, color, icon ), booking_state:turnos_states(id, name, icon, color), client:clients(*)"
        );

      // Solo aplicar filtros de fecha si se proporcionan
      if (fromISO) {
        query = query.gte("start_at", fromISO);
      }
      if (toISO) {
        query = query.lt("start_at", toISO);
      }

      const { data, error } = await query.order("start_at", {
        ascending: true,
      });

      if (error) throw error;
      return data ?? [];
    },

    async create(payload) {
      const { data, error } = await supabase
        .from("turnos")
        .insert(payload)
        .select(
          `
          id, title, start_at, end_at,
          court:courts ( id, slug, name ),
          booking_type:turnos_types ( id, slug, name, icon, color )
        `
        )
        .single();

      if (error) throw error;
      return data;
    },

    async createMany(payloads) {
      const { data, error } = await supabase
        .from("turnos")
        .insert(payloads)
        .select("id, series_id, start_at, end_at");

      if (error) throw error;
      return data ?? [];
    },

    async remove(id) {
      const { data, error } = await supabase
        .from("turnos")
        .delete()
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      return data;
    },
  };
}
