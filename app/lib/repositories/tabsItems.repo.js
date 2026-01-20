// lib/repositories/tabItems.repo.js
export function createTabItemsRepo(supabase) {
  return {
    async listByTabId(tabId) {
      if (!tabId) return []

      const { data, error } = await supabase
        .from("tab_items")
        .select("*")
        .eq("tab_id", tabId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data ?? []
    },

    async addProductItem({ tab_id, product_id, qty = 1 }) {
      if (!tab_id) throw new Error("tabItemsRepo.addProductItem: tab_id requerido")
      if (!product_id) throw new Error("tabItemsRepo.addProductItem: product_id requerido")

      const { data, error } = await supabase
        .from("tab_items")
        .insert({
          tab_id,
          product_id,
          qty,
          name_snapshot: "", // triggers completan
          unit_price_snapshot: null, // triggers completan
        })
        .select("*")
        .single()

      if (error) throw error
      return data
    },

    async addManualItem({ tab_id, name_snapshot, unit_price_snapshot, qty = 1 }) {
      if (!tab_id) throw new Error("tabItemsRepo.addManualItem: tab_id requerido")
      if (!name_snapshot) throw new Error("tabItemsRepo.addManualItem: name_snapshot requerido")
      if (unit_price_snapshot == null || Number.isNaN(Number(unit_price_snapshot))) {
        throw new Error("tabItemsRepo.addManualItem: unit_price_snapshot inválido")
      }

      const { data, error } = await supabase
        .from("tab_items")
        .insert({
          tab_id,
          product_id: null,
          name_snapshot: String(name_snapshot).trim(),
          unit_price_snapshot: Number(unit_price_snapshot),
          qty,
        })
        .select("*")
        .single()

      if (error) throw error
      return data
    },

    async updateQty({ id, qty }) {
      if (!id) throw new Error("tabItemsRepo.updateQty: id requerido")
      if (!Number.isInteger(qty) || qty <= 0) throw new Error("tabItemsRepo.updateQty: qty inválido")

      const { data, error } = await supabase
        .from("tab_items")
        .update({ qty })
        .eq("id", id)
        .select("*")
        .single()

      if (error) throw error
      return data
    },

    async remove(id) {
      if (!id) throw new Error("tabItemsRepo.remove: id requerido")

      const { error } = await supabase.from("tab_items").delete().eq("id", id)
      if (error) throw error
      return true
    },
  }
}
