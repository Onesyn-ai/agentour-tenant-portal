# Agentour Tenant Portal

Agentour租户API的官方前端实现。租户可以直接部署、修改源码，或仅参考本项目使用API/SDK自行开发。

## 身份边界

本项目不提供注册、密码、成员或组织架构。租户自己的后端必须实现 `VITE_TOKEN_ENDPOINT`，为已登录内部用户返回Agentour短期Subject Token：

```json
{"access_token":"ts_xxx"}
```

Tenant Service Account只能保存在租户后端，严禁写入本项目配置或浏览器。

## 启动

```bash
cp .env.example .env
pnpm install
pnpm dev
```

## 构建与测试

```bash
pnpm test
pnpm build
```

## 功能范围

- 租户发现页与Agent运行；
- 用户工作台、资料库、发布和账单入口；
- 租户用量与审计管理视图；
- 飞书统一应用接入说明；
- 品牌和Token Endpoint配置。

平台租户管理、模型Provider、全局财务、服务器和其他租户数据不属于本门户。
