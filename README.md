# Agentour Tenant Portal

Agentour 多租户 API 的官方独立前端。租户可以直接部署和定制本仓库，也可以参考这里的 API/SDK 集成方式自建门户。

## 安全与身份边界

Portal 不保存 Tenant Service Account、平台密钥或长期访问令牌。租户自己的登录后端必须实现 `VITE_TOKEN_ENDPOINT`，在确认用户登录态后签发短期 Subject Token：

```json
{"access_token":"ts_xxx"}
```

Token Endpoint 应使用同源 Cookie、CSRF 防护和 HTTPS。Service Account 只能保存在租户服务端。前端遇到 401 会单飞刷新 Token，多个并发请求不会重复刷新。

## 本地运行

需要 Node.js 24 和 pnpm 10.23.0。

PowerShell：

```powershell
Copy-Item .env.example .env
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5173
```

默认访问 `http://127.0.0.1:5173`。开发环境必须提供可用的 Token Endpoint；不得把测试或正式 Service Account 写入 `.env`。

## 构建和测试

```powershell
pnpm test
pnpm build
```

## 配置

| 变量 | 用途 |
| --- | --- |
| `VITE_AGENTOUR_API_BASE` | Agentour API 地址 |
| `VITE_TOKEN_ENDPOINT` | 租户后端的短期 Subject Token 端点 |
| `VITE_BRAND_NAME` | 门户品牌名 |
| `VITE_BRAND_LOGO` | Logo URL |
| `VITE_PRIMARY_COLOR` | 主题色 |

## 产品范围

- Agent 搜索、筛选、创建 Session；
- 工作台、会话详情、消息、运行状态、取消和 Artifact；
- 资料库、发布进度、账单和渠道状态；
- 租户总览、内部用户、Agent/模型 Entitlement、资源、凭证与审计；
- 不包含其他租户、平台 Provider、全局财务、服务器、Runner 或全局 E2B 页面。

所有业务能力均通过公开 `/v1/sdk/*`、`/v1/tenant/*` 和租户化 `/v1/dev/*` API 完成，Portal 不调用 `/v1/admin/*`。
