import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Submission {
  puzzle_id: string;
  username: string;
  time_taken: number;
  submission_time: string; // Change this from Date to string
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { puzzleId, answer, submissionTime, username } = req.body;
  console.log('Incoming request body:', req.body);
    
    if (!puzzleId || typeof puzzleId !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid puzzleId format' 
      });
    }

    if (!answer || !username) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

  try {

    console.log('Checking puzzle with ID:', puzzleId);
    // 1. Validate puzzle answer
    const { data: puzzle, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single();

    console.log('Puzzle query result:', puzzle);
    console.log('Puzzle query error:', error);

    if (error || !puzzle) throw new Error('Invalid puzzle');

    const isCorrect = puzzle.answer.toLowerCase() === answer.toLowerCase();

    if (!isCorrect) {
      return res.status(200).json({ isCorrect: false });
    }

     //Storing correct submission
    const { error: submissionError } = await supabase
      .from('potd_submissions')
      .insert({
        puzzle_id: puzzleId,
        username,
        time_taken: submissionTime,
        submission_time: new Date().toISOString()
      } as Submission) // Add type assertion here
      .select()
      .single();

    if (submissionError) throw submissionError;


    // 3. Calculate percentile
    const { count: total } = await supabase
      .from('potd_submissions')
      .select('*', { count: 'exact' })
      .eq('puzzle_id', puzzleId);

    const { count: faster } = await supabase
      .from('potd_submissions')
      .select('*', { count: 'exact' })
      .eq('puzzle_id', puzzleId)
      .lt('time_taken', submissionTime);

    const percentile = ((faster || 0) / (total || 1)) * 100;

    res.status(200).json({
      isCorrect: true,
      timeTaken: submissionTime,
      percentileBeat: percentile.toFixed(2)
    });

  } catch (error) {
    console.error('Submission error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
