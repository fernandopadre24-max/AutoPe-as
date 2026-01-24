import NFeWizard from 'nfewizard-io';
import { type NFeWizardConfig, type NFePDVConfig, TIPOS_AMBIENTE } from './types.js';

/**
 * Serviço de configuração e inicialização da biblioteca NFeWizard
 * Gerencia certificados, ambiente e dados do emitente
 */
export class NFeConfigService {
  private static instance: NFeConfigService;
  private nfeWizard: NFeWizard | null = null;
  private configurado: boolean = false;
  private config: NFePDVConfig | null = null;

  private constructor() {}

  static getInstance(): NFeConfigService {
    if (!NFeConfigService.instance) {
      NFeConfigService.instance = new NFeConfigService();
    }
    return NFeConfigService.instance;
  }

  /**
   * Configura a biblioteca NFeWizard com os dados do emitente
   */
  async configurar(configPDV: NFePDVConfig): Promise<void> {
    try {
      // Validação básica da configuração
      this.validarConfiguracao(configPDV);

      // Converter para formato NFeWizard
      const nfeWizardConfig = this.converterParaNFeWizard(configPDV);

      // Inicializar biblioteca
      this.nfeWizard = new NFeWizard();
      await this.nfeWizard.NFE_LoadEnvironment({ config: nfeWizardConfig });

      this.config = configPDV;
      this.configurado = true;

      console.log('✅ NFe configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar NFe:', error);
      throw new Error(`Falha na configuração da NFe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verifica se o serviço está configurado e retorna a instância
   */
  getNFeWizard(): NFeWizard {
    if (!this.configurado || !this.nfeWizard) {
      throw new Error('NFe não configurado. Execute configurar() primeiro.');
    }
    return this.nfeWizard;
  }

  /**
   * Retorna se o serviço está configurado
   */
  isConfigurado(): boolean {
    return this.configurado;
  }

  /**
   * Retorna a configuração atual
   */
  getConfig(): NFePDVConfig | null {
    return this.config;
  }

  /**
   * Verifica status do serviço NFe
   */
  async verificarStatus(): Promise<any> {
    try {
      const nfeWizard = this.getNFeWizard();
      return await nfeWizard.NFE_ConsultaStatusServico();
    } catch (error) {
      console.error('Erro ao verificar status do serviço NFe:', error);
      throw error;
    }
  }

  /**
   * Validação dos dados de configuração
   */
  private validarConfiguracao(config: NFePDVConfig): void {
    const erros: string[] = [];

    // Validações do emitente
    if (!config.emitente.razaoSocial) {
      erros.push('Razão Social do emitente é obrigatória');
    }
    if (!config.emitente.cnpj || !this.validarCNPJ(config.emitente.cnpj)) {
      erros.push('CNPJ do emitente inválido');
    }
    if (!config.emitente.inscricaoEstadual) {
      erros.push('Inscrição Estadual do emitente é obrigatória');
    }

    // Validações do endereço
    if (!config.emitente.endereco.codigoMunicipio) {
      erros.push('Código do município é obrigatório');
    }
    if (!config.emitente.endereco.cep || !this.validarCEP(config.emitente.endereco.cep)) {
      erros.push('CEP do emitente inválido');
    }

    // Validações do certificado
    if (!config.certificado.caminhoArquivo) {
      erros.push('Caminho do certificado digital é obrigatório');
    }
    if (!config.certificado.senha) {
      erros.push('Senha do certificado digital é obrigatória');
    }

    // Validações dos diretórios
    if (!config.diretorios.xmlAutorizadas) {
      erros.push('Diretório para XML autorizadas é obrigatório');
    }
    if (!config.diretorios.logs) {
      erros.push('Diretório para logs é obrigatório');
    }

    if (erros.length > 0) {
      throw new Error(`Erros na configuração:\n- ${erros.join('\n- ')}`);
    }
  }

  /**
   * Converte configuração PDV para formato NFeWizard
   */
  private converterParaNFeWizard(config: NFePDVConfig): NFeWizardConfig {
    const ambiente = config.ambiente === 'producao' ? 1 : 2;
    const cUF = this.obterCodigoUF(config.emitente.endereco.uf);

    return {
      dfe: {
        pathCertificado: config.certificado.caminhoArquivo,
        senhaCertificado: config.certificado.senha,
        UF: config.emitente.endereco.uf,
        CPFCNPJ: config.emitente.cnpj.replace(/\D/g, ''),
        armazenarXMLAutorizacao: true,
        pathXMLAutorizacao: config.diretorios.xmlAutorizadas,
      },
      nfe: {
        ambiente,
        versaoDF: '4.00',
      },
      lib: {
        log: {
          exibirLogNoConsole: true,
          armazenarLogs: true,
          pathLogs: config.diretorios.logs,
        },
      },
    };
  }

  /**
   * Retorna o código IBGE da UF
   */
  private obterCodigoUF(uf: string): number {
    const codigos: Record<string, number> = {
      'AC': 12, 'AL': 27, 'AP': 16, 'AM': 13, 'BA': 29, 'CE': 23,
      'DF': 53, 'ES': 32, 'GO': 52, 'MA': 21, 'MT': 51, 'MS': 50,
      'MG': 31, 'PA': 15, 'PB': 25, 'PR': 41, 'PE': 26, 'PI': 22,
      'RJ': 33, 'RN': 24, 'RS': 43, 'RO': 11, 'RR': 14, 'SC': 42,
      'SP': 35, 'SE': 28, 'TO': 17,
    };

    const ufUpper = uf.toUpperCase();
    const codigo = codigos[ufUpper];

    if (!codigo) {
      throw new Error(`UF não encontrada: ${uf}`);
    }

    return codigo;
  }

  /**
   * Valida formato do CNPJ
   */
  private validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.length === 14;
  }

  /**
   * Valida formato do CEP
   */
  private validarCEP(cep: string): boolean {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
  }

  /**
   * Gera configuração padrão para demonstração
   */
  gerarConfigPadrao(): Partial<NFePDVConfig> {
    return {
      ambiente: 'homologacao',
      emitente: {
        razaoSocial: 'EMPRESA DEMONSTRACAO LTDA',
        nomeFantasia: 'DEMO STORE',
        cnpj: '12345678901234',
        inscricaoEstadual: '123456789',
        regimetributario: 1, // Simples Nacional
        endereco: {
          logradouro: 'Rua Principal',
          numero: '123',
          bairro: 'Centro',
          codigoMunicipio: 3550308, // São Paulo
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '01234567',
        },
      },
      certificado: {
        caminhoArquivo: './certs/certificado.pfx',
        senha: 'senha123',
      },
      diretorios: {
        xmlAutorizadas: './nfe/autorizadas',
        logs: './logs',
      },
    };
  }

  /**
   * Limpa configuração atual
   */
  limpar(): void {
    this.nfeWizard = null;
    this.config = null;
    this.configurado = false;
  }

  /**
   * Testa conexão e validação do certificado
   */
  async testarConfiguracao(): Promise<{ sucesso: boolean; mensagem: string; detalhes?: any }> {
    try {
      if (!this.configurado) {
        return {
          sucesso: false,
          mensagem: 'NFe não está configurado',
        };
      }

      // Testar status do serviço
      const status = await this.verificarStatus();
      
      return {
        sucesso: true,
        mensagem: 'Configuração testada com sucesso',
        detalhes: {
          status,
          ambiente: this.config?.ambiente,
          emitente: this.config?.emitente.razaoSocial,
        },
      };
    } catch (error) {
      return {
        sucesso: false,
        mensagem: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
}

// Exportar instância singleton
export const nfeConfigService = NFeConfigService.getInstance();