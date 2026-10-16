# SayShow

**说什么，就演什么。** 给 Claude Code 和 Codex 用的 Agent Skill（skill 名 `say-show`）：把素材做成**有旁白、同步字幕和讲解动画**的讲解视频，默认按小红书视频笔记的习惯（横版正文、竖版及两种横版封面（3:4、16:9、4:3）、同步字幕），流程是"稿件 → 配音 → 对齐 → 动画 → 配乐 → 导出"，保留可编辑的 Remotion 工程，可以逐轮修改。

## 能做什么

- **口语旁白与分镜**：先把内容改成自然口语，逐句设计画面。稿件里用 `[[词]]` 标出"讲到这个词时画面要动"。
- **声音克隆配音**：Qwen3-TTS 本地克隆（Apple Silicon，mlx-audio），压缩停顿到约 300 字/分钟；读错的词可以一次合成多版候选，挑一版采用。
- **逐字对齐**：Whisper 逐字时间对齐稿件，生成单行硬切字幕和动画触发帧。
- **Remotion 组件**：
  - 布局：固定层（标题和页脚不抖）、圆形转场、通用片尾（头像、一键三连）。
  - 讲解动画：焦点框、飞行标签、逐字打出、跟读、数字滚动、描框。
  - 开发实录：代码编辑器打字、真实录屏片段（变速、推近）、快捷键键帽、iPhone 外框、章节标签。
- **配乐**：程序原创合成（BPM 可调），或者用现成授权曲目；说话时自动压低，开头柔和起音，结尾淡出。
- **检查与导出**：时间线结构检查、导出 SRT、两遍响度到 −14 LUFS、真峰值与解码检查、关键帧总览、节奏测量。
- **风格库**：29 种画风的要点、实现方式、适用内容和选型方法，含"开发实录"风格。

## 环境

- macOS（Apple Silicon），Node 18+，ffmpeg。
- Python 3.11 虚拟环境 `~/.venvs/say-show`：`python3.11 -m venv ~/.venvs/say-show && ~/.venvs/say-show/bin/pip install mlx-audio mlx-whisper numpy scipy soundfile`。
- 首次新建视频时，模板依赖会安装到 `~/.cache/say-show/`，之后所有视频共享，不再每条各装一份。

## 安装

```bash
git clone https://github.com/jerryliurui/SayShow.git ~/Documents/SayShow
ln -s ~/Documents/SayShow ~/.claude/skills/say-show   # Claude Code
ln -s ~/Documents/SayShow ~/.codex/skills/say-show    # Codex
cp ~/Documents/SayShow/profile.example.json ~/Documents/SayShow/profile.json   # 填写个人设置
```

`profile.json` 写账号名、头像、片尾话术、声音参考录音及其逐字稿、读音替换。它在 `.gitignore` 里，不会进入仓库；也可以用环境变量 `SAY_SHOW_PROFILE` 指向别处的私有文件。只克隆你本人或已获授权的声音，发布时按平台规则标注 AI 合成。

## 快速开始

```bash
S=~/Documents/SayShow/scripts; PY=~/.venvs/say-show/bin/python
python3 $S/new_video.py 019-主题/视频版 --title 标题 && cd 019-主题/视频版/制作
$PY $S/voice.py                     # 配音与时间线；读错时：voice.py takes 段落 1,2,3 → voice.py pick 段落=种子
$PY $S/music.py                     # 配乐（旁白每次重建后重跑）
python3 $S/audit_timeline.py remotion/src/video/timeline.json --srt ../成品/字幕.srt
python3 $S/export.py ../成品/02-标题-横版.mp4 && python3 $S/export.py --cover ../成品/01-竖版封面.jpg --cover-landscape ../成品/01-横版封面.jpg --cover-4-3 ../成品/01-横版封面-4比3.jpg
```

完整流程和规则见 [SKILL.md](SKILL.md)。

## 目录

```
SKILL.md                     工作流（Agent 读取的入口）
profile.example.json         个人设置示例
assets/remotion-template/    Remotion 工程模板：src/kit 通用组件，src/video 单条视频
scripts/                     new_video / voice / music / audit_timeline / export / measure_rhythm
references/                  音画联动、声音与字幕、时间线、风格库、开发实录等说明
```

## 来源说明

风格库和节奏参考来自对公开视频的观看与测量，文档里只写自己的归纳和数据，不转载原作内容；来源在对应文档开头注明。

## 许可证

[MIT](LICENSE)
