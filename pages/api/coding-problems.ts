import { NextApiRequest, NextApiResponse } from 'next';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

interface CodingProblemResponse {
  title?: string;
  description?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CodingProblemResponse>) {
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

    // Modified prompt to encourage clean JSON output
    const prompt = `Generate a DSA coding problem for level ${level}. The problem should be one problem from the topics Arrays, Linked Lists, Stacks, Queues, recursion, DFS, BFS, Graphs, or Hash Tables.

Explain the problem in the description part as much as possible. You are asking as an interviewer, so please don't provide solutions. Only ask one problem.

Respond ONLY with a JSON object in this exact format:

{
  "title": "Your generated problem title here",
  "description": "Your detailed problem description here"
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
      const problemText = response.generated_text;
      
      // Approach 1: Try JSON parsing first
      try {
        // Find JSON objects in the text
        const jsonMatches = problemText.match(/\{[\s\S]*?\}/g);
        
        if (jsonMatches && jsonMatches.length > 0) {
          // Take the last JSON object if multiple are found
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
        // Fall back to regex approach
      }
      
      // Approach 2: Improved regex as fallback
      // Get all matches and use the last ones
      const allTitleMatches = [...problemText.matchAll(/"title"\s*:\s*"([^"]+)"/g)];
      const allDescriptionMatches = [...problemText.matchAll(/"description"\s*:\s*"([^"]+)"/g)];
      
      const titleMatch = allTitleMatches.length > 0 ? 
        allTitleMatches[allTitleMatches.length - 1] : null;
      
      const descriptionMatch = allDescriptionMatches.length > 0 ? 
        allDescriptionMatches[allDescriptionMatches.length - 1] : null;
      
      // Filter out the template strings from matches
      const title = titleMatch ? 
        (titleMatch[1].trim() === "Your generated problem title here" || 
         titleMatch[1].trim() === "problem title" ? 
         "Untitled Problem" : titleMatch[1].trim()) : 
        "Untitled Problem";
        
      const description = descriptionMatch ? 
        (descriptionMatch[1].trim() === "Your detailed problem description here" || 
         descriptionMatch[1].trim() === "problem description" ? 
         "No description available." : descriptionMatch[1].trim()) : 
        "No description available.";
      
      return res.status(200).json({
        title,
        description
      });
    } else {
      return res.status(500).json({ message: 'Failed to fetch coding problem from Hugging Face API' });
    }
  } catch (error) {
    console.error('Error occurred:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

