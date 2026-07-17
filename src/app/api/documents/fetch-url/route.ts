import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// POST /api/documents/fetch-url — 网站智采：抓取网页内容解析入库
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const supabase = getSupabase();
  const body = await request.json();
  const { url, knowledge_base_id } = body;

  if (!url) return NextResponse.json({ error: "请输入网址" }, { status: 400 });

  // 创建文档记录（处理中状态）
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      team_id: user.team_id,
      user_id: user.id,
      name: url.replace(/^https?:\/\//, "").slice(0, 120),
      file_url: url,
      file_size: 0,
      file_type: "webpage",
      status: "processing",
      source_url: url,
      knowledge_base_id: knowledge_base_id || null,
    })
    .select()
    .single();

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

  // 异步抓取网页
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VertaX/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
      return NextResponse.json({ error: `网页请求失败 (${res.status})` }, { status: 500 });
    }

    const contentType = res.headers.get("content-type") || "";
    // 只处理 HTML 页面
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
      return NextResponse.json({ error: "不支持的内容类型，仅支持 HTML 网页" }, { status: 400 });
    }

    const html = await res.text();

    // 简单文本提取：去掉 script/style 标签，提取 body 文本
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 限制文本长度
    const maxLen = 50000;
    if (text.length > maxLen) text = text.slice(0, maxLen);

    if (!text || text.length < 50) {
      await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
      return NextResponse.json({ error: "网页内容过短或无法提取文本" }, { status: 400 });
    }

    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : doc.name;

    // 分块
    const chunkSize = 800;
    const chunks: { document_id: string; chunk_index: number; content: string }[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push({
        document_id: doc.id,
        chunk_index: chunks.length,
        content: text.slice(i, i + chunkSize),
      });
    }

    // 写入分块并更新文档
    await supabase.from("document_chunks").insert(chunks);
    await supabase
      .from("documents")
      .update({
        name: pageTitle.slice(0, 200),
        status: "done",
        content_text: text.slice(0, 5000),
        chunk_count: chunks.length,
        file_size: text.length,
      })
      .eq("id", doc.id);

    return NextResponse.json({
      data: {
        id: doc.id,
        name: pageTitle.slice(0, 200),
        source_url: url,
        chunk_count: chunks.length,
        status: "done",
      },
    });
  } catch (err) {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
    const msg = err instanceof Error ? err.message : "抓取失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
