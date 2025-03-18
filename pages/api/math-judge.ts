import { NextApiRequest, NextApiResponse } from 'next';

// Access the same cache from the riddles endpoint
// In production, use a proper database or Redis
const riddleCache = new Map();

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

    const { riddleId, selectedOptionIndex } = req.body;
    
    if (riddleId === undefined || selectedOptionIndex === undefined) {
      return res.status(400).json({ error: 'Missing riddleId or selectedOptionIndex' });
    }
    
    // Retrieve the stored riddle data
    const riddleData = riddleCache.get(riddleId);
    
    if (!riddleData) {
      return res.status(404).json({ 
        isAcceptable: false,
        description: "Riddle data not found or expired. Please try a new riddle." 
      });
    }
    
    // Check if the selected option is correct
    const isCorrect = parseInt(selectedOptionIndex) === riddleData.correctOptionIndex;
    
    return res.status(200).json({
      isAcceptable: isCorrect,
      description: isCorrect 
        ? `Correct! ${riddleData.explanation}` 
        : "That's not the right answer. Try again with a new riddle."
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
