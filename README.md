# 默契测试 · 微信小程序 MVP

独立工程（本仓库），**不**放入 GitHub Pages 主仓根目录。  
AppID 占位：`touristappid`。分支：`feat/miniprogram-mvp`（只开 PR，**不提审、不合 main**）。

## 打开方式

1. 微信开发者工具 → 导入项目 → 选择本目录。
2. AppID：测试号 / `touristappid`；有正式 ID 后再替换（见 `docs/launch.md`）。
3. 云电脑 AppImage：`/workspace/wechat-devtools/WeChat_Dev_Tools.AppImage`（遇登录墙请用户扫码）。

## 主路径

出题（题库抽题）→ 设置奖励/门槛 → 生成问卷 → 微信原生转发 → 好友打开作答 → 算默契度 → 结果页 / 再答 → 排行榜读现网 Worker。

产品定位：**自测 / 投票式问卷工具**（个人主体过审取向）；匿名信入口默认关闭。  
主体说明：由**监护人/亲友（满 18）**个人账号注册，不是未成年本人账号。

## 对接

- Worker：`https://zhiji-board.wanghowlonggg.workers.dev`
- 已接：`/zhiji/score`、`/zhiji/board`、`/zhiji/owner`、`/zhiji/hit`（msg 已封装，UI 默认隐藏）
- 缺口：`/zhiji/quiz` 404；合法域名需用户配置；隐私 URL 待拍板

## 文档

- `docs/launch.md` — AppID、主体、类目、体验版
- `docs/api-probe.md` — 现网探测与 CORS
- `docs/domain-whitelist.md` — 域名清单
- `docs/privacy.md` / `docs/terms.md` — 协议占位

## 禁止

密钥入库、擅自部署 Cloudflare、合 main、提审、改 H5 仓 PR。
