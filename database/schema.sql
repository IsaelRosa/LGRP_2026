CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  papel VARCHAR(80) NOT NULL DEFAULT 'Técnico de Laboratório',
  setor VARCHAR(180) NOT NULL DEFAULT '',
  crq VARCHAR(80) NOT NULL DEFAULT '',
  telefone VARCHAR(40) NOT NULL DEFAULT '',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  auth_id VARCHAR(80) NULL,
  password_hash VARCHAR(255) NULL,
  google_sub VARCHAR(120) NULL,
  password_setup_token_hash CHAR(64) NULL,
  password_setup_token_expires_at DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_google_sub (google_sub),
  UNIQUE KEY uq_usuarios_setup_token (password_setup_token_hash),
  KEY ix_usuarios_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo editável de laboratórios/setores geradores.
-- Os registros antigos mantêm o valor textual em `laboratorio`; esta tabela
-- alimenta os <select> de pedidos, reagentes, solventes e vidrarias.
CREATE TABLE IF NOT EXISTS laboratorio (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  unidade VARCHAR(120) NOT NULL DEFAULT '',
  responsavel VARCHAR(180) NOT NULL DEFAULT '',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_laboratorio_nome (nome),
  KEY ix_laboratorio_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carga inicial do catálogo que antes vivia em src/lib/constants.ts.
INSERT IGNORE INTO `laboratorio` (`nome`) VALUES
  ('Lab. de Química Analítica'),
  ('Lab. de Química Orgânica'),
  ('Lab. de Química Inorgânica'),
  ('Lab. de Físico-Química'),
  ('Lab. de Bioquímica'),
  ('Lab. de Microbiologia'),
  ('Lab. de Cromatografia'),
  ('Lab. de Espectrometria de Massas'),
  ('Lab. de Ensino de Graduação'),
  ('Central Analítica Multiusuária'),
  ('Farmácia Universitária'),
  ('Lab. de Toxicologia Ambiental');

CREATE TABLE IF NOT EXISTS pedidos_coleta (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NULL,
  laboratorio VARCHAR(180) NULL,
  solicitante VARCHAR(180) NULL,
  usuario_id BIGINT UNSIGNED NULL,
  tipo_residuo VARCHAR(180) NULL,
  grupo VARCHAR(120) NULL,
  classe VARCHAR(120) NULL,
  quantidade_estimada DECIMAL(14,3) NULL,
  unidade VARCHAR(30) NULL,
  embalagem VARCHAR(180) NULL,
  local_coleta VARCHAR(180) NULL,
  data_solicitacao DATETIME NULL,
  data_prevista DATETIME NULL,
  data_coleta DATETIME NULL,
  status VARCHAR(80) NULL,
  prioridade VARCHAR(40) NULL,
  responsavel VARCHAR(180) NULL,
  risco TEXT NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_pedidos_data (data_solicitacao),
  KEY ix_pedidos_status (status),
  KEY ix_pedidos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coletas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT UNSIGNED NULL,
  data_coleta DATETIME NULL,
  coletor VARCHAR(180) NULL,
  equipe VARCHAR(180) NULL,
  peso_kg DECIMAL(14,3) NULL,
  volume_l DECIMAL(14,3) NULL,
  unidades INT NULL,
  destino_temporario VARCHAR(180) NULL,
  veiculo VARCHAR(180) NULL,
  mtr VARCHAR(100) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_coletas_pedido (pedido_id),
  KEY ix_coletas_data (data_coleta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tratamentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NULL,
  pedido_id BIGINT UNSIGNED NULL,
  residuo VARCHAR(180) NULL,
  grupo VARCHAR(120) NULL,
  metodo VARCHAR(180) NULL,
  quantidade_entrada DECIMAL(14,3) NULL,
  unidade VARCHAR(30) NULL,
  quantidade_saida DECIMAL(14,3) NULL,
  eficiencia DECIMAL(8,3) NULL,
  data_inicio DATETIME NULL,
  data_conclusao DATETIME NULL,
  operador VARCHAR(180) NULL,
  responsavel_tecnico VARCHAR(180) NULL,
  destino_final VARCHAR(180) NULL,
  cnpj_destinador VARCHAR(30) NULL,
  mtr VARCHAR(100) NULL,
  certificado VARCHAR(120) NULL,
  custo DECIMAL(14,2) NULL,
  status VARCHAR(80) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_tratamentos_data (data_inicio),
  KEY ix_tratamentos_status (status),
  KEY ix_tratamentos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reagentes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NULL,
  nome VARCHAR(180) NULL,
  formula VARCHAR(120) NULL,
  cas VARCHAR(80) NULL,
  fabricante VARCHAR(180) NULL,
  lote VARCHAR(100) NULL,
  quantidade DECIMAL(14,3) NULL,
  unidade VARCHAR(30) NULL,
  laboratorio VARCHAR(180) NULL,
  localizacao VARCHAR(180) NULL,
  classe_risco VARCHAR(120) NULL,
  data_aquisicao DATETIME NULL,
  data_validade DATETIME NULL,
  status VARCHAR(80) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_reagentes_validade (data_validade),
  KEY ix_reagentes_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solventes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NULL,
  nome VARCHAR(180) NULL,
  formula VARCHAR(120) NULL,
  cas VARCHAR(80) NULL,
  categoria VARCHAR(120) NULL,
  pureza DECIMAL(8,3) NULL,
  volume_total_l DECIMAL(14,3) NULL,
  volume_restante_l DECIMAL(14,3) NULL,
  volume_recuperado_l DECIMAL(14,3) NULL,
  embalagem VARCHAR(180) NULL,
  laboratorio VARCHAR(180) NULL,
  localizacao VARCHAR(180) NULL,
  data_recebimento DATETIME NULL,
  data_validade DATETIME NULL,
  status VARCHAR(80) NULL,
  inflamavel TINYINT(1) NULL,
  responsavel VARCHAR(180) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_solventes_validade (data_validade),
  KEY ix_solventes_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vidrarias (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NULL,
  tipo VARCHAR(120) NULL,
  laboratorio VARCHAR(180) NULL,
  contaminante VARCHAR(180) NULL,
  classe_contaminante VARCHAR(120) NULL,
  nivel_contaminacao VARCHAR(80) NULL,
  quantidade INT NULL,
  data_registro DATETIME NULL,
  data_descontaminacao DATETIME NULL,
  metodo_descontaminacao VARCHAR(180) NULL,
  responsavel VARCHAR(180) NULL,
  status VARCHAR(80) NULL,
  destino VARCHAR(180) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_vidrarias_data (data_registro),
  KEY ix_vidrarias_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS indicadores_mensais (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mes TINYINT UNSIGNED NOT NULL,
  ano SMALLINT UNSIGNED NOT NULL,
  acidentes INT NOT NULL DEFAULT 0,
  treinamentos INT NOT NULL DEFAULT 0,
  custo_operacional DECIMAL(14,2) NOT NULL DEFAULT 0,
  destinacao_correta_pct DECIMAL(8,3) NULL,
  observacoes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_indicadores_mes_ano (mes, ano)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificacoes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(120) NULL,
  severidade VARCHAR(40) NOT NULL DEFAULT 'info',
  titulo VARCHAR(240) NOT NULL,
  mensagem TEXT NULL,
  origem VARCHAR(80) NULL,
  origem_id VARCHAR(80) NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_notificacoes_lida_data (lida, criado_em),
  KEY ix_notificacoes_origem (tipo, origem, origem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historico (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id VARCHAR(80) NOT NULL,
  registro_codigo VARCHAR(120) NULL,
  acao VARCHAR(30) NOT NULL,
  descricao TEXT NULL,
  usuario VARCHAR(180) NULL,
  usuario_email VARCHAR(254) NULL,
  dados_anteriores JSON NULL,
  dados_novos JSON NULL,
  mudancas JSON NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_historico_data (criado_em),
  KEY ix_historico_registro (tabela, registro_id),
  KEY ix_historico_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;