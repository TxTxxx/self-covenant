# 自我契约

给自己用的奖励网页 App：一次一个奖励、一个连续目标，每日截止前打卡，中断归零，连续达成后解锁奖励。

## 本地运行

需要 Node.js 22 或更新版本，无需安装依赖。

```sh
npm run dev
```

打开 http://localhost:4173 。运行规则测试：

```sh
npm test
```

## 使用规则

- 创建时写清奖励、目标、连续天数（1–365）、每日截止时间（00:01–23:59）。
- 当天已到截止时间时，契约从次日起算。
- 截止时间为严格边界，07:30 截止意味着 07:30:00 起不再接受当天打卡。
- 漏打卡后连续天数归零，次日自动重来；奖励、目标及历史记录保留。
- 不补卡。修改条件或奖励需结束原契约后重新创建。
- 创建时固定规则时区，后续以该时区判断日历日期和截止时间。
- 完成后手动标记奖励已兑现，才能创建下一个契约。

## 数据与备份

数据保存在当前浏览器的 localStorage，键名 `self-covenant.v1`。没有服务器、账号、云同步或第三方追踪。

设置页支持 JSON 导出和导入。导入会先验证版本、契约数量、时间和打卡记录，再展示替换确认；确认前不会修改本地记录。导入旧备份后仍按当前时间核算漏打卡。

清除网站数据、更换设备、浏览器或域名会影响数据访问。建议定期导出到 iPhone「文件」。应用以设备时间和自我确认为准，不提供防篡改或现实行为证明。网页在后台无需运行，下次进入或打卡时会重新核算状态。

## GitHub Pages

`.github/workflows/pages.yml` 已配置：向 `main` 推送或手动运行工作流时，执行测试并发布 `public/`。无需构建或 npm install。所有资源使用相对路径，可部署到仓库子路径。

1. 将本项目连接到自己的 GitHub 仓库，并推送到 `main`。
2. 在仓库 Settings → Pages 中选择 GitHub Actions 作为发布来源。
3. 等待 Deploy to GitHub Pages 工作流成功。
4. 在 Pages 设置里填写个人域名，并按 GitHub 给出的域名配置说明设置 DNS、启用 HTTPS。

仓库：[TxTxxx/self-covenant](https://github.com/TxTxxx/self-covenant)。

域名：[yue.txtxx.me](https://yue.txtxx.me)。Cloudflare CNAME `yue` → `txtxxx.github.io`，仅 DNS；GitHub Pages 使用 GitHub Actions 发布。只发布 `public/`，产品文档、设计简报、测试和开发资料不进入站点部署。

## 文件

- `public/core.mjs`：时间、连续记录和备份验证。
- `public/app.mjs`：页面交互和本机持久化。
- `public/styles.css`：响应式样式和状态。
- `tests/core.test.mjs`：截止边界、归零、达成与备份规则测试。
- `PRODUCT.md`、`SHAPE.md`、`DESIGN.md`：产品与设计记录。

第一版不包含推送提醒、Service Worker 离线缓存或自动云端备份。
