import { useRef } from "react";
import {
  HiOutlineCloudUpload,
  HiOutlineExternalLink,
  HiOutlinePaperClip,
  HiOutlineX,
} from "react-icons/hi";
import { getFileDisplayName } from "@/utils/filePreview";

/**
 * Stored attachments ({ url, name, blob_name? }) plus new File picks, with remove per item.
 */
export default function FileAttachmentsField({
  label = "Attachments",
  hint = "Click to upload — PDF, JPG, PNG (max 10 MB each)",
  stored = [],
  onStoredChange,
  pending = [],
  onPendingChange,
  multiple = true,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.gif",
  disabled = false,
}) {
  const inputRef = useRef(null);

  const removeStored = (index) => {
    if (!onStoredChange || disabled) return;
    onStoredChange(stored.filter((_, i) => i !== index));
  };

  const removePending = (index) => {
    if (!onPendingChange || disabled) return;
    onPendingChange(pending.filter((_, i) => i !== index));
  };

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (inputRef.current) inputRef.current.value = "";
    if (!picked.length || !onPendingChange || disabled) return;
    onPendingChange(multiple ? [...pending, ...picked] : picked.slice(0, 1));
  };

  const hasAny = stored.length > 0 || pending.length > 0;

  return (
    <div>
      {label && <div className="text-[13px] font-medium mb-1.5">{label}</div>}

      {hasAny && (
        <ul className="mb-3 space-y-2">
          {stored.map((f, idx) => {
            const label = getFileDisplayName(f, idx);
            return (
            <li
              key={`stored-${f.url || f.blob_name || idx}-${idx}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <HiOutlinePaperClip className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 inline-flex items-center gap-1 text-primary hover:underline truncate"
                title={label}
              >
                <span className="truncate">{label}</span>
                <HiOutlineExternalLink className="size-3.5 shrink-0" />
              </a>
              {onStoredChange && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeStored(idx)}
                  className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-soft transition"
                  title="Remove file"
                  aria-label={`Remove ${label}`}
                >
                  <HiOutlineX className="size-4" />
                </button>
              )}
            </li>
            );
          })}
          {pending.map((f, idx) => (
            <li
              key={`pending-${f.name}-${f.size}-${idx}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-warning-soft/30 px-3 py-2 text-sm"
            >
              <HiOutlinePaperClip className="size-4 shrink-0 text-warning/80" />
              <span className="min-w-0 flex-1 truncate" title={f.name}>
                {f.name}
                <span className="text-xs text-muted-foreground ml-1">(new)</span>
              </span>
              {onPendingChange && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removePending(idx)}
                  className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-soft transition"
                  title="Remove file"
                  aria-label={`Remove ${f.name}`}
                >
                  <HiOutlineX className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-full border border-dashed border-warning/40 bg-warning-soft/40 rounded-xl py-7 px-4 flex flex-col items-center justify-center text-center hover:bg-warning-soft/60 transition disabled:opacity-50"
      >
        <HiOutlineCloudUpload className="size-6 text-warning/80 mb-2" />
        <p className="text-sm text-foreground/80">{hint}</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handlePick}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
