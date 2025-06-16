import { GoogleGenerativeAI } from "@google/generative-ai";

// Load your Gemini API key from env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Utility to read raw body (needed for Vercel's native req object)
async function getRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString();
  return JSON.parse(body);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await getRequestBody(req);
    const prompt = body.prompt || "Generate something creative";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ result: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
