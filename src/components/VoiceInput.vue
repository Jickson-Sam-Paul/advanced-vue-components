<template>
  <section class="voice-shell">
    <div class="voice-grid">
      <div class="controls">
        <button class="mic" type="button" :disabled="disabled" :class="{ listening }" @click="toggle">
          <span class="mic-content">
            <svg class="mic-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21h3a1 1 0 1 1 0 2H8a1 1 0 0 1 0-2h3v-3.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
              />
            </svg>
            {{ listening ? 'Stop' : 'Start mic' }}
          </span>
        </button>
        <button class="clear" type="button" :disabled="!modelValue" @click="clearTranscript">
          <span class="clear-content">
            <svg class="clear-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
            Clear
          </span>
        </button>
      </div>
      <p class="state">{{ stateText }}</p>
      <textarea class="transcript" :value="modelValue" readonly rows="6" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  start: [];
  stop: [];
  error: [message: string];
}>();

const listening = ref(false);
const finalTranscript = ref('');
const interimTranscript = ref('');
let browserRecognition: any = null;
let userStopped = false;

const stateText = computed(() => {
  if (props.disabled) return 'Mic disabled';
  if (listening.value) return 'Browser listening in progress';
  return 'Idle';
});

function startBrowser() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    emit('error', 'SpeechRecognition API not available.');
    listening.value = false;
    return;
  }

  browserRecognition = new SpeechRecognition();
  browserRecognition.lang = 'en-US';
  browserRecognition.interimResults = true;
  browserRecognition.continuous = true;

  browserRecognition.onresult = (event: any) => {
    const interimChunks: string[] = [];
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const chunk = String(result?.[0]?.transcript ?? '').trim();
      if (!chunk) continue;
      if (result.isFinal) {
        finalTranscript.value = `${finalTranscript.value} ${chunk}`.trim();
      } else {
        interimChunks.push(chunk);
      }
    }
    interimTranscript.value = interimChunks.join(' ').trim();
    emit('update:modelValue', `${finalTranscript.value} ${interimTranscript.value}`.trim());
  };

  browserRecognition.onerror = () => {
    emit('error', 'Speech recognition encountered an error.');
    listening.value = false;
    emit('stop');
    if (browserRecognition) {
      browserRecognition.stop();
      browserRecognition = null;
    }
  };

  browserRecognition.onend = () => {
    if (listening.value && !userStopped && browserRecognition) {
      browserRecognition.start();
      return;
    }
    listening.value = false;
    emit('stop');
  };

  browserRecognition.start();
}

function start() {
  if (props.disabled) return;
  finalTranscript.value = props.modelValue.trim();
  interimTranscript.value = '';
  listening.value = true;
  userStopped = false;
  emit('start');
  startBrowser();
}

function stop() {
  userStopped = true;
  listening.value = false;
  interimTranscript.value = '';
  emit('update:modelValue', finalTranscript.value.trim());
  if (browserRecognition) {
    browserRecognition.stop();
    browserRecognition = null;
  }
  emit('stop');
}

function clearTranscript() {
  finalTranscript.value = '';
  interimTranscript.value = '';
  emit('update:modelValue', '');
}

function toggle() {
  if (listening.value) stop();
  else start();
}

onBeforeUnmount(stop);
</script>

<style scoped>
.voice-shell {
  width: min(940px, 95vw);
}

.voice-grid {
  display: grid;
  gap: 10px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mic {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 14px;
  background: white;
  font: 700 13px/1 var(--sans);
  cursor: pointer;
}

.mic-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mic-icon {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.mic.listening {
  border-color: #ba2a30;
  color: #ba2a30;
  animation: breathe 1s infinite;
}

.clear {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 14px;
  min-height: 34px;
  background: #fff;
  color: var(--muted);
  font: 700 13px/1 var(--sans);
  cursor: pointer;
}

.clear-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.clear-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes breathe {
  0% { box-shadow: 0 0 0 0 #ba2a3055; }
  100% { box-shadow: 0 0 0 12px #ba2a3000; }
}

.state {
  margin: 0;
  color: var(--muted);
  font: 600 12px/1 var(--sans);
}

.transcript {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
  resize: vertical;
  font: 500 13px/1.5 var(--mono);
}
</style>
