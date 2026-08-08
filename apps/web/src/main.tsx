import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingFromExport } from "./pages/LandingFromExport";
import "./styles/global.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <LandingFromExport />
  </StrictMode>,
);
