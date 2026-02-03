<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import { useToast } from "#imports";
import ProveedorCreateModal from "~/components/proveedores/ProveedorCreateModal.vue";
// import ProveedorCreateModal from "~/components/proveedores/ProveedorCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadProveedores, deleteProveedor } = useProveedores();
const toast = useToast();

const loading = ref(false);
const rows = ref([]);

const openCreate = ref(false);

// ✅ modal confirm
const openConfirmDelete = ref(false);
const proveedorToDelete = ref(null);
const deleting = ref(false);

function getProveedorName(proveedor) {
  return proveedor?.nombre || "este proveedor";
}

function onEdit(proveedor) {
  console.log("edit", proveedor);
}

// ✅ ahora onDelete solo abre modal
function onDelete(proveedor) {
  proveedorToDelete.value = proveedor;
  openConfirmDelete.value = true;
}

// ✅ confirmar eliminación
async function confirmDelete() {
  if (!proveedorToDelete.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteProveedor(proveedorToDelete.value.id);

    toast.add({
      title: "Proveedor eliminado",
      description: "Se eliminó correctamente",
      color: "success",
    });

    openConfirmDelete.value = false;
    proveedorToDelete.value = null;

    await getProveedores();
  } catch (e) {
    console.error(e);
    toast.add({
      title: "Error",
      description: "No se pudo eliminar el proveedor",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function cancelDelete() {
  openConfirmDelete.value = false;
  proveedorToDelete.value = null;
}

const columns = computed(() => [
  {
    accessorKey: "nombre",
    header: "Proveedor",
    cell: ({ row }) => {
      const proveedor = row.original;
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, proveedor.nombre),
        proveedor.razon_social
          ? h(
              "span",
              { class: "text-xs text-gray-500 dark:text-gray-400" },
              proveedor.razon_social,
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: "cuit",
    header: "CUIT",
    cell: ({ row }) => row.getValue("cuit") || "-",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => row.getValue("telefono") || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email");
      return email
        ? h("span", { class: "text-sm" }, email)
        : h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "ciudad",
    header: "Ciudad",
    cell: ({ row }) => {
      const proveedor = row.original;
      const ciudad = proveedor.ciudad;
      const provincia = proveedor.provincia;

      if (ciudad && provincia) {
        return h("div", { class: "flex flex-col" }, [
          h("span", { class: "text-sm" }, ciudad),
          h("span", { class: "text-xs text-gray-500" }, provincia),
        ]);
      }
      if (ciudad) return h("span", ciudad);
      if (provincia)
        return h("span", { class: "text-sm text-gray-500" }, provincia);
      return h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "condicion_pago",
    header: "Condición",
    cell: ({ row }) => {
      const condicion = row.getValue("condicion_pago");
      return condicion
        ? h(UBadge, { variant: "subtle", color: "gray" }, () => condicion)
        : h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "activo",
    header: "Activo",
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.getValue("activo")),
        disabled: true,
      }),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const proveedor = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "xs",
          variant: "ghost",
          onClick: () => onEdit(proveedor),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "xs",
          variant: "ghost",
          color: "error",
          onClick: () => onDelete(proveedor),
        }),
      ]);
    },
  },
]);

async function getProveedores() {
  loading.value = true;
  try {
    const proveedores = await loadProveedores();
    rows.value = proveedores ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(getProveedores);
</script>

<template>
  <UDashboardPanel id="proveedores">
    <template #header>
      <UDashboardNavbar title="Proveedores" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex justify-between px-4 py-3.5 border-b border-accented">
        <UInput class="max-w-sm" placeholder="Buscar proveedores..." />

        <!-- Modal create -->
        <UModal v-model:open="openCreate" scrollable>
          <UButton label="Cargar proveedor" icon="i-lucide-plus" size="md" />
          <template #content>
            <ProveedorCreateModal
              @created="getProveedores()"
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
                <h3 class="font-semibold">Eliminar proveedor</h3>
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
                  getProveedorName(proveedorToDelete)
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
