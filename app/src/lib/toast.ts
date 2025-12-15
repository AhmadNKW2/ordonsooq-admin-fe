/**
 * Toast utility for notifications
 * Centralized toast configuration using react-toastify
 */

import React from "react";
import { toast, Slide, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
  transition: Slide,
};

export const showSuccessToast = (message: string) => {
  toast.success(message, defaultOptions);
};

export const showErrorToast = (message: string) => {
  toast.error(message, defaultOptions);
};

export const showInfoToast = (message: string) => {
  toast.info(message, defaultOptions);
};

export const showWarningToast = (message: string) => {
  toast.warning(message, defaultOptions);
};

export const showLoadingToast = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultOptions,
    hideProgressBar: true,
    autoClose: false,
    closeOnClick: false,
    draggable: false,
    ...options,
  });
};

export const updateToast = (
  toastId: ReturnType<typeof showLoadingToast>,
  message: string,
  options?: ToastOptions & {
    render?: React.ReactNode;
    type?: "default" | "success" | "error" | "info" | "warning";
    isLoading?: boolean;
  }
) => {
  toast.update(toastId, {
    render: message,
    ...defaultOptions,
    ...options,
  });
};

export const finishToastSuccess = (
  toastId: ReturnType<typeof showLoadingToast>,
  message: string,
  options?: ToastOptions
) => {
  updateToast(toastId, message, {
    type: "success",
    isLoading: false,
    autoClose: 3000,
    ...options,
  });
};

export const finishToastError = (
  toastId: ReturnType<typeof showLoadingToast>,
  message: string,
  options?: ToastOptions
) => {
  updateToast(toastId, message, {
    type: "error",
    isLoading: false,
    autoClose: 6000,
    ...options,
  });
};

export const dismissToast = (toastId: ReturnType<typeof showLoadingToast>) => {
  toast.dismiss(toastId);
};

export const updateLoadingToast = (
  toastId: ReturnType<typeof showLoadingToast>,
  params: {
    title: string;
    subtitle?: string;
    progress?: number; // 0..1
  }
) => {
  const safeProgress =
    typeof params.progress === "number"
      ? Math.max(0, Math.min(1, params.progress))
      : undefined;
  const percent = typeof safeProgress === "number" ? Math.round(safeProgress * 100) : undefined;

  const subtitleNode =
    params.subtitle || typeof percent === "number"
      ? React.createElement(
          "div",
          { className: "text-sm opacity-90 leading-snug" },
          params.subtitle ?? null,
          typeof percent === "number"
            ? React.createElement(
                "span",
                { className: "ml-2 font-semibold" },
                `${percent}%`
              )
            : null
        )
      : null;

  const progressBarNode =
    typeof percent === "number"
      ? React.createElement(
          "div",
          { className: "h-2 w-full rounded bg-white/25 overflow-hidden" },
          React.createElement("div", {
            className: "h-full rounded bg-white/80",
            style: { width: `${percent}%` },
          })
        )
      : null;

  const renderNode = React.createElement(
    "div",
    { className: "flex flex-col gap-2" },
    React.createElement(
      "div",
      { className: "font-semibold leading-tight" },
      params.title
    ),
    subtitleNode,
    progressBarNode
  );

  updateToast(
    toastId,
    "",
    {
      isLoading: true,
      closeOnClick: false,
      draggable: false,
      autoClose: false,
      progress: safeProgress,
      render: renderNode,
    }
  );
};
