<script setup>
import { h, resolveComponent, ref, computed } from "vue";
import ProveedorCreateModal from "~/components/proveedores/ProveedorCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadProveedores, deleteProveedor } = useProveedores();

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
  deleteFn: deleteProveedor,
  onSuccess: getProveedores,
  entityName: "Proveedor",
});

function getItemName(item) {
  return item?.nombre || "este proveedor";
}

function onEdit(_proveedor) {
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
          onClick: () => requestDelete(proveedor),
        }),
      ]);
    },
  },
]);

async function getProveedores() {
  loading.value = true;
  try {
    const res = await loadProveedores({
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
    getProveedores();
  },
  { immediate: true },
);
</script>

<template>
  <UDashboardPanel id="proveedores">
    <template #body>
      <div class="flex justify-between py-3.5 border-b border-accented">
        <div class="flex items-center gap-2">
          <UInput
            class="w-72 lg:w-80"
            placeholder="Buscar proveedores..."
            icon="i-lucide-search"
            variant="soft"
          />
          <!-- futuro: filtros acá -->
        </div>

        <UModal v-model:open="openCreate" scrollable>
          <UButton
            label="Cargar proveedor"
            icon="i-lucide-plus"
            variant="outline"
            color="neutral"
            size="md"
          />
          <template #content>
            <ProveedorCreateModal
              @created="getProveedores()"
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
        title="Eliminar proveedor"
        :item-name="getItemName(itemToDelete)"
        :deleting="deleting"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </UDashboardPanel>
</template>
