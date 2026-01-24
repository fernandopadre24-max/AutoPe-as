import type {
  NFeEmissionResult,
  NFeConsultaResult,
  NFeStatusResult,
  EmissaoNFEDTO,
  NFePDVConfig,
} from './types.js';
import { nfeConfigService } from './config.js';
import { nfeConverterService } from './converter.js';

/**
 * Serviço de emissão e gerenciamento de NF-e
 * Implementa retry, validação e tratamento de erros
 */
export class NFeEmissionService {
  private static instance: NFeEmissionService;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 segundos

  private constructor() {}

  static getInstance(): NFeEmissionService {
    if (!NFeEmissionService.instance) {
      NFeEmissionService.instance = new NFeEmissionService();
    }
    return NFeEmissionService.instance;
  }

  /**
   * Emite NF-e com tratamento de erros e retry
   */
  async emitirNFe(dadosVenda: any): Promise<NFeEmissionResult> {
    try {
      console.log('🚀 Iniciando emissão de NF-e...');

      // Validar configuração
      const configValida = await this.validarConfiguracao();
      if (!configValida.sucesso) {
        return {
          success: false,
          erros: [`Configuração inválida: ${configValida.mensagem}`],
        };
      }

      // Converter dados
      const dtoEmissao = nfeConverterService.converterVendaParaEmissao(dadosVenda);
      const dadosNFe = await nfeConverterService.converterParaNFeWizard(dtoEmissao);

      // Emitir com retry
      const resultado = await this.emitirComRetry(dadosNFe);

      if (resultado.success) {
        console.log('✅ NF-e emitida com sucesso:', resultado.chave);
        return resultado;
      } else {
        console.error('❌ Falha na emissão:', resultado.erros);
        return resultado;
      }
    } catch (error) {
      console.error('❌ Erro ao emitir NF-e:', error);
      return {
        success: false,
        erros: [`Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      };
    }
  }

  /**
   * Consulta status de NF-e pela chave
   */
  async consultarNFe(chave: string): Promise<NFeConsultaResult> {
    try {
      console.log('🔍 Consultando NF-e:', chave);

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_ConsultaProtocolo(chave);

      if (resultado.success) {
        return {
          existe: true,
          autorizada: resultado.xmls[0]?.protNFe?.infProt?.cStat === '100',
          chave: resultado.xmls[0]?.protNFe?.infProt?.chNFe,
          numero: resultado.xmls[0]?.NFe?.infNFe?.ide?.nNF?.toString(),
          protocolo: resultado.xmls[0]?.protNFe?.infProt?.nProt,
          dataAutorizacao: resultado.xmls[0]?.protNFe?.infProt?.dhRecbto,
          xml: JSON.stringify(resultado.xmls[0]),
          situacao: resultado.xmls[0]?.protNFe?.infProt?.xMotivo,
        };
      } else {
        return {
          existe: false,
          autorizada: false,
          motivo: resultado.xMotivo?.toString() || 'Erro na consulta',
        };
      }
    } catch (error) {
      console.error('❌ Erro na consulta:', error);
      return {
        existe: false,
        autorizada: false,
        motivo: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Verifica status do serviço NFe
   */
  async verificarStatusServico(): Promise<NFeStatusResult> {
    try {
      console.log('🔍 Verificando status do serviço NFe...');

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_ConsultaStatusServico();

      if (resultado.success) {
        return {
          status: true,
          motivo: resultado.xMotivo?.toString() || 'Serviço operacional',
          dataRetorno: resultado.dataHora?.toString(),
          ambiente: resultado.ambiente?.toString(),
          versao: resultado.versao?.toString(),
        };
      } else {
        return {
          status: false,
          motivo: resultado.xMotivo?.toString() || 'Serviço indisponível',
        };
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return {
        status: false,
        motivo: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Valida se a configuração está ok para emissão
   */
  async validarConfiguracao(): Promise<{ sucesso: boolean; mensagem: string }> {
    try {
      if (!nfeConfigService.isConfigurado()) {
        return {
          sucesso: false,
          mensagem: 'NFe não configurado. Configure os dados do emitente primeiro.',
        };
      }

      // Testar status do serviço
      const status = await this.verificarStatusServico();
      if (!status.status) {
        return {
          sucesso: false,
          mensagem: `Serviço NFe indisponível: ${status.motivo}`,
        };
      }

      return {
        sucesso: true,
        mensagem: 'Configuração válida',
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Implementa retry na emissão
   */
  private async emitirComRetry(dadosNFe: any, tentativa = 1): Promise<NFeEmissionResult> {
    try {
      console.log(`📤 Emitindo NF-e (tentativa ${tentativa}/${this.MAX_RETRIES})...`);

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_Autorizacao(dadosNFe);

      // Simplificação para evitar erros de tipo
      // Em implementação real, precisaria verificar a estrutura exata do retorno
      if (resultado && (resultado as any).success) {
        const xml = (resultado as any).xmls?.[0];
        const chave = xml?.protNFe?.infProt?.chNFe;
        const numero = xml?.NFe?.infNFe?.ide?.nNF;
        const protocolo = xml?.protNFe?.infProt?.nProt;
        const dataAutorizacao = xml?.protNFe?.infProt?.dhRecbto;

        return {
          success: true,
          chave,
          numero: numero?.toString(),
          protocolo,
          dataAutorizacao,
          xml: JSON.stringify(xml),
          danfe: this.gerarURLDANFE(chave),
        };
      } else {
        const erros = this.extrairErros(resultado);
        
        // Verificar se é erro recuperável
        if (this.erroRecuperavel(erros) && tentativa < this.MAX_RETRIES) {
          console.log(`⏳ Aguardando ${this.RETRY_DELAY}ms para retry...`);
          await this.delay(this.RETRY_DELAY);
          return this.emitirComRetry(dadosNFe, tentativa + 1);
        }

        return {
          success: false,
          erros,
        };
      }
    } catch (error) {
      if (tentativa < this.MAX_RETRIES) {
        console.log(`⏳ Erro na tentativa ${tentativa}. Aguardando retry...`);
        await this.delay(this.RETRY_DELAY * tentativa);
        return this.emitirComRetry(dadosNFe, tentativa + 1);
      }

      return {
        success: false,
        erros: [`Erro após ${this.MAX_RETRIES} tentativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      };
    }
  }

  /**
   * Extrai mensagens de erro do resultado
   */
  private extrairErros(resultado: any): string[] {
    const erros: string[] = [];

    // Erros do protocolo
    if (resultado.xmls?.[0]?.protNFe?.infProt?.xMotivo) {
      erros.push(resultado.xmls[0].protNFe.infProt.xMotivo);
    }

    // Erros de retorno
    if (resultado.xMotivo) {
      erros.push(resultado.xMotivo.toString());
    }

    // Erros gerais
    if (resultado.message) {
      erros.push(resultado.message);
    }

    return erros.length > 0 ? erros : ['Erro desconhecido na emissão'];
  }

  /**
   * Verifica se o erro permite retry
   */
  private erroRecuperavel(erros: string[]): boolean {
    const errosRecuperaveis = [
      'timeout',
      'connection',
      'network',
      'servidor',
      'indisponível',
      'tempo esgotado',
      'falha na comunicação',
    ];

    const textoErros = erros.join(' ').toLowerCase();
    return errosRecuperaveis.some(erro => textoErros.includes(erro));
  }

  /**
   * Gera URL para consulta do DANFE
   */
  private gerarURLDANFE(chave?: string): string {
    if (!chave) return '';

    // URL de consulta nacional (homologação)
    const urlBase = 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/ConsultaNfce';
    return `${urlBase}?p=${chave}`;
  }

  /**
   * Gera delay para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gera DANFE em PDF (placeholder)
   */
  async gerarDANFE(chave: string): Promise<string | null> {
    try {
      console.log('🖨️ Gerando DANFE para:', chave);

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_GerarDanfe({
        chave,
        formato: 'pdf',
        salvar: true,
        caminho: './nfe/danfe',
      });

      if ((resultado as any).success) {
        return (resultado as any).caminhoArquivo || null;
      } else {
        console.error('❌ Erro ao gerar DANFE:', (resultado as any).xMotivo);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao gerar DANFE:', error);
      return null;
    }
  }

  /**
   * Cancela NF-e (placeholder - simplificado)
   */
  async cancelarNFe(chave: string, justificativa: string): Promise<NFeEmissionResult> {
    try {
      console.log('🚫 Cancelando NF-e:', chave);

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_Cancelamento({
        chave,
        justificativa,
        tpAmb: nfeConfigService.getConfig()?.ambiente === 'producao' ? 1 : 2,
      });

      if ((resultado as any).success) {
        return {
          success: true,
          chave,
          protocolo: (resultado as any).xmls?.[0]?.procEventoNFe?.retEvento?.infEvento?.nProt?.toString(),
          dataAutorizacao: (resultado as any).xmls?.[0]?.procEventoNFe?.retEvento?.infEvento?.dhRegEvento,
          xml: JSON.stringify((resultado as any).xmls?.[0]),
        };
      } else {
        return {
          success: false,
          erros: this.extrairErros(resultado),
        };
      }
    } catch (error) {
      return {
        success: false,
        erros: [`Erro no cancelamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      };
    }
  }

  /**
   * Carta de correção (placeholder - simplificado)
   */
  async corrigirNFe(chave: string, correcao: string): Promise<NFeEmissionResult> {
    try {
      console.log('📝 Enviando carta de correção para:', chave);

      const nfeWizard = nfeConfigService.getNFeWizard();
      const resultado = await nfeWizard.NFE_CartaDeCorrecao({
        chave,
        textoCCe: correcao,
        tpAmb: nfeConfigService.getConfig()?.ambiente === 'producao' ? 1 : 2,
      });

      if ((resultado as any).success) {
        return {
          success: true,
          chave,
          protocolo: (resultado as any).xmls?.[0]?.procEventoNFe?.retEvento?.infEvento?.nProt?.toString(),
          dataAutorizacao: (resultado as any).xmls?.[0]?.procEventoNFe?.retEvento?.infEvento?.dhRegEvento,
          xml: JSON.stringify((resultado as any).xmls?.[0]),
        };
      } else {
        return {
          success: false,
          erros: this.extrairErros(resultado),
        };
      }
    } catch (error) {
      return {
        success: false,
        erros: [`Erro na carta de correção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
      };
    }
  }

  /**
   * Teste de integração completo
   */
  async testeIntegracao(): Promise<{
    configuracao: { ok: boolean; mensagem: string };
    servico: { ok: boolean; mensagem: string };
    emissao: { ok: boolean; mensagem: string; dados?: any };
  }> {
    const resultado = {
      configuracao: await this.testarConfiguracao(),
      servico: await this.testarServico(),
      emissao: await this.testarEmissao(),
    };

    return resultado;
  }

  private async testarConfiguracao(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      const validacao = await this.validarConfiguracao();
      return {
        ok: validacao.sucesso,
        mensagem: validacao.mensagem,
      };
    } catch (error) {
      return {
        ok: false,
        mensagem: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  private async testarServico(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      const status = await this.verificarStatusServico();
      return {
        ok: status.status,
        mensagem: status.motivo || 'Serviço ok',
      };
    } catch (error) {
      return {
        ok: false,
        mensagem: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  private async testarEmissao(): Promise<{ ok: boolean; mensagem: string; dados?: any }> {
    try {
      // Criar dados de teste
      const dadosTeste = {
        itens: [
          {
            product: {
              id: 'test',
              name: 'PRODUTO TESTE',
              sku: 'TEST001',
              salePrice: 10,
              category: 'Teste',
            },
            quantity: 1,
            unit: 'UN',
            discount: 0,
          },
        ],
        total: 10,
        customer: null,
        paymentMethod: 'Dinheiro',
      };

      const resultado = await this.emitirNFe(dadosTeste);
      return {
        ok: resultado.success,
        mensagem: resultado.success ? 'Emissão teste ok' : resultado.erros?.join(', ') || 'Falha na emissão',
        dados: resultado.success ? { chave: resultado.chave } : undefined,
      };
    } catch (error) {
      return {
        ok: false,
        mensagem: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
}

// Exportar instância singleton
export const nfeEmissionService = NFeEmissionService.getInstance();