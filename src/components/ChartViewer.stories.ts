import type { Meta, StoryObj } from '@storybook/vue3';
import { onBeforeUnmount, ref } from 'vue';
import ChartViewer from './ChartViewer.vue';

const meta = {
  title: 'Advanced Components/ChartViewer',
  component: ChartViewer,
  tags: ['autodocs'],
  args: {
    data: [
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Accuracy',
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        y: [81, 88, 90, 86, 93],
        line: { color: '#0d6a75' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Coverage',
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        y: [72, 76, 79, 75, 81],
        line: { color: '#d17a00' }
      }
    ],
    layout: {
      title: 'Two-Line Weekly Trends',
      margin: { t: 56, r: 16, b: 36, l: 42 }
    },
    height: 420
  }
} satisfies Meta<typeof ChartViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultiLine: Story = {
  args: {
    data: [
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Accuracy',
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        y: [81, 88, 90, 86, 93],
        line: { color: '#0d6a75' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Coverage',
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        y: [72, 76, 79, 75, 81],
        line: { color: '#d17a00' }
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Stability',
        x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        y: [68, 71, 73, 74, 78],
        line: { color: '#5c8f3a' }
      }
    ],
    layout: {
      title: 'Multi-Line Weekly Trends',
      margin: { t: 56, r: 16, b: 36, l: 42 }
    }
  }
};

export const BarSnapshot: Story = {
  args: {
    data: [
      {
        type: 'bar',
        x: ['Jan', 'Feb', 'Mar', 'Apr'],
        y: [22, 25, 21, 27],
        marker: { color: '#0d6a75' }
      }
    ],
    layout: {
      title: 'Monthly Throughput (K docs)',
      margin: { t: 50, r: 16, b: 36, l: 42 }
    }
  }
};

export const DrawLine: Story = {
  render: (args) => ({
    components: { ChartViewer },
    setup() {
      const x = Array.from({ length: 180 }, (_, i) => i);
      const y = x.map((v) => Math.sin(v / 12) + Math.cos(v / 24) * 0.35);
      const dataRef = ref([
        {
          type: 'scatter',
          mode: 'lines',
          name: 'Signal',
          line: { color: '#0d6a75', width: 3 },
          x: x.slice(0, 1),
          y: y.slice(0, 1)
        }
      ]);

      let idx = 1;
      const timer = window.setInterval(() => {
        if (idx >= x.length) {
          window.clearInterval(timer);
          return;
        }
        dataRef.value = [
          {
            ...dataRef.value[0],
            x: x.slice(0, idx + 1),
            y: y.slice(0, idx + 1)
          }
        ];
        idx += 1;
      }, 28);

      onBeforeUnmount(() => {
        window.clearInterval(timer);
      });

      return {
        args,
        dataRef,
        layout: {
          title: 'Draw Line Animation',
          margin: { t: 52, r: 16, b: 36, l: 42 }
        }
      };
    },
    template: '<ChartViewer v-bind="args" :data="dataRef" :layout="layout" />'
  })
};
