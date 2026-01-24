'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { payload as generatePixPayload, PixSVG } from '@/lib/pix';
import type { PixKeyType } from '@/lib/types';

type PixPaymentDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  total: number;
  pixKeyType?: PixKeyType;
  pixKeyValue?: string;
  storeName: string;
  storeCity: string;
  onConfirm: () => void;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function PixPaymentDialog({
  isOpen,
  onOpenChange,
  total,
  pixKeyType,
  pixKeyValue,
  storeName,
  storeCity,
  onConfirm,
}: PixPaymentDialogProps) {
  const { toast } = useToast();
  const [qrCodeKey, setQrCodeKey] = useState<number>(0); // Force re-render of QR code

  // Generate PIX payload using useMemo to avoid unnecessary re-computations
  const pixPayload = useMemo(() => {
    if (isOpen && pixKeyValue && pixKeyType && storeName && storeCity && total > 0) {
      try {
        return generatePixPayload({
          pixkey: pixKeyValue,
          merchant: storeName,
          city: storeCity,
          amount: total,
          code: `VENDA-${Math.floor(total * 100)}`, // Unique transaction code based on total in cents
        });
      } catch (error) {

        return '';
      }
    }
    return '';
  }, [isOpen, pixKeyValue, pixKeyType, storeName, storeCity, total]);

  // Show error toast if payload generation failed
  useEffect(() => {
    if (isOpen && pixPayload === '' && pixKeyValue && pixKeyType && storeName && storeCity && total > 0) {
      toast({
        variant: 'destructive',
        title: 'Erro na Geração do PIX',
        description: 'Não foi possível gerar o código PIX.',
      });
    }
  }, [isOpen, pixPayload, pixKeyValue, pixKeyType, storeName, storeCity, total]); // Removed toast from dependencies

  // Update QR code key when payload changes (but only if payload actually changed)
  useEffect(() => {
    if (pixPayload) {
      setQrCodeKey(prev => prev + 1);
    }
  }, [pixPayload]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCopyPayload = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      toast({
        title: 'Código PIX Copiado',
        description: 'O código PIX foi copiado para a área de transferência.',
      });
    }
  };

  if (!pixKeyType || !pixKeyValue) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pagamento PIX</DialogTitle>
            <DialogDescription>
              Configuração PIX não encontrada. Configure as chaves PIX nas configurações da loja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamento PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo ou copie o código PIX para efetuar o pagamento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total a Pagar:</span>
            <span className="text-lg">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-lg border shadow-sm">
              {pixPayload ? (
                <div key={qrCodeKey}>
                  <PixSVG
                    pixkey={pixKeyValue!}
                    merchant={storeName}
                    city={storeCity}
                    amount={total}
                    code={`VENDA-${Math.floor(total * 100)}`}
                    size={180}
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-gray-100 flex items-center justify-center text-center text-sm text-gray-500 rounded">
                  Gerando QR Code...
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Chave PIX: {pixKeyType === 'email' ? 'E-mail' :
                          pixKeyType === 'cpf' ? 'CPF' :
                          pixKeyType === 'cnpj' ? 'CNPJ' :
                          pixKeyType === 'telefone' ? 'Telefone' : 'Aleatória'}
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all bg-gray-50 p-2 rounded">
              {pixKeyValue}
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyPayload}
              disabled={!pixPayload}
              className="flex-1 sm:flex-none"
            >
              Copiar Código
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
          </div>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}