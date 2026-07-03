// 文本提取：PDF / Word / TXT / MD
// 在 API Route 中运行（Node.js 运行时）

import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  // PDF — pdfreader 纯文本提取，无需 DOM/canvas
  if (fileType === "application/pdf") {
    const { PdfReader } = await import("pdfreader");
    const text = await new Promise<string>((resolve, reject) => {
      const lines: string[] = [];
      new PdfReader().parseBuffer(new Uint8Array(buffer) as unknown as Buffer, (err, item) => {
        if (err) { reject(err); return; }
        if (!item) { resolve(lines.join("\n")); return; }
        if (item.text) lines.push(item.text.trim());
      });
    });
    return text;
  }

  // Word (.docx / .doc)
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // TXT / Markdown — 直接当 UTF-8 读
  return buffer.toString("utf-8");
}

// ========== 文本分块 ==========

function splitLongParagraph(text: string, maxSize: number): string[] {
  const sentences = text.split(/(?<=[。！？.!?\n])\s*/);
  const result: string[] = [];
  let current = "";

  for (const s of sentences) {
    if (!s.trim()) continue;
    if (current && (current.length + s.length > maxSize)) {
      if (current.trim()) result.push(current.trim());
      current = s;
    } else if (!current) {
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.length > 0 ? result : [text];
}

export function chunkText(text: string, maxChunkSize = 1200, overlap = 100): string[] {
  if (!text || !text.trim()) return [];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();

    if (trimmed.length > maxChunkSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      const subChunks = splitLongParagraph(trimmed, maxChunkSize);
      for (const sub of subChunks) {
        if (current && (current.length + sub.length + 2) > maxChunkSize) {
          chunks.push(current.trim());
          current = sub;
        } else if (!current) {
          current = sub;
        } else {
          current += "\n\n" + sub;
        }
      }
      continue;
    }

    if (current && (current.length + trimmed.length + 2) > maxChunkSize) {
      chunks.push(current.trim());
      const tail = current.length > overlap ? current.slice(-overlap) : current;
      current = tail ? tail + "\n\n" + trimmed : trimmed;
    } else if (!current) {
      current = trimmed;
    } else {
      current += "\n\n" + trimmed;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
