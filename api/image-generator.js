// api/image-generator.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const HF_TOKEN = process.env.HF_TOKEN; // Securely from Vercel env variable

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: error.error || 'Hugging Face request failed' });
    }

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    res.status(200).json({ image: `data:image/png;base64,${base64Image}` });
  } catch (error) {
    res.status(500).json({ error: 'Image generation failed: ' + error.message });
  }
}
