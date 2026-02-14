import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import VoiceInput from './VoiceInput.vue';

const meta = {
  title: 'Advanced Components/VoiceInput',
  component: VoiceInput,
  tags: ['autodocs'],
  args: {
    modelValue: ''
  }
} satisfies Meta<typeof VoiceInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { VoiceInput },
    setup() {
      const transcript = ref('');
      return { args, transcript };
    },
    template: '<VoiceInput v-bind="args" v-model="transcript" />'
  })
};

export const UnsupportedBrowserFallback: Story = {
  args: {
    modelValue: 'If SpeechRecognition API is unavailable, component emits error and stays stable.'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    modelValue: 'Voice capture is disabled in this context.'
  }
};
