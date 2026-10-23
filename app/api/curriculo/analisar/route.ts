import { NextResponse } from "next/server";
import { analisarCurriculo, FalhaAnaliseGroq } from "@/lib/curriculo/analisar";
import { extrairTextoCurriculo } from "@/lib/curriculo/extrair";

export const runtime = "nodejs";
export const maxDuration = 60;

const JANELA_MS = 15 * 60 * 1000;
const MAX_POR_JANELA = 5;
const requisicoes = new Map<string, { count: number; expires: number }>();

class CorpoGrandeError extends Error {}

function limiteUploadBytes() {
  const configurado = Number(process.env.CURRICULO_MAX_UPLOAD_MB ?? 5);
  const megabytes = Number.isFinite(configurado) && configurado > 0 ? Math.min(configurado, 5) : 5;
  return megabytes * 1024 * 1024;
}

async function lerCorpoLimitado(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return new ArrayBuffer(0);

  const chunks: Uint8Array[] = [];
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > maxBytes) {
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

function respostaErro(message: string, status: number) {
  return NextResponse.json({ erro: message }, { status });
}

export async function POST(request: Request) {
  const maxBytes = limiteUploadBytes();
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes + 32 * 1024) {
    return respostaErro(`O arquivo excede o limite de ${(maxBytes / 1024 / 1024).toFixed(2)} MB.`, 413);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = request.headers.get("x-real-ip") ?? forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  if (excedeuLimite(ip)) {
    return respostaErro("Limite de análises atingido. Tente novamente em 15 minutos.", 429);
  }

  let corpo: ArrayBuffer;
  try {
    corpo = await lerCorpoLimitado(request, maxBytes + 32 * 1024);
  } catch (error) {
    if (error instanceof CorpoGrandeError) {
      return respostaErro(`O arquivo excede o limite de ${(maxBytes / 1024 / 1024).toFixed(2)} MB.`, 413);
    }
    return respostaErro("Não foi possível receber o arquivo enviado.", 400);
  }

  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  const requestLimitado = new Request(request.url, { method: request.method, headers, body: corpo });

  let form: FormData;
  try {
    form = await requestLimitado.formData();
  } catch {
    return respostaErro("Não foi possível receber o arquivo enviado.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return respostaErro("Selecione um currículo PDF ou DOCX.", 400);
  if (form.get("consent") !== "true") return respostaErro("É necessário autorizar o processamento externo antes de enviar.", 400);

  const cargo = form.get("cargo");
  const descricao = form.get("descricaoVaga");
  if ((cargo !== null && typeof cargo !== "string") || (descricao !== null && typeof descricao !== "string")) {
    return respostaErro("Os dados da vaga são inválidos.", 400);
  }
  if ((cargo?.length ?? 0) > 120 || (descricao?.length ?? 0) > 10_000) {
    return respostaErro("O cargo ou a descrição da vaga excede o limite permitido.", 400);
  }

  try {
    const texto = await extrairTextoCurriculo(file, maxBytes);
    const report = await analisarCurriculo(texto, cargo ?? "", descricao ?? "");
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error) {
      if (error instanceof FalhaAnaliseGroq) return respostaErro(error.message, error.status);
      if (error.message.includes("não está configurada")) return respostaErro(error.message, 503);
      if (
        error.message.startsWith("O arquivo") ||
        error.message.startsWith("Envie") ||
        error.message.startsWith("Não foi possível") ||
        error.message.startsWith("O PDF")
      ) {
        return respostaErro(error.message, 400);
      }
    }
    return respostaErro("Não foi possível analisar o currículo agora. Tente novamente mais tarde.", 502);
  }
}
