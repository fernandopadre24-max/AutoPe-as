import { 
  type NFeEmissionResult, 
  type NFePDVConfig, 
  type ProdutoFiscal 
} from './types';
import { Sale } from '@/lib/types';

// Tipos de auditoria
export type NFeAuditOperation = 
  | 'emission_started' 
  | 'emission_success'
  | 'emission_failed'
  | 'emission_retry'
  | 'config_updated'
  | 'config_tested'
  | 'nfe_consulted'
  | 'nfe_cancelled'
  | 'nfe_inutilized'
  | 'certificate_imported'
  | 'user_authenticated';

export interface NFeAuditLog {
  id?: string;
  operation: NFeAuditOperation;
  userId?: string;
  userEmail?: string;
  timestamp: Date;
  details: Record<string, any>;
  status: 'success' | 'error' | 'warning';
  message?: string;
  errorMessage?: string;
  nfeKey?: string;
  saleId?: string;
  invoiceNumber?: string;
  environment?: 'homologacao' | 'producao';
  duration?: number; // milliseconds
  ip?: string;
  userAgent?: string;
}

export interface NFeAuditSummary {
  totalOperations: number;
  successfulEmissions: number;
  failedEmissions: number;
  successRate: number;
  averageEmissionTime: number;
  lastEmission?: Date;
  errorDistribution: Record<string, number>;
  operationsByUser: Record<string, number>;
}

class NFeAuditService {
  private readonly collection = 'nfe_audit_logs';
  private readonly maxLogRetention = 365; // days
  private logs: NFeAuditLog[] = [];

  /**
   * Registra uma operação de auditoria NF-e
   */
  async logOperation(
    operation: NFeAuditOperation,
    details: Record<string, any>,
    status: 'success' | 'error' | 'warning' = 'success',
    errorMessage?: string
  ): Promise<void> {
    try {
      const log: NFeAuditLog = {
        id: this.generateId(),
        operation,
        userId: this.getCurrentUserId(),
        userEmail: this.getCurrentUserEmail(),
        timestamp: new Date(),
        details,
        status,
        message: this.getDefaultMessage(operation, status),
        errorMessage,
        nfeKey: details.nfeKey,
        saleId: details.saleId,
        invoiceNumber: details.invoiceNumber,
        environment: details.environment as any,
        duration: details.duration,
        ip: details.ip,
        userAgent: details.userAgent
      };

      // Armazenar em memória (poderia ser Firebase/DB no futuro)
      this.logs.push(log);
      
      // Manter apenas os logs recentes em memória
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }

      // Para erros críticos, também log no console
      if (status === 'error') {
        console.error(`[NF-e Audit] ${operation}:`, { log, errorMessage });
      }

      // Log no localStorage para persistência básica
      this.saveToLocalStorage(log);

    } catch (error) {
      console.error('[NF-e Audit] Failed to log operation:', error);
    }
  }

  /**
   * Registra início de emissão
   */
  async logEmissionStart(
    sale: Sale,
    invoiceNumber: string,
    environment: string
  ): Promise<void> {
    await this.logOperation('emission_started', {
      saleId: sale.id,
      saleTotal: sale.total,
      customerCpfCnpj: sale.customerCPF || sale.customerId,
      invoiceNumber,
      environment,
      itemsCount: sale.items.length
    });
  }

  /**
   * Registra sucesso na emissão
   */
  async logEmissionSuccess(
    result: NFeEmissionResult,
    duration: number,
    saleId: string
  ): Promise<void> {
    await this.logOperation('emission_success', {
      nfeKey: result.chave,
      saleId,
      invoiceNumber: result.numero,
      environment: result.success ? 'producao' : 'homologacao',
      protocol: result.protocolo,
      duration,
      xmlData: result.xml ? 'present' : 'missing'
    }, 'success', undefined);
  }

  /**
   * Registra falha na emissão
   */
  async logEmissionFailed(
    error: Error | string,
    saleId: string,
    environment: string,
    duration?: number
  ): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    await this.logOperation('emission_failed', {
      saleId,
      environment,
      duration,
      errorType: this.categorizeError(errorMessage)
    }, 'error', errorMessage);
  }

  /**
   * Registra retry na emissão
   */
  async logEmissionRetry(
    saleId: string,
    attemptNumber: number,
    maxAttempts: number,
    lastError?: string
  ): Promise<void> {
    await this.logOperation('emission_retry', {
      saleId,
      attemptNumber,
      maxAttempts,
      lastError
    }, 'warning');
  }

  /**
   * Registra atualização de configuração
   */
  async logConfigUpdate(
    config: Partial<NFePDVConfig>,
    userId?: string
  ): Promise<void> {
    await this.logOperation('config_updated', {
      fieldsUpdated: Object.keys(config),
      hasCertificate: !!config.certificado,
      environment: config.ambiente,
      companyName: config.emitente?.razaoSocial
    });
  }

  /**
   * Registra teste de configuração
   */
  async logConfigTest(
    success: boolean,
    environment: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logOperation('config_tested', {
      environment,
      success
    }, success ? 'success' : 'error', errorMessage);
  }

  /**
   * Registra consulta de NF-e
   */
  async logNFeConsulta(
    nfeKey: string,
    userId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logOperation('nfe_consulted', {
      nfeKey
    }, success ? 'success' : 'error', errorMessage);
  }

  /**
   * Busca logs de auditoria com filtros
   */
  async getAuditLogs(filters: {
    operation?: NFeAuditOperation;
    userId?: string;
    status?: 'success' | 'error' | 'warning';
    environment?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<NFeAuditLog[]> {
    try {
      let filteredLogs = [...this.logs];

      // Carregar do localStorage para complementar
      const localLogs = this.loadFromLocalStorage();
      filteredLogs = [...filteredLogs, ...localLogs];

      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Aplicar filtros
      if (filters.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }
      if (filters.environment) {
        filteredLogs = filteredLogs.filter(log => log.environment === filters.environment);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filters.endDate!);
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }

      return filteredLogs;

    } catch (error) {
      console.error('[NF-e Audit] Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Gera resumo estatístico
   */
  async getAuditSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<NFeAuditSummary> {
    try {
      const logs = await this.getAuditLogs({
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 dias
        endDate: endDate || new Date()
      });

      const summary: NFeAuditSummary = {
        totalOperations: logs.length,
        successfulEmissions: logs.filter(l => l.operation === 'emission_success').length,
        failedEmissions: logs.filter(l => l.operation === 'emission_failed').length,
        successRate: 0,
        averageEmissionTime: 0,
        errorDistribution: {},
        operationsByUser: {}
      };

      // Calcular taxa de sucesso
      const totalEmissions = summary.successfulEmissions + summary.failedEmissions;
      if (totalEmissions > 0) {
        summary.successRate = (summary.successfulEmissions / totalEmissions) * 100;
      }

      // Calcular tempo médio de emissão
      const emissionTimes = logs
        .filter(l => l.operation === 'emission_success' && l.duration)
        .map(l => l.duration!);
      
      if (emissionTimes.length > 0) {
        summary.averageEmissionTime = emissionTimes.reduce((a, b) => a + b, 0) / emissionTimes.length;
      }

      // Distribuição de erros
      logs
        .filter(l => l.status === 'error')
        .forEach(l => {
          const errorType = this.categorizeError(l.errorMessage || 'Unknown error');
          summary.errorDistribution[errorType] = (summary.errorDistribution[errorType] || 0) + 1;
        });

      // Operações por usuário
      logs.forEach(l => {
        if (l.userEmail) {
          summary.operationsByUser[l.userEmail] = (summary.operationsByUser[l.userEmail] || 0) + 1;
        }
      });

      // Última emissão
      const lastEmissionLog = logs.find(l => l.operation === 'emission_success');
      summary.lastEmission = lastEmissionLog?.timestamp;

      return summary;

    } catch (error) {
      console.error('[NF-e Audit] Failed to get audit summary:', error);
      return {
        totalOperations: 0,
        successfulEmissions: 0,
        failedEmissions: 0,
        successRate: 0,
        averageEmissionTime: 0,
        errorDistribution: {},
        operationsByUser: {}
      };
    }
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.maxLogRetention);

      const beforeCount = this.logs.length;
      this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
      const afterCount = this.logs.length;

      // Limpar localStorage também
      const localLogs = this.loadFromLocalStorage();
      const filteredLocalLogs = localLogs.filter(log => new Date(log.timestamp) > cutoffDate);
      localStorage.setItem('nfe_audit_logs', JSON.stringify(filteredLocalLogs));

      console.log(`[NF-e Audit] Cleaned up ${beforeCount - afterCount} old logs`);

    } catch (error) {
      console.error('[NF-e Audit] Failed to cleanup old logs:', error);
    }
  }

  /**
   * Exporta logs para CSV/JSON
   */
  async exportLogs(
    format: 'csv' | 'json',
    filters?: any
  ): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filters);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      // CSV format
      const headers = [
        'Data/Hora',
        'Operação',
        'Usuário',
        'Status',
        'Chave NF-e',
        'Nº Nota',
        'Ambiente',
        'Duração (ms)',
        'Mensagem',
        'Erro'
      ];

      const rows = logs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.operation,
        log.userEmail || '',
        log.status,
        log.nfeKey || '',
        log.invoiceNumber || '',
        log.environment || '',
        log.duration || '',
        `"${log.message || ''}"`,
        `"${log.errorMessage || ''}"`
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');

    } catch (error) {
      console.error('[NF-e Audit] Failed to export logs:', error);
      throw error;
    }
  }

  /**
   * Helper: Gera ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Helper: Obtém ID do usuário atual (simulação)
   */
  private getCurrentUserId(): string | undefined {
    // Aqui poderia obter do auth context
    return typeof window !== 'undefined' ? localStorage.getItem('userId') || undefined : undefined;
  }

  /**
   * Helper: Obtém email do usuário atual (simulação)
   */
  private getCurrentUserEmail(): string | undefined {
    // Aqui poderia obter do auth context
    return typeof window !== 'undefined' ? localStorage.getItem('userEmail') || undefined : undefined;
  }

  /**
   * Helper: Salva no localStorage
   */
  private saveToLocalStorage(log: NFeAuditLog): void {
    if (typeof window === 'undefined') return;
    
    try {
      const localLogs = this.loadFromLocalStorage();
      localLogs.push(log);
      
      // Manter apenas os 500 logs mais recentes no localStorage
      if (localLogs.length > 500) {
        localLogs.splice(0, localLogs.length - 500);
      }
      
      localStorage.setItem('nfe_audit_logs', JSON.stringify(localLogs));
    } catch (error) {
      console.error('[NF-e Audit] Failed to save to localStorage:', error);
    }
  }

  /**
   * Helper: Carrega do localStorage
   */
  private loadFromLocalStorage(): NFeAuditLog[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem('nfe_audit_logs');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[NF-e Audit] Failed to load from localStorage:', error);
      return [];
    }
  }

  /**
   * Helper: Mensagem padrão para operações
   */
  private getDefaultMessage(
    operation: NFeAuditOperation,
    status: 'success' | 'error' | 'warning'
  ): string {
    const messages: Record<NFeAuditOperation, Record<string, string>> = {
      emission_started: {
        success: 'Iniciada emissão de NF-e',
        error: 'Falha ao iniciar emissão de NF-e',
        warning: 'Início de emissão de NF-e'
      },
      emission_success: {
        success: 'NF-e emitida com sucesso',
        error: '',
        warning: ''
      },
      emission_failed: {
        success: '',
        error: 'Falha na emissão de NF-e',
        warning: ''
      },
      emission_retry: {
        success: '',
        error: '',
        warning: 'Tentando reemitir NF-e'
      },
      config_updated: {
        success: 'Configuração NF-e atualizada',
        error: 'Falha ao atualizar configuração',
        warning: ''
      },
      config_tested: {
        success: 'Teste de configuração bem-sucedido',
        error: 'Teste de configuração falhou',
        warning: ''
      },
      nfe_consulted: {
        success: 'NF-e consultada com sucesso',
        error: 'Falha ao consultar NF-e',
        warning: ''
      },
      nfe_cancelled: {
        success: 'NF-e cancelada com sucesso',
        error: 'Falha ao cancelar NF-e',
        warning: ''
      },
      nfe_inutilized: {
        success: 'Numeração inutilizada com sucesso',
        error: 'Falha ao inutilizar numeração',
        warning: ''
      },
      certificate_imported: {
        success: 'Certificado digital importado',
        error: 'Falha ao importar certificado',
        warning: ''
      },
      user_authenticated: {
        success: 'Usuário autenticado',
        error: 'Falha na autenticação',
        warning: ''
      }
    };

    return messages[operation]?.[status] || `${operation} - ${status}`;
  }

  /**
   * Helper: Categoriza tipos de erro
   */
  private categorizeError(errorMessage: string): string {
    const message = errorMessage.toLowerCase();

    if (message.includes('certificado') || message.includes('certificate')) {
      return 'Certificate Error';
    }
    if (message.includes('timeout') || message.includes('conexão') || message.includes('connection')) {
      return 'Connection Error';
    }
    if (message.includes('sefaz') || message.includes('autorização') || message.includes('rejeitada')) {
      return 'SEFAZ Rejection';
    }
    if (message.includes('validação') || message.includes('validation') || message.includes('schema')) {
      return 'Validation Error';
    }
    if (message.includes('memória') || message.includes('memory') || message.includes('espaco')) {
      return 'Resource Error';
    }

    return 'General Error';
  }
}

// Instância singleton
export const nfeAudit = new NFeAuditService();

// Export para uso nos serviços
export { NFeAuditService };