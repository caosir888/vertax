// 文本向量化 — 调用 OpenAI 兼容 Embedding API
// 默认：OpenAI text-embedding-3-small（1536 维）
// 可配环境变量切换到其他兼容服务

const EMBEDDING_API_URL =
  process.env.EMBEDDING_API_URL || "https://api.openai.com/v1/embeddings";
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || "";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

interface EmbeddingResponse {
  data: { embedding: number[] }[];
}

// 单条文本向量化
export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API 错误 (${res.status}): ${err}`);
  }

  const json: EmbeddingResponse = await res.json();
  return json.data[0].embedding;
}

// 批量向量化（一次 API 调用处理多条文本，省费用）
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API 错误 (${res.status}): ${err}`);
  }

  const json: EmbeddingResponse = await res.json();
  return json.data.map((d) => d.embedding);
}

// 余弦相似度（两个向量越相似值越接近1）
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
