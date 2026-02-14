<template>
  <div class="image-to-base64">
    <div class="input-container">
      <label v-if="label" class="input-label" for="image-upload">{{
        label
      }}</label>
      <input
        id="image-upload"
        ref="fileInput"
        type="file"
        :accept="accept || 'image/*'"
        class="file-input-hidden"
        @change="handleImageChange"
      />
      <div class="file-picker-row">
        <button
          type="button"
          class="file-picker-button"
          @click="openFilePicker"
        >
          Choose file
        </button>
        <span class="file-picker-name">{{
          selectedFileName || "No file chosen"
        }}</span>
      </div>
    </div>

    <div v-if="base64String" class="preview-container">
      <div class="preview-image">
        <img :src="base64String" alt="Preview" style="max-width: 100%" />
      </div>

      <div class="markdown-section">
        <div class="markdown-header">
          <h4>Markdown Format</h4>
          <CopyButton
            class="markdown-copy-button"
            :value="markdownString"
            label="Copy markdown"
            copied-label="Copied"
          />
        </div>
        <div class="markdown-content">{{ markdownString }}</div>
      </div>

      <div v-if="fileSize" class="size-info">
        <p>File Size: {{ formatSize(fileSize) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import CopyButton from "./shared/CopyButton.vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    maxSize?: number;
    accept?: string;
    onConvert?: (base64String: string) => void;
  }>(),
  {
    label: "Select Image",
    maxSize: 500 * 1024,
    accept: "image/*",
    onConvert: undefined,
  }
);

const emit = defineEmits<{
  convert: [base64String: string];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const base64String = ref("");
const fileSize = ref(0);
const selectedFileName = ref("");

const markdownString = computed(() => {
  if (!base64String.value) {
    return "";
  }
  return `![image](${base64String.value})`;
});

const formatSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const openFilePicker = () => {
  fileInput.value?.click();
};

const handleImageChange = (event: Event) => {
  event.preventDefault();
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const tryReduceImageSize = async (
    fileSource: File,
    maxSize: number
  ): Promise<string | null> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let quality = 0.75;
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let { width, height } = img;

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL(fileSource.type, quality);

          while (dataUrl.length * 0.5 > maxSize && quality > 0.1) {
            quality -= 0.07;
            if (quality < 0.5 && (width > 200 || height > 200)) {
              width = Math.floor(width * 0.85);
              height = Math.floor(height * 0.85);
              canvas.width = width;
              canvas.height = height;
              ctx?.clearRect(0, 0, width, height);
              ctx?.drawImage(img, 0, 0, width, height);
            }
            dataUrl = canvas.toDataURL(fileSource.type, quality);
          }

          if (dataUrl.length * 0.5 > maxSize) {
            resolve(null);
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () =>
          reject(new Error("Failed to load image for compression"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () =>
        reject(new Error("Failed to read file for compression"));
      reader.readAsDataURL(fileSource);
    });

  tryReduceImageSize(file, props.maxSize)
    .then((reducedDataUrl) => {
      if (reducedDataUrl) {
        base64String.value = reducedDataUrl;
        fileSize.value = Math.round(reducedDataUrl.length * 0.75);
        selectedFileName.value = file.name;
        emit("convert", reducedDataUrl);
        if (props.onConvert) {
          props.onConvert(reducedDataUrl);
        }
      } else {
        alert(
          `File size exceeds ${(props.maxSize / (1024 * 1024)).toFixed(
            2
          )}MB limit, and could not be reduced further.`
        );
        input.value = "";
      }
    })
    .catch((err) => {
      alert(`Failed to process image: ${err}`);
      input.value = "";
    });

  try {
    fileSize.value = file.size;
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      base64String.value = result;
      selectedFileName.value = file.name;
      emit("convert", result);

      if (props.onConvert) {
        props.onConvert(result);
      }
    };

    reader.onerror = () => {
      throw new Error("Failed to read file");
    };

    reader.readAsDataURL(file);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error converting image:", error);
    alert("Failed to convert image");
    input.value = "";
  }
};
</script>

<style scoped>
.image-to-base64 {
  width: 100%;
}

.input-container {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.file-input-hidden {
  display: none;
}

.file-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  background: #fff;
  padding: 0.45rem 0.6rem;
}

.file-picker-row:focus-within {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.file-picker-button {
  border: 1px solid #bcc6d5;
  border-radius: 9px;
  padding: 0.4rem 0.75rem;
  font: 600 0.78rem/1 var(--sans);
  color: #1f2937;
  background: linear-gradient(180deg, #ffffff 0%, #eef2f7 100%);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease,
    transform 0.05s ease;
}

.file-picker-button:hover {
  border-color: #8ea2bc;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}

.file-picker-button:active {
  transform: translateY(1px);
}

.file-picker-name {
  font: 500 0.9rem/1.2 var(--sans);
  color: #374151;
}

.selected-file-name {
  margin: 0.5rem 0 0;
  font: 500 0.8rem/1.3 var(--sans);
  color: #4b5563;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.preview-image {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 200px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 1rem 1.25rem;
}

.preview-image img {
  width: auto;
  max-width: min(560px, 100%);
  border-radius: 8px;
}

.markdown-section {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 1rem 1.25rem;
}

.markdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.markdown-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.markdown-content {
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
  max-height: 200px;
  overflow: scroll;
}

.size-info {
  padding: 0.75rem 1.25rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 0.875rem;
}

.size-info p {
  margin: 0.25rem 0;
}

:deep(.markdown-copy-button) {
  border: 1px solid #c7ced9;
  border-radius: 10px;
  padding: 0.4rem 0.75rem;
  font: 600 0.75rem/1 var(--sans);
  background: linear-gradient(180deg, #ffffff 0%, #f2f5f9 100%);
  color: #1f2937;
  transition: all 0.15s ease;
}

:deep(.markdown-copy-button:hover) {
  border-color: #8fa1ba;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
}
</style>
