
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyOllamaConnection() {
  // Import service dynamically to ensure env vars are loaded
  const { ollamaService } = await import('../src/utils/ollama');

  console.log('Verifying Ollama Connection...');
  console.log(`Host: ${process.env.OLLAMA_HOST}`);
  console.log(`Model: ${process.env.OLLAMA_MODEL}`);

  try {
    console.log('\n--- Test 1: Simple Generation ---');
    const response = await ollamaService.generate('Explain what a mitochondrion is in one sentence.');
    console.log('Response:', response);

    console.log('\n--- Test 2: JSON Generation ---');
    const jsonResponse = await ollamaService.generateJson('Generate a JSON object with a "name" and "function" for the nucleus.');
    console.log('JSON Response:', JSON.stringify(jsonResponse, null, 2));

    console.log('\n✅ Ollama Connection Verified Successfully!');
  } catch (error) {
    console.error('\n❌ Ollama Connection Failed:', error);
    process.exit(1);
  }
}

verifyOllamaConnection();
