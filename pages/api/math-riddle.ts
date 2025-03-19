import { NextApiRequest, NextApiResponse } from 'next';
import { HfInference } from '@huggingface/inference';
// import crypto from 'crypto';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// interface MathRiddleResponse {
//   title?: string;
//   description?: string;
//   options?: string[];
//   _hiddenData?: string;
//   message?: string;
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const level = req.query.level;
    if (!level || typeof level !== 'string') {
      return res.status(400).json({ message: 'Level query parameter is required and must be a string' });
    }

    const prompt = `Generate a math riddle of difficulty level ${level} (where 1 is easiest and 100 is hardest).
      
    The riddle should be challenging but solvable without advanced mathematics for levels below 50.
    For levels 50-100, you can include more advanced concepts.
    
    Format your response as a JSON object with exactly these fields:
    {
      "title": "A catchy title for the riddle",
      "description": "The detailed riddle text with any necessary context",
      "options": ["option1", "option2", "option3", "option4"],
      "correctOptionIndex": 0, // Index (0-3) of the correct option
      "explanation": "Brief explanation of why this is the correct answer"
    }
    
    Ensure that:
    1. The options array contains exactly 4 options
    2. The correct answer must be one of the options
    3. The other options should be plausible but incorrect
    4. The correctOptionIndex is the index (0-3) of the correct answer in the options array
    
    Only return the JSON object and nothing else.`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
      },
    });

    console.log('Generated Response:', response.generated_text);

    if (response && response.generated_text) {
      try {
        // Extract JSON from the response
        const jsonMatches = response.generated_text.match(/\{[\s\S]*?\}/g);
        
        if (jsonMatches && jsonMatches.length > 0) {
          const lastJsonStr = jsonMatches[jsonMatches.length - 1];
          const parsedData = JSON.parse(lastJsonStr);
          
          // Create hidden data with correctOptionIndex and explanation
          const secretData = {
            correctOptionIndex: parsedData.correctOptionIndex,
            explanation: parsedData.explanation
          };
          
          // Base64 encode the secret data
          const _hiddenData = Buffer.from(JSON.stringify(secretData)).toString('base64');
          
          // Return data to client (including encoded hidden data)
          return res.status(200).json({
            title: parsedData.title,
            description: parsedData.description,
            options: parsedData.options,
            _hiddenData // The client will pass this back when submitting
          });
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
      }
      
      // Fallback to regex if JSON parsing fails
      const titleMatch = response.generated_text.match(/"title"\s*:\s*"([^"]+)"/);
      const descriptionMatch = response.generated_text.match(/"description"\s*:\s*"([^"]+)"/);
      
      return res.status(200).json({
        title: titleMatch ? titleMatch[1].trim() : "Math Riddle",
        description: descriptionMatch ? descriptionMatch[1].trim() : "No description available."
      });
    } else {
      return res.status(500).json({ message: 'Failed to fetch math riddle from Hugging Face API' });
    }
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
