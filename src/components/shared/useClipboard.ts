import { ref } from 'vue';

export function useClipboard(resetMs = 1400) {
  const copied = ref(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      window.setTimeout(() => {
        copied.value = false;
      }, resetMs);
      return true;
    } catch {
      copied.value = false;
      return false;
    }
  }

  return { copied, copy };
}
