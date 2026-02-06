<!-- components/ventas/VentaSlideover.vue -->
<script setup>
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);

const { crearVenta, agregarItem, getVenta, completarVenta, cancelarVenta } =
  useVentas();
const { loadClients } = useClients();
const { loadProducts } = useProducts();

const toast = useToast();

// Estado
const ventaActual = ref(null);
const items = ref([]);
const clientes = ref([]);
const articulos = ref([]);
const loading = ref(false);
const submitting = ref(false);

// Form para seleccionar cliente
const clienteSeleccionado = ref(null);
const iniciandoVenta = ref(false);

// Form para nuevo item
const nuevoItem = reactive({
  articulo_id: null,
  cantidad: 1,
  descuento: 0,
});

const clienteSearch = ref("");
const articuloSearch = ref("");

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
// - Unitarios: unidades enteras
// - Fraccionables en kg: UI en gramos enteros, se convierte a kg internamente
// ----------------------
const esFraccionable = computed(
  () => !!articuloSeleccionado.value?.es_fraccionable,
);
const unidadBase = computed(
  () => articuloSeleccionado.value?.unidad_medida ?? "unidad",
);

// UI en gramos solo para fraccionables en kg
const usaGramosUI = computed(
  () => esFraccionable.value && unidadBase.value === "kg",
);

// Ajustá el salto default de gramos
const GR_STEP = 50;

// Default al cambiar producto
watch(
  () => articuloSeleccionado.value,
  (a) => {
    if (!a) return;

    if (!a.es_fraccionable) {
      nuevoItem.cantidad = 1; // unidades
    } else if (a.unidad_medida === "kg") {
      nuevoItem.cantidad = 100; // 100gr por defecto
    } else {
      // otros fraccionables (si existieran)
      nuevoItem.cantidad = 1;
    }

    nuevoItem.descuento = 0;
  },
);

const cantidadIngresada = computed(() => toNumber(nuevoItem.cantidad, 0));

// UI normalizada (enteros cuando corresponde)
const cantidadUI = computed(() => {
  if (!articuloSeleccionado.value) return cantidadIngresada.value;

  if (!esFraccionable.value) {
    // unitarios: entero
    return Math.max(0, Math.floor(cantidadIngresada.value));
  }

  if (usaGramosUI.value) {
    // gramos: entero
    return Math.max(0, Math.floor(cantidadIngresada.value));
  }

  // otros fraccionables: permito decimal
  return Math.max(0, cantidadIngresada.value);
});

// Cantidad en unidad base (stock/precio/backend)
const cantidadBase = computed(() => {
  if (!articuloSeleccionado.value) return 0;

  if (!esFraccionable.value) return cantidadUI.value;

  // gramos -> kg
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

// Helpers para botones +/- (gr o unidades)
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

  // si UI es gramos, muestro stock en gramos para que tenga sentido
  if (usaGramosUI.value) {
    return `${Math.floor(stockBase.value * 1000)} gr`;
  }

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
    const venta = await crearVenta({
      cliente_id: clienteId,
      metodo_pago: null,
      notas: null,
    });

    ventaActual.value = venta;
    items.value = [];

    toast.add({
      title: "Venta iniciada",
      color: "success",
    });
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
  const cantidad = cantidadBase.value; // ✅ base (kg si UI gr)
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

    // Verificar stock (en unidad base)
    if (articulo.stock_actual < cantidad) {
      toast.add({
        title: "Stock insuficiente",
        description: `Solo hay ${stockDisplay.value} disponibles`,
        color: "error",
      });
      return;
    }

    const itemCreado = await agregarItem({
      venta_id: ventaActual.value.id,
      articulo_id: articuloId,
      cantidad, // ✅ base
      precio_unitario: precioUnitario.value,
      descuento,
    });

    items.value.push({
      ...itemCreado,
      articulos: itemCreado?.articulos ?? articulo,
    });

    await cargarVenta();

    // restar stock local en base
    const idx = articulos.value.findIndex((a) => a.id === articulo.id);
    if (idx !== -1) articulos.value[idx].stock_actual -= cantidad;

    // Resetear form
    nuevoItem.articulo_id = null;
    nuevoItem.cantidad = 1;
    nuevoItem.descuento = 0;

    toast.add({
      title: "Item agregado",
      color: "success",
    });
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

  submitting.value = true;

  try {
    await completarVenta(ventaActual.value.id, {
      metodo_pago: "efectivo",
      numero_comprobante: null,
      tipo_comprobante: "ticket",
    });

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
    if (!confirm("¿Cancelar la venta? Se restaurará el stock.")) {
      return;
    }
  }

  try {
    if (items.value.length > 0) {
      await cancelarVenta(ventaActual.value.id);
      toast.add({
        title: "Venta cancelada",
        description: "Se restauró el stock",
        color: "warning",
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    emit("close");
  }
};

// Cargar datos iniciales
onMounted(async () => {
  loading.value = true;
  try {
    const clientesData = await loadClients?.();
    clientes.value = clientesData ?? [];

    const articulosData = await loadProducts?.();
    articulos.value = articulosData ?? [];
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

    <!-- Paso 1: Seleccionar cliente -->
    <div v-else-if="!ventaActual" class="flex-1 p-4 space-y-4">
      <UFormField
        label="Cliente"
        name="cliente"
        help="Si no seleccionas uno, se tomará como venta de mostrador"
      >
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
      </UFormField>

      <UButton @click="iniciarVenta" :loading="iniciandoVenta" block size="lg">
        Iniciar venta
      </UButton>
    </div>

    <!-- Paso 2: Agregar items -->
    <template v-else>
      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Info cliente y total -->
        <div class="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
              <p class="font-medium">
                {{ ventaActual.clients?.full_name || "Mostrador" }}
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

        <!-- Form agregar producto -->
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

          <!-- Mini info -->
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
                    Precio: ${{ precioUnitario.toFixed(2) }} / {{ unidadBase }}
                  </p>
                  <p class="text-xs text-gray-500">Stock: {{ stockDisplay }}</p>
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

            <!-- Ajustes rápidos (compactos) -->
            <div v-if="usaGramosUI" class="space-y-1">
              <p class="text-xs text-gray-500">Ajustes rápidos</p>

              <div class="flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  @click="restarCantidad(100)"
                  >-100</UButton
                >
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  @click="restarCantidad(50)"
                  >-50</UButton
                >

                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  @click="sumarCantidad(50)"
                  >+50</UButton
                >
                <UButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  @click="sumarCantidad(100)"
                  >+100</UButton
                >

                <UButton
                  size="sm"
                  variant="outline"
                  color="neutral"
                  @click="sumarCantidad(250)"
                  >+250</UButton
                >
                <UButton
                  size="sm"
                  variant="outline"
                  color="neutral"
                  @click="sumarCantidad(500)"
                  >+500</UButton
                >
                <UButton
                  size="sm"
                  variant="outline"
                  color="neutral"
                  @click="sumarCantidad(1000)"
                  >+1000</UButton
                >
              </div>
            </div>

            <!-- Total item -->
            <div class="flex justify-between items-center pt-1">
              <span class="text-sm text-gray-500">Total item</span>
              <span class="text-lg font-semibold">
                ${{ totalNuevoItem.toFixed(2) }}
              </span>
            </div>

            <!-- CTA -->
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

          <div v-if="items.length === 0" class="text-center py-8 text-gray-400">
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
              <p class="font-bold">${{ item.total?.toFixed(2) }}</p>
            </div>
            <p class="text-xs text-gray-500">
              {{ item.cantidad }}
              {{ item.articulos?.unidad_medida ?? "" }}
              × ${{ item.precio_unitario?.toFixed(2) }}
              <span v-if="item.descuento > 0" class="text-orange-500">
                (-${{ item.descuento?.toFixed(2) }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Footer fijo -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <UButton
          color="primary"
          :disabled="items.length === 0"
          :loading="submitting"
          @click="finalizarVenta"
          block
          size="lg"
        >
          Finalizar venta
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
