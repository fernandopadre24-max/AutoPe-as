'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Eye,
  Download,
  Search,
  Settings,
  Info,
  Loader2
} from 'lucide-react';
import type { Product, Customer } from '@/lib/types';
import { nfeEmissionService } from '@/lib/nfe/service';
import { nfeConfigService } from '@/lib/nfe/config';
import type { EmissaoNFEDTO, NFeEmissionResult } from '@/lib/nfe';

// Tipo local para CartItem
interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  discount: number;
}

interface NFeEmissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  total: number;
  customer: Customer | null;
  paymentMethod: string;
  onSaleComplete?: (nfeData: NFeEmissionResult) => void;
}

const CODIGOS_NCM_POPULARES = [
  { codigo: '61000000', descricao: 'Vestuário e seus acessórios' },
  { codigo: '62000000', descricao: 'Vestuário, exceto malhas' },
  { codigo: '64000000', descricao: 'Calçados e polainas' },
  { codigo: '99999999', descricao: 'Outros (não especificados)' },
];

const CODIGOS_CFOP_VENDA = [
  { codigo: '5102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros' },
  { codigo: '5101', descricao: 'Venda de produção do estabelecimento' },
  { codigo: '5111', descricao: 'Venda de produção do estabelecimento em operação com produtos sujeitos ao regime de substituição tributária' },
];

export function NFeEmissionDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems, 
  total, 
  customer, 
  paymentMethod,
  onSaleComplete 
}: NFeEmissionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [emissaoData, setEmissaoData] = useState<EmissaoNFEDTO | null>(null);
  const [result, setResult] = useState<NFeEmissionResult | null>(null);
  
  // Limpar estado quando fechar
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setCurrentTab('dados');
    }
  }, [isOpen]);
  const [currentTab, setCurrentTab] = useState('dados');

  // Inicializar dados de emissão quando o modal abrir
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      const dadosBasicos = {
        itens: cartItems,
        total,
        customer,
        paymentMethod,
      };

      try {
        const dto = nfeConverterService.converterVendaParaEmissao(dadosBasicos);
        setEmissaoData(dto);
      } catch (error) {
        console.error('Erro ao converter dados:', error);
        toast({
          variant: 'destructive',
          title: 'Erro na Conversão',
          description: 'Não foi possível converter os dados para NF-e',
        });
      }
    }
  }, [isOpen, cartItems, total, customer, paymentMethod]);

  const handleEmit = async () => {
    if (!emissaoData) return;

    setIsLoading(true);
    setResult(null);

    try {
      const dadosVenda = {
        itens: cartItems,
        total,
        customer,
        paymentMethod,
      };

      const resultado = await nfeEmissionService.emitirNFe(dadosVenda);
      setResult(resultado);

      if (resultado.success) {
        toast({
          title: 'NF-e Emitida com Sucesso!',
          description: `Número: ${resultado.numero} | Protocolo: ${resultado.protocolo}`,
        });

        // Chamar callback se fornecido
        if (onSaleComplete) {
          onSaleComplete(resultado);
        }

        // Mudar para tab de resultado
        setCurrentTab('resultado');
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na Emissão',
          description: resultado.erros?.join(', ') || 'Erro desconhecido',
        });
      }
    } catch (error) {
      console.error('Erro na emissão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Emissão',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduto = (index: number, field: string, value: any) => {
    if (!emissaoData) return;

    const novosProdutos = [...emissaoData.produtos];
    const produto = novosProdutos[index];

    if (field.startsWith('fiscal.')) {
      const fiscalField = field.replace('fiscal.', '');
      novosProdutos[index] = {
        ...produto,
        fiscal: {
          ...produto.fiscal,
          [fiscalField]: value,
        },
      };
    } else {
      novosProdutos[index] = {
        ...produto,
        produto: {
          ...produto.produto,
          [field]: value,
        },
      };
    }

    setEmissaoData({
      ...emissaoData,
      produtos: novosProdutos,
    });
  };

  const updateDados = (field: string, value: any) => {
    if (!emissaoData) return;

    setEmissaoData({
      ...emissaoData,
      [field]: value,
    });
  };

  const handleClose = () => {
    if (result?.success && onSaleComplete) {
      onOpenChange(false);
      return;
    }

    if (!isLoading) {
      onOpenChange(false);
      setTimeout(() => {
        setEmissaoData(null);
        setResult(null);
        setCurrentTab('dados');
      }, 300);
    }
  };

  const formatCurrency = (value: number | string | undefined | null) => {
    if (!value) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (!emissaoData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregando dados...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emissão de Nota Fiscal Eletrônica
          </DialogTitle>
          <DialogDescription>
            Revise os dados antes de emitir a NF-e
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados da NF-e</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="preview">Prévia</TabsTrigger>
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Gerais</CardTitle>
                  <CardDescription>Informações básicas da NF-e</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="naturezaOperacao">Natureza da Operação</Label>
                    <Input
                      id="naturezaOperacao"
                      value={emissaoData.naturezaOperacao}
                      onChange={(e) => updateDados('naturezaOperacao', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numeroNota">Número da Nota</Label>
                    <Input
                      id="numeroNota"
                      type="number"
                      value={emissaoData.numeroNota}
                      onChange={(e) => updateDados('numeroNota', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serie">Série</Label>
                    <Input
                      id="serie"
                      value={emissaoData.serie}
                      onChange={(e) => updateDados('serie', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="modalidadeFrete">Modalidade do Frete</Label>
                    <Select
                      value={emissaoData.modalidadeFrete.toString()}
                      onValueChange={(value) => updateDados('modalidadeFrete', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Por conta do emitente</SelectItem>
                        <SelectItem value="1">Por conta do destinatário</SelectItem>
                        <SelectItem value="2">Por conta de terceiros</SelectItem>
                        <SelectItem value="9">Sem transporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dados do Destinatário</CardTitle>
                  <CardDescription>Informações do cliente</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                    <Input
                      id="nomeCliente"
                      value={emissaoData.cliente.nome}
                      onChange={(e) => updateDados('cliente', {
                        ...emissaoData.cliente,
                        nome: e.target.value,
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="documentoCliente">CPF/CNPJ</Label>
                    <Input
                      id="documentoCliente"
                      value={emissaoData.cliente.documento}
                      onChange={(e) => updateDados('cliente', {
                        ...emissaoData.cliente,
                        documento: e.target.value,
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="indicadorIE">Indicador IE</Label>
                    <Select
                      value={emissaoData.cliente.indicadorIEDestinatario.toString()}
                      onValueChange={(value) => updateDados('cliente', {
                        ...emissaoData.cliente,
                        indicadorIEDestinatario: parseInt(value) as 1 | 2 | 9,
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Contribuinte ICMS</SelectItem>
                        <SelectItem value="2">Contribuinte Isento</SelectItem>
                        <SelectItem value="9">Não Contribuinte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Adicionais</CardTitle>
                  <CardDescription>Observações e informações complementares</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="informacoesAdicionais">Informações Adicionais</Label>
                    <Textarea
                      id="informacoesAdicionais"
                      value={emissaoData.informacoesAdicionais || ''}
                      onChange={(e) => updateDados('informacoesAdicionais', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="informacoesFisco">Informações ao Fisco</Label>
                    <Textarea
                      id="informacoesFisco"
                      value={emissaoData.informacoesFisco || ''}
                      onChange={(e) => updateDados('informacoesFisco', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="produtos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos da NF-e</CardTitle>
                <CardDescription>Revise os dados fiscais dos produtos</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {emissaoData.produtos.map((produto, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor={`produto-nome-${index}`}>Nome do Produto</Label>
                            <Input
                              id={`produto-nome-${index}`}
                              value={produto.produto.nome}
                              onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`produto-codigo-${index}`}>Código</Label>
                            <Input
                              id={`produto-codigo-${index}`}
                              value={produto.produto.codigo}
                              onChange={(e) => updateProduto(index, 'codigo', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`produto-ncm-${index}`}>NCM</Label>
                            <Select
                              value={produto.fiscal.ncm}
                              onValueChange={(value) => updateProduto(index, 'fiscal.ncm', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CODIGOS_NCM_POPULARES.map((ncm) => (
                                  <SelectItem key={ncm.codigo} value={ncm.codigo}>
                                    {ncm.codigo} - {ncm.descricao}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`produto-cfop-${index}`}>CFOP</Label>
                            <Select
                              value={produto.fiscal.cfop}
                              onValueChange={(value) => updateProduto(index, 'fiscal.cfop', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CODIGOS_CFOP_VENDA.map((cfop) => (
                                  <SelectItem key={cfop.codigo} value={cfop.codigo}>
                                    {cfop.codigo} - {cfop.descricao}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévia da NF-e
                </CardTitle>
                <CardDescription>Visualize como ficará a nota fiscal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Dados Gerais</h4>
                      <p>Natureza: {emissaoData.naturezaOperacao}</p>
                      <p>Número: {emissaoData.numeroNota}</p>
                      <p>Série: {emissaoData.serie}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Cliente</h4>
                      <p>{emissaoData.cliente.nome}</p>
                      <p>{emissaoData.cliente.documento}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Produtos</h4>
                    <div className="border rounded p-3">
                      {emissaoData.produtos.map((produto, index) => (
                        <div key={index} className="flex justify-between py-1 border-b last:border-b-0">
                          <span>{produto.produto.nome}</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultado" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultado da Emissão</CardTitle>
                <CardDescription>Status da NF-e emitida</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Emitida' : 'Erro'}
                        </Badge>
                      </div>
                      
                      {result.success ? (
                        <div className="mt-3 space-y-2">
                          <p><strong>Chave:</strong> {result.chave}</p>
                          <p><strong>Número:</strong> {result.numero}</p>
                          <p><strong>Protocolo:</strong> {result.protocolo}</p>
                          <p><strong>Data:</strong> {result.dataAutorizacao}</p>
                          {result.danfe && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                XML
                              </Button>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                DANFE
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="font-medium text-red-600">Erros:</p>
                          <ul className="list-disc list-inside text-sm mt-2">
                            {result.erros?.map((erro, index) => (
                              <li key={index} className="text-red-600">{erro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mb-4" />
                    <p className="text-center">
                      Emita a NF-e para ver o resultado aqui.<br />
                      Clique na aba "Dados da NF-e" e depois em "Emitir NF-e".
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {result?.success ? 'Fechar' : 'Cancelar'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {isPreview ? 'Ocultar Prévia' : 'Ver Prévia'}
            </Button>
            {currentTab === 'dados' && (
              <Button onClick={handleEmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Emitindo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Emitir NF-e
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Import necessário
import { nfeConverterService } from '@/lib/nfe/converter';