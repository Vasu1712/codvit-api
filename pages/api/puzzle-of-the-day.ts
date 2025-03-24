import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get all puzzles from Cloudinary
    const result = await cloudinary.search
      .expression('folder:puzzle-submissions')
      .sort_by('public_id', 'desc')
      .max_results(30)
      .execute();

    if (result.resources.length > 0) {
      // Select a random puzzle
      const randomIndex = Math.floor(Math.random() * result.resources.length);
      const puzzle = result.resources[randomIndex];

      res.status(200).json({
        imageUrl: puzzle.secure_url,
        description: puzzle.context.description,
        username: puzzle.context.username,
        submissionDate: puzzle.context.submissionDate
      });
    } else {
      res.status(404).json({ message: 'No puzzles found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}