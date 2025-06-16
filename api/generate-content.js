// /api/generate-content.js
export default async function handler(req, res) {
  const body = await req.json();

  const prompt = `Generate a week's worth of social media content for a brand called "${body.brand}" in a ${body.tone} tone.`;

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyC6uD4XGV38bMTdVzd3lQPf2qYLgCQSsys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No result.";

  res.status(200).json({ result });
}
