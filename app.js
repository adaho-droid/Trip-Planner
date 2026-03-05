/* Road Trip Planner PWA (offline, editable, drag reorder, Google Maps deep links + Leaflet map pins)
   - No Google Maps API key required
   - Map pins use Leaflet + OpenStreetMap (free)
*/
const STORAGE_KEY = "roadtrip_planner_v3";

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function pad(n){ return String(n).padStart(2,"0"); }
function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function nowHHMM(){
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function enc(s){ return encodeURIComponent((s||"").trim()); }
function mapsSearchUrl(q){ return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`; }
function mapsDirUrl(origin, dest){ return `https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(dest)}&travelmode=driving`; }

function defaultTrip(){
  const stop = (time, zh, en, query, duration, tags, notes, ticket, lat, lng)=>({
    id: uid(),
    time, nameZh: zh, nameEn: en||"", query: query||zh,
    durationMins: duration ?? 60,
    tags: tags||[],
    notes: notes||"",
    ticketRequired: !!ticket,
    bookingId: "",
    lat: (lat ?? null),
    lng: (lng ?? null),
  });

  return {
    id: "trip_2026_apr",
    name: "Sydney → Melbourne Coastal Road Trip",
    startDate: "2026-04-04",
    endDate: "2026-04-12",
    days: [
      { id:"d1", date:"2026-04-04", title:"Sydney", notes:"抵達日 + city walk", stops: [
        stop("15:00","Sydney Opera House / Circular Quay","","Sydney Opera House",90,["Scenic"],"harbour 景色，慢行",false, -33.8568, 151.2153),
        stop("17:00","Bondi Beach","","Bondi Beach NSW",90,["Scenic"],"可行到 Icebergs / 短段 coastal walk",false, -33.8915, 151.2767),
        stop("19:00","Cape Solander (Whale lookout)","","Cape Solander lookout",60,["Wildlife","Scenic"],"Optional：4月未必有鯨魚，當作海岸觀景點",false, -34.0112, 151.1582),
      ]},
      { id:"d2", date:"2026-04-05", title:"Sydney → Jervis Bay / Nowra", notes:"Grand Pacific Drive + Hyams（住宿 Nowra/Huskisson）", stops: [
        stop("07:30","Pick up car (Sydney CBD)","","Sydney CBD",30,["Safety"],"取車後出發",false, null, null),
        stop("09:00","Royal National Park lookout","","Royal National Park NSW",30,["Scenic"],"",false, null, null),
        stop("10:00","Sea Cliff Bridge","","Sea Cliff Bridge",20,["Scenic"],"",false, -34.2970, 150.9647),
        stop("11:00","Kiama Blowhole","","Kiama Blowhole",45,["Scenic"],"",false, -34.6728, 150.8552),
        stop("12:30","Lunch (Kiama)","","Kiama NSW",60,["Food"],"",false, null, null),
        stop("14:30","Hyams Beach (Jervis Bay)","","Hyams Beach",90,["Scenic"],"停車可能緊張，盡量早/晚少少去",false, -35.1033, 150.6915),
        stop("20:00","Stay: Nowra / Huskisson","","Nowra NSW",30,["Stay"],"入住休息",false, -34.8857, 150.6000),
      ]},
      { id:"d3", date:"2026-04-06", title:"Nowra → Narooma", notes:"袋鼠海灘 + 海岸小鎮", stops: [
        stop("10:30","Pebbly Beach (kangaroo)","","Pebbly Beach Murramarang National Park",60,["Wildlife"],"高機率見到袋鼠",false, -35.7090, 150.3100),
        stop("12:30","Lunch stop","","Batemans Bay NSW",60,["Food"],"",false, null, null),
        stop("15:00","Arrive Narooma","","Narooma NSW",30,["Scenic"],"",false, -36.2167, 150.1360),
        stop("17:30","Glasshouse Rocks (sunset)","","Glasshouse Rocks Narooma",45,["Scenic"],"日落好靚",false, -36.2075, 150.1385),
        stop("19:00","Stay: Narooma","","Narooma NSW",20,["Stay"],"",false, -36.2167, 150.1360),
      ]},
      { id:"d4", date:"2026-04-07", title:"Narooma → Eden", notes:"藍池 + Merimbula", stops: [
        stop("11:00","Bermagui Blue Pool","","Bermagui Blue Pool",45,["Scenic"],"",false, -36.4196, 150.0597),
        stop("13:00","Lunch (Merimbula)","","Merimbula NSW",60,["Food"],"",false, null, null),
        stop("15:00","Eden lookout","","Eden Lookout and Rotary Park",45,["Scenic"],"",false, -37.0645, 149.9023),
        stop("18:30","Stay: Eden","","Eden NSW",20,["Stay"],"",false, -37.0622, 149.9032),
      ]},
      { id:"d5", date:"2026-04-08", title:"Eden → Cape Conran → Lakes Entrance → Paynesville", notes:"加油/咖啡 + 震撼海岸 + koala", stops: [
        stop("10:45","Orbost coffee + petrol","","Orbost VIC",45,["Food","Fuel"],"建議加油（之後油站少）",false, null, null),
        stop("11:30","Cape Conran Coastal Park","","Cape Conran Coastal Park",60,["Scenic"],"短步道/海岸巨岩",false, -37.8030, 148.7410),
        stop("14:00","Lakes Entrance lunch + walk","","Lakes Entrance VIC",75,["Food","Scenic"],"",false, -37.8786, 147.9936),
        stop("16:00","Arrive Paynesville","","Paynesville VIC",20,["Stay"],"先 check-in / 休息",false, -37.9150, 147.7200),
        stop("16:30","Raymond Island (Koala walk)","","Raymond Island Ferry Paynesville",60,["Wildlife"],"坐渡輪過島（幾分鐘）",false, -37.9130, 147.7130),
      ]},
      { id:"d6", date:"2026-04-09", title:"Paynesville → Wilsons Prom → Cowes", notes:"白沙海岸 + 晚上看企鵝（住 Cowes）", stops: [
        stop("11:00","Wilsons Prom NP","","Wilsons Promontory National Park",270,["Scenic","Wildlife"],"Squeaky Beach + Tidal River，慢行",false, -39.0380, 146.3220),
        stop("18:00","Arrive Cowes (Phillip Island)","","Cowes VIC",30,["Stay"],"晚餐/休息",false, -38.4510, 145.2390),
        stop("19:30","Penguin Parade (ticket)","","Phillip Island Penguin Parade",75,["Wildlife","Ticket"],"建議早 1 小時到；禁用閃光燈",true, -38.5180, 145.1510),
      ]},
      { id:"d7", date:"2026-04-10", title:"Phillip Island → Puffing Billy → Brighton → Melbourne → Night flight", notes:"火車＋彩色小屋＋市區快閃＋夜機返 Sydney", stops: [
        stop("09:15","Cape Woolamai lookout","","Cape Woolamai",30,["Scenic"],"短步道/觀景",false, -38.5470, 145.3390),
        stop("10:30","Puffing Billy (Belgrave→Lakeside)","","Puffing Billy Railway Belgrave Station",150,["Scenic","Ticket"],"建議預訂；坐左邊影相多",true, -37.9106, 145.3530),
        stop("14:30","Brighton Bathing Boxes","","Brighton Bathing Boxes",30,["Scenic"],"30分鐘夠影相",false, -37.9160, 144.9850),
        stop("15:30","Melbourne CBD quick walk","","Flinders Street Station",90,["Scenic","Food"],"Hosier Lane / Fed Square",false, -37.8183, 144.9671),
        stop("20:00","Return car (Melbourne Airport)","","Melbourne Airport",45,["Safety"],"預留時間還車",false, -37.6733, 144.8433),
      ]},
      { id:"d8", date:"2026-04-11", title:"Sydney buffer day", notes:"休息/購物/自由安排", stops: [
        stop("10:30","Free day (Sydney)","","Darling Harbour",180,["Scenic","Food"],"可改成你想去嘅點",false, -33.8732, 151.2014),
      ]},
      { id:"d9", date:"2026-04-12", title:"Sydney departure", notes:"11:05 起飛", stops: [
        stop("08:30","Go to airport","","Sydney Airport",60,["Safety"],"",false, -33.9399, 151.1753),
        stop("11:05","Flight departure","","Sydney Airport",10,["Ticket"],"",false, -33.9399, 151.1753),
      ]},
    ],
    bookings: [
      { id: uid(), type:"activity", provider:"Penguin Parade", datetime:"2026-04-09 19:30", confirmationNo:"", price:"", currency:"AUD", notes:"" },
      { id: uid(), type:"activity", provider:"Puffing Billy", datetime:"2026-04-10 10:30", confirmationNo:"", price:"", currency:"AUD", notes:"" },
      { id: uid(), type:"car", provider:"Car rental", datetime:"2026-04-05 → 2026-04-10", confirmationNo:"", price:"", currency:"AUD", notes:"Pickup Sydney CBD; Drop Melbourne Airport" },
      { id: uid(), type:"hotel", provider:"Hotels", datetime:"Various nights", confirmationNo:"", price:"", currency:"AUD", notes:"Sydney / Nowra / Narooma / Eden / Paynesville / Cowes / Sydney" },
    ],
    checklist: {
      "出發前 Pre-trip": [
        {id:uid(), text:"護照 / 簽證 / 機票確認", done:false},
        {id:uid(), text:"租車：駕照/國際駕照、保險、信用卡", done:false},
        {id:uid(), text:"電話：離線地圖 / 充電線 / 車充", done:false},
        {id:uid(), text:"提醒：夜間野生動物風險（kanga/wallaby）", done:false},
      ],
      "車上 Car": [
        {id:uid(), text:"水 + 小食", done:false},
        {id:uid(), text:"太陽眼鏡 / 防曬", done:false},
        {id:uid(), text:"雨具 / 外套（海岸天氣變化）", done:false},
      ],
      "活動 Bookings": [
        {id:uid(), text:"Puffing Billy 訂票", done:false},
        {id:uid(), text:"Penguin Parade 訂票", done:false},
      ]
    }
  };
}

function loadTrip(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const t = defaultTrip(); saveTrip(t); return t;
  }
  try{ return JSON.parse(raw); }catch{ const t=defaultTrip(); saveTrip(t); return t; }
}
function saveTrip(t){ localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

let trip = loadTrip();

const views = {
  today: $("#view-today"),
  itinerary: $("#view-itinerary"),
  map: $("#view-map"),
  bookings: $("#view-bookings"),
  checklist: $("#view-checklist"),
  settings: $("#view-settings"),
};

function setTab(tab){
  $$(".bottomnav__item").forEach(b => b.classList.toggle("active", b.dataset.tab===tab));
  Object.keys(views).forEach(k => views[k].classList.toggle("hidden", k!==tab));
  render(tab);
}
$$(".bottomnav__item").forEach(btn => btn.addEventListener("click", ()=>setTab(btn.dataset.tab)));

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function findDayById(id){ return trip.days.find(d=>d.id===id); }
function findDayByDate(date){ return trip.days.find(d=>d.date===date); }
function findStop(stopId){
  for(const day of trip.days){
    const idx = (day.stops||[]).findIndex(s=>s.id===stopId);
    if(idx>=0) return {day, stop: day.stops[idx], index: idx};
  }
  return {day:null, stop:null, index:-1};
}

function render(tab){
  if(tab==="today") renderToday();
  if(tab==="itinerary") renderItinerary();
  if(tab==="map") renderMap();
  if(tab==="bookings") renderBookings();
  if(tab==="checklist") renderChecklist();
  if(tab==="settings") renderSettings();
}

function stopCard(day, s){
  const idx = (day.stops||[]).findIndex(x=>x.id===s.id);
  const prev = idx>0 ? day.stops[idx-1] : null;
  const next = idx>=0 && idx<day.stops.length-1 ? day.stops[idx+1] : null;

  const tags = (s.tags||[]).map(t=>{
    const cls = t==="Ticket" ? "tag tag--ticket" : "tag";
    return `<span class="${cls}">${escapeHtml(t)}</span>`;
  }).join("");

  const note = s.notes ? `<div class="note">${escapeHtml(s.notes)}</div>` : "";
  const en = s.nameEn ? `<div class="stop__en">${escapeHtml(s.nameEn)}</div>` : "";

  const navTo = `<button class="btn" data-nav-search="${escapeHtml(s.id)}">導航到此</button>`;
  const navPrev = prev ? `<button class="btn" data-nav-prev="${escapeHtml(s.id)}">上一站→本站</button>` : "";
  const navNext = next ? `<button class="btn" data-nav-next="${escapeHtml(s.id)}">本站→下一站</button>` : "";
  const edit = `<button class="btn btn--ghost" data-edit-stop="${escapeHtml(s.id)}">編輯</button>`;

  return `
    <div class="stop" draggable="true" data-stop="${escapeHtml(s.id)}" data-day="${escapeHtml(day.id)}">
      <div class="stop__head">
        <div class="handle" title="拖拉排序">≡</div>
        <div class="time">${escapeHtml(s.time||"--:--")}</div>
        <div class="stop__title">
          <div class="stop__zh">${escapeHtml(s.nameZh||"(untitled)")}</div>
          ${en}
          <div class="tags">${tags}</div>
          ${note}
          ${(Number.isFinite(s.lat) && Number.isFinite(s.lng)) ? `<div class="note">📍 ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</div>` : ""}
        </div>
      </div>
      <div class="actions">
        ${navTo}
        ${navPrev}
        ${navNext}
        ${edit}
      </div>
    </div>
  `;
}

function attachStopActions(){
  $$("[data-nav-search]").forEach(b=>{
    b.onclick = ()=>{
      const {stop} = findStop(b.dataset.navSearch);
      if(!stop) return;
      window.open(mapsSearchUrl(stop.query || stop.nameZh), "_blank");
    };
  });
  $$("[data-nav-prev]").forEach(b=>{
    b.onclick = ()=>{
      const {day, stop, index} = findStop(b.dataset.navPrev);
      if(!stop || index<=0) return;
      const prev = day.stops[index-1];
      window.open(mapsDirUrl(prev.query||prev.nameZh, stop.query||stop.nameZh), "_blank");
    };
  });
  $$("[data-nav-next]").forEach(b=>{
    b.onclick = ()=>{
      const {day, stop, index} = findStop(b.dataset.navNext);
      if(!stop || index>=day.stops.length-1) return;
      const nxt = day.stops[index+1];
      window.open(mapsDirUrl(stop.query||stop.nameZh, nxt.query||nxt.nameZh), "_blank");
    };
  });
  $$("[data-edit-stop]").forEach(b=>{
    b.onclick = ()=>{
      const {day, stop} = findStop(b.dataset.editStop);
      if(!stop) return;
      openStopDialog({dayId: day.id, stopId: stop.id});
    };
  });
}

function enableDnD(){
  $$("[draggable='true'][data-stop]").forEach(el=>{
    el.addEventListener("dragstart", e=>{
      e.dataTransfer.setData("text/plain", JSON.stringify({stopId: el.dataset.stop, dayId: el.dataset.day}));
      el.style.opacity = "0.6";
    });
    el.addEventListener("dragend", ()=>{ el.style.opacity = "1"; });
  });

  $$(".stops[data-stops]").forEach(container=>{
    container.addEventListener("dragover", e=>e.preventDefault());
    container.addEventListener("drop", e=>{
      e.preventDefault();
      let payload;
      try{ payload = JSON.parse(e.dataTransfer.getData("text/plain")); }catch{ return; }
      const {stopId, dayId} = payload;
      const targetDayId = container.dataset.stops;
      if(dayId !== targetDayId){
        alert("拖拉跨日未啟用：請用『編輯』改日期。");
        return;
      }
      const day = findDayById(dayId);
      if(!day) return;
      const after = getDragAfter(container, e.clientY);
      const fromIdx = day.stops.findIndex(s=>s.id===stopId);
      if(fromIdx<0) return;
      const [moved] = day.stops.splice(fromIdx, 1);

      let toIdx;
      if(after==null){
        toIdx = day.stops.length;
      }else{
        const afterId = after.dataset.stop;
        toIdx = day.stops.findIndex(s=>s.id===afterId);
        if(toIdx<0) toIdx = day.stops.length;
      }
      day.stops.splice(toIdx, 0, moved);
      saveTrip(trip);
      render("itinerary");
      render("today");
      render("map");
    });
  });
}

function getDragAfter(container, y){
  const els = [...container.querySelectorAll(".stop[draggable='true']")];
  return els.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > closest.offset){
      return {offset, element: child};
    }
    return closest;
  }, {offset: Number.NEGATIVE_INFINITY, element: null}).element;
}

function renderToday(){
  const iso = todayISO();
  let day = findDayByDate(iso);
  if(!day) day = trip.days.find(d=>d.date>=iso) || trip.days[0];

  const stops = day.stops || [];
  const now = nowHHMM();
  const next = stops.find(s => (s.time||"") >= now) || stops[0];

  views.today.innerHTML = `
    <div class="card">
      <div class="row">
        <div class="pill">Today：${escapeHtml(day.date)} · ${escapeHtml(day.title)}</div>
        <div class="spacer"></div>
        <button class="btn btn--primary" data-add-stop="${escapeHtml(day.id)}">+ 新增 Stop</button>
      </div>
      <div class="card__sub" style="margin-top:10px">${escapeHtml(day.notes||"")}</div>
      <div class="hr"></div>
      <div class="card__title">下一站 Next</div>
      ${next ? stopCard(day, next) : `<div class="empty">今日沒有 stops。</div>`}
    </div>

    <div class="day">
      <div class="day__head">
        <div>
          <div class="day__title">今日全部 Stops</div>
          <div class="day__meta">提示：用卡片「上一站→本站 / 本站→下一站」開 Google Maps 路線</div>
        </div>
      </div>
      <div class="stops" data-stops="${escapeHtml(day.id)}">
        ${stops.length ? stops.map(s=>stopCard(day,s)).join("") : `<div class="empty">今日沒有 stops。</div>`}
      </div>
    </div>
  `;

  $$("[data-add-stop]").forEach(b=>b.addEventListener("click", ()=>openStopDialog({dayId:b.dataset.addStop})));
  enableDnD();
  attachStopActions();
}

function renderItinerary(){
  const daysHtml = trip.days.map(day=>{
    const stops = day.stops || [];
    return `
      <div class="day">
        <div class="day__head">
          <div>
            <div class="day__title">${escapeHtml(day.date)} · ${escapeHtml(day.title)}</div>
            <div class="day__meta">${escapeHtml(day.notes||"")}</div>
          </div>
          <div class="row">
            <button class="btn btn--primary" data-add-stop="${escapeHtml(day.id)}">+ 新增 Stop</button>
          </div>
        </div>

        <div class="stops" data-stops="${escapeHtml(day.id)}">
          ${stops.length ? stops.map(s=>stopCard(day,s)).join("") : `<div class="empty">這天暫時沒有 stops。</div>`}
        </div>
      </div>
    `;
  }).join("");

  views.itinerary.innerHTML = `
    <div class="card">
      <div class="row">
        <div class="pill">${escapeHtml(trip.name)}</div>
        <div class="spacer"></div>
        <button class="btn btn--ghost" id="btnReset">重置</button>
      </div>
      <div class="card__sub" style="margin-top:10px">拖拉「≡」改順序；點「編輯」改內容；導航用 Google Maps（免費）。</div>
    </div>
    ${daysHtml}
  `;

  $("#btnReset").onclick = ()=>{
    if(confirm("確定重置？會清除所有修改。")){
      localStorage.removeItem(STORAGE_KEY);
      trip = loadTrip();
      render("itinerary"); render("today"); render("map"); render("bookings"); render("checklist");
    }
  };

  $$("[data-add-stop]").forEach(b=>b.addEventListener("click", ()=>openStopDialog({dayId:b.dataset.addStop})));
  enableDnD();
  attachStopActions();
}

/* ================= MAP =================
   - Leaflet + OSM
   - Pins only: Stay/Scenic/Wildlife
   - Show daily polylines (if coords available)
*/
function shouldPin(stop){
  const tags = new Set(stop.tags || []);
  return tags.has("Stay") || tags.has("Scenic") || tags.has("Wildlife");
}
function hasLatLng(stop){
  return Number.isFinite(stop.lat) && Number.isFinite(stop.lng);
}

function renderMap(){
  const allStops = trip.days.flatMap(d=>d.stops.map(s=>({
    id:s.id,
    label:`${d.date} ${s.time||"--:--"} · ${s.nameZh}`,
    query:s.query||s.nameZh
  })));

  const opts = allStops.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</option>`).join("");

  views.map.innerHTML = `
    <div class="card">
      <div class="card__title">地圖 Map（Pins + Route）</div>
      <div class="card__sub">
        只會 pin：Stay / Scenic / Wildlife（避免太亂）。要 pin 其他點：在 Stop 加 tag + 填 lat/lng。
      </div>
      <div class="mapbox" id="leafletMap"></div>
    </div>

    <div class="card">
      <div class="card__title">快速路線 A → B（Google Maps）</div>
      <div class="card__sub">揀起點/終點，直接開 Google Maps（Google 自動計車程）。</div>
      <div class="row">
        <label class="field" style="flex:1">
          <span class="field__label">From</span>
          <select id="routeFrom">${opts}</select>
        </label>
        <label class="field" style="flex:1">
          <span class="field__label">To</span>
          <select id="routeTo">${opts}</select>
        </label>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn--primary" id="btnRoute">開啟路線</button>
        <button class="btn" id="btnSwap">交換 Swap</button>
      </div>
    </div>
  `;

  $("#btnRoute").onclick = ()=>{
    const fromId = $("#routeFrom").value;
    const toId = $("#routeTo").value;
    const A = allStops.find(s=>s.id===fromId);
    const B = allStops.find(s=>s.id===toId);
    if(!A || !B) return;
    window.open(mapsDirUrl(A.query, B.query), "_blank");
  };
  $("#btnSwap").onclick = ()=>{
    const a = $("#routeFrom").value;
    $("#routeFrom").value = $("#routeTo").value;
    $("#routeTo").value = a;
  };

  // Leaflet init (after DOM inserted)
  initLeafletMap();
}

function initLeafletMap(){
  // Leaflet is loaded via CDN; guard
  if(!window.L){
    $("#leafletMap").innerHTML = `<div class="empty">地圖載入失敗（可能無網 / CDN 被擋）。</div>`;
    return;
  }

  // reuse map instance
  if(!window.__leafletState){
    window.__leafletState = { map:null, markers:null, lines:null };
  }

  const state = window.__leafletState;
  const el = $("#leafletMap");

  // (re)create map if needed
  if(!state.map){
    state.map = L.map(el, { zoomControl:true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);
    state.markers = L.layerGroup().addTo(state.map);
    state.lines = L.layerGroup().addTo(state.map);
  }else{
    // if DOM replaced, Leaflet needs a new container; easiest: fully reset
    try{ state.map.remove(); }catch{}
    window.__leafletState = { map:null, markers:null, lines:null };
    return initLeafletMap();
  }

  const pins = [];
  state.markers.clearLayers();
  state.lines.clearLayers();

  // draw per-day polyline + pins
  for(const day of trip.days){
    const coords = [];
    for(const s of (day.stops||[])){
      if(shouldPin(s) && hasLatLng(s)){
        const ll = [s.lat, s.lng];
        pins.push(ll);
        L.marker(ll).addTo(state.markers)
          .bindPopup(`<b>${escapeHtml(day.date)} ${escapeHtml(s.time||"")}</b><br>${escapeHtml(s.nameZh)}<br><small>${escapeHtml(s.nameEn||"")}</small>`);
      }
      // for route line, we only connect points that have coords
      if(hasLatLng(s)){
        coords.push([s.lat, s.lng]);
      }
    }
    if(coords.length >= 2){
      L.polyline(coords, { weight: 4, opacity: 0.75 }).addTo(state.lines);
    }
  }

  // fit bounds
  if(pins.length){
    state.map.fitBounds(pins, { padding:[18,18] });
  }else{
    state.map.setView([-37.0, 145.0], 5); // default AU
  }
}

/* ================= Bookings / Checklist / Settings (keep simple) ================= */
function bookingRow(b){
  return `
    <div class="stop" style="cursor:default">
      <div class="stop__head">
        <div class="time">${escapeHtml(b.type)}</div>
        <div class="stop__title">
          <div class="stop__zh">${escapeHtml(b.provider||"(no provider)")}</div>
          <div class="stop__en">${escapeHtml(b.datetime||"")}</div>
          <div class="note">Confirmation：<span class="pill">${escapeHtml(b.confirmationNo||"(empty)")}</span></div>
          <div class="note">Price：${escapeHtml(b.price||"")} ${escapeHtml(b.currency||"")}</div>
          ${b.notes ? `<div class="note">${escapeHtml(b.notes)}</div>` : ""}
        </div>
      </div>
      <div class="actions">
        <button class="btn" data-edit-booking="${escapeHtml(b.id)}">編輯</button>
      </div>
    </div>
  `;
}

function renderBookings(){
  const list = trip.bookings || [];
  views.bookings.innerHTML = `
    <div class="card">
      <div class="row">
        <div class="pill">預訂 Bookings</div>
        <div class="spacer"></div>
        <button class="btn btn--primary" id="btnAddBooking">+ 新增 Booking</button>
      </div>
      <div class="card__sub" style="margin-top:10px">把 Puffing Billy / Penguin / 租車 / 酒店 confirmation 都放入。</div>
    </div>

    <div class="day">
      <div class="day__head">
        <div>
          <div class="day__title">列表</div>
          <div class="day__meta">離線可讀；可在 Stop 編輯裡關聯 booking。</div>
        </div>
      </div>

      <div class="stops">
        ${list.length ? list.map(bookingRow).join("") : `<div class="empty">暫時未有 bookings。</div>`}
      </div>
    </div>
  `;

  $("#btnAddBooking").onclick = ()=>openBookingDialog(null);
  $$("[data-edit-booking]").forEach(b=>{
    b.onclick = ()=>openBookingDialog(b.dataset.editBooking);
  });
}

function renderChecklist(){
  const sections = trip.checklist || {};
  const secHtml = Object.entries(sections).map(([name, items])=>{
    const rows = items.map(it=>`
      <div class="stop" style="cursor:default">
        <div class="stop__head">
          <div class="handle" style="cursor:default">☑</div>
          <div class="stop__title">
            <div class="row" style="justify-content:space-between">
              <label class="row" style="gap:10px">
                <input type="checkbox" data-chk="${escapeHtml(name)}::${escapeHtml(it.id)}" ${it.done?'checked':''} />
                <span class="stop__zh">${escapeHtml(it.text)}</span>
              </label>
              <button class="btn btn--ghost" data-delchk="${escapeHtml(name)}::${escapeHtml(it.id)}">刪除</button>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    return `
      <div class="day">
        <div class="day__head">
          <div>
            <div class="day__title">${escapeHtml(name)}</div>
            <div class="day__meta">勾選會自動保存</div>
          </div>
          <div class="row">
            <button class="btn btn--primary" data-addchk="${escapeHtml(name)}">+ 新增</button>
          </div>
        </div>
        <div class="stops">
          ${rows || `<div class="empty">空白</div>`}
        </div>
      </div>
    `;
  }).join("");

  views.checklist.innerHTML = `
    <div class="card">
      <div class="card__title">Checklist</div>
      <div class="card__sub">車上用品、證件、訂票提醒。適合爸媽同行。</div>
    </div>
    ${secHtml}
  `;

  $$("[data-chk]").forEach(cb=>{
    cb.onchange = ()=>{
      const [sec, id] = cb.dataset.chk.split("::");
      const items = trip.checklist?.[sec] || [];
      const it = items.find(x=>x.id===id);
      if(it){ it.done = cb.checked; saveTrip(trip); }
    };
  });
  $$("[data-addchk]").forEach(btn=>{
    btn.onclick = ()=>{
      const sec = btn.dataset.addchk;
      const text = prompt(`新增項目（${sec}）`);
      if(!text) return;
      trip.checklist[sec].push({id:uid(), text, done:false});
      saveTrip(trip);
      render("checklist");
    };
  });
  $$("[data-delchk]").forEach(btn=>{
    btn.onclick = ()=>{
      const [sec, id] = btn.dataset.delchk.split("::");
      if(!confirm("刪除這個項目？")) return;
      trip.checklist[sec] = (trip.checklist[sec]||[]).filter(x=>x.id!==id);
      saveTrip(trip);
      render("checklist");
    };
  });
}

function renderSettings(){
  views.settings.innerHTML = `
    <div class="card">
      <div class="card__title">設定 Settings</div>
      <div class="card__sub">
        導航：Google Maps（免費、免 API key）。<br>
        地圖：Leaflet + OpenStreetMap（免費）。Pins 需要 Stop 有 lat/lng。
      </div>
      <div class="hr"></div>
      <div class="row">
        <button class="btn" id="btnInstall">如何安裝到手機</button>
        <button class="btn" id="btnBackup">備份到檔案</button>
        <button class="btn" id="btnRestore">從檔案還原</button>
      </div>
      <div class="hr"></div>
      <div class="empty">
        <div style="font-weight:900;margin-bottom:6px">貼士：點樣搵 lat/lng？</div>
        打開 Google Maps → 長按地圖放 pin → 底部會出現座標（或分享位置）；把座標填入 Stop 的 lat/lng。
      </div>
    </div>
  `;

  $("#btnInstall").onclick = ()=>{
    alert(
`Samsung / Android（Chrome）：
1) 用 Chrome 開此頁
2) 右上 ⋮
3)「Install app」或「Add to Home screen」`
    );
  };

  $("#btnBackup").onclick = ()=>{
    const blob = new Blob([JSON.stringify(trip,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "trip-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  $("#btnRestore").onclick = ()=>{
    const input = document.createElement("input");
    input.type="file"; input.accept="application/json";
    input.onchange = async ()=>{
      const f = input.files?.[0];
      if(!f) return;
      const text = await f.text();
      try{
        const obj = JSON.parse(text);
        if(!obj.days) throw new Error("Invalid");
        trip = obj;
        saveTrip(trip);
        render("today"); render("itinerary"); render("map"); render("bookings"); render("checklist");
        alert("還原成功");
      }catch{
        alert("還原失敗：檔案格式不正確");
      }
    };
    input.click();
  };
}

/* ================= Stop modal ================= */
const stopDlg = $("#stopDialog");
const f_day = $("#f_day");
const f_time = $("#f_time");
const f_nameZh = $("#f_nameZh");
const f_nameEn = $("#f_nameEn");
const f_query = $("#f_query");
const f_lat = $("#f_lat");
const f_lng = $("#f_lng");
const f_duration = $("#f_duration");
const f_tags = $("#f_tags");
const f_notes = $("#f_notes");
const f_ticket = $("#f_ticket");
const f_booking = $("#f_booking");
const f_stopId = $("#f_stopId");

$("#btnSaveStop").onclick = ()=>saveStop();
$("#btnDeleteStop").onclick = ()=>deleteStop();

function setMultiSelect(sel, values){
  const set = new Set(values);
  Array.from(sel.options).forEach(opt => opt.selected = set.has(opt.value));
}
function getMultiSelect(sel){
  return Array.from(sel.selectedOptions).map(o=>o.value);
}

function openStopDialog({dayId, stopId}){
  f_day.innerHTML = trip.days.map(d=>`<option value="${escapeHtml(d.id)}">${escapeHtml(d.date)} · ${escapeHtml(d.title)}</option>`).join("");
  const bks = trip.bookings || [];
  f_booking.innerHTML = `<option value="">(none)</option>` + bks.map(b=>`<option value="${escapeHtml(b.id)}">${escapeHtml(b.provider)} · ${escapeHtml(b.datetime||"")}</option>`).join("");

  const day = findDayById(dayId) || trip.days[0];
  f_day.value = day.id;

  let s = null;
  if(stopId){
    s = day.stops.find(x=>x.id===stopId) || null;
    $("#stopDialogTitle").textContent = "編輯 Stop";
    $("#btnDeleteStop").style.display = "";
  }else{
    $("#stopDialogTitle").textContent = "新增 Stop";
    $("#btnDeleteStop").style.display = "none";
  }

  if(s){
    f_stopId.value = s.id;
    f_time.value = s.time || "";
    f_nameZh.value = s.nameZh || "";
    f_nameEn.value = s.nameEn || "";
    f_query.value = s.query || "";
    f_lat.value = (Number.isFinite(s.lat) ? String(s.lat) : "");
    f_lng.value = (Number.isFinite(s.lng) ? String(s.lng) : "");
    f_duration.value = String(s.durationMins ?? 60);
    f_notes.value = s.notes || "";
    f_ticket.value = s.ticketRequired ? "yes" : "no";
    f_booking.value = s.bookingId || "";
    setMultiSelect(f_tags, s.tags || []);
  }else{
    f_stopId.value = "";
    f_time.value = "10:00";
    f_nameZh.value = "";
    f_nameEn.value = "";
    f_query.value = "";
    f_lat.value = "";
    f_lng.value = "";
    f_duration.value = "60";
    f_notes.value = "";
    f_ticket.value = "no";
    f_booking.value = "";
    setMultiSelect(f_tags, []);
  }

  stopDlg.showModal();
}

function saveStop(){
  const day = findDayById(f_day.value);
  if(!day) return;

  const latVal = f_lat.value.trim();
  const lngVal = f_lng.value.trim();
  const lat = latVal ? Number(latVal) : null;
  const lng = lngVal ? Number(lngVal) : null;

  const obj = {
    id: f_stopId.value || uid(),
    time: f_time.value || "",
    nameZh: f_nameZh.value.trim() || "(untitled)",
    nameEn: f_nameEn.value.trim(),
    query: f_query.value.trim() || f_nameZh.value.trim(),
    durationMins: parseInt(f_duration.value || "60", 10),
    tags: getMultiSelect(f_tags),
    notes: f_notes.value.trim(),
    ticketRequired: f_ticket.value === "yes",
    bookingId: f_booking.value || "",
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };

  const existing = f_stopId.value ? findStop(f_stopId.value) : {day:null, index:-1};
  if(existing.stop){
    if(existing.day.id !== day.id){
      existing.day.stops.splice(existing.index,1);
      day.stops.push(obj);
    }else{
      day.stops[existing.index] = obj;
    }
  }else{
    day.stops.push(obj);
  }

  saveTrip(trip);
  stopDlg.close();
  render("today"); render("itinerary"); render("map");
}

function deleteStop(){
  const id = f_stopId.value;
  if(!id) return stopDlg.close();
  if(!confirm("確定刪除？")) return;

  for(const day of trip.days){
    const idx = day.stops.findIndex(s=>s.id===id);
    if(idx>=0){ day.stops.splice(idx,1); break; }
  }
  saveTrip(trip);
  stopDlg.close();
  render("today"); render("itinerary"); render("map");
}

/* ================= Booking modal (same as before, kept minimal) ================= */
const bookingDlg = $("#bookingDialog");
const b_type = $("#b_type");
const b_provider = $("#b_provider");
const b_datetime = $("#b_datetime");
const b_conf = $("#b_conf");
const b_price = $("#b_price");
const b_currency = $("#b_currency");
const b_notes = $("#b_notes");
const b_id = $("#b_id");

$("#btnSaveBooking").onclick = ()=>saveBooking();
$("#btnDeleteBooking").onclick = ()=>deleteBooking();

function openBookingDialog(id){
  let b = null;
  if(id){
    b = (trip.bookings||[]).find(x=>x.id===id) || null;
    $("#bookingDialogTitle").textContent = "編輯 Booking";
    $("#btnDeleteBooking").style.display = "";
  }else{
    $("#bookingDialogTitle").textContent = "新增 Booking";
    $("#btnDeleteBooking").style.display = "none";
  }

  if(b){
    b_id.value = b.id;
    b_type.value = b.type || "activity";
    b_provider.value = b.provider || "";
    b_datetime.value = b.datetime || "";
    b_conf.value = b.confirmationNo || "";
    b_price.value = b.price || "";
    b_currency.value = b.currency || "AUD";
    b_notes.value = b.notes || "";
  }else{
    b_id.value = "";
    b_type.value = "activity";
    b_provider.value = "";
    b_datetime.value = "";
    b_conf.value = "";
    b_price.value = "";
    b_currency.value = "AUD";
    b_notes.value = "";
  }

  bookingDlg.showModal();
}

function saveBooking(){
  const obj = {
    id: b_id.value || uid(),
    type: b_type.value,
    provider: b_provider.value.trim(),
    datetime: b_datetime.value.trim(),
    confirmationNo: b_conf.value.trim(),
    price: b_price.value.trim(),
    currency: b_currency.value.trim() || "AUD",
    notes: b_notes.value.trim()
  };

  const list = trip.bookings || [];
  const idx = list.findIndex(x=>x.id===obj.id);
  if(idx>=0) list[idx] = obj;
  else list.push(obj);
  trip.bookings = list;

  saveTrip(trip);
  bookingDlg.close();
  render("bookings");
}

function deleteBooking(){
  const id = b_id.value;
  if(!id) return bookingDlg.close();
  if(!confirm("刪除這個 booking？")) return;
  trip.bookings = (trip.bookings||[]).filter(x=>x.id!==id);

  for(const day of trip.days){
    for(const s of day.stops){
      if(s.bookingId === id) s.bookingId = "";
    }
  }

  saveTrip(trip);
  bookingDlg.close();
  render("bookings"); render("itinerary"); render("today"); render("map");
}

/* topbar */
$("#btnExport").onclick = ()=>{
  const blob = new Blob([JSON.stringify(trip,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="trip.json"; a.click();
  URL.revokeObjectURL(url);
};
$("#btnImport").onclick = ()=>{
  const input = document.createElement("input");
  input.type="file"; input.accept="application/json";
  input.onchange = async ()=>{
    const f = input.files?.[0]; if(!f) return;
    const text = await f.text();
    try{
      const obj = JSON.parse(text);
      if(!obj.days) throw new Error("Invalid JSON");
      trip = obj; saveTrip(trip);
      render("today"); render("itinerary"); render("map"); render("bookings"); render("checklist");
      alert("匯入成功");
    }catch{
      alert("匯入失敗：檔案格式不正確");
    }
  };
  input.click();
};

$("#btnShare").onclick = async ()=>{
  try{
    await navigator.share({title:"Road Trip Planner", text:"我的 Road Trip 行程", url: location.href});
  }catch{
    try{
      await navigator.clipboard.writeText(location.href);
      alert("已複製連結");
    }catch{
      alert("無法分享/複製，請手動複製網址");
    }
  }
};

/* Register service worker */
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

/* initial */
setTab("today");
