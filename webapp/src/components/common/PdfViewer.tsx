/**
 * Embeds a PDF via the browser's native viewer (iframe).
 * Pass a blob URL or any URL that serves application/pdf.
 */
export default function PdfViewer({
  src,
  title = "PDF preview",
  className = "",
  heightClass = "h-[min(75vh,720px)]",
}) {
  if (!src) return null;

  return (
    <iframe
      title={title}
      src={src}
      className={`w-full min-h-[480px] rounded-lg border border-border bg-white shadow-sm ${heightClass} ${className}`}
    />
  );
}
