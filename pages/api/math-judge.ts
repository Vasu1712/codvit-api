import { NextApiRequest, NextApiResponse } from 'next';

const riddleCache = new Map<string, {
  description: string;
  title: string;
  correctAnswer: string;
  explanation?: string;
}>();

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

    const { answer, riddleId } = req.body;
    
    if (!answer || !riddleId) {
      return res.status(400).json({ 
        error: 'Answer or riddleId is missing.',
        isAcceptable: false,
        description: 'Please provide both an answer and a riddleId.'
      });
    }

    // Retrieve the cached riddle data
    const riddleData = riddleCache.get(riddleId);
    
    if (!riddleData) {
      return res.status(404).json({
        isAcceptable: false,
        description: "Riddle not found or expired. Please try a new riddle."
      });
    }

    // Compare the user's answer with the stored correct answer
    // Normalize both answers for comparison (lowercase, trim spaces)
    const normalizedUserAnswer = answer.toLowerCase().trim();
    const normalizedCorrectAnswer = riddleData.correctAnswer.toLowerCase().trim();
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    return res.status(200).json({
      isAcceptable: isCorrect,
      description: isCorrect 
        ? `Correct! ${riddleData.explanation || ''}` 
        : "That's not the right answer. Try again!"
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}