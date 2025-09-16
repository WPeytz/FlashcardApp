# AI Flashcards App

An AI-powered flashcard web app built with **React (Vite)** and **Zustand**, deployed on **Vercel** with serverless functions. It generates adaptive flashcards using the OpenAI API and supports spaced repetition (Leitner system) with persistence in `localStorage`.

Try the app at https://flashcard-app-iota-ten.vercel.app/

## ✨ Features
- 🎴 Generate flashcards on any topic using GPT models
- 🔄 Regenerate weak cards with one click
- 🧠 Leitner spaced repetition system (boxes to track progress)
- 💾 Local persistence (cards + progress saved in browser)
- ⌨️ Simple keyboard shortcuts (planned)
- ☁️ Fully serverless deployment on Vercel (`/api/generate`, `/api/regenerate`)

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Zustand
- **Backend**: Vercel serverless functions
- **AI**: OpenAI GPT (`gpt-4o-mini`)
- **Deployment**: Vercel
- **Storage**: Browser `localStorage`

## 📂 Project Structure
```
app/                 # React frontend
  src/               # Components, store
  api/               # Vercel serverless functions
    generate.js
    regenerate.js
  package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Vite requires this)
- An OpenAI API key (`sk-...`)

### Local Development
1. Clone repo:
   ```bash
   git clone https://github.com/<your-username>/FlashcardApp.git
   cd FlashcardApp/app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add `.env.local`:
   ```
   VITE_API_BASE=http://localhost:3001
   ```
4. Run dev server:
   ```bash
   npm run dev
   ```

### Running with Vercel Functions Locally
Instead of Express, you can test Vercel serverless functions:
```bash
vercel dev
```

### Deploy to Vercel
1. Push repo to GitHub.
2. Import project into Vercel.
3. Set **Root Directory** = `app`.
4. Add environment variable in Vercel:
   - `OPENAI_API_KEY` = your OpenAI key
5. Redeploy. Frontend + API functions will be live at:
   ```
   https://<your-app>.vercel.app
   ```

## ⌨️ Usage
1. Enter a topic (e.g. "Reinforcement Learning").
2. Choose difficulty level and number of cards.
3. Click **Generate** → AI creates a deck.
4. Flip cards to study; mark **Right** / **Wrong**.
5. Weak cards can be regenerated.

## 🗺️ Roadmap
- [ ] Keyboard shortcuts (`Space` to flip, `1/2` for wrong/right, `R` to regenerate)
- [ ] Progress bar / stats per Leitner box
- [ ] Import/Export decks (JSON)
- [ ] Cloud sync (Supabase/Firebase)

## 🤝 Contributing
Pull requests welcome! For major changes, open an issue first.

## 📜 License
MIT
