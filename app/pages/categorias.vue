<script setup>
import { h, resolveComponent, ref, computed } from "vue";
import CategoriaCreateModal from "~/components/categorias/CategoriaCreateModal.vue";

const UButton = resolveComponent("UButton");

const { loadCategorias, deleteCategoria } = useCategorias();

const loading = ref(false);
const rows = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const openCreate = ref(false);

const {
  open: openConfirmDelete,
  itemToDelete,
  deleting,
  requestDelete,
  cancel: cancelDelete,
  confirm: confirmDelete,
} = useDeleteConfirmation({
  deleteFn: deleteCategoria,
  onSuccess: getCategorias,
  entityName: "Categoría",
});

function getItemName(item) {
  return item?.nombre || "esta categoría";
}

function onEdit(_categoria) {
  // TODO: implementar edición
}

function onChangePage(p) {
  page.value = p;
}

function onChangePageSize(s) {
  pageSize.value = Number(s);
  page.value = 1;
}

const columns = computed(() => [
  {
    accessorKey: "nombre",
    header: "Categoría",
    cell: ({ row }) => {
      const categoria = row.original;
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, categoria.nombre),
        categoria.descripcion
          ? h(
              "span",
              { class: "text-xs text-gray-500 dark:text-gray-400" },
              categoria.descripcion,
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const categoria = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "xs",
          variant: "ghost",
          onClick: () => onEdit(categoria),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "xs",
          variant: "ghost",
          color: "error",
          onClick: () => requestDelete(categoria),
        }),
      ]);
    },
  },
]);

async function getCategorias() {
  loading.value = true;
  try {
    const res = await loadCategorias({
      page: page.value,
      pageSize: pageSize.value,
    });

    rows.value = res.data;
    total.value = res.count;
  } finally {
    loading.value = false;
  }
}

watch(
  [page, pageSize],
  () => {
    getCategorias();
  },
  { immediate: true },
);
</script>

<template>
  <UDashboardPanel id="categorias">
    <template #body>
      <div class="flex flex-col gap-3 py-3.5 border-b border-accented sm:flex-row sm:justify-between sm:items-center">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            class="w-full sm:w-72 lg:w-80"
            placeholder="Buscar categorías..."
            icon="i-lucide-search"
            variant="soft"
          />
          <!-- futuro: filtros acá -->
        </div>
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
        title="Eliminar categoría"
        :item-name="getItemName(itemToDelete)"
        :deleting="deleting"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </UDashboardPanel>
</template>
