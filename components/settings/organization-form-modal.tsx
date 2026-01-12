"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";

export type Organization = {
  _id?: string;
  name: string;
  type: "LGU" | "NGO" | "Hospital" | "BloodBank" | "RedCross" | "Non-LGU" | "Other";
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

interface OrganizationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (org: Organization) => void;
  isSubmitting?: boolean;
  organization?: Organization | null;
  error?: string | null;
}

const ORG_TYPES = [
  { value: "LGU", label: "LGU" },
  { value: "NGO", label: "NGO" },
  { value: "Hospital", label: "Hospital" },
  { value: "BloodBank", label: "Blood Bank" },
  { value: "RedCross", label: "Red Cross" },
  { value: "Non-LGU", label: "Non-LGU" },
  { value: "Other", label: "Other" },
] as const;

export default function OrganizationFormModal({
  isOpen,
  onClose,
  onSubmit,
  organization,
  isSubmitting = false,
  error: externalError = null,
}: OrganizationFormModalProps) {
  const [form, setForm] = useState<Organization>({
    name: "",
    type: "LGU",
    code: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || "",
        type: organization.type || "LGU",
        code: organization.code || "",
        description: organization.description || "",
        isActive: organization.isActive ?? true,
        _id: organization._id,
      });
    } else {
      setForm({
        name: "",
        type: "LGU",
        code: "",
        description: "",
        isActive: true,
      });
    }
    setErrors({});
    setInternalError(null);
  }, [organization, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 2) {
      e.name = "Name is required (min 2 chars)";
    }
    if (!form.type) {
      e.type = "Type is required";
    }
    if (form.code && !/^[a-z0-9-]+$/.test(form.code)) {
      e.code = "Code must be lowercase letters, numbers, hyphens";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setInternalError(null);
    if (!validate()) return;
    const payload: Organization = {
      name: form.name.trim(),
      type: form.type,
      code: form.code?.trim() || undefined,
      description: form.description?.trim() || undefined,
      isActive: form.isActive,
      _id: form._id,
    };
    try {
      onSubmit(payload);
    } catch (err: any) {
      setInternalError(err.message || "Failed to save organization");
    }
  };

  const displayError = externalError || internalError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{organization ? "Edit Organization" : "Create Organization"}</ModalHeader>
          <ModalBody className="gap-4">
            {displayError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            )}
            <Input
              label="Name"
              placeholder="Organization name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              isRequired
              errorMessage={errors.name}
              isInvalid={!!errors.name}
            />
            <Select
              label="Type"
              selectedKeys={form.type ? [form.type] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as Organization["type"];
                setForm({ ...form, type: selected || "LGU" });
              }}
              isRequired
              errorMessage={errors.type}
              isInvalid={!!errors.type}
            >
              {ORG_TYPES.map((t) => (
                <SelectItem key={t.value}>{t.label}</SelectItem>
              ))}
            </Select>
            <Input
              label="Code"
              placeholder="unique-code (optional)"
              value={form.code || ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              errorMessage={errors.code}
              isInvalid={!!errors.code}
            />
            <Textarea
              label="Description"
              placeholder="Description (optional)"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {/* Contact fields removed as requested */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {organization ? "Update" : "Create"}
              </Button>
            </div>
          </ModalBody>
        </form>
      </ModalContent>
    </Modal>
  );
}
