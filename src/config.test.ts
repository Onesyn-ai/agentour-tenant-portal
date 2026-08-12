import { describe, expect, it } from "vitest";
import { portalConfig } from "./config";
import { AgentourClient } from "./api";

describe("portalConfig",()=>{
  it("normalizes API and branding configuration",()=>{
    const config=portalConfig({VITE_AGENTOUR_API_BASE:"https://api.example/",
      VITE_TOKEN_ENDPOINT:"/token",VITE_BRAND_NAME:"Acme",VITE_PRIMARY_COLOR:"#000"});
    expect(config.apiBase).toBe("https://api.example");
    expect(config.tokenEndpoint).toBe("/token");
    expect(config.brandName).toBe("Acme");
  });
});

describe("AgentourClient",()=>{
  it("deduplicates concurrent token refreshes",async()=>{
    let calls=0;
    const original=globalThis.fetch;
    globalThis.fetch=async()=>new Response(JSON.stringify({mode:"tenant"}),{status:200,headers:{"Content-Type":"application/json"}});
    const client=new AgentourClient(portalConfig({VITE_AGENTOUR_API_BASE:"https://api.example"}),async()=>{calls++;await Promise.resolve();return "token"});
    await Promise.all([client.context(),client.context(),client.context()]);
    expect(calls).toBe(1);
    globalThis.fetch=original;
  });
});
