import { NextResponse } from "next/server";
import { z } from "zod";
import { renderizarPdfCurriculo } from "@/lib/curriculo/pdf";
import { validarRelatorio } from "@/lib/curriculo/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_CORPO_BYTES = 512 * 1024;
const JANELA_MS = 15 * 60 * 1000;
const MAX_POR_JANELA = 5;
const requisicoes = new Map<string, { count: number; expires: number }>();

const pedidoSchema = z.object({
  cargo: z.string().max(120),
  tipo: z.enum(["relatorio", "curriculo"]),
  relatorio: z.unknown(),
});

class CorpoGrandeError extends Error {}

function respostaErro(erro: string, status: number) {
  return NextResponse.json({ erro }, { status });
}

async function lerCorpoLimitado(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return new ArrayBuffer(0);

  const chunks: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > MAX_CORPO_BYTES) {
        await reader.cancel();
        throw new CorpoGrandeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const corpo = new ArrayBuffer(tamanho);
  const bytes = new Uint8Array(corpo);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return corpo;
}

function excedeuLimite(ip: string) {
  const agora = Date.now();
  for (const [key, value] of requisicoes) {
    if (value.expires <= agora) requisicoes.delete(key);
  }
  const atual = requisicoes.get(ip);
  if (atual && atual.expires > agora && atual.count >= MAX_POR_JANELA) return true;
  requisicoes.set(ip, atual && atual.expires > agora
    ? { ...atual, count: atual.count + 1 }
    : { count: 1, expires: agora + JANELA_MS });
  return false;
}

function nomeArquivo(cargo: string, tipo: "relatorio" | "curriculo") {
  if (tipo === "relatorio") return "relatorio-de-analise-curricular.pdf";
  const slug = cargo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `curriculo${slug ? `-${slug}` : "-reorganizado"}.pdf`;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CORPO_BYTES) {
    return respostaErro("O relatório excede o tamanho permitido para gerar o PDF.", 413);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = request.headers.get("x-real-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  if (excedeuLimite(ip)) {
    return respostaErro("Limite de PDFs atingido. Tente novamente em 15 minutos.", 429);
  }

  let corpo: ArrayBuffer;
  try {
    corpo = await lerCorpoLimitado(request);
  } catch (error) {
    if (error instanceof CorpoGrandeError) {
      return respostaErro("O relatório excede o tamanho permitido para gerar o PDF.", 413);
    }
    return respostaErro("Não foi possível receber os dados para gerar o PDF.", 400);
  }

  let pedido: z.infer<typeof pedidoSchema>;
  try {
    pedido = pedidoSchema.parse(JSON.parse(new TextDecoder().decode(corpo)));
  } catch {
    return respostaErro("Os dados enviados para gerar o PDF são inválidos.", 400);
  }

  let relatorio;
  try {
    relatorio = validarRelatorio(pedido.relatorio);
  } catch {
    return respostaErro("O relatório está incompleto ou inválido e não pode ser exportado.", 400);
  }

  if (pedido.tipo === "curriculo" && relatorio.formattedResume.sections.length === 0) {
    return respostaErro("Não há conteúdo suficiente para gerar o currículo em PDF.", 400);
  }

  try {
    const buffer = await renderizarPdfCurriculo(relatorio, pedido.cargo, pedido.tipo);
    const arquivo = nomeArquivo(pedido.cargo, pedido.tipo);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${arquivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return respostaErro("Não foi possível gerar o PDF. Tente novamente.", 500);
  }
}
