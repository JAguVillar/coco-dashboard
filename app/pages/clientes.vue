<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import { useToast } from "#imports";

const UButton = resolveComponent("UButton");

const { loadClients, deleteClient } = useClients();
const toast = useToast();

const loading = ref(false);
const rows = ref([]);

const openCreate = ref(false);

// ✅ modal confirm
const openConfirmDelete = ref(false);
const clientToDelete = ref(null);
const deleting = ref(false);

function getClientName(client) {
  return (
    client?.full_name ||
    `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() ||
    "este cliente"
  );
}

function onEdit(client) {
  console.log("edit", client);
}

// ✅ ahora onDelete solo abre modal
function onDelete(client) {
  clientToDelete.value = client;
  openConfirmDelete.value = true;
}

// ✅ confirmar eliminación
async function confirmDelete() {
  if (!clientToDelete.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteClient(clientToDelete.value.id);

    toast.add({
      title: "Cliente eliminado",
      description: "Se eliminó correctamente",
      color: "success",
    });

    openConfirmDelete.value = false;
    clientToDelete.value = null;

    await getClients();
  } catch (e) {
    console.error(e);
    toast.add({
      title: "Error",
      description: "No se pudo eliminar el cliente",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function cancelDelete() {
  openConfirmDelete.value = false;
  clientToDelete.value = null;
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
          onClick: () => onDelete(client),
        }),
      ]);
    },
  },
]);

async function getClients() {
  loading.value = true;
  try {
    const clients = await loadClients();
    rows.value = clients ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(getClients);
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

        <!-- Modal create -->
        <UModal v-model:open="openCreate">
          <UButton label="Cargar cliente" icon="i-lucide-plus" size="md" />
          <template #content>
            <ClientesClienteCreateModal
              @created="getClients()"
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
                <h3 class="font-semibold">Eliminar cliente</h3>
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
                ¿Seguro que querés eliminar a
                <span class="font-medium">{{
                  getClientName(clientToDelete)
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
