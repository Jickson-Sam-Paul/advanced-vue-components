<template>
  <button class="copy-btn" type="button" :title="copied ? copiedLabel : label" @click="copyValue">
    <span v-if="copied">{{ copiedLabel }}</span>
    <span v-else>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from './useClipboard';

const props = withDefaults(
  defineProps<{
    value: string;
    label?: string;
    copiedLabel?: string;
  }>(),
  {
    label: 'Copy',
    copiedLabel: 'Copied'
  }
);

const emit = defineEmits<{
  copied: [];
}>();

const { copied, copy } = useClipboard();
const label = computed(() => props.label);
const copiedLabel = computed(() => props.copiedLabel);

async function copyValue() {
  const ok = await copy(props.value);
  if (ok) emit('copied');
}
</script>

<style scoped>
.copy-btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 10px;
  font: 600 12px/1 var(--sans);
  background: white;
  color: var(--ink);
  cursor: pointer;
}

.copy-btn:hover { border-color: var(--brand); }
</style>
