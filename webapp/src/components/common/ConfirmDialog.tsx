import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  tone = "primary",
  confirming = false,
}) {
  return (
    <Modal open={open} onClose={confirming ? () => {} : onCancel} title={title} size="sm">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="sniper-btn" onClick={onCancel} disabled={confirming}>
          Cancel
        </button>
        <button
          className={`sniper-btn inline-flex items-center gap-1.5 ${tone === "danger" ? "!bg-danger !text-danger-foreground !border-danger" : "sniper-btn-primary"}`}
          onClick={onConfirm}
          disabled={confirming}
        >
          {confirming && (
            <span
              className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
              aria-hidden
            />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
