#!/usr/bin/env python3
"""导出成片：更新字体分片 → Remotion 渲染 → 两遍 loudnorm 到 −14 LUFS → 响度、真峰值与完整解码检查 → 关键帧总览与导出记录。

在视频的 制作/ 目录下运行：
  python3 export.py ../成品/02-标题-横版.mp4                 # 完整渲染并导出
  python3 export.py ../成品/02-标题-横版.mp4 --input 已渲染.mp4   # 跳过渲染，只做响度与检查
  python3 export.py --cover ../成品/01-竖版封面.jpg            # 只渲染竖版封面

渲染需要启动 Chrome，Claude Code 的沙箱里会超时，需要在沙箱外运行。整片渲染约 10 fps，3 分钟视频约 10 分钟。
"""
import argparse, hashlib, json, re, subprocess, sys, tempfile
from pathlib import Path

CFG_PATH = Path("video.json").resolve()
if not CFG_PATH.exists():
    sys.exit("请在含 video.json 的 制作/ 目录下运行")
BASE = CFG_PATH.parent
CFG = json.loads(CFG_PATH.read_text())
REMOTION = BASE / CFG.get("remotion", "remotion")


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


ap = argparse.ArgumentParser()
ap.add_argument("out", nargs="?")
ap.add_argument("--input", help="已渲染的视频，跳过渲染")
ap.add_argument("--cover", help="渲染竖版封面到此路径")
ap.add_argument("--peak", type=float, default=-1.5, help="loudnorm 真峰值目标，默认 −1.5，成片实测约 −1.0 dBTP")
a = ap.parse_args()

run(["node", "scripts/font-subsets.cjs"], cwd=REMOTION)
if a.cover:
    run(["npx", "remotion", "still", "Cover", str(Path(a.cover).resolve()), "--timeout=180000"], cwd=REMOTION)
    print("封面 →", a.cover)
if not a.out:
    sys.exit(0)

out = Path(a.out).resolve(); out.parent.mkdir(parents=True, exist_ok=True)
tmpdir = Path(tempfile.mkdtemp(prefix="xhs-export-"))
src = Path(a.input).resolve() if a.input else tmpdir / "render.mp4"
if not a.input:
    run(["npx", "remotion", "render", "Main", str(src), "--codec=h264", "--crf=18", "--timeout=180000"], cwd=REMOTION)

e = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm=I=-14:TP={a.peak}:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.findall(r"\{[^{}]*\}", e)[-1])
af = (f"loudnorm=I=-14:TP={a.peak}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])

r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout)
decode = subprocess.run(["ffmpeg", "-v", "error", "-i", str(out), "-f", "null", "-"], capture_output=True, text=True).stderr.strip() == ""
preview = BASE / "预览"; preview.mkdir(exist_ok=True)
run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf", "fps=1/8,scale=384:-1,tile=6x5", "-frames:v", "1", str(preview / "全片关键帧.jpg")])
data = out.read_bytes()
record = {"文件": str(out.relative_to(BASE.parent)) if out.is_relative_to(BASE.parent) else str(out), "时长s": round(dur, 1),
          "大小MB": round(len(data) / 1e6, 2), "响度LUFS": lufs, "真峰值dBTP": peak, "完整解码": "通过" if decode else "失败",
          "sha256": hashlib.sha256(data).hexdigest()}
(BASE / "导出检查.json").write_text(json.dumps(record, ensure_ascii=False, indent=1) + "\n")
if not a.input:
    src.unlink(missing_ok=True)
tmpdir.rmdir() if not any(tmpdir.iterdir()) else None
print(json.dumps(record, ensure_ascii=False))
if not decode or peak > -0.5 or abs(lufs + 14) > 1:
    print("⚠ 响度、峰值或解码不达标，请检查")
