import type { Meta, StoryObj } from "@storybook/vue3";
import ChatStream from "./ChatStream.vue";
import {
  streamArtifactsMapStyle,
  streamMarkdownDefault,
  streamMarkdownWithPlotlyDirective,
} from "../stories/mockData";

const baseCode = `\n\`\`\`typescript\nfunction runHealthCheck() {\n  const connectors = ['SAP', 'Salesforce', 'Kafka'];\n  return connectors.map((name, index) => ({ name, status: index === 1 ? 'warning' : 'healthy' }));\n}\n\`\`\``;

const streamingRichMarkdown = `### Streaming Full Example

This stream demonstrates **bold text**, *italic emphasis*, and inline \`code\`.

#### Summary
* The response is streamed progressively.
* Markdown formatting is preserved while streaming.
* Links stay interactive: [Open docs](https://example.com/docs).

> This is a streamed blockquote to highlight key context.

#### Current Observations
* The overnight ingestion window completed in **43 minutes**.
* Two connectors showed transient lag, both recovered automatically.
* No model retrain failures were observed in the last cycle.

#### Detailed Notes
The data quality service reports a stable null-rate trend across key fields,
and the parser checksum remained consistent throughout the run.  
This indicates the source payload format did not drift unexpectedly.

The orchestration layer also completed dependency fan-out correctly.
In practical terms, this means downstream jobs started in the expected order
without manual retries.

#### Recommendations
* Keep alert threshold at the current level for another 24 hours.
* Continue observing the Salesforce connector during the next batch window.
* Validate KPI distribution after the noon refresh cycle.

#### Commentary
The overall run can be categorized as **healthy** with minor noise.  
If similar stability continues through the next two cycles, we can
reduce on-call monitoring intensity for this flow.

> Final note: this story intentionally uses text-focused markdown only,
> so streaming behavior can be validated without chart/table/code rendering side-effects.`;

const nestedLongMarkdown = `### Deep Nested Operational Checklist

- Platform Readiness
  1. Ingestion Readiness
     - SAP Connector
       1. Credentials validated
       2. Endpoint reachable
       3. Delta token healthy
     - Salesforce Connector
       1. OAuth refreshed
       2. API limit within threshold
       3. Retry queue size reviewed
  2. Processing Readiness
     - Feature pipeline
       - Schema diff checked
       - Null rate audited
       - Drift alarms reviewed
     - Model pipeline
       1. Last train job status success
       2. Registry version matches deployment
       3. Canary score above baseline
- Go-Live Actions
  1. Trigger run
  2. Observe first 3 batches
  3. Confirm KPI notifications delivered`;

const meta = {
  title: "Advanced Components/ChatStream",
  component: ChatStream,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    markdownData: streamMarkdownDefault,
    fakeStreaming: false,
    streamingSpeed: 12,
    isStreaming: false,
    artifacts: [],
  },
} satisfies Meta<typeof ChatStream>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Streaming: Story = {
  args: {
    fakeStreaming: true,
    isStreaming: true,
    streamingSpeed: 10,
    markdownData: streamingRichMarkdown,
    artifacts: [],
  },
};

export const StreamingWithListTable: Story = {
  args: {
    fakeStreaming: true,
    isStreaming: true,
    streamingSpeed: 10,
    markdownData: `### Streaming Table + List\n\n| Connector | Status | Latency (ms) |\n|---|---|---:|\n| SAP | healthy | 128 |\n| Salesforce | warning | 532 |\n| Kafka | healthy | 91 |\n\n* Retry failed Salesforce sync\n* Monitor lag for next 2 cycles\n* Confirm KPI trend by EOD`,
  },
};

export const WithoutStreaming: Story = {
  args: {
    fakeStreaming: false,
    isStreaming: false,
    markdownData: `### Streaming Table + List\n\n| Connector | Status | Latency (ms) |\n|---|---|---:|\n| SAP | healthy | 128 |\n| Salesforce | warning | 532 |\n| Kafka | healthy | 91 |\n\n* Retry failed Salesforce sync\n* Monitor lag for next 2 cycles\n* Confirm KPI trend by EOD\n ${streamMarkdownWithPlotlyDirective}`,
    artifacts: streamArtifactsMapStyle,
  },
};

export const WithNestedLists: Story = {
  args: {
    markdownData: nestedLongMarkdown,
  },
};

export const WithTables: Story = {
  args: {
    markdownData: `### Connector Table\n\n| Connector | Region | Status | Latency (ms) |\n|---|---|---|---:|\n| SAP | North | healthy | 128 |\n| Salesforce | West | warning | 532 |\n| Kafka | East | healthy | 91 |\n| Snowflake | Central | healthy | 104 |`,
  },
};

export const WithCodeBlocks: Story = {
  args: {
    markdownData: `### Code Blocks\n${baseCode}\n\n\`\`\`sql\nSELECT connector, status, latency_ms\nFROM connector_health\nWHERE status != 'healthy'\nORDER BY latency_ms DESC;\n\`\`\``,
  },
};

export const WithImagesAndLinks: Story = {
  args: {
    markdownData: `### Images and Links\n![Pipeline](https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80)\n\n[Open Monitoring Dashboard](https://example.com)`,
  },
};
