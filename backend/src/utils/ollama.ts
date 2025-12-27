import { Ollama } from 'ollama';

interface OllamaOptions {
  temperature?: number;
  num_predict?: number; // max tokens
  top_k?: number;
  top_p?: number;
}

export class OllamaService {
  private client: Ollama | null = null;
  private model: string = 'llama3';

  constructor() {
    // Lazy initialization to ensure environment variables are loaded
  }

  private getClient(): Ollama {
    if (!this.client) {
      const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const apiKey = process.env.OLLAMA_API_KEY || '';
      this.model = process.env.OLLAMA_MODEL || 'llama3';

      console.log('Initializing Ollama Service with:', { host, model: this.model });

      this.client = new Ollama({
        host: host,
        headers: apiKey ? {
          Authorization: `Bearer ${apiKey}`,
        } : undefined,
      });
    }
    return this.client;
  }

  async generate(prompt: string, options: OllamaOptions = {}): Promise<string> {
    try {
      const client = this.getClient();
      const response = await client.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.num_predict || 1000,
          top_k: options.top_k,
          top_p: options.top_p,
        },
      });

      let fullContent = '';
      for await (const part of response) {
        fullContent += part.message.content;
      }

      return fullContent;
    } catch (error) {
      console.error('Ollama Service Error:', error);
      throw error;
    }
  }

  async generateJson(prompt: string, options: OllamaOptions = {}): Promise<any> {
    try {
      const client = this.getClient();
      const response = await client.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.num_predict || 2000, // Higher limit for JSON
          top_k: options.top_k,
          top_p: options.top_p,
        },
      });

      let fullContent = '';
      for await (const part of response) {
        fullContent += part.message.content;
      }

      try {
        // Sanitize response: remove markdown code blocks and comments if present
        const cleanContent = fullContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/\/\/.*/g, '') // Remove single line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .trim();
          
        return JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', fullContent);
        console.error('Parse Error:', parseError);
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      console.error('Ollama Service JSON Error:', error);
      if (error instanceof Error) {
        console.error('Error Stack:', error.stack);
        // Log connection details for debugging
        console.error('Ollama Connection Details:', {
            host: process.env.OLLAMA_HOST || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'llama3'
        });
      }
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();
