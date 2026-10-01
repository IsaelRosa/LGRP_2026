/* Catálogos institucionais do LGRP — usados em formulários, filtros e relatórios */

export const LABORATORIOS = [
  'Lab. de Química Analítica',
  'Lab. de Química Orgânica',
  'Lab. de Química Inorgânica',
  'Lab. de Físico-Química',
  'Lab. de Bioquímica',
  'Lab. de Microbiologia',
  'Lab. de Cromatografia',
  'Lab. de Espectrometria de Massas',
  'Lab. de Ensino de Graduação',
  'Central Analítica Multiusuária',
  'Farmácia Universitária',
  'Lab. de Toxicologia Ambiental',
];

export const TIPOS_RESIDUO = [
  'Solvente Orgânico Halogenado',
  'Solvente Orgânico Não Halogenado',
  'Ácido Inorgânico',
  'Base Inorgânica',
  'Sal de Metal Pesado',
  'Resíduo com Cianeto',
  'Resíduo Orgânico Aquoso',
  'Óleo Lubrificante Usado',
  'Reagente Vencido',
  'Vidraria Contaminada',
  'Resíduo Biológico (Grupo A)',
  'Resíduo Perfurocortante (Grupo E)',
  'Lâmpadas Fluorescentes',
  'Pilhas e Baterias',
  'Resíduo Radioativo de Baixa Atividade',
];

export const GRUPOS = [
  'Halogenados',
  'Não Halogenados',
  'Ácidos',
  'Bases',
  'Metais Pesados',
  'Cianetos',
  'Orgânicos Aquosos',
  'Óleos e Graxas',
  'Biológicos',
  'Perfurocortantes',
  'Especiais',
];

export const CLASSES = [
  'Classe I — Perigoso',
  'Classe II-A — Não Inerte',
  'Classe II-B — Inerte',
  'Grupo A — Biológico',
  'Grupo B — Químico',
  'Grupo D — Comum',
  'Grupo E — Perfurocortante',
];

export const EMBALAGENS = [
  'Bombona plástica 20 L',
  'Bombona plástica 50 L',
  'Tambor metálico 200 L',
  'Tambor plástico 200 L',
  'Frasco de vidro âmbar 1 L',
  'Frasco de vidro 5 L',
  'Caixa coletora perfurocortante 7 L',
  'Saco branco leitoso 100 L',
  'Contentor IBC 1000 L',
];

export const STATUS_PEDIDO = [
  'Solicitado',
  'Agendado',
  'Coletado',
  'Em Tratamento',
  'Destinado',
  'Cancelado',
];

export const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'];

export const UNIDADES = ['kg', 'L', 'g', 'mL', 'un'];

export const METODOS_TRATAMENTO = [
  'Incineração',
  'Neutralização Ácido-Base',
  'Destilação / Recuperação',
  'Precipitação Química',
  'Oxidação Química',
  'Redução Química',
  'Encapsulamento / Solidificação',
  'Coprocessamento',
  'Aterro Classe I',
  'Autoclavagem',
  'Desativação Térmica',
];

export const STATUS_TRATAMENTO = ['Agendado', 'Em Andamento', 'Concluído', 'Cancelado'];

export const DESTINOS_FINAIS = [
  'Essencis Ambiental S.A.',
  'Ambiental Santos Brasil Ltda.',
  'Cetrei Resíduos Industriais',
  'Hazard Control Destinação S.A.',
  'Aterro Classe I — Unidade Campus',
  'Recuperação Interna LGRP',
  'Votorantim Cimentos (Coprocessamento)',
];

export const CATEGORIAS_SOLVENTE = ['Não Halogenado', 'Halogenado', 'Mistura de Solventes'];

export const STATUS_SOLVENTE = [
  'Em Estoque',
  'Em Uso',
  'Esgotado',
  'Enviado para Recuperação',
  'Recuperado',
  'Descartado',
];

export const CLASSES_RISCO = [
  'Corrosivo',
  'Inflamável',
  'Tóxico',
  'Oxidante',
  'Nocivo',
  'Irritante',
  'Cancerígeno',
  'Reativo',
];

export const STATUS_REAGENTE = [
  'Ativo',
  'Em Uso',
  'Esgotado',
  'Vencido',
  'Segregado para Coleta',
  'Descartado',
];

export const TIPOS_VIDRARIA = [
  'Béquer',
  'Erlenmeyer',
  'Balão Volumétrico',
  'Balão de Fundo Redondo',
  'Proveta',
  'Pipeta Volumétrica',
  'Pipeta Graduada',
  'Funil de Separação',
  'Funil de Büchner',
  'Placa de Petri',
  'Tubo de Ensaio',
  'Vidro de Relógio',
  'Dessecador',
  'Kitassato',
  'Condensador',
  'Frasco de Reagente',
];

export const NIVEIS_CONTAMINACAO = ['Baixo', 'Médio', 'Alto', 'Crítico'];

export const METODOS_DESCONTAMINACAO = [
  'Lavagem com detergente neutro',
  'Enxágue com água destilada',
  'Banho ácido (HNO₃ 10%)',
  'Banho de solução sulfocrômica',
  'Enxágue com solvente orgânico',
  'Autoclavagem (121 °C / 30 min)',
  'Neutralização prévia',
  'Descarte como resíduo químico',
];

export const STATUS_VIDRARIA = [
  'Aguardando Descontaminação',
  'Em Descontaminação',
  'Descontaminada',
  'Reaproveitada',
  'Descartada',
];

export const PAPEIS = [
  'Administrador',
  'Químico Responsável',
  'Gestor Ambiental',
  'Técnico de Laboratório',
  'Consultor',
];

export const LOCAIS_ARMAZENAMENTO = [
  'Abrigo de Resíduos Perigosos — Bloco A',
  'Abrigo de Resíduos Perigosos — Bloco B',
  'Central de Triagem LGRP',
  'Almoxarifado Central',
  'Sala de Solventes 104',
  'Sala de Reagentes 112',
  'Área de Descontaminação 07',
];

export const RISCOS = [
  'Inflamabilidade',
  'Corrosividade',
  'Toxicidade aguda',
  'Toxicidade crônica',
  'Reatividade com água',
  'Liberação de gases tóxicos',
  'Risco biológico',
  'Radioatividade',
  'Nenhum risco relevante',
];

export const VEICULOS = [
  'Caminhonete LGRP-01',
  'Carrinho hidráulico fechado',
  'Veículo utilitário da Prefeitura do Campus',
  'Transporte manual com contentor',
];

export const FABRICANTES = [
  'Merck / Sigma-Aldrich',
  'Vetec',
  'Dinâmica Química',
  'Impex',
  'Synth',
  'Quimis',
  'Neon Comercial',
  'J.T. Baker',
];

/* ------------------------------------------------------------------ */
/* Mapas de cor                                                        */
/* ------------------------------------------------------------------ */

export type Tone =
  | 'verde'
  | 'azul'
  | 'ambar'
  | 'vermelho'
  | 'cinza'
  | 'roxo'
  | 'ciano';

export const STATUS_PEDIDO_TONE: Record<string, Tone> = {
  Solicitado: 'ambar',
  Agendado: 'azul',
  Coletado: 'ciano',
  'Em Tratamento': 'roxo',
  Destinado: 'verde',
  Cancelado: 'cinza',
};

export const PRIORIDADE_TONE: Record<string, Tone> = {
  Baixa: 'cinza',
  Média: 'azul',
  Alta: 'ambar',
  Crítica: 'vermelho',
};

export const STATUS_TRATAMENTO_TONE: Record<string, Tone> = {
  Agendado: 'ambar',
  'Em Andamento': 'azul',
  Concluído: 'verde',
  Cancelado: 'cinza',
};

export const STATUS_SOLVENTE_TONE: Record<string, Tone> = {
  'Em Estoque': 'verde',
  'Em Uso': 'azul',
  Esgotado: 'cinza',
  'Enviado para Recuperação': 'ambar',
  Recuperado: 'ciano',
  Descartado: 'vermelho',
};

export const SITUACAO_TONE: Record<string, Tone> = {
  Vencido: 'vermelho',
  'A vencer': 'ambar',
  Atenção: 'ambar',
  Válido: 'verde',
  Regular: 'verde',
  'Estoque baixo': 'ambar',
  Esgotado: 'cinza',
  'Sem validade': 'cinza',
};

export const STATUS_REAGENTE_TONE: Record<string, Tone> = {
  Ativo: 'verde',
  'Em Uso': 'azul',
  Esgotado: 'cinza',
  Vencido: 'vermelho',
  'Segregado para Coleta': 'ambar',
  Descartado: 'cinza',
};

export const STATUS_VIDRARIA_TONE: Record<string, Tone> = {
  'Aguardando Descontaminação': 'ambar',
  'Em Descontaminação': 'azul',
  Descontaminada: 'verde',
  Reaproveitada: 'ciano',
  Descartada: 'cinza',
};

export const NIVEL_TONE: Record<string, Tone> = {
  Baixo: 'verde',
  Médio: 'ambar',
  Alto: 'ambar',
  Crítico: 'vermelho',
};

export const RISCO_TONE: Record<string, Tone> = {
  Corrosivo: 'ambar',
  Inflamável: 'vermelho',
  Tóxico: 'vermelho',
  Oxidante: 'ambar',
  Nocivo: 'ambar',
  Irritante: 'azul',
  Cancerígeno: 'roxo',
  Reativo: 'vermelho',
};

export const PAPEL_TONE: Record<string, Tone> = {
  Administrador: 'roxo',
  'Químico Responsável': 'verde',
  'Gestor Ambiental': 'azul',
  'Técnico de Laboratório': 'ciano',
  Consultor: 'cinza',
  Sistema: 'cinza',
};

export const SEVERIDADE_TONE: Record<string, Tone> = {
  critica: 'vermelho',
  aviso: 'ambar',
  info: 'azul',
  sucesso: 'verde',
};

export const SEVERIDADE_LABEL: Record<string, string> = {
  critica: 'Crítica',
  aviso: 'Aviso',
  info: 'Informação',
  sucesso: 'Sucesso',
};

export const ACAO_TONE: Record<string, Tone> = {
  INSERT: 'verde',
  UPDATE: 'azul',
  DELETE: 'vermelho',
};

export const ACAO_LABEL: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
};

/** Paleta para gráficos */
export const PALETA = [
  '#1f6e4f',
  '#2484b4',
  '#d97a1c',
  '#7c5cbf',
  '#2f8a64',
  '#c02c3a',
  '#44a0cd',
  '#eab15d',
  '#4a6159',
  '#0f9b8e',
  '#a12131',
  '#82c4a5',
];

export const ROTULO_CAMPO: Record<string, string> = {
  codigo: 'Código',
  laboratorio: 'Laboratório / Setor',
  solicitante: 'Solicitante',
  usuario_id: 'Usuário vinculado',
  tipo_residuo: 'Tipo de Resíduo',
  grupo: 'Grupo',
  classe: 'Classe',
  quantidade_estimada: 'Quantidade estimada',
  unidade: 'Unidade',
  embalagem: 'Embalagem',
  local_coleta: 'Local de coleta',
  data_solicitacao: 'Data da solicitação',
  data_prevista: 'Data prevista',
  data_coleta: 'Data da coleta',
  status: 'Status',
  prioridade: 'Prioridade',
  responsavel: 'Responsável',
  risco: 'Risco associado',
  observacoes: 'Observações',
  pedido_id: 'Pedido vinculado',
  coletor: 'Coletor',
  equipe: 'Equipe',
  peso_kg: 'Peso (kg)',
  volume_l: 'Volume (L)',
  unidades: 'Unidades',
  destino_temporario: 'Destino temporário',
  veiculo: 'Veículo',
  mtr: 'MTR',
  residuo: 'Resíduo',
  metodo: 'Método',
  quantidade_entrada: 'Quantidade de entrada',
  quantidade_saida: 'Quantidade de saída',
  eficiencia: 'Eficiência (%)',
  data_inicio: 'Data de início',
  data_conclusao: 'Data de conclusão',
  operador: 'Operador',
  responsavel_tecnico: 'Responsável técnico',
  destino_final: 'Destino final',
  cnpj_destinador: 'CNPJ do destinador',
  certificado: 'Certificado (CDF)',
  custo: 'Custo (R$)',
  nome: 'Nome',
  formula: 'Fórmula',
  cas: 'Nº CAS',
  categoria: 'Categoria',
  pureza: 'Pureza (%)',
  volume_total_l: 'Volume total (L)',
  volume_restante_l: 'Volume restante (L)',
  volume_recuperado_l: 'Volume recuperado (L)',
  localizacao: 'Localização',
  data_recebimento: 'Data de recebimento',
  data_validade: 'Data de validade',
  inflamavel: 'Inflamável',
  fabricante: 'Fabricante',
  lote: 'Lote',
  quantidade: 'Quantidade',
  classe_risco: 'Classe de risco',
  data_aquisicao: 'Data de aquisição',
  tipo: 'Tipo',
  contaminante: 'Contaminante',
  classe_contaminante: 'Classe do contaminante',
  nivel_contaminacao: 'Nível de contaminação',
  data_registro: 'Data de registro',
  data_descontaminacao: 'Data de descontaminação',
  metodo_descontaminacao: 'Método de descontaminação',
  destino: 'Destino',
  email: 'E-mail',
  papel: 'Papel',
  setor: 'Setor',
  crq: 'Registro CRQ',
  telefone: 'Telefone',
  ativo: 'Ativo',
  mes: 'Mês',
  ano: 'Ano',
  acidentes: 'Acidentes',
  treinamentos: 'Treinamentos',
  custo_operacional: 'Custo operacional (R$)',
  destinacao_correta_pct: 'Destinação correta (%)',
  titulo: 'Título',
  mensagem: 'Mensagem',
  severidade: 'Severidade',
  lida: 'Lida',
};

export function rotuloCampo(campo: string): string {
  return ROTULO_CAMPO[campo] || campo.replace(/_/g, ' ');
}
