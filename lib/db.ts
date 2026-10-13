import { mkdirSync } from "fs";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import type { VagaBruta } from "./fontes/tipos";

/**
 * Banco local (SQLite embutido no Node) com as vagas já buscadas e quando cada
 * região foi atualizada pela última vez. Evita gastar cota da API.
 *
 * As vagas são guardadas "cruas" (como vieram da fonte): a classificação roda
 * na hora de servir, então melhorias no filtro valem para vagas já salvas.
 */

const ARQUIVO = path.join(process.cwd(), ".data", "vagas.db");
const VERSAO_ESQUEMA = 2;

function abrir() {
  mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const db = new DatabaseSync(ARQUIVO);
  db.exec("PRAGMA journal_mode = WAL");

  // Mudou a estrutura? Recria as tabelas (os dados voltam na próxima busca).
  const { user_version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  if (user_version !== VERSAO_ESQUEMA) {
    db.exec(`DROP TABLE IF EXISTS vagas; DROP TABLE IF EXISTS regioes; PRAGMA user_version = ${VERSAO_ESQUEMA};`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS vagas (
      id           TEXT PRIMARY KEY,   -- fonte + id na fonte
      chave        TEXT NOT NULL,      -- título + empresa + local normalizados (mesma vaga vinda de sites diferentes)
      fonte        TEXT NOT NULL,
      id_externo   TEXT NOT NULL,
      titulo       TEXT NOT NULL,
      empresa      TEXT NOT NULL,
      local        TEXT NOT NULL,
      lat          REAL,
      lon          REAL,
      descricao    TEXT NOT NULL,
      url          TEXT NOT NULL,
      publicada_em TEXT,
      salario      TEXT,
      remoto       INTEGER,            -- 1/0, ou NULL se a fonte não informou
      salva_em     INTEGER NOT NULL,   -- primeira vez que veio da API (ms)
      vista_em     INTEGER NOT NULL    -- última vez que veio da API (ms)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS vagas_chave ON vagas (chave);
    CREATE INDEX IF NOT EXISTS vagas_vista_em ON vagas (vista_em);

    CREATE TABLE IF NOT EXISTS regioes (
      nome           TEXT PRIMARY KEY,
      atualizada_em  INTEGER NOT NULL
    );
  `);
  return db;
}

// Reaproveita a conexão entre recarregamentos do servidor de desenvolvimento.
const g = globalThis as unknown as { __vagasDb?: DatabaseSync };
const db = (g.__vagasDb ??= abrir());

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export function regiaoAtualizadaEm(nome: string): number | null {
  const r = db.prepare("SELECT atualizada_em FROM regioes WHERE nome = ?").get(nome) as { atualizada_em: number } | undefined;
  return r?.atualizada_em ?? null;
}

export function marcarRegiaoAtualizada(nome: string, quando: number) {
  db.prepare(
    "INSERT INTO regioes (nome, atualizada_em) VALUES (?, ?) ON CONFLICT (nome) DO UPDATE SET atualizada_em = excluded.atualizada_em",
  ).run(nome, quando);
}

/**
 * Salva as vagas novas. Vaga que já existe (mesmo id, ou mesmo título + empresa
 * + local) não é inserida de novo: só ganha a data de "vista agora", para não
 * expirar enquanto continuar aparecendo na API. Devolve quantas eram novas.
 */
export function salvarVagas(vagas: VagaBruta[], quando: number): number {
  const jaExiste = db.prepare("UPDATE vagas SET vista_em = ? WHERE id = ? OR chave = ?");
  const inserir = db.prepare(`
    INSERT INTO vagas (id, chave, fonte, id_externo, titulo, empresa, local, lat, lon, descricao, url, publicada_em, salario, remoto, salva_em, vista_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let novas = 0;
  db.exec("BEGIN");
  try {
    for (const v of vagas) {
      const id = `${v.fonte}-${v.idExterno}`;
      const chave = `${normalizar(v.titulo)}|${normalizar(v.empresa)}|${normalizar(v.local)}`;
      if (jaExiste.run(quando, id, chave).changes > 0) continue;
      inserir.run(
        id, chave, v.fonte, v.idExterno, v.titulo, v.empresa, v.local, v.lat ?? null, v.lon ?? null, v.descricao, v.url,
        v.publicadaEm ?? null, v.salario ?? null, v.remoto === undefined ? null : Number(v.remoto), quando, quando,
      );
      novas++;
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return novas;
}

interface LinhaVaga {
  fonte: VagaBruta["fonte"];
  id_externo: string;
  titulo: string;
  empresa: string;
  local: string;
  lat: number | null;
  lon: number | null;
  descricao: string;
  url: string;
  publicada_em: string | null;
  salario: string | null;
  remoto: number | null;
}

/** Vagas vistas na API a partir de `desde` (as mais antigas são consideradas encerradas). */
export function vagasVistasDesde(desde: number): VagaBruta[] {
  const linhas = db.prepare("SELECT * FROM vagas WHERE vista_em >= ?").all(desde) as unknown as LinhaVaga[];
  return linhas.map((l) => ({
    idExterno: l.id_externo,
    fonte: l.fonte,
    titulo: l.titulo,
    empresa: l.empresa,
    local: l.local,
    lat: l.lat ?? undefined,
    lon: l.lon ?? undefined,
    descricao: l.descricao,
    url: l.url,
    publicadaEm: l.publicada_em ?? undefined,
    salario: l.salario ?? undefined,
    remoto: l.remoto === null ? undefined : l.remoto === 1,
  }));
}
