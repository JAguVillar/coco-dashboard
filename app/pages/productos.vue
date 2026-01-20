<script setup>
  import { h, resolveComponent, ref, computed, onMounted } from "vue";
  import { useToast } from "#imports";
import ProductoCreateModal from "~/components/productos/ProductoCreateModal.vue";
  
  const UButton = resolveComponent("UButton");
  const USwitch = resolveComponent("USwitch");
  
  const { loadProducts, deleteProduct } = useProducts();
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
      "este producto"
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
      await deleteProduct(clientToDelete.value.id);
  
      toast.add({
        title: "Producto eliminado",
        description: "Se eliminó correctamente",
        color: "success",
      });
  
      openConfirmDelete.value = false;
      clientToDelete.value = null;
  
      await getProductos();
    } catch (e) {
      console.error(e);
      toast.add({
        title: "Error",
        description: "No se pudo eliminar el producto",
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
      accessorKey: "name",
      header: "Producto",
    },
    {
      accessorKey: "price",
      header: "Precio",
    },
    {
      accessorKey: "track_stock",
      header: "Trackeable",
      cell: ({ row }) =>
        h(USwitch, {
          modelValue: Boolean(row.getValue("track_stock")),
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
  
  async function getProductos() {
    loading.value = true;
    try {
      const clients = await loadProducts();
      rows.value = clients ?? [];
    } finally {
      loading.value = false;
    }
  }
  
  onMounted(getProductos);
  </script>
  
  <template>
    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar title="Productos" :ui="{ right: 'gap-3' }">
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
            <UButton label="Cargar producto" icon="i-lucide-plus" size="md"/>
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
                  <h3 class="font-semibold">Eliminar producto</h3>
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
  
