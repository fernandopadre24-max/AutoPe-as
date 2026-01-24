/**
 * Ponto de entrada principal para módulo NFe
 * Exporta todos os tipos, serviços e utilitários
 */

// Tipos
export type {
  NFeWizardConfig,
  NFeEmissionData,
  LayoutNFe,
  InfNFe,
  Ide,
  Emit,
  EnderEmit,
  Dest,
  EnderDest,
  DetProd,
  Prod,
  Imposto,
  ICMS,
  ICMS00,
  ICMS40,
  IPI,
  PIS,
  PISAliq,
  PISNT,
  COFINS,
  COFINSAliq,
  COFINSNT,
  II,
  ISSQN,
  Total,
  ICMSTot,
  Transp,
  Transporta,
  RetTransp,
  VeicTransp,
  Vol,
  Pag,
  DetPag,
  Card,
  InfAdic,
  InfNFeSupl,
  NFePDVConfig,
  ProdutoFiscal,
  ClienteFiscal,
  PagamentoFiscal,
  EmissaoNFEDTO,
  NFeEmissionResult,
  NFeConsultaResult,
  NFeStatusResult,
} from './types.js';

// Serviços
export { NFeConfigService, nfeConfigService } from './config.js';

// Constantes
export {
  CODIGOS_PAGAMENTO,
  MODALIDADE_FRETE,
  TIPOS_AMBIENTE,
  TIPOS_DOCUMENTO,
} from './types.js';