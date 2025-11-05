import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function startMSW() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    return worker.start({ onUnhandledRequest: "bypass" });
  }
  return Promise.resolve();
}

startMSW().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
