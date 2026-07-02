// 文本可读性分析
// Flesch Reading Ease（英文）+ 中文适配版本

interface ReadabilityResult {
  score: number;          // 0-100，越高越易读
  level: string;          // 易读等级描述
  levelColor: string;     // UI 颜色
  stats: {
    chars: number;
    words: number;
    sentences: number;
    paragraphs: number;
    avgWordsPerSentence: number;
  };
}

// 英文 Flesch Reading Ease 公式
function fleschEnglish(text: string): ReadabilityResult {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length || 1;
  const words = text.split(/\s+/).filter((w) => w.trim()).length || 1;
  const syllables = countSyllables(text);
  const chars = text.replace(/\s/g, "").length;

  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { level, levelColor } = getLevel(clamped);

  return {
    score: clamped,
    level,
    levelColor,
    stats: {
      chars,
      words,
      sentences,
      paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1,
      avgWordsPerSentence: Math.round(words / sentences),
    },
  };
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, "");
    if (!cleaned) continue;
    // 简化音节计数：元音簇 = 一个音节
    const syllables = cleaned.match(/[aeiouy]+/g);
    count += syllables ? syllables.length : 1;
  }
  return count || 1;
}

// 中文可读性（基于平均句长 + 字符密度）
function fleschChinese(text: string): ReadabilityResult {
  // 中文按句号/问号/感叹号/换行分句
  const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim()).length || 1;
  const chars = text.replace(/[\s\n\r]/g, "").length;
  const words = chars; // 中文按字计数
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;

  // 适应版公式：句子越短越好读，字越多越需要拆分
  const avgCharsPerSentence = chars / sentences;
  let score = 100 - avgCharsPerSentence * 2;
  if (paragraphs > 1) score += 5; // 有分段加分
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { level, levelColor } = getLevel(clamped);

  return {
    score: clamped,
    level,
    levelColor,
    stats: {
      chars,
      words,
      sentences,
      paragraphs,
      avgWordsPerSentence: Math.round(avgCharsPerSentence),
    },
  };
}

function getLevel(score: number): { level: string; levelColor: string } {
  if (score >= 80) return { level: "非常易读（适合大众）", levelColor: "text-green-600" };
  if (score >= 60) return { level: "较易读（标准商务文案）", levelColor: "text-emerald-600" };
  if (score >= 40) return { level: "中等难度（专业内容）", levelColor: "text-yellow-600" };
  if (score >= 20) return { level: "较难（学术/技术文档）", levelColor: "text-orange-600" };
  return { level: "非常难读（需要简化）", levelColor: "text-red-600" };
}

// 自动检测语言并计算可读性
export function analyzeReadability(text: string): ReadabilityResult {
  if (!text || !text.trim()) {
    return {
      score: 0,
      level: "无内容",
      levelColor: "text-zinc-400",
      stats: { chars: 0, words: 0, sentences: 0, paragraphs: 0, avgWordsPerSentence: 0 },
    };
  }

  // 简单判断：如果包含大量中文字符则用中文公式
  const chineseChars = text.match(/[一-鿿]/g);
  if (chineseChars && chineseChars.length > text.replace(/\s/g, "").length * 0.3) {
    return fleschChinese(text);
  }

  return fleschEnglish(text);
}

// 生成可读性改进建议
export function readabilityTips(result: ReadabilityResult): string[] {
  const tips: string[] = [];
  const { stats, score } = result;

  if (stats.sentences < 3) tips.push("内容较短，考虑扩展更多细节");
  if (stats.avgWordsPerSentence > 30) tips.push("句子平均过长（>30词/字），建议拆分长句");
  if (stats.paragraphs === 1 && stats.sentences > 5) tips.push("建议分段，每段聚焦一个要点");
  if (score < 40) tips.push("整体可读性偏低，建议简化用词、缩短句子、增加段落间距");
  if (stats.chars < 100) tips.push("内容过短，建议补充更多信息");

  return tips.length > 0 ? tips : ["可读性良好，保持当前风格"];
}
