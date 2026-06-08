declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL: string;
    };
  }
}

// Em desenvolvimento (npm run dev), o config.js não existe, então cai no localhost fallback.
// Em produção (Docker), o nginx irá injetar window.__ENV__.VITE_API_URL
export const API_URL = window.__ENV__?.VITE_API_URL || "http://localhost:3000/api";
