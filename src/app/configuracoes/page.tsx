'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfigForm } from './components/config-form';
import { NFeConfigDialog } from './components/nfe-config-dialog';
import { ConsultaNFEDialog } from './components/consulta-nfe-dialog';
import { FileText, Settings, Database, CreditCard, Search } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [isNFeDialogOpen, setIsNFeDialogOpen] = useState(false);
  const [isConsultaNFEDialogOpen, setIsConsultaNFEDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Configurações da Loja" />
      
      <div className="grid gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ConfigForm />
          </CardContent>
        </Card>

        {/* Configurações Fiscais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configurações Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Configurar NF-e</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Dados do emitente e certificado digital
                    </p>
                  </div>
                  <Button onClick={() => setIsNFeDialogOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Consultar NF-e</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Visualize e gerencie notas emitidas
                    </p>
                  </div>
                  <Button onClick={() => setIsConsultaNFEDialogOpen(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurações de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Integrações de Pagamento</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure gateways de pagamento e processadores
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Em Breve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configurações de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Backup e Restauração</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Gerencie backups do banco de dados
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Database className="h-4 w-4 mr-2" />
                  Em Breve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <NFeConfigDialog
        isOpen={isNFeDialogOpen}
        onOpenChange={setIsNFeDialogOpen}
      />
      
      <ConsultaNFEDialog
        isOpen={isConsultaNFEDialogOpen}
        onOpenChange={setIsConsultaNFEDialogOpen}
      />
    </div>
  );
}
