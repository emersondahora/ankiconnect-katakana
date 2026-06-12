// Este arquivo é substituído em produção (Docker/Nginx).
// Em desenvolvimento local, ele apenas previne o erro 404 no console.
window.__ENV__ = {
  VITE_API_URL: "http://localhost:3000/api"
};
