import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image, description, answer, username } = req.body;

    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'puzzle-submissions',
      public_id: `puzzle-${Date.now()}`,
      context: {
        description: description,
        answer: answer,
        username: username,
        submissionDate: new Date().toISOString()
      }
    });

    res.status(200).json({ 
      message: 'Puzzle submitted successfully',
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    });
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    res.status(500).json({ message: 'Error submitting puzzle' });
  }
}
