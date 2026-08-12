import {expect,test} from "@playwright/test";

test.skip(!process.env.AGENTOUR_REAL_LOCAL,"real local backend is opt-in");
test("real local portal traverses user and tenant admin workspaces",async({page})=>{
  const failures:string[]=[];
  page.on("response",response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.getByRole("heading",{name:"发现",exact:true})).toBeVisible({timeout:10_000});
  for(const label of ["工作台","资料库","我的发布","账单","渠道"]){
    await page.getByRole("button",{name:new RegExp(`${label}$`)}).click();
    await expect(page.getByRole("heading",{name:label,exact:true})).toBeVisible();
  }
  await page.getByRole("button",{name:"管理控制台",exact:true}).click();
  await expect(page.getByRole("button",{name:/租户管理$/})).toBeVisible();
  await expect(page.getByText("正在加载...",{exact:true})).toHaveCount(0,{timeout:10_000});
  await page.screenshot({path:"test-results/real-local-portal.png",fullPage:true});
  expect(failures).toEqual([]);
});
