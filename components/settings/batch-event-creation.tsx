"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@heroui/button";
import { Plus as PlusIcon } from "@gravity-ui/icons";
import BatchEventFormModal, { BatchEventData } from "./batch-event-form-modal";
import BatchEventTable from "./batch-event-table";

const MAX_BATCH_SIZE = 100;

interface BatchEventCreationProps {
  isOpen: boolean;
}

const STORAGE_KEY = "unite_batch_events_draft";

export default function BatchEventCreation({ isOpen }: BatchEventCreationProps) {
  const [events, setEvents] = useState<BatchEventData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  // Load saved draft events from localStorage on mount
  // Load saved draft events from localStorage on mount (and when modal opens)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
          setDraftRestored(true);
          // Auto-hide draft message after 5 seconds
          setTimeout(() => setDraftRestored(false), 5000);
        }
      }
    } catch (error) {
      console.error("Failed to load draft events:", error);
    } finally {
      setHasLoadedDraft(true);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    // Avoid clearing storage before we attempt to load the existing draft
    if (!hasLoadedDraft) return;
    if (events.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch (error) {
        console.error("Failed to save draft events:", error);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [events, hasLoadedDraft]);

  // Validate a single event
  const validateEvent = (event: BatchEventData, index: number): string[] => {
    const errors: string[] = [];

    if (!event.Event_Title?.trim()) {
      errors.push("Event title is required");
    } else if (event.Event_Title.length < 3) {
      errors.push("Event title must be at least 3 characters");
    }

    if (!event.Location?.trim()) {
      errors.push("Location is required");
    } else if (event.Location.length < 3) {
      errors.push("Location must be at least 3 characters");
    }

    if (!event.Start_Date) {
      errors.push("Start date is required");
    } else {
      const startDate = new Date(event.Start_Date);
      if (isNaN(startDate.getTime())) {
        errors.push("Invalid start date");
      }
    }

    if (!event.province || !event.province.trim()) {
      errors.push("Province is required");
    }

    if (!event.district || !event.district.trim()) {
      errors.push("District is required");
    }

    if (!event.Category || !event.Category.trim()) {
      errors.push("Event category is required");
    }

    if (event.End_Date) {
      const startDate = new Date(event.Start_Date);
      const endDate = new Date(event.End_Date);
      if (endDate <= startDate) {
        errors.push("End date must be after start date");
      }
    }

    // Email validation (optional but must be valid if provided)
    if (event.Email && event.Email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.Email)) {
      errors.push("Invalid email address");
    }

    // Phone number is optional, no validation needed

    // Category-specific validation
    if (event.Category) {
      const category = event.Category.toLowerCase();
      if (category === "blooddrive" || category.includes("blood")) {
        if (event.Target_Donation === undefined || event.Target_Donation === null) {
          errors.push("Target donation is required for Blood Drive events");
        } else if (event.Target_Donation < 0) {
          errors.push("Target donation must be a positive number");
        }
      } else if (category === "training" || category.includes("train")) {
        if (event.MaxParticipants === undefined || event.MaxParticipants === null) {
          errors.push("Max participants is required for Training events");
        } else if (event.MaxParticipants < 1) {
          errors.push("Max participants must be at least 1");
        }
      } else if (category === "advocacy" || category.includes("advoc")) {
        if (!event.Topic && !event.TargetAudience) {
          errors.push("Topic or Target Audience is required for Advocacy events");
        }
      }
    }

    return errors;
  };

  // Validate all events
  const validateAllEvents = useCallback((): boolean => {
    const errors: Record<number, string[]> = {};
    let hasErrors = false;

    events.forEach((event, index) => {
      const eventErrors = validateEvent(event, index);
      if (eventErrors.length > 0) {
        errors[index] = eventErrors;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  }, [events]);

  const handleAddEvent = () => {
    if (events.length >= MAX_BATCH_SIZE) {
      setSubmitError(`Maximum ${MAX_BATCH_SIZE} events allowed per batch`);
      return;
    }
    setEditingIndex(null);
    setShowFormModal(true);
  };

  const handleEditEvent = (index: number, event: BatchEventData) => {
    setEditingIndex(index);
    setShowFormModal(true);
  };

  const handleDeleteEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
    // Clear validation errors for deleted event
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    // Re-index remaining errors
    const reindexedErrors: Record<number, string[]> = {};
    Object.keys(newErrors).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
      } else {
        reindexedErrors[oldIndex] = newErrors[oldIndex];
      }
    });
    setValidationErrors(reindexedErrors);
  };

  const handleDeleteSelected = (indices: number[]) => {
    // Sort indices in descending order to delete from end to start
    const sortedIndices = [...indices].sort((a, b) => b - a);
    let newEvents = [...events];
    sortedIndices.forEach((index) => {
      newEvents = newEvents.filter((_, i) => i !== index);
    });
    setEvents(newEvents);
    // Clear validation errors for deleted events
    const newErrors: Record<number, string[]> = {};
    Object.keys(validationErrors).forEach((key) => {
      const errorIndex = parseInt(key);
      if (!indices.includes(errorIndex)) {
        // Calculate new index after deletions
        let newIndex = errorIndex;
        sortedIndices.forEach((deletedIndex) => {
          if (deletedIndex < errorIndex) {
            newIndex--;
          }
        });
        newErrors[newIndex] = validationErrors[errorIndex];
      }
    });
    setValidationErrors(newErrors);
  };

  const handleFormSubmit = (eventData: BatchEventData) => {
    if (editingIndex !== null) {
      // Update existing event
      const newEvents = [...events];
      newEvents[editingIndex] = eventData;
      setEvents(newEvents);
      // Clear validation errors for updated event
      const newErrors = { ...validationErrors };
      delete newErrors[editingIndex];
      setValidationErrors(newErrors);
    } else {
      // Add new event
      if (events.length >= MAX_BATCH_SIZE) {
        setSubmitError(`Maximum ${MAX_BATCH_SIZE} events allowed per batch`);
        return;
      }
      setEvents([...events, eventData]);
    }
    setShowFormModal(false);
    setEditingIndex(null);
    setSubmitError(null);
  };

  const handleSubmitBatch = async () => {
    if (events.length === 0) {
      setSubmitError("No events to submit. Please add at least one event.");
      return;
    }

    // Validate all events before submission
    if (!validateAllEvents()) {
      setSubmitError("Please fix validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const token = localStorage.getItem("unite_token") || sessionStorage.getItem("unite_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Construct API base URL
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 
                     (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:6700` : "http://localhost:6700");

      const response = await fetch(`${apiBase}/api/event-requests/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ events }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create batch events");
      }

      if (data.success) {
        setSubmitSuccess(
          `Successfully created ${data.data.created} event(s)${
            data.data.failed > 0 ? ` (${data.data.failed} failed)` : ""
          }`
        );
        // Clear events and localStorage draft on success
        setEvents([]);
        setValidationErrors({});
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Partial success
        const errorMessages: string[] = [];
        if (data.data.errors && data.data.errors.length > 0) {
          data.data.errors.forEach((error: any) => {
            errorMessages.push(
              `Event ${error.index + 1}: ${error.event} - ${error.error}`
            );
          });
        }
        setSubmitError(
          `Created ${data.data.created} event(s), ${data.data.failed} failed. ${
            errorMessages.length > 0 ? errorMessages.join("; ") : ""
          }`
        );
      }
    } catch (error: any) {
      console.error("Batch submission error:", error);
      setSubmitError(error.message || "Failed to submit batch. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearBatch = () => {
    if (confirm("Are you sure you want to clear all events? This action cannot be undone.")) {
      setEvents([]);
      setValidationErrors({});
      setSubmitError(null);
      setSubmitSuccess(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Event Creation</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create multiple events at once. Maximum {MAX_BATCH_SIZE} events per batch.
          </p>
        </div>
        <div className="flex gap-2">
          {events.length > 0 && (
            <>
              <Button
                color="danger"
                variant="light"
                onPress={handleClearBatch}
                isDisabled={isSubmitting}
              >
                Clear All
              </Button>
              <Button
                color="primary"
                onPress={handleSubmitBatch}
                isLoading={isSubmitting}
                isDisabled={events.length === 0 || Object.keys(validationErrors).length > 0}
              >
                Submit Batch ({events.length} event{events.length !== 1 ? "s" : ""})
              </Button>
            </>
          )}
          <Button
            color="primary"
            variant="flat"
            onPress={handleAddEvent}
            startContent={<PlusIcon className="h-4 w-4" />}
            isDisabled={events.length >= MAX_BATCH_SIZE || isSubmitting}
          >
            Add Event
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{submitSuccess}</p>
        </div>
      )}

      {draftRestored && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            ✓ Draft restored: {events.length} unsaved event{events.length !== 1 ? "s" : ""} recovered from previous session
          </p>
        </div>
      )}

      {events.length >= MAX_BATCH_SIZE && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Maximum batch size reached ({MAX_BATCH_SIZE} events). Please submit the current batch before adding more events.
          </p>
        </div>
      )}

      <BatchEventTable
        events={events}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onDeleteSelected={handleDeleteSelected}
        validationErrors={validationErrors}
      />

      <BatchEventFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingIndex(null);
        }}
        event={editingIndex !== null ? events[editingIndex] : null}
        onSubmit={handleFormSubmit}
        isSubmitting={false}
      />
    </div>
  );
}

