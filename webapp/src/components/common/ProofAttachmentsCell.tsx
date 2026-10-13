import { useMemo, useState } from "react";
import { HiOutlineEye, HiOutlinePaperClip } from "react-icons/hi";
import ProofPreviewModal from "./ProofPreviewModal";
import { parseStoredFiles } from "@/utils/fileAttachments";
import { getFileDisplayName } from "@/utils/filePreview";

/**
 * Table/list cell for proof attachments — opens preview modal on click.
 * @param {'compact' | 'chips'} variant — icon+count vs named chips
 */
export default function ProofAttachmentsCell({
  row,
  files: filesProp,
  variant = "compact",
  modalTitle = "Proof preview",
}) {
  const files = useMemo(
    () => (filesProp?.length ? filesProp : parseStoredFiles(row)),
    [row, filesProp],
  );
  const [open, setOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (!files.length) return <span className="text-muted-foreground">—</span>;

  const openPreview = (index = 0) => {
    setInitialIndex(index);
    setOpen(true);
  };

  if (variant === "chips") {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, idx) => (
            <button
              key={`${f.url}-${idx}`}
              type="button"
              onClick={() => openPreview(idx)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-1 text-xs font-medium text-primary hover:border-primary/40 hover:bg-primary/5 transition max-w-[140px]"
              title={`Preview ${getFileDisplayName(f, idx)}`}
            >
              <HiOutlinePaperClip className="size-3.5 shrink-0" />
              <span className="truncate">{getFileDisplayName(f, idx)}</span>
              <HiOutlineEye className="size-3 shrink-0 opacity-70" />
            </button>
          ))}
        </div>
        <ProofPreviewModal
          open={open}
          onClose={() => setOpen(false)}
          files={files}
          initialIndex={initialIndex}
          title={modalTitle}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openPreview(0)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-primary hover:border-primary/20 hover:bg-primary/5 transition"
        title={files.map((f, i) => getFileDisplayName(f, i)).join(", ")}
      >
        <HiOutlinePaperClip className="size-4" />
        <span className="text-xs font-semibold tabular-nums">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
        <HiOutlineEye className="size-3.5 opacity-70" />
      </button>
      <ProofPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        files={files}
        initialIndex={initialIndex}
        title={modalTitle}
      />
    </>
  );
}
