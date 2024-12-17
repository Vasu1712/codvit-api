import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export async function callMistralAI(prompt: string) {
  const response = await hf.textGeneration({
    model: 'mistral',
    inputs: prompt,
    parameters: {
      max_length: 500, 
      temperature: 0.7, 
    },
  });

  return response;
}
