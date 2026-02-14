import type { Preview } from '@storybook/vue3';
import '../src/assets/global.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['Introduction', 'Advanced Components']
      }
    },
    layout: 'centered',
    backgrounds: {
      default: 'canvas',
      values: [{ name: 'canvas', value: '#ffffff' }]
    }
  }
};

export default preview;
