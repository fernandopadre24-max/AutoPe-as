'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Sale, Employee, Product, Customer } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronDown, ChevronRight, DollarSign, Hourglass, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  TooltipProvider,
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

type SalesReportProps = {
  sales: Sale[];
  employees: Employee[];
  products: Product[];
  customers: Customer[];
};

type ChartType = 'revenueByEmployee' | 'salesByEmployee' | 'revenueByCategory';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString); // Use new Date() for ISO strings
  return date.toLocaleDateString('pt-BR');
};

const formatPaymentMethod = (sale: Sale) => {
    if (sale.paymentMethod === 'Prazo') {
      return `${sale.termPaymentMethod} (Vence: ${formatDate(sale.dueDate)})`;
    }
     if (sale.paymentMethod === 'Parcelado' && sale.installments > 1) {
        return `Cartão em ${sale.installments}x`;
    }
     if (sale.paymentMethod === 'Cartão' && sale.installments > 1) {
        return `Cartão em ${sale.installments}x`;
    }
    return sale.paymentMethod;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];


export function SalesReport({
  sales,
  employees,
  products,
  customers
}: SalesReportProps) {
  const { toast } = useToast();
  const { confirmPayment } = useData();
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState('all');
  const [expandedEmployees, setExpandedEmployees] = React.useState<Set<string>>(new Set());
  const [chartType, setChartType] = React.useState<ChartType>('revenueByEmployee');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const handleConfirmPayment = (saleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    confirmPayment(saleId);
    toast({
        title: 'Pagamento Confirmado!',
        description: 'O status da venda foi atualizado para "Pago".',
    });
  };

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
  
    const filteredSales = React.useMemo(() => {
    let filtered = sales;

    if (dateRange?.from) {
        filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            const from = dateRange.from!;
            // Set time to 00:00:00 for the start date
            from.setHours(0, 0, 0, 0);
            if (dateRange.to) {
                const to = dateRange.to;
                // Set time to 23:59:59 for the end date
                to.setHours(23, 59, 59, 999);
                return saleDate >= from && saleDate <= to;
            }
            return saleDate >= from;
        });
    }

    if (selectedEmployeeId !== 'all') {
      filtered = filtered.filter((sale) => sale.employeeId === selectedEmployeeId);
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedEmployeeId, dateRange]);

  const groupedSales = React.useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const employee = employees.find(e => e.id === sale.employeeId);
      if (employee) {
        if (!acc[employee.id]) {
          acc[employee.id] = {
            employee: employee,
            sales: [],
            total: 0
          };
        }
        acc[employee.id].sales.push(sale);
        acc[employee.id].total += sale.total;
      }
      return acc;
    }, {} as Record<string, { employee: Employee; sales: Sale[]; total: number }>);
  }, [filteredSales, employees]);

  const employeeGroupOrder = React.useMemo(() => {
    return Object.values(groupedSales)
      .sort((a,b) => a.employee.firstName.localeCompare(b.employee.firstName))
      .map(group => group.employee.id);
  }, [groupedSales]);


  const chartData = React.useMemo(() => {
    const dataForChart = filteredSales;

    if (chartType === 'revenueByCategory') {
        const categoryMap = new Map<string, number>();
        dataForChart.forEach(sale => {
            if (sale.status === 'Pago') {
                sale.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product && product.category) {
                        const currentTotal = categoryMap.get(product.category) || 0;
                        categoryMap.set(product.category, currentTotal + (item.unitPrice * item.quantity - item.discount));
                    }
                });
            }
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }

    const salesMap = new Map<
      string,
      { name: string; totalRevenue: number; totalSales: number }
    >();
    employees.forEach((emp) => {
      salesMap.set(emp.id, { name: `${emp.firstName} ${emp.lastName}`, totalRevenue: 0, totalSales: 0 });
    });

    dataForChart.forEach((sale) => {
      const empData = salesMap.get(sale.employeeId);
      if (empData) {
        if (sale.status === 'Pago') {
            empData.totalRevenue += sale.total;
        }
        empData.totalSales += 1;
      }
    });

    return Array.from(salesMap.values());
  }, [filteredSales, employees, products, chartType]);

  const totalFilteredRevenue = React.useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  }, [filteredSales]);

  const grandTotalRevenue = React.useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  }, [filteredSales]);

  const totalRevenuePaid = React.useMemo(() => filteredSales.filter(s => s.status === 'Pago').reduce((sum, s) => sum + s.total, 0), [filteredSales]);
  const totalRevenuePending = React.useMemo(() => filteredSales.filter(s => s.status === 'Pendente').reduce((sum, s) => sum + s.total, 0), [filteredSales]);
  const totalSalesCount = filteredSales.length;

  const totalFilteredSales = filteredSales.length;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `(${employee.employeeCode}) ${employee.firstName} ${employee.lastName}`: 'N/A';
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}`: 'N/A';
  }

  const getHeaderColSpan = () => selectedEmployeeId === 'all' ? 5 : 4;

  const renderChart = () => {
    switch (chartType) {
        case 'revenueByCategory':
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )
        case 'salesByEmployee':
            return (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Nº de Vendas', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip />
                        <Bar dataKey="totalSales" fill="#82ca9d" name="Vendas" />
                    </BarChart>
                </ResponsiveContainer>
            )
        case 'revenueByEmployee':
        default:
            return (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="totalRevenue" fill="#8884d8" name="Receita (Paga)" />
                    </BarChart>
                </ResponsiveContainer>
            )
    }
  }

  const getChartTitle = () => {
    switch (chartType) {
        case 'revenueByCategory': return 'Receita por Categoria de Produto (Vendas Pagas)';
        case 'salesByEmployee': return 'Número de Vendas por Funcionário';
        case 'revenueByEmployee':
        default: return 'Desempenho por Funcionário (Vendas Pagas)';
    }
  }


  return (
    <div className="flex flex-col gap-8">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total (Período)</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(grandTotalRevenue)}</div>
            <p className="text-xs text-blue-100">Soma de todas as vendas no período</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Paga (Período)</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenuePaid)}</div>
            <p className="text-xs text-emerald-100">Total recebido no período</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente (Período)</CardTitle>
            <Hourglass className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenuePending)}</div>
            <p className="text-xs text-amber-100">Valores a receber no período</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas (Período)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-purple-100">Número de transações no período</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <CardTitle>{getChartTitle()}</CardTitle>
                <CardDescription>
                    Alterne entre as visualizações para analisar os dados de vendas.
                </CardDescription>
             </div>
            <RadioGroup defaultValue="revenueByEmployee" onValueChange={(value: ChartType) => setChartType(value)} className="flex flex-row gap-2 sm:gap-4 border p-2 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="revenueByEmployee" id="r1" />
                    <Label htmlFor="r1">Receita</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="salesByEmployee" id="r2" />
                    <Label htmlFor="r2">Vendas</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="revenueByCategory" id="r3" />
                    <Label htmlFor="r3">Categoria</Label>
                </div>
            </RadioGroup>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {renderChart()}
        </CardContent>
      </Card>
      <Card className="bg-yellow-100 font-mono text-black border-yellow-200 shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Vendas Detalhadas</CardTitle>
              <CardDescription className="text-gray-700">
                Exibindo {totalFilteredSales} vendas com um total de{' '}
                {formatCurrency(totalFilteredRevenue)}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                 <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                 <div className="w-64">
                    <Select
                        value={selectedEmployeeId}
                        onValueChange={setSelectedEmployeeId}
                    >
                        <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Filtrar por funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todos os Funcionários</SelectItem>
                        {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-gray-400 border-dashed hover:bg-yellow-100/50">
                {selectedEmployeeId === 'all' && <TableHead className="w-12 text-black"></TableHead>}
                <TableHead className="text-black">ID da Venda</TableHead>
                <TableHead className="text-black">Cliente</TableHead>
                <TableHead className="text-black">Itens</TableHead>
                <TableHead className="text-black">Data</TableHead>
                <TableHead className="text-black">Pagamento</TableHead>
                <TableHead className="text-black">Status</TableHead>
                <TableHead className="text-right text-black">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totalFilteredSales > 0 ? (
                selectedEmployeeId !== 'all' ? (
                    filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="text-xs border-b border-dashed border-gray-400/50 hover:bg-yellow-100/50">
                            <TableCell className="font-medium py-2 px-4">{sale.id}</TableCell>
                            <TableCell className="py-2 px-4">{getCustomerName(sale.customerId || '')}</TableCell>
                            <TableCell className="py-2 px-4">
                            <ul>
                                {sale.items.map((item, index) => {
                                const product = products.find((p) => p.id === item.productId);
                                return (
                                    <li
                                    key={index}
                                    className="text-gray-600"
                                    >
                                    {item.quantity}x {product?.name || 'Produto não encontrado'}
                                    </li>
                                );
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
                                      <UiTooltip>
                                        <TooltipTrigger asChild>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-100" onClick={(e) => handleConfirmPayment(sale.id, e)}>
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Confirmar Pagamento</p>
                                        </TooltipContent>
                                      </UiTooltip>
                                    </TooltipProvider>
                                )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right py-2 px-4">
                            {formatCurrency(sale.total)}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    employeeGroupOrder.map(employeeId => {
                        const group = groupedSales[employeeId];
                        const isExpanded = expandedEmployees.has(employeeId);
                        return (
                            <React.Fragment key={employeeId}>
                                <TableRow className="border-0 bg-yellow-50 hover:bg-yellow-100 cursor-pointer" onClick={() => toggleEmployeeExpansion(employeeId)}>
                                    <TableCell className="py-2 px-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-black hover:bg-yellow-200 hover:text-black">
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell colSpan={getHeaderColSpan() + 1} className="font-bold text-blue-900 py-2 px-4">
                                        {getEmployeeName(employeeId)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-blue-900 py-2 px-4">
                                        {formatCurrency(group.total)}
                                    </TableCell>
                                </TableRow>
                                {isExpanded && group.sales.map(sale => (
                                     <TableRow key={sale.id} className="text-xs border-b border-dashed border-gray-400/50 hover:bg-yellow-100/50">
                                        <TableCell className="py-2 px-4" />
                                        <TableCell className="font-medium py-2 px-4">{sale.id}</TableCell>
                                        <TableCell className="py-2 px-4">{getCustomerName(sale.customerId || '')}</TableCell>
                                        <TableCell className="py-2 px-4">
                                        <ul>
                                            {sale.items.map((item, index) => {
                                            const product = products.find((p) => p.id === item.productId);
                                            return (
                                                <li
                                                key={index}
                                                className="text-gray-600"
                                                >
                                                {item.quantity}x {product?.name || 'Produto não encontrado'}
                                                </li>
                                            );
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
                                                        <UiTooltip>
                                                            <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-100" onClick={(e) => handleConfirmPayment(sale.id, e)}>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                            <p>Confirmar Pagamento</p>
                                                            </TooltipContent>
                                                        </UiTooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-2 px-4">
                                        {formatCurrency(sale.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        )
                    })
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum resultado para o período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
             {totalFilteredSales > 0 && (
              <TableFooter>
                <TableRow className="border-t border-dashed border-gray-400 hover:bg-yellow-100 bg-yellow-50">
                  <TableCell colSpan={selectedEmployeeId === 'all' ? 7 : 6} className="text-right font-extrabold py-2 px-4 text-blue-900">Total no Período</TableCell>
                  <TableCell className="text-right font-extrabold py-2 px-4 text-blue-900">{formatCurrency(totalFilteredRevenue)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    