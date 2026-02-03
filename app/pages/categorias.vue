<script setup>
import { h, resolveComponent, ref, computed, onMounted } from "vue";
import { useToast } from "#imports";
import CategoriaCreateModal from "~/components/categorias/CategoriaCreateModal.vue";

const UButton = resolveComponent("UButton");
const USwitch = resolveComponent("USwitch");
const UBadge = resolveComponent("UBadge");

const { loadCategorias, deleteCategoria } = useCategorias();
const toast = useToast();

const loading = ref(false);
const rows = ref([]);

const openCreate = ref(false);

// ✅ modal confirm
const openConfirmDelete = ref(false);
const categoriaToDelete = ref(null);
const deleting = ref(false);

function getCategoriaName(categoria) {
  return categoria?.nombre || "esta categoría";
}

function onEdit(categoria) {
  console.log("edit", categoria);
}

// ✅ ahora onDelete solo abre modal
function onDelete(categoria) {
  categoriaToDelete.value = categoria;
  openConfirmDelete.value = true;
}

// ✅ confirmar eliminación
async function confirmDelete() {
  if (!categoriaToDelete.value || deleting.value) return;

  deleting.value = true;
  try {
    await deleteCategoria(categoriaToDelete.value.id);

    toast.add({
      title: "Categoría eliminada",
      description: "Se eliminó correctamente",
      color: "success",
    });

    openConfirmDelete.value = false;
    categoriaToDelete.value = null;

    await getCategorias();
  } catch (e) {
    console.error(e);
    toast.add({
      title: "Error",
      description: "No se pudo eliminar la categoría",
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

function cancelDelete() {
  openConfirmDelete.value = false;
  categoriaToDelete.value = null;
}

const columns = computed(() => [
  {
    accessorKey: "nombre",
    header: "Artículo",
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
      const articulo = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "xs",
          variant: "ghost",
          onClick: () => onEdit(articulo),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "xs",
          variant: "ghost",
          color: "error",
          onClick: () => onDelete(articulo),
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
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Categorías" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex justify-between px-4 py-3.5 border-b border-accented">
        <UInput class="max-w-sm" placeholder="Buscar categorías..." />

        <!-- Modal create -->
        <UModal v-model:open="openCreate">
          <UButton label="Cargar categoría" icon="i-lucide-plus" size="md" />
          <template #content>
            <CategoriaCreateModal
              @created="getCategorias()"
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
                <h3 class="font-semibold">Eliminar categoría</h3>
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
                ¿Seguro que querés eliminar
                <span class="font-medium">{{
                  getCategoriaName(categoriaToDelete)
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
