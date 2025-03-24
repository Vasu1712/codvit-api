import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@vercel/edge-config';
import fetch from 'node-fetch';

const edgeConfig = createClient(process.env.EDGE_CONFIG);

async function updateEdgeConfig(key: string, value: unknown) {
  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key,
            value,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update Edge Config');
  }

  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, description, answer, image } = req.body;
    const puzzleId = `puzzle:${Date.now()}`;

    // Store puzzle data in Edge Config
    await updateEdgeConfig(puzzleId, {
      title,
      description,
      answer,
      imageUrl: image,
      submissionDate: new Date().toISOString()
    });

    // Update the list of puzzle keys
    const existingKeys = (await edgeConfig.get('puzzleKeys')) as string[] || [];
    await updateEdgeConfig('puzzleKeys', [...existingKeys, puzzleId]);

    res.status(200).json({ message: 'Puzzle submitted successfully' });
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    res.status(500).json({ message: 'Error submitting puzzle' });
  }
}
