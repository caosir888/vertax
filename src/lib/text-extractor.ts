// 文本提取：PDF / Word / TXT / MD
// 在 API Route 中运行（Node.js 运行时）

import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  // PDF — 使用 pdfreader 提取文本
  if (fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const { PdfReader } = await import("pdfreader");
      const text = await new Promise<string>((resolve, reject) => {
        const lines: string[] = [];
        const reader = new PdfReader();
        reader.parseBuffer(new Uint8Array(buffer) as unknown as Buffer, (err, item) => {
          if (err) {
            reject(err);
            return;
          }
          if (!item) {
            resolve(lines.join("\n"));
            return;
          }
          if (item.text) {
            lines.push(item.text.trim());
          }
        });
      });
      if (text && text.trim()) return text;
    } catch {
      // pdfreader 提取失败，继续尝试其他方式
    }
    // 如果 pdfreader 返回空文本，尝试用原始方式读取
    try {
      const raw = buffer.toString("utf-8");
      // 简易提取 PDF 中的可读文本（去除非打印字符）
      const cleaned = raw.replace(/[^\x20-\x7E一-鿿　-〿＀-￯\n\r\t]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (cleaned.length > 100) return cleaned;
    } catch {
      // 忽略
    }
    return "";
  }

  // Word (.docx) — mammoth
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value?.trim();
    if (text) return text;
    // mammoth 可能提取到空内容，尝试显示警告信息
    if (result.messages?.length) {
      const msgs = result.messages.map((m) => m.message).join("; ");
      if (msgs) return "[文档解析警告] " + msgs;
    }
    return "";
  }

  // 旧版 .doc 文件 — mammoth 不支持，尝试原始读取
  if (fileType === "application/msword" || fileName.toLowerCase().endsWith(".doc")) {
    // mammoth 可能对某些 .doc 文件有效，先尝试
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (text) return text;
    } catch {
      // 忽略
    }
    // 回退：从二进制中提取可读文本
    try {
      const raw = buffer.toString("utf-8");
      const cleaned = raw.replace(/[^\x20-\x7E一-鿿　-〿＀-￯\n\r\t]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (cleaned.length > 50) return cleaned;
    } catch {
      // 忽略
    }
    return "";
  }

  // TXT / Markdown — 直接当 UTF-8 读
  try {
    return buffer.toString("utf-8").trim();
  } catch {
    return "";
  }
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

export function chunkText(text: string, maxChunkSize = 800, overlap = 100): string[] {
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
