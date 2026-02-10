/**
 * Ventas Service Layer
 * Contains business logic for ventas (sales) operations
 */

/**
 * Normalizes cliente_id to handle different input types
 * @param {any} cliente_id - Can be null, an object with a value property, or a primitive
 * @returns {number|null} - Normalized cliente ID
 */
export function normalizeClienteId(cliente_id) {
  if (cliente_id == null) return null;
  if (typeof cliente_id === "object") return cliente_id.value ?? null;
  return cliente_id;
}

/**
 * Creates a new venta payload with default values
 * @param {Object} params - Venta parameters
 * @param {number|null} params.cliente_id - Client ID (normalized)
 * @param {string} params.vendedor_id - Seller/user ID
 * @param {string} [params.notas] - Optional notes
 * @returns {Object} - Venta payload ready for repository
 */
export function createVentaPayload({ cliente_id, vendedor_id, notas }) {
  return {
    cliente_id,
    vendedor_id,
    notas,
    subtotal: 0,
    descuento: 0,
    total: 0,
  };
}

/**
 * Calculates venta item totals
 * @param {Object} params - Item parameters
 * @param {number} params.cantidad - Quantity
 * @param {number} params.precio_unitario - Unit price
 * @param {number} [params.descuento=0] - Discount amount
 * @returns {Object} - Calculated subtotal and total
 */
export function calculateItemTotals({ cantidad, precio_unitario, descuento = 0 }) {
  const subtotal = cantidad * precio_unitario;
  const total = subtotal - descuento;
  return { subtotal, total };
}

/**
 * Creates a venta item payload with calculated totals
 * @param {Object} params - Item parameters
 * @param {number} params.venta_id - Venta ID
 * @param {number} params.articulo_id - Product ID
 * @param {number} params.cantidad - Quantity
 * @param {number} params.precio_unitario - Unit price
 * @param {number} [params.descuento=0] - Discount amount
 * @returns {Object} - Item payload ready for repository
 */
export function createVentaItemPayload({
  venta_id,
  articulo_id,
  cantidad,
  precio_unitario,
  descuento = 0,
}) {
  const { subtotal, total } = calculateItemTotals({ cantidad, precio_unitario, descuento });

  return {
    venta_id,
    articulo_id,
    cantidad,
    precio_unitario,
    subtotal,
    descuento,
    total,
  };
}

/**
 * Creates a complete venta payload for completion
 * @param {Object} params - Completion parameters
 * @param {number} params.metodo_pago_id - Payment method ID
 * @param {string} params.numero_comprobante - Receipt/invoice number
 * @param {string} params.tipo_comprobante - Receipt/invoice type
 * @returns {Object} - Completion payload ready for repository
 */
export function createCompleteVentaPayload({ metodo_pago_id, numero_comprobante, tipo_comprobante }) {
  return {
    metodo_pago_id,
    numero_comprobante,
    tipo_comprobante,
  };
}
