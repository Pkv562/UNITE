/**
 * useStakeholderManagement Hook
 * Business logic hook for stakeholder management page
 * Uses dedicated stakeholder creation context endpoint
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchJsonWithAuth } from '@/utils/fetchWithAuth';
import type { CoverageArea, Organization } from './useCoverageAreas';

export interface CreationContext {
  allowedRole: string;
  canChooseCoverage: boolean;
  canChooseOrganization: boolean;
  coverageOptions: CoverageArea[];
  organizationOptions: Organization[];
  isSystemAdmin: boolean;
}

export interface UseStakeholderManagementReturn {
  // State (from backend)
  allowedRole: string;
  canChooseCoverage: boolean;
  canChooseOrganization: boolean;
  coverageOptions: CoverageArea[];
  organizationOptions: Organization[];
  isSystemAdmin: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCreationContext: () => Promise<void>;
  
  // Legacy compatibility (for existing components)
  assignableRoles: never[]; // Always empty - role is forced to stakeholder
  creatorCoverageAreas: CoverageArea[]; // Alias for coverageOptions
  allowedOrganizations: Organization[]; // Alias for organizationOptions
  canAssignRole: (roleId: string) => boolean; // Always returns false (no role selection)
  canSelectCoverageArea: (coverageAreaId: string) => boolean;
  canSelectOrganization: (organizationId: string) => boolean;
}

export function useStakeholderManagement(): UseStakeholderManagementReturn {
  const [allowedRole, setAllowedRole] = useState<string>('stakeholder');
  const [canChooseCoverage, setCanChooseCoverage] = useState<boolean>(false);
  const [canChooseOrganization, setCanChooseOrganization] = useState<boolean>(false);
  const [coverageOptions, setCoverageOptions] = useState<CoverageArea[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Organization[]>([]);
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch creation context from dedicated stakeholder endpoint
   */
  const fetchCreationContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchJsonWithAuth('/api/stakeholders/creation-context');
      
      if (response.success && response.data) {
        const context: CreationContext = response.data;
        setAllowedRole(context.allowedRole);
        setCanChooseCoverage(context.canChooseCoverage);
        setCanChooseOrganization(context.canChooseOrganization);
        setCoverageOptions(context.coverageOptions || []);
        setOrganizationOptions(context.organizationOptions || []);
        setIsSystemAdmin(context.isSystemAdmin);
        
        // Diagnostic logging
        console.log('[DIAG] Stakeholder Creation Context:', {
          allowedRole: context.allowedRole,
          canChooseCoverage: context.canChooseCoverage,
          canChooseOrganization: context.canChooseOrganization,
          coverageOptionsCount: context.coverageOptions?.length || 0,
          organizationOptionsCount: context.organizationOptions?.length || 0,
          isSystemAdmin: context.isSystemAdmin
        });
      } else {
        throw new Error(response.message || 'Failed to fetch creation context');
      }
    } catch (err: any) {
      console.error('Failed to fetch creation context:', err);
      setError(err.message || 'Failed to fetch creation context');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if a role can be assigned (always false - role is forced to stakeholder)
   */
  const canAssignRole = useCallback((roleId: string): boolean => {
    return false; // Role selection is disabled - always stakeholder
  }, []);

  /**
   * Check if a coverage area can be selected
   */
  const canSelectCoverageArea = useCallback((coverageAreaId: string): boolean => {
    if (canChooseCoverage) {
      return true; // System admin can choose any
    }
    return coverageOptions.some(ca => {
      const id = ca._id || ca.id;
      return String(id) === String(coverageAreaId);
    });
  }, [canChooseCoverage, coverageOptions]);

  /**
   * Check if an organization can be selected
   */
  const canSelectOrganization = useCallback((organizationId: string): boolean => {
    if (canChooseOrganization) {
      return true; // System admin can choose any
    }
    return organizationOptions.some(org => {
      const id = org._id || org.id;
      return String(id) === String(organizationId);
    });
  }, [canChooseOrganization, organizationOptions]);

  // Fetch data on mount
  useEffect(() => {
    fetchCreationContext();
  }, [fetchCreationContext]);

  return {
    // New API (from backend)
    allowedRole,
    canChooseCoverage,
    canChooseOrganization,
    coverageOptions,
    organizationOptions,
    isSystemAdmin,
    loading,
    error,
    fetchCreationContext,
    
    // Legacy compatibility
    assignableRoles: [], // Always empty - role is forced to stakeholder
    creatorCoverageAreas: coverageOptions, // Alias for coverageOptions
    allowedOrganizations: organizationOptions, // Alias for organizationOptions
    canAssignRole,
    canSelectCoverageArea,
    canSelectOrganization,
  };
}

