RPP Smart Creator (MVP)
=======================

Struktur proyek (local):
- backend/ : Express server that calls LLM and generates .docx (uses docx)
- frontend/: React + Vite + Tailwind UI to collect inputs and download .docx
- backend/templates/template_rpp_ai.docx : example template (placeholder included)

Quickstart:
1. Backend:
   - cd backend
   - npm install
   - copy .env.example to .env and set OPENAI_API_KEY if you have one
   - npm start

2. Frontend:
   - cd frontend
   - npm install
   - npm run dev
   - open http://localhost:5173 and use the form (set backend to http://localhost:4000)

Notes:
- If OPENAI_API_KEY is not set, the backend uses a stub JSON to generate a sample RPP.
- Replace 'gpt-4o-mini' with a model you have access to, or adjust OpenAI call accordingly.
- The backend saves uploaded logos temporarily to backend/uploads and cleans them up after generation.
- This project is meant as an MVP scaffold; production usage should add auth, rate limits, and input validation.
