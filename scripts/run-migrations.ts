// 在 Supabase 中执行数据库迁移
// 用法: npx tsx scripts/run-migrations.ts
// 需要环境变量: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ 缺少环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 都是必需的");
  console.error("   SUPABASE_SERVICE_ROLE_KEY 请在 Supabase Dashboard → Project Settings → API → service_role 中获取");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, "..");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.startsWith("migration_") && f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("未找到迁移文件");
    return;
  }

  console.log(`找到 ${files.length} 个迁移文件:\n${files.map((f) => `  - ${f}`).join("\n")}\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`执行: ${file}...`);

    const { error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();

    if (error) {
      // rpc 方式可能不可用，尝试通过 REST API 直接执行
      console.log(`  ⚠️ rpc 方式失败，尝试直接查询...`);

      // 检查表是否已存在（通过尝试查询来判断）
      const tableName = file.replace(".sql", "").replace("migration_", "");
      const { error: checkError } = await supabase.from(tableName).select("count", { count: "exact", head: true });

      if (checkError) {
        console.error(`  ❌ ${file} 执行失败，表 '${tableName}' 可能不存在`);
        console.error(`     请在 Supabase SQL Editor 中手动执行此文件: ${file}`);
        console.error(`     SQL Editor: ${url!.replace(".co", ".co")}/project/default/sql/new`);
      } else {
        console.log(`  ✅ 表 '${tableName}' 已存在，跳过`);
      }
    } else {
      console.log(`  ✅ ${file} 执行成功`);
    }
  }

  console.log("\n迁移检查完成！");
}

runMigrations().catch(console.error);
