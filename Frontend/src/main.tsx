import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle dynamic import failures (common after redeployments)
window.addEventListener('error', (e) => {
  if (e.message.includes('Failed to fetch dynamically imported module') || 
      e.message.includes('Importing a module script failed')) {
    console.warn('Dynamic import failed, reloading page to fetch latest assets...');
    window.location.reload();
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
