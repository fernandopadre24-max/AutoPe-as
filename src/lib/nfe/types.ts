/**
 * Tipos para integração NF-e no PDV
 * Baseado na biblioteca NFeWizard-io com extensões personalizadas
 */

// Tipos básicos da biblioteca NFeWizard
export interface NFeWizardConfig {
  dfe: {
    pathCertificado: string;
    senhaCertificado: string;
    UF: string;
    CPFCNPJ: string;
    armazenarXMLAutorizacao: boolean;
    pathXMLAutorizacao: string;
  };
  nfe: {
    ambiente: 1 | 2; // 1=Produção, 2=Homologação
    versaoDF: "4.00";
  };
  lib: {
    log: {
      exibirLogNoConsole: boolean;
      armazenarLogs: boolean;
      pathLogs: string;
    };
  };
}

export interface NFeEmissionData {
  idLote: number;
  indSinc: 0 | 1; // 0=Assíncrono, 1=Síncrono
  NFe: LayoutNFe | LayoutNFe[];
  protNFe?: any;
}

export interface LayoutNFe {
  infNFe: InfNFe;
  infNFeSupl?: InfNFeSupl;
  Signature?: any;
}

export interface InfNFe {
  versao: "4.00";
  Id?: string;
  ide: Ide;
  emit: Emit;
  dest?: Dest;
  det: DetProd | DetProd[];
  total: Total;
  transp: Transp;
  pag: Pag;
  // Campos opcionais comuns
  infAdic?: InfAdic;
}

// Identificação da NF-e
export interface Ide {
  cUF: number;
  cNF: string;
  natOp: string;
  mod: 55 | 65; // 55=NF-e, 65=NFC-e
  serie: string;
  nNF: number;
  dhEmi: string; // ISO datetime
  tpNF: 0 | 1; // 0=Entrada, 1=Saída
  idDest: 1 | 2 | 3; // 1=Interna, 2=Interestadual, 3=Exterior
  cMunFG: number;
  tpImp: 1 | 4 | 5; // 1=DANFE normal, 4=DANFE简化, 5=DANF-e
  tpEmis: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  tpAmb: 1 | 2; // 1=Produção, 2=Homologação
  finNFe: 1 | 2 | 3 | 4; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  indFinal: 0 | 1; // 0=Não, 1=Consumidor final
  indPres: 0 | 1 | 2 | 4 | 5 | 9; // 0=Não se aplica, 1=Operação presencial
  procEmi: 0 | 1 | 2 | 3; // 0=Emissão com aplicativo contribuinte
  verProc: string;
  dhCont?: string;
  xJust?: string;
}

// Emitente
export interface Emit {
  CNPJCPF: string;
  xNome: string;
  xFant?: string;
  enderEmit: EnderEmit;
  IE: string;
  IEST?: string;
  IM?: string;
  CNAE?: string;
  CRT: 1 | 2 | 3; // 1=Simples Nacional, 2=Simples Nacional excesso sublimite, 3=Regime Normal
}

export interface EnderEmit {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: number;
  xMun: string;
  UF: string;
  CEP: string;
  cPais?: number;
  xPais?: string;
  fone?: string;
}

// Destinatário
export interface Dest {
  CNPJCPF?: string;
  idEstrangeiro?: string;
  xNome?: string;
  enderDest?: EnderDest;
  indIEDest: 1 | 2 | 9; // 1=Contribuinte ICMS, 2=Contribuinte isento, 9=Não contribuinte
  IE?: string;
  ISUF?: string;
  email?: string;
}

export interface EnderDest {
  xLgr: string;
  nro: string;
  xCpl?: string;
  xBairro: string;
  cMun: number;
  xMun: string;
  UF: string;
  CEP?: string;
  cPais?: number;
  xPais?: string;
  fone?: string;
}

// Produtos
export interface DetProd {
  nItem: number;
  prod: Prod;
  imposto: Imposto;
  infAdProd?: string;
}

export interface Prod {
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  CEST?: string;
  indTotal: 0 | 1;
  // Campos para produtos
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  cEANTrib: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  vFrete?: number;
  vSeg?: number;
  vDesc?: number;
  vOutro?: number;
  indDesc: 0 | 1;
  // Campos opcionais
  xPed?: string;
  nItemPed?: string;
  nFCI?: string;
}

// Impostos
export interface Imposto {
  vICMS?: number;
  vICMSST?: number;
  ICMS: ICMS;
  IPI?: IPI;
  II?: II;
  PIS: PIS;
  COFINS: COFINS;
  ISSQN?: ISSQN;
}

export interface ICMS {
  ICMS00?: ICMS00;
  ICMS10?: any;
  ICMS20?: any;
  ICMS30?: any;
  ICMS40?: ICMS40;
  ICMS51?: any;
  ICMS60?: any;
  ICMS70?: any;
  ICMS90?: any;
  ICMSST?: any;
}

export interface ICMS00 {
  orig: 0 | 1 | 2 | 3;
  CST: string;
  modBC: 0 | 1 | 2 | 3;
  vBC: number;
  pICMS: number;
  vICMS: number;
}

export interface ICMS40 {
  orig: 0 | 1 | 2 | 3;
  CST: string;
  vICMS: number;
  motDesICMS?: number;
}

export interface IPI {
  IPITrib?: any;
  IPINT?: any;
}

export interface IPINT {
  CST: string;
}

export interface PIS {
  PISAliq?: PISAliq;
  PISNT?: PISNT;
}

export interface PISAliq {
  CST: string;
  vBC: number;
  pPIS: number;
  vPIS: number;
}

export interface PISNT {
  CST: string;
}

export interface COFINS {
  COFINSAliq?: COFINSAliq;
  COFINSNT?: COFINSNT;
}

export interface COFINSAliq {
  CST: string;
  vBC: number;
  pCOFINS: number;
  vCOFINS: number;
}

export interface COFINSNT {
  CST: string;
}

export interface II {
  vBC: number;
  vDespAdu: number;
  vII: number;
  vIOF: number;
}

export interface ISSQN {
  vBC: number;
  vAliq: number;
  vISSQN: number;
  cMunFG: number;
  cListServ: string;
}

// Totais
export interface Total {
  ICMSTot: ICMSTot;
}

export interface ICMSTot {
  vBC: number;
  vICMS: number;
  vICMSDeson: number;
  vFCP: number;
  vBCST: number;
  vST: number;
  vFCPST: number;
  vFCPSTRet: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vII: number;
  vIPI: number;
  vIPIDevol: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
  vTotTrib?: number;
}

// Transporte
export interface Transp {
  modFrete: 0 | 1 | 2 | 3 | 4 | 9;
  transporta?: Transporta;
  retTransp?: RetTransp;
  veicTransp?: VeicTransp;
  vol?: Vol[];
}

export interface Transporta {
  CNPJCPF?: string;
  xNome?: string;
  IE?: string;
  xEnder?: string;
  xMun?: string;
  UF?: string;
}

export interface RetTransp {
  vServ: number;
  vBCRet: number;
  pICMSRet: number;
  vICMSRet: number;
  CFOP: string;
  cMunFG: number;
}

export interface VeicTransp {
  placa: string;
  UF: string;
  RNTC?: string;
}

export interface Vol {
  qVol: number;
  esp: string;
  marca?: string;
  nVol?: string;
  pesoL?: number;
  pesoB?: number;
}

// Pagamento
export interface Pag {
  detPag: DetPag[];
  vTroco?: number;
}

export interface DetPag {
  indPag: 0 | 1;
  tPag: string;
  vPag: number;
  card?: Card;
}

export interface Card {
  tpIntegra: 1 | 2;
  CNPJ?: string;
  tBand?: string;
  cAut?: string;
  CNPJBandeira?: string;
}

// Informações adicionais
export interface InfAdic {
  infAdFisco?: string;
  infCpl?: string;
}

export interface InfNFeSupl {
  qrCode?: string;
  urlChave?: string;
}

// Tipos personalizados para PDV
export interface NFePDVConfig {
  emitente: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    inscricaoEstadual: string;
    regimetributario: 1 | 2 | 3; // CRT
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: number;
      municipio: string;
      uf: string;
      cep: string;
      telefone?: string;
    };
  };
  ambiente: 'homologacao' | 'producao';
  certificado: {
    caminhoArquivo: string;
    senha: string;
  };
  diretorios: {
    xmlAutorizadas: string;
    logs: string;
  };
}

export interface ProdutoFiscal {
  produto: {
    id: string;
    nome: string;
    codigo: string;
    unidade: string;
  };
  fiscal: {
    ncm: string;
    cest?: string;
    cfop: string;
    icms: {
      cst: string;
      aliquota: number;
      baseCalculo: number;
      valor: number;
    };
    pis: {
      cst: string;
      aliquota?: number;
      baseCalculo?: number;
      valor?: number;
    };
    cofins: {
      cst: string;
      aliquota?: number;
      baseCalculo?: number;
      valor?: number;
    };
  };
}

export interface ClienteFiscal {
  id?: string;
  nome: string;
  documento: string; // CPF ou CNPJ
  tipo: 'cpf' | 'cnpj';
  indicadorIEDestinatario: 1 | 2 | 9;
  inscricaoEstadual?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    bairro: string;
    codigoMunicipio: number;
    municipio: string;
    uf: string;
    cep?: string;
  };
}

export interface PagamentoFiscal {
  forma: string; // código do tPag
  valor: number;
  troco?: number;
  cartao?: {
    integracao: 1 | 2; // 1=Integrado, 2=Não integrado
    bandeira?: string;
    autorizacao?: string;
  };
}

export interface EmissaoNFEDTO {
  serie: string;
  numeroNota: number;
  naturezaOperacao: string;
  cliente: ClienteFiscal;
  produtos: ProdutoFiscal[];
  pagamentos: PagamentoFiscal[];
  modalidadeFrete: 0 | 1 | 2 | 3 | 4 | 9;
  informacoesAdicionais?: string;
  informacoesFisco?: string;
}

// Resultados
export interface NFeEmissionResult {
  success: boolean;
  chave?: string;
  numero?: string;
  protocolo?: string;
  dataAutorizacao?: string;
  xml?: string;
  danfe?: string;
  erros?: string[];
  avisos?: string[];
}

export interface NFeConsultaResult {
  existe: boolean;
  autorizada: boolean;
  chave?: string;
  numero?: string;
  protocolo?: string;
  dataAutorizacao?: string;
  xml?: string;
  danfe?: string;
  situacao?: string;
  motivo?: string;
}

// Status do serviço
export interface NFeStatusResult {
  status: boolean;
  motivo?: string;
  dataRetorno?: string;
  uf?: string;
  versao?: string;
  ambiente?: number;
}

// Códigos padrão
export const CODIGOS_PAGAMENTO = {
  DINHEIRO: '01',
  CHEQUE: '02',
  CARTAO_CREDITO: '03',
  CARTAO_DEBITO: '04',
  CREDITO_LOJA: '05',
  VALE_ALIMENTACAO: '10',
  VALE_REFEICAO: '11',
  VALE_PRESENTE: '12',
  VALE_COMBUSTIVEL: '13',
  DUPLICATA_MERCANTIL: '14',
  BOLETO_BANCARIO: '15',
  DEPOSITO_BANCARIO: '16',
  PAGAMENTO_INSTANTANEO_PIX: '17',
  TRANSFERENCIA_BANCARIA: '18',
  PROGRAMA_FIDELIDADE: '19',
  SISPAG: '20',
  OUTROS: '99',
} as const;

export const MODALIDADE_FRETE = {
  EMITENTE: 0,
  DESTINATARIO: 1,
  TERCEIROS: 2,
  PROPRIO_REMETENTE: 3,
  PROPRIO_DESTINATARIO: 4,
  SEM_TRANSPORTE: 9,
} as const;

export const TIPOS_AMBIENTE = {
  HOMOLOGACAO: 2,
  PRODUCAO: 1,
} as const;

export const TIPOS_DOCUMENTO = {
  NF_E: 55,
  NFC_E: 65,
} as const;