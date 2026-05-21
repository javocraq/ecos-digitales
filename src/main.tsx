import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

/**
 * Auto-recuperación de chunks stale tras un deploy.
 *
 * Cuando Cloudflare publica una versión nueva, los chunks lazy de las rutas
 * (React.lazy) cambian de content-hash. Un cliente que ya tiene cargado el
 * index.html/entry viejo intenta importar archivos que dejaron de existir y
 * tira "Failed to fetch dynamically imported module", lo que crashea la SPA
 * y deja la página en blanco.
 *
 * La cura estándar: cuando detectamos ese error, recargamos UNA sola vez
 * para tomar el index.html + chunks frescos. El guard por sessionStorage
 * evita loops de recarga si el chunk genuinamente no carga (red caída, etc.).
 */
const reloadOnceOnChunkError = () => {
  const KEY = "chunk-reload-ts";
  const last = Number(sessionStorage.getItem(KEY) || "0");
  if (Date.now() - last < 10000) return; // ya recargamos hace <10s — no loop
  sessionStorage.setItem(KEY, String(Date.now()));
  window.location.reload();
};

const isChunkError = (msg?: string): boolean =>
  !!msg &&
  /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(
    msg
  );

// Evento oficial de Vite cuando falla el preload de un módulo dinámico.
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  reloadOnceOnChunkError();
});

// Fallbacks por si el error llega como error global o promesa rechazada.
window.addEventListener("error", (e) => {
  if (isChunkError(e.message)) reloadOnceOnChunkError();
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason as { message?: string } | undefined;
  if (isChunkError(reason?.message || String(e.reason ?? ""))) {
    reloadOnceOnChunkError();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
