import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, description, answer, image } = req.body;

    // Store puzzle data in Vercel KV
    const puzzleId = `puzzle:${Date.now()}`;
    await kv.set(puzzleId, JSON.stringify({
      title,
      description,
      answer,
      imageUrl: image,
      submissionDate: new Date().toISOString()
    }), { ex: 86400 * 90 }); // Expire after 90 days

    res.status(200).json({ message: 'Puzzle submitted successfully' });
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    res.status(500).json({ message: 'Error submitting puzzle' });
  }
}

