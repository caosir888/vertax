import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface GeoData {
  faq_schema?: { mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }> };
  article_schema?: { headline?: string; description?: string };
  geo_summary?: string;
  geo_title?: string;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  geo_data?: GeoData | null;
  tags?: string[];
  category?: string;
  publish_date?: string;
}

async function getContent(slug: string): Promise<ContentItem | null> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/contents?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContent(slug);
  if (!content) return { title: "内容未找到" };

  const seoTitle = content.seo_title || content.title || "VertaX 内容";
  const seoDesc = content.seo_description || content.content?.substring(0, 160) || "";

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getContent(slug);
  if (!content) notFound();

  const geoData = content.geo_data;
  const jsonLd: Record<string, unknown>[] = [];

  if (geoData?.faq_schema) {
    jsonLd.push(geoData.faq_schema as unknown as Record<string, unknown>);
  }
  if (geoData?.article_schema) {
    jsonLd.push({
      ...geoData.article_schema as unknown as Record<string, unknown>,
      headline: geoData.article_schema.headline || content.title,
      description: geoData.article_schema.description || geoData.geo_summary || content.seo_description,
      datePublished: content.publish_date || undefined,
    });
  } else {
    // 无 GEO 数据时生成基础 Article Schema
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: content.seo_title || content.title,
      description: content.seo_description || content.content?.substring(0, 160),
      datePublished: content.publish_date || undefined,
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : { "@context": "https://schema.org", "@graph": jsonLd }) }}
      />

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* 分类 & 日期 */}
        <div className="flex items-center gap-3 mb-4">
          {content.category && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
              {content.category}
            </span>
          )}
          {content.tags?.map((tag) => (
            <span key={tag} className="text-xs text-zinc-400">#{tag}</span>
          ))}
          {content.publish_date && (
            <span className="text-xs text-zinc-400 ml-auto">
              {new Date(content.publish_date).toLocaleDateString("zh-CN")}
            </span>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-black mb-2">
          {content.seo_title || content.title}
        </h1>

        {/* SEO 描述 */}
        {content.seo_description && (
          <p className="text-base text-zinc-500 mb-8 leading-relaxed">{content.seo_description}</p>
        )}

        {/* 正文 */}
        <div className="prose prose-zinc max-w-none">
          {content.content?.split("\n").map((paragraph, i) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return <br key={i} />;

            if (trimmed.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-bold text-black mt-8 mb-3">{trimmed.replace("## ", "")}</h2>;
            }
            if (trimmed.startsWith("### ")) {
              return <h3 key={i} className="text-lg font-semibold text-black mt-6 mb-2">{trimmed.replace("### ", "")}</h3>;
            }
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              return <li key={i} className="text-zinc-700 ml-4">{trimmed.replace(/^[-*] /, "")}</li>;
            }
            return <p key={i} className="text-zinc-700 leading-relaxed mb-4">{trimmed}</p>;
          })}
        </div>

        {/* GEO FAQ 区域 */}
        {geoData?.faq_schema?.mainEntity && geoData.faq_schema.mainEntity.length > 0 && (
          <section className="mt-12 p-6 rounded-xl bg-zinc-50 border border-zinc-200">
            <h2 className="text-lg font-bold text-black mb-4">常见问题 FAQ</h2>
            <div className="space-y-3">
              {geoData.faq_schema.mainEntity.map((faq, i) => (
                <details key={i} className="group rounded-lg bg-white border border-zinc-100 p-4">
                  <summary className="text-sm font-medium text-zinc-800 cursor-pointer group-open:mb-2">
                    {faq.name}
                  </summary>
                  <p className="text-sm text-zinc-600 leading-relaxed">{faq.acceptedAnswer?.text}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
