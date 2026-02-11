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
    <div class="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <UTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        class="flex-1 min-w-[800px] sm:min-w-full"
      />
    </div>

    <div
      v-if="!loading && rows.length > 0"
      class="text-xs text-gray-500 text-center py-2 sm:hidden"
    >
      Deslizá para ver más →
    </div>

    <div
      v-if="!loading && rows.length === 0"
      class="py-6 text-center text-sm text-gray-500"
    >
      {{ emptyText }}
    </div>

    <div
      v-if="showPagination && !loading"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="text-sm text-(--ui-text-muted) text-center sm:text-left">
        Mostrando
        <span class="font-medium">{{ rows.length }}</span>
        de
        <span class="font-medium">{{ total }}</span>
      </div>

      <div class="flex items-center justify-center gap-3 sm:justify-end">
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
