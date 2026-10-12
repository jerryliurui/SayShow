// 扫描 src/video 与 src/kit 中的文字，生成 Noto Sans SC 需要加载的分片清单，减少字体请求。
// 用法：node scripts/font-subsets.cjs   （改动画面或稿件文字、重新生成时间线后重跑）
const fs = require("fs");
const path = require("path");
const { getInfo } = require("@remotion/google-fonts/NotoSansSC");
const src = path.join(__dirname, "..", "src");
const out = path.join(src, "video", "fontSubsets.json");
const text = ["video", "kit"].flatMap((d) => fs.readdirSync(path.join(src, d))
  .filter((f) => /\.(tsx|json)$/.test(f) && f !== "fontSubsets.json")
  .map((f) => fs.readFileSync(path.join(src, d, f), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1"))).join("");   // 注释里的字不算
const cps = [...new Set([...text].map((c) => c.codePointAt(0)))];
const need = Object.entries(getInfo().unicodeRanges).filter(([, r]) =>
  r.split(",").some((p) => {
    const [a, b] = p.trim().replace("U+", "").split("-").map((x) => parseInt(x, 16));
    return cps.some((c) => c >= a && c <= (b ?? a));
  })).map(([k]) => k);
fs.writeFileSync(out, JSON.stringify(need));
console.log(`${need.length} 个分片 → ${path.relative(process.cwd(), out)}`);
