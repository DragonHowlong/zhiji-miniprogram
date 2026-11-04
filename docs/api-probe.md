# 现网 Worker API 探测记录

探测时间：2026-11-04（Asia/Shanghai）  
基址：`https://zhiji-board.wanghowlonggg.workers.dev`  
探测方式：curl（本机 box）

## 可用

| 方法 | 路径 | 结果 | 说明 |
|------|------|------|------|
| GET | `/` | 200 `{"ok":true,"service":"zhiji-board"}` | 健康 |
| GET | `/health` | 200 同上 | 健康 |
| OPTIONS | `/zhiji/score` | 204 | CORS 预检 |
| POST | `/zhiji/score` | 400 without quizId；正常提交成绩 | 榜只记首次（fp） |
| GET | `/zhiji/board?quizId=` | 200 数组 | 排行榜 |
| POST | `/zhiji/owner` | 400 without quizId | 注册出题人 token 哈希 |
| POST | `/zhiji/msg` | 400 without quizId | 留言写入 |
| GET | `/zhiji/msg` | 需 X-Owner-Token | 仅出题人可读 |
| POST | `/zhiji/hit` | 需 quizId | 打开/发布/作答计数 |
| POST | `/zhiji/feedback` | 需 text | 站点反馈 |
| GET | `/zhiji/stats` | 403 无管理员令牌 | 管理端，小程序不接 |
| GET | `/zhiji/feedback` | 403 | 管理端，小程序不接 |

CORS 响应头（现网）：
- `access-control-allow-origin: *`
- `access-control-allow-headers: Content-Type, Authorization, X-Admin-Token, X-Owner-Token`
- `access-control-allow-methods: GET,POST,OPTIONS`

## 失败 / 缺口

| 方法 | 路径 | 结果 | 影响 |
|------|------|------|------|
| * | `/zhiji/quiz` | 404 | 短 id 云端存卷不可用；小程序分享靠 `q=` 载荷 / 原生转发 |
| * | `https://zhiji-api.pages.dev` | 不可达 | 已弃用旁路，勿再写死 |
| 其他 `/api/*`、`/board` 等旧路径 | 404 | 勿用 |

## 小程序合法域名（需用户在公众平台配置）

开发阶段可用开发者工具「不校验合法域名」。体验版/正式版必须配置：

**request 合法域名**（建议）：
- `https://zhiji-board.wanghowlonggg.workers.dev`

注意：微信可能对 `*.workers.dev` 有额外限制或审核质疑；若被拒，需自定义域名再绑 Worker（**域名材料齐了再回报 Bot小网 + Bot业，勿自行改 Worker secret / 部署**）。

**uploadFile / downloadFile**：本 MVP 暂不需要。

**业务域名 / web-view**：本 MVP 无 web-view。

## 密钥

- 前端 / 本仓库 **禁止** 写入 DEV_TOKEN / Admin Token / Cloudflare Secret。
- `ownerToken` 只存出题人设备本地；分享 path **不得**携带。
- 本探测未使用、未打印任何密钥。
