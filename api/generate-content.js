export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;

    // ⚠️ Replace this with your actual Gemini API key
    const apiKey = "AIzaSyBRhoN2SDUqIbmHqdW0lc6XBOoN7__YE1M";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("Gemini API Response:", JSON.stringify(data, null, 2));

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      null;

    if (generatedText) {
      return res.status(200).json({ response: generatedText });
    } else {
      return res.status(200).json({ response: "No content returned from Gemini." });
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
