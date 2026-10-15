import type { Fonte, Modelo, Nivel } from "../types";

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
  // Quando a própria fonte informa, vale mais que a dedução pelo texto.
  remoto?: boolean;
  nivel?: Nivel;
  modelo?: Modelo;
}

/** Região sendo atualizada (ex.: Grande São Paulo). */
export interface RegiaoBusca {
  nome: string;
  consulta: string; // como vai no texto da busca, ex.: "São Paulo, SP"
  estado: string; // nome completo, ex.: "São Paulo"
}

export interface ResultadoColeta {
  vagas: VagaBruta[];
  falhas: string[]; // mensagens para mostrar como aviso
}

/** Toda fonte de vagas segue este formato e é registrada em FONTES (lib/buscar.ts). */
export interface FonteDeVagas {
  nome: string;
  ativa: () => boolean;
  coletar: (regiao: RegiaoBusca) => Promise<ResultadoColeta>;
}

export interface ParametrosBusca {
  termo: string;
  cidade?: string; // cidade ou região; vazio = Brasil inteiro
}

export const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
