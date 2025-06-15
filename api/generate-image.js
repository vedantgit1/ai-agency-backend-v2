// api/generate-image.js
// This file serves as a Vercel Serverless Function to generate images using Google Gemini.

// Conditional dotenv import for local development.
// This allows you to use a .env.local file when running 'vercel dev' locally.
// On Vercel's deployed environment, environment variables are loaded automatically.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env.local' });
}

// Import the Google Generative AI SDK.
// This dependency must be listed in your project's package.json.
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Configuration from Environment Variables ---
// Your Google Gemini API Key.
// MUST be set as an environment variable named GOOGLE_GEMINI_API_KEY
// in your Vercel project settings (and in .env.local for local testing).
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// Log a warning if the API key is not found (useful for debugging setup issues).
if (!GEMINI_API_KEY) {
    console.error("SERVER CONFIG ERROR: GOOGLE_GEMINI_API_KEY environment variable is not set. Image generation will fail.");
}

// Initialize the Google Generative AI client with your API key.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Define the Gemini model to use for image generation.
// 'gemini-1.5-pro' is a powerful multimodal model capable of generating images.
// 'gemini-1.5-flash' is another option, often faster and cheaper for similar capabilities.
const MODEL_NAME = "gemini-1.5-pro";

/**
 * Vercel Serverless Function Entry Point.
 * This function handles incoming HTTP requests to the /api/generate-image endpoint.
 * It expects a POST request with a JSON body containing a 'prompt' field.
 * It uses the Gemini API to generate an image based on the prompt and returns its Base64 data.
 *
 * @param {object} req - The HTTP request object provided by Vercel.
 * @param {object} res - The HTTP response object provided by Vercel.
 */
module.exports = async (req, res) => {
  // 1. Validate HTTP Request Method
  // Only accept POST requests for security and proper API design.
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'This endpoint only accepts POST requests.'
    });
  }

  // 2. Validate Request Content-Type
  // Ensure the client (Framer frontend) sends data in JSON format.
  if (req.headers['content-type'] !== 'application/json') {
      return res.status(400).json({
          error: 'Bad Request',
          message: 'Request Content-Type must be application/json.'
      });
  }

  // 3. Extract Prompt from Request Body
  const { prompt } = req.body;

  // Validate the 'prompt' field: it must be a non-empty string.
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A non-empty string "prompt" is required in the request body.'
    });
  }

  // 4. Pre-check for API Key availability before attempting Gemini call
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Gemini API key is not configured on the server. Please contact support.'
    });
  }

  // 5. Call Google Gemini API
  try {
    // Get the specified generative model.
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Construct the request for image generation.
    // We provide a text prompt to guide the AI to generate a visual representation.
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            // Explicitly ask for image output to guide the multimodal model.
            { text: "Generate an image that visually represents this text description. Ensure the output is an image." }
          ],
        },
      ],
    });

    const response = await result.response; // Get the overall response object
    const candidates = response.candidates; // Get the list of AI-generated candidates

    // 6. Process Gemini's Response
    if (candidates && candidates.length > 0) {
      const firstCandidate = candidates[0]; // Take the first candidate response
      const parts = firstCandidate.content.parts; // Get the content parts (text, image, etc.)

      // Find the first part that contains inline image data.
      const imagePart = parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));

      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
        // If an image part is found, extract its Base64 data.
        const base64Image = imagePart.inlineData.data;

        // 7. Send Base64 Image Data Back to Frontend
        // The frontend (Framer) will then use this Base64 string to display the image.
        return res.status(200).json({ base64Image: base64Image });
      } else {
        // If the AI model didn't return an image part despite the prompt.
        console.warn("Gemini did not return an image for prompt:", prompt, "Full response:", JSON.stringify(response.toJson(), null, 2));
        return res.status(500).json({
          error: 'Generation Failed',
          message: 'The AI model could not generate an image for the given prompt. Please try rephrasing.'
        });
      }
    } else {
      // If the entire AI response was empty or malformed.
      console.error("AI model returned an empty or malformed response for prompt:", prompt);
      return res.status(500).json({
        error: 'Generation Error',
        message: 'AI model response was empty or malformed. Please try again.'
      });
    }

  } catch (error) {
    // 8. Handle API Call Errors
    console.error("Detailed Error calling Gemini API:", error);
    // Send a generic error message to the frontend for security and user experience.
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate image from AI due to a server error. Please check backend logs for details.'
    });
  }
};
