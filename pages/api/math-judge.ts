import { NextApiRequest, NextApiResponse } from 'next';

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

    const { selectedOptionIndex, _hiddenData } = req.body;
    
    if (selectedOptionIndex === undefined || !_hiddenData) {
      return res.status(400).json({
        error: 'Selected option index or hidden data is missing.',
        isAcceptable: false,
        description: 'Please provide both a selected option and the hidden data.'
      });
    }
    
    try {
      // Decode the hidden data
      const hiddenDataStr = Buffer.from(_hiddenData, 'base64').toString('utf8');
      const { correctOptionIndex, explanation } = JSON.parse(hiddenDataStr);
      
      // Compare selected option with correct option
      const isCorrect = parseInt(selectedOptionIndex) === correctOptionIndex;
      
      return res.status(200).json({
        isAcceptable: isCorrect,
        description: isCorrect 
          ? `Correct! ${explanation || ''}` 
          : "That's not the right answer. Try again!"
      });
    } catch (decodeError) {
      console.error('Error decoding hidden data:', decodeError);
      return res.status(400).json({ 
        isAcceptable: false,
        description: 'Invalid hidden data. Please try a new riddle.'
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
