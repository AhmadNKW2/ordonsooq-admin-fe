/**
 * Modal Component
 * Reusable modal dialog with backdrop and animations
 */

"use client";

import React, { useEffect, useState, useContext } from "react";
import { IconButton } from "./icon-button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'transparent';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = true,
  className = "",
  variant = 'default',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      // Show modal and start animation
      setShouldRender(true);
      setIsVisible(true);
      // Trigger animation after render with small delay
      const animTimer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(animTimer);
    } else if (shouldRender) {
      // Start closing animation
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        transition-opacity duration-300 ease-out
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          relative max-md:max-h-[90vh] rounded-r1 shadow-s1
          flex flex-col justify-center items-center gap-5
          transition-all duration-300 ease-out
          ${variant === 'default' ? 'p-10 bg-white' : ''}
          ${isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-4'
          } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <IconButton
          onClick={onClose}
          variant="cancel"
          className="absolute top-3 right-3"
        />

        {/* Content */}

        {/* Content */}
        {children}

      </div>
    </div>
  );
};