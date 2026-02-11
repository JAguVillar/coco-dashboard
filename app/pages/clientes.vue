<script setup>
import { h, resolveComponent, ref, computed } from "vue";

const UButton = resolveComponent("UButton");

const { loadClients, deleteClient } = useClients();

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
  deleteFn: deleteClient,
  onSuccess: getClients,
  entityName: "Cliente",
});

function getItemName(item) {
  return (
    item?.full_name ||
    `${item?.first_name ?? ""} ${item?.last_name ?? ""}`.trim() ||
    "este cliente"
  );
}

function onEdit(_client) {
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
    accessorKey: "full_name",
    header: "Cliente",
    cell: ({ row }) =>
      row.getValue("full_name") ||
      `${row.getValue("first_name") ?? ""} ${
        row.getValue("last_name") ?? ""
      }`.trim(),
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const client = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "xs",
          variant: "ghost",
          onClick: () => onEdit(client),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "xs",
          variant: "ghost",
          color: "error",
          onClick: () => requestDelete(client),
        }),
      ]);
    },
  },
]);

async function getClients() {
  loading.value = true;
  try {
    const res = await loadClients({
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
    getClients();
  },
  { immediate: true },
);
</script>

<template>
  <UDashboardPanel id="clientes">
    <template #body>
      <div class="flex flex-col gap-3 py-3.5 border-b border-accented sm:flex-row sm:justify-between sm:items-center">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            class="w-full sm:w-72 lg:w-80"
            placeholder="Buscar clientes..."
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
        title="Eliminar cliente"
        :item-name="getItemName(itemToDelete)"
        :deleting="deleting"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </UDashboardPanel>
</template>
