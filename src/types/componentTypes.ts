export type CodeLanguage = 'javascript' | 'typescript' | 'json' | 'python' | 'sql' | 'css' | 'html' | 'bash';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  createdAt?: string;
}

export interface ChatArtifact {
  id: string;
  type: 'image' | 'json' | 'chart';
  title: string;
  payload: unknown;
}
