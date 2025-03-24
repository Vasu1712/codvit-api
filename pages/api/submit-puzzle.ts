import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, description, answer, image } = req.body;
    const puzzleId = `puzzle:${Date.now()}`;

    const { error } = await supabase
      .from('puzzles')
      .insert({
        id: puzzleId,
        title,
        description,
        answer,
        image_url: image,
        submission_date: new Date().toISOString()
      });

    if (error) throw error;

    res.status(200).json({ message: 'Puzzle submitted successfully' });
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    res.status(500).json({ message: 'Error submitting puzzle' });
  }
}
