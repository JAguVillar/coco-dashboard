<script setup>
import { h, resolveComponent, ref, computed } from "vue";
import ProductoCreateModal from "~/components/productos/ProductoCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadProducts, deleteProduct } = useProducts();

const loading = ref(false);
const rows = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const openCreate = ref(false);
const search = ref("");

const {
  open: openConfirmDelete,
  itemToDelete,
  deleting,
  requestDelete,
  cancel: cancelDelete,
  confirm: confirmDelete,
} = useDeleteConfirmation({
  deleteFn: deleteProduct,
  onSuccess: getProductos,
  entityName: "Artículo",
});

function getItemName(item) {
  return item?.nombre || "este artículo";
}

function onEdit(_articulo) {
  // TODO: implementar edición
}

function onChangePage(p) {
  page.value = p;
}

function onChangePageSize(s) {
  pageSize.value = Number(s);
  page.value = 1;
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
          onClick: () => requestDelete(articulo),
        }),
      ]);
    },
  },
]);

async function getProductos() {
  loading.value = true;
  try {
    const res = await loadProducts({
      search: search.value,
      page: page.value,
      pageSize: pageSize.value,
    });

    rows.value = res.data;
    total.value = res.count;
  } finally {
    loading.value = false;
  }
}

let searchTimeout = null;

watch(
  [page, pageSize],
  () => {
    getProductos();
  },
  { immediate: true },
);
watch(search, () => {
  page.value = 1;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    getProductos();
  }, 300);
});
</script>

<template>
  <UDashboardPanel id="productos">
    <template #body>
      <div class="flex flex-col gap-3 py-3.5 border-b border-accented sm:flex-row sm:justify-between sm:items-center">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            v-model="search"
            class="w-full sm:w-72 lg:w-80"
            placeholder="Buscar por cliente o comprobante..."
            icon="i-lucide-search"
            variant="soft"
            clearable
          />
          <!-- futuro: filtros acá -->
        </div>

        <UModal v-model:open="openCreate">
          <UButton
            label="Cargar artículo"
            icon="i-lucide-plus"
            variant="outline"
            color="neutral"
            size="md"
            class="w-full sm:w-auto"
          />
          <template #content>
            <ProductoCreateModal
              @created="getProductos()"
              @close="openCreate = false"
            />
          </template>
        </UModal>
      </div>

      <BaseTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        show-pagination
        :page="page"
        :page-size="pageSize"
        :total="total"
        @update:page="onChangePage"
        @update:page-size="onChangePageSize"
      />

      <ConfirmDeleteModal
        v-model:open="openConfirmDelete"
        title="Eliminar artículo"
        :item-name="getItemName(itemToDelete)"
        :deleting="deleting"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </UDashboardPanel>
</template>
