export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  const response = await fetch("https://api-inference.huggingface.co/models/SG161222/RealVisXL_V3.0_Turbo", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_HUGGINGFACE_API_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(500).json({ error: "Failed to generate image", details: err });
  }

  const buffer = await response.arrayBuffer();
  res.setHeader("Content-Type", "image/png");
  res.send(Buffer.from(buffer));
}

