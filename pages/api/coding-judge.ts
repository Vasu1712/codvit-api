import { NextApiRequest, NextApiResponse } from 'next';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, problem } = req.body;
    if (!code || !problem) {
      return res.status(400).json({ error: 'Code or problem description is missing.' });
    }

    const prompt = `Evaluate the following code for correctness and alignment with the given problem description:
    
    Problem: ${problem}
    Code: ${code}
    Is the code acceptable? Answer 'Yes' or 'No'. Provide a brief explanation.`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: prompt,
      parameters: { max_new_tokens: 500, temperature: 0.7 },
    });

    const generatedText = response?.generated_text?.trim();
    console.log('Generated Response:', generatedText); // Log for debugging

    // Improved parsing logic
    const match = generatedText.match(/(Yes|No)/i);
    if (match) {
      const isAcceptable = match[1].toLowerCase() === 'yes';
      const description = generatedText.replace(/(Yes|No)/i, '').trim();

      return res.status(200).json({
        isAcceptable: isAcceptable,
        description: description || '',
      });
    }

    return res.status(200).json({
      isAcceptable: false,
      description: "Unable to determine acceptability from the response.",
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
