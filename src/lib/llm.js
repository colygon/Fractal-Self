/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import pLimit from 'p-limit'

const timeoutMs = 123_333;

async function generate({model, prompt, inputFile, signal}) {
  try {
    console.log(`Starting generation with Vercel AI Gateway using model: ${model}`);

    // Check if aborted before starting
    if (signal?.aborted) {
      console.log('Request aborted before API call.');
      throw new Error('Aborted');
    }

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );

    // Call our serverless function instead of AI Gateway directly
    const apiPromise = fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        inputFile,
      }),
      signal,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);

    // Check if aborted after API call
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`✅ Successfully generated image using AI Gateway`);
    return data.imageUrl;

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