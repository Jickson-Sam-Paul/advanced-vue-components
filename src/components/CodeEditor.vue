<template>
  <div class="code-editor" :class="themeClass">
    <div v-if="showTitle" class="title-bar">
      <div class="selection-wrapper">
        <div v-if="languageSelection || languageList.length > 1">
          <select v-model="languageState" class="language-select" @change="handleLanguageChange">
            <option v-for="lang in languageList" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </div>
        <span v-else class="label">{{ languageState }}</span>

        <div class="actions">
          <div v-if="showThemeToggle" class="theme-toggle" role="group" aria-label="Theme toggle">
            <button
              class="theme-chip"
              :class="{ active: themeState === 'light' }"
              type="button"
              title="Light theme"
              @click="setTheme('light')"
            >
              ☀
            </button>
            <button
              class="theme-chip"
              :class="{ active: themeState === 'dark' }"
              type="button"
              title="Dark theme"
              @click="setTheme('dark')"
            >
              ☾
            </button>
          </div>

          <button class="content-copy" type="button" @click="copyContent">
            <span v-if="isContentCopied">Copied</span>
            <span v-else>Copy code</span>
          </button>
        </div>
      </div>
    </div>

    <div class="code-editor-wrapper">
      <div class="line-number-gutter" :class="{ hide: !showLineNumbers }">
        <div v-for="(_, index) in lines" :key="index">{{ index + 1 }}</div>
      </div>

      <div class="code-block-wrapper" tabindex="-1" @keydown.tab.prevent="insertSpaces">
        <pre :class="[`language-${prismLanguage}`, 'code-pre-block']" :style="{ height: editorHeight }">
<code ref="codeBlock" v-html="highlightedCode"></code>
<textarea
  v-if="!isReadonly"
  ref="codeTextarea"
  v-model="text"
  :aria-label="`${languageState} code block`"
  spellcheck="false"
  :placeholder="placeholder"
  @input="handleInputChange"
></textarea>
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import Prism from 'prismjs';
import 'prismjs/themes/prism.min.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import type { CodeLanguage } from '../types/componentTypes';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    language?: CodeLanguage;
    editable?: boolean;
    showTitle?: boolean;
    showLineNumbers?: boolean;
    theme?: 'dark' | 'light';
    showThemeToggle?: boolean;
    languageSelection?: boolean;
    languages?: CodeLanguage[];
    tabSpace?: number;
    placeholder?: string;
  }>(),
  {
    language: 'javascript',
    editable: true,
    showTitle: true,
    showLineNumbers: true,
    theme: 'dark',
    showThemeToggle: true,
    languageSelection: false,
    languages: () => ['javascript', 'typescript', 'json', 'python', 'sql', 'bash', 'html', 'css'],
    tabSpace: 4,
    placeholder: undefined
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  onCodeLanguageChange: [value: string];
}>();

const codeBlock = ref<HTMLElement | null>(null);
const codeTextarea = ref<HTMLTextAreaElement | null>(null);
const text = ref(props.modelValue || '');
const languageState = ref(props.language || 'javascript');
const themeState = ref<'dark' | 'light'>(props.theme || 'dark');
const isContentCopied = ref(false);

const isReadonly = computed(() => !props.editable);
const themeClass = computed(() => (themeState.value === 'light' ? 'light' : 'dark'));
const languageList = computed(() => (props.languages && props.languages.length > 0 ? props.languages : ['javascript']));

const prismLanguage = computed(() => {
  const lang = languageState.value.toLowerCase();
  if (lang === 'html') return 'markup';
  return lang;
});

const lines = computed(() => {
  const count = Math.max(1, text.value.split('\n').length);
  return Array.from({ length: count });
});
const editorHeight = computed(() => `${Math.max(3, lines.value.length) * 24 + 20}px`);

const highlightedCode = computed(() => {
  const raw = `${text.value}\n`;
  const grammar = Prism.languages[prismLanguage.value] ?? Prism.languages.javascript;
  try {
    return Prism.highlight(raw, grammar, prismLanguage.value);
  } catch {
    return Prism.util.encode(raw) as unknown as string;
  }
});

function handleInputChange() {
  emit('update:modelValue', text.value);
}

function handleLanguageChange() {
  emit('onCodeLanguageChange', languageState.value);
}

function setTheme(next: 'dark' | 'light') {
  themeState.value = next;
}

function insertSpaces(event: KeyboardEvent) {
  const textarea = codeTextarea.value;
  if (!textarea) return;

  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const spaces = ' '.repeat(props.tabSpace);
  const next = text.value.substring(0, start) + spaces + text.value.substring(end);

  text.value = next;
  emit('update:modelValue', text.value);

  nextTick(() => {
    textarea.selectionStart = start + props.tabSpace;
    textarea.selectionEnd = start + props.tabSpace;
  });

  event.preventDefault();
}

async function copyContent() {
  try {
    await navigator.clipboard.writeText(text.value);
    isContentCopied.value = true;
    window.setTimeout(() => {
      isContentCopied.value = false;
    }, 1800);
  } catch {
    isContentCopied.value = false;
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== text.value) text.value = value || '';
  }
);

watch(
  () => props.language,
  (value) => {
    if (value) languageState.value = value;
  }
);

watch(
  () => props.theme,
  (value) => {
    if (value) themeState.value = value;
  }
);

onMounted(() => {
  if (props.language) languageState.value = props.language;
  text.value = props.modelValue || '';
});
</script>

<style scoped>
.code-editor {
  width: 100%;
  min-width: 820px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1e2028;
  border-radius: 8px;
}

.title-bar {
  padding: 0 10px;
  border-bottom: 1px solid #697098;
  background: #2a2e37;
  font-size: 0.875rem;
}

.selection-wrapper {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle {
  border: 1px solid #485268;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  padding: 2px;
  background: transparent;
}

.theme-chip {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #cdd6f4;
  cursor: pointer;
  line-height: 1;
}

.theme-chip.active {
  background: #485268;
  color: #fff;
}

.language-select,
.label {
  text-transform: capitalize;
  color: #cdd6f4;
  font: 500 13px/1 var(--sans);
}

.language-select {
  border: 0;
  background: transparent;
  padding: 4px 8px;
  outline: none;
}

.content-copy {
  border: 0;
  background: transparent;
  color: #cdd6f4;
  cursor: pointer;
  font: 600 12px/1 var(--sans);
}

.code-editor-wrapper {
  display: flex;
  width: 100%;
}

.line-number-gutter {
  width: 40px;
  padding: 10px 0;
  background: #2a2e37;
  color: #cdd6f4;
  font: 500 13px/1.5 var(--mono);
  text-align: center;
}

.line-number-gutter.hide {
  width: 0;
  visibility: hidden;
}

.code-block-wrapper {
  flex: 1;
  margin-left: 10px;
  outline: none;
}

.code-pre-block {
  position: relative;
  margin: 10px 0 0;
  padding: 0;
  width: 100%;
  min-height: calc(100% - 10px);
  background: transparent;
  text-shadow: none;
}

.code-pre-block code {
  position: absolute;
  inset: 0;
  color: #cdd6f4;
  line-height: 1.5;
  font-family: monospace, ui-monospace !important;
}

.code-pre-block textarea {
  position: absolute;
  inset: 0;
  border: 0;
  outline: none;
  padding: 0;
  color: transparent;
  background: transparent;
  text-shadow: none;
  caret-color: #cdd6f4;
  line-height: 1.5;
  font-family: monospace, ui-monospace !important;
  font-size: 1em;
  resize: none;
  white-space: nowrap;
  overflow: hidden;
}

.code-editor :deep(code[class*='language-']),
.code-editor :deep(pre[class*='language-']) {
  color: #cdd6f4;
  background: none;
  text-shadow: none;
  font-family: monospace, ui-monospace !important;
  font-size: 1em;
  line-height: 1.5;
}

.code-editor :deep(.token.comment),
.code-editor :deep(.token.prolog),
.code-editor :deep(.token.doctype),
.code-editor :deep(.token.cdata) {
  color: #697098;
}

.code-editor :deep(.token.deleted) {
  color: #f38ba8;
}

.code-editor :deep(.token.important),
.code-editor :deep(.token.bold) {
  font-weight: bold;
}

.code-editor :deep(.token.italic) {
  font-style: italic;
}

.code-editor :deep(.token.entity) {
  cursor: help;
}

.code-editor :deep(.token.operator) {
  background: none;
}

.code-editor.light {
  background: #fafafa;
}

.code-editor.light .title-bar {
  background: #e1e4e8;
  border-bottom-color: #a0a1a7;
}

.code-editor.light .line-number-gutter {
  background: #e1e4e8;
  color: #383a42;
}

.code-editor.light .label,
.code-editor.light .content-copy,
.code-editor.light .language-select {
  color: #383a42;
}

.code-editor.light .theme-toggle {
  border-color: #a0a1a7;
}

.code-editor.light .theme-chip {
  color: #383a42;
}

.code-editor.light .theme-chip.active {
  background: #c7ccd4;
  color: #1f2937;
}

.code-editor.light .code-pre-block code {
  color: #383a42;
}

.code-editor.light .code-pre-block textarea {
  caret-color: #383a42;
}

@media (max-width: 640px) {
  .code-editor {
    min-width: 100%;
  }
}
</style>
