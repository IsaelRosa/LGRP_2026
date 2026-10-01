-- ============================================================
-- LGRP — catálogo editável de laboratórios/setores geradores
-- Cole este bloco na aba SQL do phpMyAdmin com o banco
-- u3150933330_LGRQ_26 selecionado.
--
-- Seguro para rodar mais de uma vez: a tabela usa IF NOT EXISTS e os
-- laboratórios iniciais usam INSERT IGNORE.
-- ============================================================

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
