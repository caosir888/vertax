"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { templates, languages, type Template } from "@/lib/templates";

interface Version {
  title?: string;
  content: string;
}

export default function ContentPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState("zh-CN");
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // 分析 & 翻译
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [analyzeContent, setAnalyzeContent] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<{
    readability: { score: number; level: string; stats: Record<string, number>; tips: string[] };
    seo: { analysis: string };
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [showTranslate, setShowTranslate] = useState(false);
  const [translateContent, setTranslateContent] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [translateResult, setTranslateResult] = useState<{
    translation: string;
    localization_note: string;
  } | null>(null);
  const [translating, setTranslating] = useState(false);

  function selectTemplate(t: Template) {
    setSelectedTemplate(t);
    setVersions([]);
    setEditingIndex(null);
    const vars: Record<string, string> = {};
    for (const v of t.variables) vars[v.key] = "";
    setVariables(vars);
  }

  function backToTemplates() {
    setSelectedTemplate(null);
    setVersions([]);
    setEditingIndex(null);
  }

  async function generate() {
    if (!selectedTemplate) return;
    setGenerating(true);
    setVersions([]);
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          variables,
          language,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        setVersions(json.data.versions || []);
        toast.success(`已生成 ${json.data.versions?.length || 0} 个版本`);
      }
    } catch {
      toast.error("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditContent(versions[index]?.content || "");
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const updated = [...versions];
    updated[editingIndex] = { ...updated[editingIndex], content: editContent };
    setVersions(updated);
    setEditingIndex(null);
    toast.success("已保存修改");
  }

  async function copyVersion(v: Version) {
    const text = v.title ? `${v.title}\n\n${v.content}` : v.content;
    await navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  }

  function openAnalyze(text: string) {
    setShowAnalyze(true);
    setShowTranslate(false);
    setAnalyzeContent(text);
    setAnalyzeResult(null);
  }

  async function runAnalyze() {
    if (!analyzeContent.trim()) return;
    setAnalyzing(true);
    setAnalyzeResult(null);
    try {
      const res = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: analyzeContent, type: selectedTemplate?.id || "seo" }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else setAnalyzeResult(json.data);
    } catch {
      toast.error("分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  function openTranslate(text: string) {
    setShowTranslate(true);
    setShowAnalyze(false);
    setTranslateContent(text);
    setTranslateResult(null);
  }

  async function runTranslate() {
    if (!translateContent.trim()) return;
    setTranslating(true);
    setTranslateResult(null);
    try {
      const res = await fetch("/api/content/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: translateContent, target_lang: targetLang }),
      });
      const json = await res.json();
      if (json.error) toast.error(json.error);
      else setTranslateResult(json.data);
    } catch {
      toast.error("翻译失败");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-black">AI 内容工坊</h1>
        <p className="mt-2 text-sm text-zinc-500">
          选择内容模板，输入产品或主题信息，AI 自动生成多版本文案
        </p>

        {/* ========== 模板选择 ========== */}
        {!selectedTemplate ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className="rounded-2xl border border-zinc-200 bg-white p-6 text-left hover:border-black hover:shadow-sm transition-all"
              >
                <div className="text-3xl">{t.icon}</div>
                <h3 className="mt-3 text-lg font-bold text-black">{t.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* ========== 返回 + 模板名 ========== */}
            <button
              onClick={backToTemplates}
              className="mt-6 text-sm text-zinc-500 hover:text-black transition-colors"
            >
              ← 选择其他模板
            </button>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <h2 className="text-xl font-bold text-black">{selectedTemplate.name}</h2>
            </div>

            {/* ========== 变量输入 ========== */}
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-medium text-zinc-500 mb-4">填写信息</h3>
              <div className="space-y-4">
                {selectedTemplate.variables.map((v) => (
                  <div key={v.key}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      {v.label}
                    </label>
                    {v.key === "product_description" || v.key === "value_proposition" || v.key === "key_message" ? (
                      <textarea
                        value={variables[v.key] || ""}
                        onChange={(e) => setVariables({ ...variables, [v.key]: e.target.value })}
                        placeholder={v.placeholder}
                        rows={3}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-black focus:outline-none resize-none"
                      />
                    ) : (
                      <input
                        value={variables[v.key] || ""}
                        onChange={(e) => setVariables({ ...variables, [v.key]: e.target.value })}
                        placeholder={v.placeholder}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-black focus:outline-none"
                      />
                    )}
                  </div>
                ))}

                {/* 语言选择 */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">输出语言</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={generate}
                  disabled={generating}
                  className="w-full rounded-xl bg-black text-white hover:bg-zinc-800"
                >
                  {generating ? "生成中..." : "生成文案"}
                </Button>
              </div>
            </div>

            {/* ========== 生成结果 ========== */}
            {versions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-zinc-500 mb-4">
                  生成结果（{versions.length} 个版本）
                </h3>

                {editingIndex !== null ? (
                  /* 编辑模式 */
                  <div className="rounded-2xl border border-black bg-white p-6">
                    <h4 className="font-bold text-black mb-3">
                      编辑版本 {editingIndex + 1}
                    </h4>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={16}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none resize-none"
                    />
                    <div className="mt-4 flex gap-3">
                      <Button onClick={saveEdit}>保存修改</Button>
                      <Button variant="outline" onClick={() => setEditingIndex(null)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  /* 版本展示 */
                  <div className="grid gap-6 sm:grid-cols-3">
                    {versions.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                            版本 {i + 1}
                          </span>
                        </div>
                        {v.title && (
                          <p className="text-sm font-bold text-black mb-2">{v.title}</p>
                        )}
                        <div className="flex-1 text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                          {v.content}
                        </div>
                        <div className="mt-4 flex gap-3 pt-3 border-t border-zinc-100 flex-wrap">
                          <button
                            onClick={() => copyVersion(v)}
                            className="text-xs text-zinc-400 hover:text-black transition-colors"
                          >
                            复制
                          </button>
                          <button
                            onClick={() => startEdit(i)}
                            className="text-xs text-zinc-400 hover:text-indigo-500 transition-colors"
                          >
                            微调
                          </button>
                          <button
                            onClick={() => openAnalyze(v.content)}
                            className="text-xs text-zinc-400 hover:text-emerald-500 transition-colors"
                          >
                            SEO
                          </button>
                          <button
                            onClick={() => openTranslate(v.content)}
                            className="text-xs text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            翻译
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== SEO 分析面板 ========== */}
            {showAnalyze && (
              <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-black">SEO 分析与优化建议</h3>
                  <button onClick={() => setShowAnalyze(false)} className="text-sm text-zinc-400 hover:text-zinc-700">关闭</button>
                </div>

                {!analyzeResult && !analyzing && (
                  <div className="text-center py-4">
                    <p className="text-sm text-zinc-500">{analyzeContent ? "点击分析按钮开始" : "请先选择要分析的内容"}</p>
                    <Button onClick={runAnalyze} className="mt-3 rounded-xl bg-black text-white hover:bg-zinc-800" disabled={!analyzeContent.trim()}>
                      开始分析
                    </Button>
                  </div>
                )}

                {analyzing && (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 w-48 rounded bg-zinc-200" />
                    <div className="h-3 w-full rounded bg-zinc-100" />
                    <div className="h-3 w-5/6 rounded bg-zinc-100" />
                  </div>
                )}

                {analyzeResult && (
                  <div className="space-y-6">
                    {/* 可读性评分 */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${analyzeResult.readability.score >= 60 ? "text-green-600" : analyzeResult.readability.score >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                          {analyzeResult.readability.score}
                        </div>
                        <div className="text-xs text-zinc-400">可读性分</div>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${analyzeResult.readability.score >= 60 ? "text-green-700" : "text-yellow-700"}`}>
                          {analyzeResult.readability.level}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs text-zinc-400">
                          <span>{analyzeResult.readability.stats.sentences} 句</span>
                          <span>{analyzeResult.readability.stats.words} 词/字</span>
                          <span>均句长 {analyzeResult.readability.stats.avgWordsPerSentence}</span>
                        </div>
                      </div>
                    </div>

                    {/* 改进建议 */}
                    {analyzeResult.readability.tips.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 mb-2">可读性建议</h4>
                        <ul className="space-y-1">
                          {analyzeResult.readability.tips.map((t, i) => (
                            <li key={i} className="text-sm text-zinc-500 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-zinc-300">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* SEO 分析 */}
                    <div>
                      <h4 className="text-sm font-medium text-zinc-700 mb-2">SEO 优化建议</h4>
                      <div className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed bg-zinc-50 rounded-xl p-4">
                        {analyzeResult.seo.analysis}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========== 翻译面板 ========== */}
            {showTranslate && (
              <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-black">多语言翻译</h3>
                  <button onClick={() => setShowTranslate(false)} className="text-sm text-zinc-400 hover:text-zinc-700">关闭</button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-zinc-500">目标语言：</span>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm focus:border-black focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                  </select>
                  <Button
                    onClick={runTranslate}
                    disabled={translating || !translateContent.trim()}
                    className="rounded-xl bg-black text-white hover:bg-zinc-800"
                  >
                    {translating ? "翻译中..." : "翻译"}
                  </Button>
                </div>

                {translating && (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 w-full rounded bg-zinc-100" />
                    <div className="h-3 w-5/6 rounded bg-zinc-100" />
                    <div className="h-3 w-4/6 rounded bg-zinc-100" />
                  </div>
                )}

                {translateResult && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-zinc-500 mb-2">翻译结果</h4>
                      <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                        {translateResult.translation}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(translateResult.translation);
                          toast.success("翻译已复制");
                        }}
                        className="mt-2 text-xs text-zinc-400 hover:text-black transition-colors"
                      >
                        复制翻译
                      </button>
                    </div>
                    {translateResult.localization_note && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-500 mb-1">本地化说明</h4>
                        <p className="text-sm text-zinc-500">{translateResult.localization_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 生成中骨架 */}
            {generating && (
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 animate-pulse">
                    <div className="h-4 w-16 rounded bg-zinc-200 mb-4" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-zinc-100" />
                      <div className="h-3 w-5/6 rounded bg-zinc-100" />
                      <div className="h-3 w-4/6 rounded bg-zinc-100" />
                      <div className="h-3 w-full rounded bg-zinc-100" />
                      <div className="h-3 w-3/6 rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
