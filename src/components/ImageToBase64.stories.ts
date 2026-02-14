import type { Meta, StoryObj } from '@storybook/vue3';
import ImageToBase64 from './ImageToBase64.vue';

const meta = {
  title: 'Advanced Components/ImageToBase64',
  component: ImageToBase64,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label for the image upload input'
    },
    maxSize: {
      control: 'number',
      description: 'Maximum file size in bytes'
    },
    accept: {
      control: 'text',
      description: 'Accepted file types'
    },
    onConvert: {
      action: 'converted',
      description: 'Callback when image is converted to base64'
    }
  }
} satisfies Meta<typeof ImageToBase64>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image_500KB: Story = {
  args: {
    label: 'Select Image',
    accept: 'image/*'
  }
};

export const Image_1MB: Story = {
  args: {
    label: 'Select Image',
    accept: 'image/*',
    maxSize: 1024 * 1024
  }
};
