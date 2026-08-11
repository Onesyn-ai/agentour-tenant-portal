export type PortalConfig = {
  apiBase: string;
  tokenEndpoint: string;
  brandName: string;
  brandLogo: string;
  primaryColor: string;
};

export function portalConfig(env: Record<string, string | undefined> = import.meta.env) : PortalConfig {
  return {
    apiBase: (env.VITE_AGENTOUR_API_BASE || "https://test.agentour.ai").replace(/\/$/, ""),
    tokenEndpoint: env.VITE_TOKEN_ENDPOINT || "/api/agentour-token",
    brandName: env.VITE_BRAND_NAME || "Agentour Tenant Portal",
    brandLogo: env.VITE_BRAND_LOGO || "",
    primaryColor: env.VITE_PRIMARY_COLOR || "#3867f4"
  };
}
