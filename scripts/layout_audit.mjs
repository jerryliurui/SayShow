#!/usr/bin/env node
/*
排版检查：按固定间隔渲染静帧，在页面里测量每一行可见文字的实际位置，找出
  1. 文字互相压住（两段文字的行框重叠）
  2. 文字压到画面对象或被对象盖住（建筑、图标、卡片等真正有绘制的元素；透明 PNG 按像素透明度判断）
  3. 文字出画（超出画面，或低于 --bottom 指定的安全线）
  4. 文字被自身容器截断（overflow 隐藏了内容）

在视频的 制作/ 目录下运行（与 export.py 相同，读取 video.json 找 Remotion 工程）：
  node <SayShow>/scripts/layout_audit.mjs                   # 每 3 秒一帧
  node <SayShow>/scripts/layout_audit.mjs --every 1 --bottom 890
  node <SayShow>/scripts/layout_audit.mjs --times 12.5,47 # 只查指定秒数

输出到 排版检查/：报告.json、报告.md，有问题的帧另存标注图（红框＝文字互压，橙框＝压到对象，紫框＝出画或截断）。
有意叠在对象上的文字（如落在屋顶上的名牌）给文字或其祖先加 data-audit="ignore"，
有意垫在文字下面的对象加 data-audit="backdrop"。
这是排版的客观检查，不能代替按帧观看：采样之间一闪而过的重叠、旋转元素的精确轮廓都可能漏掉。
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const args = process.argv.slice(2);
const val = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const cfgPath = path.resolve('video.json');
if (!fs.existsSync(cfgPath)) {
  console.error('请在含 video.json 的 制作/ 目录下运行');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const remotion = path.resolve(cfg.remotion || 'remotion');
const require = createRequire(path.join(remotion, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {openBrowser, selectComposition, renderStill} = require('@remotion/renderer');

const compositionId = val('--composition', 'Main');
const every = Number(val('--every', 3));
const concurrency = Number(val('--concurrency', Math.max(1, Math.min(4, os.cpus().length >> 1))));
const outDir = path.resolve(val('--out', '排版检查'));
const minCover = Number(val('--min-cover', 0.2));
const minOpacity = Number(val('--min-opacity', 0.6));
// Remotion 从当前目录找 node_modules/.remotion 里的浏览器；切到工程目录，才会用上共享依赖里已有的那份，不重新下载。
process.chdir(remotion);

// 在页面里执行：只能用页面内的变量，不能引用外部作用域。
function probe(opt) {
  const W = innerWidth, H = innerHeight, bottom = opt.bottom ?? H;
  const style = document.createElement('style');
  style.textContent = '*{pointer-events:auto!important}';
  document.head.appendChild(style);
  const alpha = (c) => {
    if (!c || c === 'transparent') return 0;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const p = m[1].split(/[ ,/]+/).filter(Boolean);
    return p.length > 3 ? parseFloat(p[3]) * (p[3].endsWith('%') ? 0.01 : 1) : 1;
  };
  const opacity = (el) => {
    let o = 1;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= +cs.opacity;
    }
    return o;
  };
  const paints = (el) => {
    const cs = getComputedStyle(el);
    if (alpha(cs.backgroundColor) > 0.1 || cs.backgroundImage !== 'none') return true;
    return ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0.5 && cs['border' + s + 'Style'] !== 'none' && alpha(cs['border' + s + 'Color']) > 0.2);
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const describe = (el) => {
    const named = el.closest('[data-audit-name]');
    if (named) return named.getAttribute('data-audit-name');
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    if (cls) s += '.' + cls;
    if (el.tagName === 'IMG') s += ' ' + decodeURIComponent(new URL(el.src, location.href).pathname.split('/').pop());
    if (ownText(el)) s += ' “' + el.textContent.trim().slice(0, 16) + '”';
    return s;
  };
  const r4 = (r) => ({x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)});

  // 收集可见文字，按所在元素分组，每行一个矩形。
  const items = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode()); ) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || el.closest('script,style,title,[data-audit="ignore"]')) continue;
    const o = opacity(el);
    if (o < 0.15) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const lines = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    if (!lines.length) continue;
    if (!items.has(el)) items.set(el, {el, text: '', opacity: o, lines: []});
    const it = items.get(el);
    it.text += n.textContent.trim();
    it.lines.push(...lines);
  }
  const texts = [...items.values()];
  const issues = [];

  // 1. 出画与截断：字幕（data-audit="caption"）不受安全线限制；截断看的是祖先容器实际裁掉了多少。
  for (const t of texts) {
    const caption = t.el.closest('[data-audit="caption"]');
    for (const r of t.lines) {
      const low = !caption && r.bottom > bottom + 1;
      if (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1 || low) {
        issues.push({type: '出画', text: t.text.slice(0, 40), rect: r4(r), detail: r.bottom <= H + 1 && low ? `低于安全线 y=${bottom}` : '超出画面'});
        break;
      }
    }
    clip: for (let e = t.el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (!/hidden|clip/.test(cs.overflowX + cs.overflowY)) continue;
      const c = e.getBoundingClientRect();
      if (c.width >= 0.95 * W && c.height >= 0.95 * H) continue; // 整个画面的容器，交给“出画”
      for (const r of t.lines) {
        const cutY = Math.max(0, c.top - r.top) + Math.max(0, r.bottom - c.bottom);
        const cutX = Math.max(0, c.left - r.left) + Math.max(0, r.right - c.right);
        if (cutY > 0.3 * r.height || cutX > 6) {
          issues.push({type: '截断', text: t.text.slice(0, 40), rect: r4(r), otherRect: r4(c), detail: `被 ${describe(e)} 裁掉 ${Math.round(Math.max(cutX, cutY))}px`});
          break clip;
        }
      }
    }
  }

  // 2. 文字互压：不同元素、互不包含，行框横向重叠超过 6px，纵向重叠超过较矮一行的 30%。
  // 半透明（正在淡入淡出）的文字和转场里同一段文字的两份副本不算。
  const solid = texts.filter((t) => t.opacity >= opt.minOpacity);
  const twin = (a, b) => a.text === b.text;
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = solid[i], b = solid[j];
      if (a.el.contains(b.el) || b.el.contains(a.el) || twin(a, b)) continue;
      let hit = null;
      for (const ra of a.lines) {
        for (const rb of b.lines) {
          const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ix > 6 && iy > 0.3 * Math.min(ra.height, rb.height)) hit = [ra, rb];
        }
      }
      if (hit) issues.push({type: '文字互压', text: a.text.slice(0, 40), other: b.text.slice(0, 40), rect: r4(hit[0]), otherRect: r4(hit[1])});
    }
  }

  // 3. 文字与对象：在每行文字的字形区域取样，看这个点上方或下方有没有真正有绘制的其他元素。
  const canvases = new Map();
  const imgAlpha = (img, x, y) => {
    try {
      if (!canvases.has(img.src)) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d', {willReadFrequently: true});
        g.drawImage(img, 0, 0);
        canvases.set(img.src, g);
      }
      const g = canvases.get(img.src), r = img.getBoundingClientRect(), fit = getComputedStyle(img).objectFit;
      let bx = r.left, by = r.top, bw = r.width, bh = r.height;
      if (fit === 'contain' || fit === 'scale-down') {
        const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
        bw = img.naturalWidth * s; bh = img.naturalHeight * s; bx += (r.width - bw) / 2; by += (r.height - bh) / 2;
      }
      const px = Math.floor(((x - bx) / bw) * img.naturalWidth), py = Math.floor(((y - by) / bh) * img.naturalHeight);
      if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return 0;
      return g.getImageData(px, py, 1, 1).data[3] / 255;
    } catch {
      return 1; // 跨域等情况读不到像素，按不透明处理
    }
  };
  // 作为“对象”时更严格：淡色装饰（半透明圆斑）不算；只有描边的框，取样点落在描边那一圈上才算。
  const surface = (e, x, y) => {
    const cs = getComputedStyle(e), o = opacity(e), bi = cs.backgroundImage;
    const imgA = bi === 'none' ? 0 : /url\(/.test(bi) ? 1 : Math.max(0, ...[...bi.matchAll(/rgba?\([^)]+\)/g)].map((m) => alpha(m[0])), /#[0-9a-f]{3,8}\b/i.test(bi) ? 1 : 0);
    if (Math.max(alpha(cs.backgroundColor), imgA) * o >= 0.6) return true;
    const r = e.getBoundingClientRect();
    const bw = (s) => (cs['border' + s + 'Style'] !== 'none' && alpha(cs['border' + s + 'Color']) * o > 0.2 ? parseFloat(cs['border' + s + 'Width']) : 0);
    return (bw('Left') > 0.5 && x - r.left <= bw('Left') + 2) || (bw('Right') > 0.5 && r.right - x <= bw('Right') + 2) ||
      (bw('Top') > 0.5 && y - r.top <= bw('Top') + 2) || (bw('Bottom') > 0.5 && r.bottom - y <= bw('Bottom') + 2);
  };
  const solidObject = (e, x, y, t) => {
    if (e.closest('[data-audit="backdrop"]') || opacity(e) < opt.minOpacity) return false;
    if (solid.some((s) => s !== t && twin(s, t) && e.contains(s.el))) return false; // 转场里的另一份副本
    const r = e.getBoundingClientRect();
    if (r.width * r.height > 0.5 * W * H) return false; // 整屏背景
    const tag = e.tagName.toLowerCase();
    if (tag === 'img') return imgAlpha(e, x, y) > 0.1;
    if (tag === 'canvas' || tag === 'video') return true;
    if (tag === 'svg' || tag === 'foreignobject') return surface(e, x, y);
    if (e instanceof SVGElement) return tag !== 'g' && !e.closest('text'); // 命中的图形本身就有填充或描边
    return surface(e, x, y);
  };
  for (const t of solid) {
    const found = new Map();
    let samples = 0;
    for (const r of t.lines) {
      for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        for (const fy of [0.35, 0.65]) {
          const x = r.left + r.width * fx, y = r.top + r.height * fy;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          samples++;
          const stack = document.elementsFromPoint(x, y);
          let idx = stack.findIndex((e) => e === t.el || e.contains(t.el));
          if (idx < 0) idx = stack.length;
          const over = stack.slice(0, idx).filter((e) => !t.el.contains(e));
          const under = [];
          for (const e of stack.slice(idx)) {
            if (e.contains(t.el)) {
              if (paints(e)) break; // 文字自己的底色或垫在下面的卡片，再往下的东西被它挡住
              continue;
            }
            under.push(e);
          }
          for (const [kind, list] of [['被对象盖住', over], ['压到对象', under]]) {
            const e = list.find((e) => solidObject(e, x, y, t));
            if (!e) continue;
            const key = kind + '|' + describe(e);
            if (!found.has(key)) found.set(key, {kind, el: e, hits: 0});
            found.get(key).hits++;
          }
        }
      }
    }
    for (const f of found.values()) {
      const cover = f.hits / Math.max(samples, 1);
      if (cover >= opt.minCover) issues.push({type: f.kind, text: t.text.slice(0, 40), object: describe(f.el), cover: +cover.toFixed(2), rect: r4(t.lines[0]), otherRect: r4(f.el.getBoundingClientRect())});
    }
  }
  style.remove();
  return {frame: window.remotion_initialFrame, texts: texts.length, issues};
}

const colors = {文字互压: 'red', 压到对象: 'orange', 被对象盖住: 'orange', 出画: 'magenta', 截断: 'magenta'};
function annotate(png, jpg, issues) {
  const box = (r, c, t) => `drawbox=x=${Math.max(0, r.x)}:y=${Math.max(0, r.y)}:w=${Math.max(2, r.w)}:h=${Math.max(2, r.h)}:color=${c}@0.9:t=${t}`;
  const filters = issues.flatMap((i) => [box(i.rect, colors[i.type], 4), ...(i.otherRect ? [box(i.otherRect, colors[i.type], 2)] : [])]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', filters.join(',') || 'null', '-q:v', '3', jpg]);
}

console.log('打包 Remotion 工程…');
const serveUrl = await bundle({entryPoint: path.join(remotion, 'src/index.ts'), rootDir: remotion, rspack: true});
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id: compositionId, puppeteerInstance: browser});
const {fps, durationInFrames, height} = composition;
const bottom = Number(val('--bottom', height));
const frames = val('--times')
  ? val('--times').split(',').map((s) => Math.min(durationInFrames - 1, Math.round(Number(s) * fps)))
  : Array.from({length: Math.ceil(durationInFrames / fps / every)}, (_, k) => Math.round((every / 2 + k * every) * fps)).filter((f) => f < durationInFrames);

const results = new Map();
const newPage = browser.newPage.bind(browser);
browser.newPage = async (o) => {
  const page = await newPage(o);
  const close = page.close.bind(page);
  page.close = async (opts) => {
    try {
      const r = await page.evaluate(probe, {bottom, minCover, minOpacity});
      results.set(r.frame, r);
    } catch (e) {
      console.error('测量失败', e.message);
    }
    return close(opts);
  };
  return page;
};

fs.mkdirSync(outDir, {recursive: true});
for (const f of fs.readdirSync(outDir)) if (/^f\d+.*\.jpg$/.test(f)) fs.unlinkSync(path.join(outDir, f));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-audit-'));
const queue = [...frames];
let done = 0;
async function worker() {
  for (let frame; (frame = queue.shift()) !== undefined; ) {
    const png = path.join(tmp, `${frame}.png`);
    await renderStill({serveUrl, composition, frame, output: png, imageFormat: 'png', puppeteerInstance: browser, overwrite: true});
    const r = results.get(frame);
    if (r?.issues.length) annotate(png, path.join(outDir, `f${String(frame).padStart(5, '0')}-${(frame / fps).toFixed(1)}s.jpg`), r.issues);
    fs.unlinkSync(png);
    if (++done % 10 === 0) console.log(`${done}/${frames.length}`);
  }
}
try {
  await Promise.all(Array.from({length: concurrency}, worker));
} finally {
  await browser.close({silent: true});
  fs.rmSync(tmp, {recursive: true, force: true});
  fs.rmSync(serveUrl, {recursive: true, force: true}); // 打包目录含整份 public，不留在临时目录
}

const rows = frames.map((f) => ({frame: f, time: +(f / fps).toFixed(2), ...(results.get(f) || {texts: 0, issues: [], error: '未取得测量'})}));
const count = {};
for (const r of rows) for (const i of r.issues) count[i.type] = (count[i.type] || 0) + 1;
fs.writeFileSync(path.join(outDir, '报告.json'), JSON.stringify({composition: compositionId, every, bottom, minCover, frames: rows.length, count, rows}, null, 1) + '\n');
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const md = [
  `# 排版检查`,
  ``,
  `每 ${every} 秒一帧，共 ${rows.length} 帧；安全线 y=${bottom}。` + (Object.keys(count).length ? '问题：' + Object.entries(count).map(([k, v]) => `${k} ${v}`).join('，') + '。' : '未发现问题。'),
  ``,
  ...rows.filter((r) => r.issues.length || r.error).flatMap((r) => [
    `## ${fmt(r.time)}（第 ${r.frame} 帧）`,
    ...(r.error ? [`- ${r.error}`] : []),
    ...r.issues.map((i) => `- **${i.type}**：“${i.text}”` + (i.other ? ` ↔ “${i.other}”` : '') + (i.object ? ` ↔ ${i.object}（取样覆盖 ${Math.round(i.cover * 100)}%）` : '') + (i.detail ? `，${i.detail}` : '')),
    ``,
  ]),
];
fs.writeFileSync(path.join(outDir, '报告.md'), md.join('\n'));
console.log(md.slice(0, 3).join('\n'));
console.log('报告 →', path.join(outDir, '报告.md'));
