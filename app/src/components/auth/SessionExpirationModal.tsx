/**
 * Session Expiration Warning Modal
 * Displays a countdown timer when the session is about to expire
 * Allows user to extend their session or logout
 */

"use client";

import React, { useEffect, useState } from "react";
import { Clock, LogOut, RefreshCw, AlertTriangle } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface SessionExpirationModalProps {
  isOpen: boolean;
  expiresAt: number;
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
  onDismiss: () => void;
}

export const SessionExpirationModal: React.FC<SessionExpirationModalProps> = ({
  isOpen,
  expiresAt,
  timeRemaining,
  onExtendSession,
  onLogout,
  onDismiss,
}) => {
  const [isExtending, setIsExtending] = useState(false);

  // Format time remaining
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage (for circular timer)
  const progressPercentage = Math.max(0, Math.min(100, (timeRemaining / (5 * 60 * 1000)) * 100));

  // Determine urgency level
  const isUrgent = timeRemaining < 60 * 1000; // Less than 1 minute
  const isCritical = timeRemaining < 30 * 1000; // Less than 30 seconds

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
    } finally {
      setIsExtending(false);
    }
  };

  // Auto-logout when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && isOpen) {
      onLogout();
    }
  }, [timeRemaining, isOpen, onLogout]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      className="max-w-md"
    >
      <div className="flex flex-col items-center px-2 py-4">
        {/* Animated Warning Icon with Circular Timer */}
        <div className="relative mb-6">
          {/* Background Circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progressPercentage / 100)}`}
              className={cn(
                "transition-all duration-1000",
                isCritical
                  ? "text-red-500"
                  : isUrgent
                  ? "text-orange-500"
                  : "text-amber-500"
              )}
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock
              className={cn(
                "w-8 h-8 mb-1",
                isCritical
                  ? "text-red-500 animate-pulse"
                  : isUrgent
                  ? "text-orange-500"
                  : "text-amber-500"
              )}
            />
            <span
              className={cn(
                "text-2xl font-bold font-mono",
                isCritical
                  ? "text-red-600 dark:text-red-400"
                  : isUrgent
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle
              className={cn(
                "w-5 h-5",
                isCritical ? "text-red-500" : "text-amber-500"
              )}
            />
            <h3
              className={cn(
                "text-lg font-semibold",
                isCritical
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              Session Expiring Soon
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your session will expire in{" "}
            <span className="font-semibold">{formatTime(timeRemaining)}</span>.
            <br />
            Would you like to stay logged in?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-3">
          <Button
            onClick={handleExtend}
            disabled={isExtending}
            className={cn(
              "w-full relative overflow-hidden",
              "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "text-white font-medium py-3 rounded-xl",
              "transition-all duration-200 transform hover:scale-[1.02]",
              "shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
              "disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <RefreshCw
                className={cn("w-4 h-4", isExtending && "animate-spin")}
              />
              {isExtending ? "Extending..." : "Stay Logged In"}
            </span>
          </Button>

          <Button
            onClick={onLogout}
            variant="outline"
            className={cn(
              "w-full py-3 rounded-xl",
              "border-gray-300 dark:border-gray-600",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-all duration-200"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout Now
            </span>
          </Button>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
          For your security, sessions expire after periods of inactivity.
        </p>
      </div>
    </Modal>
  );
};
