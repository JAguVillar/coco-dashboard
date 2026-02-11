<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import VentasDetailModal from "~/components/ventas/VentasDetailModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { rows, loading, setRows } = useVentasListState();
const { deleteVenta, loadVentas } = useVentas();

const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const openCreate = ref(false);
const openDetails = ref(false);
const ventaSeleccionada = ref(null);
const search = ref("");

const {
  open: openConfirmDelete,
  itemToDelete,
  deleting,
  requestDelete,
  cancel: cancelDelete,
  confirm: confirmDelete,
} = useDeleteConfirmation({
  deleteFn: deleteVenta,
  onSuccess: getVentas,
  entityName: "Venta",
});

function getItemName(item) {
  return item?.nombre || "esta venta";
}

// function onEdit(venta) {
//   // TODO: implementar edición
// }

function formatPrice(price) {
  if (!price) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}

function onView(venta) {
  ventaSeleccionada.value = venta;
  openDetails.value = true;
}

function closeDetails() {
  openDetails.value = false;
  ventaSeleccionada.value = null;
}

function onChangePage(p) {
  page.value = p;
}

function onChangePageSize(s) {
  pageSize.value = Number(s);
  page.value = 1;
}

const formatFecha = (iso) => {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
};

const columns = computed(() => [
  {
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => formatFecha(row.getValue("created_at")),
  },
  {
    accessorKey: "clients",
    header: "Cliente",
    cell: ({ row }) => {
      const client = row.original.clients;
      return client?.full_name ?? "Mostrador";
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, formatPrice(row.getValue("total"))),
  },
  {
    accessorKey: "venta_estados",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("venta_estados");
      return estado
        ? h(
            UBadge,
            { variant: "subtle", color: estado.color },
            () => estado.nombre,
          )
        : h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "metodos_pago",
    header: "Pago",
    cell: ({ row }) => {
      const pagado = row.getValue("metodos_pago");
      return pagado
        ? h(
            UBadge,
            { variant: "subtle", color: "gray", icon: pagado.icon },
            () => pagado.nombre,
          )
        : h("span", { class: "text-gray-400" }, "-");
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const venta = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-eye",
          size: "md",
          variant: "ghost",
          color: "info",
          onClick: () => onView(venta),
          disabled: venta.venta_estados.codigo === "cancelada",
        }),
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "md",
          variant: "ghost",
          onClick: () => onEdit(venta),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "md",
          variant: "ghost",
          color: "error",
          onClick: () => requestDelete(venta),
        }),
      ]);
    },
  },
]);

async function getVentas() {
  loading.value = true;
  try {
    const res = await loadVentas({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value,
      // desde, hasta si los tenés
    });

    setRows(res.data);
    total.value = res.count;
  } finally {
    loading.value = false;
  }
}

let searchTimeout = null;

watch(
  [page, pageSize],
  () => {
    getVentas();
  },
  { immediate: true },
);
watch(search, () => {
  page.value = 1;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    getVentas();
  }, 300);
});
</script>

<template>
  <div>
    <div class="flex justify-between py-3.5 border-b border-accented">
      <div class="flex items-center gap-2">
        <UInput
          v-model="search"
          class="w-72 lg:w-80"
          placeholder="Buscar por cliente o comprobante..."
          icon="i-lucide-search"
          variant="soft"
          clearable
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
    <UModal v-model:open="openDetails">
      <template #content>
        <VentasDetailModal
          close-icon="i-lucide-arrow-right"
          :venta="ventaSeleccionada"
          @close="closeDetails"
          @updated="getVentas"
        />
      </template>
    </UModal>
    <ConfirmDeleteModal
      v-model:open="openConfirmDelete"
      title="Eliminar venta"
      :item-name="getItemName(itemToDelete)"
      :deleting="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
