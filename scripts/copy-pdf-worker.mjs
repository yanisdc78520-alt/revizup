// Copie le "worker" de pdf.js dans /public pour qu'il soit servi tel quel (sans passer par le bundler).
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public", { recursive: true });
copyFileSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
