<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";

// const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const { loadClients } = useClients();

const loading = ref(false);
const rows = ref([]);
const open = ref(false);

function onEdit(client) {
  console.log("edit", client);
}

function onDelete(client) {
  console.log("delete", client);
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
      const client = row.original; // ✅ objeto completo
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
          onClick: () => onDelete(client),
        }),
      ]);
    },
  },
]);

onMounted(async () => {
  await getClients();
});

async function getClients() {
  loading.value = true;
  try {
    const clients = await loadClients();
    rows.value = clients ?? [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Clientes" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex justify-between px-4 py-3.5 border-b border-accented">
        <UInput class="max-w-sm" placeholder="Filter..." />
        <UModal v-model:open="open">
          <UButton label="Cargar cliente" />
          <template #content>
            <ClientesClienteCreateModal
              @created="getClients()"
              @close="open = false"
            />
          </template>
        </UModal>
      </div>
      <BaseTable :rows="rows" :columns="columns" :loading="loading" />
    </template>
  </UDashboardPanel>
</template>
