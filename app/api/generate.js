module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { topic, n = 10, level = 'beginner', format = 'qa' } = req.body || {};
    const system = `You are an expert tutor. Generate concise flashcards. Return STRICT JSON: an array of objects with keys: q, a, hint, tag.`;
    const user = `Topic: ${topic}
Cards: ${n}
Audience: ${level}
Format: ${format}
Return ONLY raw JSON array.`;

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
          { role: 'user', content: user },
        ],
        temperature: 0.3,
      }),
    });

    if (!r.ok) return res.status(500).json({ error: 'OpenAI error', detail: await r.text() });
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? '[]';
    let deck;
    try { deck = JSON.parse(raw); } catch { deck = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    if (!Array.isArray(deck)) return res.status(500).json({ error: 'Model did not return array' });

    const safe = deck.slice(0, n).map((c, i) => ({
      id: i + 1,
      q: String(c.q ?? '').slice(0, 160),
      a: String(c.a ?? '').slice(0, 400),
      hint: String(c.hint ?? '').slice(0, 120),
      tag: String(c.tag ?? 'general').slice(0, 40),
      box: 1,
    }));
    res.json({ cards: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};