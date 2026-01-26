/**
 * Coordinator Selection & Override Component (Broadcast Model)
 * 
 * File: UNITE/components/campaign/coordinator-override-modal.tsx
 * 
 * This component handles:
 * 1. Displaying valid coordinators for broadcast visibility
 * 2. Allowing admins to override coordinator assignments
 * 3. Showing current claim status
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getValidCoordinators, overrideCoordinator } from "./services/requestsService";

interface CoordinatorOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId?: string;
  currentCoordinator?: any;
  userAuthority?: number;
  onOverrideSuccess?: () => void;
}

export const CoordinatorOverrideModal: React.FC<CoordinatorOverrideModalProps> = ({
  isOpen,
  onClose,
  requestId,
  currentCoordinator,
  userAuthority = 0,
  onOverrideSuccess,
}) => {
  const { user: currentUser } = useCurrentUser();
  const [validCoordinators, setValidCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [claimedBy, setClaimedBy] = useState<any>(null);

  const isAdmin = userAuthority >= 80;

  // Fetch valid coordinators when modal opens
  useEffect(() => {
    if (isOpen && requestId) {
      fetchCoordinators();
    }
  }, [isOpen, requestId]);

  const fetchCoordinators = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getValidCoordinators(requestId!);
      setValidCoordinators(response.data?.validCoordinators || []);
      setClaimedBy(response.data?.claimedBy || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch valid coordinators");
      console.error("Error fetching coordinators:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedCoordinatorId) {
      setError("Please select a coordinator");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await overrideCoordinator(requestId!, selectedCoordinatorId);
      setSuccess("Coordinator assignment updated successfully!");
      
      setTimeout(() => {
        onOverrideSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to override coordinator");
      console.error("Error overriding coordinator:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Coordinator Assignment
        </ModalHeader>

        <ModalBody>
          {/* Current Coordinator Info */}
          {currentCoordinator && (
            <Card className="bg-default-50 mb-4">
              <CardBody>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={currentCoordinator.name}
                    size="md"
                    color="primary"
                  />
                  <div>
                    <p className="text-sm font-semibold">Current Coordinator</p>
                    <p className="text-sm">{currentCoordinator.name}</p>
                    {currentCoordinator.assignmentRule === "manual" && (
                      <span className="text-xs text-warning">
                        (Manually overridden)
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Claim Status */}
          {claimedBy && (
            <Card className="bg-warning-50 mb-4 border border-warning">
              <CardBody>
                <div className="flex items-center gap-2">
                  <Badge color="warning">CLAIMED</Badge>
                  <div>
                    <p className="text-sm font-semibold">
                      Claimed by {claimedBy.name}
                    </p>
                    <p className="text-xs text-default-500">
                      {claimedBy.claimedAt
                        ? new Date(claimedBy.claimedAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Valid Coordinators List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold mb-3">
                  Valid Coordinators ({validCoordinators.length})
                </p>
                <p className="text-xs text-default-500 mb-4">
                  These are all coordinators who can see and act on this request
                </p>
              </div>

              {validCoordinators.length > 0 ? (
                <>
                  {isAdmin && (
                    <Select
                      label="Select Coordinator to Assign"
                      placeholder="Choose a coordinator..."
                      selectedKeys={selectedCoordinatorId ? [selectedCoordinatorId] : []}
                      onChange={(e) => {
                        setSelectedCoordinatorId(e.target.value);
                        setError("");
                      }}
                      className="mb-4"
                    >
                      {validCoordinators.map((coord: any) => (
                        <SelectItem
                          key={coord.userId}
                          textValue={coord.name}
                        >
                          {coord.name}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {validCoordinators.map((coordinator: any) => (
                      <Card key={coordinator.userId} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar
                              name={coordinator.name}
                              size="sm"
                              color="secondary"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {coordinator.name}
                              </p>
                              <p className="text-xs text-default-500">
                                {coordinator.roleSnapshot || "Coordinator"}
                              </p>
                            </div>
                          </div>
                          {currentCoordinator?.userId === coordinator.userId && (
                            <Badge color="primary">CURRENT</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card className="bg-danger-50">
                  <CardBody>
                    <p className="text-sm text-danger">
                      No valid coordinators found for this request
                    </p>
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <Card className="bg-danger-50 border border-danger">
              <CardBody>
                <p className="text-sm text-danger">{error}</p>
              </CardBody>
            </Card>
          )}

          {/* Success Message */}
          {success && (
            <Card className="bg-success-50 border border-success">
              <CardBody>
                <p className="text-sm text-success">{success}</p>
              </CardBody>
            </Card>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Close
          </Button>
          {isAdmin && (
            <Button
              color="primary"
              onPress={handleOverride}
              isDisabled={!selectedCoordinatorId || loading}
              isLoading={loading}
            >
              Override Assignment
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CoordinatorOverrideModal;
