// 文本提取：PDF / Word / TXT / MD
// 在 API Route 中运行（Node.js 运行时）

import mammoth from "mammoth";

// pdf-parse 是 CJS 模块，用 require 导入
const pdfParse = require("pdf-parse");

export async function extractText(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  // PDF
  if (fileType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
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

// 长段落按句子边界拆分为子块
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
  return result.length > 0 ? result : [text]; // fallback: 无法按句子拆分就原样返回
}

export function chunkText(text: string, maxChunkSize = 1200, overlap = 100): string[] {
  if (!text || !text.trim()) return [];

  // 按段落分割（双换行）
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();

    // 单段超过 maxChunkSize → 按句子拆开
    if (trimmed.length > maxChunkSize) {
      // 先把当前累积的块输出
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      // 长段落按句子拆分
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

    // 正常：单段加到当前块
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
