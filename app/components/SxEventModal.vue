<script setup>
import { inject, computed } from "vue";

const props = defineProps({
  calendarEvent: { type: Object, required: true },
});

// handlers desde el padre (provide/inject)
const closeModal = inject("sxModalClose", null);
const deleteEvent = inject("sxDeleteEvent", null);
const open = ref(false);

function stripBracketTz(v) {
  if (!v) return v;
  const s = String(v);
  const idx = s.indexOf("[");
  return idx >= 0 ? s.slice(0, idx) : s;
}

function toDateSafe(v) {
  if (!v) return null;
  // ScheduleX a veces pasa ISO con [TimeZone] -> lo limpiamos
  const cleaned = stripBracketTz(v);
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? null : d;
}

const title = computed(() => props.calendarEvent?.title || "Turno");
const status = computed(() => props.calendarEvent?.meta || "");
const subtitle = computed(() => {
  const start = toDateSafe(props.calendarEvent?.start);
  const end = toDateSafe(props.calendarEvent?.end);

  if (!start || !end) return "";

  // Fecha “14 de enero de 2026”
  const dateStr = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
  }).format(start);

  // Hora “18:00”
  const timeFmt = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const from = timeFmt.format(start);
  const to = timeFmt.format(end);

  // “14 de enero de 2026 · 18:00 — 19:00”
  return `${dateStr} · ${from} — ${to}`;
});

const person = computed(() => {
  // Ajustá esto a tu modelo real si lo guardás en el evento
  return (
    props.calendarEvent?.people?.[0]?.name ||
    props.calendarEvent?.clientName ||
    "Agustin"
  );
});

const description = computed(() => {
  return props.calendarEvent?.description || props.calendarEvent?.notes || "";
});

const court = computed(() => {
  // suele venir calendarId como slug de cancha
  return props.calendarEvent?.calendarId || "";
});

async function onDelete() {
  const ok = confirm(
    `¿Eliminar "${title.value}"? Esta acción no se puede deshacer.`
  );
  if (!ok) return;
  await deleteEvent?.(props.calendarEvent);
}

function onClose() {
  closeModal?.();
}
</script>

<template>
  <!-- Importante: no inventamos card gigante; mantenemos look “lista” -->
  <div class="sx__event-modal__content shadow-2xl/50 p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex items-center gap-2">
        <h3 class="font-semibold truncate">
          {{ title }}
        </h3>
        <UModal v-model:open="open">
          <UBadge :icon="status.state.icon" size="md" :color="status.state.color" :label="status.state.name"> 
            <template #content>
              <TurnoCreateModal
                :initial-date="selectedDate"
                :initial-from="selectedFrom"
                :initial-to="selectedTo"
                @created="handleCreated"
                @close="open = false"
              />
            </template>
          </UBadge>
            </UModal>
      </div>

      <button
        type="button"
        class="sx__event-modal__close text-muted hover:text-foreground"
        aria-label="Cerrar"
        @click="onClose"
      >
        ✕
      </button>
    </div>

    <div class="mt-3 space-y-2 text-sm">
      <!-- Fecha / hora -->
      <div v-if="subtitle" class="flex items-start gap-2">
        <span class="mt-0.5">🕒</span>
        <span>{{ subtitle }}</span>
      </div>

      <!-- Persona -->
      <div v-if="person" class="flex items-start gap-2">
        <span class="mt-0.5">👤</span>
        <span>{{ person }}</span>
      </div>

      <!-- Descripción -->
      <div v-if="description" class="flex items-start gap-2">
        <span class="mt-0.5">📝</span>
        <span class="whitespace-pre-wrap">{{ description }}</span>
      </div>

      <!-- Cancha -->
      <div v-if="court" class="flex items-start gap-2">
        <span class="mt-0.5">🎾</span>
        <span>{{ court }}</span>
      </div>
    </div>

    <!-- Acciones abajo, sobrias -->
    <div class="mt-4 flex justify-end gap-2">
      <UButton
        label="Cerrar"
        variant="outline"
        size="md"
        color="subtle"
        @click="onClose"
      />
      <UButton
        label="Eliminar"
        icon="i-lucide-trash-2"
        color="error"
        size="md"
        @click="onDelete"
      />
    </div>
  </div>
</template>
