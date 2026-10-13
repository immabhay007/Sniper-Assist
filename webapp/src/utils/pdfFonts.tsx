/** jsPDF font family name (registered from public/fonts TTF files). */
export const PDF_FONT = "Nunito";

const REGULAR_FILE = "Nunito-Regular.ttf";
const BOLD_FILE = "Nunito-Bold.ttf";

let regularBase64 = null;
let boldBase64 = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFontBase64(filename) {
  const res = await fetch(`${import.meta.env.BASE_URL}fonts/${filename}`);
  if (!res.ok) throw new Error(`Failed to load PDF font: ${filename}`);
  return arrayBufferToBase64(await res.arrayBuffer());
}

/** Load Nunito TTF data once; safe to call multiple times. */
export async function ensurePdfFontsLoaded() {
  if (regularBase64 && boldBase64) return;
  const [regular, bold] = await Promise.all([
    loadFontBase64(REGULAR_FILE),
    loadFontBase64(BOLD_FILE),
  ]);
  regularBase64 = regular;
  boldBase64 = bold;
}

/** Register Nunito on a jsPDF instance (required per document). */
export async function registerPdfFonts(doc) {
  await ensurePdfFontsLoaded();
  doc.addFileToVFS(REGULAR_FILE, regularBase64);
  doc.addFont(REGULAR_FILE, PDF_FONT, "normal");
  doc.addFileToVFS(BOLD_FILE, boldBase64);
  doc.addFont(BOLD_FILE, PDF_FONT, "bold");
}
