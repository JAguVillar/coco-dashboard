<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="flex items-center gap-2 px-2 py-3">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold"
    >
      C
    </div>
    <span v-if="!collapsed" class="font-semibold truncate"> Coco Dashboard </span>
  </div>
</template>
