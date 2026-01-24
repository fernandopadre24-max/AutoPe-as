'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, Customer, Employee, Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CustomerSearchDialog } from './components/customer-search-dialog';
import {
  FinalizeSaleDialog,
  type FinalizeSaleDetails,
} from './components/finalize-sale-dialog';
import { EmployeeLoginDialog } from './components/employee-login-dialog';
import { useData } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { CashPaymentDialog } from './components/cash-payment-dialog';
import { PixPaymentDialog } from '@/components/pix-payment-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calculator, Keyboard, MousePointer, DollarSign, Package, User, CreditCard, X, Search, ShoppingCart, Loader2, CheckCircle } from 'lucide-react';
import { CalculatorModal } from './components/calculator-modal';
import { InstructionsModal } from './components/instructions-modal';
import { NFeEmissionDialog } from './components/nfe-emission-dialog';

type CartItem = {
  product: Product;
  quantity: number;
  unit: string;
  discount: number;
};

const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function PdvPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { products: allProductsData, customers: allCustomersData, employees: allEmployeesData, isLoading: isDataLoading, config, addSale, authenticatedEmployee, setAuthenticatedEmployee } = useData();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastSaleItems, setLastSaleItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<string>('UN');
  const [lastAction, setLastAction] = useState('Caixa Livre');
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isFinalizeSaleDialogOpen, setIsFinalizeSaleDialogOpen] =
    useState(false);
  const [isCashPaymentDialogOpen, setIsCashPaymentDialogOpen] = useState(false);
  const [isPixPaymentDialogOpen, setIsPixPaymentDialogOpen] = useState(false);
  const [saleType, setSaleType] = useState<'prazo' | 'parcelado'>('prazo');
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isNFeDialogOpen, setIsNFeDialogOpen] = useState(false);
  const [lastNFeResult, setLastNFeResult] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    if (searchTerm && allProductsData) {
      setIsSearchingProduct(true);
      const filtered = allProductsData.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setIsSearchingProduct(false);
      return filtered;
    }
    return [];
  }, [searchTerm, allProductsData]);

  const handleAddItemToCart = async (product: Product) => {
    if (!product) return;

    setIsAddingToCart(true);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const existingItem = cartItems.find((item) => item.product.id === product.id);

      if (existingItem) {
        setCartItems(
          cartItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        setCartItems([...cartItems, { product, quantity, unit, discount: 0 }]);
      }
      
      setLastAction(`✓ Adicionado: ${quantity}x ${product.name}`);
      setSearchTerm('');
      setSelectedItem(null);
      setQuantity(1);
      setUnit('UN');
      
      toast({
        title: 'Produto Adicionado',
        description: `${product.name} adicionado ao carrinho.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Adicionar',
        description: 'Não foi possível adicionar o produto ao carrinho.',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSelectSearchedItem = (product: Product) => {
    setSelectedItem(product);
    setSearchTerm(product.name);
    if (product.size) {
      setUnit(product.size);
    }
    setLastAction(`Produto selecionado: ${product.name}`);
    document.getElementById('item-search')?.focus();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authenticatedEmployee');
    setAuthenticatedEmployee(null);
    router.push('/');
  };

  const restoreLastSale = useCallback(() => {
    if (lastSaleItems.length === 0) {
      toast({
        title: 'Nenhuma Venda Recente',
        description: 'Não há uma última venda para restaurar.',
      });
      return;
    }
    setCartItems([...lastSaleItems]);
    setLastAction('Última venda restaurada.');
    toast({
      title: 'Última Venda Restaurada',
      description: 'Os itens da última venda foram adicionados ao carrinho.',
    });
  }, [lastSaleItems, toast]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedItem) {
      handleAddItemToCart(selectedItem);
    }
    if (e.key === 'Escape') {
      handleLogout();
    }
  };

  const handleOpenFinalizeDialog = (type: 'prazo' | 'parcelado') => {
    if (cartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrinho Vazio',
        description: 'Adicione itens antes de finalizar a venda.',
      });
      return;
    }
    setSaleType(type);
    setIsFinalizeSaleDialogOpen(true);
  };
  
  const handleSimplePayment = (paymentMethod: 'PIX' | 'Dinheiro') => {
      if (cartItems.length === 0) {
          toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione itens antes de finalizar a venda.' });
          return;
      }
      if (paymentMethod === 'Dinheiro') {
        setIsCashPaymentDialogOpen(true);
        return;
      }
      if (paymentMethod === 'PIX') {
        setIsPixPaymentDialogOpen(true);
        return;
      }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!authenticatedEmployee) return;

      const key = e.key.toLowerCase();

      if (key === 'f9') {
        e.preventDefault();
        setIsCustomerDialogOpen(true);
      }
      if (key === 'f11') {
        e.preventDefault();
        restoreLastSale();
      }
      if (key === 'f1') {
        e.preventDefault();
        handleSimplePayment('Dinheiro');
      }
      if (key === 'f2') {
        e.preventDefault();
        cancelSale();
      }
      if (key === 'f3') {
          e.preventDefault();
          handleSimplePayment('PIX');
      }
      if (key === 'f4') {
        e.preventDefault();
        handleOpenFinalizeDialog('prazo');
      }
      if (key === 'f5') {
        e.preventDefault();
        handleOpenFinalizeDialog('parcelado');
      }
      if (e.key === 'Escape') {
        handleLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (!authenticatedEmployee) {
      setLastAction(`Caixa livre.`);
    } else {
       setLastAction(`Operador: ${authenticatedEmployee.firstName}. Caixa livre.`);
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [authenticatedEmployee, restoreLastSale]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) =>
        acc + (item.product.salePrice * item.quantity - item.discount),
      0
    );
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const finishSale = async (
    details: FinalizeSaleDetails
  ) => {
    if (cartItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Carrinho Vazio',
        description: 'Adicione itens antes de finalizar a venda.',
      });
      return;
    }

    setLastSaleItems([...cartItems]);

    const saleStatus: Sale['status'] = details.paymentMethod === 'Prazo' || details.paymentMethod === 'Parcelado' ? 'Pendente' : 'Pago';

    const saleData: Omit<Sale, 'id'> = {
      employeeId: authenticatedEmployee!.id,
      customerId: details.customer.id,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
        discount: item.discount,
      })),
      total: subtotal,
      paymentMethod: details.paymentMethod,
      installments: details.installments,
      date: new Date().toISOString(),
      dueDate: details.dueDate,
      termPaymentMethod: details.termPaymentMethod,
      status: saleStatus,
      customerCPF: details.customerCPF,
      cardNumber: details.cardNumber,
    };

    try {
      await addSale(saleData);

      let description = `Total de ${formatCurrency(
          subtotal
      )} em ${totalItems} itens.`;

      description += ` Cliente: ${details.customer.firstName} ${details.customer.lastName}.`;
      description += ` Pagamento: ${details.paymentMethod}${details.installments > 1 ? ` em ${details.installments}x` : ''}.`;

      // Perguntar sobre NF-e após venda finalizada com sucesso
      setTimeout(() => {
        toast({
          title: 'Deseja emitir NF-e?',
          description: 'Clique em "Emitir NF-e" para gerar a nota fiscal desta venda.',
          action: (
            <Button 
              size="sm" 
              onClick={() => setIsNFeDialogOpen(true)}
              className="ml-2"
            >
              Emitir NF-e
            </Button>
          ),
        });
      }, 1000);

      toast({
          title: 'Venda Finalizada!',
          description: description,
      });

      resetSaleState();
      setLastAction('Venda finalizada. Caixa livre.');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Venda',
        description: 'Não foi possível finalizar a venda. Tente novamente.',
      });
    }
  };

  const resetSaleState = () => {
    setCartItems([]);
    setSelectedCustomer(null);
  };

  const cancelSale = () => {
    if (cartItems.length === 0) {
      setLastAction('Nenhuma venda para cancelar. Caixa livre.');
      return;
    }
    resetSaleState();
    setLastAction('Venda cancelada. Caixa livre.');
    toast({
      variant: 'destructive',
      title: 'Venda Cancelada',
    });
  };

  const showInfoToast = (title: string, description: string) => {
    toast({
      title: title,
      description: description,
    });
  };

  const handleLogin = (employee: Employee) => {
    setAuthenticatedEmployee(employee);
    sessionStorage.setItem('authenticatedEmployee', JSON.stringify(employee));
    setLastAction(`Operador: ${employee.firstName}. Caixa livre.`);
    toast({
      title: `Bem-vindo, ${employee.firstName}!`,
      description: 'Login efetuado com sucesso.',
    });
  };

  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <p>Carregando dados do PDV...</p>
                <Skeleton className="h-4 w-64" />
             </div>
        </div>
    );
  }

  if (!authenticatedEmployee) {
    return (
      <EmployeeLoginDialog
        isOpen={true}
        employees={allEmployeesData || []}
        onLogin={handleLogin}
        onCancel={() => router.push('/')}
      />
    );
  }

  return (
    <>
      <CustomerSearchDialog
        isOpen={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          toast({
            title: 'Cliente Selecionado',
            description: `${customer.firstName} ${customer.lastName} foi associado à venda.`,
          });
          setIsCustomerDialogOpen(false);
        }}
        customers={allCustomersData || []}
      />
      <FinalizeSaleDialog
        isOpen={isFinalizeSaleDialogOpen}
        onOpenChange={setIsFinalizeSaleDialogOpen}
        subtotal={subtotal}
        customers={allCustomersData || []}
        saleType={saleType}
        onConfirm={async (details) => {
          await finishSale(details);
          setIsFinalizeSaleDialogOpen(false);
        }}
      />
      <CashPaymentDialog
        isOpen={isCashPaymentDialogOpen}
        onOpenChange={setIsCashPaymentDialogOpen}
        total={subtotal}
        onConfirm={async (amountPaid) => {
          const defaultCustomer = allCustomersData.find(c => c.email === 'consumidor@final.com') ||
                                  { id: 'default', firstName: 'Consumidor', lastName: 'Final', email: 'consumidor@final.com', phoneNumber: '', address: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
          await finishSale({
              customer: defaultCustomer,
              installments: 1,
              paymentMethod: 'Dinheiro',
          });
          setIsCashPaymentDialogOpen(false);
           toast({
            title: 'Venda em Dinheiro',
            description: `Valor pago: ${formatCurrency(amountPaid)}. Troco: ${formatCurrency(amountPaid - subtotal)}.`,
          });
        }}
        />
        <PixPaymentDialog
          isOpen={isPixPaymentDialogOpen}
          onOpenChange={setIsPixPaymentDialogOpen}
          total={subtotal}
          pixKeyType={config.pixKeyType}
          pixKeyValue={config.pixKeyValue}
          storeName={config.storeName}
          storeCity={config.address?.split(',')[1]?.trim() || 'Cidade'}
          onConfirm={async () => {
            const defaultCustomer = allCustomersData.find(c => c.email === 'consumidor@final.com') ||
                                    { id: 'default', firstName: 'Consumidor', lastName: 'Final', email: 'consumidor@final.com', phoneNumber: '', address: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
            await finishSale({
                customer: defaultCustomer,
                installments: 1,
                paymentMethod: 'PIX',
            });
            setIsPixPaymentDialogOpen(false);
          }}
        />
      <div className="flex h-screen w-full flex-col bg-slate-100 p-2 font-mono text-sm">
        {/* Top Bar */}
        <div className="relative flex items-center justify-between gap-4 rounded-t-lg bg-blue-800 p-2 text-white">
          <div className="flex flex-1 items-center gap-2">
            <Label htmlFor="item-search">
              F6 - DESCRIÇÃO/CÓDIGO ITEM OU CÓDIGO DE BARRAS
            </Label>
            <div className="relative flex-1">
              <Input
                id="item-search"
                className="flex-1 bg-white text-black pr-10"
                placeholder="Digite para buscar um produto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedItem(null);
                }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {isSearchingProduct && (
                <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
              )}
              {!isSearchingProduct && searchTerm && filteredProducts.length > 0 && (
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="quantity">QUANTIDADE</Label>
            <Input
              id="quantity"
              type="number"
              className="w-20 bg-white text-black"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              min="1"
            />
            <Select
              onValueChange={(value) =>
                setUnit(value)
              }
              value={unit}
            >
              <SelectTrigger className="w-24 bg-white text-black">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UN">UN</SelectItem>
                <SelectItem value="CX">CX</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
                <SelectItem value="JG">JG</SelectItem>
                <SelectItem value="KT">KT</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="KG">KG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 z-10 w-1/2 bg-white border rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-blue-50 cursor-pointer text-black border-b border-gray-100 transition-colors duration-150 flex items-center justify-between group"
                  onClick={() => handleSelectSearchedItem(product)}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku} | Estoque: {product.stock || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(product.salePrice)}</div>
                    <div className="text-xs text-gray-400">
                        {product.category && `• ${product.category}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-2 overflow-hidden">
          {/* Left Panel - Receipt */}
          <div className="flex w-1/2 flex-col">
            <div className="flex-1 bg-yellow-100 p-2 font-mono text-black">
              <div className="text-center font-bold">
                  <p>{config.storeName}</p>
              </div>
              <p>Endereço: {config.address}</p>
              <p>CNPJ: {config.cnpj}</p>
              <p>
                {currentDateTime
                  ? currentDateTime.toLocaleString('pt-BR')
                  : '...'}
              </p>
              <div className="py-1 text-center font-bold border-t border-b border-dashed border-gray-400 my-1">
                <p>---- CUPOM NÃO FISCAL ----</p>
              </div>
              {selectedCustomer && <p className="text-center font-bold">CLIENTE: {selectedCustomer.firstName} {selectedCustomer.lastName}</p>}
              <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-2 border-b border-dashed border-gray-400 pb-1">
                  <span>ITEM</span>
                  <span>CÓDIGO</span>
                  <span>DESCRICAO</span>
                  <span className="text-center">QTD</span>
                  <span className="text-right">VL ITEM</span>
                </div>
              <ScrollArea className="h-[calc(100vh_-_450px)]">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mb-2" />
                    <p className="text-sm">Carrinho vazio</p>
                    <p className="text-xs">Adicione produtos para iniciar a venda</p>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div key={item.product.id} className="py-2 border-b border-dashed border-gray-200 hover:bg-yellow-50 transition-colors duration-150">
                      <div className="grid grid-cols-[auto_auto_1fr_auto] gap-x-2 items-center">
                          <span className="font-mono text-xs bg-blue-100 px-1 rounded">{(index + 1).toString().padStart(3, '0')}</span>
                          <span className="font-mono text-xs text-gray-600">{item.product.sku}</span>
                          <span className="truncate font-medium">{item.product.name}</span>
                          <span className="text-right font-bold">{formatCurrency(item.product.salePrice * item.quantity - item.discount)}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] gap-x-2 mt-1">
                        <span className="pl-16 text-xs text-gray-600">
                          {item.quantity}{item.unit} X {formatCurrency(item.product.salePrice)}
                        </span>
                        <span className="text-right font-bold text-green-600 text-sm">
                          SUBTOTAL {formatCurrency(item.product.salePrice * item.quantity - item.discount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
            <div className={`p-2 text-center font-bold transition-all duration-300 ${
              lastAction.includes('✓') ? 'bg-green-600 text-white' : 
              lastAction.includes('cancel') || lastAction.includes('erro') ? 'bg-red-600 text-white' : 
              'bg-blue-800 text-white'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {isAddingToCart && <Loader2 className="h-4 w-4 animate-spin" />}
                <p>{lastAction}</p>
              </div>
            </div>
            <div className="flex justify-between bg-blue-700 p-2 text-white">
              <span>
                Nº. DE ITENS: {cartItems.length} | QUANTIDADES: {totalQuantity}
              </span>
              <div className="flex gap-4">
                <Button
                  size="sm"
                  className="bg-blue-500 text-white"
                  onClick={() => setIsCustomerDialogOpen(true)}
                >
                  CLIENTES - F9
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-500 text-white"
                  onClick={restoreLastSale}
                >
                  ULT. VENDA - F11
                </Button>
              </div>
            </div>
            <div className="flex justify-between bg-blue-700 p-2 text-white">
              <Button
                size="sm"
                className="bg-blue-500 text-white"
                onClick={() =>
                  showInfoToast('Mais Funções', 'Função não implementada.')
                }
              >
                MAIS FUNÇÕES
              </Button>
              <Button
                size="sm"
                className="bg-blue-500 text-white"
                onClick={() => setIsInstructionsModalOpen(true)}
              >
                INSTRUÇÕES
              </Button>
               <Button 
                 size="sm" 
                 className="bg-blue-500 text-white"
                 onClick={() => setIsCalculatorModalOpen(true)}
               >
                  CALCULADORA - F12
                </Button>
            </div>
          </div>

          {/* Middle Panel - Totals */}
          <div className="flex w-1/4 flex-col justify-between bg-blue-700 p-4 text-white">
            <div className="space-y-3">
              <InfoBox
                label="VALOR UNITÁRIO:"
                value={formatCurrency(selectedItem?.salePrice || 0)}
              />
              <InfoBox 
                label="QUANTIDADE:" 
                value={`${isAddingToCart ? '...' : quantity} ${unit}`} 
              />
              <InfoBox
                label="SUBTOTAL ITEM:"
                value={formatCurrency(
                  selectedItem ? selectedItem.salePrice * quantity : 0
                )}
              />
              <InfoBox
                label="CÓDIGO BARRAS:"
                value={selectedItem?.sku || '---'}
                smallText
              />
              <InfoBox
                label="CÓDIGO CADASTRO:"
                value={selectedItem?.id?.slice(-8) || '---'}
                smallText
              />
              {selectedItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-blue-700 font-medium">Produto Selecionado</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Card className={`${cartItems.length > 0 ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gray-400'} text-white transition-all duration-300`}>
                <CardHeader className="p-3 text-center">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    VALOR TOTAL DA VENDA
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-3">
                  <p className="text-4xl font-bold">
                    {formatCurrency(subtotal)}
                  </p>
                  {cartItems.length > 0 && (
                    <p className="text-xs mt-1 text-blue-100">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {cartItems.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center mt-3">
                  <p className="text-xs text-yellow-700">
                    <Search className="h-3 w-3 inline mr-1" />
                    Busque produtos para adicionar ao carrinho
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Actions */}
          <div className="flex w-1/4 flex-col justify-between bg-gradient-to-b from-blue-50 to-blue-100 p-4 border-l-2 border-blue-200">
            <div>
              <div className="mb-2 rounded-lg border-2 border-blue-500 bg-gradient-to-r from-blue-100 to-blue-50 p-3 shadow-md">
                <p className="font-bold text-blue-900 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  PDV FASHION STORE
                </p>
              <Input
                className="mt-1 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900 placeholder-blue-400"
                placeholder="Vendedor(a)"
                value={`${authenticatedEmployee.firstName} ${authenticatedEmployee.lastName}`}
                readOnly
              />
              </div>
              <div className="space-y-2">
                <ActionButton 
                  onClick={() => handleSimplePayment('Dinheiro')}
                  disabled={cartItems.length === 0}
                  variant="primary"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  PAGAR COM DINHEIRO - F1
                </ActionButton>
                <ActionButton 
                  onClick={cancelSale}
                  disabled={cartItems.length === 0}
                  variant="danger"
                >
                  <X className="mr-2 h-4 w-4" />
                  CANCELAR VENDA - F2
                </ActionButton>
                 <ActionButton 
                  onClick={() => handleSimplePayment('PIX')}
                  disabled={cartItems.length === 0}
                  variant="secondary"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  PAGAR COM PIX - F3
                </ActionButton>
                <ActionButton 
                  onClick={() => handleOpenFinalizeDialog('prazo')}
                  disabled={cartItems.length === 0}
                  variant="primary"
                >
                  <User className="mr-2 h-4 w-4" />
                  VENDER A PRAZO - F4
                </ActionButton>
                <ActionButton
                  onClick={() => handleOpenFinalizeDialog('parcelado')}
                  disabled={cartItems.length === 0}
                  variant="primary"
                >
                  <Package className="mr-2 h-4 w-4" />
                  VENDER PARCELADO - F5
                </ActionButton>
                <ActionButton onClick={handleLogout} variant="danger">
                  SAIR DO P.D.V - ESC
                </ActionButton>
              </div>
            </div>
            <div className="space-y-2">
              <InfoBox
                label="OPERADOR"
                value={`${authenticatedEmployee.firstName} ${authenticatedEmployee.lastName}`.toUpperCase()}
                smallText
                center
              />
              <InfoBox
                label="DATA DA VENDA"
                value={
                  currentDateTime
                    ? currentDateTime.toLocaleDateString('pt-BR')
                    : '...'
                }
                smallText
                center
              />
              <InfoBox
                label="HORA ATUAL"
                value={
                  currentDateTime
                    ? currentDateTime.toLocaleTimeString('pt-BR')
                    : '...'
                }
                smallText
                center
              />
            </div>
          </div>
        </div>
      </div>
      
      <InstructionsModal 
        isOpen={isInstructionsModalOpen} 
        onClose={() => setIsInstructionsModalOpen(false)} 
      />
      <CalculatorModal 
        isOpen={isCalculatorModalOpen} 
        onClose={() => setIsCalculatorModalOpen(false)} 
      />
      <NFeEmissionDialog
        isOpen={isNFeDialogOpen}
        onOpenChange={setIsNFeDialogOpen}
        cartItems={lastSaleItems}
        total={lastSaleItems.reduce((acc, item) => acc + (item.product.salePrice * item.quantity - item.discount), 0)}
        customer={null}
        paymentMethod="Dinheiro"
        onSaleComplete={(nfeResult) => {
          setLastNFeResult(nfeResult);
          toast({
            title: 'NF-e Emitida com Sucesso!',
            description: `Chave: ${nfeResult.chave?.slice(0, 20)}...`,
          });
        }}
      />
    </>
  );
}

function InfoBox({
  label,
  value,
  smallText = false,
  center = false,
}: {
  label: string;
  value: string;
  smallText?: boolean;
  center?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border-2 border-blue-200 bg-white p-2 text-blue-900 shadow-sm ${
        center ? 'text-center' : ''
      }`}
    >
      <p className="text-xs text-blue-700 font-medium">{label}</p>
      <p className={`${smallText ? 'text-lg' : 'text-3xl'} font-bold`}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const baseClasses = "w-full justify-center py-3 text-base text-white transition-all duration-200 shadow-sm hover:shadow-md";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:text-blue-100",
    secondary: "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:text-emerald-100", 
    danger: "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:text-rose-100"
  };
  
  return (
    <Button
      className={`${baseClasses} ${variantClasses[variant]} rounded-lg`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
