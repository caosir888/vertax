import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { chat } from "@/lib/llm";
import { logActivity } from "@/lib/activity-logger";
import { sendNotification } from "@/lib/notifications";
import { siteTemplates, buildSitePrompt, parseSiteContent, type SiteSettings } from "@/lib/templates-site";

// POST /api/sites/generate — AI 生成独立站内容
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, settings } = body as { template_id: string; settings: SiteSettings };

  const template = siteTemplates.find((t) => t.id === template_id);
  if (!template) {
    return NextResponse.json({ error: "模板不存在" }, { status: 400 });
  }

  if (!settings.companyName?.trim()) {
    return NextResponse.json({ error: "公司名称不能为空" }, { status: 400 });
  }

  // 应用模板主色，默认开启 AI 聊天助手
  const finalSettings = {
    ...settings,
    primaryColor: settings.primaryColor || template.primaryColor,
    enableChat: settings.enableChat !== undefined ? settings.enableChat : true,
    chatWelcomeMessage: settings.chatWelcomeMessage || "你好！我是 AI 助手，可以回答关于我们产品和服务的任何问题，欢迎咨询！",
  };

  try {
    // 从知识库搜索相关产品信息
    let knowledgeContext = "";
    try {
      const { data: docs } = await getSupabase()
        .from("documents")
        .select("id, name")
        .eq("team_id", user.team_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (docs?.length) {
        const { data: chunks } = await getSupabase()
          .from("document_chunks")
          .select("content")
          .in("document_id", docs.map((d: { id: string }) => d.id))
          .limit(10);

        if (chunks?.length) {
          knowledgeContext = chunks.map((c: { content: string }) => c.content).join("\n---\n");
        }
      }
    } catch {
      // 知识库搜索失败不影响生成
    }

    const prompt = buildSitePrompt(template, finalSettings, knowledgeContext);
    const result = await chat([{ role: "user", content: prompt }]);

    const pages = parseSiteContent(result);

    if (pages.length === 0) {
      return NextResponse.json({ error: "AI 生成失败，请重试" }, { status: 500 });
    }

    // 保存到数据库
    const { data, error } = await getSupabase()
      .from("sites")
      .insert({
        team_id: user.team_id,
        user_id: user.id,
        name: finalSettings.companyName,
        template_id,
        pages: JSON.stringify(pages),
        settings: JSON.stringify(finalSettings),
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logActivity({ team_id: user.team_id!, user_id: user.id, user_name: user.name, action: "生成独立站", target: finalSettings.companyName });

    sendNotification({ team_id: user.team_id!, actor_id: user.id, title: `独立站「${finalSettings.companyName}」已生成`, message: `使用「${template.name}」模板生成，共 ${pages.length} 个页面` });

    return NextResponse.json({ data: { ...data, pages } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
