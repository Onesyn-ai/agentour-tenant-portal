import type { PortalConfig } from "./config";

export type Agent = { id: string; name: string; description: string; icon?: string; tags?: string[]; kind?: string };
export type TenantContext = { mode: "tenant"; tenant: { id: string; name: string; balance_credits: number; capabilities: Record<string, boolean>; settings: Record<string, unknown> }; actor_type: string; subject_id?: string; scopes: string[]; agents: string[]; models: string[] };
export type Session = {id:string;agent_id:string;state:string;title?:string;created_at:number;updated_at:number;spent:number};
export type LibraryItem = {id:string;title?:string;name?:string;origin_kind?:string;updated_at?:number};

export class AgentourClient {
  private token = "";
  constructor(private config: PortalConfig, private tokenProvider?: () => Promise<string>) {}

  setToken(token: string) { this.token = token; }
  private async accessToken() {
    if (this.tokenProvider) this.token = await this.tokenProvider();
    if (!this.token) throw new Error("尚未获得租户用户Token");
    return this.token;
  }
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.accessToken();
    const response = await fetch(`${this.config.apiBase}${path}`, { ...init, headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {})
    }});
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return response.json();
  }
  context() { return this.request<TenantContext>("/v1/tenant/context"); }
  agents() { return this.request<{data: Agent[]}>("/v1/sdk/agents"); }
  createSession(agentId: string) { return this.request<{session_id:string}>(`/v1/sdk/agents/${encodeURIComponent(agentId)}/sessions`, { method:"POST", body:"{}" }); }
  sessions() { return this.request<{data:Session[]}>("/v1/sdk/sessions?limit=100"); }
  library() { return this.request<{data:LibraryItem[]}>("/v1/sdk/library/items?limit=100"); }
  developer() { return this.request<any>("/v1/dev/me"); }
  publishingActivity() { return this.request<any>("/v1/dev/publishing-activity"); }
  async publish(file: File, visibility: "private"|"public") {
    const token=await this.accessToken();
    const response=await fetch(`${this.config.apiBase}/v1/dev/publish-async?visibility=${visibility}`,{
      method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/gzip"},body:file});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||`HTTP ${response.status}`);
    return body;
  }
  usage() { return this.request<any>("/v1/tenant/usage"); }
  billing() { return this.request<any>("/v1/sdk/billing"); }
  audit() { return this.request<any>("/v1/tenant/audit-events"); }
  feishuStatus() { return this.request<any>("/v1/tenant/channels"); }
}

export async function tokenFromEndpoint(endpoint: string) {
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) throw new Error("租户身份服务没有返回有效Token");
  const body = await response.json();
  return body.access_token || body.token;
}
