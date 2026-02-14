<template>
  <section class="viewer-shell">
    <ul class="tree-root">
      <JsonViewerNode
        v-for="(item, idx) in parsedItems"
        :key="`${item.title}-${idx}`"
        :node="item"
        :depth="0"
      />
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import JsonViewerNode from './JsonViewerNode.vue';

interface TreeNode {
  title: string;
  children?: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    defaultValue?: unknown;
    data?: unknown;
  }>(),
  {
    defaultValue: undefined,
    data: undefined
  }
);

const sourceValue = computed(() => (props.defaultValue !== undefined ? props.defaultValue : props.data));

const parseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const traverse = (value: any, key?: string): TreeNode | TreeNode[] => {
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    const parsedString = parseJson(value.toString());
    if (typeof parsedString === 'object' && parsedString !== null) {
      const traversedObject = traverse(parsedString);
      return {
        title: key || '',
        children: Array.isArray(traversedObject) ? traversedObject : [traversedObject]
      };
    }

    return {
      title: `${key ? `${key}: ` : ''}${value}`
    };
  }

  const children: TreeNode[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const childNodes = traverse(item, index.toString());
      if (Array.isArray(childNodes)) children.push(...childNodes);
      else children.push(childNodes);
    });
  } else if (typeof value === 'object' && value !== null) {
    Object.keys(value).forEach((childKey) => {
      const childNode = traverse(value[childKey], childKey);
      if (Array.isArray(childNode)) {
        if (childNode.length > 0 && childNode[0].title) {
          children.push({ title: childKey, children: childNode });
        } else {
          children.push(...childNode);
        }
      } else {
        children.push(childNode);
      }
    });
  }

  if (key) {
    return { title: key, children };
  }

  return children;
};

const parsedItems = computed<TreeNode[]>(() => {
  const source = sourceValue.value;
  if (source === undefined || source === null) return [];

  const result = traverse(source);
  return Array.isArray(result) ? result : [result];
});
</script>

<style scoped>
.viewer-shell {
  width: 100%;
  display: flex;
  overflow: auto;
  background: transparent;
  padding: 10px 14px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.tree-root {
  margin: 0;
  padding: 0;
}
</style>
