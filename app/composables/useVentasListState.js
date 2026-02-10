export const useVentasListState = () => {
  const rows = useState("ventas:rows", () => []);
  const loading = useState("ventas:loading", () => false);

 const refresh = async () => {
    const { loadVentas } = useVentas();
    loading.value = true;
    try {
      const response = await loadVentas();
      rows.value = response?.data ?? [];
    } finally {
      loading.value = false;
    }
  };

  const setRows = (list) => {
    rows.value = Array.isArray(list) ? list : [];
  };

  const upsertRow = (venta) => {
    if (!venta?.id) return;

    const idx = rows.value.findIndex((v) => v.id === venta.id);
    if (idx === -1) rows.value.unshift(venta);
    else rows.value[idx] = { ...rows.value[idx], ...venta };
  };

  const removeRow = (id) => {
    rows.value = rows.value.filter((v) => v.id !== id);
  };

  return { rows, loading, setRows, upsertRow, removeRow, refresh };
};
