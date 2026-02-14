<!-- eslint-disable vue/no-v-html -->
<template>
  <section class="stream-shell">
    <div ref="streamRef" class="stream-wrap markdown-content">
      <template v-for="(block, index) in renderedBlocks" :key="`${block.type}-${index}`">
        <div v-if="block.type === 'code'" class="code-block">
          <div class="code-title">
            <span class="language-tag">{{ (block.language || 'text').toUpperCase() }}</span>
            <CopyButton
              :value="block.rawContent || ''"
              label="Copy"
              copied-label="Done"
            />
          </div>
          <div class="code-body">
            <pre :class="`language-${block.language || 'plaintext'}`"><code v-html="block.content" /></pre>
          </div>
        </div>

        <div v-else-if="block.type === 'graph'" class="graph-block">
          <ChartViewer
            :height="320"
            :data="plotlySpecFor(block).data"
            :layout="plotlySpecFor(block).layout"
            :config="plotlySpecFor(block).config"
          />
        </div>

        <div v-else-if="block.type === 'table'" class="table-block" v-html="block.content" />
        <div v-else-if="block.type === 'list'" class="list-block" v-html="block.content" />
        <div v-else-if="block.type === 'image'" class="image-block" v-html="block.content" />
        <div v-else class="text-block" v-html="block.content" />
      </template>

    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import markdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import CopyButton from './shared/CopyButton.vue';
import ChartViewer from './ChartViewer.vue';

type PlotlySpec = {
  data: Array<Record<string, unknown>>;
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  frames?: Array<Record<string, unknown>>;
};

type StreamArtifact = {
  id?: string;
  artifact_id?: string;
  artifact_type?: string;
  payload?: PlotlySpec;
  extras?: {
    list_chart_json_data?: Array<{
      element_id: string;
      chart_json_data: string;
    }>;
  };
};

interface ContentBlock {
  type: 'code' | 'table' | 'list' | 'text' | 'graph' | 'image';
  content: string;
  language?: string;
  rawContent?: string;
  id?: string;
  artifactRefId?: string;
}

const props = withDefaults(
  defineProps<{
    markdownData?: string;
    fakeStreaming?: boolean;
    streamingSpeed?: number;
    isStreaming?: boolean;
    artifacts?: StreamArtifact[];
  }>(),
  {
    markdownData: '',
    fakeStreaming: false,
    streamingSpeed: 16,
    isStreaming: false,
    artifacts: () => []
  }
);

const emit = defineEmits<{
  streamingCompleted: [];
  fakeStreamingCompleted: [];
}>();

const renderedBlocks = ref<ContentBlock[]>([]);
const streamRef = ref<HTMLElement | null>(null);
let streamingTimeout: number | null = null;

const md = markdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true
});

const defaultLinkOpenRender =
  md.renderer.rules.link_open ||
  ((tokens: any, idx: any, options: any, env: any, self: any) =>
    self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens: any, idx: any, options: any, env: any, self: any) => {
  const targetIndex = tokens[idx].attrIndex('target');
  const relIndex = tokens[idx].attrIndex('rel');
  if (targetIndex < 0) tokens[idx].attrPush(['target', '_blank']);
  if (relIndex < 0) tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  return defaultLinkOpenRender(tokens, idx, options, env, self);
};

function renderMarkdown(text: string) {
  return DOMPurify.sanitize(md.render(text));
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (streamRef.value) {
      streamRef.value.scrollTop = streamRef.value.scrollHeight;
    }
  });
}

function parseChartDirective(languageTag: string) {
  const lang = (languageTag || '').trim().toLowerCase();
  if (!lang.startsWith('chart::')) return null;
  const parts = lang.split('::');
  if (parts[1] !== 'plotly') return null;
  return {
    artifactRefId: parts[2] || '',
    id: parts[3] || `plot-${Math.random().toString(36).slice(2, 10)}`
  };
}

function parseContentBlocks(content: string, deferHighlight = false): ContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const language = line.replace(/^```/, '').trim() || 'plaintext';
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].startsWith('```')) i += 1;

      const chart = parseChartDirective(language);
      if (chart) {
        blocks.push({
          type: 'graph',
          content: '',
          id: chart.id,
          artifactRefId: chart.artifactRefId
        });
      } else {
        const raw = codeLines.join('\n');
        let highlighted = md.utils.escapeHtml(raw);
        if (!deferHighlight) {
          try {
            const grammar = Prism.languages[language] || Prism.languages.plaintext;
            highlighted = Prism.highlight(raw, grammar, language);
          } catch {
            highlighted = md.utils.escapeHtml(raw);
          }
        }
        blocks.push({
          type: 'code',
          content: highlighted,
          rawContent: raw,
          language
        });
      }
      continue;
    }

    const nextLine = lines[i + 1] || '';
    const isTableStart = /\|/.test(line) && /^\s*\|?\s*[-:]+/.test(nextLine);
    if (isTableStart) {
      const tableLines = [line, nextLine];
      i += 2;
      while (i < lines.length && /\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'table', content: renderMarkdown(tableLines.join('\n')) });
      continue;
    }

    if (/^\s*([-*+] |\d+\. )/.test(line)) {
      const listLines = [line];
      i += 1;
      while (i < lines.length && /^\s*([-*+] |\d+\. )/.test(lines[i])) {
        listLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'list', content: renderMarkdown(listLines.join('\n')) });
      continue;
    }

    if (/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(line)) {
      blocks.push({ type: 'image', content: renderMarkdown(line) });
      i += 1;
      continue;
    }

    if (line.trim().length === 0) {
      i += 1;
      continue;
    }

    const textLines = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !lines[i].startsWith('```') &&
      !/^\s*([-*+] |\d+\. )/.test(lines[i]) &&
      !(/^\|/.test(lines[i]) && /^\s*\|?\s*[-:]+/.test(lines[i + 1] || ''))
    ) {
      textLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'text', content: renderMarkdown(textLines.join('\n')) });
  }

  return blocks;
}

const plotlySpecMap = computed<Record<string, PlotlySpec>>(() => {
  const map: Record<string, PlotlySpec> = {};
  const list = Array.isArray(props.artifacts) ? props.artifacts : [];

  for (const artifact of list) {
    if (!artifact) continue;

    if (artifact.id && artifact.payload?.data) {
      map[artifact.id] = artifact.payload;
    }

    if (artifact.artifact_id && artifact.payload?.data) {
      map[artifact.artifact_id] = artifact.payload;
    }

    if (artifact.artifact_type === 'plot_image' && artifact.artifact_id && artifact.extras?.list_chart_json_data) {
      for (const item of artifact.extras.list_chart_json_data) {
        try {
          const parsed = JSON.parse(item.chart_json_data);
          map[`${item.element_id}::${artifact.artifact_id}`] = {
            data: Array.isArray(parsed.data) ? parsed.data : [],
            layout: parsed.layout || {},
            config: parsed.config || {},
            frames: Array.isArray(parsed.frames) ? parsed.frames : []
          };
        } catch {
          // ignore malformed chart payloads
        }
      }
    }
  }

  return map;
});

function plotlySpecFor(block: ContentBlock): PlotlySpec {
  if (block.type !== 'graph') return { data: [] };
  const map = plotlySpecMap.value;

  const direct = map[block.artifactRefId || ''];
  if (direct?.data) return direct;

  const keyed = map[`${block.id || ''}::${block.artifactRefId || ''}`];
  if (keyed?.data) return keyed;

  return { data: [] };
}

function applyDeferredHighlight() {
  let changed = false;
  renderedBlocks.value = renderedBlocks.value.map((block) => {
    if (block.type !== 'code' || !block.rawContent) return block;

    if (block.content.includes('token')) return block;

    const language = block.language || 'plaintext';
    let highlighted = md.utils.escapeHtml(block.rawContent);
    try {
      const grammar = Prism.languages[language] || Prism.languages.plaintext;
      highlighted = Prism.highlight(block.rawContent, grammar, language);
    } catch {
      highlighted = md.utils.escapeHtml(block.rawContent);
    }
    changed = true;
    return { ...block, content: highlighted };
  });

  if (changed) scrollToBottom();
}

function updateBlocks(content: string, deferHighlight = false) {
  renderedBlocks.value = parseContentBlocks(content, deferHighlight);
  scrollToBottom();
}

function stopStreamingTimer() {
  if (streamingTimeout !== null) {
    window.clearTimeout(streamingTimeout);
    streamingTimeout = null;
  }
}

function startFakeStreaming() {
  stopStreamingTimer();
  const source = props.markdownData || '';
  let index = 0;

  const tick = () => {
    if (index >= source.length) {
      emit('streamingCompleted');
      emit('fakeStreamingCompleted');
      applyDeferredHighlight();
      return;
    }

    index += 1;
    const chunk = source.slice(0, index);
    updateBlocks(chunk, true);
    streamingTimeout = window.setTimeout(tick, Math.max(1, props.streamingSpeed));
  };

  tick();
}

watch(
  () => props.markdownData,
  (value) => {
    if (!value) {
      renderedBlocks.value = [];
      return;
    }

    if (props.fakeStreaming) {
      startFakeStreaming();
    } else {
      updateBlocks(value, !!props.isStreaming);
    }
  },
  { immediate: true }
);

watch(
  () => props.isStreaming,
  (streaming) => {
    if (!streaming) {
      stopStreamingTimer();
      applyDeferredHighlight();
    }
  }
);

watch(
  () => props.artifacts,
  () => {
    renderedBlocks.value = [...renderedBlocks.value];
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  scrollToBottom();
});

onUnmounted(() => {
  stopStreamingTimer();
});
</script>

<style scoped>
.stream-shell {
  width: 100%;
}

.stream-wrap {
  background: transparent;
  padding: 12px;
  overflow: visible;
}

.text-block,
.list-block,
.table-block,
.image-block,
.graph-block {
  margin-bottom: 0;
}

.code-block {
  font-size: 14px;
  margin: 0 10px;
  display: flex;
  flex-direction: column;
  width: 820px;
}

@media (max-width: 900px) {
  .code-block {
    width: calc(100% - 20px);
  }
}

.code-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a3342;
  color: #d6deea;
  padding: 10px;
  border-radius: 0.375rem 0.375rem 0 0;
  border-bottom: 1px solid #3a4556;
}

.language-tag {
  color: #d6deea;
  font: 700 11px/1 var(--mono);
}

.code-body {
  display: block;
  margin: 0 0 10px;
  padding: 20px !important;
  overflow-x: auto;
  border-radius: 0 0 0.375rem 0.375rem;
  background: #1e2028;
  width: 100%;
}

.code-body :deep(pre) {
  display: block;
  min-width: 100%;
}

:deep(code[class*='language-']),
:deep(pre[class*='language-']) {
  display: flex;
  flex-direction: column;
  color: #cdd6f4;
  background: none;
  text-shadow: none !important;
  font-family: monospace, ui-monospace !important;
  font-size: 1em;
  text-align: left;
  white-space: pre;
  line-height: 1.5;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  tab-size: 4;
  hyphens: none;
}

:deep(pre[class*='language-']) {
  margin: 0 !important;
  padding: 0 !important;
  border: none;
  border-radius: unset;
  box-shadow: none;
  overflow: visible !important;
}

:deep(.token) {
  color: #cdd6f4;
  text-shadow: none !important;
  font-family: monospace, ui-monospace !important;
}

:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.doctype),
:deep(.token.cdata) {
  color: #697098;
}

:deep(.token.punctuation) {
  color: #cdd6f4;
}

:deep(.token.property),
:deep(.token.tag),
:deep(.token.boolean),
:deep(.token.number),
:deep(.token.constant),
:deep(.token.symbol),
:deep(.token.deleted) {
  color: #f38ba8;
}

:deep(.token.selector),
:deep(.token.attr-name),
:deep(.token.string),
:deep(.token.char),
:deep(.token.builtin),
:deep(.token.inserted) {
  color: #a6e3a1;
}

:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url),
:deep(.token.variable) {
  color: #7dcfff;
}

:deep(.token.keyword),
:deep(.token.atrule),
:deep(.token.function) {
  color: #fab387;
}

:deep(.token.operator) {
  background: none;
}

.markdown-content :deep(p),
.markdown-content :deep(li) {
  margin: 0;
  padding-bottom: 8px;
  font: 500 14px/1.5 var(--sans);
}

.markdown-content :deep(table) {
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  table-layout: auto;
  border-collapse: collapse;
  font: 500 13px/1.45 var(--sans);
  margin: 10px;
}

.table-block {
  display: block;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #d8dde3;
  padding: 8px 10px;
  text-align: left;
  min-width: 120px;
  max-width: 320px;
  width: fit-content;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.markdown-content :deep(th) {
  background: #e5e7eb;
  color: #374151;
  font-weight: 700;
}

.markdown-content :deep(a) {
  color: #0d6a75;
}

.markdown-content :deep(ol),
.markdown-content :deep(ul) {
  padding-left: 40px;
  line-height: 1.5;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
}

.markdown-content :deep(blockquote) {
  margin: 10px 0;
  padding: 10px 14px;
  border-left: 4px solid #b8c0cc;
  background: #f3f5f8;
  border-radius: 6px;
}

.markdown-content :deep(blockquote p) {
  margin: 0;
  padding: 0;
  color: #374151;
  font-style: italic;
}

.markdown-content :deep(img) {
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid var(--line);
}
</style>
