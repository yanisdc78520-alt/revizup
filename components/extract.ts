"use client";

// Extraction du texte dans le navigateur : le fichier ne quitte pas l'appareil, seul le texte est envoyé.
export async function extractText(file: File, onProgress?: (msg: string) => void): Promise<{ text: string; source: string }> {
  const name = file.name.toLowerCase();
  if (file.size > 40 * 1024 * 1024) throw new Error("Ce fichier dépasse 40 Mo. Découpe ton cours en plusieurs fichiers.");

  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    // Le worker est copié dans /public à l'installation (scripts/copy-pdf-worker.mjs).
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
          .join(""),
      );
      onProgress?.(`Lecture du PDF… page ${i} / ${pdf.numPages}`);
    }
    return { text: pages.join("\n\n"), source: `PDF · ${pdf.numPages} pages` };
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { text: r.value, source: "Document Word" };
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) return { text: await file.text(), source: "Texte" };

  if (name.endsWith(".doc")) throw new Error("Les anciens fichiers .doc ne sont pas lus. Enregistre-le en .docx ou en PDF depuis Word.");
  throw new Error("Format non pris en charge. Utilise un PDF, un fichier Word (.docx) ou un texte.");
}
