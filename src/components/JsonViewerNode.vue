<template>
  <li class="json-node">
    <div
      class="node-row"
      :class="{ clickable: hasChildren }"
      role="button"
      tabindex="0"
      @click="toggle"
      @keydown.enter="toggle"
      @keydown.space.prevent="toggle"
    >
      <span class="arrow" :class="{ hidden: !hasChildren }">{{ isOpen ? '▾' : '▸' }}</span>

      <span class="json-key">
        {{ parsed.first }}
      </span>

      <span v-if="parsed.last !== undefined && parsed.last !== ''" class="sep">:</span>

      <span
        class="json-value"
        :class="valueType"
        :title="parsed.last !== undefined ? String(parsed.last) : ''"
      >
        <span
          v-if="typeof parsed.last === 'string'"
          class="string-markdown"
        >
          <span>"</span>
          <span v-html="renderInlineMarkdown(parsed.last)" />
          <span>"</span>
        </span>
        <span v-else-if="parsed.last !== undefined">{{ parsed.last }}</span>
      </span>
    </div>

    <ul v-if="hasChildren && isOpen" class="children">
      <JsonViewerNode
        v-for="(child, idx) in node.children"
        :key="`${child.title}-${idx}`"
        :node="child"
        :depth="depth + 1"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

interface TreeNode {
  title: string;
  children?: TreeNode[];
}

const props = defineProps<{
  node: TreeNode;
  depth: number;
}>();

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const hasChildren = computed(() => Array.isArray(props.node.children) && props.node.children.length > 0);
const isOpen = ref(props.depth < 1);

const parseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parsed = computed(() => {
  const parts = props.node.title.split(':');
  if (parts.length === 2) {
    return { first: parts[0].trim(), last: parseJson(parts[1].trim()) };
  }
  if (parts.length > 2) {
    return { first: parts[0].trim(), last: parseJson(parts.slice(1).join(':').trim()) };
  }
  return { first: parts[0].trim(), last: undefined as unknown as string | undefined };
});

const valueType = computed(() => {
  if (parsed.value.last === null) return 'null';
  if (typeof parsed.value.last === 'number') return 'number';
  if (typeof parsed.value.last === 'boolean') return 'boolean';
  if (Array.isArray(parsed.value.last)) return 'array';
  return '';
});

function toggle() {
  if (!hasChildren.value) return;
  isOpen.value = !isOpen.value;
}

function renderInlineMarkdown(text: string) {
  return DOMPurify.sanitize(md.renderInline(text));
}
</script>

<style scoped>
.json-node {
  list-style: none;
  margin-left: 15px;
}

.node-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 5px;
  user-select: none;
  outline: none;
}

.node-row.clickable {
  cursor: pointer;
}

.node-row.clickable:hover,
.node-row.clickable:focus {
  background: #f2f4f7;
}

.arrow {
  width: 18px;
  color: #6b7280;
  line-height: 1.2;
}

.arrow.hidden {
  visibility: hidden;
}

.json-key {
  font: 500 0.875rem/1.5 var(--sans);
  color: #5d2f86;
}

.sep {
  color: #6b7280;
  margin: 0 4px;
}

.json-value {
  font: 500 0.875rem/1.5 var(--sans);
  color: #1f2937;
  word-break: break-word;
}

.json-value.number {
  color: #1e5fae;
}

.json-value.boolean {
  color: #b55b11;
}

.json-value.null,
.json-value.array {
  color: #6b7280;
}

.string-markdown :deep(p) {
  margin: 0;
}

.children {
  margin: 0;
  padding-left: 0;
}
</style>
