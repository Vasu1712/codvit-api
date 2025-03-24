import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const puzzlesPath = path.join(process.cwd(), 'puzzles.json');
const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf8'));

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { puzzleId, answer, submissionTime } = req.body;
  const puzzle = puzzles.find((p: { id: unknown; }) => p.id === puzzleId);

  if (!puzzle) {
    return res.status(404).json({ message: 'Puzzle not found' });
  }

  const isCorrect = puzzle.answer.toLowerCase() === answer.toLowerCase();
  
  // Here, you would typically save the submission to a database
  // For this example, we'll just return the result
  res.status(200).json({
    isCorrect,
    timeTaken: submissionTime
  });
}
