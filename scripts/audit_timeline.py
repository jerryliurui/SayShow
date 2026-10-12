#!/usr/bin/env python3
"""检查 voice.py 生成的时间线，并可导出 SRT。

用法：python3 audit_timeline.py remotion/src/video/timeline.json [--srt ../成品/字幕.srt]

检查：段落首尾相接、帧号一致；字幕按时间排列、首尾相接、不超出片长；锚点落在所属段落的口播范围内；
旁白音频时长与时间线一致；场景代码里用 b("词") 引用的锚点在时间线中存在。
只证明时间结构正确，不证明字幕发音正确，也不能代替观看和试听。
"""
import argparse, json, re, subprocess, sys
from pathlib import Path


def stamp(frame, fps):
    ms = round(frame / fps * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


ap = argparse.ArgumentParser()
ap.add_argument("timeline")
ap.add_argument("--srt")
a = ap.parse_args()
path = Path(a.timeline).resolve()
T = json.loads(path.read_text())
fps, total = T["fps"], T["durationInFrames"]
errors, warnings = [], []

secs = T["sections"]
for x, y in zip(secs, secs[1:]):
    if x["endFrame"] != y["startFrame"]:
        errors.append(f"段落 {x['id']} 与 {y['id']} 不相接（{x['endFrame']} → {y['startFrame']}）")
for s in secs:
    if not (s["startFrame"] < s["voiceEndFrame"] <= s["endFrame"]):
        errors.append(f"段落 {s['id']} 帧范围无效")
if secs[-1]["endFrame"] != total:
    errors.append(f"最后一段结束于 {secs[-1]['endFrame']}，片长 {total}")

caps = T["captions"]
for i, c in enumerate(caps):
    if c["startFrame"] >= c["endFrame"]:
        errors.append(f"字幕 {i}「{c['text']}」时长为零或倒置")
    if i and caps[i - 1]["endFrame"] != c["startFrame"]:
        warnings.append(f"字幕 {i - 1} 与 {i} 不首尾相接")
    if c["endFrame"] > total:
        errors.append(f"字幕 {i} 超出片长")
    w = sum(1 if ord(ch) > 0x2E80 else 0.55 for ch in c["text"])   # 与 voice.py 断条同一套宽度：汉字 1，英文数字 0.55
    if w > 24:
        warnings.append(f"字幕 {i} 较长（约 {w:.0f} 字宽）：{c['text']}")

by_id = {s["id"]: s for s in secs}
for k, f in T["anchors"].items():
    sid = k.split(".", 1)[0]; s = by_id.get(sid)
    if not s or not (s["startFrame"] <= f <= s["voiceEndFrame"]):
        errors.append(f"锚点 {k}={f} 不在段落 {sid} 的口播范围内")

root = path.parents[2]
if T.get("voice"):
    wav = root / "public" / T["voice"]
    if wav.exists():
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)], capture_output=True, text=True).stdout)
        if abs(d * fps - total) > 2:
            errors.append(f"旁白音频 {d:.2f}s 与时间线 {total / fps:.2f}s 不一致")
    else:
        errors.append(f"缺少旁白音频 {wav}")
if T.get("music") and not (root / "public" / T["music"]).exists():
    errors.append("时间线引用的配乐文件不存在")

# 场景文件里 `const b = beats("段落")` 之后的 b("词") 都必须是该段的锚点
for f in path.parent.glob("*.tsx"):
    src = f.read_text()
    for sid, body in re.findall(r'const b = beats\("(\w+)"\);([\s\S]*?)(?=\nexport const |\Z)', src):
        for name in sorted(set(re.findall(r'\bb\("([^"]+)"', body))):
            if f"{sid}.{name}" not in T["anchors"]:
                errors.append(f"{f.name} 引用了不存在的锚点 {sid}.{name}（稿件里要用 [[{name}]] 标出）")

print(f"{len(secs)} 段，{len(caps)} 条字幕，{len(T['anchors'])} 个锚点，片长 {total / fps:.2f}s")
for w in warnings:
    print("提示：", w)
for e in errors:
    print("错误：", e)
if a.srt:
    Path(a.srt).write_text("\n".join(f"{i + 1}\n{stamp(c['startFrame'], fps)} --> {stamp(c['endFrame'], fps)}\n{c['text']}\n" for i, c in enumerate(caps)))
    print("SRT →", a.srt)
sys.exit(1 if errors else 0)
