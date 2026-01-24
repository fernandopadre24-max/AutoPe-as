import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  X,
  Keyboard,
  Package,
  CreditCard,
  User,
  DollarSign,
  Search,
  HelpCircle,
  Info,
} from 'lucide-react'

interface InstructionsModalProps {
  isOpen: boolean
  onClose: () => void
}

type ShortcutItem = { shortcut: string; description: string }

function ShortcutRow({ shortcut, description }: ShortcutItem) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
          {shortcut}
        </kbd>
      </div>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  )
}

function SectionCard({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: ShortcutItem[]
}) {
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-50 rounded-lg">{icon}</div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <ShortcutRow
              key={`${item.shortcut}-${index}`}
              shortcut={item.shortcut}
              description={item.description}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  const basicSection: ShortcutItem[] = [
    { shortcut: 'F6', description: 'Buscar produtos por código, nome ou código de barras' },
    { shortcut: 'ENTER', description: 'Adicionar item selecionado ao carrinho' },
    { shortcut: 'ESC', description: 'Limpar busca e cancelar operação atual' },
    { shortcut: 'TAB', description: 'Navegar entre campos de quantidade e unidade' },
  ]

  const operationsSection: ShortcutItem[] = [
    { shortcut: '+', description: 'Aumentar quantidade do item' },
    { shortcut: '-', description: 'Diminuir quantidade do item' },
    { shortcut: 'DELETE', description: 'Remover item do carrinho' },
    { shortcut: 'Click', description: 'Selecionar produto na lista ou no carrinho' },
  ]

  const paymentSection: ShortcutItem[] = [
    { shortcut: 'F1', description: 'Finalizar venda em dinheiro' },
    { shortcut: 'F2', description: 'Finalizar venda via PIX' },
    { shortcut: 'F3', description: 'Finalizar venda no cartão' },
    { shortcut: 'F4', description: 'Finalizar venda a prazo' },
    { shortcut: 'F5', description: 'Finalizar venda parcelado' },
  ]

  const customerSection: ShortcutItem[] = [
    { shortcut: 'F7', description: 'Buscar ou cadastrar cliente' },
    { shortcut: 'F8', description: 'Editar dados do cliente selecionado' },
    { shortcut: 'ENTER', description: 'Confirmar seleção de cliente' },
    { shortcut: 'ESC', description: 'Cancelar busca de cliente' },
  ]

  const cashSection: ShortcutItem[] = [
    { shortcut: 'F9', description: 'Abrir/Fechar caixa' },
    { shortcut: 'F10', description: 'Sangria (retirada de valores)' },
    { shortcut: 'F11', description: 'Suprimento (adição de valores)' },
    { shortcut: 'F12', description: 'Abrir calculadora' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* layout em coluna + altura limitada + scroll interno */}
      <DialogContent className="w-[95vw] max-w-5xl p-0 overflow-hidden">
        {/* Cabeçalho fixo */}
        <DialogHeader className="flex flex-row items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <HelpCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Instruções do PDV</DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                Guia completo de atalhos e funções do Ponto de Venda
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo com Tabs + ScrollArea por aba */}
        <div className="flex flex-col h-[80vh]">
          <Tabs defaultValue="basico" className="flex flex-col flex-1 min-h-0">
            {/* TabsList “gruda” no topo do conteúdo */}
            <div className="border-b px-4 py-3">
              <TabsList className="w-full flex flex-wrap gap-2 justify-start h-auto bg-transparent p-0">
                <TabsTrigger value="basico" className="gap-2">
                  <Keyboard className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="itens" className="gap-2">
                  <Package className="h-4 w-4" />
                  Itens
                </TabsTrigger>
                <TabsTrigger value="pagamentos" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="cliente" className="gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="caixa" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Caixa
                </TabsTrigger>
                <TabsTrigger value="dicas" className="gap-2">
                  <Info className="h-4 w-4" />
                  Dicas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo: importante usar min-h-0 + flex-1 para o scroll funcionar */}
            <div className="flex-1 min-h-0">
              <TabsContent value="basico" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SectionCard
                      title="📋 Operações Básicas"
                      icon={<Keyboard className="h-5 w-5 text-blue-600" />}
                      items={basicSection}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="itens" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SectionCard
                      title="🛒 Gestão de Itens"
                      icon={<Package className="h-5 w-5 text-blue-600" />}
                      items={operationsSection}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pagamentos" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SectionCard
                      title="💳 Métodos de Pagamento"
                      icon={<CreditCard className="h-5 w-5 text-blue-600" />}
                      items={paymentSection}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cliente" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SectionCard
                      title="👤 Cliente"
                      icon={<User className="h-5 w-5 text-blue-600" />}
                      items={customerSection}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="caixa" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <SectionCard
                      title="🏪 Operações de Caixa"
                      icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                      items={cashSection}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="dicas" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <Card className="shadow-sm border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-50 rounded-lg">
                            <Search className="h-5 w-5 text-gray-500 mt-0.5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">📖 Informações Importantes</h4>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h5 className="font-semibold text-sm mb-2 text-gray-700">💡 Dicas Rápidas</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• <strong>Autocomplete:</strong> Busca funciona com palavras parciais</li>
                                  <li>• <strong>Quantidade:</strong> Padrão = 1, alterável antes de adicionar</li>
                                  <li>• <strong>Unidades:</strong> UN, CX, PC, JG, KT, M, KG disponíveis</li>
                                  <li>• <strong>Estoque:</strong> Sem estoque = vermelho, baixo = laranja</li>
                                </ul>
                              </div>

                              <div>
                                <h5 className="font-semibold text-sm mb-2 text-gray-700">⚡ Atalhos Especiais</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>• <strong>CTRL + Z:</strong> Desfazer última ação</li>
                                  <li>• <strong>CTRL + L:</strong> Limpar carrinho completo</li>
                                  <li>• <strong>ESC + ESC:</strong> Cancelar operação atual</li>
                                  <li>• <strong>F12:</strong> Abrir calculadora (modal)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
