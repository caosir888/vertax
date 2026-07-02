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

export function chunkText(text: string, maxChunkSize = 1200, overlap = 100): string[] {
  if (!text || !text.trim()) return [];

  // 按段落分割（双换行）
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();

    // 如果单段加到当前块后不超限 → 加入
    if (current && (current.length + trimmed.length + 2) > maxChunkSize) {
      chunks.push(current.trim());
      // overlap：保留上一块尾部作为上下文
      const tail = current.slice(-overlap);
      current = tail ? tail + "\n\n" + trimmed : trimmed;
    } else if (!current) {
      current = trimmed;
    } else {
      current += "\n\n" + trimmed;
    }
  }

  // 最后一块
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
