import { create } from 'zustand';
const persistKey = 'flashcards-v1';

export const useDeck = create((set, get) => ({
  cards: [],
  loading: false,
  error: null,
  current: 0,  // index in cards
  lastTopic: '',
  level: 'beginner',

  loadDeck: async (params) => {
    set({ loading: true, error: null });
    try {
      const r = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(params)
      });
      if (!r.ok) throw new Error(await r.text());
      const { cards } = await r.json();
      set({ cards, current: 0, loading: false, lastTopic: params.topic, level: params.level ?? 'beginner' });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  // Leitner: correct -> box+1 (max5), incorrect -> box=1; advance to next
  mark: (isCorrect) => {
    const { cards, current } = get();
    const copy = cards.slice();
    const c = { ...copy[current] };
    c.box = isCorrect ? Math.min((c.box ?? 1) + 1, 5) : 1;
    copy[current] = c;

    // next card: prefer lower boxes first
    const nextIdx = (() => {
      const order = [1,2,3,4,5];
      for (const b of order) {
        const idx = copy.findIndex((cc, i) => i > current && cc.box === b);
        if (idx !== -1) return idx;
      }
      // wrap-around
      for (const b of order) {
        const idx = copy.findIndex((cc, i) => i <= current && cc.box === b);
        if (idx !== -1) return idx;
      }
      return current;
    })();

    set({ cards: copy, current: nextIdx });
  },

  regenerateCurrent: async () => {
    const { cards, current, lastTopic, level } = get();
    if (!cards.length) return;
    const target = cards[current];
    try {
      const r = await fetch('http://localhost:3001/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: lastTopic || target.tag || 'general', level, tag: target.tag })
      });
      if (!r.ok) throw new Error(await r.text());
      const { card } = await r.json();
      const updated = cards.slice();
      // preserve id; reset Leitner box to 1 on regeneration
      updated[current] = { id: target.id, box: 1, ...card };
      set({ cards: updated });
    } catch (e) {
      console.error(e);
      set({ error: e.message || 'Failed to regenerate card' });
    }
  },

  reset: () => set({ cards: [], current: 0, error: null })
}));

// --- Persistence: load on start
try {
  const saved = JSON.parse(localStorage.getItem(persistKey) || 'null');
  if (saved && typeof saved === 'object') {
    const { cards, current, lastTopic, level } = saved;
    if (Array.isArray(cards)) {
      // Only set known keys to avoid polluting state
      useDeck.setState({
        cards,
        current: Number.isInteger(current) ? current : 0,
        lastTopic: lastTopic || '',
        level: level || 'beginner'
      });
    }
  }
} catch {}

// --- Persistence: save on any state change
useDeck.subscribe((state) => {
  try {
    const snapshot = {
      cards: state.cards,
      current: state.current,
      lastTopic: state.lastTopic,
      level: state.level
    };
    localStorage.setItem(persistKey, JSON.stringify(snapshot));
  } catch {}
});