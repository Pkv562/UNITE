/**
 * Frontend Coordinator Filtering Utilities
 * 
 * Provides additional client-side filtering and validation for coordinators.
 * Works in conjunction with backend validation.
 */

/**
 * Format coordinator option label with coverage and org type info
 * 
 * @param coordinator - Coordinator user object
 * @returns Formatted label string
 */
export function formatCoordinatorLabel(coordinator: any): string {
  const fullName = coordinator.fullName || 
    `${coordinator.firstName || ''} ${coordinator.lastName || ''}`.trim() || 
    'Unknown Coordinator';

  // Get primary coverage area name
  let coverageLabel = '';
  if (coordinator.coverageAreas && coordinator.coverageAreas.length > 0) {
    const primaryCoverage = coordinator.coverageAreas[0];
    if (primaryCoverage.coverageAreaName) {
      coverageLabel = ` - ${primaryCoverage.coverageAreaName}`;
    }
  }

  // Get organization type
  let orgTypeLabel = '';
  if (coordinator.organizationType) {
    orgTypeLabel = ` (${coordinator.organizationType})`;
  }

  return `${fullName}${coverageLabel}${orgTypeLabel}`;
}

/**
 * Check if coordinator is valid for stakeholder (client-side secondary validation)
 * 
 * This provides UI feedback, but backend validation is authoritative.
 * 
 * @param stakeholder - Stakeholder user object
 * @param coordinator - Coordinator user object
 * @returns boolean indicating if coordinator is valid
 */
export function isCoordinatorValidForStakeholder(
  stakeholder: any,
  coordinator: any
): boolean {
  // Check organization type match
  const stakeholderOrgType = stakeholder.organizationType || 
    stakeholder.organizations?.[0]?.organizationType;
  const coordinatorOrgType = coordinator.organizationType || 
    coordinator.organizations?.[0]?.organizationType;

  if (stakeholderOrgType && coordinatorOrgType) {
    const sType = String(stakeholderOrgType).toLowerCase().trim();
    const cType = String(coordinatorOrgType).toLowerCase().trim();
    if (sType !== cType) {
      return false;
    }
  }

  // Check coverage area contains stakeholder location
  const stakeholderMunicipality = stakeholder.locations?.municipalityId;
  if (stakeholderMunicipality && coordinator.coverageAreas) {
    let isCovered = false;

    for (const coverage of coordinator.coverageAreas) {
      // Check direct municipality match
      if (coverage.municipalityIds) {
        const hasDirectMatch = coverage.municipalityIds.some(
          (mid: any) => mid.toString?.() === stakeholderMunicipality.toString?.() || mid === stakeholderMunicipality
        );
        if (hasDirectMatch) {
          isCovered = true;
          break;
        }
      }
    }

    if (!isCovered) {
      return false;
    }
  }

  return true;
}

/**
 * Filter coordinators based on stakeholder (client-side)
 * 
 * Applies additional filtering on top of backend-provided coordinators.
 * Backend is authoritative, but this ensures UI consistency.
 * 
 * @param coordinators - Array of coordinator options
 * @param stakeholder - Stakeholder user object
 * @returns Filtered array of valid coordinators
 */
export function filterValidCoordinatorsForStakeholder(
  coordinators: any[],
  stakeholder: any
): any[] {
  if (!Array.isArray(coordinators) || !stakeholder) {
    return coordinators;
  }

  return coordinators.filter(coordinator =>
    isCoordinatorValidForStakeholder(stakeholder, coordinator)
  );
}

/**
 * Get validation message for invalid coordinator
 * 
 * @param stakeholder - Stakeholder user object
 * @param coordinator - Coordinator user object
 * @returns Validation message string
 */
export function getCoordinatorValidationMessage(
  stakeholder: any,
  coordinator: any
): string | null {
  const stakeholderOrgType = stakeholder.organizationType || 
    stakeholder.organizations?.[0]?.organizationType;
  const coordinatorOrgType = coordinator.organizationType || 
    coordinator.organizations?.[0]?.organizationType;

  if (stakeholderOrgType && coordinatorOrgType) {
    const sType = String(stakeholderOrgType).toLowerCase().trim();
    const cType = String(coordinatorOrgType).toLowerCase().trim();
    if (sType !== cType) {
      return `Organization type mismatch: Stakeholder is ${sType}, Coordinator is ${cType}`;
    }
  }

  const stakeholderMunicipality = stakeholder.locations?.municipalityName || 
    stakeholder.locations?.municipalityId;
  if (stakeholderMunicipality && coordinator.coverageAreas) {
    let isCovered = false;
    for (const coverage of coordinator.coverageAreas) {
      if (coverage.municipalityIds) {
        const hasDirectMatch = coverage.municipalityIds.some(
          (mid: any) => mid === stakeholder.locations?.municipalityId
        );
        if (hasDirectMatch) {
          isCovered = true;
          break;
        }
      }
    }

    if (!isCovered) {
      const coverage = coordinator.coverageAreas?.[0]?.coverageAreaName || 'unknown area';
      return `Stakeholder location (${stakeholderMunicipality}) is not in coordinator's coverage area (${coverage})`;
    }
  }

  return null;
}
