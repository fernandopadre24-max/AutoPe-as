'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calculator,
  Keyboard,
  MousePointer,
  DollarSign,
  Package,
  User,
  CreditCard,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

interface ActionControlsProps {
  onOpenCalculator: () => void;
  onOpenInstructions: () => void;
  onOpenCustomerSearch: () => void;
  onFinalizeSale: () => void;
  onCashPayment: () => void;
  isCartEmpty: boolean;
  isFinalizingSale: boolean;
  className?: string;
}

export function ActionControls({
  onOpenCalculator,
  onOpenInstructions,
  onOpenCustomerSearch,
  onFinalizeSale,
  onCashPayment,
  isCartEmpty,
  isFinalizingSale,
  className = ''
}: ActionControlsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Primeira coluna */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onOpenCalculator}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculadora
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onOpenInstructions}
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Instruções
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onOpenCustomerSearch}
            >
              <User className="h-4 w-4 mr-2" />
              Cliente
            </Button>
          </div>

          {/* Segunda coluna */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onCashPayment}
              disabled={isCartEmpty}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Dinheiro
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={isCartEmpty}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Cartão
            </Button>

            <Button
              variant="default"
              className="w-full justify-start"
              onClick={onFinalizeSale}
              disabled={isCartEmpty || isFinalizingSale}
            >
              {isFinalizingSale ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Finalizar Venda
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}