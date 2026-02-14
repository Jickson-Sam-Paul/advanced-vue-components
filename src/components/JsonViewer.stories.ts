import type { Meta, StoryObj } from '@storybook/vue3';
import JsonViewer from './JsonViewer.vue';

const meta = {
  title: 'Advanced Components/JsonViewer',
  component: JsonViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    defaultValue: { control: 'object' }
  },
  args: {}
} satisfies Meta<typeof JsonViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: {
      store: {
        name: true,
        location: '123 Bookworm Lane',
        books: [
          {
            title: 'Journey to the Center of the Earth',
            author: {
              name: 'Jules Verne',
              nationality: 'French'
            },
            publication: {
              year: 1864,
              publisher: {
                name: 'Pierre-Jules Hetzel',
                location: 'Paris, France'
              }
            },
            genres: ['Adventure', 'Science Fiction']
          },
          {
            title: 'Pride and Prejudice',
            author: {
              name: 'Jane Austen',
              nationality: 'British'
            },
            publication: {
              year: 1813,
              publisher: {
                name: 'T. Egerton, Whitehall',
                location: 'London, England'
              }
            },
            genres: ['Romance', 'Satire']
          }
        ]
      }
    }
  }
};

export const Object: Story = {
  args: {
    defaultValue: {
      total_tokens: 2680,
      total_cost: 0.008106,
      prompt_tokens: 2614,
      completion_tokens: 66
    }
  }
};

export const NestedJson: Story = {
  args: {
    defaultValue: {
      query:
        "Here's an example of a table featuring five football players and their respective positions:\n\n| Player Name       | Position       |\n|-------------------|----------------|\n| Lionel Messi      | Forward        |\n| Cristiano Ronaldo | Forward        |\n| Neymar Jr.        | Forward        |\n| Virgil van Dijk   | Defender       |\n| Manuel Neuer      | Goalkeeper     |",
      output: {
        initial_response: {
          query: 'Does the company integrate the findings of its assessments?',
          output: {
            initial_response: '{"score": 0, "citations": []}',
            final_response: {
              query: 'Does the company integrate the findings of its assessments?',
              output: {
                initial_response_new: '[{"score": 0, "citations": []}]',
                final_response1: '{"score": 0, "citations": []}'
              },
              metrics: {
                total_tokens: 427,
                total_cost: 0.02634,
                prompt_tokens: 415,
                completion_tokens: 12
              },
              sources: []
            }
          },
          metrics: {
            total_tokens: 427,
            total_cost: 0.02634,
            prompt_tokens: 415,
            completion_tokens: 12
          },
          sources: []
        },
        final_response1: '{"score": 0, "citations": []}',
        final_response2: '{"score": 0, "citations": []}'
      },
      metrics: {
        total_tokens: 427,
        total_cost: 0.02634,
        prompt_tokens: 415,
        completion_tokens: 12
      },
      sources: [1, 2, 3, 4, 5, 6]
    }
  }
};
