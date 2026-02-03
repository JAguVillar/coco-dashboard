<script setup>
// Redirige automáticamente a /home
navigateTo("/home", { replace: true });
</script>

<template>
  <!-- Opcional: mostrar un loading mientras redirecciona -->
  <div class="flex items-center justify-center min-h-screen">
    <p>Redirigiendo...</p>
  </div>
</template>
