import { createTabsRepo } from "@/lib/repositories/tabs.repo"
import { createTabItemsRepo } from "@/lib/repositories/tabsItems.repo"

export function useTabs() {
  const supabase = useSupabaseClient()
  const tabsRepo = createTabsRepo(supabase)
  const itemsRepo = createTabItemsRepo(supabase)

  const loading = ref(false)
  const error = ref(null)

  async function getTabByTurnoId(turnoId) {
    loading.value = true
    error.value = null
    try {
      return await tabsRepo.getByTurnoId(turnoId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTabForTurno({ turnoId, clientId = null, notes = null }) {
    loading.value = true
    error.value = null
    try {
      return await tabsRepo.create({
        turno_id: turnoId,
        client_id: clientId,
        notes,
      })
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  // ✅ recomendado con índice único uniq_tabs_turno_id
  async function getOrCreateTabForTurno({ turnoId, clientId = null, notes = null }) {
    loading.value = true
    error.value = null
    try {
      const existing = await tabsRepo.getByTurnoId(turnoId)
      if (existing) return existing

      try {
        return await tabsRepo.create({
          turno_id: turnoId,
          client_id: clientId,
          notes,
        })
      } catch (e) {
        // race condition: unique violation
        const msg = String(e?.message || e)
        const code = e?.code
        if (code === "23505" || msg.toLowerCase().includes("duplicate")) {
          return await tabsRepo.getByTurnoId(turnoId)
        }
        throw e
      }
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function loadTabBundleByTurnoId(turnoId) {
    loading.value = true
    error.value = null
    try {
      const tab = await tabsRepo.getByTurnoId(turnoId)
      if (!tab) return { tab: null, items: [] }

      const items = await itemsRepo.listByTabId(tab.id)
      return { tab, items }
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function listItems(tabId) {
    loading.value = true
    error.value = null
    try {
      return await itemsRepo.listByTabId(tabId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addProductItem({ tabId, productId, qty = 1 }) {
    loading.value = true
    error.value = null
    try {
      return await itemsRepo.addProductItem({
        tab_id: tabId,
        product_id: productId,
        qty,
      })
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addManualItem({ tabId, name, unitPrice, qty = 1 }) {
    loading.value = true
    error.value = null
    try {
      return await itemsRepo.addManualItem({
        tab_id: tabId,
        name_snapshot: name,
        unit_price_snapshot: unitPrice,
        qty,
      })
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateItemQty({ itemId, qty }) {
    loading.value = true
    error.value = null
    try {
      return await itemsRepo.updateQty({ id: itemId, qty })
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeItem(itemId) {
    loading.value = true
    error.value = null
    try {
      return await itemsRepo.remove(itemId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refreshTab(tabId) {
    loading.value = true
    error.value = null
    try {
      return await tabsRepo.getById(tabId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function closeTab(tabId) {
    loading.value = true
    error.value = null
    try {
      return await tabsRepo.close(tabId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelTab(tabId) {
    loading.value = true
    error.value = null
    try {
      return await tabsRepo.cancel(tabId)
    } catch (e) {
      error.value = e
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    loading,
    error,

    // tabs
    getTabByTurnoId,
    createTabForTurno,
    getOrCreateTabForTurno,
    loadTabBundleByTurnoId,
    refreshTab,
    closeTab,
    cancelTab,

    // items
    listItems,
    addProductItem,
    addManualItem,
    updateItemQty,
    removeItem,
  }
}
