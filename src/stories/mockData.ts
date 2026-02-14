import type { ChatArtifact, ChatMessage } from '../types/componentTypes';

export const starterCode = `interface HealthMetric {
  connector: string;
  status: 'healthy' | 'warning' | 'down';
  latencyMs: number;
}

const metrics: HealthMetric[] = [
  { connector: 'SAP Connector', status: 'healthy', latencyMs: 128 },
  { connector: 'Salesforce Ingest', status: 'warning', latencyMs: 532 },
  { connector: 'Kafka Stream A', status: 'healthy', latencyMs: 91 }
];

export function summarize(metrics: HealthMetric[]): string {
  const degraded = metrics.filter((m) => m.status !== 'healthy');
  return degraded.length === 0
    ? 'All connectors stable.'
    : String(degraded.length) + ' connector(s) need attention.';
}
`;

export const chatMessages: ChatMessage[] = [
  {
    id: 'm-1',
    role: 'user',
    content: 'Can you summarize this week\'s upload health?',
    createdAt: '11:02'
  },
  {
    id: 'm-2',
    role: 'assistant',
    content:
      '### Weekly Health Summary\\n- 92% success rate\\n- 4 delayed batches\\n- 0 failed retrain jobs\\n\\n```sql\\nSELECT pipeline, success_rate FROM weekly_health;\\n```',
    createdAt: '11:03'
  }
];

export const chartArtifact: ChatArtifact = {
  id: 'a-1',
  type: 'chart',
  title: 'Success rate by connector',
  payload: {
    data: [
      {
        type: 'bar',
        x: ['SAP', 'Salesforce', 'Kafka', 'Snowflake'],
        y: [97, 88, 94, 91],
        marker: { color: ['#0d6a75', '#d17a00', '#5c8f3a', '#4d5f79'] }
      }
    ],
    layout: {
      margin: { t: 24, r: 16, b: 40, l: 42 },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white'
    }
  }
};

export const streamMarkdownDefault = `### Weekly Health Summary
* 92% success rate
* 4 delayed batches
* 0 failed retrain jobs

\`\`\`sql
SELECT pipeline, success_rate
FROM weekly_health
ORDER BY success_rate DESC;
\`\`\`

The delayed batches are concentrated in the **Salesforce** connector between 03:00-05:00 UTC.
`;

export const streamMarkdownCodeAndTable = `### Connector Status

| Connector | Status | Latency (ms) |
|---|---|---:|
| SAP | healthy | 128 |
| Salesforce | warning | 532 |
| Kafka | healthy | 91 |

* Retry failed sync for Salesforce.
* Monitor lag for next 2 cycles.
* Confirm KPI trend by EOD.

![Pipeline Diagram](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80)
`;

export const streamMarkdownWithPlotlyDirective = `### Artifact-backed Chart

\`\`\`chart::plotly::tool-1::div-123
\`\`\`

The chart above is resolved from artifacts using chart directive mapping.
`;

export const streamArtifactsMapStyle = [
  {
    artifact_type: 'plot_image',
    artifact_id: 'tool-1',
    extras: {
      list_chart_json_data: [
        {
          element_id: 'div-123',
          chart_json_data: JSON.stringify({
            data: [
              {
                type: 'bar',
                x: ['SAP', 'Salesforce', 'Kafka', 'Snowflake'],
                y: [97, 88, 94, 91],
                marker: { color: ['#0d6a75', '#d17a00', '#5c8f3a', '#4d5f79'] }
              }
            ],
            layout: {
              title: 'Success Rate by Connector',
              margin: { t: 56, r: 16, b: 36, l: 42 }
            }
          })
        }
      ]
    }
  }
];

export const rawJson = {
  jobId: 'pipeline-442',
  owner: 'Ops Team',
  active: true,
  retries: 2,
  schedule: {
    cron: '0 */3 * * *',
    timezone: 'UTC'
  },
  connectors: [
    { name: 'SAP', status: 'healthy', lagSeconds: 12 },
    { name: 'Salesforce', status: 'warning', lagSeconds: 140 }
  ],
  alerts: null
};

export const plotData = [
  {
    type: 'scatter',
    mode: 'lines+markers',
    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    y: [81, 88, 90, 86, 93],
    name: 'Accuracy',
    line: { color: '#0d6a75' }
  },
  {
    type: 'scatter',
    mode: 'lines',
    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    y: [72, 76, 79, 75, 81],
    name: 'Coverage',
    line: { color: '#d17a00', dash: 'dot' }
  }
];

export const plotLayout = {
  title: 'Model Trend (Week 7)',
  margin: { t: 56, r: 16, b: 36, l: 42 },
  paper_bgcolor: 'white',
  plot_bgcolor: 'white',
  legend: { orientation: 'h', y: -0.2 }
};
