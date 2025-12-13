import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Importação das novas fontes (Cormorant Garamond para títulos, Satoshi para corpo)
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";


createRoot(document.getElementById("root")!).render(<App />);
