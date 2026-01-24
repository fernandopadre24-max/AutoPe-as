'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle, XCircle, Upload, TestTube, AlertTriangle, Settings } from 'lucide-react';
import { nfeConfigService } from '@/lib/nfe/config';
import type { NFePDVConfig } from '@/lib/nfe';

interface NFeConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CODIGOS_UF = [
  { sigla: 'SP', nome: 'São Paulo', codigo: 35 },
  { sigla: 'RJ', nome: 'Rio de Janeiro', codigo: 33 },
  { sigla: 'MG', nome: 'Minas Gerais', codigo: 31 },
  { sigla: 'BA', nome: 'Bahia', codigo: 29 },
  { sigla: 'RS', nome: 'Rio Grande do Sul', codigo: 43 },
  { sigla: 'PR', nome: 'Paraná', codigo: 41 },
  { sigla: 'PE', nome: 'Pernambuco', codigo: 26 },
  { sigla: 'CE', nome: 'Ceará', codigo: 23 },
];

export function NFeConfigDialog({ isOpen, onOpenChange }: NFeConfigDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState<NFePDVConfig | any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const existingConfig = nfeConfigService.getConfig();
      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        setConfig(nfeConfigService.gerarConfigPadrao());
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await nfeConfigService.configurar(config);
      toast({
        title: 'Configuração Salva',
        description: 'Configuração NF-e salva com sucesso!',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await nfeConfigService.configurar(config);
      const results = await nfeConfigService.testarConfiguracao();
      
      if (results.sucesso) {
        toast({
          title: 'Teste Concluído',
          description: 'Configuração testada com sucesso!',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Teste',
          description: results.mensagem,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Teste',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuração NF-e
          </DialogTitle>
          <DialogDescription>
            Configure os dados fiscais para emissão de Notas Fiscais Eletrônicas
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="emitente" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emitente">Emitente</TabsTrigger>
            <TabsTrigger value="certificado">Certificado</TabsTrigger>
            <TabsTrigger value="teste">Teste</TabsTrigger>
          </TabsList>

          <TabsContent value="emitente" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Emitente</CardTitle>
                <CardDescription>Informações da empresa para NF-e</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razaoSocial">Razão Social</Label>
                    <Input
                      id="razaoSocial"
                      value={config.emitente?.razaoSocial || ''}
                      onChange={(e) => updateConfig('emitente.razaoSocial', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={config.emitente?.nomeFantasia || ''}
                      onChange={(e) => updateConfig('emitente.nomeFantasia', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={config.emitente?.cnpj || ''}
                      onChange={(e) => updateConfig('emitente.cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={config.emitente?.inscricaoEstadual || ''}
                      onChange={(e) => updateConfig('emitente.inscricaoEstadual', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="regimeTributario">Regime Tributário</Label>
                  <Select
                    value={config.emitente?.regimetributario?.toString() || '1'}
                    onValueChange={(value) => updateConfig('emitente.regimetributario', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Simples Nacional</SelectItem>
                      <SelectItem value="3">Regime Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Endereço do Emitente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={config.emitente?.endereco?.logradouro || ''}
                        onChange={(e) => updateConfig('emitente.endereco.logradouro', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={config.emitente?.endereco?.numero || ''}
                        onChange={(e) => updateConfig('emitente.endereco.numero', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={config.emitente?.endereco?.bairro || ''}
                        onChange={(e) => updateConfig('emitente.endereco.bairro', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={config.emitente?.endereco?.cep || ''}
                        onChange={(e) => updateConfig('emitente.endereco.cep', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="uf">UF</Label>
                      <Select
                        value={config.emitente?.endereco?.uf || ''}
                        onValueChange={(value) => updateConfig('emitente.endereco.uf', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {CODIGOS_UF.map((uf) => (
                            <SelectItem key={uf.sigla} value={uf.sigla}>
                              {uf.sigla} - {uf.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificado" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Certificado Digital</CardTitle>
                <CardDescription>Configure o certificado A1 para assinatura das NF-e</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="caminhoCertificado">Arquivo do Certificado</Label>
                  <Input
                    id="caminhoCertificado"
                    value={config.certificado?.caminhoArquivo || ''}
                    onChange={(e) => updateConfig('certificado.caminhoArquivo', e.target.value)}
                    placeholder="caminho/do/certificado.pfx"
                  />
                </div>

                <div>
                  <Label htmlFor="senhaCertificado">Senha do Certificado</Label>
                  <Input
                    id="senhaCertificado"
                    type="password"
                    value={config.certificado?.senha || ''}
                    onChange={(e) => updateConfig('certificado.senha', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="ambiente">Ambiente</Label>
                  <Select
                    value={config.ambiente || 'homologacao'}
                    onValueChange={(value) => updateConfig('ambiente', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologação</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teste" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Teste de Configuração
                </CardTitle>
                <CardDescription>Verifique se a configuração está correta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Configuração
                    </>
                  )}
                </Button>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-sm">Atenção</span>
                  </div>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• O teste pode levar alguns segundos para completar</li>
                    <li>• Certifique-se que o certificado digital é válido</li>
                    <li>• Verifique a conexão com os servidores da SEFAZ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}