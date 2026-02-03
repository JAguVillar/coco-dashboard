<script setup>
import * as z from "zod";
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);
const { createCategoria } = useCategorias();

const toast = useToast();
const submitting = ref(false);

const schema = z.object({
  nombre: z
    .string({ required_error: "Ingresa el nombre" })
    .min(2, "El nombre es muy corto")
    .max(100, "El nombre es muy largo")
    .transform((v) => v.trim()),

  descripcion: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  activo: z.boolean(),
});

const state = reactive({
  nombre: "",
  descripcion: "",
  activo: true,
});

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;

  try {
    const parsed = schema.parse(state);

    const payloadDB = {
      nombre: parsed.nombre,
      descripcion: parsed.descripcion,
      activo: parsed.activo,
    };

    const createdCategoria = await createCategoria(payloadDB);

    emit("created", createdCategoria);

    toast.add({
      title: "Categoría creada",
      description: "Se guardó correctamente",
      color: "success",
    });

    emit("close");
  } catch (e) {
    console.error(e);

    const zodMessage =
      e?.issues?.[0]?.message || e?.errors?.[0]?.message || null;

    const msg = zodMessage || "No se pudo crear la categoría.";

    toast.add({
      title: "Error",
      description: msg,
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">Nueva categoría</h3>
        <UButton
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          :disabled="submitting"
          @click="$emit('close')"
        />
      </div>
    </template>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Nombre" name="nombre" required>
        <UInput
          v-model="state.nombre"
          :disabled="submitting"
          class="w-full"
          placeholder="Ej: Cereales, Semillas, etc."
        />
      </UFormField>

      <UFormField label="Descripción" name="descripcion">
        <UTextarea
          v-model="state.descripcion"
          :disabled="submitting"
          class="w-full"
          placeholder="Descripción opcional de la categoría..."
        />
      </UFormField>

      <UFormField label="Activo" name="activo">
        <USwitch v-model="state.activo" :disabled="submitting" />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="submitting"
          @click="$emit('close')"
        >
          Cancelar
        </UButton>
        <UButton type="submit" :loading="submitting"> Guardar </UButton>
      </div>
    </UForm>
  </UCard>
</template>
