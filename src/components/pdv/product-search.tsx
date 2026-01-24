'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/lib/types';
import { Search, Package, DollarSign, Loader2 } from 'lucide-react';

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductSearch({
  products,
  onProductSelect,
  isLoading = false,
  className = ''
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 10); // Mostrar primeiros 10 quando não há busca

    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20); // Limitar a 20 resultados
  }, [products, searchTerm]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome, SKU ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Lista de produtos */}
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => onProductSelect(product)}
                  disabled={product.stock <= 0}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {product.sku} • Estoque: {product.stock}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        {formatCurrency(product.salePrice)}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}

              {filteredProducts.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}