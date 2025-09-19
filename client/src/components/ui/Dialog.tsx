/**
 * Dialog Component
 * Re-exports Modal components with Dialog naming for compatibility
 */

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalTrigger } from './Modal';

// Re-export Modal components as Dialog components for compatibility
export const Dialog = Modal;
export const DialogContent = ModalContent;
export const DialogHeader = ModalHeader;
export const DialogTitle = ModalTitle;
export const DialogDescription = ModalDescription;
export const DialogTrigger = ModalTrigger;

export default Dialog;