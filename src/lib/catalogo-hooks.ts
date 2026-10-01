import { useContext } from 'react';
import { CatalogoContext } from './catalogo';

export type { Laboratorio, CatalogoValue } from './catalogo';

/** Catálogo completo + estado de carregamento. */
export function useLaboratorios() {
  return useContext(CatalogoContext);
}

/** Nomes ativos, para uso direto em listas de opcoes. */
export function useNomesLaboratorios(): string[] {
  return useContext(CatalogoContext).nomes;
}
