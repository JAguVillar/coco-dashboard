<script setup>
import * as z from "zod";
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);
const { createProduct } = useProducts();

const toast = useToast();
const submitting = ref(false);

const unidadesMedida = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "l", label: "Litros (l)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unidad", label: "Unidad" },
];

const schema = z.object({
  codigo: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  nombre: z
    .string({ required_error: "Ingresa el nombre" })
    .min(2, "El nombre es muy corto")
    .max(255, "El nombre es muy largo")
    .transform((v) => v.trim()),

  descripcion: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  categoria: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  unidad_medida: z.string({ required_error: "Selecciona la unidad de medida" }),

  es_fraccionable: z.boolean(),

  stock_actual: z.preprocess(
    (v) => {
      if (v === "" || v == null) return 0;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        required_error: "Ingresa el stock actual",
        invalid_type_error: "Stock inválido",
      })
      .nonnegative("El stock debe ser mayor o igual a 0"),
  ),

  stock_minimo: z.preprocess(
    (v) => {
      if (v === "" || v == null) return 0;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Stock mínimo inválido",
      })
      .nonnegative("El stock mínimo debe ser mayor o igual a 0")
      .default(0),
  ),

  precio_compra: z.preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Precio de compra inválido",
      })
      .nonnegative("El precio debe ser mayor o igual a 0")
      .nullable(),
  ),

  precio_venta_por_unidad: z.preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Precio de venta inválido",
      })
      .nonnegative("El precio debe ser mayor o igual a 0")
      .nullable(),
  ),

  proveedor: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  ubicacion: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  activo: z.boolean(),
});

const state = reactive({
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  unidad_medida: "kg",
  es_fraccionable: true,
  stock_actual: "",
  stock_minimo: "",
  precio_compra: "",
  precio_venta_por_unidad: "",
  proveedor: "",
  ubicacion: "",
  activo: true,
});

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;

  try {
    const parsed = schema.parse(state);

    const payloadDB = {
      codigo: parsed.codigo,
      nombre: parsed.nombre,
      descripcion: parsed.descripcion,
      categoria: parsed.categoria,
      unidad_medida: parsed.unidad_medida,
      es_fraccionable: parsed.es_fraccionable,
      stock_actual: parsed.stock_actual,
      stock_minimo: parsed.stock_minimo,
      precio_compra: parsed.precio_compra,
      precio_venta_por_unidad: parsed.precio_venta_por_unidad,
      proveedor: parsed.proveedor,
      ubicacion: parsed.ubicacion,
      activo: parsed.activo,
    };

    console.log("Payload a enviar:", payloadDB); // Para debug

    const createdArticulo = await createProduct(payloadDB);

    emit("created", createdArticulo);

    toast.add({
      title: "Artículo creado",
      description: "Se guardó correctamente",
      color: "success",
    });

    emit("close");
  } catch (e) {
    console.error(e);

    const zodMessage =
      e?.issues?.[0]?.message || e?.errors?.[0]?.message || null;

    const msg = zodMessage || "No se pudo crear el artículo.";

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
        <h3 class="font-semibold">Nuevo artículo</h3>
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
      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Código" name="codigo">
          <UInput
            v-model="state.codigo"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Nombre" name="nombre" required>
          <UInput
            v-model="state.nombre"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Descripción" name="descripcion">
        <UTextarea
          v-model="state.descripcion"
          :disabled="submitting"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Categoría" name="categoria">
          <UInput
            v-model="state.categoria"
            :disabled="submitting"
            placeholder="Ej: Cereales, Semillas, etc."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Unidad de medida" name="unidad_medida" required>
          <USelect
            v-model="state.unidad_medida"
            :options="unidadesMedida"
            option-attribute="label"
            value-attribute="value"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        label="Es fraccionable"
        name="es_fraccionable"
        hint="¿Se vende por peso/volumen?"
      >
        <USwitch v-model="state.es_fraccionable" :disabled="submitting" />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Stock actual" name="stock_actual" required>
          <UInput
            v-model="state.stock_actual"
            type="number"
            step="0.001"
            min="0"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Stock mínimo" name="stock_minimo">
          <UInput
            v-model="state.stock_minimo"
            type="number"
            step="0.001"
            min="0"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Precio de compra" name="precio_compra">
          <UInput
            v-model="state.precio_compra"
            type="number"
            step="0.01"
            min="0"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Precio de venta por unidad"
          name="precio_venta_por_unidad"
        >
          <UInput
            v-model="state.precio_venta_por_unidad"
            type="number"
            step="0.01"
            min="0"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <UFormField label="Proveedor" name="proveedor">
          <UInput
            v-model="state.proveedor"
            :disabled="submitting"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Ubicación" name="ubicacion">
          <UInput
            v-model="state.ubicacion"
            :disabled="submitting"
            placeholder="Ej: Estante A3"
            class="w-full"
          />
        </UFormField>
      </div>

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
