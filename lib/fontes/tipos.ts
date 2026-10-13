import type { Fonte } from "../types";

/** Vaga como veio da fonte, antes de classificar. */
export interface VagaBruta {
  idExterno: string;
  titulo: string;
  empresa: string;
  local: string;
  lat?: number;
  lon?: number;
  descricao: string;
  url: string;
  fonte: Fonte;
  publicadaEm?: string;
  salario?: string;
  remoto?: boolean; // quando a própria fonte informa
}

export interface ParametrosBusca {
  termo: string;
  cidade?: string; // cidade ou região; vazio = Brasil inteiro
}
