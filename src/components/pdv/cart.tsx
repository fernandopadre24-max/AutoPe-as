'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CartItem } from '@/hooks/use-cart';
import { X, Minus, Plus, DollarSign } from 'lucide-react';

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onRemoveItem: (productId: string) => void;
  className?: string;
}

export function Cart({
  cartItems,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  className = ''
}: CartProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getItemSubtotal = (item: CartItem) => {
    return item.product.salePrice * item.quantity;
  };

  const getItemTotal = (item: CartItem) => {
    return getItemSubtotal(item) - item.discount;
  };

  if (cartItems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-2">🛒</div>
            <p>Carrinho vazio</p>
            <p className="text-sm">Adicione produtos para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Carrinho</span>
          <span className="text-sm font-normal text-muted-foreground">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="border rounded-lg p-3 space-y-3">
                {/* Cabeçalho do item */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.product.sku} • {formatCurrency(item.product.salePrice)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.product.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Controles de quantidade */}
                <div className="flex items-center space-x-2">
                  <Label className="text-xs">Qtd:</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      onUpdateQuantity(item.product.id, qty);
                    }}
                    className="w-16 h-7 text-center text-xs"
                    min="1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Desconto */}
                <div className="flex items-center space-x-2">
                  <Label className="text-xs">Desc:</Label>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="number"
                      value={item.discount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        onUpdateDiscount(item.product.id, discount);
                      }}
                      className="pl-6 h-7 text-xs"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {/* Totais do item */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Subtotal: {formatCurrency(getItemSubtotal(item))}
                  </div>
                  <div className="font-medium text-sm">
                    {formatCurrency(getItemTotal(item))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Resumo do carrinho */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span>Itens:</span>
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Desconto:</span>
            <span className="text-red-600">
              -{formatCurrency(cartItems.reduce((sum, item) => sum + item.discount, 0))}
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span>
              {formatCurrency(
                cartItems.reduce((sum, item) => sum + getItemTotal(item), 0)
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}