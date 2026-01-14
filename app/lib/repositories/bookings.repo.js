export function createBookingsRepo(supabase) {
  return {
    async listByRange({ fromISO, toISO }) {
      const { data, error } = await supabase
        .from("turnos")
        .select(
          "id, title, start_at, end_at, court:courts ( id, slug, name ), booking_type:turnos_types ( id, slug, name, color, icon )"
        )
        .gte("start_at", fromISO)
        .lt("start_at", toISO)
        .order("start_at", { ascending: true });

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
  };
}
