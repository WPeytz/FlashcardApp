export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    return res.status(500).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
  }

  try {
    const { topic, n = 10, level = 'beginner', format = 'qa' } = req.body || {};
    if (!topic || !String(topic).trim()) return res.status(400).json({ error: 'Missing topic' });

    const system = `You are an expert tutor. Generate concise flashcards.
Return STRICT JSON: an array of objects with keys: q, a, hint, tag.
- q: question (max 18 words)
- a: answer (1–2 sentences)
- hint: short nudge
- tag: subtopic
Audience level: ${level}. Format: ${format}.`;

    const user = `Topic: ${topic}
Cards: ${n}
Constraints:
- Avoid fluff, be accurate.
- Use varied subtopics.
- Prefer concrete examples.
- Never include code fences or commentary, ONLY raw JSON array.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3
      })
    });

    if (!r.ok) {
      const t = await r.text();
      console.error('OpenAI error', r.status, t);
      return res.status(502).json({ error: 'Upstream OpenAI error', status: r.status, detail: t });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? '[]';

    let deck;
    try { deck = JSON.parse(raw); }
    catch { deck = JSON.parse(raw.replace(/```json|```/g, '').trim()); }

    if (!Array.isArray(deck)) return res.status(500).json({ error: 'Model did not return JSON array' });

    const safe = deck.slice(0, n).map((c, i) => ({
      id: i + 1,
      q: String(c.q ?? '').slice(0, 160),
      a: String(c.a ?? '').slice(0, 400),
      hint: String(c.hint ?? '').slice(0, 120),
      tag: String(c.tag ?? 'general').slice(0, 40),
      box: 1
    }));

    res.json({ cards: safe });
  } catch (e) {
    console.error('Function crash:', e);
    res.status(500).json({ error: 'Function crashed', detail: e.message });
  }
}