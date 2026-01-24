'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { DollarSign, Users, Package, ShoppingCart, ChevronDown, ChevronRight, CheckCircle, Hourglass } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/data';
import { useMemo, useState, useEffect } from 'react';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import React from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPaymentMethod = (sale: Sale) => {
    if (sale.paymentMethod === 'Prazo') {
        return `${sale.termPaymentMethod} (Vence: ${formatDate(sale.dueDate)})`;
    }
    if (sale.installments > 1) {
        return `${sale.paymentMethod} (${sale.installments}x)`;
    }
    return sale.paymentMethod;
}

export default function Home() {
  const { sales, products, customers, employees, confirmPayment } = useData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { toast } = useToast();
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
        const newSet = new Set(prev);
        if (newSet.has(employeeId)) {
            newSet.delete(employeeId);
        } else {
            newSet.add(employeeId);
        }
        return newSet;
    });
  }

  const handleConfirmPayment = (saleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    confirmPayment(saleId);
    toast({
        title: 'Pagamento Confirmado!',
        description: 'O status da venda foi atualizado para "Pago".',
    });
  };

  const recentSales = useMemo(() => mounted ? sales.slice(0, 10) : [], [sales, mounted]);
  
  const groupedSales = useMemo(() => {
    if (!mounted) return {};
    return recentSales.reduce((acc, sale) => {
        if (!acc[sale.employeeId]) {
            acc[sale.employeeId] = [];
        }
        acc[sale.employeeId].push(sale);
        return acc;
    }, {} as Record<string, Sale[]>);
  }, [recentSales, mounted]);

  const totalRevenue = useMemo(() => mounted ? sales.filter(s => s.status === 'Pago').reduce((acc, sale) => acc + sale.total, 0) : 0, [sales, mounted]);
  const pendingAmount = useMemo(() => mounted ? sales.filter(s => s.status === 'Pendente').reduce((acc, sale) => acc + sale.total, 0) : 0, [sales, mounted]);
  const recentSalesTotal = useMemo(() => mounted ? recentSales.reduce((acc, sale) => acc + sale.total, 0) : 0, [recentSales, mounted]);
  const totalProducts = useMemo(() => mounted ? products.reduce((acc, product) => acc + product.stock, 0) : 0, [products, mounted]);
  const pendingCount = useMemo(() => mounted ? sales.filter(s => s.status === 'Pendente').length : 0, [sales, mounted]);
  const recentCount = useMemo(() => mounted ? recentSales.length : 0, [recentSales, mounted]);
  const todaySalesCount = useMemo(() => mounted ? sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length : 0, [sales, mounted]);

  let lastEmployeeId: string | null = null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Painel" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-emerald-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mounted ? totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-emerald-100">+20.1% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Pendentes</CardTitle>
            <Hourglass className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mounted ? pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-amber-100">{pendingCount} vendas pendentes</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mounted ? recentSalesTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-blue-100">{recentCount} vendas recentes</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{todaySalesCount}</div>
            <p className="text-xs text-purple-100">+19% em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-orange-100">2 abaixo do mínimo</p>
          </CardContent>
        </Card>
      </div>
       <Card className="bg-yellow-100 font-mono text-black border-yellow-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow className="border-b-gray-400 border-dashed hover:bg-yellow-100/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-black">Cliente</TableHead>
                <TableHead className="text-black">Itens</TableHead>
                <TableHead className="text-black">Data</TableHead>
                <TableHead className="text-black">Pagamento</TableHead>
                <TableHead className="text-black">Status</TableHead>
                <TableHead className="text-right text-black">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedSales).map(([employeeId, employeeSales]) => {
                const employee = employees.find(e => e.id === employeeId);
                const isExpanded = expandedEmployees.has(employeeId);
                const employeeSubtotal = employeeSales.reduce((acc, sale) => acc + sale.total, 0);

                return (
                  <React.Fragment key={employeeId}>
                     <TableRow 
                        className="border-0 bg-yellow-50 hover:bg-yellow-100 cursor-pointer" 
                        onClick={() => toggleEmployeeExpansion(employeeId)}
                    >
                        <TableCell className="py-2 px-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:bg-yellow-200 hover:text-black">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </TableCell>
                        <TableCell colSpan={5} className="font-bold text-blue-900 py-2 px-4">
                            {employee ? `(${employee.employeeCode}) ${employee.firstName} ${employee.lastName}` : 'Funcionário Desconhecido'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-900 py-2 px-4">{formatCurrency(employeeSubtotal)}</TableCell>
                    </TableRow>
                    {isExpanded && employeeSales.map((sale) => {
                        const customer = customers.find(c => c.id === sale.customerId);
                        return (
                            <TableRow key={sale.id} className="text-xs border-b border-dashed border-gray-400/50 hover:bg-yellow-100/50">
                            <TableCell className="py-2 px-4"></TableCell>
                            <TableCell className="py-2 px-4">
                                <div className="font-medium">{customer ? `${customer.firstName} ${customer.lastName}`: 'N/A'}</div>
                                {customer?.email && <div className="text-gray-600">{customer.email}</div>}
                            </TableCell>
                            <TableCell className="py-2 px-4">
                                <ul className="list-disc list-inside">
                                {sale.items.map((item, index) => {
                                    const product = products.find(p => p.id === item.productId);
                                    return <li key={index}>{item.quantity}x {product?.name || 'Produto desconhecido'} ({formatCurrency(item.unitPrice)})</li>
                                })}
                                </ul>
                            </TableCell>
                            <TableCell className="py-2 px-4">{formatDate(sale.date)}</TableCell>
                            <TableCell className="py-2 px-4">
                              <Badge variant="secondary" className="bg-gray-200 text-black">{formatPaymentMethod(sale)}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                <Badge className={cn({
                                    'bg-green-200 text-green-800': sale.status === 'Pago',
                                    'bg-red-200 text-red-800': sale.status === 'Cancelado',
                                    'bg-yellow-200 text-yellow-800': sale.status === 'Pendente',
                                })}>{sale.status}</Badge>
                                {sale.status === 'Pendente' && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-100" onClick={(e) => handleConfirmPayment(sale.id, e)}>
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Confirmar Pagamento</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-2 px-4">{sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            </TableRow>
                        )
                    })}
                  </React.Fragment>
                )
              })}
              {!mounted || recentCount === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Nenhuma venda recente.</TableCell>
                </TableRow>
              )}
            </TableBody>
            {mounted && recentCount > 0 && (
              <TableFooter>
                <TableRow className="border-t border-dashed border-gray-400 hover:bg-yellow-100">
                  <TableCell colSpan={6} className="text-right font-bold py-2 px-4">Total Geral</TableCell>
                  <TableCell className="text-right font-bold py-2 px-4">{formatCurrency(recentSalesTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    