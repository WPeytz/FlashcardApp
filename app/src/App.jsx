import { useState } from 'react';
import { useDeck } from './store';
import { clsx } from 'clsx';

function Controls() {
  const [topic, setTopic] = useState("");
  const [n, setN] = useState(12);
  const [level, setLevel] = useState("beginner");
  const loadDeck = useDeck(s => s.loadDeck);
  const loading = useDeck(s => s.loading);

  const submit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    loadDeck({ topic, n, level });
  };

  return (
    <form onSubmit={submit} className="controls">
      <input
        value={topic}
        onChange={(e)=>setTopic(e.target.value)}
        placeholder="Topic: e.g., Linear Algebra"
      />
      <select value={level} onChange={(e)=>setLevel(e.target.value)}>
        <option>beginner</option>
        <option>intermediate</option>
        <option>advanced</option>
      </select>
      <input type="number" min={4} max={40} value={n} onChange={e=>setN(+e.target.value)} />
      <button disabled={loading}>{loading ? "Generating…" : "Generate"}</button>
    </form>
  );
}

function Card() {
  const cards = useDeck(s => s.cards);
  const current = useDeck(s => s.current);
  const mark = useDeck(s => s.mark);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return <div className="placeholder">Enter a topic to generate flashcards.</div>;

  const c = cards[current];
  return (
    <div className="card-wrap">
      <div className={clsx("card", flipped && "flipped")} onClick={()=>setFlipped(!flipped)}>
        <div className="front">
          <div className="tag">{c.tag}</div>
          <h3>{c.q}</h3>
          <div className="hint">Hint: {c.hint}</div>
          <div className="meta">Leitner Box: {c.box}</div>
          <p className="tap">Click to flip</p>
        </div>
        <div className="back">
          <h3>Answer</h3>
          <p>{c.a}</p>
          <p className="tap">Click to flip back</p>
        </div>
      </div>

      <div className="actions">
        <button className="wrong" onClick={(e)=>{ e.stopPropagation(); setFlipped(false); mark(false); }}>I was wrong</button>
        <button className="right" onClick={(e)=>{ e.stopPropagation(); setFlipped(false); mark(true); }}>I was right</button>
        <button className="regen" onClick={(e)=>{ e.stopPropagation(); setFlipped(false); useDeck.getState().regenerateCurrent(); }}>Regenerate this card</button>
      </div>
    </div>
  );
}

function DeckStatus() {
  const cards = useDeck(s => s.cards);
  const current = useDeck(s => s.current);
  if (!cards.length) return null;
  const counts = [1,2,3,4,5].map(b => cards.filter(c=>c.box===b).length);
  return (
    <div className="status">
      <span>Card {current+1}/{cards.length}</span>
      <span>Boxes: {counts.map((n,i)=>`B${i+1}:${n}`).join("  ")}</span>
    </div>
  );
}

export default function App() {
  const error = useDeck(s => s.error);
  return (
    <div className="container">
      <h1>AI Flashcards</h1>
      <Controls />
      {error && <div className="error">Error: {String(error)}</div>}
      <DeckStatus />
      <Card />
      <footer>
        <small>Tip: Use “Linear Algebra”, “Sorting Algorithms”, “Bayesian Inference”, “EU Competition Law”…</small>
      </footer>
    </div>
  );
}