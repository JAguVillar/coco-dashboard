<script setup>
import VentaCreateModal from "~/components/ventas/VentaCreateModal.vue";
import VentaSlideOver from "~/components/ventas/VentaSlideOver.vue";

const user = useSupabaseUser();
const open = ref(false);
const route = useRoute();
const ventaSlideoverOpen = ref(false);

const links = [
  [
    {
      label: "Inicio",
      icon: "i-lucide-home",
      to: "/home",
      onSelect: () => (open.value = false),
    },
    {
      label: "Productos",
      icon: "i-lucide-box",
      to: "/productos",
      onSelect: () => (open.value = false),
    },
    {
      label: "Proveedores",
      icon: "i-lucide-truck",
      to: "/proveedores",
      onSelect: () => (open.value = false),
    },
    {
      label: "Categorías",
      icon: "i-lucide-tag",
      to: "/categorias",
      onSelect: () => (open.value = false),
    },
    {
      label: "Clientes",
      icon: "i-lucide-users",
      to: "/clientes",
      onSelect: () => (open.value = false),
    },
    {
      label: "Ventas",
      icon: "i-lucide-dollar-sign",
      to: "/ventas",
      onSelect: () => (open.value = false),
    },
  ],
];

const flatLinks = computed(() => links.flat());

const pageTitle = computed(() => {
  // match exact o por prefijo (sirve para /clientes/123)
  const match = flatLinks.value
    .slice()
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => route.path === l.to || route.path.startsWith(l.to + "/"));

  return match?.label ?? "Panel";
});

const openNuevaVenta = () => {
  ventaSlideoverOpen.value = true;
};

// (Opcional) cerrar sidebar cuando cambia la ruta
watch(
  () => route.path,
  () => {
    open.value = false;
  },
);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
    </UDashboardSidebar>

    <!-- ESTE es el único Panel: las pages NO deben renderizar otro UDashboardPanel -->
    <UDashboardPanel id="main">
      <template #header>
        <UDashboardNavbar :ui="{ right: 'gap-2' }">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #title>
            <div class="font-medium">
              {{ pageTitle }}
            </div>
          </template>

          <template #right>
            <!-- <UModal v-model:open="openCreate">
              <UButton
                icon="i-lucide-receipt"
                label="Nueva venta"
                color="primary"
              />
              <template #content>
                <VentaCreateModal @close="openCreate = false" />
              </template>
            </UModal> -->
            <USlideover v-model:open="ventaSlideoverOpen" side="right">
              <!-- Trigger (slot default) -->
              <UButton
                icon="i-lucide-receipt"
                label="Nueva venta"
                color="primary"
              />

              <!-- Contenido del slideover -->
              <template #content>
                <VentaSlideOver
                  @close="ventaSlideoverOpen = false"
                  @created="onVentaCreated"
                />
              </template>
            </USlideover>
            <UButton icon="i-lucide-log-out" variant="ghost" color="neutral" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
