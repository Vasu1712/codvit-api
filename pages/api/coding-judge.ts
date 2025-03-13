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

    const { code, problem, language } = req.body;
    if (!code || !problem || !language) {
      return res.status(400).json({ error: 'Code or problem description is missing.' });
    }

    // Structured prompt to force a JSON-like response
    const prompt = `You are a precise code evaluator for programming challenges.
      Problem: ${problem}
      User Solution: ${code}
      Language: ${language}

      Analyze the code for correctness, efficiency, edge cases, and code quality.
      After your evaluation, return the result in this structured JSON format:

      {
        "isAcceptable": "Yes" or "No",
        "explanation": "A brief explanation of why the solution is correct or incorrect."
      }

      Only return the JSON object without any extra text or explanations.`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: prompt,
      parameters: { max_new_tokens: 500, temperature: 0.7 },
    });

    const generatedText = response?.generated_text?.trim();
    console.log('Generated Response:', generatedText); // Log for debugging

    // Attempt to extract the last JSON object in the text
    try {
      // Find all JSON-like patterns in the response
      const jsonPattern = /\{[\s\S]*?\}/g;
      const matches = [...generatedText.matchAll(jsonPattern)];
      
      if (matches.length > 0) {
        // Take the last match, which is most likely the result JSON
        const lastJsonMatch = matches[matches.length - 1][0];
        
        try {
          const parsedResult = JSON.parse(lastJsonMatch);
          
          if (parsedResult && typeof parsedResult === 'object') {
            const isAcceptable = parsedResult.isAcceptable?.toLowerCase() === 'yes';
            const explanation = parsedResult.explanation || 'No explanation provided.';
            
            return res.status(200).json({
              isAcceptable,
              description: explanation
            });
          }
        } catch (jsonError) {
          console.warn('Failed to parse extracted JSON:', jsonError);
          // Continue to fallback methods
        }
      }
    } catch (regexError) {
      console.warn('Failed to extract JSON with regex:', regexError);
    }

    // Fallback to simpler parsing if JSON extraction fails
    const match = generatedText.match(/(Yes|No)/i);
    if (match) {
      const isAcceptable = match[1].toLowerCase() === 'yes';
      const description = generatedText.replace(/(Yes|No)/i, '').trim();
      
      return res.status(200).json({
        isAcceptable,
        description: description || 'No detailed explanation available.'
      });
    }

    return res.status(200).json({
      isAcceptable: false,
      description: "Unable to determine acceptability from the response."
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}


