const STORAGE_KEY = 'roadtrip_planner_v4';
const CACHE_VERSION = 'v4';
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function uid(){ return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function pad(n){ return String(n).padStart(2, '0'); }
function autoResizeTextarea(el){

  if(!el) return;

  const resize = () => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  el.addEventListener("input", resize);

  // run once when opened
  setTimeout(resize, 0);
}
function formatDate(date){
  const d = new Date(date + 'T00:00:00');
  if(Number.isNaN(d.getTime())) return date;
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function todayISO(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addMinutes(hhmm, mins){
  const [h,m] = (hhmm || '09:00').split(':').map(Number);
  const total = h*60 + m + Math.round(mins || 0);
  const clipped = Math.max(0, total);
  return `${pad(Math.floor(clipped/60)%24)}:${pad(clipped%60)}`;
}
function toMinutes(hhmm){ if(!hhmm) return 0; const [h,m] = hhmm.split(':').map(Number); return (h||0) * 60 + (m||0); }
function minutesToHuman(mins){
  mins = Math.round(mins || 0);
  const h = Math.floor(mins/60), m = mins%60;
  if(h && m) return `${h}h ${m}m`;
  if(h) return `${h}h`;
  return `${m}m`;
}
function km(n){ return `${(n||0).toFixed(1)} km`; }
function enc(s){ return encodeURIComponent((s||'').trim()); }
function escapeHtml(str){ return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }
function mapsSearchUrl(q){ return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`; }
function mapsDirUrl(origin, dest){ return `https://www.google.com/maps/dir/?api=1&origin=${enc(origin)}&destination=${enc(dest)}&travelmode=driving`; }
function haversineKm(a,b){
  if(!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return Infinity;
  const R = 6371;
  const dLat = (b.lat-a.lat)*Math.PI/180;
  const dLng = (b.lng-a.lng)*Math.PI/180;
  const s1 = Math.sin(dLat/2), s2 = Math.sin(dLng/2);
  const x = s1*s1 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*s2*s2;
  return 2*R*Math.asin(Math.sqrt(x));
}

function defaultTrip(){
  const dates = [0,1,2].map(offset => {
    const d = new Date(); d.setDate(d.getDate()+offset);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  });
  return {
    version: 4,
    title: 'Road Trip Planner',
    baseStartTime: '09:00',
    checklist: [
      {id:uid(), text:'帶護照 / 證件', done:false},
      {id:uid(), text:'充電線 / 行動電源', done:false},
      {id:uid(), text:'雨具 / 防曬', done:false}
    ],
    bookings: [],
    settings: {
      mapCenter: [-37.8136, 144.9631],
      mapZoom: 6,
      routeDayId: 'all',
      locale: 'zh-Hant',
      autoSave: true
    },
    days: [
      { id: uid(), date: dates[0], label: 'Day 1', base: 'Sydney', stops: [
        { id: uid(), time:'09:00', nameZh:'Sydney Opera House', nameEn:'Sydney Opera House', query:'Sydney Opera House', lat:-33.8568, lng:151.2153, durationMins:60, tags:['Scenic'], notes:'地標打卡', ticket:'no', bookingId:'' },
        { id: uid(), time:'10:30', nameZh:'Bondi Beach', nameEn:'Bondi Beach', query:'Bondi Beach', lat:-33.8915, lng:151.2767, durationMins:90, tags:['Scenic'], notes:'海邊散步', ticket:'no', bookingId:'' }
      ]},
      { id: uid(), date: dates[1], label: 'Day 2', base: 'Melbourne', stops: [
        { id: uid(), time:'09:00', nameZh:'Puffing Billy Railway', nameEn:'Puffing Billy Railway', query:'Puffing Billy Railway Belgrave Station', lat:-37.9082, lng:145.3536, durationMins:120, tags:['Ticket'], notes:'最好預訂', ticket:'yes', bookingId:'' },
        { id: uid(), time:'12:00', nameZh:'Phillip Island', nameEn:'Phillip Island', query:'Phillip Island', lat:-38.4835, lng:145.2310, durationMins:180, tags:['Wildlife'], notes:'注意回程時間', ticket:'yes', bookingId:'' }
      ]},
      { id: uid(), date: dates[2], label: 'Day 3', base: 'Great Ocean Road', stops: [] }
    ]
  };
}

function normalizeTrip(raw){
  const trip = raw && typeof raw === 'object' ? raw : defaultTrip();
  trip.version = 4;
  trip.title ||= 'Road Trip Planner';
  trip.baseStartTime ||= '09:00';
  trip.bookings ||= [];
  trip.checklist ||= [];
  trip.settings ||= { mapCenter:[-37.8136, 144.9631], mapZoom:6, routeDayId:'all', locale:'zh-Hant', autoSave:true };
  trip.days ||= [];
  for(const day of trip.days){
    day.id ||= uid();
    day.label ||= 'Day';
    day.date ||= todayISO();
    day.base ||= '';
    day.stops ||= [];
    for(const stop of day.stops){
      stop.id ||= uid();
      stop.time ||= '';
      stop.nameZh ||= '';
      stop.nameEn ||= '';
      stop.query ||= stop.nameZh || stop.nameEn || '';
      stop.durationMins = Number(stop.durationMins ?? stop.duration ?? 60) || 0;
      stop.tags ||= [];
      stop.notes ||= '';
      stop.ticket ||= 'no';
      stop.bookingId ||= '';
      if(stop.lat !== '' && stop.lat != null) stop.lat = Number(stop.lat);
      if(stop.lng !== '' && stop.lng != null) stop.lng = Number(stop.lng);
    }
  }
  return trip;
}

function loadTrip(){
  try{ return normalizeTrip(JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultTrip()); }
  catch{ return defaultTrip(); }
}
let trip = loadTrip();
let currentTab = 'today';
let map, mapMarkers = [], routeLayer = null;
let routeCache = {};
let dragState = null;

function saveTrip(){
  if(!trip.settings.autoSave) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  const el = $('#autosaveState');
  if(el){ el.textContent = `Autosave 已更新 ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`; el.className = 'autosave-ok'; }
}
function forceSave(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(trip)); }
function sortDays(){ trip.days.sort((a,b)=> String(a.date).localeCompare(String(b.date))); }
function getDay(dayId){ return trip.days.find(d=>d.id===dayId); }
function getStop(stopId){
  for(const day of trip.days){
    const index = day.stops.findIndex(s=>s.id===stopId);
    if(index >= 0) return { day, stop: day.stops[index], index };
  }
  return { day:null, stop:null, index:-1 };
}
function getBooking(id){ return trip.bookings.find(b=>b.id===id); }
function allStops(){ return trip.days.flatMap(day => day.stops.map(stop => ({day, stop}))); }
function dayStats(day){
  const coords = day.stops.filter(s=> Number.isFinite(s.lat) && Number.isFinite(s.lng));
  let dist = 0;
  for(let i=1;i<coords.length;i++) dist += haversineKm(coords[i-1], coords[i]);
  const stay = day.stops.reduce((sum,s)=> sum + (Number(s.durationMins)||0), 0);
  return { count: day.stops.length, dist, stay };
}
function getWarnings(){
  const warnings = [];
  for(const day of trip.days){
    const seenTimes = new Set();
    for(const [i, stop] of day.stops.entries()){
      if(!(stop.nameZh || stop.nameEn)) warnings.push(`${day.label} 第 ${i+1} 站未填名稱`);
      if(!stop.query && !(Number.isFinite(stop.lat) && Number.isFinite(stop.lng))) warnings.push(`${stop.nameZh || stop.nameEn || '某站'} 未填查詢或座標`);
      if(stop.time){
        const key = `${day.id}-${stop.time}`;
        if(seenTimes.has(key)) warnings.push(`${day.label} 有重覆時間 ${stop.time}`);
        seenTimes.add(key);
      }
      if(stop.ticket === 'yes' && stop.bookingId && !getBooking(stop.bookingId)) warnings.push(`${stop.nameZh || stop.nameEn || '某站'} 關聯 booking 已不存在`);
      if((Number(stop.durationMins)||0) < 0) warnings.push(`${stop.nameZh || stop.nameEn || '某站'} Duration 不可小於 0`);
    }
  }
  return warnings;
}

function renderWarningBar(){
  const warnings = getWarnings();
  const host = $('#warningBar');
  if(!warnings.length){ host.innerHTML = ''; return; }
  host.innerHTML = `<div class="warningbox"><div class="card__title">Warnings</div><ul class="warninglist">${warnings.slice(0,10).map(w=>`<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`;
}

function setTab(tab){
  currentTab = tab;
  $$('.bottomnav__item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  ['today','itinerary','map','bookings','checklist','settings'].forEach(name => $(`#view-${name}`).classList.toggle('hidden', name !== tab));
  renderWarningBar();
  render(tab);
}
$$('.bottomnav__item').forEach(btn => btn.addEventListener('click', ()=>setTab(btn.dataset.tab)));
function stopTagsHtml(stop){
  return (stop.tags||[]).map(t => `<span class="tag ${t==='Ticket' ? 'tag--ticket' : ''}">${escapeHtml(t)}</span>`).join('');
}
function stopCard(day, stop){
  const routeHint = Number.isFinite(stop.routeDriveMins) ? `<span class="small">Drive from prev: ${minutesToHuman(stop.routeDriveMins)}</span>` : '';
  return `
    <div class="stop" draggable="true" data-stop="${escapeHtml(stop.id)}" data-day="${escapeHtml(day.id)}">
      <div class="stop__head">
        <div class="stop__left">
          <div class="handle">≡</div>
          <div class="time">${escapeHtml(stop.time || '--:--')}</div>
          <div class="stop__title">
            <div class="stop__zh">${escapeHtml(stop.nameZh || stop.nameEn || '(untitled)')}</div>
            ${stop.nameEn && stop.nameEn !== stop.nameZh ? `<div class="stop__en">${escapeHtml(stop.nameEn)}</div>` : ''}
            <div class="tags">${stopTagsHtml(stop)}</div>
            ${stop.notes ? `<div class="note">${escapeHtml(stop.notes)}</div>` : ''}
            ${Number.isFinite(stop.lat) && Number.isFinite(stop.lng) ? `<div class="note">📍 ${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}</div>` : `<div class="note">⚠️ 未有座標</div>`}
            ${routeHint}
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn--ghost" data-nav-stop="${escapeHtml(stop.id)}">地圖</button>
        <button class="btn btn--ghost" data-nav-prev="${escapeHtml(stop.id)}">上一站→本站</button>
        <button class="btn btn--ghost" data-nav-next="${escapeHtml(stop.id)}">本站→下一站</button>
        <button class="btn" data-geocode-stop="${escapeHtml(stop.id)}">Geocode</button>
        <button class="btn btn--primary" data-edit-stop="${escapeHtml(stop.id)}">編輯</button>
      </div>
    </div>`;
}

function buildTimeline(day){
  if(!day.stops.length) return `<div class="empty">未有 stop。你可以新增 stop，或者匯入 JSON。</div>`;
  return `<div class="timeline">${day.stops.map((stop, i) => {
    const drive = i === 0 ? '' : (Number.isFinite(stop.routeDriveMins) ? ` · 車程 ${minutesToHuman(stop.routeDriveMins)}` : '');
    const end = stop.time ? addMinutes(stop.time, stop.durationMins || 0) : '';
    return `<div class="timeline__item"><div class="timeline__time">${escapeHtml(stop.time || '--:--')}${end ? ` → ${escapeHtml(end)}` : ''}</div><div class="timeline__title">${escapeHtml(stop.nameZh || stop.nameEn || '(untitled)')}</div><div class="timeline__meta">停留 ${minutesToHuman(stop.durationMins || 0)}${drive}</div></div>`;
  }).join('')}</div>`;
}

function renderToday(){
  sortDays();
  const day = trip.days.find(d => d.date === todayISO()) || trip.days[0];
  const stats = dayStats(day);
  $('#view-today').innerHTML = `
    <div class="panel">
      <div class="day__head">
        <div>
          <h2 class="day__title">今日行程 · ${escapeHtml(day.label)}</h2>
          <div class="day__meta">${escapeHtml(day.date)} · ${escapeHtml(day.base || '')}</div>
        </div>
        <div class="row">
          <span class="metric"><strong>${day.stops.length}</strong> stops</span>
          <span class="metric"><strong>${km(stats.dist)}</strong> est. route</span>
          <span class="metric"><strong>${minutesToHuman(stats.stay)}</strong> stay</span>
          <button class="btn btn--primary" id="btnAddStopToday">新增 Stop</button>
        </div>
      </div>
      ${buildTimeline(day)}
    </div>
    <div class="panel">
      <div class="panel__title">Stops</div>
      <div class="stops" data-stops="${escapeHtml(day.id)}">${day.stops.map(stop => stopCard(day, stop)).join('') || '<div class="empty">未有 stop。</div>'}</div>
    </div>`;
  $('#btnAddStopToday').onclick = ()=>openStopDialog({dayId: day.id});
  attachStopActions();
  enableDnD();
}

function renderItinerary(){
  sortDays();
  $('#view-itinerary').innerHTML = `
    <div class="panel">
      <div class="row">
        <div>
          <div class="panel__title">行程總覽</div>
          <div class="muted">日子分組、可拖拉排序、多站路線、自動排時間</div>
        </div>
        <div class="spacer"></div>
        <button class="btn" id="btnAddDay">新增 Day</button>
        <button class="btn btn--primary" id="btnAutoAll">全部 Day 自動排程</button>
      </div>
    </div>
    ${trip.days.map(day => {
      const stats = dayStats(day);
      return `<div class="day">
        <div class="day__head">
          <div>
            <h3 class="day__title">${escapeHtml(day.label)} · ${escapeHtml(day.date)}</h3>
            <div class="day__meta">Base: ${escapeHtml(day.base || '—')} · ${stats.count} stops · ${km(stats.dist)} est.</div>
          </div>
          <div class="row">
            <button class="btn btn--ghost" data-auto-day="${escapeHtml(day.id)}">自動排程</button>
            <button class="btn btn--ghost" data-focus-map-day="${escapeHtml(day.id)}">查看地圖</button>
            <button class="btn btn--primary" data-add-stop-day="${escapeHtml(day.id)}">新增 Stop</button>
          </div>
        </div>
        ${buildTimeline(day)}
        <div class="stops" data-stops="${escapeHtml(day.id)}">${day.stops.map(stop => stopCard(day, stop)).join('') || '<div class="empty">未有 stop。</div>'}</div>
      </div>`;
    }).join('')}`;
  $('#btnAddDay').onclick = addDay;
  $('#btnAutoAll').onclick = async ()=>{
    for(const day of trip.days) await autoScheduleDay(day.id, false);
    saveTrip(); render(currentTab);
  };
  $$('[data-add-stop-day]').forEach(btn => btn.onclick = ()=>openStopDialog({dayId: btn.dataset.addStopDay}));
  $$('[data-auto-day]').forEach(btn => btn.onclick = ()=>autoScheduleDay(btn.dataset.autoDay, true));
  $$('[data-focus-map-day]').forEach(btn => btn.onclick = ()=>{ trip.settings.routeDayId = btn.dataset.focusMapDay; saveTrip(); setTab('map'); });
  attachStopActions();
  enableDnD();
}

function renderMap(){
  const options = [{id:'all', label:'全部日子'}].concat(trip.days.map(d => ({id:d.id, label:`${d.label} · ${d.date}`})));
  const selectedId = trip.settings.routeDayId || 'all';
  const routeStops = selectedId === 'all'
    ? trip.days.flatMap(day => day.stops.map(stop => ({day, stop})))
    : (getDay(selectedId)?.stops || []).map(stop => ({day:getDay(selectedId), stop}));
  const coordsCount = routeStops.filter(x => Number.isFinite(x.stop.lat) && Number.isFinite(x.stop.lng)).length;
  $('#view-map').innerHTML = `
    <div class="panel">
      <div class="row">
        <div>
          <div class="panel__title">地圖與路線</div>
          <div class="muted">OSM 地圖 · Nominatim geocode · OSRM drive time</div>
        </div>
        <div class="spacer"></div>
        <label class="field">
          <span class="field__label">查看範圍</span>
          <select id="routeDaySelect">${options.map(o => `<option value="${escapeHtml(o.id)}" ${o.id===selectedId ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</select>
        </label>
        <button class="btn" id="btnRefreshRoute">刷新路線</button>
      </div>
    </div>
    <div class="mapgrid">
      <div class="panel"><div id="map"></div></div>
      <div class="routepanel">
        <div class="panel">
          <div class="panel__title">Search / Geocode</div>
          <div class="row">
            <input id="geocodeQuery" class="searchbox" placeholder="輸入景點或地址，例如 Great Ocean Road" style="flex:1;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;">
            <button class="btn btn--primary" id="btnGeocodeSearch">搜尋</button>
          </div>
          <div id="searchResult" class="note"></div>
        </div>
        <div class="panel">
          <div class="panel__title">Route Summary</div>
          <div class="row">
            <span class="metric"><strong>${routeStops.length}</strong> stops</span>
            <span class="metric"><strong>${coordsCount}</strong> with coords</span>
          </div>
          <div id="routeSummary" class="note">載入中…</div>
          <div class="row" style="margin-top:10px">
            <button class="btn" id="btnAutoScheduleMap">自動排程</button>
            <button class="btn" id="btnGeocodeMissing">補齊缺失座標</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel__title">Stops</div>
          <div class="route-list">${routeStops.map(({day, stop}, idx) => `<div class="route-stop" data-route-stop="${escapeHtml(stop.id)}"><strong>${idx+1}. ${escapeHtml(stop.nameZh || stop.nameEn || '(untitled)')}</strong><div class="small">${escapeHtml(day.label)} · ${escapeHtml(stop.time || '--:--')} ${Number.isFinite(stop.lat) && Number.isFinite(stop.lng) ? '· 有座標' : '· 未 geocode'}</div></div>`).join('') || '<div class="empty">未有 stop。</div>'}</div>
        </div>
      </div>
    </div>`;

  $('#routeDaySelect').onchange = ()=>{ trip.settings.routeDayId = $('#routeDaySelect').value; saveTrip(); renderMap(); };
  $('#btnRefreshRoute').onclick = ()=>drawMapRoute();
  $('#btnGeocodeSearch').onclick = geocodeSearch;
  $('#btnAutoScheduleMap').onclick = ()=> selectedId === 'all' ? autoScheduleAllFromMap() : autoScheduleDay(selectedId, true);
  $('#btnGeocodeMissing').onclick = geocodeMissingForSelection;
  $$('.route-stop').forEach(el => el.onclick = ()=>focusStopOnMap(el.dataset.routeStop));
  initMap(routeStops);
  drawMapRoute();
}
function renderBookings(){
  $('#view-bookings').innerHTML = `
    <div class="panel">
      <div class="row">
        <div>
          <div class="panel__title">Bookings</div>
          <div class="muted">活動、酒店、car rental、flight、other</div>
        </div>
        <div class="spacer"></div>
        <button class="btn btn--primary" id="btnAddBooking">新增 Booking</button>
      </div>
    </div>
    <div class="panel">${trip.bookings.length ? trip.bookings.map(booking => `
      <div class="booking">
        <div class="booking__head">
          <div>
            <strong>${escapeHtml(booking.provider || '(untitled)')}</strong>
            <div class="small">${escapeHtml(booking.type || 'other')} · ${escapeHtml(booking.datetime || '')}</div>
          </div>
          <button class="btn btn--primary" data-edit-booking="${escapeHtml(booking.id)}">編輯</button>
        </div>
        <div class="note">Confirmation: ${escapeHtml(booking.conf || '—')} · ${escapeHtml(booking.currency || '')} ${escapeHtml(booking.price || '')}</div>
        ${booking.notes ? `<div class="note">${escapeHtml(booking.notes).replace(/\n/g, '<br>')}</div>` : ''}
      </div>`).join('') : '<div class="empty">未有 booking。</div>'}</div>`;
  $('#btnAddBooking').onclick = ()=>openBookingDialog();
  $$('[data-edit-booking]').forEach(btn => btn.onclick = ()=>openBookingDialog(btn.dataset.editBooking));
}

function renderChecklist(){
  $('#view-checklist').innerHTML = `
    <div class="panel">
      <div class="row">
        <div>
          <div class="panel__title">Checklist</div>
          <div class="muted">離線可用；本機自動保存</div>
        </div>
        <div class="spacer"></div>
        <button class="btn" id="btnAddChecklist">新增項目</button>
      </div>
    </div>
    <div class="panel"><ul class="checklist">${trip.checklist.map(item => `<li><label><input type="checkbox" data-check-id="${escapeHtml(item.id)}" ${item.done ? 'checked':''}> ${escapeHtml(item.text)}</label></li>`).join('') || '<div class="empty">未有 checklist 項目。</div>'}</ul></div>`;
  $('#btnAddChecklist').onclick = ()=>{
    const text = prompt('新增 checklist 項目');
    if(!text) return;
    trip.checklist.push({id:uid(), text, done:false}); saveTrip(); renderChecklist();
  };
  $$('[data-check-id]').forEach(input => input.onchange = ()=>{
    const item = trip.checklist.find(x => x.id === input.dataset.checkId);
    if(item){ item.done = input.checked; saveTrip(); }
  });
}

function renderSettings(){
  $('#view-settings').innerHTML = `
    <div class="panel">
      <div class="panel__title">Settings</div>
      <div class="formgrid">
        <label class="field"><span class="field__label">Trip title</span><input id="s_title" value="${escapeHtml(trip.title)}"></label>
        <label class="field"><span class="field__label">Default day start time</span><input id="s_start" type="time" value="${escapeHtml(trip.baseStartTime || '09:00')}"></label>
        <label class="field"><span class="field__label">Autosave</span><select id="s_autosave"><option value="yes" ${trip.settings.autoSave ? 'selected':''}>Yes</option><option value="no" ${!trip.settings.autoSave ? 'selected':''}>No</option></select></label>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn--primary" id="btnSaveSettings">保存設定</button>
        <button class="btn" id="btnResetDemo">重設為示範資料</button>
        <button class="btn btn--danger" id="btnClearStorage">清除本機資料</button>
        <span id="autosaveState" class="small">Autosave 已啟用</span>
      </div>
    </div>
    <div class="panel">
      <div class="panel__title">GitHub Pages upload</div>
      <div class="muted">直接把 zip 內檔案上傳到 repo root 即可，無需 build。Service worker 會快取 <span class="code">index.html</span>、<span class="code">app.js</span>、<span class="code">styles.css</span>、manifest。</div>
    </div>`;
  $('#btnSaveSettings').onclick = ()=>{
    trip.title = $('#s_title').value.trim() || 'Road Trip Planner';
    trip.baseStartTime = $('#s_start').value || '09:00';
    trip.settings.autoSave = $('#s_autosave').value === 'yes';
    saveTrip(); renderSettings(); renderWarningBar();
  };
  $('#btnResetDemo').onclick = ()=>{ if(confirm('重設為示範資料？')){ trip = defaultTrip(); forceSave(); setTab('today'); } };
  $('#btnClearStorage').onclick = ()=>{ if(confirm('清除所有本機資料？')){ localStorage.removeItem(STORAGE_KEY); trip = defaultTrip(); forceSave(); setTab('today'); } };
}

function render(tab){
  if(tab === 'today') renderToday();
  if(tab === 'itinerary') renderItinerary();
  if(tab === 'map') renderMap();
  if(tab === 'bookings') renderBookings();
  if(tab === 'checklist') renderChecklist();
  if(tab === 'settings') renderSettings();
}

function attachStopActions(){
  $$('[data-edit-stop]').forEach(btn => btn.onclick = ()=>openStopDialog({ stopId: btn.dataset.editStop }));
  $$('[data-geocode-stop]').forEach(btn => btn.onclick = ()=>geocodeStopById(btn.dataset.geocodeStop, true));
  $$('[data-nav-stop]').forEach(btn => btn.onclick = ()=>{
    const {stop} = getStop(btn.dataset.navStop); if(!stop) return;
    window.open(mapsSearchUrl(stop.query || stop.nameZh || stop.nameEn), '_blank');
  });
  $$('[data-nav-prev]').forEach(btn => btn.onclick = ()=>{
    const {day,index,stop} = getStop(btn.dataset.navPrev); if(!stop || index <= 0) return;
    const prev = day.stops[index-1];
    window.open(mapsDirUrl(prev.query || prev.nameZh || prev.nameEn, stop.query || stop.nameZh || stop.nameEn), '_blank');
  });
  $$('[data-nav-next]').forEach(btn => btn.onclick = ()=>{
    const {day,index,stop} = getStop(btn.dataset.navNext); if(!stop || index >= day.stops.length - 1) return;
    const next = day.stops[index+1];
    window.open(mapsDirUrl(stop.query || stop.nameZh || stop.nameEn, next.query || next.nameZh || next.nameEn), '_blank');
  });
}

function enableDnD(){
  $$('[data-stop]').forEach(el => {
    el.ondragstart = e => {
      dragState = { stopId: el.dataset.stop, fromDayId: el.dataset.day };
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', el.dataset.stop);
    };
    el.ondragend = ()=> el.classList.remove('dragging');
  });
  $$('[data-stops]').forEach(container => {
    container.ondragover = e => e.preventDefault();
    container.ondrop = e => {
      e.preventDefault();
      if(!dragState) return;
      const targetDayId = container.dataset.stops;
      const fromDay = getDay(dragState.fromDayId);
      const toDay = getDay(targetDayId);
      if(!fromDay || !toDay) return;
      const movingIndex = fromDay.stops.findIndex(s => s.id === dragState.stopId);
      if(movingIndex < 0) return;
      const [moving] = fromDay.stops.splice(movingIndex,1);
      const stopEl = e.target.closest('[data-stop]');
      let insertIndex = toDay.stops.length;
      if(stopEl){
        const idx = toDay.stops.findIndex(s => s.id === stopEl.dataset.stop);
        insertIndex = idx >= 0 ? idx : toDay.stops.length;
      }
      toDay.stops.splice(insertIndex,0,moving);
      moving.time ||= trip.baseStartTime || '09:00';
      dragState = null;
      saveTrip(); render(currentTab);
    };
  });
}

function addDay(){
  const date = prompt('新 Day 日期（YYYY-MM-DD）', todayISO());
  if(!date) return;
  trip.days.push({ id:uid(), date:formatDate(date), label:`Day ${trip.days.length+1}`, base:'', stops:[] });
  sortDays(); saveTrip(); renderItinerary();
}

function fillDaySelect(selectedId){
  const select = $('#f_day');
  select.innerHTML = trip.days.map(day => `<option value="${escapeHtml(day.id)}" ${day.id===selectedId?'selected':''}>${escapeHtml(day.label)} · ${escapeHtml(day.date)}</option>`).join('');
}
function fillBookingSelect(selectedId){
  $('#f_booking').innerHTML = `<option value="">—</option>` + trip.bookings.map(b => `<option value="${escapeHtml(b.id)}" ${b.id===selectedId?'selected':''}>${escapeHtml(b.provider || b.type || 'booking')}</option>`).join('');
}
function openStopDialog({dayId, stopId} = {}){
  const dialog = $('#stopDialog');
  let currentStop = null, currentDay = null;
  if(stopId){ ({stop:currentStop, day:currentDay} = getStop(stopId)); }
  currentDay ||= getDay(dayId) || trip.days[0];
  fillDaySelect(currentDay.id);
  fillBookingSelect(currentStop?.bookingId || '');
  $('#stopDialogTitle').textContent = currentStop ? '編輯 Stop' : '新增 Stop';
  $('#f_stopId').value = currentStop?.id || '';
  $('#f_time').value = currentStop?.time || trip.baseStartTime || '09:00';
  $('#f_nameZh').value = currentStop?.nameZh || '';
  $('#f_nameEn').value = currentStop?.nameEn || '';
  $('#f_query').value = currentStop?.query || '';
  $('#f_lat').value = Number.isFinite(currentStop?.lat) ? currentStop.lat : '';
  $('#f_lng').value = Number.isFinite(currentStop?.lng) ? currentStop.lng : '';
  $('#f_duration').value = currentStop?.durationMins ?? 60;
  $('#f_notes').value = currentStop?.notes || '';
  $('#f_ticket').value = currentStop?.ticket || 'no';
  Array.from($('#f_tags').options).forEach(o => o.selected = (currentStop?.tags || []).includes(o.value));
  $('#btnDeleteStop').style.display = currentStop ? '' : 'none';
  $('#btnSaveStop').onclick = saveStopFromDialog;
  $('#btnDeleteStop').onclick = deleteStopFromDialog;
  $('#btnGeocodeStop').onclick = geocodeDialogFields;
  dialog.showModal();
}
function collectStopDialog(){
  return {
    id: $('#f_stopId').value || uid(),
    time: $('#f_time').value || trip.baseStartTime || '09:00',
    nameZh: $('#f_nameZh').value.trim(),
    nameEn: $('#f_nameEn').value.trim(),
    query: $('#f_query').value.trim(),
    lat: $('#f_lat').value === '' ? null : Number($('#f_lat').value),
    lng: $('#f_lng').value === '' ? null : Number($('#f_lng').value),
    durationMins: Number($('#f_duration').value || 0),
    tags: Array.from($('#f_tags').selectedOptions).map(o => o.value),
    notes: $('#f_notes').value.trim(),
    ticket: $('#f_ticket').value,
    bookingId: $('#f_booking').value
  };
}
function saveStopFromDialog(){
  const day = getDay($('#f_day').value);
  if(!day) return;
  const stop = collectStopDialog();
  const existing = getStop(stop.id);
  if(existing.stop){ existing.day.stops = existing.day.stops.filter(s => s.id !== stop.id); }
  day.stops.push(stop);
  day.stops.sort((a,b)=> toMinutes(a.time) - toMinutes(b.time));
  saveTrip(); $('#stopDialog').close(); render(currentTab);
}
function deleteStopFromDialog(){
  const stopId = $('#f_stopId').value; if(!stopId) return;
  const {day} = getStop(stopId); if(!day) return;
  day.stops = day.stops.filter(s => s.id !== stopId);
  saveTrip(); $('#stopDialog').close(); render(currentTab);
}

function openBookingDialog(id){
  const dialog = $('#bookingDialog');
  const booking = id ? getBooking(id) : null;
  $('#bookingDialogTitle').textContent = booking ? '編輯 Booking' : '新增 Booking';
  $('#b_id').value = booking?.id || '';
  $('#b_type').value = booking?.type || 'activity';
  $('#b_provider').value = booking?.provider || '';
  $('#b_datetime').value = booking?.datetime || '';
  $('#b_conf').value = booking?.conf || '';
  $('#b_price').value = booking?.price || '';
  $('#b_currency').value = booking?.currency || 'AUD';
  $('#b_notes').value = booking?.notes || '';
  autoResizeTextarea($('#b_notes'));
  $('#btnDeleteBooking').style.display = booking ? '' : 'none';
  $('#btnSaveBooking').onclick = saveBookingFromDialog;
  $('#btnDeleteBooking').onclick = deleteBookingFromDialog;
  dialog.showModal();
}
function saveBookingFromDialog(){
  const booking = {
    id: $('#b_id').value || uid(),
    type: $('#b_type').value,
    provider: $('#b_provider').value.trim(),
    datetime: $('#b_datetime').value.trim(),
    conf: $('#b_conf').value.trim(),
    price: $('#b_price').value.trim(),
    currency: $('#b_currency').value.trim(),
    notes: $('#b_notes').value.trim()
  };
  const idx = trip.bookings.findIndex(b => b.id === booking.id);
  if(idx >= 0) trip.bookings[idx] = booking; else trip.bookings.push(booking);
  saveTrip(); $('#bookingDialog').close(); renderBookings(); renderWarningBar();
}
function deleteBookingFromDialog(){
  const id = $('#b_id').value; if(!id) return;
  trip.bookings = trip.bookings.filter(b => b.id !== id);
  trip.days.forEach(day => day.stops.forEach(stop => { if(stop.bookingId === id) stop.bookingId = ''; }));
  saveTrip(); $('#bookingDialog').close(); renderBookings(); renderWarningBar();
}

async function nominatimSearch(query){
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${enc(query)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if(!res.ok) throw new Error('Geocode failed');
  return res.json();
}
async function geocodeSearch(){
  const q = $('#geocodeQuery').value.trim();
  if(!q) return;
  $('#searchResult').textContent = '搜尋中…';
  try{
    const list = await nominatimSearch(q);
    if(!list.length){ $('#searchResult').textContent = '找不到結果'; return; }
    const first = list[0];
    $('#searchResult').innerHTML = `找到：<strong>${escapeHtml(first.display_name)}</strong><br>Lat ${Number(first.lat).toFixed(5)}, Lng ${Number(first.lon).toFixed(5)}`;
    if(map){ map.setView([Number(first.lat), Number(first.lon)], 11); L.marker([Number(first.lat), Number(first.lon)]).addTo(map).bindPopup(escapeHtml(first.display_name)).openPopup(); }
  }catch(err){ $('#searchResult').textContent = '搜尋失敗'; }
}
async function geocodeDialogFields(){
  const q = $('#f_query').value.trim() || $('#f_nameZh').value.trim() || $('#f_nameEn').value.trim();
  if(!q) return alert('請先填名稱或地址');
  try{
    const list = await nominatimSearch(q);
    if(!list.length) return alert('找不到結果');
    $('#f_lat').value = Number(list[0].lat).toFixed(6);
    $('#f_lng').value = Number(list[0].lon).toFixed(6);
  }catch(err){ alert('Geocode 失敗'); }
}
async function geocodeStopById(stopId, rerender){
  const {stop} = getStop(stopId); if(!stop) return;
  const q = stop.query || stop.nameZh || stop.nameEn; if(!q) return;
  try{
    const list = await nominatimSearch(q);
    if(list.length){ stop.lat = Number(list[0].lat); stop.lng = Number(list[0].lon); saveTrip(); if(rerender) render(currentTab); }
  }catch{}
}
async function geocodeMissingForSelection(){
  const selectedId = trip.settings.routeDayId || 'all';
  const pairs = selectedId === 'all' ? allStops() : (getDay(selectedId)?.stops || []).map(stop => ({day:getDay(selectedId), stop}));
  for(const {stop} of pairs){
    if(!(Number.isFinite(stop.lat) && Number.isFinite(stop.lng))) await geocodeStopById(stop.id, false);
  }
  saveTrip(); renderMap();
}

function getRoutePairsForSelection(){
  const selectedId = trip.settings.routeDayId || 'all';
  const groups = selectedId === 'all' ? trip.days : [getDay(selectedId)].filter(Boolean);
  return groups.flatMap(day => day.stops.map(stop => ({day, stop})));
}
function initMap(routeStops){
  const center = trip.settings.mapCenter || [-37.8136,144.9631];
  if(map){ map.remove(); map = null; }
  map = L.map('map');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  map.setView(center, trip.settings.mapZoom || 6);
  map.on('moveend', ()=>{
    const c = map.getCenter(); trip.settings.mapCenter = [c.lat, c.lng]; trip.settings.mapZoom = map.getZoom(); saveTrip();
  });
  mapMarkers.forEach(m => m.remove()); mapMarkers = [];
  const bounds = [];
  routeStops.forEach(({day, stop}) => {
    if(Number.isFinite(stop.lat) && Number.isFinite(stop.lng)){
      const marker = L.marker([stop.lat, stop.lng]).addTo(map).bindPopup(`<strong>${escapeHtml(stop.nameZh || stop.nameEn || '(untitled)')}</strong><br>${escapeHtml(day.label)} · ${escapeHtml(stop.time || '--:--')}`);
      mapMarkers.push(marker); bounds.push([stop.lat, stop.lng]);
    }
  });
  if(bounds.length) map.fitBounds(bounds, {padding:[24,24]});
}
async function fetchOsrmRoute(coords){
  const key = coords.map(c => `${c[1].toFixed(5)},${c[0].toFixed(5)}`).join(';');
  if(routeCache[key]) return routeCache[key];
  const url = `https://router.project-osrm.org/route/v1/driving/${coords.map(c => `${c[1]},${c[0]}`).join(';')}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('route failed');
  const json = await res.json();
  routeCache[key] = json;
  return json;
}
async function drawMapRoute(){
  const routeStops = getRoutePairsForSelection().filter(x => Number.isFinite(x.stop.lat) && Number.isFinite(x.stop.lng));
  if(routeLayer){ routeLayer.remove(); routeLayer = null; }
  if(routeStops.length < 2){ $('#routeSummary').textContent = routeStops.length ? '只有 1 個有效座標，未能畫路線。' : '未有足夠座標。'; return; }
  try{
    const coords = routeStops.map(x => [x.stop.lat, x.stop.lng]);
    const json = await fetchOsrmRoute(coords);
    const route = json.routes?.[0];
    if(!route){ $('#routeSummary').textContent = '未能取得路線'; return; }
    routeLayer = L.geoJSON(route.geometry).addTo(map);
    map.fitBounds(routeLayer.getBounds(), {padding:[24,24]});
    const mins = route.duration / 60;
    const distKm = route.distance / 1000;
    $('#routeSummary').innerHTML = `總車程 <strong>${minutesToHuman(mins)}</strong> · 總距離 <strong>${km(distKm)}</strong>`;
    for(const day of trip.days) day.stops.forEach(stop => delete stop.routeDriveMins);
    for(let i=1;i<routeStops.length;i++){
      const a = routeStops[i-1].stop, b = routeStops[i].stop;
      try{
        const pair = await fetchOsrmRoute([[a.lat,a.lng],[b.lat,b.lng]]);
        b.routeDriveMins = (pair.routes?.[0]?.duration || 0) / 60;
      }catch{}
    }
    saveTrip();
  }catch(err){ $('#routeSummary').textContent = '路線計算失敗'; }
}
function focusStopOnMap(stopId){
  const {stop} = getStop(stopId); if(!stop || !map || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return;
  map.setView([stop.lat, stop.lng], 12);
}
async function autoScheduleAllFromMap(){
  for(const day of trip.days) await autoScheduleDay(day.id, false);
  saveTrip(); renderMap();
}
async function autoScheduleDay(dayId, rerender = true){
  const day = getDay(dayId); if(!day || day.stops.length < 2) return;
  const withCoords = day.stops.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  const withoutCoords = day.stops.filter(s => !(Number.isFinite(s.lat) && Number.isFinite(s.lng)));
  if(withCoords.length >= 2){
    const ordered = [withCoords[0]];
    const remaining = withCoords.slice(1);
    while(remaining.length){
      const last = ordered[ordered.length-1];
      let bestIndex = 0, bestDist = Infinity;
      remaining.forEach((candidate, idx) => {
        const dist = haversineKm(last, candidate);
        if(dist < bestDist){ bestDist = dist; bestIndex = idx; }
      });
      ordered.push(remaining.splice(bestIndex,1)[0]);
    }
    day.stops = ordered.concat(withoutCoords);
  }
  let currentTime = trip.baseStartTime || '09:00';
  if(day.stops[0]) day.stops[0].time = currentTime;
  for(let i=0;i<day.stops.length;i++){
    const stop = day.stops[i];
    if(i === 0){ stop.time = currentTime; continue; }
    const prev = day.stops[i-1];
    let drive = 25;
    if(Number.isFinite(prev.lat) && Number.isFinite(prev.lng) && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)){
      try{
        const pair = await fetchOsrmRoute([[prev.lat, prev.lng], [stop.lat, stop.lng]]);
        drive = Math.max(5, Math.round((pair.routes?.[0]?.duration || 0) / 60));
        stop.routeDriveMins = drive;
      }catch{
        drive = Math.max(10, Math.round(haversineKm(prev, stop) / 50 * 60));
      }
    }
    currentTime = addMinutes(prev.time, (prev.durationMins || 0) + drive);
    stop.time = currentTime;
  }
  saveTrip();
  if(rerender) render(currentTab);
}

function exportJson(){
  const blob = new Blob([JSON.stringify(trip, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'road-trip-planner.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importJsonFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      trip = normalizeTrip(JSON.parse(reader.result));
      forceSave(); setTab('today');
    }catch(err){ alert('JSON 匯入失敗'); }
  };
  reader.readAsText(file);
}
async function shareTrip(){
  const text = `Road Trip Planner\n${trip.days.map(day => `${day.label} ${day.date}\n` + day.stops.map(s => `- ${s.time || '--:--'} ${s.nameZh || s.nameEn || '(untitled)'}`).join('\n')).join('\n\n')}`;
  if(navigator.share){ try{ await navigator.share({title:trip.title, text}); }catch{} }
  else { await navigator.clipboard.writeText(text); alert('已複製文字行程到剪貼板'); }
}

function registerTopbarActions(){
  $('#btnExport').onclick = exportJson;
  $('#btnImport').onclick = ()=>$('#importFile').click();
  $('#importFile').onchange = (e)=>{ const file = e.target.files?.[0]; if(file) importJsonFile(file); e.target.value = ''; };
  $('#btnShare').onclick = shareTrip;
}

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

registerTopbarActions();
renderWarningBar();
setTab('today');
