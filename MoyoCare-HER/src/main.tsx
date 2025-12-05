import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config.ts";

import { ThemeProvider } from "./components/ThemeProvider";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="light" storageKey="moyocare-theme">
        <App />
    </ThemeProvider>
);
// Force redeploy trigger
