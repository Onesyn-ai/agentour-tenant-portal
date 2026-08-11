import { describe, expect, it } from "vitest";
import { portalConfig } from "./config";

describe("portalConfig",()=>{
  it("normalizes API and branding configuration",()=>{
    const config=portalConfig({VITE_AGENTOUR_API_BASE:"https://api.example/",
      VITE_TOKEN_ENDPOINT:"/token",VITE_BRAND_NAME:"Acme",VITE_PRIMARY_COLOR:"#000"});
    expect(config.apiBase).toBe("https://api.example");
    expect(config.tokenEndpoint).toBe("/token");
    expect(config.brandName).toBe("Acme");
  });
});
