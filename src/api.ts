import { AgentourClient as SharedAgentourClient } from "@agentour/sdk";
import type { AgentSummary, TenantContext } from "@agentour/sdk";
import type { PortalConfig } from "./config";

export type Agent = AgentSummary;
export type { TenantContext };
export type Session = {id:string;agent_id:string;state:string;title?:string;created_at:number;updated_at:number;spent:number};
export type LibraryItem = {id:string;title?:string;name?:string;origin_kind?:string;updated_at?:number};

export class AgentourClient {
  private readonly shared:SharedAgentourClient;
  constructor(private config: PortalConfig, private tokenProvider: () => Promise<string>) {
    this.shared=new SharedAgentourClient(config.apiBase,tokenProvider);
  }
  context() { return this.shared.tenantContext(); }
  agents() { return this.shared.agents(); }
  createSession(agentId: string) { return this.shared.createSession(agentId); }
  sessions() { return this.shared.sessions() as Promise<{data:Session[]}>; }
  library() { return this.shared.library() as Promise<{data:LibraryItem[]}>; }
  developer() { return this.shared.developer(); }
  publishingActivity() { return this.shared.publishingActivity(); }
  async publish(file: File, visibility: "private"|"public") {
    const token=await this.tokenProvider();
    const response=await fetch(`${this.config.apiBase}/v1/dev/publish-async?visibility=${visibility}`,{
      method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/gzip"},body:file});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||`HTTP ${response.status}`);
    return body;
  }
  usage() { return this.shared.tenantUsage(); } billing() { return this.shared.billing(); }
  audit() { return this.shared.tenantAudit(); } feishuStatus() { return this.shared.tenantChannels(); }
  overview() { return this.shared.tenantOverview(); } subjects() { return this.shared.tenantSubjects(); }
  entitlements() { return this.shared.tenantEntitlements(); } resources() { return this.shared.tenantResources(); }
  serviceAccounts() { return this.shared.tenantServiceAccounts(); }
  subjectUsage(){return this.shared.tenantSubjectUsage();} tenantSessions(){return this.shared.tenantSessions()}
  builds(){return this.shared.tenantBuilds()} evals(){return this.shared.tenantEvals()} storage(){return this.shared.tenantStorage()}
  session(id:string) { return this.shared.session(id); } presentation(id:string) { return this.shared.presentation(id); }
  artifacts(id:string) { return this.shared.artifacts(id); } attachments(id:string){return this.shared.attachments(id)}
  sendMessage(id:string,text:string) { return this.shared.send(id,text); } cancel(id:string) { return this.shared.cancel(id); }
  approve(id:string,interaction:any,decision:"approve"|"deny"){return this.shared.approve(id,interaction.request_id,decision,interaction.revision)}
  submit(id:string,interaction:any,values:Record<string,unknown>){return this.shared.submitInteraction(id,interaction,values)}
  streamUrl(id:string,after=-1) { return `${this.config.apiBase}/v1/sdk/sessions/${encodeURIComponent(id)}/stream?after=${after}`; }
}

export async function tokenFromEndpoint(endpoint: string) {
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) throw new Error("租户身份服务没有返回有效 Token");
  const body = await response.json();
  return body.access_token || body.token;
}
