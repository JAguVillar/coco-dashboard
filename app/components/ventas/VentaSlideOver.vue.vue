<!-- components/ventas/VentaSlideover.vue -->
<script setup>
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);
const { refresh } = useVentasListState();

const {
  createVenta,
  addItem: addItemToVenta,
  getVenta,
  completeVenta,
  cancelVenta,
} = useVentas();
const { loadClients } = useClients();
const { loadProducts } = useProducts();
const { loadMetodosPago } = useMetodosPago();

const toast = useToast();

// ----------------------
// Stepper
// ----------------------
const activeStep = ref(0);
const stepItems = [
  {
    title: "Cliente",
    icon: "i-lucide-user",
    value: 0,
  },
  {
    title: "Venta",
    icon: "i-lucide-shopping-cart",
    value: 1,
  },
  {
    title: "Checkout",
    icon: "i-lucide-credit-card",
    value: 2,
  },
];

// ----------------------
// Estado
// ----------------------
const ventaActual = ref(null);
const items = ref([]);
const clientes = ref([]);
const articulos = ref([]);
const metodosPago = ref([]);
const loading = ref(false);
const submitting = ref(false);

// Cliente
const clienteSeleccionado = ref(null);
const iniciandoVenta = ref(false);
const clienteSearch = ref("");

// Nuevo item
const nuevoItem = reactive({
  articulo_id: null,
  cantidad: 1,
  descuento: 0,
});
const articuloSearch = ref("");

// Checkout
const metodoPagoSeleccionado = ref(null); // ideal: FK id
const numeroComprobante = ref(null);
const tipoComprobante = ref("ticket");

// Placeholder (cambiá por tu carga real desde BD)
const metodosPagoItems = computed(() =>
  metodosPago.value.map((c) => ({
    label: c.nombre,
    value: c.id,
  })),
);

// ----------------------
// Helpers
// ----------------------
const pickId = (v) => {
  if (v == null) return null;
  if (typeof v === "object") return v.value ?? v.id ?? null;
  return v;
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ----------------------
// Computed base
// ----------------------
const articulosDisponibles = computed(() =>
  articulos.value.filter((a) => a.stock_actual > 0 && a.activo),
);

const articulosItems = computed(() =>
  articulosDisponibles.value.map((a) => ({
    label: `${a.nombre}`,
    subtitle: `$${a.precio_venta_por_unidad} - Stock: ${a.stock_actual} ${a.unidad_medida}`,
    value: a.id,
  })),
);

const clientesItems = computed(() => [
  { label: "Sin cliente / Mostrador", value: null },
  ...clientes.value.map((c) => ({
    label: c.full_name,
    value: c.id,
  })),
]);

const articuloIdSeleccionado = computed(() => pickId(nuevoItem.articulo_id));

const articuloSeleccionado = computed(() => {
  const id = articuloIdSeleccionado.value;
  if (!id) return null;
  return articulos.value.find((a) => a.id === id) ?? null;
});

const descuentoNumerico = computed(() => toNumber(nuevoItem.descuento, 0));

// ----------------------
// Fraccionables (UI ENTEROS)
// ----------------------
const esFraccionable = computed(
  () => !!articuloSeleccionado.value?.es_fraccionable,
);
const unidadBase = computed(
  () => articuloSeleccionado.value?.unidad_medida ?? "unidad",
);

const usaGramosUI = computed(
  () => esFraccionable.value && unidadBase.value === "kg",
);

const GR_STEP = 50;

watch(
  () => articuloSeleccionado.value,
  (a) => {
    if (!a) return;

    if (!a.es_fraccionable) {
      nuevoItem.cantidad = 1;
    } else if (a.unidad_medida === "kg") {
      nuevoItem.cantidad = 100;
    } else {
      nuevoItem.cantidad = 1;
    }

    nuevoItem.descuento = 0;
  },
);

const cantidadIngresada = computed(() => toNumber(nuevoItem.cantidad, 0));

const cantidadUI = computed(() => {
  if (!articuloSeleccionado.value) return cantidadIngresada.value;

  if (!esFraccionable.value)
    return Math.max(0, Math.floor(cantidadIngresada.value));
  if (usaGramosUI.value)
    return Math.max(0, Math.floor(cantidadIngresada.value));

  return Math.max(0, cantidadIngresada.value);
});

const cantidadBase = computed(() => {
  if (!articuloSeleccionado.value) return 0;
  if (!esFraccionable.value) return cantidadUI.value;
  if (usaGramosUI.value) return cantidadUI.value / 1000;
  return cantidadUI.value;
});

const cantidadLabel = computed(() => {
  if (!articuloSeleccionado.value) return "Cantidad";
  if (!esFraccionable.value) return "Unidades";
  if (usaGramosUI.value) return "Cantidad (gr)";
  return `Cantidad (${unidadBase.value})`;
});

const cantidadStep = computed(() => {
  if (!articuloSeleccionado.value) return 1;
  if (!esFraccionable.value) return 1;
  if (usaGramosUI.value) return GR_STEP;
  return 0.001;
});

const cantidadMin = computed(() => {
  if (!articuloSeleccionado.value) return 1;
  if (!esFraccionable.value) return 1;
  if (usaGramosUI.value) return GR_STEP;
  return 0.001;
});

const sumarCantidad = (delta) => {
  const curr = toNumber(nuevoItem.cantidad, 0);
  nuevoItem.cantidad = Math.max(0, curr + delta);
};

const restarCantidad = (delta) => {
  const curr = toNumber(nuevoItem.cantidad, 0);
  nuevoItem.cantidad = Math.max(0, curr - delta);
};

const precioUnitario = computed(
  () => Number(articuloSeleccionado.value?.precio_venta_por_unidad) || 0,
);

const subtotalNuevoItem = computed(() => {
  if (!articuloSeleccionado.value) return 0;
  return cantidadBase.value * precioUnitario.value;
});

const totalNuevoItem = computed(() => {
  return Math.max(0, subtotalNuevoItem.value - descuentoNumerico.value);
});

const stockBase = computed(
  () => Number(articuloSeleccionado.value?.stock_actual) || 0,
);

const stockDisplay = computed(() => {
  if (!articuloSeleccionado.value) return "";

  if (!esFraccionable.value) return `${stockBase.value} ${unidadBase.value}`;
  if (usaGramosUI.value) return `${Math.floor(stockBase.value * 1000)} gr`;

  return `${stockBase.value.toFixed(3)} ${unidadBase.value}`;
});

// ----------------------
// Totales live
// ----------------------
const totalItemsLocal = computed(() => {
  return items.value.reduce((acc, it) => {
    const cantidad = Number(it.cantidad) || 0;
    const precio = Number(it.precio_unitario) || 0;
    const descuento = Number(it.descuento) || 0;

    const subtotal = cantidad * precio;
    const total =
      it.total != null ? Number(it.total) : Math.max(0, subtotal - descuento);

    return acc + (Number.isFinite(total) ? total : 0);
  }, 0);
});

const totalMostrar = computed(() => totalItemsLocal.value);

// ----------------------
// Métodos
// ----------------------
const iniciarVenta = async () => {
  if (iniciandoVenta.value) return;
  iniciandoVenta.value = true;

  const clienteId = pickId(clienteSeleccionado.value);

  try {
    const venta = await createVenta({
      cliente_id: clienteId,
      notas: null,
    });

    // si querés “real load” con relaciones/trigger:
    const fresh = await getVenta(venta.id);

    ventaActual.value = fresh;
    items.value = Array.isArray(fresh?.items) ? fresh.items : [];

    await refresh();

    // Paso 2: Venta
    activeStep.value = 1;

    toast.add({ title: "Venta iniciada", color: "success" });
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error",
      description: "No se pudo crear la venta",
      color: "error",
    });
  } finally {
    iniciandoVenta.value = false;
  }
};

const cargarVenta = async () => {
  if (!ventaActual.value) return;
  const venta = await getVenta(ventaActual.value.id);
  ventaActual.value = venta;
  if (Array.isArray(venta?.items)) items.value = venta.items;
};

const addItem = async () => {
  if (!ventaActual.value || submitting.value) return;

  const articuloId = articuloIdSeleccionado.value;
  const cantidad = cantidadBase.value;
  const descuento = descuentoNumerico.value;

  if (!articuloId || !cantidad || cantidad <= 0) return;

  submitting.value = true;

  try {
    const articulo = articuloSeleccionado.value;

    if (!articulo) {
      toast.add({
        title: "Producto inválido",
        description: "Volvé a seleccionar el producto",
        color: "error",
      });
      return;
    }

    if (articulo.stock_actual < cantidad) {
      toast.add({
        title: "Stock insuficiente",
        description: `Solo hay ${stockDisplay.value} disponibles`,
        color: "error",
      });
      return;
    }

    const itemCreado = await addItemToVenta({
      venta_id: ventaActual.value.id,
      articulo_id: articuloId,
      cantidad,
      precio_unitario: precioUnitario.value,
      descuento,
    });

    items.value.push({
      ...itemCreado,
      articulos: itemCreado?.articulos ?? articulo,
    });

    await cargarVenta();

    const idx = articulos.value.findIndex((a) => a.id === articulo.id);
    if (idx !== -1) articulos.value[idx].stock_actual -= cantidad;

    nuevoItem.articulo_id = null;
    nuevoItem.cantidad = 1;
    nuevoItem.descuento = 0;

    toast.add({ title: "Item agregado", color: "success" });
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error",
      description: error?.message || "No se pudo agregar el item",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const irACheckout = () => {
  if (!ventaActual.value) return;
  if (items.value.length === 0) {
    toast.add({
      title: "Venta vacía",
      description: "Agregá al menos un item",
      color: "error",
    });
    return;
  }
  activeStep.value = 2;
};

const volverAVenta = () => {
  activeStep.value = 1;
};

const finalizarVenta = async () => {
  if (!ventaActual.value || submitting.value) return;

  if (items.value.length === 0) {
    toast.add({
      title: "Venta vacía",
      description: "Agregá al menos un item",
      color: "error",
    });
    return;
  }

  if (!metodoPagoSeleccionado.value) {
    toast.add({
      title: "Falta método de pago",
      description: "Seleccioná un método de pago para completar",
      color: "error",
    });
    return;
  }

  submitting.value = true;

  try {
    // ✅ acá NO mandamos estado (lo maneja trigger)
    await completeVenta(ventaActual.value.id, {
      metodo_pago_id: metodoPagoSeleccionado.value.value,
      numero_comprobante: numeroComprobante.value,
      tipo_comprobante: tipoComprobante.value,
    });

    const fresh = await getVenta(ventaActual.value.id);
    ventaActual.value = fresh;

    await refresh();

    toast.add({
      title: "Venta completada",
      description: `Total: $${totalMostrar.value.toFixed(2)}`,
      color: "success",
    });

    emit("created", ventaActual.value);
    emit("close");
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error",
      description: "No se pudo completar la venta",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const cancelar = async () => {
  if (!ventaActual.value) {
    emit("close");
    return;
  }

  if (items.value.length > 0) {
    if (!confirm("¿Cancelar la venta? Se restaurará el stock.")) return;
  }

  try {
    if (items.value.length > 0) {
      await cancelVenta(ventaActual.value.id);
      toast.add({
        title: "Venta cancelada",
        description: "Se restauró el stock",
        color: "warning",
      });
      await refresh();
    }
  } catch (error) {
    console.error(error);
  } finally {
    emit("close");
  }
};

// Init
onMounted(async () => {
  loading.value = true;
  try {
    const clientesData = await loadClients?.();
    clientes.value = clientesData ?? [];

    const articulosData = await loadProducts?.();
    articulos.value = articulosData ?? [];

    const metodosPagoData = await loadMetodosPago?.();
    metodosPago.value = metodosPagoData ?? [];
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
    >
      <h2 class="text-lg font-semibold">Nueva venta</h2>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        :disabled="submitting"
        @click="cancelar"
      />
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
    </div>

    <template v-else>
      <!-- Stepper -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <UStepper
          v-model="activeStep"
          :items="stepItems"
          class="w-full"
          size="md"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- STEP 1: Cliente -->
        <div v-if="activeStep === 0" class="space-y-6">
          <div
            class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/30 space-y-3"
          >
            <div class="space-y-1">
              <p class="text-sm font-medium">
                Cliente <span class="text-gray-400">(opcional)</span>
              </p>
              <p class="text-xs text-gray-500">
                Si no seleccionás uno, se tomará como venta de mostrador
              </p>
            </div>

            <USelectMenu
              v-model="clienteSeleccionado"
              :items="clientesItems"
              value-attribute="value"
              option-attribute="label"
              searchable
              :search-attributes="['label']"
              placeholder="Seleccioná un cliente"
              class="w-full"
            >
              <template #search>
                <UInput
                  v-model="clienteSearch"
                  placeholder="Buscar cliente..."
                  class="w-full"
                />
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- STEP 2: Venta -->
        <div v-else-if="activeStep === 1" class="space-y-4">
          <!-- Info cliente y total -->
          <div
            class="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg space-y-2"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
                <p class="font-medium">
                  {{ ventaActual?.clients?.full_name || "Mostrador" }}
                </p>
              </div>
              <UBadge color="orange" size="xs">Pendiente</UBadge>
            </div>
            <div
              class="text-right pt-2 border-t border-primary-100 dark:border-primary-900"
            >
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p
                class="text-3xl font-bold text-primary-600 dark:text-primary-400"
              >
                ${{ totalMostrar.toFixed(2) }}
              </p>
            </div>
          </div>

          <!-- Form agregar producto (tu UI tal cual) -->
          <div class="space-y-3">
            <h3 class="font-medium text-sm">Agregar producto</h3>

            <UFormField label="Producto" name="articulo_id">
              <USelectMenu
                v-model="nuevoItem.articulo_id"
                :items="articulosItems"
                value-attribute="value"
                option-attribute="label"
                searchable
                :search-attributes="['label']"
                placeholder="Buscar..."
                class="w-full"
              >
                <template #search>
                  <UInput
                    v-model="articuloSearch"
                    placeholder="Buscar articulo..."
                    class="w-full"
                  />
                </template>
              </USelectMenu>
            </UFormField>

            <div v-if="articuloSeleccionado" class="space-y-4">
              <!-- Card info producto -->
              <div
                class="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 space-y-0.5">
                    <p class="text-sm font-medium truncate">
                      {{ articuloSeleccionado.nombre }}
                    </p>
                    <p class="text-xs text-gray-500">
                      Precio: ${{ precioUnitario.toFixed(2) }} /
                      {{ unidadBase }}
                    </p>
                    <p class="text-xs text-gray-500">
                      Stock: {{ stockDisplay }}
                    </p>
                  </div>

                  <UBadge color="neutral" variant="outline" size="md">
                    {{ usaGramosUI ? "gr" : unidadBase }}
                  </UBadge>
                </div>

                <div
                  class="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between text-xs text-gray-500"
                >
                  <span>Subtotal</span>
                  <span class="font-medium text-gray-700 dark:text-gray-200">
                    ${{ subtotalNuevoItem.toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- Inputs -->
              <div class="grid grid-cols-2 gap-4">
                <UFormField :label="cantidadLabel" name="cantidad">
                  <UInput
                    clearable
                    v-model.number="nuevoItem.cantidad"
                    type="number"
                    :step="cantidadStep"
                    :min="cantidadMin"
                    :disabled="!articuloIdSeleccionado"
                    class="w-full"
                    :icon="nuevoItem.cantidad > 0 ? 'i-lucide-circle-x' : ''"
                    aria-label="Clear input"
                    @click="nuevoItem.cantidad = 0"
                  />
                </UFormField>

                <UFormField label="Descuento" name="descuento">
                  <UInput
                    v-model.number="nuevoItem.descuento"
                    type="number"
                    step="0.01"
                    min="0"
                    :disabled="!articuloIdSeleccionado"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <!-- Ajustes rápidos -->
              <div v-if="usaGramosUI" class="space-y-1">
                <p class="text-xs text-gray-500">Ajustes rápidos</p>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    @click="restarCantidad(100)"
                    :disabled="nuevoItem.cantidad <= cantidadMin"
                  >
                    -100
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    @click="restarCantidad(50)"
                    :disabled="nuevoItem.cantidad <= cantidadMin"
                  >
                    -50
                  </UButton>

                  <UButton
                    size="sm"
                    variant="soft"
                    color="neutral"
                    @click="sumarCantidad(50)"
                  >
                    +50
                  </UButton>
                  <UButton
                    size="sm"
                    variant="soft"
                    color="neutral"
                    @click="sumarCantidad(100)"
                  >
                    +100
                  </UButton>

                  <UButton
                    size="sm"
                    variant="outline"
                    color="neutral"
                    @click="sumarCantidad(250)"
                  >
                    +250
                  </UButton>
                  <UButton
                    size="sm"
                    variant="outline"
                    color="neutral"
                    @click="sumarCantidad(500)"
                  >
                    +500
                  </UButton>
                  <UButton
                    size="sm"
                    variant="outline"
                    color="neutral"
                    @click="sumarCantidad(1000)"
                  >
                    +1000
                  </UButton>
                </div>
              </div>

              <div class="flex justify-between items-center pt-1">
                <span class="text-sm text-gray-500">Total item</span>
                <span class="text-lg font-semibold">
                  ${{ totalNuevoItem.toFixed(2) }}
                </span>
              </div>

              <UButton
                @click="addItem"
                :disabled="!articuloIdSeleccionado || cantidadBase <= 0"
                :loading="submitting"
                block
                size="lg"
                icon="i-lucide-plus"
              >
                Agregar (${{ totalNuevoItem.toFixed(2) }})
              </UButton>
            </div>
          </div>

          <!-- Lista de items -->
          <div class="space-y-2">
            <h3 class="font-medium text-sm">Items ({{ items.length }})</h3>

            <div
              v-if="items.length === 0"
              class="text-center py-8 text-gray-400"
            >
              <UIcon
                name="i-lucide-shopping-cart"
                class="w-12 h-12 mx-auto mb-2 opacity-50"
              />
              <p class="text-sm">Sin productos</p>
            </div>

            <div
              v-for="item in items"
              :key="item.id"
              class="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div class="flex justify-between items-start mb-1">
                <p class="font-medium text-sm">
                  {{ item.articulos?.nombre ?? "Producto" }}
                </p>
                <p class="font-bold">
                  ${{
                    (
                      item.total ??
                      item.cantidad * item.precio_unitario -
                        (item.descuento || 0)
                    ).toFixed(2)
                  }}
                </p>
              </div>
              <p class="text-xs text-gray-500">
                {{ item.cantidad }}
                {{ item.articulos?.unidad_medida ?? "" }}
                × ${{ Number(item.precio_unitario || 0).toFixed(2) }}
                <span v-if="item.descuento > 0" class="text-orange-500">
                  (-${{ Number(item.descuento || 0).toFixed(2) }})
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- STEP 3: Checkout -->
        <div v-else class="space-y-4">
          <div
            class="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-gray-500">Cliente</p>
                <p class="font-medium">
                  {{ ventaActual?.clients?.full_name || "Mostrador" }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Total</p>
                <p class="text-2xl font-bold">${{ totalMostrar.toFixed(2) }}</p>
              </div>
            </div>

            <div
              class="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2"
            >
              <p class="text-sm font-medium">Resumen</p>

              <div class="space-y-2">
                <div
                  v-for="it in items"
                  :key="it.id"
                  class="flex justify-between text-sm"
                >
                  <span class="text-gray-600 dark:text-gray-300 truncate pr-2">
                    {{ it.articulos?.nombre ?? "Producto" }}
                    <span class="text-xs text-gray-500">
                      ({{ it.cantidad }}
                      {{ it.articulos?.unidad_medida ?? "" }})
                    </span>
                  </span>
                  <span class="font-medium">
                    ${{
                      Number(
                        it.total ??
                          it.cantidad * it.precio_unitario -
                            (it.descuento || 0),
                      ).toFixed(2)
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <UFormField label="Método de pago" name="metodo_pago">
            <USelectMenu
              v-model="metodoPagoSeleccionado"
              :items="metodosPagoItems"
              value-attribute="value"
              option-attribute="label"
              placeholder="Seleccioná un método"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Tipo comprobante" name="tipo_comprobante">
              <USelectMenu
                v-model="tipoComprobante"
                :items="[
                  { label: 'Ticket', value: 'ticket' },
                  { label: 'Factura', value: 'factura' },
                ]"
                value-attribute="value"
                option-attribute="label"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="N° comprobante (opcional)"
              name="numero_comprobante"
            >
              <UInput
                v-model="numeroComprobante"
                class="w-full"
                placeholder="Ej: 0001-000123"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <!-- Step 0 -->
        <template v-if="activeStep === 0">
          <UButton
            @click="iniciarVenta"
            :loading="iniciandoVenta"
            block
            size="lg"
          >
            Iniciar venta
          </UButton>

          <UButton
            variant="outline"
            color="neutral"
            :disabled="submitting || iniciandoVenta"
            @click="cancelar"
            block
          >
            Cancelar
          </UButton>
        </template>

        <!-- Step 1 -->
        <template v-else-if="activeStep === 1">
          <UButton
            color="primary"
            :disabled="items.length === 0"
            :loading="submitting"
            @click="irACheckout"
            block
            size="lg"
          >
            Ir a checkout
          </UButton>

          <UButton
            variant="outline"
            color="neutral"
            :disabled="submitting"
            @click="cancelar"
            block
          >
            Cancelar
          </UButton>
        </template>

        <!-- Step 2 -->
        <template v-else>
          <UButton
            color="primary"
            :disabled="items.length === 0 || !metodoPagoSeleccionado"
            :loading="submitting"
            @click="finalizarVenta"
            block
            size="lg"
          >
            Confirmar y completar
          </UButton>

          <div class="grid grid-cols-2 gap-2">
            <UButton
              variant="outline"
              color="neutral"
              :disabled="submitting"
              @click="volverAVenta"
              block
            >
              Volver
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              :disabled="submitting"
              @click="cancelar"
              block
            >
              Cancelar
            </UButton>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
