export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  try {
    const { prompt } = req.body
    const apiKey = process.env.GEMINI_API_KEY

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const data = await response.json()

    if (data.candidates && data.candidates[0]) {
      const generatedText = data.candidates[0].content.parts[0].text
      return res.status(200).json({ response: generatedText })
    } else {
      return res.status(500).json({ error: "Failed to generate content from Gemini." })
    }
  } catch (err) {
    console.error("Gemini API Error:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}


