'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye, CheckCircle, XCircle, RefreshCw, Filter, Printer } from 'lucide-react';
import type NFEmitida from './types';

interface ConsultaNFEDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultaNFEDialog({ isOpen, onOpenChange }: ConsultaNFEDialogProps) {
  const { toast } = useToast();
  const [nfeEmitidas, setNfeEmitidas] = useState<NFEmitida[]>([]);
  const [nfeSelecionada, setNfeSelecionada] = useState<NFEmitida | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todas');
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados otimizados
  useEffect(() => {
    if (isOpen) {
      carregarNFEmitidasOtimizadas();
    }
  }, [isOpen]);

  const carregarNFEmitidasOtimizadas = () => {
    setIsLoading(true);
    
    try {
      // Dados essenciais para demonstração (reduzido para evitar erro de data)
      const simuladas: NFEmitida[] = [
        {
          id: '1',
          numero: 1001,
          serie: '1',
          chave: '412305123456789012345678901234567890',
          protocolo: '123456789012345',
          dataEmissao: '2024-01-23T10:30:00Z',
          dataAutorizacao: '2024-01-23T10:31:15Z',
          cliente: { nome: 'João Silva', documento: '123456789012345' },
          valor: 150.50,
          status: 'autorizada',
          ambiente: 'producao',
          naturezaOperacao: 'VENDA DE MERCADORIA',
        },
      ];

      setNfeEmitidas(simuladas);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Carregar',
        description: 'Não foi possível carregar as NF-e emitidas.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarNF = () => {
    return nfeEmitidas.filter(nfe => {
      const matchSearch = !searchTerm || 
        nfe.numero.toString().includes(searchTerm) ||
        nfe.chave.includes(searchTerm) ||
        nfe.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nfe.cliente.documento.includes(searchTerm);

      const matchStatus = selectedStatus === 'todas' || nfe.status === selectedStatus;
      const matchAmbiente = selectedAmbiente === 'todosas' || nfe.ambiente === selectedAmbiente;

      return matchSearch && matchStatus && matchAmbiente;
    });

  const filteredNF = filtrarNF();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <Badge className="bg-green-100 text-green-800">Autorizada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case 'denegada':
        return <Badge className="bg-red-100 text-red-800">Denegada</Badge>;
      case 'processando':
        return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getAmbienteBadge = (ambiente: string) => {
    if (ambiente === 'producao') {
      return <Badge className="bg-blue-100 text-blue-800">Produção</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800">Homologação</Badge>;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const downloadXML = (nfe: NFEmitida) => {
    if (!nfe.xml) {
      toast({
        variant: 'destructive',
        title: 'XML Não Disponível',
        description: 'O arquivo XML desta NF-e não está disponível.',
      });
      return;
    }

    try {
      const blob = new Blob([nfe.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NFe_${nfe.numero}_${nfe.serie}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Iniciado',
        description: `XML da NF-e ${nfe.numero} baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Download',
        description: 'Não foi possível baixar o arquivo XML.',
      });
    }
  };

  const imprimirDANFE = (nfe: NFEmitida) => {
    if (!nfe.danfe) {
      toast({
        variant: 'destructive',
        title: 'DANFE Não Disponível',
        description: 'O arquivo DANFE desta NF-e não está disponível.',
      });
      return;
    }

    // Simular impressão
    toast({
      title: 'DANFE Enviado para Impressão',
      description: `DANFE da NF-e ${nfe.numero} enviada para impressora padrão.`,
    });

    // Em implementação real, aqui abriria o PDF para impressão
    if (nfe.danfe) {
      window.open(nfe.danfe, '_blank');
    }
  };

  const consultarNFE = (nfe: NFEmitida) => {
    // Simular consulta online
    toast({
      title: 'Consultando NF-e',
      description: `Consultando status da NF-e ${nfe.numero}...`,
    });

    setTimeout(() => {
      toast({
        title: 'Consulta Concluída',
        description: `NF-e ${nfe.numero} está ${nfe.status}.`,
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consulta de NF-e Emitidas
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie todas as Notas Fiscais Eletrônicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Busca</Label>
                  <Input
                    id="search"
                    placeholder="Número, chave, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="todas">Todos</option>
                    <option value="autorizada">Autorizadas</option>
                    <option value="cancelada">Canceladas</option>
                    <option value="denegada">Denegadas</option>
                    <option value="processando">Processando</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ambiente">Ambiente</Label>
                  <select
                    id="ambiente"
                    value={selectedAmbiente}
                    onChange={(e) => setSelectedAmbiente(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="todos">Todos</option>
                    <option value="producao">Produção</option>
                    <option value="homologacao">Homologação</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={carregarNFEmitidasOtimizadas} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isLoading ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de NF-e */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>NF-e Emitidas ({filteredNF.length})</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Total: {formatCurrency(filteredNF.reduce((acc, nfe) => acc + nfe.valor, 0))}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Clique em uma NF-e para ver detalhes ou imprimir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando...</span>
                </div>
              ) : filteredNF.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mb-4" />
                  <p className="text-center">
                    Nenhuma NF-e encontrada com os filtros selecionados.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredNF.map((nfe) => (
                      <div
                        key={nfe.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setNfeSelecionada(nfe)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">NF-e {nfe.numero}</h4>
                              <span className="text-sm text-gray-500">Série: {nfe.serie}</span>
                              {getStatusBadge(nfe.status)}
                              {getAmbienteBadge(nfe.ambiente)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Cliente:</span>
                                <p className="font-medium">{nfe.cliente.nome}</p>
                                <p className="text-xs text-gray-500">{nfe.cliente.documento}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Valor:</span>
                                <p className="font-medium">{formatCurrency(nfe.valor)}</p>
                              </div>
                            </div>

                            <div className="mt-2">
                              <span className="text-gray-600">Emissão:</span>
                              <p className="text-sm">{formatDate(nfe.dataEmissao)}</p>
                            </div>
                              <nfe.dataAutorizacao && (
                                <div>
                                  <span className="text-gray-600">Autorização:</span>
                                  <p className="text-sm">{formatDate(nfe.dataAutorizacao)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                consultarNFE(nfe);
                              }}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadXML(nfe);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                imprimirDANFE(nfe);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                              Imprimir DANFE
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Modal de Detalhes */}
        {nfeSelecionada && (
          <Dialog open={!!nfeSelecionada} onOpenChange={() => setNfeSelecionada(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Detalhes da NF-e
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número</Label>
                    <p className="font-medium">NF-e {nfeSelecionada.numero}</p>
                  </div>
                  <div>
                    <Label>Série</Label>
                    <p className="font-medium">{nfeSelecionada.serie}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div>{getStatusBadge(nfeSelecionada.status)}</div>
                  </div>
                  <div>
                    <Label>Ambiente</Label>
                    <div>{getAmbienteBadge(nfeSelecionada.ambiente)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label>Chave de Acesso</Label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {nfeSelecionada.chave}
                    </p>
                  </div>
                  <div>
                    <Label>Protocolo</Label>
                    <p className="font-mono">{nfeSelecionada.protocolo}</p>
                  </div>
                  <div>
                    <Label>Natureza da Operação</Label>
                    <p>{nfeSelecionada.naturezaOperacao}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <p className="font-medium">{nfeSelecionada.cliente.nome}</p>
                    <p className="text-sm text-gray-500">{nfeSelecionada.documento}</p>
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <p className="font-medium text-lg">{formatCurrency(nfeSelecionada.valor)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Emissão</Label>
                    <p>{formatDate(nfeSelecionada.dataEmissao)}</p>
                  </div>
                  {nfeSelecionada.dataAutorizacao && (
                    <div>
                      <Label>Data de Autorização</Label>
                      <p>{formatDate(nfeSelecionada.dataAutorizacao)}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => downloadXML(nfeSelecionada)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar XML
                  </Button>
                  <Button onClick={() => imprimirDANFE(nfeSelecionada)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir DANFE
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}