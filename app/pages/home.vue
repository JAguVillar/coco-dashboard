<script setup>
import { computed, ref } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const baseStats = [
  { title: "Clientes", icon: "i-lucide-users" },
  { title: "Ventas", icon: "i-lucide-chart-pie" },
  { title: "Ingresos", icon: "i-lucide-circle-dollar-sign" },
  { title: "Pedidos", icon: "i-lucide-shopping-cart" },
];

/** -------------------------
 *  Ventas últimos 3 meses
 *  ------------------------- */

// 1) Mock data (reemplazar por API)
const salesLast3Months = ref([
  { month: "Ene", qty: 120, amount: 450000 },
  { month: "Feb", qty: 160, amount: 610000 },
  { month: "Mar", qty: 140, amount: 520000 },
]);

// 2) Toggle: "qty" | "amount"
const metric = ref("qty"); // default: cantidad

const metricLabel = computed(() =>
  metric.value === "qty" ? "Cantidad" : "Monto ($)",
);

const totalLabel = computed(() =>
  metric.value === "qty" ? "Total (3M)" : "Total (3M)",
);

function formatCurrency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatNumber(n) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const totalValue = computed(() => {
  const rows = salesLast3Months.value ?? [];
  if (metric.value === "qty")
    return formatNumber(rows.reduce((acc, r) => acc + (r.qty || 0), 0));
  return formatCurrency(rows.reduce((acc, r) => acc + (r.amount || 0), 0));
});

const chartData = computed(() => {
  const rows = salesLast3Months.value ?? [];
  return {
    labels: rows.map((r) => r.month),
    datasets: [
      {
        label: metricLabel.value,
        data: rows.map((r) => (metric.value === "qty" ? r.qty : r.amount)),
        // No fijo colores para respetar tu theme; Chart.js toma defaults
        backgroundColor: "#f87979",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };
});

const chartOptions = computed(() => {
  const isAmount = metric.value === "amount";
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.raw ?? 0;
            return isAmount ? formatCurrency(v) : `${formatNumber(v)} ventas`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => (isAmount ? formatCurrency(v) : formatNumber(v)),
        },
      },
    },
  };
});

/** -------------------------
 *  Alertas (tu código)
 *  ------------------------- */
const expiringItems = [
  {
    id: 1,
    name: "Yogur Frutilla 190g",
    detail: "Vence: 12/02/2026",
    meta: "Vence en 3 días",
    tone: "error",
  },
  {
    id: 2,
    name: "Leche Entera 1L",
    detail: "Vence: 15/02/2026",
    meta: "Vence en 6 días",
    tone: "warning",
  },
  {
    id: 3,
    name: "Crema 250ml",
    detail: "Vence: 18/02/2026",
    meta: "Vence en 9 días",
    tone: "neutral",
  },
];

const lowStockItems = [
  {
    id: 11,
    name: "Yerba 500g",
    detail: "Mínimo: 10",
    meta: "Quedan 2 u.",
    tone: "warning",
  },
  {
    id: 12,
    name: "Azúcar 1kg",
    detail: "Mínimo: 8",
    meta: "Quedan 1 u.",
    tone: "error",
  },
  {
    id: 13,
    name: "Galletitas",
    detail: "Mínimo: 12",
    meta: "Quedan 4 u.",
    tone: "warning",
  },
];

const kpiCards = [
  {
    key: "expiring",
    title: "Productos prontos a vencer",
    icon: "i-lucide-alarm-clock",
    items: expiringItems,
    ctaLabel: "Ver todos",
    to: "/productos?view=vencimientos",
    empty: "No hay productos próximos a vencer 🎉",
  },
  {
    key: "lowStock",
    title: "Productos con bajo stock",
    icon: "i-lucide-package-minus",
    items: lowStockItems,
    ctaLabel: "Ver todos",
    to: "/productos?view=stock-bajo",
    empty: "No hay productos con stock bajo 🙌",
  },
];

function badgeFor(item) {
  const color =
    item.tone === "error" ? "red" : item.tone === "warning" ? "amber" : "gray";
  return { color, label: item.meta };
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- KPIs top -->
    <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
      <UPageCard
        v-for="(stat, index) in baseStats"
        :key="index"
        :icon="stat.icon"
        :title="stat.title"
        to="/clientes"
        variant="subtle"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading:
            'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-md uppercase',
        }"
        class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
      >
        <div class="flex items-center gap-2">
          <span class="text-4xl font-semibold text-highlighted">897</span>
        </div>
      </UPageCard>
    </UPageGrid>

    <USeparator />

    <!-- Ventas (últimos 3 meses): chart + mini tabla -->
    <UCard class="overflow-hidden">
      <template #header>
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <h3 class="text-base font-medium text-highlighted truncate">
              Ventas (últimos 3 meses)
            </h3>
            <p class="text-sm text-muted">
              Alterná entre cantidad y monto para ver tendencia y totales.
            </p>
          </div>

          <div class="flex items-center gap-3 justify-between sm:justify-end">
            <!-- Toggle Cantidad / Monto -->
            <UButtonGroup size="md">
              <UButton
                :variant="metric === 'qty' ? 'solid' : 'subtle'"
                @click="metric = 'qty'"
              >
                Cantidad
              </UButton>
              <UButton
                :variant="metric === 'amount' ? 'solid' : 'subtle'"
                @click="metric = 'amount'"
              >
                Monto $
              </UButton>
            </UButtonGroup>

            <div class="text-right">
              <p class="text-xs text-muted">{{ totalLabel }}</p>
              <p class="text-base font-semibold text-highlighted">
                {{ totalValue }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4 sm:p-6">
        <!-- Chart -->
        <div class="lg:col-span-3">
          <div class="h-64 sm:h-72">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Mini tabla (siempre visible) -->
        <div class="lg:col-span-2">
          <h4 class="text-sm font-medium text-highlighted mb-3">
            Resumen por mes
          </h4>

          <div
            class="divide-y divide-default rounded-lg border border-default overflow-hidden"
          >
            <div class="grid grid-cols-3 gap-2 px-4 py-3 text-sm text-muted">
              <span>Mes</span>
              <span class="text-right">Cantidad</span>
              <span class="text-right">Monto</span>
            </div>

            <div
              v-for="row in salesLast3Months"
              :key="row.month"
              class="grid grid-cols-3 gap-2 px-4 py-4"
            >
              <span class="text-base font-semibold text-highlighted">
                {{ row.month }}
              </span>
              <span class="text-base text-right text-highlighted">
                {{ formatNumber(row.qty) }}
              </span>
              <span class="text-base text-right text-highlighted">
                {{ formatCurrency(row.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end px-2">
          <UButton
            to="/ventas"
            variant="ghost"
            icon="i-lucide-arrow-right"
            trailing
            size="md"
          >
            Ver reporte
          </UButton>
        </div>
      </template>
    </UCard>

    <USeparator />

    <!-- Critical panels -->
    <UPageGrid class="lg:grid-cols-2 gap-4 sm:gap-6">
      <UCard v-for="card in kpiCards" :key="card.key" class="overflow-hidden">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon :name="card.icon" class="text-primary" />
              <h3 class="text-base font-medium text-highlighted truncate">
                {{ card.title }}
              </h3>
            </div>

            <UBadge :label="String(card.items?.length ?? 0)" variant="subtle" />
          </div>
        </template>

        <!-- Body -->
        <div v-if="card.items?.length" class="divide-y divide-default">
          <ul role="list">
            <li
              v-for="item in card.items.slice(0, 5)"
              :key="item.id"
              class="flex items-center justify-between gap-4 py-4 px-4 sm:px-6"
            >
              <div class="min-w-0">
                <p class="text-base font-semibold text-highlighted truncate">
                  {{ item.name }}
                </p>
                <p class="text-sm text-muted truncate">
                  {{ item.detail }}
                </p>
              </div>

              <UBadge
                class="shrink-0 text-sm px-2.5 py-1"
                variant="soft"
                :color="badgeFor(item).color"
                :label="badgeFor(item).label"
              />
            </li>
          </ul>
        </div>

        <!-- Empty state -->
        <div v-else class="px-4 sm:px-6 py-8">
          <p class="text-sm text-muted">
            {{ card.empty }}
          </p>
        </div>

        <template #footer>
          <div class="flex items-center justify-end px-2">
            <UButton
              :to="card.to"
              variant="ghost"
              icon="i-lucide-arrow-right"
              trailing
              size="md"
            >
              {{ card.ctaLabel }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UPageGrid>
  </div>
</template>
