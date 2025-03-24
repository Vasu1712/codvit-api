import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@vercel/edge-config';

const edgeConfig = createClient(process.env.EDGE_CONFIG);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get all puzzle keys
    const puzzleKeys = (await edgeConfig.get('puzzleKeys')) as string[] || [];
    
    if (puzzleKeys.length === 0) {
      return res.status(404).json({ message: 'No puzzles found' });
    }

    // Select a random puzzle
    const randomKey = puzzleKeys[Math.floor(Math.random() * puzzleKeys.length)] as string;
    const puzzleData = await edgeConfig.get(randomKey);

    if (!puzzleData || typeof puzzleData !== 'object' || Array.isArray(puzzleData)) {
      return res.status(404).json({ message: 'Puzzle not found' });
    }

    res.status(200).json({
      imageUrl: puzzleData.imageUrl,
      description: puzzleData.description,
      username: puzzleData.username,
      submissionDate: puzzleData.submissionDate
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
