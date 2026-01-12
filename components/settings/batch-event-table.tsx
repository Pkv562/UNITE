"use client";

import { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Checkbox } from "@heroui/checkbox";
import { Pencil, TrashBin } from "@gravity-ui/icons";
import { BatchEventData } from "./batch-event-form-modal";

interface BatchEventTableProps {
  events: BatchEventData[];
  onEdit: (index: number, event: BatchEventData) => void;
  onDelete: (index: number) => void;
  onDeleteSelected: (indices: number[]) => void;
  validationErrors?: Record<number, string[]>;
}

export default function BatchEventTable({
  events,
  onEdit,
  onDelete,
  onDeleteSelected,
  validationErrors = {},
}: BatchEventTableProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndices(new Set(events.map((_, index) => index)));
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleSelect = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedIndices);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size > 0) {
      onDeleteSelected(Array.from(selectedIndices));
      setSelectedIndices(new Set());
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return "—";
    const categoryMap: Record<string, string> = {
      BloodDrive: "Blood Drive",
      Training: "Training",
      Advocacy: "Advocacy",
    };
    return categoryMap[category] || category;
  };

  const hasErrors = (index: number) => {
    return validationErrors[index] && validationErrors[index].length > 0;
  };

  const getErrors = (index: number) => {
    return validationErrors[index] || [];
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No events in batch. Click "Add Event" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIndices.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-sm text-blue-800">
            {selectedIndices.size} event(s) selected
          </span>
          <Button
            color="danger"
            size="sm"
            variant="flat"
            onPress={handleDeleteSelected}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table
          aria-label="Batch events table"
        >
          <TableHeader>
            <TableColumn width={50}>
              <div className="flex items-center">
                <Checkbox
                  isSelected={selectedIndices.size === events.length && events.length > 0}
                  onValueChange={handleSelectAll}
                  aria-label="Select all"
                />
              </div>
            </TableColumn>
            <TableColumn>Title</TableColumn>
            <TableColumn>Location</TableColumn>
            <TableColumn>Start Date</TableColumn>
            <TableColumn>End Date</TableColumn>
            <TableColumn>Category</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn width={120}>Actions</TableColumn>
          </TableHeader>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    isSelected={selectedIndices.has(index)}
                    onValueChange={(checked) => handleSelect(index, checked)}
                    aria-label={`Select event ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{event.Event_Title}</span>
                    {hasErrors(index) && (
                      <span className="text-xs text-red-600 mt-1">
                        {getErrors(index).length} error(s)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{event.Location}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(event.Start_Date)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatDate(event.End_Date)}</span>
                </TableCell>
                <TableCell>
                  {event.Category ? (
                    <Chip size="sm" variant="flat">
                      {getCategoryLabel(event.Category)}
                    </Chip>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {hasErrors(index) ? (
                    <Chip size="sm" color="danger" variant="flat">
                      Invalid
                    </Chip>
                  ) : (
                    <Chip size="sm" color="success" variant="flat">
                      Valid
                    </Chip>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(index, event)}
                      aria-label="Edit event"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(index)}
                      aria-label="Delete event"
                    >
                      <TrashBin className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Display validation errors for events */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-red-600">Validation Errors:</h4>
          {Object.entries(validationErrors).map(([index, errors]) => (
            <div
              key={index}
              className="p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <p className="text-sm font-medium text-red-800">
                Event {parseInt(index) + 1}: {events[parseInt(index)]?.Event_Title || "Untitled"}
              </p>
              <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                {errors.map((error, errorIndex) => (
                  <li key={errorIndex}>{error}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

