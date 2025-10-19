RPP Smart Creator - Monolithic (single deploy)
=============================================

This repository is prepared to be deployed as a single Docker service (monolith) on Render.com.

How it works:
- The Dockerfile builds the React frontend and places the built files into backend/frontend/dist
- The backend Express server serves API endpoints and also serves static files from frontend/dist
- The service exposes port 4000 (Render will map to the HTTP port)

Quick steps to deploy on Render:
1. Push this repository to GitHub.
2. On Render, choose 'New' -> 'Web Service' -> Connect your repo.
3. Select 'Docker' and set Dockerfile path to './Dockerfile' (root).
4. Set environment variables (e.g., OPENAI_API_KEY) in Render dashboard (Environment).
5. Deploy. Render will build and run the container. The app will be available on the assigned URL.

Local test (optional):
- You can build and run using Docker locally:
  docker build -t rpp-monolith:latest .
  docker run -p 4000:4000 rpp-monolith:latest
- Then open http://localhost:4000 in your browser.

Notes:
- Ensure backend/index.js listens on process.env.PORT || 4000 (it already should).
- If you want HTTPS, use Render's default TLS or configure custom domain.
