import { NextApiRequest, NextApiResponse } from 'next';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

interface MathRiddleResponse {
  title?: string;
  description?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MathRiddleResponse>) {
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

    const prompt = `Generate a challenging math riddle suitable for an audience with an average age of 16+. The riddle should require logical thinking, mathematical reasoning, and potentially some knowledge of concepts beyond basic arithmetic.

The riddle should have a clear numerical answer and be engaging. Avoid overly simplistic riddles.

Respond ONLY with a JSON object in this exact format:

{
  "title": "Your generated riddle title here",
  "description": "Your math riddle here"
}

Do not include any additional text before or after the JSON.`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
      },
    });

    console.log('Generated Response:', response.generated_text);

    if (response && response.generated_text) {
      const riddleText = response.generated_text;
      
      try {

        const jsonMatches = riddleText.match(/\{[\s\S]*?\}/g);
        
        if (jsonMatches && jsonMatches.length > 0) {
          const lastJsonStr = jsonMatches[jsonMatches.length - 1];
          const parsedData = JSON.parse(lastJsonStr);
          
          if (parsedData.title && parsedData.description) {
            return res.status(200).json({
              title: parsedData.title,
              description: parsedData.description
            });
          }
        }
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
      }
      
      const allTitleMatches = [...riddleText.matchAll(/"title"\s*:\s*"([^"]+)"/g)];
      const allDescriptionMatches = [...riddleText.matchAll(/"description"\s*:\s*"([^"]+)"/g)];
      
      const titleMatch = allTitleMatches.length > 0 ?
        allTitleMatches[allTitleMatches.length - 1] : null;
      
      const descriptionMatch = allDescriptionMatches.length > 0 ?
        allDescriptionMatches[allDescriptionMatches.length - 1] : null;
      
      const title = titleMatch ?
        (titleMatch[1].trim() === "Your generated riddle title here" ||
          titleMatch[1].trim() === "riddle title" ?
          "Untitled riddle" : titleMatch[1].trim()) :
          "Untitled riddle";
        
      const description = descriptionMatch ?
        (descriptionMatch[1].trim() === "Your detailed riddle description here" ||
          descriptionMatch[1].trim() === "riddle description" ? "No description available." : descriptionMatch[1].trim()) :
          "No description available.";
      
      return res.status(200).json({
        title,
        description
      });
    } else {
      return res.status(500).json({ message: 'Failed to fetch coding riddle from Hugging Face API' });
    }
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

