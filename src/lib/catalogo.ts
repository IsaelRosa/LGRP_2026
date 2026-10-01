import { createContext } from 'react';
import { LABORATORIOS as FALLBACK } from './constants';

export type Laboratorio = {
  id: number;
  nome: string;
  unidade: string;
  responsavel: string;
  ativo: number | boolean;
};

/**
 * Catálogo editável de laboratórios/setores geradores.
 *
 * Antes os campos usavam uma lista fixa em `constants.ts`, o que exigia
 * alterar e recompilar o código para cadastrar um laboratório novo. Agora a
 * lista vem de `GET /api/laboratorio` e é editável na tela de Laboratórios.
 *
 * Se a tabela ainda não existir no banco, o provider mantém a lista antiga
 * para que o sistema continue utilizável durante a migração.
 */
export type CatalogoValue = {
  /** nomes ativos, prontos para alimentar <select> */
  nomes: string[];
  /** catálogo completo, para telas administrativas */
  registros: Laboratorio[];
  loading: boolean;
  /** true quando ainda estamos usando a lista fixa em vez do banco */
  usandoFallback: boolean;
  recarregar: () => void;
};

export const CatalogoContext = createContext<CatalogoValue>({
  nomes: FALLBACK,
  registros: [],
  loading: true,
  usandoFallback: true,
  recarregar: () => {},
});