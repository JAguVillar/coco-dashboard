/**
 * useVentasListState
 * Global state management for ventas list
 *
 * This composable provides a centralized state for the ventas list
 * that can be shared across components. It delegates data fetching
 * to useVentas() but maintains its own global state.
 *
 * Note: This uses useState for SSR-compatible global state.
 * All data operations are delegated to useVentas composable.
 */
export const useVentasListState = () => {
  const rows = useState("ventas:rows", () => []);

  // Reuse the ventas composable instance (created once per component context)
  const { loadVentas, loading, error } = useVentas();

  /**
   * Refreshes the ventas list from the repository
   * @param {Object} params - Optional filter parameters (desde, hasta, search, page, pageSize)
   */
  const refresh = async (params = {}) => {
    try {
      const response = await loadVentas(params);
      rows.value = response?.data ?? [];
      return response;
    } catch (e) {
      // Error is already stored in useVentas().error
      // Re-throw so calling component can handle it
      throw e;
    }
  };

  /**
   * Replaces the entire rows array
   * @param {Array} list - New list of ventas
   */
  const setRows = (list) => {
    rows.value = Array.isArray(list) ? list : [];
  };

  /**
   * Adds or updates a venta in the list
   * @param {Object} venta - Venta object with id
   */
  const upsertRow = (venta) => {
    if (!venta?.id) return;

    const idx = rows.value.findIndex((v) => v.id === venta.id);
    if (idx === -1) {
      rows.value.unshift(venta); // Add to beginning
    } else {
      rows.value[idx] = { ...rows.value[idx], ...venta }; // Merge update
    }
  };

  /**
   * Removes a venta from the list
   * @param {number} id - Venta ID to remove
   */
  const removeRow = (id) => {
    rows.value = rows.value.filter((v) => v.id !== id);
  };

  // Return global state + operations
  // loading and error come from useVentas (no duplication)
  return {
    rows,
    loading,
    error,
    setRows,
    upsertRow,
    removeRow,
    refresh,
  };
};
