/* Developer-only browser checks. Runtime needs neither Node nor Playwright. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,".."),output=path.join(root,"output","live-browser");
const solution=path.join(root,"student","solution.py"),savedSolution=fs.readFileSync(solution);
const savePath=path.join(root,"saves","current.json"),savedGame=fs.existsSync(savePath)?fs.readFileSync(savePath):null;
fs.mkdirSync(output,{recursive:true});

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],external=[],observed=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
  page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1:"))external.push(r.url());});
  const snapshot=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const clock=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
  const shot=name=>page.screenshot({path:path.join(output,name+".png"),fullPage:true});
  const ready=()=>page.waitForFunction(()=>typeof window.render_game_to_text==="function"&&JSON.parse(window.render_game_to_text()).status!=="loading");
  async function menuClick(id){if(!await page.locator("#game-menu").evaluate(e=>e.open))await page.click("#game-menu summary");await page.click(id);await page.waitForFunction(()=>!document.querySelector("#game-menu").open);}
  async function restart(id){await menuClick(id);await page.click("#confirm-restart");await page.waitForFunction(()=>!document.querySelector("#restart-dialog").open);}
  async function start(){await page.click("#run-day");await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).live!==null);await clock(1);}
  async function finish(){await clock(180000);assert.equal((await snapshot()).live,null);assert(await page.locator("#report-dialog").isVisible());}
  async function closeReport(){await page.click("#back-to-map");}
  async function until(predicate){
    for(let i=0;i<400;i++){const s=await snapshot();if(predicate(s))return s;assert(s.live,"Day finished before target scene");await clock(150);}
    throw new Error("Target scene never appeared");
  }

  try{
    await page.goto(process.env.WORKSHOP_URL||"http://127.0.0.1:8765");await ready();
    await restart("#restart-lesson");const seed=(await snapshot()).seed;
    assert(!await page.locator("#report-dialog").isVisible());
    assert(!await page.locator("#journal-dialog").isVisible());
    assert(!await page.locator("#stock-dialog").isVisible());
    await shot("start");
    await start();
    let s=await snapshot();assert.equal(s.day,0);assert.equal(s.live.day,1);assert.equal(s.last_report,null);
    s=await until(s=>s.live.kind==="receive_delivery"&&s.map.progress>.2&&s.map.progress<.75);
    observed.push(s.live.kind);
    assert.notDeepEqual([s.map.robots.warehouse.x,s.map.robots.warehouse.y],[450,240]);
    assert.equal(s.map.carrying,"crate");
    assert(s.inventory.frame>6);assert(s.balance<2500);
    await shot("delivery-moving");
    await page.click("#pause-day");await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).live.paused);
    const paused=await snapshot();await clock(10000);
    assert.deepEqual((await snapshot()).map,paused.map);assert.equal((await snapshot()).balance,paused.balance);
    await shot("paused");
    await page.reload();await ready();
    assert.equal((await snapshot()).live.step,paused.live.step);assert.equal((await snapshot()).balance,paused.balance);
    assert((await snapshot()).live.paused);
    await page.click('[data-role="warehouse"]');await page.click("#configure-worker");
    assert(await page.locator('input[name="model"]').first().isDisabled());await page.click("#close-config");
    await page.click("#close-inspector");
    await page.click("#pause-day");await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).live.paused);
    await clock(100);
    const elapsed=(await snapshot()).elapsed_ms;
    await page.click('[data-speed="4"]');await clock(100);
    assert((await snapshot()).elapsed_ms-elapsed>=399);
    await page.click('[data-speed="1"]');
    s=await until(s=>s.live.kind==="send_to_qc"&&s.map.progress>.2&&s.map.progress<.8);
    observed.push(s.live.kind);assert.equal(s.map.carrying,"vacuum");
    assert.notDeepEqual([s.map.robots.assembler.x,s.map.robots.assembler.y],[310,565]);
    await shot("vacuum-moving");
    s=await until(s=>s.live.kind==="inspect_product");
    assert.equal(s.map.robots.qc.alert,"Нет осмотра!");await shot("missing-tool");
    await page.click("#open-journal");await page.selectOption("#event-filter","problems");
    assert(await page.locator(".event.error").count()>0);await page.click("#close-journal");
    await finish();assert.equal((await snapshot()).day,1);
    assert.equal((await snapshot()).balance,Math.round((2500+(await snapshot()).totals.profit)*100)/100);
    assert((await snapshot()).balance>0);
    assert(!await page.locator(".report-details").evaluate(e=>e.open));
    await shot("daily-report");await closeReport();
    await menuClick("#save");await page.waitForFunction(()=>!document.querySelector("#save").disabled);
    await start();await finish();await closeReport();
    await menuClick("#load");await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).day===1);
    await restart("#same-seed");assert.equal((await snapshot()).seed,seed);

    const config={
      reception:{model:"cheap",context:"0",preset:"capacity"},warehouse:{model:"standard",context:"2",preset:"stock"},
      engineer:{model:"standard",context:"2",preset:"careful"},assembler:{model:"standard",context:"2",preset:"test"},
      qc:{model:"standard",context:"2",preset:"careful"},cleaner:{model:"cheap",context:"0",preset:"tidy"}
    };
    for(const [role,w]of Object.entries(config)){
      await page.click('[data-role="'+role+'"]');await page.click("#configure-worker");
      await page.check('input[name="model"][value="'+w.model+'"]');await page.check('input[name="context"][value="'+w.context+'"]');
      await page.selectOption("#instruction-preset",w.preset);
      for(const tool of await page.locator('input[name="tool"]').all())await tool.check();
      await page.click("#apply-config");await page.waitForFunction(()=>!document.querySelector("#config-dialog").open);
    }
    const configured=await snapshot();
    const reference=JSON.parse(execFileSync(process.env.WORKSHOP_PYTHON||"python",["-c",
      "import json,sys; from engine.game import Game; r=json.load(sys.stdin); g=Game(r['seed']); g.configure(r['config']); " +
      "exec('while g.state[\"status\"] == \"playing\": g.run_day()'); print(json.dumps(g.state['totals']))"],
      {cwd:root,input:JSON.stringify({seed,config:configured.workers}),encoding:"utf8"}));
    for(let day=1;day<=7;day++){
      await start();await finish();
      assert.equal((await snapshot()).day,day);
      if(day<7)await closeReport();
    }
    const won=await snapshot();assert.equal(won.status,"won");assert(won.totals.units_sold>=20);
    assert.deepEqual(won.totals,reference);await shot("won");
    await page.selectOption("#report-day","0");assert.equal(await page.locator("#report-title").textContent(),"День 1 · итог");
    await closeReport();await menuClick("#compare");
    assert.equal(await page.locator("#compare-body tbody tr").count(),6);await page.click("#close-compare");
    await restart("#same-seed");await start();await finish();await closeReport();
    await menuClick("#compare");
    assert(await page.locator("#compare-body tbody td:last-child").allTextContents().then(v=>v.every(n=>n==="0")));
    await page.click("#close-compare");

    await menuClick("#python-mode");await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).mode==="python");
    fs.writeFileSync(solution,"def configure_factory(factory):\n    factory.worker('warehouse').set_model('cheap'\n","utf8");
    await page.click("#check-code");await page.waitForFunction(()=>document.querySelector("#code-result").textContent.includes("SyntaxError"));
    assert(await page.locator("#apply-code").isDisabled());await shot("python-error");
    fs.writeFileSync(solution,"def configure_factory(factory):\n    factory.worker('warehouse').set_context(5)\n","utf8");
    await page.click("#check-code");await page.waitForFunction(()=>document.querySelector("#code-result").textContent.includes("Configuration valid"));
    assert.equal((await snapshot()).workers.warehouse.context,2);
    await page.click("#apply-code");await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).workers.warehouse.context===5);
    await start();await finish();await closeReport();
    await menuClick("#auto-mode");await restart("#new-seed");assert.notEqual((await snapshot()).seed,seed);
    await page.setViewportSize({width:390,height:844});await shot("mobile");
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    // A real RAF-driven shift at x4: no virtual clock and no precomputed day.
    await page.setViewportSize({width:1440,height:1000});await page.reload();await ready();
    await page.click('[data-speed="4"]');
    const wallStart=Date.now();
    await page.click("#run-day");
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).live!==null);
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).day===1&&JSON.parse(window.render_game_to_text()).live===null,{},{timeout:45000});
    const naturalMs=Date.now()-wallStart;assert(naturalMs>=8000);
    await shot("natural-completed");
    assert.equal(external.length,0);assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,"result.json"),JSON.stringify({ok:true,sold:won.totals.units_sold,profit:won.totals.profit,natural_ms:naturalMs,observed,errors,external},null,2));
    console.log("Live browser path passed: real intermediate state, moving cargo, pause/reload/resume, speeds, missing Tool, 7 days, save/load, AUTO/PYTHON, comparison, mobile. Natural x4 shift: "+naturalMs+" ms.");
  }finally{
    fs.writeFileSync(solution,savedSolution);
    if(savedGame)fs.writeFileSync(savePath,savedGame);else if(fs.existsSync(savePath))fs.unlinkSync(savePath);
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
