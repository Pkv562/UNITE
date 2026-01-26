/**
 * Claim/Release Action Component (Broadcast Model)
 * 
 * File: UNITE/components/campaign/request-claim-actions.tsx
 * 
 * This component handles:
 * 1. Claiming requests for review
 * 2. Releasing claims for other coordinators
 * 3. Displaying claim status and timeouts
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
} from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import { claimRequest, releaseRequest } from "./services/requestsService";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RequestClaimActionsProps {
  requestId: string;
  claimedBy?: any;
  validCoordinators?: any[];
  userAuthority?: number;
  onClaimSuccess?: () => void;
  onReleaseSuccess?: () => void;
}

export const RequestClaimActions: React.FC<RequestClaimActionsProps> = ({
  requestId,
  claimedBy,
  validCoordinators = [],
  userAuthority = 0,
  onClaimSuccess,
  onReleaseSuccess,
}) => {
  const { user: currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const currentUserId = currentUser?._id;
  const isClaimedByMe = claimedBy?.userId === currentUserId;
  const isValidCoordinator = validCoordinators?.some(
    (vc) => vc.userId === currentUserId
  );

  // Timer for claim timeout countdown
  useEffect(() => {
    if (!claimedBy?.claimTimeoutAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const timeoutDate = new Date(claimedBy.claimTimeoutAt);
      const now = new Date();
      const diff = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));

      if (diff > 0) {
        setTimeRemaining(diff);
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [claimedBy?.claimTimeoutAt]);

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const handleClaim = async () => {
    setLoading(true);
    setError("");

    try {
      await claimRequest(requestId);
      onClaimSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to claim request");
      console.error("Error claiming request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    setError("");

    try {
      await releaseRequest(requestId);
      onReleaseSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to release request");
      console.error("Error releasing request:", err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything if not a valid coordinator
  if (!isValidCoordinator) {
    return null;
  }

  return (
    <Card className="border-2 border-info">
      <CardHeader className="flex gap-3 pb-0 pt-4">
        <div className="flex flex-col">
          <p className="text-md font-semibold">Request Status</p>
          <p className="text-small text-default-500">Broadcast Model - Claim/Release</p>
        </div>
      </CardHeader>

      <CardBody>
        {/* Claimed Status Display */}
        {claimedBy && (
          <div className="mb-4 p-3 bg-warning-50 rounded-lg border border-warning">
            <div className="flex items-center justify-between">
              <div>
                <Badge color={isClaimedByMe ? "success" : "warning"}>
                  {isClaimedByMe ? "CLAIMED BY YOU" : "CLAIMED"}
                </Badge>
                <p className="text-sm mt-2">
                  {isClaimedByMe ? "You" : claimedBy.name} claimed this request
                </p>
                {timeRemaining !== null && (
                  <p className="text-xs text-default-600 mt-1">
                    Timeout in: {formatTimeRemaining(timeRemaining)}
                  </p>
                )}
              </div>

              {isClaimedByMe && (
                <Button
                  size="sm"
                  color="warning"
                  variant="flat"
                  onPress={handleRelease}
                  isLoading={loading}
                  isDisabled={loading}
                >
                  Release
                </Button>
              )}
            </div>

            {!isClaimedByMe && (
              <p className="text-xs text-warning-600 mt-2">
                ℹ️ This request is currently claimed by another coordinator. Wait for them to finish or contact them to release.
              </p>
            )}
          </div>
        )}

        {/* Not Claimed - Claim Button */}
        {!claimedBy && (
          <div className="p-3 bg-info-50 rounded-lg border border-info">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Request is available for claiming
                </p>
                <p className="text-xs text-default-600 mt-1">
                  Claim to prevent other coordinators from acting on this request
                </p>
              </div>

              <Button
                size="sm"
                color="primary"
                onPress={handleClaim}
                isLoading={loading}
                isDisabled={loading}
              >
                Claim
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-danger-50 rounded-lg border border-danger mt-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Info: Other Valid Coordinators */}
        {validCoordinators.length > 1 && (
          <div className="mt-4 p-3 bg-default-50 rounded-lg">
            <p className="text-xs font-semibold mb-2">
              Other coordinators who can see this request:
            </p>
            <div className="flex flex-wrap gap-2">
              {validCoordinators
                .filter((vc) => vc.userId !== currentUserId)
                .map((coordinator) => (
                  <Badge key={coordinator.userId} color="default" variant="flat">
                    {coordinator.name}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default RequestClaimActions;
