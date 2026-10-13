import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDocument,
  HiOutlineDownload,
  HiOutlineExternalLink,
  HiX,
} from "react-icons/hi";
import {
  downloadFileDirect,
  downloadFilesZip,
  getFileDisplayName,
  getFilePreviewKind,
} from "@/utils/filePreview";

export default function ProofPreviewModal({
  open,
  onClose,
  files = [],
  initialIndex = 0,
  title = "Proof preview",
}) {
  const [index, setIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    if (open) {
      setIndex(
        Math.min(Math.max(0, initialIndex), Math.max(0, files.length - 1)),
      );
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, initialIndex, files.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(files.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, files.length]);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(files.length - 1, i + 1)),
    [files.length],
  );

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadFileDirect(files[index], index);
    } catch {
      setDownloadError("Could not download this file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleZipDownload = async () => {
    setZipDownloading(true);
    setDownloadError("");
    try {
      const zipName = `${
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "documents"
      }.zip`;
      await downloadFilesZip(files, zipName);
    } catch {
      setDownloadError("Could not create the ZIP file. Please try again.");
    } finally {
      setZipDownloading(false);
    }
  };

  if (!open || !files.length) return null;

  const current = files[index];
  const kind = getFilePreviewKind(current);
  const displayName = getFileDisplayName(current, index);
  const hasMultiple = files.length > 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proof-preview-title"
        className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <p
              id="proof-preview-title"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {title}
            </p>
            <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">
              {displayName}
            </h3>
            {hasMultiple && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {index + 1} of {files.length}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sniper-btn !px-2.5 !py-1.5 text-xs gap-1"
              title="Open in new tab"
            >
              <HiOutlineExternalLink className="size-4" />
              <span className="hidden sm:inline">Open</span>
            </a>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="sniper-btn !px-2.5 !py-1.5 text-xs gap-1"
              title="Download"
            >
              <HiOutlineDownload className="size-4" />
              <span className="hidden sm:inline">
                {downloading ? "Downloading..." : "Download"}
              </span>
            </button>
            {hasMultiple && (
              <button
                type="button"
                onClick={handleZipDownload}
                disabled={zipDownloading}
                className="sniper-btn !px-2.5 !py-1.5 text-xs gap-1"
                title="Download all as ZIP"
              >
                <HiOutlineDownload className="size-4" />
                <span className="hidden sm:inline">
                  {zipDownloading ? "Zipping..." : "ZIP"}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition"
              aria-label="Close preview"
            >
              <HiX className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-gradient-to-b from-muted/20 to-muted/50 p-4 sm:min-h-[320px] sm:p-6">
          {downloadError && (
            <div className="absolute left-4 right-4 top-4 z-20 rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
              {downloadError}
            </div>
          )}

          {hasMultiple && index > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 z-10 flex size-10 items-center justify-center rounded-full border border-border bg-card/90 shadow-md hover:bg-card transition"
              aria-label="Previous file"
            >
              <HiOutlineChevronLeft className="size-5" />
            </button>
          )}

          <div className="w-full max-h-[min(60vh,520px)] flex items-center justify-center">
            {kind === "image" && (
              <img
                src={current.url}
                alt={displayName}
                className="max-h-[min(60vh,520px)] max-w-full rounded-lg object-contain shadow-lg ring-1 ring-border/50"
              />
            )}
            {kind === "pdf" && (
              <iframe
                title={displayName}
                src={current.url}
                className="h-[min(60vh,520px)] w-full rounded-lg border border-border bg-white shadow-lg"
              />
            )}
            {kind === "other" && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-10 py-12 text-center shadow-sm">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HiOutlineDocument className="size-8" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Preview not available
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    Open or download this file to view it on your device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="sniper-btn sniper-btn-primary text-sm"
                >
                  <HiOutlineDownload className="size-4" />
                  {downloading ? "Downloading..." : "Download file"}
                </button>
              </div>
            )}
          </div>

          {hasMultiple && index < files.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 z-10 flex size-10 items-center justify-center rounded-full border border-border bg-card/90 shadow-md hover:bg-card transition"
              aria-label="Next file"
            >
              <HiOutlineChevronRight className="size-5" />
            </button>
          )}
        </div>

        {hasMultiple && (
          <div className="border-t border-border bg-muted/20 px-3 py-3 sm:px-4">
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
              {files.map((f, i) => {
                const active = i === index;
                const thumbKind = getFilePreviewKind(f);
                return (
                  <button
                    key={`${f.url}-${i}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition max-w-[200px] ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    {thumbKind === "image" ? (
                      <img
                        src={f.url}
                        alt=""
                        className="size-10 rounded-md object-cover ring-1 ring-border"
                      />
                    ) : (
                      <span
                        className={`flex size-10 items-center justify-center rounded-md text-[10px] font-bold uppercase ${
                          thumbKind === "pdf"
                            ? "bg-danger-soft text-danger"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {thumbKind === "pdf" ? "PDF" : "DOC"}
                      </span>
                    )}
                    <span className="truncate font-medium">
                      {getFileDisplayName(f, i)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
