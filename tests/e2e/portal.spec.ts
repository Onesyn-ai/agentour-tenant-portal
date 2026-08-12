import { expect,test,type Page } from "@playwright/test";

const context={mode:"tenant",tenant:{id:"ten_a",name:"Acme",balance_credits:1200,capabilities:{plugin:true},settings:{}},actor_type:"tenant_subject",subject_id:"sub_a",scopes:["agents:read","tenant:overview:read"],agents:["demo"],models:["model"]};
async function mock(page:Page,admin=true){
  const failures:string[]=[];page.on("response",r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
  await page.route("**/*",async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==="/api/agentour-token")return route.fulfill({json:{access_token:"header.payload.signature"}});
    if(u.origin==="http://127.0.0.1:4173")return route.continue();
    if(u.pathname==="/v1/tenant/context")return route.fulfill({json:{...context,scopes:admin?context.scopes:["agents:read"]}});
    if(u.pathname==="/v1/sdk/agents")return route.fulfill({json:{data:[{id:"demo",name:"Demo Agent",description:"test",kind:"agent",tags:["demo"]}]}});
    if(u.pathname.includes("/sessions")&&route.request().method()==="POST")return route.fulfill({status:201,json:{session_id:"sess_1",state:"created",agent_id:"demo"}});
    if(u.pathname.endsWith("/presentation"))return route.fulfill({json:{schema:"agentour.session-presentation/1.0",session_id:"sess_1",agent_id:"demo",lifecycle:"running",session_version:1,event_cursor:0,display_status:{severity:"info",headline:"运行中",description:"正常",primary_source:"agent",reason_code:"running",user_action_required:false},source_statuses:[],runtime_state:{status:"running"},timeline:[],model_operations:[],tool_operations:[],artifact_operations:[],interactions:[],usage:{},experience:{schema:"agentour.experience/1.0",session_id:"sess_1",revision:1,state:"running",title:"Demo",blocks:[],actions:[],deliveries:[],capability_requirements:[]}}});
    if(u.pathname.match(/\/v1\/sdk\/sessions\/sess_1$/))return route.fulfill({json:{session_id:"sess_1",agent_id:"demo",state:"running",created_at:1,driver_ref:{}}});
    return route.fulfill({json:u.pathname.includes("overview")?{sessions:1}:{data:[]}});
  });return failures;
}
test("normal user traverses every workspace tab without platform admin",async({page})=>{const failures=await mock(page,false);await page.goto("/");for(const label of ["发现","工作台","资料库","我的发布","账单","渠道"]){await page.getByRole("button",{name:label,exact:true}).click();await expect(page.getByRole("heading",{name:label,exact:true})).toBeVisible()}await expect(page.getByRole("button",{name:"租户管理"})).toHaveCount(0);expect(failures).toEqual([])});
test("tenant admin traverses management and opens a session",async({page})=>{const failures=await mock(page,true);await page.goto("/");await page.getByRole("button",{name:"租户管理",exact:true}).click();for(const title of ["总览","内部用户","用户用量","Agent 与模型","会话与运行","构建","评测","存储","凭证","渠道","审计事件"])await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();await page.getByRole("button",{name:"发现",exact:true}).click();await page.getByRole("button",{name:"开始使用"}).click();await expect(page.getByText("运行中",{exact:true}).first()).toBeVisible();expect(failures).toEqual([])});
