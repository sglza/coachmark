import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PlaygroundApp } from "./playground-app";
import "./playground.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlaygroundApp />
  </StrictMode>,
);
