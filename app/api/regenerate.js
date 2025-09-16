export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    return res.status(500).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
  }

  try {
    const { topic, level = 'beginner', format = 'qa', tag = 'general' } = req.body || {};
    if (!topic && !tag) return res.status(400).json({ error: 'Missing topic or tag' });

    const system = `You are an expert tutor. Regenerate ONE concise flashcard as a JSON object with keys: q, a, hint, tag.`;
    const user = `Topic: ${topic || tag}
Regenerate ONE card for subtopic/tag: ${tag}.
Constraints: Avoid fluff, be accurate. Return ONLY a single JSON object (no code fences).`;

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
        temperature: 0.4
      })
    });

    if (!r.ok) {
      const t = await r.text();
      console.error('OpenAI error', r.status, t);
      return res.status(502).json({ error: 'Upstream OpenAI error', status: r.status, detail: t });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';

    let obj;
    try { obj = JSON.parse(raw); }
    catch { obj = JSON.parse(raw.replace(/```json|```/g, '').trim()); }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj))
      return res.status(500).json({ error: 'Model did not return JSON object' });

    const safe = {
      q: String(obj.q ?? '').slice(0, 160),
      a: String(obj.a ?? '').slice(0, 400),
      hint: String(obj.hint ?? '').slice(0, 120),
      tag: String(obj.tag ?? tag).slice(0, 40)
    };

    res.json({ card: safe });
  } catch (e) {
    console.error('Function crash:', e);
    res.status(500).json({ error: 'Function crashed', detail: e.message });
  }
}