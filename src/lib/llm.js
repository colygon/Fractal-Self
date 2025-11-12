/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import pLimit from 'p-limit'

const timeoutMs = 123_333;

// Get AI Gateway API key from environment
const AI_GATEWAY_API_KEY = import.meta.env.VITE_AI_GATEWAY_API_KEY;

if (!AI_GATEWAY_API_KEY) {
    console.error("No AI Gateway API key found. Please provide VITE_AI_GATEWAY_API_KEY environment variable.");
    console.error("Available env keys:", Object.keys(import.meta.env));
}

// Create OpenAI-compatible client pointing to AI Gateway
const aiGateway = createOpenAI({
  apiKey: AI_GATEWAY_API_KEY,
  baseURL: 'https://api.vercel.com/v1/ai',
});

// Define the response schema for image generation
const imageResponseSchema = z.object({
  image: z.object({
    base64: z.string(),
    mimeType: z.string(),
  }),
});


async function generate({model, prompt, inputFile, signal}) {
  try {
    console.log(`Starting generation with Vercel AI Gateway using model: ${model}`);

    // Verify API key is available
    if (!AI_GATEWAY_API_KEY) {
      throw new Error('AI Gateway API key not configured. Please set VITE_AI_GATEWAY_API_KEY environment variable.');
    }

    // Check if aborted before starting
    if (signal?.aborted) {
      console.log('Request aborted before API call.');
      throw new Error('Aborted');
    }

    // Map the model string to AI Gateway format
    // The model parameter comes in as something like 'gemini-2.0-flash-exp-vision'
    // We'll use Google's image generation model through AI Gateway
    const aiGatewayModel = 'google/gemini-2.5-flash-image-preview';

    // Prepare the prompt with image if provided
    let messages = [];
    
    if (inputFile) {
      // If we have an input image, include it in the message
      const base64Data = inputFile.split(',')[1];
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

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );

    // Use OpenAI SDK with AI Gateway for image generation
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: AI_GATEWAY_API_KEY,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
      dangerouslyAllowBrowser: true, // Safe because we're using AI Gateway, not direct OpenAI API
    });

    // Make the API call
    const completionPromise = openai.chat.completions.create({
      model: aiGatewayModel,
      messages,
      // Request both text and image modalities
      modalities: ['text', 'image'],
      stream: false,
    }, {
      signal,
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    // Check again after API call completes
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    const message = completion.choices[0].message;

    // Extract the generated image from the response
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      const firstImage = message.images[0];
      if (firstImage.type === 'image_url' && firstImage.image_url?.url) {
        console.log(`✅ Successfully generated image using AI Gateway`);
        return firstImage.image_url.url; // This is already a data URL
      }
    }

    throw new Error('No image found in response');

  } catch (error) {
    if (signal?.aborted) {
      console.log('Request aborted by user.');
      throw error;
    }
    
    console.error(`❌ AI Gateway error:`, error.message);
    throw error;
  }
}

const limit = pLimit(2);

export default function(args) {
  return limit(() => generate(args));
}