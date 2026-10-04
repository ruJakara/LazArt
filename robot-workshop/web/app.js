/* Controls and incremental backend clock. Map rendering lives in map.js. */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const number=value=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(value);
  const money=value=>number(value)+" ₽";
  const signed=value=>(value>0?"+":"")+number(value);
  let content,state,view,token,studentPath,map,roles,busy=false,selectedWorker=null,selectedReport=null;
  let restartKind=null,speed=1,elapsed=0,flight=null,manualClock=false,pauseRequested=false,toastTimer;
  const canvas=$("workshop");

  function toast(message,error=false) {
    $("toast").textContent=message;$("toast").className="toast"+(error?" error":"");$("toast").hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$("toast").hidden=true;},3500);
  }
  async function api(path,data) {
    const response=await fetch("/api/"+path,data===undefined?{}:{method:"POST",
      headers:{"Content-Type":"application/json","X-Workshop-Token":token},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Команда не выполнена.");
    return result;
  }
  function updateControls() {
    const active=Boolean(view?.live);
    for(const id of ["save","load","auto-mode","python-mode","compare","check-code"])
      $(id).disabled=busy||active;
    for(const id of ["apply-config","confirm-restart","run-day"])$(id).disabled=busy;
    $("run-day").hidden=active;$("run-day").disabled=busy||state?.status!=="playing";
    $("pause-day").hidden=!active;
    $("pause-day").textContent=view?.live?.paused||pauseRequested?"▶ Продолжить":"Ⅱ Пауза";
    $("pause-day").disabled=busy;
    $("apply-code").disabled=busy||active||!$("apply-code").dataset.ready;
  }
  function receive(result,reset=false) {
    const completed=Boolean(view?.live)&&!result.live&&result.state.day>state.day;
    view=result;state=result.state;
    if(reset){elapsed=0;map.reset(view);$("inspector").hidden=true;}
    map.receive(view);render();
    if(completed) {
      selectedReport=null;renderReport();
      for(const dialog of document.querySelectorAll("dialog[open]"))dialog.close();
      $("report-dialog").showModal();
    }
  }
  async function command(path,data={},message) {
    if(busy)return false;
    busy=true;updateControls();
    try {
      if(flight)await flight;
      const result=await api(path,data);
      receive(result,["restart","load","config","python/apply","day/start"].includes(path));
      $("game-menu").open=false;
      if(message)toast(message);
      return true;
    }catch(error){toast(error.message,true);return false;}
    finally{busy=false;updateControls();}
  }
  async function nextStep() {
    if(flight)return flight;
    const expected=view.live?.scene?.id||0;
    flight=api("day/step",{expected_step:expected}).then(result=>receive(result)).catch(error=>{
      pauseRequested=true;toast("Связь прервана. Нажми «Продолжить», чтобы повторить шаг.",true);
    }).finally(()=>{flight=null;updateControls();});
    return flight;
  }
  async function advance(ms) {
    let remaining=ms;
    while(remaining>0&&view?.live&&!view.live.paused&&!pauseRequested&&!busy) {
      if(!view.live.scene||map.progress>=1) {
        await nextStep();
        if(!view.live||view.live.paused||pauseRequested)break;
      }
      const duration=view.live.scene.duration_ms;
      const chunk=Math.min(remaining*speed,Math.max(.001,(1-map.progress)*duration));
      map.advance(chunk);elapsed+=chunk;remaining-=chunk/speed;
      renderClock();
    }
  }
  function renderClock() {
    const seconds=Math.floor(elapsed/1000);
    $("shift-time").textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  }
  async function animate(timestamp) {
    const delta=Math.min(100,timestamp-(animate.last||timestamp));animate.last=timestamp;
    if(!manualClock)await advance(delta);
    requestAnimationFrame(animate);
  }

  function render() {
    const current=view.live||state,lesson=content.lesson;
    $("balance").textContent=money(current.balance);$("balance").classList.toggle("negative",current.balance<=0);
    $("sold").innerHTML=current.totals.units_sold+" <em>/ "+lesson.target_units+"</em>";
    $("day").textContent=current.day;$("day-limit").textContent="/ "+lesson.days;$("seed").textContent=state.seed;
    $("student-path").textContent=studentPath;$("python-panel").hidden=state.mode!=="python";
    $("auto-mode").classList.toggle("active",state.mode==="auto");$("python-mode").classList.toggle("active",state.mode==="python");
    $("status-dot").classList.toggle("running",Boolean(view.live)&&!view.live.paused&&!pauseRequested);
    $("shift-status").textContent=view.live?(view.live.paused||pauseRequested?"Смена на паузе":"Смена "+view.live.day+" · команда работает"):state.status!=="playing"?"Прогон завершён":state.day?"Смена завершена. Что изменим?":"Мастерская ждёт тебя";
    $("shift-message").textContent=view.live?window.workshopSceneLabel(view.live.scene?.kind):state.status!=="playing"?state.message:"Настрой команду или запусти следующий день.";
    $("map-hint").hidden=Boolean(view.live)||!$("inspector").hidden;
    $("result-banner").hidden=state.status==="playing";$("result-banner").textContent=state.message;
    $("worker-nav").innerHTML=roles.map(role=>'<button data-role="'+role+'">'+esc(content.workers[role].name)+'</button>').join("");
    updateControls();renderClock();renderInspector();
    if($("journal-dialog").open)renderEvents();
    if($("stock-dialog").open)renderStock();
  }
  function selectWorker(role) {
    selectedWorker=role;map.selected=role;map.draw();$("inspector").hidden=false;renderInspector();
    $("map-hint").hidden=true;
  }
  function renderInspector() {
    if(!selectedWorker||$("inspector").hidden)return;
    const worker=state.config[selectedWorker],meta=content.workers[selectedWorker];
    $("inspector-zone").textContent=meta.zone;$("inspector-name").textContent=meta.name;
    const robot=map.robots[selectedWorker];
    $("inspector-task").textContent=robot.alert||robot.task;
    const cost=view.live?.worker_costs[selectedWorker]??state.reports.at(-1)?.worker_costs[selectedWorker]??0;
    $("inspector-meta").innerHTML=[["Модель",content.models[worker.model].name],["Контекст",worker.context+" событий"],
      ["Инструменты",worker.tools.length],["ИИ за смену",money(cost)]].map(([k,v])=>'<div class="inspector-meta"><span>'+k+'</span><strong>'+esc(v)+'</strong></div>').join("");
    $("configure-worker").textContent=view.live?"Посмотреть настройки":"Настроить работника";
  }
  function renderStock() {
    const current=view.live||state,product=content.products[content.lesson.product];
    $("inventory").innerHTML=Object.entries(current.inventory).map(([id,n])=>'<div class="stock-item">'+esc(product.part_names[id])+'<strong>'+n+'</strong></div>').join("");
    const count=Object.values(current.pending_delivery).reduce((a,b)=>a+b,0);
    $("delivery-note").textContent=count?"Оплаченная поставка ждёт приёмки: "+count+" деталей.":"Оплаченных поставок в ожидании нет.";
  }
  function renderEvents() {
    const current=view.live||state;
    let events=current.events.filter(e=>e.day===current.day);
    if($("event-filter").value==="problems")events=events.filter(e=>e.level!=="info");
    $("events").innerHTML=events.length?events.slice(-150).reverse().map(e=>{
      const t=9*60+e.tick,time=String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
      const actor=content.workers[e.actor]?.name||({client:"Клиент",shipping:"Отгрузка",accounting:"Касса"}[e.actor])||e.actor;
      return '<div class="event '+e.level+'"><time>'+time+'</time><div><div class="event-actor">'+esc(actor)+'</div>'+esc(e.message)+'</div></div>';
    }).join(""):'<p class="muted">Пока нет событий для этого фильтра.</p>';
  }
  function renderReport() {
    renderFinal();
    if(!state.reports.length){$("report-title").textContent="Смена ещё не закончилась";$("report-body").innerHTML='<p class="muted">Итог появится после выполнения всех работ.</p>';return;}
    const r=state.reports[selectedReport??state.reports.length-1];
    $("report-title").textContent="День "+r.day+" · итог";
    const row=(label,n)=>'<div class="money-row"><span>'+label+'</span><strong class="'+(n<0?"negative":"")+'">'+signed(n)+' ₽</strong></div>';
    $("report-body").innerHTML='<label class="report-picker">Отчёт <select id="report-day">'+state.reports.map((x,i)=>'<option value="'+i+'" '+(r.day===x.day?"selected":"")+'>День '+x.day+'</option>').join("")+'</select></label>'+
      '<div class="report-metrics"><div>Продано<strong>'+r.units_sold+'</strong></div><div>Прибыль<strong class="'+(r.profit<0?"negative":"")+'">'+signed(r.profit)+' ₽</strong></div><div>Брак<strong>'+r.defects+'</strong></div></div>'+
      '<div class="observations">'+r.observations.slice(0,2).map(n=>'<p>'+esc(n)+'</p>').join("")+'</div>'+
      '<details class="report-details"><summary>Финансы и остальные наблюдения</summary>'+row("Выручка",r.revenue)+row("Материалы",-r.material_cost)+row("Работа ИИ",-r.ai_cost)+row("Эксплуатация",-r.operating_cost)+row("Штрафы и списания",-r.penalties)+
      '<p class="muted">Выпущено: '+r.units_completed+' · Переделок: '+r.reworks+' · Возвратов: '+r.returns+'</p><div class="observations">'+r.observations.slice(2).map(n=>'<p>'+esc(n)+'</p>').join("")+'</div></details>';
    $("report-day").addEventListener("change",e=>{selectedReport=Number(e.target.value);renderReport();});
  }
  function renderFinal() {
    $("final-panel").hidden=state.status==="playing";
    if(state.status==="playing")return;
    const m=state.totals,s=view.summary;
    $("final-panel").classList.toggle("lost",state.status==="lost");
    $("final-panel").innerHTML='<span class="eyebrow">ИТОГ ВСЕГО ПРОГОНА</span><h2>'+esc(state.message)+'</h2>'+
      '<p><strong>Продано: '+m.units_sold+' · Чистая прибыль: '+money(m.profit)+'</strong></p>'+
      s.achievements.map(a=>'<span class="achievement">'+esc(a)+'</span>').join("")+
      '<details class="report-details"><summary>Итоговые финансы и узкие места</summary>'+
      '<p>Выручка: '+money(m.revenue)+' · Материалы: '+money(m.material_cost)+' · ИИ: '+money(m.ai_cost)+' · Прочие расходы: '+money(m.operating_cost+m.penalties)+'</p>'+
      '<p>Брак: '+m.defects+' · Переделки: '+m.reworks+' · Возвраты: '+m.returns+'</p>'+
      '<p>Самый дорогой работник: '+esc(s.expensive_worker)+'. Расходы на проданное изделие: '+money(s.unit_cost)+'.</p>'+
      '<p>Полезные действия на рубль ИИ: '+esc(s.useful_worker)+'. Неэффективный расход: '+esc(s.useless_expense)+'.</p>'+
      '<p>Главное узкое место: '+esc(s.bottleneck)+'.</p>'+
      '<p>Остатки деталей: '+money(s.unsold_stock_value)+'. Стартовые комплекты получены вместе с мастерской; отчёт показывает денежный поток.</p></details>';
  }

  function openWorker(role) {
    if(busy) return;
    selectedWorker=role;
    const worker=state.config[role],meta=content.workers[role];
    $("worker-title").textContent=meta.name;$("worker-zone").textContent=`${meta.zone} / ${role}`;
    const preset=Object.entries(content.instructions).find(([,p])=>p.roles.includes(role)&&p.text===worker.instructions&&JSON.stringify(p.rules)===JSON.stringify(worker.rules))?.[0]||"custom";
    const readOnly=Boolean(view.live)||state.mode==="python"||state.status!=="playing";
    $("config-body").innerHTML=`<fieldset ${readOnly?"disabled":""} style="border:0;padding:0;margin:0"><h3>01 / MODEL</h3><div class="model-options">${Object.entries(content.models).filter(([id])=>content.lesson.models.includes(id)).map(([id,m])=>`<label class="model-choice"><input type="radio" name="model" value="${id}" ${worker.model===id?"checked":""}><strong>${m.name}</strong>${m.cost} ₽ / действие<span>Качество ${Math.round(m.quality*100)}%<br>Следование ${Math.round(m.instruction_following*100)}%</span></label>`).join("")}</div><h3>02 / INSTRUCTIONS</h3><select id="instruction-preset" class="instructions-select"><option value="custom" ${preset==="custom"?"selected":""}>Текущая инструкция</option>${Object.entries(content.instructions).filter(([,p])=>p.roles.includes(role)).map(([id,p])=>`<option value="${id}" ${preset===id?"selected":""}>${esc(p.title)}</option>`).join("")}</select><p id="instruction-text" class="instruction-text">${esc(worker.instructions)}</p><div id="rules-line" class="rules-line">Rules: ${esc(worker.rules.join(", ")||"нет")}</div><h3>03 / TOOLS</h3><div class="tools-list">${Object.entries(content.tools).filter(([,tool])=>tool.allowed_roles.includes(role)).map(([id,tool])=>`<label class="tool-choice"><div class="tool-heading"><input type="checkbox" name="tool" value="${id}" ${worker.tools.includes(id)?"checked":""}><span>${esc(tool.name)}</span></div><div class="tool-name">${id}</div><p class="tool-description">${esc(tool.description)}</p><span class="tool-type ${tool.type}">${tool.type}</span><span class="tool-price">+${tool.cost} ₽ / вызов</span></label>`).join("")}</div><h3>04 / MEMORY & CONTEXT</h3><div class="context-options">${content.balance.context_sizes.map(n=>`<label><input type="radio" name="context" value="${n}" ${worker.context===n?"checked":""}> ${n}</label>`).join("")}</div><p id="context-price" class="context-explanation"></p></fieldset>`;
    $("apply-config").hidden=readOnly;
    const sections={models:[".model-options"],instructions:["#instruction-preset","#instruction-text","#rules-line"],tools:[".tools-list"],context:[".context-options","#context-price"]};
    for(const [mechanic,selectors] of Object.entries(sections)){
      if(content.lesson.mechanics[mechanic])continue;
      const first=$("config-body").querySelector(selectors[0]);
      first.previousElementSibling.hidden=true;
      for(const selector of selectors)$("config-body").querySelector(selector).hidden=true;
    }
    $("config-note").textContent=view.live?"Во время смены доступен просмотр. Меняй настройки между днями.":state.mode==="python"?"Просмотр. Изменяй настройки в student/solution.py.":state.status!=="playing"?"Прогон завершён. Повтори его для изменения настроек.":"Изменения вступят в силу со следующего дня.";
    $("instruction-preset").addEventListener("change",()=>{
      const p=content.instructions[$("instruction-preset").value];
      $("instruction-text").textContent=p?p.text:worker.instructions;
      $("rules-line").textContent=`Rules: ${(p?p.rules:worker.rules).join(", ")||"нет"}`;
    });
    const updatePrice=()=>{
      const size=Number(document.querySelector('input[name="context"]:checked').value);
      const model=document.querySelector('input[name="model"]:checked').value;
      const tools=document.querySelectorAll('input[name="tool"]:checked').length;
      const base=content.models[model].cost*(1+size*content.balance.context_cost+tools*content.balance.tool_overhead);
      $("context-price").textContent=`База: ${money(base)} / действие + цена вызванного Tool. Доступны последние ${size} событий работника.${size===20?" Избыточный контекст немного снижает эффективность.":""}`;
    };
    $("config-body").addEventListener("change",updatePrice,{signal:configAbortSignal()});updatePrice();
    $("config-dialog").showModal();
  }
  let configController;
  function configAbortSignal(){configController?.abort();configController=new AbortController();return configController.signal;}


  $("run-day").addEventListener("click",()=>command("day/start"));
  $("pause-day").addEventListener("click",async()=>{
    if(!view.live||busy)return;
    const paused=!view.live.paused&&!pauseRequested;pauseRequested=true;updateControls();
    try{if(flight)await flight;if(view.live)receive(await api("day/pause",{paused}));}
    catch(error){toast(error.message,true);}
    finally{pauseRequested=false;updateControls();}
  });
  for(const button of document.querySelectorAll("[data-speed]"))button.addEventListener("click",()=>{
    speed=Number(button.dataset.speed);
    for(const b of document.querySelectorAll("[data-speed]"))b.classList.toggle("active",b===button);
  });
  $("worker-nav").addEventListener("click",e=>{const role=e.target.closest("[data-role]")?.dataset.role;if(role)selectWorker(role);});
  $("close-inspector").addEventListener("click",()=>{$("inspector").hidden=true;map.selected=null;map.draw();$("map-hint").hidden=Boolean(view.live);});
  $("configure-worker").addEventListener("click",()=>openWorker(selectedWorker));
  $("close-config").addEventListener("click",()=>$("config-dialog").close());
  $("apply-config").addEventListener("click",async()=>{
    const config=structuredClone(state.config),worker=config[selectedWorker];
    if(content.lesson.mechanics.models)worker.model=document.querySelector('input[name="model"]:checked').value;
    if(content.lesson.mechanics.context)worker.context=Number(document.querySelector('input[name="context"]:checked').value);
    if(content.lesson.mechanics.tools)worker.tools=[...document.querySelectorAll('input[name="tool"]:checked')].map(input=>input.value);
    const p=content.instructions[$("instruction-preset").value];
    if(p&&content.lesson.mechanics.instructions){worker.instructions=p.text;worker.rules=[...p.rules];}
    if(await command("config",{config},"Настройки сохранены."))$("config-dialog").close();
  });
  $("save").addEventListener("click",()=>command("save",{},"Сохранено в saves/current.json."));
  $("load").addEventListener("click",async()=>{if(await command("load",{},"Прогон загружен.")){$("code-result").hidden=true;delete $("apply-code").dataset.ready;updateControls();}});
  for(const mode of ["auto","python"])$(mode+"-mode").addEventListener("click",async()=>{
    if(await command("mode",{mode})){$("code-result").hidden=true;delete $("apply-code").dataset.ready;updateControls();}
  });
  for(const [button,dialog,renderFn] of [["open-report","report-dialog",renderReport],["open-journal","journal-dialog",renderEvents],["open-stock","stock-dialog",renderStock]]) {
    $(button).addEventListener("click",()=>{renderFn();$(dialog).showModal();});
  }
  for(const name of ["report","journal","stock","compare"])$("close-"+name).addEventListener("click",()=>$(name+"-dialog").close());
  $("back-to-map").addEventListener("click",()=>$("report-dialog").close());
  $("event-filter").addEventListener("change",renderEvents);
  $("compare").addEventListener("click",()=>{
    const c=view.comparison,labels={profit:"Прибыль",ai_cost:"Расходы ИИ",units_sold:"Исправных продано",defects:"Брак",waste:"Списано",idle_time:"Простой"};
    $("compare-body").innerHTML=c.available?'<p class="muted">Первые '+c.days+' дней. Seed '+state.seed+'.</p><table><thead><tr><th>Метрика</th><th>Было</th><th>Стало</th><th>Δ</th></tr></thead><tbody>'+c.rows.map(r=>'<tr><td>'+labels[r.metric]+'</td><td>'+number(r.before)+'</td><td>'+number(r.after)+'</td><td>'+signed(r.delta)+'</td></tr>').join("")+'</tbody></table>':'<p>'+esc(c.message)+'</p>';
    $("game-menu").open=false;$("compare-dialog").showModal();
  });
  for(const [id,kind] of [["same-seed","same"],["new-seed","new"],["restart-lesson","lesson"]])$(id).addEventListener("click",()=>{
    restartKind=kind;$("game-menu").open=false;$("restart-dialog").showModal();
  });
  $("cancel-restart").addEventListener("click",()=>$("restart-dialog").close());
  $("confirm-restart").addEventListener("click",async()=>{
    if(await command("restart",{kind:restartKind},"Новый прогон готов.")) {
      $("restart-dialog").close();$("code-result").hidden=true;delete $("apply-code").dataset.ready;pauseRequested=false;updateControls();
    }
  });
  $("open-folder").addEventListener("click",()=>command("folder"));
  $("check-code").addEventListener("click",async()=>{
    if(busy)return;busy=true;delete $("apply-code").dataset.ready;updateControls();
    try {
      const result=await api("python/check",{});$("code-result").hidden=false;$("code-result").classList.toggle("negative",!result.ok);
      if(result.ok) {
        $("code-result").textContent="✓ Configuration valid\n\n"+Object.entries(result.config).map(([id,w])=>id.toUpperCase()+" · "+w.model+" · Context "+w.context+" · Rules "+w.rules.length+" · Tools "+w.tools.length).join("\n")+(result.stdout?"\n\nstdout:\n"+result.stdout:"");
        $("apply-code").dataset.ready="true";
      } else $("code-result").textContent=result.error+(result.line?" — строка "+result.line:"")+"\n"+result.message+(result.source?"\n\n"+result.source+"\n"+" ".repeat(Math.max(0,(result.column||1)-1))+"↑":"");
    }catch(error){toast(error.message,true);}finally{busy=false;updateControls();}
  });
  $("apply-code").addEventListener("click",async()=>{if(await command("python/apply",{},"Конфигурация применена.")){delete $("apply-code").dataset.ready;updateControls();}});
  function fullscreen(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}
  $("fullscreen").addEventListener("click",fullscreen);
  document.addEventListener("keydown",e=>{
    if(e.key==="f"&&!e.ctrlKey&&!e.metaKey&&!document.querySelector("dialog[open]")&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))fullscreen();
  });
  window.advanceTime=async ms=>{manualClock=true;if(flight)await flight;await advance(ms);};
  window.render_game_to_text=()=>JSON.stringify(state?{mode:state.mode,day:state.day,seed:state.seed,status:state.status,
    balance:(view.live||state).balance,totals:(view.live||state).totals,inventory:(view.live||state).inventory,workers:state.config,
    live:view.live?{day:view.live.day,paused:view.live.paused,step:view.live.scene?.id||0,kind:view.live.scene?.kind||null}:null,
    speed,elapsed_ms:Math.round(elapsed),map:map.snapshot(),coordinate_system:"canvas 1200x690; origin top-left, x right, y down",
    last_report:state.reports.at(-1)||null}:{status:"loading"});
  function startupError(message) {
    $("startup-error").hidden=false;$("startup-error").innerHTML='<div><span class="eyebrow">LAZART ROBOT WORKSHOP</span><h1>Мастерская запускается<br>одним двойным кликом.</h1><p>Открой <code>run_game.bat</code> в папке robot-workshop.</p><p>Нужен только Python 3.10+. Браузер откроется автоматически.</p><p class="muted">'+esc(message)+'</p></div>';
  }
  async function init() {
    if(location.protocol==="file:"){startupError("HTML показывает карту, а Python выполняет производство.");return;}
    try {
      const setup=await api("content");content=setup.content;token=setup.token;studentPath=setup.student_path;roles=content.lesson.workers;
      map=new window.WorkshopMap(canvas,content,selectWorker);
      const result=await api("state");view=result;state=result.state;map.reset(view);map.receive(view);render();
      requestAnimationFrame(animate);
    }catch(error){startupError("Не удалось подключиться. Перезапусти run_game.bat.");}
  }
  init();
})();
