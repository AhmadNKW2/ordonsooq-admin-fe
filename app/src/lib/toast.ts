/**
 * Toast utility for notifications
 * Centralized toast configuration using react-toastify
 */

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
