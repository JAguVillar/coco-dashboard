<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import CategoriaCreateModal from "~/components/categorias/CategoriaCreateModal.vue";

const UButton = resolveComponent("UButton");

const { loadCategorias, deleteCategoria } = useCategorias();

const loading = ref(false);
const rows = ref([]);
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

function onEdit(categoria) {
  // TODO: implementar edición
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
    const categorias = await loadCategorias();
    rows.value = categorias ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(getCategorias);
</script>

<template>
  <UDashboardPanel id="categorias">
    <template #body>
      <div class="flex justify-between py-3.5 border-b border-accented">
        <div class="flex items-center gap-2">
          <UInput
            class="w-72 lg:w-80"
            placeholder="Buscar categorías..."
            icon="i-lucide-search"
            variant="soft"
          />
          <!-- futuro: filtros acá -->
        </div>
      </div>

      <BaseTable :rows="rows" :columns="columns" :loading="loading" />

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
