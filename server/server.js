import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    const { topic, n = 10, level = "beginner", format = "qa" } = req.body;

    const system = `You are an expert tutor. Generate concise flashcards.
Return STRICT JSON: an array of objects with keys: q, a, hint, tag.
- q: question (max 18 words)
- a: answer (1–2 sentences)
- hint: short nudge
- tag: subtopic
Audience level: ${level}. Format: ${format}.`;

    const user = `Topic: ${topic}\nCards: ${n}\nConstraints:
- Avoid fluff, be accurate.
- Use varied subtopics.
- Prefer concrete examples.
- Never include code fences or commentary, ONLY raw JSON array.`;

    // Call OpenAI (Responses-style JSON)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.3
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "OpenAI error", detail: t });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "[]";
    // Try parse JSON; if dirty, attempt cleanup
    let deck;
    try {
      deck = JSON.parse(raw);
    } catch {
      // crude cleanup: strip code fences if present
      const cleaned = raw.replace(/```json|```/g, '').trim();
      deck = JSON.parse(cleaned);
    }
    if (!Array.isArray(deck)) throw new Error("Model did not return an array");

    // guard shape
    const safe = deck.slice(0, n).map((c, i) => ({
      id: i + 1,
      q: String(c.q ?? "").slice(0, 160),
      a: String(c.a ?? "").slice(0, 400),
      hint: String(c.hint ?? "").slice(0, 120),
      tag: String(c.tag ?? "general").slice(0, 40),
      box: 1 // Leitner start
    }));

    res.json({ cards: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/regenerate', async (req, res) => {
  try {
    const { topic, level = "beginner", format = "qa", tag = "general" } = req.body;

    const system = `You are an expert tutor. Regenerate ONE concise flashcard as a JSON object with keys: q, a, hint, tag.
- q: question (max 18 words)
- a: answer (1–2 sentences)
- hint: short nudge
- tag: subtopic (may reuse provided tag)
Audience level: ${level}. Format: ${format}.`;

    const user = `Topic: ${topic}\nRegenerate ONE card for subtopic/tag: ${tag}.\nConstraints:\n- Avoid fluff, be accurate.\n- Prefer a different angle than before.\n- Return ONLY a single JSON object, no code fences.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.4
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "OpenAI error", detail: t });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      obj = JSON.parse(cleaned);
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error("Model did not return an object");
    }

    const safe = {
      q: String(obj.q ?? "").slice(0,160),
      a: String(obj.a ?? "").slice(0,400),
      hint: String(obj.hint ?? "").slice(0,120),
      tag: String(obj.tag ?? tag).slice(0,40)
    };

    res.json({ card: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server on http://localhost:${port}`));