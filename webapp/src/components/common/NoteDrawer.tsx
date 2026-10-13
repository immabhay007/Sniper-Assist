// components/NotesDrawer.tsx
import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui-kit/Drawer";
import { ticketService } from "@/services/ticketService";
import { toast } from "sonner";
import { Pencil, Trash2, StickyNote, X, Plus } from "lucide-react";
import { formatLocalDateTime } from "@/utils/formatDate";

// Helper functions – both return a string
function fmt(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.trim() === "") return "-";
  return String(value);
}

interface StatusOption {
  id: number;
  status_name: string;
}

interface NotesDrawerProps {
  open: boolean;
  onClose: () => void;
  ticketNo: string;
  moduleType: "Enquiry" | "Complaint" | "Ticket";
  moduleId: number;
  assignedTo?: number | null;
  currentStatusId?: number;
  currentNextAction?: string;
  statusOptions: StatusOption[];
  onUpdate?: () => void;
}

export function NotesDrawer({
  open,
  onClose,
  ticketNo,
  moduleType,
  moduleId,
  assignedTo = null,
  currentStatusId = 1,
  currentNextAction = "",
  statusOptions,
  onUpdate,
}: NotesDrawerProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number>(currentStatusId);
  const [nextActionItem, setNextActionItem] = useState<string>(currentNextAction);
  const [showAddForm, setShowAddForm] = useState(false);

  // Reset local state when drawer opens with fresh props
  useEffect(() => {
    if (open) {
      setSelectedStatusId(currentStatusId);
      setNextActionItem(currentNextAction);
      setShowAddForm(false);
      setEditingId(null);
      setEditingText("");
    }
  }, [open, currentStatusId, currentNextAction]);

  const resetForm = () => {
    setDraft("");
    setEditingId(null);
    setEditingText("");
    setSelectedStatusId(currentStatusId);
    setNextActionItem(currentNextAction);
    setShowAddForm(false);
  };

  const getUserId = (): number => {
    try {
      const userStr = localStorage.getItem("sniper-care-user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id || 0;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  const fetchNotes = async () => {
    if (!ticketNo) return;
    try {
      const data = await ticketService.getNotesByTicketNo(ticketNo);
      setNotes(data || []);
    } catch (error) {
      toast.error("Failed to load notes");
      console.error(error);
    }
  };

  useEffect(() => {
    if (open && ticketNo) {
      fetchNotes();
    }
  }, [open, ticketNo]);

  const handleSave = async () => {
    if (!draft.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    const createdBy = getUserId();
    if (!createdBy) {
      toast.error("User not logged in");
      return;
    }

    const now = new Date();
    const payload = {
      module_type: moduleType,
      module_id: moduleId,
      note_text: draft,
      ticket_no: ticketNo,
      assigned_to: assignedTo ?? 0,
      status_id: selectedStatusId,
      next_action_item: nextActionItem,
      created_by: createdBy,
      created_at: now.toISOString(),
      timezone_str: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    try {
      await ticketService.createTicket(payload);
      toast.success("Note added");
      setDraft("");
      resetForm();
      await fetchNotes();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to add note");
      console.error(error);
    }
  };

  const handleUpdate = async () => {
    if (!editingText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    const updatedBy = getUserId();
    if (!updatedBy) {
      toast.error("User not logged in");
      return;
    }

    const now = new Date();
    try {
      await ticketService.updateTicket(editingId!, {
        note_text: editingText,
        ticket_no: ticketNo,
        assigned_to: assignedTo ?? 0,
        updated_by: updatedBy,
        status_id: selectedStatusId,
        next_action_item: nextActionItem,
        updated_at: now.toISOString(),
        timezone_str: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      toast.success("Note updated");
      setEditingId(null);
      setEditingText("");
      resetForm();
      await fetchNotes();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ticketService.deleteTicket(id);
      toast.success("Note deleted");
      setConfirmDelete(null);
      await fetchNotes();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const statusList = statusOptions.length ? statusOptions : [{ id: 1, status_name: "Open" }];
  const isEditing = editingId !== null;
  const isFormOpen = showAddForm || isEditing;

  // Toggle the form open/closed (cancels editing if active)
  const toggleForm = () => {
    if (isEditing) {
      setEditingId(null);
      setEditingText("");
      setSelectedStatusId(currentStatusId);
      setNextActionItem(currentNextAction);
    }
    setShowAddForm((prev) => !prev);
  };

  const cancelForm = () => {
    resetForm();
  };

  // When user clicks edit on a note, open the form and populate fields
  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditingText(note.note_text);
    setSelectedStatusId(currentStatusId);
    // ✅ Pre-fill next action item from the note (if available)
    setNextActionItem(note.next_action_item || currentNextAction);
    setShowAddForm(true);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={() => {
          onClose();
          resetForm();
        }}
        title="Notes"
        subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"}`}
        width="max-w-[450px]"
      >
        {/* Add / Edit Note Form */}
        {isFormOpen && (
          <div className="mb-5 rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold">
              {isEditing ? "Edit Note" : "Add New Note"}
            </h4>

            <textarea
              value={isEditing ? editingText : draft}
              onChange={(e) =>
                isEditing
                  ? setEditingText(e.target.value)
                  : setDraft(e.target.value)
              }
              placeholder="Write your note…"
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {statusList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.status_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Action Item */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Next Action Item
              </label>
              <input
                type="text"
                value={nextActionItem}
                onChange={(e) => setNextActionItem(e.target.value)}
                placeholder="Enter next action"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={cancelForm}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                {isEditing ? "Cancel" : "Clear"}
              </button>
              <button
                onClick={isEditing ? handleUpdate : handleSave}
                className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
              >
                {isEditing ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        )}

        {/* Toggle button – always visible */}
        <button
          onClick={toggleForm}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isFormOpen ? "Close" : "Add Note"}
        </button>

        <hr className="my-3 border-border" />

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <StickyNote className="h-5 w-5" />
            </div>
            <p className="font-semibold">No notes available.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n: any) => (
              <li key={n.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                {editingId === n.id ? (
                  <div className="text-sm text-muted-foreground">Editing…</div>
                ) : (
                  <>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Note
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(n)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary-soft hover:text-primary"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(n.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm font-medium text-foreground">
                      {n.note_text}
                    </p>
                    {/* ✅ Show next_action_item if present */}
                    {/* {n.next_action_item && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">Next Action:</span> {n.next_action_item}
                      </div>
                    )} */}
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <div>
                        <div className="font-medium">Created</div>
                        <div>{formatLocalDateTime(n.created_at)}</div>
                        <div className="text-[10px] text-muted-foreground/70">by {fmt(n.note_created_by)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Updated</div>
                        <div>{formatLocalDateTime(n.updated_at)}</div>
                        <div className="text-[10px] text-muted-foreground/70">by {fmt(n.note_updated_by)}</div>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      {/* Delete confirmation */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Delete Note?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to delete this note?
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="h-9 rounded-lg bg-danger px-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}