"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pencil, TrashBin, Plus } from "@gravity-ui/icons";
import OrganizationFormModal, { Organization } from "./organization-form-modal";
import { fetchJsonWithAuth } from "@/utils/fetchWithAuth";

interface OrganizationManagementProps {
  isOpen: boolean;
}

export default function OrganizationManagement({ isOpen }: OrganizationManagementProps) {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJsonWithAuth("/api/organizations", { method: "GET" });
      const list = Array.isArray(res.data) ? res.data : res;
      setItems(list || []);
    } catch (err: any) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const handleEdit = (org: Organization) => {
    setEditing(org);
    setShowForm(true);
  };
  const handleDelete = async (org: Organization) => {
    if (!org._id) return;
    if (!confirm(`Delete organization "${org.name}"? This cannot be undone.`)) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await fetchJsonWithAuth(`/api/organizations/${org._id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to delete organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (payload: Organization) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (payload._id) {
        const { _id, ...body } = payload; // omit _id per validator rules
        await fetchJsonWithAuth(`/api/organizations/${payload._id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        const { _id, ...body } = payload; // omit _id per validator rules
        await fetchJsonWithAuth(`/api/organizations`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to save organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Organizations</h3>
          <p className="text-sm text-gray-500 mt-1">Manage organizations (admin only).</p>
        </div>
        <Button color="primary" onPress={handleCreate} startContent={<Plus className="h-4 w-4" />}>Create Organization</Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table aria-label="Organization table">
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Code</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn width={120}>Actions</TableColumn>
          </TableHeader>
          <TableBody emptyContent={loading ? "Loading..." : "No organizations"}>
            {items.map((org) => (
              <TableRow key={org._id || org.name}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    {org.description && (
                      <span className="text-xs text-gray-500 mt-1 line-clamp-1">{org.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{org.type}</TableCell>
                <TableCell>{org.code || "—"}</TableCell>
                <TableCell>
                  {org.isActive ? (
                    <Chip size="sm" color="success" variant="flat">Active</Chip>
                  ) : (
                    <Chip size="sm" color="default" variant="flat">Inactive</Chip>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(org)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDelete(org)} aria-label="Delete">
                      <TrashBin className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrganizationFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        organization={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}
