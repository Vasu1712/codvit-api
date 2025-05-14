import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const daysSinceEpoch = Math.floor(new Date(today).getTime() / (24 * 60 * 60 * 1000));

    let puzzleData;

    // Check if there's a puzzle already set for today
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('puzzle_date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No puzzle found for today, select one based on the current date
        const { data: puzzles, error: puzzlesError } = await supabase
          .from('puzzles')
          .select('*')
          .is('puzzle_date', null)
          .order('id', { ascending: true });

        if (puzzlesError) throw puzzlesError;

        if (puzzles && puzzles.length > 0) {
          const puzzleIndex = daysSinceEpoch % puzzles.length;
          puzzleData = puzzles[puzzleIndex];

          // Update the selected puzzle with today's date
          const { error: updateError } = await supabase
            .from('puzzles')
            .update({ puzzle_date: today })
            .eq('id', puzzleData.id);

          if (updateError) throw updateError;
        } else {
          return res.status(404).json({ message: 'No puzzles available' });
        }
      } else {
        throw error;
      }
    } else {
      puzzleData = data;
    }

    if (!puzzleData) {
      return res.status(404).json({ message: 'No puzzle found for today' });
    }

    res.status(200).json({
      puzzleId: puzzleData.id,
      title: puzzleData.title,
      imageUrl: puzzleData.image_url,
      description: puzzleData.description,
      username: puzzleData.username,
      submissionDate: puzzleData.submission_date
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
