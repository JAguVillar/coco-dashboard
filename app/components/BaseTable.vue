<script setup>
const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: "Sin resultados" },

  // pagination
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  showPagination: { type: Boolean, default: false },
});

const emit = defineEmits(["update:page", "update:pageSize"]);

const pageCount = computed(() =>
  props.pageSize > 0 ? Math.ceil(props.total / props.pageSize) : 1,
);
</script>

<template>
  <div class="space-y-3">
    <UTable :data="rows" :columns="columns" :loading="loading" class="flex-1" />

    <div
      v-if="!loading && rows.length === 0"
      class="py-6 text-center text-sm text-gray-500"
    >
      {{ emptyText }}
    </div>

    <div
      v-if="showPagination && !loading"
      class="flex items-center justify-between"
    >
      <div class="text-sm text-(--ui-text-muted)">
        Mostrando
        <span class="font-medium">{{ rows.length }}</span>
        de
        <span class="font-medium">{{ total }}</span>
      </div>

      <div class="flex items-center gap-3">
        <!-- opcional: selector de pageSize -->
        <USelect
          :model-value="pageSize"
          :options="
            [10, 20, 50].map((n) => ({ label: `${n} / pág`, value: n }))
          "
          size="sm"
          class="w-28"
          @update:model-value="(v) => emit('update:pageSize', Number(v))"
        />

        <UPagination
          :page="page"
          :model-value="page"
          :total="total"
          :page-size="pageSize"
          @update:page="(p) => emit('update:page', p)"
          @update:model-value="(p) => emit('update:page', p)"
        />
      </div>
    </div>

    <slot name="footer" />
  </div>
</template>
