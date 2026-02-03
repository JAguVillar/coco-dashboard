<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  open: { type: Boolean, default: false },
  calendarEvent: { type: Object, default: null },
  widthClass: { type: String, default: "max-w-none w-[420px] sm:w-[520px]" },
  title: { type: String, default: "Detalle del turno" },
  deleting: { type: Boolean, default: false },
})

const emit = defineEmits(["update:open", "delete"])

const openAddItem = ref(false)
const openConfirmDelete = ref(false)
const openConfirmCheckOut = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
})

function close() {
  isOpen.value = false
}

function onDelete() {
  openConfirmDelete.value = true
}

function onCheckOut() {
  openConfirmCheckOut.value = true
}

function cancelDelete() {
  openConfirmDelete.value = false
}

async function confirmDelete() {
  openConfirmDelete.value = false
  emit("delete", props.calendarEvent)
}

// Placeholder: acá va tu lógica real de checkout/cierre
async function confirmCheckout() {
  openConfirmCheckOut.value = false
  // TODO: close tab / marcar estado / etc
}

/** helpers */
function stripBracketTz(v) {
  if (!v) return v
  const s = String(v)
  const idx = s.indexOf("[")
  return idx >= 0 ? s.slice(0, idx) : s
}

function toDateSafe(v) {
  if (!v) return null
  const cleaned = stripBracketTz(v)
  const d = new Date(cleaned)
  return Number.isNaN(d.getTime()) ? null : d
}

const turnoId = computed(() => props.calendarEvent?.id || null)
const eventTitle = computed(() => props.calendarEvent?.title || "Turno")

const startAny = computed(() => props.calendarEvent?.start_at ?? props.calendarEvent?.start ?? null)
const endAny = computed(() => props.calendarEvent?.end_at ?? props.calendarEvent?.end ?? null)

const courtName = computed(() => {
  // nuevo: viene court { name }
  if (props.calendarEvent?.court?.name) return props.calendarEvent.court.name
  // viejo: schedule-x: calendarId (slug)
  return props.calendarEvent?.calendarId || ""
})

const subtitle = computed(() => {
  const start = toDateSafe(startAny.value)
  const end = toDateSafe(endAny.value)
  if (!start || !end) return ""

  const dateStr = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(start)
  const timeFmt = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })

  return `${dateStr} · ${timeFmt.format(start)} — ${timeFmt.format(end)}`
})

// -------------------
// Tabs auto-load
// -------------------
const {
  loading: tabsLoading,
  loadTabBundleByTurnoId,
  getOrCreateTabForTurno,
  addProductItem,
} = useTabs()

const tab = ref(null)
const items = ref([])

async function loadBundle() {
  tab.value = null
  items.value = []

  if (!turnoId.value) return

  const bundle = await loadTabBundleByTurnoId(turnoId.value)
  tab.value = bundle.tab
  items.value = bundle.items || []
}

async function onCreateTab() {
  if (!turnoId.value) return

  await getOrCreateTabForTurno({ turnoId: turnoId.value })
  await loadBundle()
}

async function handleAddItem({ productId, qty }) {
  if (!tab.value?.id) return

  await addProductItem({
    tabId: tab.value.id,
    productId,
    qty,
  })

  await loadBundle()
}

// -------------------
// WhatsApp helpers (SIN export)
// -------------------
function normalizePhoneForWaMe(phoneRaw) {
  if (!phoneRaw) return null
  const digits = String(phoneRaw).replace(/\D/g, "")
  if (!digits) return null
  if (digits.startsWith("54")) return digits
  return `549${digits}`
}

function formatDateTimeRange(calendarEvent) {
  const rawStart = calendarEvent?.start_at ?? calendarEvent?.start ?? null
  const rawEnd = calendarEvent?.end_at ?? calendarEvent?.end ?? null

  const start = toDateSafe(rawStart)
  const end = toDateSafe(rawEnd)

  if (!start || !end) {
    return { dateStr: "", from: "", to: "" }
  }

  const dateStr = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(start)
  const timeFmt = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return {
    dateStr,
    from: timeFmt.format(start),
    to: timeFmt.format(end),
  }
}


function buildWhatsappMessageFromTurno({ calendarEvent, tab, items = [] }) {
  const client = calendarEvent?.client
  const court = calendarEvent?.court
  const type = calendarEvent?.booking_type

  const clientName = client?.first_name || client?.full_name || null
  const headerName = clientName ? `Hola ${clientName}!` : "Hola!"

  const { dateStr, from, to } = formatDateTimeRange(calendarEvent)

  const title = calendarEvent?.title || null
  const t = title ? `📝 ${title}\n` : ""

  const itemsText = items.length
    ? items
      .map(
        (it) =>
          `• ${it.name_snapshot}: ${it.qty} × $${it.unit_price_snapshot} = $${it.line_total}`
      )
      .join("\n")
    : "• Sin consumos"

  const total = tab?.total ?? null
  const totalLine = total != null ? `\n\n💰 *Total: $${total}*` : ""

  // courtName: soporta court.name o calendarId
  const courtName = court?.name ?? calendarEvent?.calendarId ?? ""

  return (
    `👋 ${headerName}\n\n` +
    `🧾 *Detalle del turno*\n\n` +
    (dateStr ? `📅 ${dateStr}\n` : "") +
    (from && to ? `⏰ ${from} - ${to}\n` : "") +
    (courtName ? `🎾 Cancha: ${courtName}\n` : "") +
    (type?.name ? `🏷️ Tipo: ${type.name}\n` : "") +
    t +
    `\n📋 *Cuenta:*\n` +
    `${itemsText}` +
    totalLine +
    `\n\nCualquier cosa respondé este mensaje.`
  )
}

function openWhatsappWeb(phoneDigits, message) {
  const text = encodeURIComponent(message)
  const url = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${text}`
    : `https://wa.me/?text=${text}`

  window.open(url, "_blank", "noopener,noreferrer")
}

function onSendWhatsapp() {
  if (!props.calendarEvent || !tab.value) return

  const phoneDigits = props.calendarEvent?.meta?.client?.client?.phone

  const message = buildWhatsappMessageFromTurno({
    calendarEvent: props.calendarEvent,
    tab: tab.value,
    items: items.value,
  })

  openWhatsappWeb(phoneDigits, message)
}

// -------------------
// Computeds
// -------------------
const hasTab = computed(() => !!tab.value)
const tabSubtotal = computed(() => tab.value?.subtotal ?? 0)
const tabTotal = computed(() => tab.value?.total ?? 0)

watch(
  () => [isOpen.value, turnoId.value],
  async ([open]) => {
    if (!open) return
    await loadBundle()
  }
)
</script>

<template>
  <USlideover v-model:open="isOpen" side="right" :title="title" :ui="{ content: widthClass }">
    <span class="hidden" />

    <template #body>
      <div class="space-y-4">
        <div class="min-w-0">
          <h3 class="text-lg font-semibold truncate">{{ eventTitle }}</h3>
        </div>

        <div class="rounded-xl border border-default p-3 space-y-2 text-sm">
          <div v-if="subtitle" class="flex items-start gap-2">
            <span class="mt-0.5">🕒</span>
            <span>{{ subtitle }}</span>
          </div>

          <div v-if="courtName" class="flex items-start gap-2">
            <span class="mt-0.5">🎾</span>
            <span>{{ courtName }}</span>
          </div>
        </div>

        <!-- CARD TAB / POS -->
        <UCard class="h-full">
          <template #header>
            <div v-if="!hasTab">
              <UButton label="Crear cuenta" icon="i-lucide-receipt" size="md" :loading="tabsLoading"
                :disabled="!turnoId" @click="onCreateTab" />
            </div>

            <div v-else class="flex items-center justify-between gap-3">
              <div class="text-sm text-muted">
                <span v-if="tabsLoading">Cargando cuenta…</span>
                <span v-else>Cuenta</span>
              </div>

              <div class="flex items-center gap-2">
                <UButton label="Enviar cuenta" icon="i-lucide-send" variant="outline" size="sm" :disabled="!hasTab"
                  @click="onSendWhatsapp" />

                <UButton label="Agregar consumo" icon="i-lucide-plus" size="sm" :disabled="!hasTab"
                  @click="openAddItem = true" />
              </div>
            </div>
          </template>

          <!-- Si existe tab: mostrás items + totales -->
          <div v-if="hasTab" class="space-y-3">
            <div class="text-xs text-muted">
              Tab: <span class="font-mono">{{ tab.id }}</span> · Estado:
              <span class="capitalize">{{ tab.status }}</span>
            </div>

            <div v-if="items.length === 0" class="text-sm text-muted">
              Sin consumos todavía.
            </div>

            <div v-else class="space-y-2">
              <div v-for="it in items" :key="it.id" class="flex items-center justify-between gap-3 text-sm">
                <div class="min-w-0">
                  <div class="truncate font-medium">{{ it.name_snapshot }}</div>
                  <div class="text-xs text-muted">
                    {{ it.qty }} × {{ it.unit_price_snapshot }}
                  </div>
                </div>
                <div class="font-medium">{{ it.line_total }}</div>
              </div>
            </div>

            <div class="border-t border-default pt-3 text-sm space-y-1">
              <div class="flex justify-between">
                <span class="text-muted">Subtotal</span>
                <span>{{ tabSubtotal }}</span>
              </div>
              <div class="flex justify-between font-semibold">
                <span>Total</span>
                <span>{{ tabTotal }}</span>
              </div>
            </div>
          </div>

          <div v-else class="text-sm text-muted">
            Creá una cuenta para registrar consumos del turno.
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <UButton color="error" variant="subtle" label="Eliminar" icon="i-lucide-trash-2"
          :disabled="!calendarEvent || deleting" :loading="deleting" @click="onDelete" size="lg" />
        <UButton label="Cerrar turno" icon="i-lucide-bookmark-x" @click="onCheckOut" size="lg" />
      </div>
    </template>
  </USlideover>

  <!-- Modal: Agregar consumo -->
  <UModal v-model:open="openAddItem">
    <template #content>
      <AddItemModal @add="handleAddItem" @close="openAddItem = false" />
    </template>
  </UModal>

  <!-- Confirm Delete -->
  <UModal v-model:open="openConfirmDelete">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Eliminar turno</h3>
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="openConfirmDelete = false" />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm">¿Seguro que querés eliminar el turno seleccionado?</p>
          <p class="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" color="neutral" :disabled="deleting" @click="cancelDelete">
              Cancelar
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Eliminar
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <!-- Confirm Checkout -->
  <UModal v-model:open="openConfirmCheckOut">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Cerrar turno</h3>
            <UButton icon="i-lucide-x" variant="ghost" color="neutral" @click="openConfirmCheckOut = false" />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm">¿Seguro que querés cerrar el turno seleccionado?</p>
          <p class="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" color="neutral" :disabled="deleting" @click="openConfirmCheckOut = false">
              Cancelar
            </UButton>

            <UButton color="error" :loading="deleting" @click="confirmCheckout">
              Cerrar
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
