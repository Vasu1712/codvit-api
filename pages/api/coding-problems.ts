import { NextApiRequest, NextApiResponse } from 'next';

import { HfInference } from '@huggingface/inference';



const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);



interface CodingProblemResponse {

problem?: string;

message?: string;

title?: string;

description?: string;

example?: string;

}



// interface NextApiResponseType extends NextApiResponse {

// json<T>(data: T): NextApiResponseType

// }



export default async function handler(

req: NextApiRequest,

res: NextApiResponse<CodingProblemResponse>

) {

res.setHeader('Access-Control-Allow-Origin', '*');

res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {

return res.status(200).end(); // Preflight response

}


try {


if (req.method !== 'GET') {

return res.status(405).json({ message: 'Method not allowed' });

}



const level = req.query.level;

if (!level || typeof level !== 'string') {

return res

.status(400)

.json({ message: 'Level query parameter is required and must be a string' });

}




const prompt = `Generate a DSA coding problem for level ${level}. The problem should be one problem from the topics Arrays, Linked Lists, Stacks, Queues, recursion, dfs, bfs, Graphs or Hash Tables.

Try to explain the problem in the description part as much as possible. You are asking as an interviewer so please don't respond with solutions. Ask only one problem.

The response should contain the following format:

{

"title":"problem title",

"description":"problem description",

`;



const response = await hf.textGeneration({

model: 'mistralai/Mistral-7B-Instruct-v0.3',

inputs: prompt,

parameters: {

max_new_tokens: 500,

temperature: 0.7,

},

});



console.log(response.generated_text);



if (response && response.generated_text) {

const problemText = response.generated_text;


const titleRegex = /(?:[^{}]*\{[^{}]*"title":"[^"]*"[^{}]*\})\s*\{[^{}]*"title":"([^"]*)"/;

const descriptionRegex = /(?:[^{}]*\{[^{}]*"description":"[^"]*"[^{}]*\})\s*\{[^{}]*"description":"([^"]*)"/;


// Extracting Data

const titleMatch = problemText.match(titleRegex);

const descriptionMatch = problemText.match(descriptionRegex);


// Preparing Response

const responseData: CodingProblemResponse = {};


if (titleMatch && titleMatch[1]) responseData.title = titleMatch[1].trim();

if (descriptionMatch && descriptionMatch[1]) responseData.description = descriptionMatch[1].trim();


return res.status(200).json(responseData);

} else {

return res

.status(500)

.json({ message: 'Failed to fetch coding problem from Hugging Face API' });

}

} catch (error) {

console.error('Error occurred:', error);

return res.status(500).json({ message: 'Internal server error' });

}

}