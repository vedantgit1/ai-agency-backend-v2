// api/generate-image.js
// This file serves as a Vercel Serverless Function to generate images using Google Gemini.

// --- TEMPORARY: API Key hardcoded for local testing ---
// IMPORTANT: DO NOT DEPLOY THIS VERSION TO VERCEL OR PUSH TO GITHUB!
// This is for local testing convenience ONLY.
// Replace 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' with your real key.
const GEMINI_API_KEY = 'YOUR_ACTUAL_GEMINI_API_KEY_HERE'; // <<< REPLACE THIS LINE

// No dotenv import is needed when the key is hardcoded.
// const { GoogleGenerativeAI } = require("@google/generative-ai"); // Ensure this line is present and uncommented
// The above line should be already present in your file, just confirming.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client with your API key.
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Define the Gemini model to use for image generation.
const MODEL_NAME = "gemini-1.5-pro"; // Or 'gemini-1.5-flash'

/**
 * Vercel Serverless Function Entry Point.
 * This function handles incoming HTTP requests to the /api/generate-image endpoint.
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 */
module.exports = async (req, res) => {
  // 1. Validate HTTP Request Method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'This endpoint only accepts POST requests.'
    });
  }

  // 2. Validate Request Content-Type
  if (req.headers['content-type'] !== 'application/json') {
      return res.status(400).json({
          error: 'Bad Request',
          message: 'Request Content-Type must be application/json.'
      });
  }

  // 3. Extract Prompt from Request Body
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A non-empty string "prompt" is required in the request body.'
    });
  }

  // No explicit API key check here, as it's hardcoded for this temporary version.

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { text: "Generate an image that visually represents this text description. Ensure the output is an image." }
          ],
        },
      ],
    });

    const response = await result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0) {
      const firstCandidate = candidates[0];
      const parts = firstCandidate.content.parts;

      const imagePart = parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));

      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
        const base64Image = imagePart.inlineData.data;
        return res.status(200).json({ base64Image: base64Image });
      } else {
        console.warn("Gemini did not return an image for prompt:", prompt, "Full response:", JSON.stringify(response.toJson(), null, 2));
        return res.status(500).json({
          error: 'Generation Failed',
          message: 'The AI model could not generate an image for the given prompt. Please try rephrasing.'
        });
      }
    } else {
      console.error("AI model returned an empty or malformed response for prompt:", prompt);
      return res.status(500).json({
        error: 'Generation Error',
        message: 'AI model response was empty or malformed. Please try again.'
      });
    }

  } catch (error) {
    console.error("Detailed Error calling Gemini API:", error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate image from AI due to a server error. Please check backend logs for details.'
    });
  }
};
