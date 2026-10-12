#!/usr/bin/env python3
"""新建一条视频的工程：复制 Remotion 模板、写入个人设置、链接共享依赖。

用法：
  python3 new_video.py <某篇笔记>/视频版 [--title 标题]

生成：
  视频版/制作/remotion/      Remotion 工程（src/kit 为通用组件，src/video 为本条视频）
  视频版/制作/旁白稿.md       旁白稿模板（含个人片尾）
  视频版/制作/video.json     本条视频的声音、读音、时间与配乐设置（从 profile.json 复制，可单独修改）
  视频版/成品/

node_modules 链接到 ~/.cache/say-show/ 下按 package-lock 内容区分的共享安装，避免每条视频各装一份（约 1.2 GB）。
"""
import argparse, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
TEMPLATE = SKILL / "assets" / "remotion-template"
CACHE = Path.home() / ".cache" / "say-show"


def profile_path():
    """个人设置：环境变量 SAY_SHOW_PROFILE 优先，其次 skill 目录下的 profile.json（不入库，可为指向私有位置的链接）。"""
    p = Path(os.environ["SAY_SHOW_PROFILE"]) if os.environ.get("SAY_SHOW_PROFILE") else SKILL / "profile.json"
    if not p.exists():
        sys.exit(f"找不到个人设置 {p}：复制 profile.example.json 为 profile.json 并填写，或设置 SAY_SHOW_PROFILE")
    return p


def shared_node_modules():
    lock = (TEMPLATE / "package-lock.json").read_bytes()
    dest = CACHE / ("remotion-" + hashlib.sha256(lock).hexdigest()[:12])
    if not (dest / "node_modules" / "remotion").exists():
        dest.mkdir(parents=True, exist_ok=True)
        for f in ("package.json", "package-lock.json"):
            shutil.copy(TEMPLATE / f, dest / f)
        print(f"首次安装共享依赖到 {dest} …", flush=True)
        subprocess.run(["npm", "ci", "--no-audit", "--no-fund"], cwd=dest, check=True)
    return dest / "node_modules"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dest", help="视频版目录，例如 019-主题/视频版")
    ap.add_argument("--title", default="视频标题")
    a = ap.parse_args()
    dest = Path(a.dest).resolve()
    make = dest / "制作"
    remotion = make / "remotion"
    if remotion.exists():
        sys.exit(f"{remotion} 已存在，不覆盖")
    profile = json.loads(profile_path().read_text())

    shutil.copytree(TEMPLATE, remotion, ignore=shutil.ignore_patterns("node_modules"))
    (remotion / "node_modules").symlink_to(shared_node_modules(), target_is_directory=True)

    b = dict(profile["brand"])
    avatar = Path(b.pop("avatar"))
    if avatar.exists():
        shutil.copy(avatar, remotion / "public" / "brand" / ("avatar" + avatar.suffix.lower()))
        b["avatar"] = "brand/avatar" + avatar.suffix.lower()
    else:
        print(f"⚠ 头像不存在：{avatar}；请放到 remotion/public/brand/ 并改 src/video/brand.json")
        b["avatar"] = "brand/avatar.jpg"
    (remotion / "src" / "video" / "brand.json").write_text(json.dumps(b, ensure_ascii=False, indent=2) + "\n")

    script = make / "旁白稿.md"
    script.write_text(
        f"# {a.title} 旁白稿\n\n"
        "`[[词]]` 是画面锚点，`|` 是字幕换条，两种标记都不进入配音和字幕。段落 id 与 src/video/scenes.tsx 一一对应。\n"
        "每段先写分镜：主风格／点缀风格、底与配色、3—4 个按顺序的动作、收尾定格（见 skill 的 references/style-library.md）。\n\n"
        # 示例段与模板里的 src/video/Intro.tsx 对应，用于跑通流程；正式稿替换它并重写场景
        "## intro · 示例\n\n示例：一条视频有三层，[[旁白]]、[[动画]]，还有[[配乐]]。\n\n"
        f"## outro · {profile['brand']['bye']}\n\n{profile['outro_script']}\n")

    cfg = {
        "script": "旁白稿.md",
        "remotion": "remotion",
        "cache": "缓存",
        "voice": profile["voice"],
        "pronounce": {k: v for k, v in profile["pronounce"].items() if not k.startswith("_")},
        "pronounce_sections": {},
        "seeds": {},
        "timing": profile["timing"],
        "music": profile["music"],
    }
    (make / "video.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
    (dest / "成品").mkdir(exist_ok=True)
    print(f"已建立 {dest}\n下一步：写 {script.relative_to(dest.parent)} → voice.py → 写场景 → music.py → export.py")


if __name__ == "__main__":
    main()
