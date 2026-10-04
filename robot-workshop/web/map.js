/* Canvas presentation of actual backend scenes. No economic calculations here. */
(() => {
  "use strict";
  const ROOMS = {
    reception:{x:35,y:55,w:250,h:245,title:"БЮРО ЗАКАЗОВ",color:"#72bcdd",home:[160,235]},
    warehouse:{x:310,y:55,w:290,h:245,title:"СКЛАД ДЕТАЛЕЙ",color:"#e7b563",home:[450,240]},
    engineer:{x:625,y:55,w:255,h:245,title:"КОНСТРУКТОРСКАЯ",color:"#b6a1e2",home:[750,230]},
    shipping:{x:905,y:55,w:260,h:245,title:"ОТГРУЗКА",color:"#bdd296",home:[1050,235]},
    assembler:{x:110,y:420,w:380,h:215,title:"ЛИНИЯ СБОРКИ",color:"#7fbe94",home:[310,565]},
    qc:{x:530,y:420,w:320,h:215,title:"КОНТРОЛЬ КАЧЕСТВА",color:"#e49187",home:[690,565]},
    cleaner:{x:905,y:420,w:260,h:215,title:"СЕРВИС И УБОРКА",color:"#90bab7",home:[1040,565]}
  };
  const LABELS = {order_received:"Клиент принёс заказ",read_order:"Читаю заказ",check_capacity:"Оцениваю мощность",accept_order:"Принимаю заказ",reject_order:"Заказ слишком большой",check_stock:"Проверяю остатки",order_parts:"Заказываю детали",receive_delivery:"Принимаю поставку",issue_parts:"Несу комплект",read_blueprint:"Открываю схему",calculate_parts:"Рассчитываю детали",report_problem:"Проверяю расчёт",take_parts:"Иду за деталями",assemble_vacuum:"Собираю пылесос",basic_test:"Проверяю сборку",send_to_qc:"Несу на контроль",inspect_product:"Проверяю изделие",request_rework:"Несу на переделку",rework:"Исправляю дефект",approve_product:"Готово к отгрузке",reject_product:"В отходы",product_sold:"Несу клиенту",product_returned:"Клиент вернул брак",shortage:"Жду детали",check_workshop:"Осматриваю цех",clean_floor:"Навожу порядок",remove_scrap:"Убираю отходы",day_closed:"Подвожу итоги"};
  const TOOL_PROBLEMS = {inspect_product:"Нет осмотра!",check_stock:"Не вижу остатки",assemble_vacuum:"Не могу собрать",basic_test:"Нет теста",issue_parts:"Не могу выдать",receive_delivery:"Не могу принять",take_parts:"Не могу взять",send_to_qc:"Не могу передать",read_blueprint:"Нет схемы",calculate_parts:"Не могу рассчитать",approve_product:"Не могу одобрить"};
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

  class WorkshopMap {
    constructor(canvas,content,onSelect) {
      this.canvas=canvas;this.ctx=canvas.getContext("2d");this.content=content;this.onSelect=onSelect;
      this.robots={};this.time=0;this.progress=0;this.scene=null;this.view=null;this.selected=null;
      for(const role of content.lesson.workers)this.robots[role]={position:[...ROOMS[role].home],alert:null,task:"Готов к работе"};
      canvas.addEventListener("click",e=>{
        const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*1200/rect.width,y=(e.clientY-rect.top)*690/rect.height;
        const robot=Object.entries(this.robots).find(([,r])=>distance(r.position,[x,y])<35);
        const room=Object.entries(ROOMS).find(([role,r])=>role!=="shipping"&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
        if(robot||room)this.onSelect((robot||room)[0]);
      });
    }

    reset(view) {
      this.view=view;this.scene=null;this.progress=0;this.product=null;this.motion=null;
      for(const [role,r] of Object.entries(this.robots)){r.position=[...ROOMS[role].home];r.alert=null;r.task="Готов к работе";}
      this.draw();
    }

    receive(view) {
      this.view=view;
      const scene=view.live?.scene;
      if(scene&&(!this.scene||scene.id!==this.scene.id))this.prepare(scene);
      this.draw();
    }

    prepare(scene) {
      this.scene=scene;this.progress=0;
      const robot=this.robots[scene.actor];
      if(!robot){this.motion=null;return;}
      robot.task=LABELS[scene.kind]||"Работаю";
      const problem=scene.events.find(e=>e.event==="missing_tool");
      if(problem)robot.alert=TOOL_PROBLEMS[problem.data.tool]||"Не хватает Tool";
      if(scene.events.some(e=>e.event==="overbuy"))robot.alert="Снова закупаю всё";
      if(scene.events.some(e=>e.event==="missing_test"))robot.alert="Без базового теста";
      if(scene.events.some(e=>e.event==="shortage"))robot.alert="Жду детали";
      const home=ROOMS[scene.actor].home, targets=[];
      let carry=null;
      if(!problem) {
        switch(scene.kind) {
          case "receive_delivery":targets.push([80,350],ROOMS.warehouse.home);carry="crate";break;
          case "issue_parts":targets.push(ROOMS.warehouse.home,[410,555]);carry="parts";break;
          case "take_parts":targets.push([520,260],ROOMS.assembler.home);carry="parts";break;
          case "send_to_qc":targets.push([630,555]);carry="vacuum";break;
          case "request_rework":targets.push([370,555]);carry="vacuum";break;
          case "approve_product":targets.push(ROOMS.qc.home);break;
          case "product_sold":targets.push(ROOMS.shipping.home);carry="vacuum";break;
          case "product_returned":targets.push([870,580]);carry="broken";break;
          case "reject_product":targets.push([870,580]);carry="broken";break;
          case "check_workshop":targets.push([450,570]);break;
          case "clean_floor":targets.push([220,590],[455,590],[755,590]);carry="broom";break;
          case "remove_scrap":targets.push([870,580],home);carry="scrap";break;
          default:targets.push(home);
        }
      } else targets.push(home);
      const route=[[...robot.position]];
      for(const target of targets) {
        const from=route.at(-1);
        if(distance(from,target)<2)continue;
        if(Math.abs(from[0]-target[0])>140||Math.abs(from[1]-target[1])>120)route.push([from[0],350],[target[0],350]);
        route.push([...target]);
      }
      const lengths=route.slice(1).map((p,i)=>distance(route[i],p));
      this.motion={actor:scene.actor,route,lengths,total:lengths.reduce((a,b)=>a+b,0),carry};
      if(scene.kind==="assemble_vacuum"||scene.kind==="rework")this.product={position:[310,485],unit:scene.unit,broken:false};
      if(scene.kind==="send_to_qc")this.product={position:[690,490],unit:scene.unit,broken:scene.events.some(e=>e.event==="product_defect")};
      if(["product_sold","product_returned","reject_product"].includes(scene.kind))this.product=null;
    }

    advance(ms) {
      this.time+=ms;
      if(this.scene) {
        this.progress=Math.min(1,this.progress+ms/this.scene.duration_ms);
        if(this.motion&&this.motion.total) {
          let remaining=this.motion.total*this.progress;
          for(let i=0;i<this.motion.lengths.length;i++) {
            const length=this.motion.lengths[i];
            if(remaining<=length||i===this.motion.lengths.length-1) {
              const t=length?Math.min(1,remaining/length):1,a=this.motion.route[i],b=this.motion.route[i+1];
              this.robots[this.motion.actor].position=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];break;
            }
            remaining-=length;
          }
        }
      }
      this.draw();
    }

    snapshot() {
      return {scene:this.scene?.kind||null,scene_id:this.scene?.id||0,progress:Number(this.progress.toFixed(3)),
        robots:Object.fromEntries(Object.entries(this.robots).map(([role,r])=>[role,{x:Math.round(r.position[0]),y:Math.round(r.position[1]),task:r.task,alert:r.alert}])),
        product:this.product,carrying:this.motion?.carry||null,selected:this.selected};
    }

    box(x,y,w,h,r,fill,stroke) {
      const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
      if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
    }
    text(value,x,y,size=11,color="#71876b",weight="400") {
      this.ctx.font=`${weight} ${size}px "Segoe UI",Arial,sans-serif`;this.ctx.fillStyle=color;this.ctx.fillText(value,x,y);
    }
    circle(x,y,r,color) {const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
    crate(x,y,size=28) {
      this.box(x,y,size,size,3,"#ddbb7a","#bb9b59");this.box(x+size*.43,y,5,size,0,"#f0dca9");
      this.box(x+5,y+size-9,8,3,1,"#b59155");
    }
    vacuum(x,y,broken=false) {
      const c=this.ctx;c.fillStyle="#36553120";c.beginPath();c.ellipse(x,y+8,24,11,0,0,Math.PI*2);c.fill();
      c.fillStyle=broken?"#e8b3a0":"#f7f6e6";c.strokeStyle=broken?"#c47d65":"#91aa80";c.lineWidth=2;
      c.beginPath();c.ellipse(x,y,24,15,0,0,Math.PI*2);c.fill();c.stroke();
      this.box(x-7,y-6,14,7,3,broken?"#b96d51":"#608967");this.circle(x+10,y+3,2,"#d0b37b");
    }
    table(x,y,w,h,color="#9db794") {
      this.box(x+5,y+8,w,h,6,"#35502c16");this.box(x,y,w,h,6,color,"#78916f");
      this.box(x+6,y+6,w-12,h-12,4,"#d6dfc0");this.box(x+8,y+h,9,12,2,"#6d8466");this.box(x+w-17,y+h,9,12,2,"#6d8466");
    }
    room(role,r) {
      const selected=this.selected===role,active=this.scene?.actor===role&&this.view?.live;
      this.box(r.x+3,r.y+6,r.w,r.h,11,"#34532c12");
      this.box(r.x,r.y,r.w,r.h,11,selected?"#f8f8e7":"#eef1df",selected?"#9fb982":"#bdcdb0");
      this.box(r.x,r.y,r.w,6,3,r.color);
      this.text(r.title,r.x+15,r.y+28,11,"#788b68","600");
      if(active)this.circle(r.x+r.w-17,r.y+24,4,"#e4a74e");
      for(let x=r.x+20;x<r.x+r.w;x+=38){this.ctx.strokeStyle="#dce5cd";this.ctx.lineWidth=.5;this.ctx.beginPath();this.ctx.moveTo(x,r.y+40);this.ctx.lineTo(x,r.y+r.h-8);this.ctx.stroke();}
      if(role!=="shipping")this.text(this.content.workers[role].name,r.x+15,r.y+r.h-13,10,"#96a387");
    }
    equipment() {
      // Order desk, waiting chairs, paperwork.
      this.table(103,125,125,60,"#87bac7");this.box(148,137,32,21,3,"#456c6d");this.box(152,140,24,13,2,"#afd3bf");
      this.box(192,140,23,25,1,"#ffffec");for(let i=0;i<3;i++)this.box(195,145+i*5,17,1,0,"#bacba8");
      for(let i=0;i<2;i++){this.box(50,149+i*50,27,29,4,"#b6c4a4");this.box(53,149+i*50,21,6,2,"#91a17e");}
      // Visible stock shelves react to the backend inventory.
      const inventory=(this.view.live||this.view.state).inventory;
      const stock=Object.values(inventory).reduce((a,b)=>a+b,0);
      for(let row=0;row<2;row++) {
        this.box(331,108+row*64,246,49,4,"#b1bf97","#94a580");
        this.box(331,149+row*64,246,6,1,"#859d77");
        const boxes=Math.min(7,Math.ceil(stock/8)-row*3);
        for(let i=0;i<Math.max(0,boxes);i++)this.crate(340+i*32,116+row*64,26);
      }
      // Blueprint desk and pinned drawings.
      this.table(682,124,143,65,"#aaa4c1");this.box(702,134,64,40,2,"#edf3e7");
      this.ctx.strokeStyle="#91a9af";this.ctx.lineWidth=1;this.ctx.strokeRect(716,143,34,21);this.circle(725,153,4,"#bacbcc");
      this.box(780,139,31,27,3,"#817d98");this.box(785,143,21,17,2,"#c2cfb5");
      // Workbench with tools and the current vacuum.
      this.table(186,465,230,62,"#89b098");
      this.box(204,477,32,21,3,"#d5ba79");this.circle(252,487,9,"#839b7a");this.circle(252,487,4,"#c5d3b5");
      this.box(372,477,25,17,3,"#607e65");this.box(381,494,6,17,2,"#789274");
      // QC scanner, screen, lights.
      this.table(580,465,220,68,"#c2a398");this.box(632,472,117,42,7,"#ebefdd","#a9b599");
      this.box(766,472,25,24,3,"#6e8670");this.circle(778,482,4,this.robots.qc.alert?"#daa171":"#bfd89b");
      // Shipping dock and labels.
      this.box(937,123,196,72,7,"#b8c7a5");for(let x=946;x<1125;x+=17)this.box(x,129,4,60,2,"#92a685");
      const sold=(this.view.live||this.view.state).totals.units_sold;
      for(let i=0;i<Math.min(4,sold);i++)this.crate(940+i*43,93,33);
      this.box(994,198,83,15,4,"#d6dec4");this.text("К КЛИЕНТУ →",1000,209,9,"#8a9e79","600");
      // Maintenance corner, cleaning cart and scrap bin.
      this.table(960,469,146,50,"#9abdb2");this.box(972,478,36,25,4,"#c5dbc9");
      this.box(1130,485,16,65,5,"#e1ba75");this.box(1118,545,40,12,3,"#b8995e");
      this.box(850,548,41,54,6,"#a9b599","#8a9b7b");this.box(844,542,52,10,4,"#8d9f7e");
      const dirt=(this.view.live||this.view.state).dirt;
      for(let i=0;i<Math.min(12,dirt);i++)this.box(450+(i%3)*12,557+Math.floor(i/3)*13,8,7,2,i%2?"#bdac84":"#95a187");
      this.text("ОТХОДЫ",845,622,8,"#9bab8d");
      // Delivery door and a potted plant.
      this.box(24,319,26,65,3,"#a3b58e");this.text("ВХОД",52,339,9,"#8eaa7d","600");
      this.box(31,619,31,23,5,"#ccb388");this.circle(46,612,23,"#94b87c");this.circle(33,604,13,"#a6c88d");
    }
    drawRobot(role,robot) {
      const [x,y]=robot.position,c=this.ctx,active=this.motion?.actor===role&&this.view.live;
      const moving=active&&this.motion.total>0&&this.progress<1;
      const step=moving?Math.sin(this.time/75)*4:0,color=ROOMS[role].color;
      c.fillStyle="#36532c24";c.beginPath();c.ellipse(x,y+20,25,8,0,0,Math.PI*2);c.fill();
      this.box(x-17,y-16,34,32,9,color,"#71876a50");this.box(x-24,y-43,48,34,10,color,"#71876a50");
      this.box(x-18,y-35,36,14,5,"#315349");this.circle(x-8,y-28,3,"#d4efb7");this.circle(x+8,y-28,3,"#d4efb7");
      this.box(x-7,y-8,14,8,3,"#ffffff70");this.box(x-25,y-10,7,20,3,color);this.box(x+18,y-10,7,20,3,color);
      this.box(x-13,y+13+step,10,10,3,"#6c866b");this.box(x+3,y+13-step,10,10,3,"#6c866b");
      this.box(x-1,y-50,2,8,1,"#729367");this.circle(x,y-53,3,"#e8b55b");
      if(active&&this.motion.carry&&moving) {
        const carry=this.motion.carry;
        if(carry==="vacuum"||carry==="broken")this.vacuum(x,y+4,carry==="broken"||this.product?.broken);
        else if(carry==="broom"){this.box(x+28,y-20,4,53,2,"#b09363");this.box(x+17,y+29,28,9,2,"#d2b17a");}
        else this.crate(x-13,y-4,26);
      }
      if(robot.alert) {
        this.circle(x+28,y-41,9,"#f5dfb7");this.text("!",x+26,y-37,12,"#b78040","700");
      }
      if(active) {
        const label=robot.alert||robot.task;
        c.font='10px "Segoe UI",Arial,sans-serif';const w=c.measureText(label).width+20;
        this.box(x-w/2,y-81,w,22,5,robot.alert?"#fff0d3":"#fffef0","#c9d7b7");this.text(label,x-w/2+10,y-66,10,robot.alert?"#a47d45":"#789169");
        const ai=this.scene.events.reduce((sum,e)=>sum+(e.data.ai_cost||0),0);
        if(ai&&this.progress<.85)this.text(`−${ai.toFixed(1)} ₽`,x+35,y-9-this.progress*18,10,"#a59060");
      }
    }
    draw() {
      if(!this.view)return;
      const c=this.ctx;c.clearRect(0,0,1200,690);c.fillStyle="#dce9d3";c.fillRect(0,0,1200,690);
      for(let x=0;x<1200;x+=40)for(let y=0;y<690;y+=40){c.strokeStyle="#d2e0c7";c.lineWidth=.7;c.strokeRect(x,y,40,40);}
      this.box(20,321,1150,75,9,"#e8efda");
      c.setLineDash([6,12]);c.strokeStyle="#bbcea7";c.lineWidth=2;c.beginPath();c.moveTo(67,355);c.lineTo(1145,355);c.stroke();c.setLineDash([]);
      for(let x=105;x<1150;x+=190)this.text("›",x,363,24,"#b9cda5");
      for(const [role,r]of Object.entries(ROOMS))this.room(role,r);
      this.equipment();
      if(this.product&&!(this.motion?.carry==="vacuum"&&this.progress<1))this.vacuum(...this.product.position,this.product.broken);
      for(const [role,r]of Object.entries(this.robots).sort((a,b)=>a[1].position[1]-b[1].position[1]))this.drawRobot(role,r);
      if(this.view.live?.paused){this.box(481,330,238,44,8,"#fffef2ec","#c5d6b5");this.text("Ⅱ  СМЕНА НА ПАУЗЕ",516,357,14,"#79906a","600");}
    }
  }
  window.WorkshopMap=WorkshopMap;
  window.workshopSceneLabel=kind=>LABELS[kind]||"Смена идёт";
})();
