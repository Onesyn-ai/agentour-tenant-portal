import { defineConfig,loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),"");
  return {
    plugins:[react(),{
      name:"agentour-local-subject-token",
      configureServer(server){server.middlewares.use("/api/agentour-token",(_req,res)=>{
        const token=env.AGENTOUR_PORTAL_DEV_SUBJECT_TOKEN;
        if(!token){res.statusCode=503;res.setHeader("Content-Type","application/json");
          res.end(JSON.stringify({error:"LOCAL_SUBJECT_TOKEN_NOT_CONFIGURED"}));return}
        res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type","application/json");
        res.end(JSON.stringify({access_token:token}));
      })}
    }],
    server:{port:4173},test:{environment:"node"}
  };
});
