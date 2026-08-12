import { describe,expect,it } from "vitest";
import { readFileSync,readdirSync,statSync } from "node:fs";
import { join,relative } from "node:path";

const root=join(new URL("..",import.meta.url).pathname.replace(/^\/(.:)/,"$1"));
function files(dir:string):string[]{return readdirSync(dir).flatMap(name=>{
  if([".git","node_modules","dist","vendor"].includes(name))return [];
  const path=join(dir,name);return statSync(path).isDirectory()?files(path):[path];
})}
describe("source security boundary",()=>{
  it("contains no platform APIs, service-account tokens, secrets, or backend sources",()=>{
    const violations:string[]=[];
    for(const path of files(root)){
      const rel=relative(root,path).replaceAll("\\","/");
      const text=readFileSync(path,"utf8");
      if(rel!=="README.md"&&/\/v1\/admin\//.test(text))violations.push(`${rel}: platform API`);
      if(/tsa_[A-Za-z0-9_-]{8,}/.test(text))violations.push(`${rel}: service account token`);
      if(/(E2B_API_KEY|FEISHU_APP_SECRET|AGENTOUR_POSTGRES_DSN)\s*=\s*[^\s<]/.test(text))violations.push(`${rel}: secret configuration`);
      if(/\.(py|sql|pem|key)$/.test(rel))violations.push(`${rel}: forbidden backend/server file`);
    }
    expect(violations).toEqual([]);
  });
});
