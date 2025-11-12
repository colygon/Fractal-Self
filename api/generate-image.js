/**
 * Serverless function to generate images using Vercel AI Gateway
 * This avoids CORS issues by calling AI Gateway from the server side
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, inputFile } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment
    const AI_GATEWAY_API_KEY = process.env.VITE_AI_GATEWAY_API_KEY;
    
    if (!AI_GATEWAY_API_KEY) {
      console.error('AI Gateway API key not configured');
      return res.status(500).json({ error: 'AI Gateway not configured' });
    }

    // Use dynamic import for OpenAI
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: AI_GATEWAY_API_KEY,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    // Prepare messages
    let messages = [];
    
    if (inputFile) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: inputFile,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    // Call AI Gateway
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash-image-preview',
      messages,
      modalities: ['text', 'image'],
      stream: false,
    });

    const message = completion.choices[0].message;

    // Extract generated image
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      const firstImage = message.images[0];
      if (firstImage.type === 'image_url' && firstImage.image_url?.url) {
        return res.status(200).json({ 
          imageUrl: firstImage.image_url.url 
        });
      }
    }

    return res.status(500).json({ error: 'No image found in response' });

  } catch (error) {
    console.error('AI Gateway error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate image' 
    });
  }
}
