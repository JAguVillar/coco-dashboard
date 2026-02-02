<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import { useToast } from "#imports";
import ProductoCreateModal from "~/components/productos/ProductoCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadProducts, deleteProduct } = useProducts();
const toast = useToast();

const loading = ref(false);
const rows = ref([]);

const openCreate = ref(false);

// ✅ modal confirm
const openConfirmDelete = ref(false);
const articuloToDelete = ref(null);
const deleting = ref(false);

function getArticuloName(articulo) {
  return articulo?.nombre || "este artículo";
}

function onEdit(articulo) {
  console.log("edit", articulo);
}

// ✅ ahora onDelete solo abre modal
function onDelete(articulo) {
  articuloToDelete.value = articulo;
  openConfirmDelete.value = true;
}

// ✅ confirmar eliminación
async function confirmDelete() {
  if (!articuloToDelete.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteProduct(articuloToDelete.value.id);

    toast.add({
      title: "Artículo eliminado",
      description: "Se eliminó correctamente",
      color: "success",
    });

    openConfirmDelete.value = false;
    articuloToDelete.value = null;

    await getProductos();
  } catch (e) {
    console.error(e);
    toast.add({
      title: "Error",
      description: "No se pudo eliminar el artículo",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function cancelDelete() {
  openConfirmDelete.value = false;
  articuloToDelete.value = null;
}

function formatPrice(price) {
  if (!price) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

function getStockColor(articulo) {
  if (articulo.stock_actual <= 0) return "red";
  if (articulo.stock_actual <= articulo.stock_minimo) return "orange";
  return "green";
}

const columns = computed(() => [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ row }) => row.getValue("codigo") || "-",
  },
  {
    accessorKey: "nombre",
    header: "Artículo",
    cell: ({ row }) => {
      const articulo = row.original;
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, articulo.nombre),
        articulo.descripcion
          ? h(
              "span",
              { class: "text-xs text-gray-500 dark:text-gray-400" },
              articulo.descripcion,
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: "categoria",
    header: "Categoría",
    cell: ({ row }) => {
      const categoria = row.getValue("categoria");
      return categoria
        ? h(UBadge, { variant: "subtle", color: "gray" }, () => categoria)
        : h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "stock_actual",
    header: "Stock",
    cell: ({ row }) => {
      const articulo = row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          UBadge,
          { color: getStockColor(articulo), variant: "subtle" },
          () => `${articulo.stock_actual} ${articulo.unidad_medida}`,
        ),
        articulo.stock_minimo > 0
          ? h(
              "span",
              { class: "text-xs text-gray-500" },
              `(mín: ${articulo.stock_minimo})`,
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: "precio_venta_por_unidad",
    header: "Precio",
    cell: ({ row }) =>
      h(
        "span",
        { class: "font-medium" },
        formatPrice(row.getValue("precio_venta_por_unidad")),
      ),
  },
  {
    accessorKey: "es_fraccionable",
    header: "Fraccionable",
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.getValue("es_fraccionable")),
        disabled: true,
      }),
  },
  {
    accessorKey: "active",
    header: "Activo",
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.getValue("active")),
        disabled: true,
      }),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const articulo = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "xs",
          variant: "ghost",
          onClick: () => onEdit(articulo),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "xs",
          variant: "ghost",
          color: "error",
          onClick: () => onDelete(articulo),
        }),
      ]);
    },
  },
]);

async function getProductos() {
  loading.value = true;
  try {
    const articulos = await loadProducts();
    rows.value = articulos ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(getProductos);
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Artículos" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex justify-between px-4 py-3.5 border-b border-accented">
        <UInput class="max-w-sm" placeholder="Buscar artículos..." />

        <!-- Modal create -->
        <UModal v-model:open="openCreate">
          <UButton label="Cargar artículo" icon="i-lucide-plus" size="md" />
          <template #content>
            <ProductoCreateModal
              @created="getProductos()"
              @close="openCreate = false"
            />
          </template>
        </UModal>
      </div>

      <BaseTable :rows="rows" :columns="columns" :loading="loading" />

      <!-- ✅ Modal confirm delete -->
      <UModal v-model:open="openConfirmDelete">
        <template #content>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Eliminar artículo</h3>
                <UButton
                  icon="i-lucide-x"
                  variant="ghost"
                  color="neutral"
                  :disabled="deleting"
                  @click="cancelDelete"
                />
              </div>
            </template>

            <div class="space-y-2">
              <p class="text-sm">
                ¿Seguro que querés eliminar
                <span class="font-medium">{{
                  getArticuloName(articuloToDelete)
                }}</span
                >?
              </p>
              <p class="text-xs text-gray-500">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <template #footer>
              <div class="flex justify-end gap-2">
                <UButton
                  variant="outline"
                  color="neutral"
                  :disabled="deleting"
                  @click="cancelDelete"
                >
                  Cancelar
                </UButton>

                <UButton
                  color="error"
                  :loading="deleting"
                  @click="confirmDelete"
                >
                  Eliminar
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
