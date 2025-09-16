module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { topic, level = 'beginner', format = 'qa', tag = 'general' } = req.body || {};
    const system = `You are an expert tutor. Regenerate ONE concise flashcard as a JSON object with keys: q, a, hint, tag.`;
    const user = `Topic: ${topic}
Regenerate ONE card for subtopic/tag: ${tag}. Return ONLY a single JSON object.`;

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
        temperature: 0.4,
      }),
    });

    if (!r.ok) return res.status(500).json({ error: 'OpenAI error', detail: await r.text() });
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let obj;
    try { obj = JSON.parse(raw); } catch { obj = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return res.status(500).json({ error: 'Model did not return object' });

    const safe = {
      q: String(obj.q ?? '').slice(0, 160),
      a: String(obj.a ?? '').slice(0, 400),
      hint: String(obj.hint ?? '').slice(0, 120),
      tag: String(obj.tag ?? tag).slice(0, 40),
    };
    res.json({ card: safe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};