import type { PortalConfig } from "./config";

export type Agent = { id: string; name: string; description: string; icon?: string; tags?: string[]; kind?: string };
export type TenantContext = { mode: "tenant"; tenant: { id: string; name: string; balance_credits: number; capabilities: Record<string, boolean>; settings: Record<string, unknown> }; actor_type: string; subject_id?: string; scopes: string[]; agents: string[]; models: string[] };
export type Session = {id:string;agent_id:string;state:string;title?:string;created_at:number;updated_at:number;spent:number};
export type LibraryItem = {id:string;title?:string;name?:string;origin_kind?:string;updated_at?:number};

export class AgentourClient {
  private token = "";
  private tokenExpiresAt = 0;
  private refreshPromise?: Promise<string>;
  constructor(private config: PortalConfig, private tokenProvider?: () => Promise<string>) {}

  setToken(token: string) { this.token = token; }
  private async accessToken(force = false) {
    if (this.tokenProvider && (force || !this.token || Date.now() >= this.tokenExpiresAt - 30_000)) {
      this.refreshPromise ||= this.tokenProvider().then(token => {
        this.token = token;
        this.tokenExpiresAt = jwtExpiry(token) || Date.now() + 5 * 60_000;
        return token;
      }).finally(() => { this.refreshPromise = undefined; });
      await this.refreshPromise;
    }
    if (!this.token) throw new Error("尚未获得租户用户Token");
    return this.token;
  }
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.accessToken();
    let response = await fetch(`${this.config.apiBase}${path}`, { ...init, headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {})
    }});
    if (response.status === 401 && this.tokenProvider) {
      const refreshed = await this.accessToken(true);
      response = await fetch(`${this.config.apiBase}${path}`, { ...init, headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${refreshed}`, ...(init.headers || {})
      }});
    }
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
  overview() { return this.request<any>("/v1/tenant/overview"); }
  subjects() { return this.request<any>("/v1/tenant/subjects"); }
  entitlements() { return this.request<any>("/v1/tenant/entitlements"); }
  resources() { return this.request<any>("/v1/tenant/resources"); }
  serviceAccounts() { return this.request<any>("/v1/tenant/service-accounts"); }
  session(id:string) { return this.request<any>(`/v1/sdk/sessions/${encodeURIComponent(id)}`); }
  presentation(id:string) { return this.request<any>(`/v1/sdk/sessions/${encodeURIComponent(id)}/presentation`); }
  artifacts(id:string) { return this.request<any>(`/v1/sdk/sessions/${encodeURIComponent(id)}/artifacts`); }
  sendMessage(id:string,text:string) { return this.request<any>(`/v1/sdk/sessions/${encodeURIComponent(id)}/messages`,{method:"POST",body:JSON.stringify({text})}); }
  cancel(id:string) { return this.request<any>(`/v1/sdk/sessions/${encodeURIComponent(id)}/cancel`,{method:"POST",body:"{}"}); }
  streamUrl(id:string,after=-1) { return `${this.config.apiBase}/v1/sdk/sessions/${encodeURIComponent(id)}/stream?after=${after}`; }
}

function jwtExpiry(token:string) {
  try { const payload=JSON.parse(atob(token.split(".")[1])); return Number(payload.exp||0)*1000; }
  catch { return 0; }
}

export async function tokenFromEndpoint(endpoint: string) {
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) throw new Error("租户身份服务没有返回有效Token");
  const body = await response.json();
  return body.access_token || body.token;
}
