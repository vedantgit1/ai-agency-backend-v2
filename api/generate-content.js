export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { prompt } = req.body

    // Replace with Gemini call logic (dummy for now)
    const result = `Generated content for: "${prompt}"`

    res.status(200).json({ response: result })
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" })
  }
}

