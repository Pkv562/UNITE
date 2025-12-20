"use client";

import { useState, useEffect, useMemo } from "react";
import { Radio, RadioGroup } from "@heroui/radio";
import { useRoles } from "@/hooks/useRoles";
import type { Role } from "@/types/coordinator.types";

interface RoleAssignmentSectionProps {
  selectedRoleId: string;
  onSelectionChange: (roleId: string) => void;
  allowedStaffTypes?: string[]; // Role codes that are allowed
  isRequired?: boolean;
  error?: string;
}

export default function RoleAssignmentSection({
  selectedRoleId,
  onSelectionChange,
  allowedStaffTypes,
  isRequired = true,
  error,
}: RoleAssignmentSectionProps) {
  const { roles, loading } = useRoles(true); // Always load roles

  // Filter roles based on allowed staff types
  const availableRoles = useMemo(() => {
    if (!allowedStaffTypes || allowedStaffTypes.length === 0) {
      return roles; // Show all if no restrictions
    }

    if (allowedStaffTypes.includes("*")) {
      return roles; // "*" means all roles allowed
    }

    return roles.filter((role) => allowedStaffTypes.includes(role.code));
  }, [roles, allowedStaffTypes]);

  const handleRoleChange = (roleId: string) => {
    onSelectionChange(roleId);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Roles <span className="text-red-500">*</span>
        </label>
        <div className="text-sm text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Role {isRequired && <span className="text-red-500">*</span>}
      </label>

      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}

      {availableRoles.length === 0 ? (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
          No roles available. You may not have permission to assign roles, or no
          roles are configured in the system.
        </div>
      ) : (
        <RadioGroup
          value={selectedRoleId}
          onValueChange={handleRoleChange}
          classNames={{
            wrapper: "space-y-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50",
          }}
        >
          {availableRoles.map((role) => (
            <Radio
              key={role._id}
              value={role._id}
              classNames={{
                label: "text-sm",
                wrapper: "py-1 hover:bg-white rounded px-2 transition-colors",
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {role.name}
                </span>
                {role.description && (
                  <span className="text-xs text-gray-500 mt-0.5">
                    {role.description}
                  </span>
                )}
                <span className="text-xs text-gray-400 mt-0.5">
                  Code: {role.code}
                </span>
              </div>
            </Radio>
          ))}
        </RadioGroup>
      )}

      {!selectedRoleId && isRequired && (
        <div className="text-xs text-amber-600 mt-1">
          A role must be selected
        </div>
      )}

      {selectedRoleId && (
        <div className="text-xs text-gray-500 mt-1">
          Role selected
        </div>
      )}
    </div>
  );
}

