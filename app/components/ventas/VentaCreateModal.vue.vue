<!-- components/ventas/VentaCreateModal.vue -->
<script setup>
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);

const {
  createVenta,
  addItem: addItemToVenta,
  getVenta,
  completeVenta,
  cancelVenta,
} = useVentas();
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

const articuloSearch = ref("");

// Computed
const articulosDisponibles = computed(() =>
  articulos.value.filter((a) => a.stock_actual > 0 && a.activo),
);

const articulosItems = computed(() =>
  articulosDisponibles.value.map((a) => ({
    label: `${a.nombre} - $${a.precio_venta_por_unidad} (Stock: ${a.stock_actual} ${a.unidad_medida})`,
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

const articuloSeleccionado = computed(() => {
  if (!nuevoItem.articulo_id) return null;
  return articulos.value.find((a) => a.id === nuevoItem.articulo_id);
});

const subtotalNuevoItem = computed(() => {
  if (!articuloSeleccionado.value) return 0;
  return (
    nuevoItem.cantidad * articuloSeleccionado.value.precio_venta_por_unidad
  );
});

const totalNuevoItem = computed(() => {
  return Math.max(0, subtotalNuevoItem.value - nuevoItem.descuento);
});

// Métodos
const iniciarVenta = async () => {
  if (iniciandoVenta.value) return;
  iniciandoVenta.value = true;

  try {
    const venta = await createVenta({
      cliente_id: clienteSeleccionado.value,
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

const addItem = async () => {
  if (!ventaActual.value || submitting.value) return;
  if (!nuevoItem.articulo_id || !nuevoItem.cantidad) return;

  submitting.value = true;

  try {
    const articulo = articuloSeleccionado.value;

    // Verificar stock
    if (articulo.stock_actual < nuevoItem.cantidad) {
      toast.add({
        title: "Stock insuficiente",
        description: `Solo hay ${articulo.stock_actual} ${articulo.unidad_medida} disponibles`,
        color: "error",
      });
      return;
    }

    const itemCreado = await addItemToVenta({
      venta_id: ventaActual.value.id,
      articulo_id: nuevoItem.articulo_id,
      cantidad: nuevoItem.cantidad,
      precio_unitario: articulo.precio_venta_por_unidad,
      descuento: nuevoItem.descuento,
    });

    // Agregar a la lista local
    items.value.push(itemCreado);

    // Actualizar venta
    await cargarVenta();

    // Actualizar stock del artículo en la lista
    const articuloIndex = articulos.value.findIndex(
      (a) => a.id === articulo.id,
    );
    if (articuloIndex !== -1) {
      articulos.value[articuloIndex].stock_actual -= nuevoItem.cantidad;
    }

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
      description: error.message || "No se pudo agregar el item",
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
    await completeVenta(ventaActual.value.id, {
      metodo_pago: "efectivo",
      numero_comprobante: null,
      tipo_comprobante: "ticket",
    });

    toast.add({
      title: "Venta completada",
      description: `Total: $${ventaActual.value.total?.toFixed(2)}`,
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
    // Confirmar cancelación si hay items
    if (!confirm("¿Cancelar la venta? Se restaurará el stock.")) {
      return;
    }
  }

  try {
    if (items.value.length > 0) {
      await cancelVenta(ventaActual.value.id);
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

const cargarVenta = async () => {
  if (!ventaActual.value) return;
  ventaActual.value = await getVenta(ventaActual.value.id);
};

// Cargar datos iniciales
onMounted(async () => {
  loading.value = true;
  try {
    clientes.value = await loadClients();
    articulos.value = await loadProducts();
  } catch (error) {
    console.error(error);
    toast.add({
      title: "Error",
      description: "No se pudieron cargar los datos",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Nueva venta</h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          :disabled="submitting"
          @click="cancelar"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
    </div>

    <!-- Paso 1: Seleccionar cliente -->
    <div v-else-if="!ventaActual" class="space-y-4">
      <UFormField label="Cliente" name="cliente">
        <USelectMenu
          v-model="clienteSeleccionado"
          :options="clientesItems"
          placeholder="Seleccionar cliente..."
          searchable
          class="w-full"
        />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton variant="outline" color="neutral" @click="emit('close')">
          Cancelar
        </UButton>
        <UButton @click="iniciarVenta" :loading="iniciandoVenta">
          Continuar
        </UButton>
      </div>
    </div>

    <!-- Paso 2: Agregar items -->
    <div v-else class="space-y-4">
      <!-- Info de la venta -->
      <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <div>
            <p class="text-sm text-gray-500">Cliente</p>
            <p class="font-medium">
              {{ ventaActual.clients?.full_name || "Sin cliente / Mostrador" }}
            </p>
          </div>
          <UBadge color="orange">Pendiente</UBadge>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold">
            ${{ ventaActual.total?.toFixed(2) || "0.00" }}
          </p>
        </div>
      </div>

      <!-- Form para agregar item -->
      <div
        class="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 space-y-4"
      >
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">
          Agregar producto
        </h4>

        <UFormField label="Artículo" name="articulo_id" required>
          <USelectMenu
            v-model="nuevoItem.articulo_id"
            :options="articulosItems"
            placeholder="Buscar producto..."
            searchable
            :search-attributes="['label']"
            class="w-full"
          >
            <template #search>
              <UInput
                v-model="articuloSearch"
                placeholder="Buscar por nombre..."
                class="w-full"
              />
            </template>
          </USelectMenu>
        </UFormField>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="Cantidad" name="cantidad" required>
            <UInput
              v-model="nuevoItem.cantidad"
              type="number"
              step="0.001"
              min="0.001"
              :disabled="!nuevoItem.articulo_id"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Descuento ($)" name="descuento">
            <UInput
              v-model="nuevoItem.descuento"
              type="number"
              step="0.01"
              min="0"
              :disabled="!nuevoItem.articulo_id"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Total" name="total">
            <UInput
              :model-value="totalNuevoItem.toFixed(2)"
              disabled
              class="w-full"
            />
          </UFormField>
        </div>

        <UButton
          @click="addItem"
          :disabled="!nuevoItem.articulo_id || !nuevoItem.cantidad"
          :loading="submitting"
          block
        >
          Agregar producto
        </UButton>
      </div>

      <!-- Lista de items -->
      <div v-if="items.length > 0" class="space-y-2">
        <h4 class="font-medium text-sm text-gray-700 dark:text-gray-300">
          Productos en la venta
        </h4>

        <div
          v-for="item in items"
          :key="item.id"
          class="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium">{{ item.articulos.nombre }}</p>
            <p class="text-sm text-gray-500">
              {{ item.cantidad }} {{ item.articulos.unidad_medida }} × ${{
                item.precio_unitario?.toFixed(2)
              }}
              <span v-if="item.descuento > 0" class="text-orange-500">
                (Desc: -${{ item.descuento?.toFixed(2) }})
              </span>
            </p>
          </div>
          <div class="text-right">
            <p class="font-semibold text-lg">${{ item.total?.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <UIcon
          name="i-lucide-shopping-cart"
          class="w-12 h-12 mx-auto mb-2 opacity-50"
        />
        <p>Agregá productos a la venta</p>
      </div>
    </div>

    <template v-if="ventaActual" #footer>
      <div class="flex justify-between gap-2">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="submitting"
          @click="cancelar"
        >
          Cancelar venta
        </UButton>
        <UButton
          color="primary"
          :disabled="items.length === 0"
          :loading="submitting"
          @click="finalizarVenta"
        >
          Finalizar venta (${{ ventaActual.total?.toFixed(2) || "0.00" }})
        </UButton>
      </div>
    </template>
  </UCard>
</template>
