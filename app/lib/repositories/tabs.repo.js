// lib/repositories/tabs.repo.js
export function createTabsRepo(supabase) {
  return {
    async getByTurnoId(turnoId) {
      if (!turnoId) return null

      const { data, error } = await supabase
        .from("tabs")
        .select("*")
        .eq("turno_id", turnoId)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },

    async getById(id) {
      if (!id) return null

      const { data, error } = await supabase
        .from("tabs")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },

    async create({ turno_id, client_id = null, notes = null }) {
      if (!turno_id) throw new Error("tabsRepo.create: turno_id requerido")

      const { data, error } = await supabase
        .from("tabs")
        .insert({
          turno_id,
          client_id,
          status: "open",
          notes,
        })
        .select("*")
        .single()

      if (error) throw error
      return data
    },

    async close(id) {
      if (!id) throw new Error("tabsRepo.close: id requerido")

      const { data, error } = await supabase
        .from("tabs")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single()

      if (error) throw error
      return data
    },

    async cancel(id) {
      if (!id) throw new Error("tabsRepo.cancel: id requerido")

      const { data, error } = await supabase
        .from("tabs")
        .update({
          status: "cancelled",
        })
        .eq("id", id)
        .select("*")
        .single()

      if (error) throw error
      return data
    },
  }
}
