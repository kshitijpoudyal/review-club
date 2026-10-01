import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_PRODUCT_NAME_LENGTH = 300;

interface GenerateReviewRequestBody {
  productName?: unknown;
}

interface GenerateReviewSuccess {
  title: string;
  review: string;
}

interface GenerateReviewError {
  error: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Short, natural Amazon review title, max 60 characters.' },
    review: { type: Type.STRING, description: '2-4 sentence first-person Amazon product review body.' },
  },
  required: ['title', 'review'],
};

function buildPrompt(productName: string): string {
  return `Write a short, authentic Amazon product review for the following product, as if you are a genuine customer who purchased and used it.

Product name: "${productName}"

Requirements:
- Title: a concise, natural review title (max 60 characters), no surrounding quotation marks.
- Review: 2-4 sentences, first-person, specific and natural-sounding, positive but not exaggerated, no mention of AI or being generated, no markdown, no emojis, no hashtags.

Respond only with the structured JSON output matching the schema.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' } satisfies GenerateReviewError);
  }

  const body = req.body as GenerateReviewRequestBody;
  const productName = typeof body?.productName === 'string' ? body.productName.trim() : '';

  if (!productName) {
    return res.status(400).json({ error: 'productName is required' } satisfies GenerateReviewError);
  }
  if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
    return res.status(400).json({ error: 'productName is too long' } satisfies GenerateReviewError);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ error: 'Review generation is not configured' } satisfies GenerateReviewError);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(productName),
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.8,
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(text) as Partial<GenerateReviewSuccess>;

    if (!parsed.title || !parsed.review) {
      console.error('Gemini response missing title/review:', parsed);
      throw new Error('Incomplete response from model');
    }

    return res.status(200).json({
      title: parsed.title.trim(),
      review: parsed.review.trim(),
    } satisfies GenerateReviewSuccess);
  } catch (err) {
    console.error('Gemini generate-review failed:', err);
    return res.status(502).json({ error: 'Failed to generate review. Please try again.' } satisfies GenerateReviewError);
  }
}
