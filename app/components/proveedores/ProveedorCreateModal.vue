<script setup>
import * as z from "zod";
import { useToast } from "#imports";

const emit = defineEmits(["close", "created"]);
const { createProveedor } = useProveedores();

const toast = useToast();
const submitting = ref(false);

const provincias = ref([
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
]);

const schema = z.object({
  nombre: z
    .string({ required_error: "Ingresa el nombre" })
    .min(2, "El nombre es muy corto")
    .max(255, "El nombre es muy largo")
    .transform((v) => v.trim()),

  razon_social: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  cuit: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim()))
    .refine(
      (v) => {
        if (!v) return true; // Optional
        // Formato XX-XXXXXXXX-X
        return /^\d{2}-\d{8}-\d{1}$/.test(v);
      },
      { message: "Formato de CUIT inválido (XX-XXXXXXXX-X)" },
    ),

  telefono: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  email: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim()))
    .refine(
      (v) => {
        if (!v) return true; // Optional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      { message: "Email inválido" },
    ),

  sitio_web: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  direccion: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  ciudad: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  provincia: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  codigo_postal: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  condicion_pago: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  descuento_habitual: z.preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Descuento inválido",
      })
      .min(0, "El descuento debe ser mayor o igual a 0")
      .max(100, "El descuento no puede ser mayor a 100")
      .nullable(),
  ),

  dias_entrega: z.preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      return typeof v === "string" ? parseInt(v.trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Días de entrega inválido",
      })
      .int("Debe ser un número entero")
      .nonnegative("Debe ser mayor o igual a 0")
      .nullable(),
  ),

  pedido_minimo: z.preprocess(
    (v) => {
      if (v === "" || v == null) return null;
      return typeof v === "string" ? parseFloat(v.replace(",", ".").trim()) : v;
    },
    z
      .number({
        invalid_type_error: "Pedido mínimo inválido",
      })
      .nonnegative("Debe ser mayor o igual a 0")
      .nullable(),
  ),

  nombre_contacto: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  telefono_contacto: z
    .string()
    .transform((v) => (v == null || v === "" ? null : v.trim())),

  notas: z.string().transform((v) => (v == null || v === "" ? null : v.trim())),

  activo: z.boolean(),
});

const state = reactive({
  nombre: "",
  razon_social: "",
  cuit: "",
  telefono: "",
  email: "",
  sitio_web: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  codigo_postal: "",
  condicion_pago: "",
  descuento_habitual: "",
  dias_entrega: "",
  pedido_minimo: "",
  nombre_contacto: "",
  telefono_contacto: "",
  notas: "",
  activo: true,
});

async function onSubmit() {
  if (submitting.value) return;
  submitting.value = true;

  try {
    const parsed = schema.parse(state);

    const payloadDB = {
      nombre: parsed.nombre,
      razon_social: parsed.razon_social,
      cuit: parsed.cuit,
      telefono: parsed.telefono,
      email: parsed.email,
      sitio_web: parsed.sitio_web,
      direccion: parsed.direccion,
      ciudad: parsed.ciudad,
      provincia: parsed.provincia,
      codigo_postal: parsed.codigo_postal,
      condicion_pago: parsed.condicion_pago,
      descuento_habitual: parsed.descuento_habitual,
      dias_entrega: parsed.dias_entrega,
      pedido_minimo: parsed.pedido_minimo,
      nombre_contacto: parsed.nombre_contacto,
      telefono_contacto: parsed.telefono_contacto,
      notas: parsed.notas,
      activo: parsed.activo,
    };

    const createdProveedor = await createProveedor(payloadDB);

    emit("created", createdProveedor);

    toast.add({
      title: "Proveedor creado",
      description: "Se guardó correctamente",
      color: "success",
    });

    emit("close");
  } catch (e) {
    console.error(e);

    const zodMessage =
      e?.issues?.[0]?.message || e?.errors?.[0]?.message || null;

    const msg = zodMessage || "No se pudo crear el proveedor.";

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
        <h3 class="font-semibold">Nuevo proveedor</h3>
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
      <!-- Información básica -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Información básica
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nombre" name="nombre" required>
            <UInput
              v-model="state.nombre"
              :disabled="submitting"
              class="w-full"
              placeholder="Ej: Cerealera del Norte"
            />
          </UFormField>

          <UFormField label="Razón Social" name="razon_social">
            <UInput
              v-model="state.razon_social"
              :disabled="submitting"
              class="w-full"
              placeholder="Ej: Cerealera del Norte S.A."
            />
          </UFormField>
        </div>

        <UFormField label="CUIT" name="cuit" hint="Formato: XX-XXXXXXXX-X">
          <UInput
            v-model="state.cuit"
            :disabled="submitting"
            class="w-full"
            placeholder="30-12345678-9"
          />
        </UFormField>
      </div>

      <!-- Contacto -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Contacto
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Teléfono" name="telefono">
            <UInput
              v-model="state.telefono"
              :disabled="submitting"
              class="w-full"
              placeholder="0385-4567890"
            />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              :disabled="submitting"
              class="w-full"
              type="email"
              placeholder="ventas@ejemplo.com"
            />
          </UFormField>
        </div>

        <UFormField label="Sitio Web" name="sitio_web">
          <UInput
            v-model="state.sitio_web"
            :disabled="submitting"
            class="w-full"
            placeholder="www.ejemplo.com.ar"
          />
        </UFormField>
      </div>

      <!-- Dirección -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Dirección
        </h4>

        <UFormField label="Dirección" name="direccion">
          <UInput
            v-model="state.direccion"
            :disabled="submitting"
            class="w-full"
            placeholder="Av. Belgrano 1234"
          />
        </UFormField>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="Provincia" name="provincia">
            <USelect
              v-model="state.provincia"
              :items="provincias"
              :disabled="submitting"
              class="w-full"
              placeholder="Seleccionar"
            />
          </UFormField>

          <UFormField label="Ciudad" name="ciudad">
            <UInput
              v-model="state.ciudad"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Código Postal" name="codigo_postal">
            <UInput
              v-model="state.codigo_postal"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Información comercial -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Información comercial
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Condición de pago" name="condicion_pago">
            <UInput
              v-model="state.condicion_pago"
              :disabled="submitting"
              class="w-full"
              placeholder="Ej: 30 días, Contado"
            />
          </UFormField>

          <UFormField label="Descuento habitual (%)" name="descuento_habitual">
            <UInput
              v-model="state.descuento_habitual"
              type="number"
              step="0.01"
              min="0"
              max="100"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Días de entrega" name="dias_entrega">
            <UInput
              v-model="state.dias_entrega"
              type="number"
              min="0"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Pedido mínimo ($)" name="pedido_minimo">
            <UInput
              v-model="state.pedido_minimo"
              type="number"
              step="0.01"
              min="0"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Contacto adicional -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Persona de contacto
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nombre" name="nombre_contacto">
            <UInput
              v-model="state.nombre_contacto"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Teléfono" name="telefono_contacto">
            <UInput
              v-model="state.telefono_contacto"
              :disabled="submitting"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Notas -->
      <UFormField label="Notas" name="notas">
        <UTextarea
          v-model="state.notas"
          :disabled="submitting"
          class="w-full"
          placeholder="Observaciones adicionales..."
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
