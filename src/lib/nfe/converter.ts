import type {
  EmissaoNFEDTO,
  ProdutoFiscal,
  ClienteFiscal,
  PagamentoFiscal,
  NFeEmissionData,
} from './types.js';
import {
  CODIGOS_PAGAMENTO,
} from './types.js';
import type { Product, Customer } from '@/lib/types.js';

// Tipo local para CartItem
interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  discount: number;
}

/**
 * Serviço para converter dados do PDV em formato NFe
 */
export class NFeConverterService {
  private static instance: NFeConverterService;

  private constructor() {}

  static getInstance(): NFeConverterService {
    if (!NFeConverterService.instance) {
      NFeConverterService.instance = new NFeConverterService();
    }
    return NFeConverterService.instance;
  }

  /**
   * Converte dados da venda para DTO de emissão NFe
   */
  converterVendaParaEmissao(
    saleData: {
      itens: CartItem[];
      total: number;
      customer: Customer | null;
      paymentMethod: string;
      cardNumber?: string;
      installments?: number;
    },
    configNF?: any
  ): EmissaoNFEDTO {
    const cliente = this.converterCliente(saleData.customer);
    const produtos = saleData.itens.map(item => this.converterProduto(item));
    const pagamentos = this.converterPagamentos(saleData, saleData.total);

    return {
      serie: '1',
      numeroNota: this.gerarNumeroNota(),
      naturezaOperacao: 'VENDA DE MERCADORIA',
      cliente,
      produtos,
      pagamentos,
      modalidadeFrete: 9,
      informacoesAdicionais: `Venda via PDV - ${new Date().toLocaleDateString('pt-BR')}`,
    };
  }

  /**
   * Converte DTO de emissão para formato NFeWizard
   */
  async converterParaNFeWizard(dto: EmissaoNFEDTO): Promise<NFeEmissionData> {
    return {
      idLote: 1,
      indSinc: 1,
      NFe: {
        infNFe: {} as any,
      },
    };
  }

  /**
   * Converte cliente do PDV para cliente fiscal
   */
  private converterCliente(customer: Customer | null): ClienteFiscal {
    if (!customer) {
      return {
        nome: 'CONSUMIDOR FINAL',
        documento: '00000000000',
        tipo: 'cpf',
        indicadorIEDestinatario: 9,
      };
    }

    const documento = customer.cpf || '00000000000';
    const tipo = this.identificarTipoDocumento(documento);

    return {
      id: customer.id,
      nome: `${customer.firstName} ${customer.lastName}`,
      documento,
      tipo,
      indicadorIEDestinatario: 9,
    };
  }

  /**
   * Converte produto do carrinho para produto fiscal
   */
  private converterProduto(cartItem: CartItem): ProdutoFiscal {
    const { product, quantity, discount } = cartItem;
    const valorTotal = (product.salePrice * quantity) - discount;

    return {
      produto: {
        id: product.id,
        nome: product.name,
        codigo: product.sku,
        unidade: product.size || 'UN',
      },
      fiscal: {
        ncm: this.obterNCMPorProduto(product),
        cfop: this.obterCFOPPorOperacao(product),
        icms: {
          cst: product.icmsCst || '00',
          aliquota: product.icmsAliquota || 18,
          baseCalculo: valorTotal,
          valor: valorTotal * ((product.icmsAliquota || 18) / 100),
        },
        pis: { cst: product.pisCst || '06' },
        cofins: { cst: product.cofinsCst || '06' },
      },
    };
  }

  /**
   * Converte método de pagamento para pagamento fiscal
   */
  private converterPagamentos(
    saleData: any,
    total: number
  ): PagamentoFiscal[] {
    let codigoPagamento = '99';

    switch (saleData.paymentMethod) {
      case 'Dinheiro':
        codigoPagamento = '01';
        break;
      case 'PIX':
        codigoPagamento = '17';
        break;
      case 'Cartão':
        codigoPagamento = '03';
        break;
      case 'À Vista':
        codigoPagamento = '01';
        break;
      case 'Prazo':
      case 'Parcelado':
        codigoPagamento = '14';
        break;
    }

    const pagamento: PagamentoFiscal = {
      forma: codigoPagamento,
      valor: total,
    };

    if (saleData.paymentMethod === 'Cartão' && saleData.cardNumber) {
      pagamento.cartao = {
        integracao: 2,
        autorizacao: saleData.cardNumber.slice(-4),
      };
    }

    return [pagamento];
  }

  /**
   * Obtém NCM do produto (do cadastro ou padrão)
   */
  private obterNCMPorProduto(product: Product): string {
    if (product.ncm) {
      return product.ncm;
    }
    
    if (product.category?.toLowerCase().includes('vestuário') || 
        product.gender !== undefined) {
      return '61000000';
    }
    if (product.category?.toLowerCase().includes('calçado')) {
      return '64000000';
    }
    
    return '99999999';
  }
  
  /**
   * Obtém CFOP do produto (do cadastro ou padrão)
   */
  private obterCFOPPorOperacao(product?: Product): string {
    if (product?.cfop) {
      return product.cfop;
    }
    
    return '5102';
  }

  /**
   * Identifica tipo do documento (CPF/CNPJ)
   */
  private identificarTipoDocumento(documento: string): 'cpf' | 'cnpj' {
    const docLimpo = documento.replace(/\D/g, '');
    return docLimpo.length === 14 ? 'cnpj' : 'cpf';
  }

  /**
   * Gera número sequencial da nota
   */
  private gerarNumeroNota(): number {
    return Math.floor(Math.random() * 1000000) + 1;
  }
}

export const nfeConverterService = NFeConverterService.getInstance();