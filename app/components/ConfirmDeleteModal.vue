<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "Eliminar" },
  itemName: { type: String, default: "este elemento" },
  deleting: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open", "confirm", "cancel"]);

function onCancel() {
  emit("cancel");
  emit("update:open", false);
}

function onConfirm() {
  emit("confirm");
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ title }}</h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              :disabled="deleting"
              @click="onCancel"
            />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm">
            ¿Seguro que querés eliminar
            <span class="font-medium">{{ itemName }}</span>?
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
              @click="onCancel"
            >
              Cancelar
            </UButton>

            <UButton color="error" :loading="deleting" @click="onConfirm">
              Eliminar
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
