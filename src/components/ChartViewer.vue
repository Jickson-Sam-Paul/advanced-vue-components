<template>
  <section class="chart-shell">
    <div class="chart-frame" :style="{ height: `${height}px` }">
      <div ref="plotRef" class="plot" />
      <p v-if="isLoading" class="loading">Rendering chart...</p>
      <p v-else-if="error" class="error">{{ error }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = withDefaults(
  defineProps<{
    data: Array<Record<string, unknown>>;
    layout?: Record<string, unknown>;
    config?: Record<string, unknown>;
    height?: number;
    debounceMs?: number;
    useResizeHandler?: boolean;
  }>(),
  {
    height: 420,
    debounceMs: 0,
    useResizeHandler: true
  }
);

const plotRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const error = ref('');
let isPlotted = false;
let resizeHandler: (() => void) | null = null;
let scheduledTimer: number | null = null;

async function renderPlot() {
  try {
    await nextTick();
    const element = plotRef.value;
    if (!element) return;

    if (!props.data || props.data.length === 0) {
      isLoading.value = false;
      error.value = 'No chart data provided.';
      return;
    }

    isLoading.value = true;
    error.value = '';

    const finalConfig = {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ['zoom2d', 'select2d', 'lasso2d', 'resetScale2d'],
      ...props.config
    };

    const finalLayout = {
      font: { family: 'Manrope, sans-serif' },
      margin: { t: 50, r: 16, b: 40, l: 42 },
      ...(props.layout ?? {})
    };

    if (!isPlotted) {
      await (Plotly as any).newPlot(element, props.data, finalLayout, finalConfig);
      isPlotted = true;
    } else {
      await (Plotly as any).react(element, props.data, finalLayout, finalConfig);
    }

    isLoading.value = false;
  } catch {
    isLoading.value = false;
    error.value = 'Unable to render chart with the provided data.';
  }
}

function scheduleRender() {
  if (scheduledTimer !== null) {
    window.clearTimeout(scheduledTimer);
  }
  const delay = props.debounceMs ?? 0;
  if (delay > 0) {
    scheduledTimer = window.setTimeout(() => {
      scheduledTimer = null;
      void renderPlot();
    }, delay);
  } else {
    void renderPlot();
  }
}

onMounted(() => {
  scheduleRender();

  if (props.useResizeHandler) {
    resizeHandler = () => {
      const element = plotRef.value;
      if (element) (Plotly as any).Plots.resize(element);
    };
    window.addEventListener('resize', resizeHandler);
  }
});

watch(
  () => [props.data, props.layout, props.config],
  () => {
    scheduleRender();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (scheduledTimer !== null) {
    window.clearTimeout(scheduledTimer);
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  const element = plotRef.value;
  if (element && isPlotted) {
    (Plotly as any).purge(element);
    isPlotted = false;
  }
});
</script>

<style scoped>
.chart-shell {
  width: min(940px, 95vw);
}

.chart-frame {
  position: relative;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.plot {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.loading,
.error {
  position: absolute;
  inset: 0;
  margin: 0;
  display: grid;
  place-content: center;
  font: 600 14px/1.2 var(--sans);
  background: #ffffffd0;
}

.error { color: var(--danger); }
</style>
