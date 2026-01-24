import { useState, useCallback } from 'react';
import type { Customer, Employee } from '@/lib/types';

export interface UsePdvStateReturn {
  selectedCustomer: Customer | null;
  lastAction: string;
  isCustomerDialogOpen: boolean;
  isFinalizeSaleDialogOpen: boolean;
  isCashPaymentDialogOpen: boolean;
  isInstructionsModalOpen: boolean;
  isCalculatorModalOpen: boolean;
  isSearchingProduct: boolean;
  isAddingToCart: boolean;

  setSelectedCustomer: (customer: Customer | null) => void;
  setLastAction: (action: string) => void;
  setIsCustomerDialogOpen: (open: boolean) => void;
  setIsFinalizeSaleDialogOpen: (open: boolean) => void;
  setIsCashPaymentDialogOpen: (open: boolean) => void;
  setIsInstructionsModalOpen: (open: boolean) => void;
  setIsCalculatorModalOpen: (open: boolean) => void;
  setIsSearchingProduct: (searching: boolean) => void;
  setIsAddingToCart: (adding: boolean) => void;

  // Ações convenientes
  openCustomerDialog: () => void;
  closeCustomerDialog: () => void;
  openFinalizeSaleDialog: () => void;
  closeFinalizeSaleDialog: () => void;
  openCashPaymentDialog: () => void;
  closeCashPaymentDialog: () => void;
  openInstructionsModal: () => void;
  closeInstructionsModal: () => void;
  openCalculatorModal: () => void;
  closeCalculatorModal: () => void;
}

export function usePdvState(authenticatedEmployee: Employee | null): UsePdvStateReturn {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastAction, setLastAction] = useState('Caixa Livre');
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isFinalizeSaleDialogOpen, setIsFinalizeSaleDialogOpen] = useState(false);
  const [isCashPaymentDialogOpen, setIsCashPaymentDialogOpen] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Ações convenientes
  const openCustomerDialog = useCallback(() => {
    setIsCustomerDialogOpen(true);
    setLastAction('Selecionando cliente...');
  }, []);

  const closeCustomerDialog = useCallback(() => {
    setIsCustomerDialogOpen(false);
    if (selectedCustomer) {
      setLastAction(`Cliente selecionado: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`);
    } else {
      setLastAction('Cliente não selecionado');
    }
  }, [selectedCustomer]);

  const openFinalizeSaleDialog = useCallback(() => {
    setIsFinalizeSaleDialogOpen(true);
    setLastAction('Finalizando venda...');
  }, []);

  const closeFinalizeSaleDialog = useCallback(() => {
    setIsFinalizeSaleDialogOpen(false);
    setLastAction('Venda finalizada');
  }, []);

  const openCashPaymentDialog = useCallback(() => {
    setIsCashPaymentDialogOpen(true);
    setLastAction('Processando pagamento em dinheiro...');
  }, []);

  const closeCashPaymentDialog = useCallback(() => {
    setIsCashPaymentDialogOpen(false);
    setLastAction('Pagamento processado');
  }, []);

  const openInstructionsModal = useCallback(() => {
    setIsInstructionsModalOpen(true);
  }, []);

  const closeInstructionsModal = useCallback(() => {
    setIsInstructionsModalOpen(false);
  }, []);

  const openCalculatorModal = useCallback(() => {
    setIsCalculatorModalOpen(true);
  }, []);

  const closeCalculatorModal = useCallback(() => {
    setIsCalculatorModalOpen(false);
  }, []);

  return {
    selectedCustomer,
    lastAction,
    isCustomerDialogOpen,
    isFinalizeSaleDialogOpen,
    isCashPaymentDialogOpen,
    isInstructionsModalOpen,
    isCalculatorModalOpen,
    isSearchingProduct,
    isAddingToCart,

    setSelectedCustomer,
    setLastAction,
    setIsCustomerDialogOpen,
    setIsFinalizeSaleDialogOpen,
    setIsCashPaymentDialogOpen,
    setIsInstructionsModalOpen,
    setIsCalculatorModalOpen,
    setIsSearchingProduct,
    setIsAddingToCart,

    openCustomerDialog,
    closeCustomerDialog,
    openFinalizeSaleDialog,
    closeFinalizeSaleDialog,
    openCashPaymentDialog,
    closeCashPaymentDialog,
    openInstructionsModal,
    closeInstructionsModal,
    openCalculatorModal,
    closeCalculatorModal,
  };
}