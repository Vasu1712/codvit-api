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
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .order('submission_date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'No puzzles found' });
    }

    res.status(200).json({
      imageUrl: data.image_url,
      description: data.description,
      username: data.username,
      submissionDate: data.submission_date
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
