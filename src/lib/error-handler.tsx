'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Global error handler for API errors
export function APIErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for custom API error events
    const handleAPIError = (event: CustomEvent) => {
      const { message, type = 'error' } = event.detail;

      toast({
        title: type === 'error' ? 'Erro' : 'Aviso',
        description: message,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    };

    window.addEventListener('api-error', handleAPIError as EventListener);

    return () => {
      window.removeEventListener('api-error', handleAPIError as EventListener);
    };
  }, [toast]);

  return null;
}

// Utility function to dispatch API errors
export function dispatchAPIError(message: string, type: 'error' | 'warning' = 'error') {
  const event = new CustomEvent('api-error', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}

// Hook for handling API errors with toast
export function useAPIError() {
  const { toast } = useToast();

  const showError = (message: string) => {
    toast({
      title: 'Erro',
      description: message,
      variant: 'destructive',
    });
  };

  const showSuccess = (message: string) => {
    toast({
      title: 'Sucesso',
      description: message,
      variant: 'default',
    });
  };

  const showWarning = (message: string) => {
    toast({
      title: 'Aviso',
      description: message,
      variant: 'default',
    });
  };

  return { showError, showSuccess, showWarning };
}

// Error boundary specifically for data operations
export function DataErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}