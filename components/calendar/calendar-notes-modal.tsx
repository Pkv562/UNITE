"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";

export type CalendarNote = {
  id?: string;
  _id?: string;
  noteDate: string;
  content: string;
  createdBy?: string;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  dateKey: string | null;
  notes: CalendarNote[];
  isOpen: boolean;
  loading: boolean;
  saving: boolean;
  canManage: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (content: string, noteId?: string | null) => Promise<void> | void;
  onDelete: (noteId: string) => Promise<void> | void;
};

export function CalendarNotesModal({
  dateKey,
  notes,
  isOpen,
  loading,
  saving,
  canManage,
  error,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const headerDate = useMemo(() => {
    if (!dateKey) return "";
    const parts = dateKey.split("-");
    if (parts.length === 3) {
      const formatted = new Date(`${dateKey}T00:00:00`);
      if (!Number.isNaN(formatted.getTime())) {
        return formatted.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }
    return dateKey;
  }, [dateKey]);

  useEffect(() => {
    // Reset draft when date changes or modal closes
    if (!isOpen) {
      setDraft("");
      setEditingId(null);
      return;
    }

    setDraft("");
    setEditingId(null);
  }, [dateKey, isOpen]);

  const startEdit = (note: CalendarNote) => {
    setEditingId(note.id || note._id || null);
    setDraft(note.content || "");
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    await onSave(draft.trim(), editingId);
    setEditingId(null);
    setDraft("");
  };

  const handleDelete = async (noteId: string) => {
    await onDelete(noteId);
    setEditingId(null);
    setDraft("");
  };

  const renderNoteMeta = (note: CalendarNote) => {
    const updated = note.updatedAt || note.createdAt;
    if (!updated) return null;
    try {
      const dt = new Date(updated);
      return dt.toLocaleString();
    } catch (e) {
      return updated;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      size="md"
      onClose={() => {
        setEditingId(null);
        setDraft("");
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="text-sm text-default-500">Calendar notes</div>
          <div className="text-lg font-semibold">{headerDate}</div>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="space-y-2 text-sm text-default-500">Loading notes…</div>
          ) : notes.length === 0 ? (
            <div className="text-sm text-default-500">No notes for this date.</div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id || note._id}
                  className="border border-default-200 rounded-lg p-3 bg-default-50"
                >
                  <div className="text-sm text-default-900 whitespace-pre-wrap break-words">
                    {note.content}
                  </div>
                  <div className="mt-2 text-[11px] text-default-500 flex items-center justify-between">
                    <span>{renderNoteMeta(note)}</span>
                    {canManage ? (
                      <div className="flex gap-2 text-xs">
                        <button
                          className="text-default-700 hover:underline"
                          onClick={() => startEdit(note)}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          className="text-danger hover:underline"
                          onClick={() => handleDelete(String(note.id || note._id))}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canManage ? (
            <div className="space-y-2 mt-4">
              <div className="text-sm font-medium text-default-900">
                {editingId ? "Edit note" : "Add a note"}
              </div>
              <textarea
                className="w-full border border-default-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-default-300"
                rows={4}
                value={draft}
                disabled={saving}
                onChange={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
                placeholder="Add a short shared note for this date"
              />
              <div className="flex justify-end gap-2">
                {editingId ? (
                  <Button
                    variant="light"
                    size="sm"
                    onPress={() => {
                      setEditingId(null);
                      setDraft("");
                    }}
                    isDisabled={saving}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  color="default"
                  size="sm"
                  className="bg-black text-white"
                  onPress={handleSave}
                  isDisabled={saving || !draft.trim()}
                >
                  {saving ? "Saving..." : editingId ? "Update note" : "Add note"}
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-3 text-xs text-danger bg-danger-50 border border-danger-200 rounded p-2">
              {error}
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={() => {
              setEditingId(null);
              setDraft("");
              onClose();
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CalendarNotesModal;
