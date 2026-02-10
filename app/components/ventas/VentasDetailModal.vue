<script setup>
const emit = defineEmits(["close"]);

const toast = useToast();
const { getVenta } = useVentas();

const props = defineProps({
  venta: {
    type: Object,
    required: true, // espera al menos { id }
  },
});

const loading = ref(false);
const errorMsg = ref(null);
const detalleVenta = ref(null);

const close = () => emit("close");

const formatCurrency = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n ?? 0),
  );

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

const clienteLabel = computed(() => {
  const v = detalleVenta.value;
  return v?.clients?.nombre || "Sin cliente / Mostrador";
});

const items = computed(() => detalleVenta.value?.venta_items ?? []);

const resumen = computed(() => {
  const v = detalleVenta.value ?? {};
  return {
    subtotal: Number(v.subtotal ?? 0),
    descuento: Number(v.descuento ?? 0),
    total: Number(v.total ?? 0),
  };
});

async function load() {
  loading.value = true;
  errorMsg.value = null;

  try {
    detalleVenta.value = await getVenta(props.venta.id);
  } catch (e) {
    console.error(e);
    errorMsg.value = "No se pudieron cargar los datos de la venta.";
    toast.add({
      title: "Error",
      description: errorMsg.value,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(load);

watch(
  () => props.venta?.id,
  () => load(),
);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold leading-tight">Detalle de venta</h3>

            <UBadge
              v-if="detalleVenta"
              :color="detalleVenta?.venta_estados.color"
              variant="subtle"
            >
              {{ detalleVenta?.venta_estados.nombre }}
            </UBadge>
          </div>

          <p class="text-sm text-(--ui-text-muted) mt-1">
            ID:
            <span class="font-mono text-xs break-all">{{
              props.venta.id
            }}</span>
          </p>
        </div>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudo cargar"
        :description="errorMsg"
      />
      <div class="flex justify-end">
        <UButton icon="i-lucide-rotate-cw" variant="soft" @click="load">
          Reintentar
        </UButton>
      </div>
    </div>

    <div v-else class="space-y-6 p-4">
      <div class="space-y-4">
        <!-- <UUser
          name="Cliente"
          :description="clienteLabel"
          :avatar="{
            icon: 'i-lucide-user',
          }"
        />
        <UUser
          name="Fecha"
          :description="formatDate(detalleVenta?.created_at)"
          :avatar="{
            icon: 'i-lucide-calendar',
          }"
        />
        <UUser
          name="Método de pago"
          :description="detalleVenta?.metodos_pago.nombre ?? '—'"
          :avatar="{
            icon: `${detalleVenta?.metodos_pago.icon}`,
          }"
        /> -->
        <div>
          <p class="text-xs text-muted">Cliente</p>
          <p class="font-medium truncate">{{ clienteLabel }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Fecha</p>
          <p class="font-medium">
            {{ formatDate(detalleVenta?.created_at) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-muted">Método de pago</p>
          <p class="font-medium">
            {{ detalleVenta?.metodos_pago.nombre ?? "—" }}
          </p>
        </div>
      </div>

      <!-- Items -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold">Items</h4>
          <UBadge variant="subtle" color="neutral">
            {{ items.length }} item(s)
          </UBadge>
        </div>

        <UCard class="p-0">
          <div class="divide-y divide-(--ui-border)">
            <div
              v-for="it in items"
              :key="it.id"
              class="p-4 flex items-start justify-between gap-4"
            >
              <div class="min-w-0 space-y-1">
                <p class="font-medium truncate">
                  {{ it?.articulos?.nombre ?? "Artículo" }}
                </p>
                <p class="text-xs text-muted) font-mono">
                  {{ it?.articulos?.codigo ?? "—" }} ·
                  {{ it?.articulos?.unidad_medida ?? "—" }}
                </p>

                <div class="text-sm text-muted)">
                  Cantidad:
                  <span class="text-(--ui-text) font-medium">
                    {{ it.cantidad }}
                  </span>
                  · Unit:
                  <span class="text-(--ui-text) font-medium">
                    {{ formatCurrency(it.precio_unitario) }}
                  </span>
                  <span v-if="Number(it.descuento ?? 0) > 0">
                    · Desc:
                    <span class="text-(--ui-text) font-medium">
                      {{ formatCurrency(it.descuento) }}
                    </span>
                  </span>
                </div>
              </div>

              <div class="text-right shrink-0">
                <p class="text-xs text-muted)">Total</p>
                <p class="font-semibold">{{ formatCurrency(it.total) }}</p>
                <p class="text-xs text-muted)">
                  Sub: {{ formatCurrency(it.subtotal) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Notas -->
      <div v-if="detalleVenta?.notas" class="space-y-2">
        <h4 class="font-semibold">Notas</h4>
        <UCard class="p-0">
          <div class="p-4 text-sm">{{ detalleVenta.notas }}</div>
        </UCard>
      </div>

      <!-- Resumen -->
      <UCard class="p-0">
        <div class="p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted)">Subtotal</span>
            <span class="font-medium">{{
              formatCurrency(resumen.subtotal)
            }}</span>
          </div>

          <div class="flex justify-between text-sm">
            <span class="text-muted)">Descuento</span>
            <span class="font-medium">{{
              formatCurrency(resumen.descuento)
            }}</span>
          </div>

          <div class="h-px bg-(--ui-border) my-2" />

          <div class="flex justify-between">
            <span class="font-semibold">Total</span>
            <span class="font-semibold">{{
              formatCurrency(resumen.total)
            }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="close">
          Cerrar
        </UButton>
      </div>
    </template>
  </UCard>
</template>
