// composables/useVentas.js
export const useVentas = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // 1. Crear una nueva venta
  const crearVenta = async ({ cliente_id, metodo_pago, notas }) => {
    const normalizedClienteId =
    cliente_id == null
      ? null
      : typeof cliente_id === "object"
        ? (cliente_id.value ?? null)
        : cliente_id
    const { data, error } = await supabase
      .from('ventas')
      .insert({
      cliente_id: normalizedClienteId,
        vendedor_id: user.value?.id,
        metodo_pago,
        notas,
        estado: 'pendiente',
        subtotal: 0,
        descuento: 0,
        total: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // 2. Agregar item a la venta
  const agregarItem = async ({ venta_id, articulo_id, cantidad, precio_unitario, descuento = 0 }) => {
    const subtotal = cantidad * precio_unitario;
    const total = subtotal - descuento;

    const { data, error } = await supabase
      .from('venta_items')
      .insert({
        venta_id,
        articulo_id,
        cantidad,
        precio_unitario,
        subtotal,
        descuento,
        total,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // 3. Obtener items de una venta
  const getItemsVenta = async (venta_id) => {
    const { data, error } = await supabase
      .from('venta_items')
      .select(`
        *,
        articulos (
          id,
          nombre,
          codigo,
          unidad_medida,
          stock_actual
        )
      `)
      .eq('venta_id', venta_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  };

  // 4. Eliminar item de la venta
  const eliminarItem = async (item_id) => {
    const { error } = await supabase
      .from('venta_items')
      .delete()
      .eq('id', item_id);

    if (error) throw error;
  };

  // 5. Completar venta
  const completarVenta = async (venta_id, { metodo_pago, numero_comprobante, tipo_comprobante }) => {
    const { data, error } = await supabase
      .from('ventas')
      .update({
        estado: 'completada',
        metodo_pago,
        numero_comprobante,
        tipo_comprobante,
      })
      .eq('id', venta_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // 6. Cancelar venta (restaura stock automáticamente con el trigger)
  const cancelarVenta = async (venta_id, motivo) => {
    const { data, error } = await supabase
      .from('ventas')
      .update({
        estado: 'cancelada',
        notas: motivo,
      })
      .eq('id', venta_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // 7. Obtener venta con sus items
  const getVenta = async (venta_id) => {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        clients (
          id,
          full_name,
          phone
        ),
        profiles (
          id,
          full_name
        ),
        venta_items (
          *,
          articulos (
            id,
            nombre,
            codigo,
            unidad_medida
          )
        )
      `)
      .eq('id', venta_id)
      .single();

    if (error) throw error;
    return data;
  };

  // 8. Listar ventas
  const loadVentas = async ({ estado, desde, hasta, limit = 50 }) => {
    let query = supabase
      .from('ventas')
      .select(`
        *,
        clients (
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (desde) {
      query = query.gte('created_at', desde);
    }

    if (hasta) {
      query = query.lte('created_at', hasta);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  };

  return {
    crearVenta,
    agregarItem,
    getItemsVenta,
    eliminarItem,
    completarVenta,
    cancelarVenta,
    getVenta,
    loadVentas,
  };
};