/**
 * Big techs usadas pelo filtro "Só big techs".
 *
 * Como preencher: um item por empresa. Em `apelidos`, coloque outros jeitos
 * como o nome aparece nas vagas. A comparação ignora acentos, maiúsculas e
 * espaços, e acha o nome dentro de um nome maior (ex.: "Nubank" acha "Nubank Brasil").
 *
 * Exemplo:
 *   { nome: "Mercado Livre", apelidos: ["MercadoLivre", "Mercado Libre"] },
 *
 * Enquanto a lista estiver vazia, o botão aparece desativado ("em breve").
 */
export const BIG_TECHS: { nome: string; apelidos?: string[] }[] = [];

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

const NOMES = BIG_TECHS.flatMap((b) => [b.nome, ...(b.apelidos ?? [])]).map(normalizar).filter(Boolean);

export function ehBigTech(empresa: string): boolean {
  const e = normalizar(empresa);
  return NOMES.some((n) => e.includes(n));
}
