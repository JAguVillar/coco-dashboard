<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const toast = useToast();

const loading = ref(false);

// Obtener iniciales del email para el avatar
const userInitials = computed(() => {
  if (!user.value?.email) return "?";
  return user.value.email.charAt(0).toUpperCase();
});

// Items del dropdown menu
const items = computed(() => [
  [
    {
      label: user.value?.email || "Usuario",
      slot: "account",
      disabled: true,
    },
  ],
  [
    {
      label: "Cerrar sesión",
      icon: "i-lucide-log-out",
      onSelect: handleLogout,
    },
  ],
]);

async function handleLogout() {
  loading.value = true;

  const { error } = await supabase.auth.signOut();

  loading.value = false;

  if (error) {
    toast.add({
      title: "Error al cerrar sesión",
      description: error.message,
      color: "red",
    });
    return;
  }

  toast.add({
    title: "Sesión cerrada",
    description: "Hasta pronto!",
  });

  await router.push("/login");
}
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      :loading="loading"
      color="neutral"
      variant="ghost"
      :square="collapsed"
      :block="!collapsed"
      :class="collapsed ? '' : 'justify-start'"
    >
      <UAvatar :text="userInitials" size="sm" />
      <span v-if="!collapsed" class="truncate">
        {{ user?.email || "Usuario" }}
      </span>
    </UButton>

    <template #account>
      <div class="flex flex-col gap-0.5 px-2 py-1.5">
        <p class="text-sm font-medium text-highlighted truncate">
          {{ user?.email }}
        </p>
        <p class="text-xs text-muted">Sesión activa</p>
      </div>
    </template>
  </UDropdownMenu>
</template>
