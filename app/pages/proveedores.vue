<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import ProveedorCreateModal from "~/components/proveedores/ProveedorCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadProveedores, deleteProveedor } = useProveedores();

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
  deleteFn: deleteProveedor,
  onSuccess: getProveedores,
  entityName: "Proveedor",
});

function getItemName(item) {
  return item?.nombre || "este proveedor";
}

function onEdit(proveedor) {
  // TODO: implementar edición
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
              proveedor.razon_social
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
          onClick: () => requestDelete(proveedor),
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

      <ConfirmDeleteModal
        v-model:open="openConfirmDelete"
        title="Eliminar proveedor"
        :item-name="getItemName(itemToDelete)"
        :deleting="deleting"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </UDashboardPanel>
</template>
