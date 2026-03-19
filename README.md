# AI Design Stimulus Generator

A web tool for industrial design, product design, and design research.
Users submit a design requirement, and the system generates three stimulus groups via ModelScope API:

- Near Stimuli
- Medium Stimuli
- Far Stimuli

---

## 1. Project Overview

- Frontend and backend are separated
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- AI: ModelScope API (OpenAI-compatible)
- Deployment: Frontend on Vercel, backend on Render

Project structure:

```text
project-root/
  client/
  server/
  .env.example
  README.md
```

---

## 2. Run Locally

### 2.1 Enter project

```bash
cd project-root
```

### 2.2 Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2.3 Configure environment variables

Copy values from root `.env.example` into:

`server/.env`

```env
MODELSCOPE_SDK_TOKEN=your_modelscope_sdk_token_here
MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1
MODELSCOPE_MODEL=Qwen/Qwen3-8B,Qwen/Qwen3-1.7B,deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
ALLOWED_ORIGIN=http://localhost:5173
PORT=3000
```

`client/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2.4 Start backend

```bash
cd server
npm run dev
```

### 2.5 Start frontend

```bash
cd client
npm run dev
```

Frontend default: `http://localhost:5173`

Backend default: `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

---

## 3. Environment Variables

### Backend (Render)

- `MODELSCOPE_SDK_TOKEN`: ModelScope SDK token
- `MODELSCOPE_BASE_URL`: `https://api-inference.modelscope.cn/v1`
- `MODELSCOPE_MODEL`: comma-separated model ids, Qwen first then fallback
- `ALLOWED_ORIGIN`: allowed CORS origin (for example `https://your-frontend.vercel.app`)
- `PORT`: server port (Render can inject it automatically)

### Frontend (Vercel)

- `VITE_API_BASE_URL`: backend public URL (for example `https://your-backend.onrender.com`)

---

## 4. Deploy Frontend to Vercel

1. Push the repo to GitHub.
2. Create a new Vercel project and select this repo.
3. Set Root Directory to `client`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add environment variable:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`
7. Deploy.

---

## 5. Deploy Backend to Render

1. Create a new `Web Service` in Render and connect this repo.
2. Set Root Directory to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables:
   - `MODELSCOPE_SDK_TOKEN=your_modelscope_sdk_token_here`
   - `MODELSCOPE_BASE_URL=https://api-inference.modelscope.cn/v1`
   - `MODELSCOPE_MODEL=Qwen/Qwen3-8B,Qwen/Qwen3-1.7B,deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`
   - `ALLOWED_ORIGIN=https://your-frontend.vercel.app`
   - `PORT=10000` (optional)
6. Deploy and copy backend public URL, for example `https://your-backend.onrender.com`.

---

## 6. API

### POST `/api/generate`

Request:

```json
{
  "requirement": "Design an innovative mobile storage solution for shared workspaces"
}
```

Response (strict JSON):

```json
{
  "near": [
    {
      "word": "",
      "detail": ""
    }
  ],
  "medium": [
    {
      "word": "",
      "detail": ""
    }
  ],
  "far": [
    {
      "word": "",
      "detail": ""
    }
  ]
}
```

### GET `/health`

```json
{
  "status": "ok",
  "timestamp": "2026-03-17T00:00:00.000Z"
}
```

---

## Security and Reliability

- `helmet` security headers
- `cors` configuration
- `express-rate-limit`
- request input validation
- AI output JSON schema validation
- centralized error handling
