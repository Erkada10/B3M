var PUBLISHED_PAGES = /* PUBLISHED_PAGES_START */ {} /* PUBLISHED_PAGES_END */;
var VPWD = "взб", APWD = "4goosE", SK = "hologram_drafts";
var user = null, curPage = 1, editing = false;

document.getElementById('loginBtn').onclick = login;
document.getElementById('pwd').addEventListener('keydown', function(e){if(e.key==='Enter')login();});
document.getElementById('newBtn').onclick = newPage;
document.getElementById('editBtn').onclick = toggleEdit;
document.getElementById('delBtn').onclick = deletePage;
document.getElementById('pubBtn').onclick = showPublished;
document.getElementById('copyBtn').onclick = copyCode;
document.getElementById('outBtn').onclick = logout;

function login(){
  var p = document.getElementById('pwd').value;
  var err = document.getElementById('lerr');
  if(p === APWD){ user = 'admin'; }
  else if(p === VPWD){ user = 'viewer'; }
  else { err.textContent = 'НЕВЕРНЫЙ ПАРОЛЬ'; document.getElementById('pwd').value=''; return; }
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='flex';
  if(user === 'admin') document.getElementById('apanel').style.display='flex';
  render();
}

function getDrafts(){ try{ return JSON.parse(localStorage.getItem(SK)||'{}'); }catch(e){ return {}; } }
function saveDrafts(d){ localStorage.setItem(SK, JSON.stringify(d)); }

function getAllPages(){
  var d = getDrafts(), pages = {};
  for(var k in PUBLISHED_PAGES) pages[k] = PUBLISHED_PAGES[k];
  if(user === 'admin'){
    for(var k2 in d){
      if(d[k2] === null) delete pages[k2];
      else pages[k2] = d[k2];
    }
  }
  return pages;
}

function getNums(){ return Object.keys(getAllPages()).map(Number).sort(function(a,b){return a-b;}); }
function isPub(n){ return PUBLISHED_PAGES.hasOwnProperty(String(n)); }
function isModified(n){
  var d = getDrafts(), k = String(n);
  if(!d.hasOwnProperty(k)) return false;
  if(d[k] === null) return true;
  if(!PUBLISHED_PAGES.hasOwnProperty(k)) return true;
  return d[k] !== PUBLISHED_PAGES[k];
}

function esc(t){ var d=document.createElement('div'); d.textContent=t; return d.innerHTML; }

function render(){ renderSbar(); renderTabs(); renderPage(); }

function renderSbar(){
  var pc = Object.keys(PUBLISHED_PAGES).length;
  var d = getDrafts(), mc = 0;
  for(var k in d){ if(d[k]===null || !PUBLISHED_PAGES.hasOwnProperty(k) || d[k]!==PUBLISHED_PAGES[k]) mc++; }
  var h = '<span>СТАТУС: '+(user==='admin'?'АДМИН':'ЗРИТЕЛЬ')+'</span>';
  h += '<span class="pub">ОПУБЛИКОВАНО: '+pc+'</span>';
  if(user==='admin') h += '<span class="dr">ЧЕРНОВИКОВ: '+mc+'</span>';
  h += '<span>СТРАНИЦА: '+curPage+'</span>';
  document.getElementById('sbar').innerHTML = h;
}

function renderTabs(){
  var nums = getNums(), h = '';
  if(nums.length === 0 && user !== 'admin'){
    document.getElementById('tabs').innerHTML = '<span style="color:var(--d);padding:8px;font-size:13px">НЕТ СТРАНИЦ</span>';
    return;
  }
  for(var i=0;i<nums.length;i++){
    var n = nums[i], act = n===curPage, badge = '';
    if(user==='admin'){
      if(isModified(n)) badge = '<span class="dot y" title="Не опубликовано"></span>';
      else if(isPub(n)) badge = '<span class="dot g" title="Опубликовано"></span>';
    }
    h += '<div class="tab'+(act?' active':'')+'" onclick="goToPage('+n+')">Стр.'+n+badge+'</div>';
  }
  document.getElementById('tabs').innerHTML = h;
}

function renderPage(){
  var disp = document.getElementById('pdisp'), pages = getAllPages(), nums = getNums();
  if(editing && user === 'admin'){
    var c = pages[String(curPage)] || '';
    disp.innerHTML = '<textarea class="earea" id="earea" placeholder="Введите текст страницы..."></textarea>'+
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn s" onclick="saveEdit()">СОХРАНИТЬ ЧЕРНОВИК</button>'+
      '<button class="btn" onclick="cancelEdit()">ОТМЕНА</button></div>';
    document.getElementById('earea').value = c;
    document.getElementById('earea').focus();
    return;
  }
  if(nums.length === 0){
    disp.innerHTML = '<div class="empty">/// СТРАНИЦЫ ОТСУТСТВУЮТ ///</div>'; return;
  }
  if(!pages.hasOwnProperty(String(curPage))) curPage = nums[0] || 1;
  var pc = pages[String(curPage)] || '', stat = '';
  if(user === 'admin'){
    if(isModified(curPage)) stat = '<div class="pstat" style="color:var(--y)">⚠ ЧЕРНОВИК — не виден зрителям</div>';
    else if(isPub(curPage)) stat = '<div class="pstat" style="color:var(--g)">✓ ОПУБЛИКОВАНО — виден зрителям</div>';
  }
  if(pc.trim() === '') disp.innerHTML = stat + '<div class="pcard empty">/// ПУСТАЯ СТРАНИЦА '+curPage+' ///</div>';
  else disp.innerHTML = stat + '<div class="pcard">'+esc(pc)+'</div>';
}

function goToPage(n){
  if(editing){ if(!confirm('Выйти из редактирования без сохранения?')) return; editing = false; }
  curPage = n; render();
}

function newPage(){
  if(editing){ if(!confirm('Выйти из редактирования без сохранения?')) return; editing = false; }
  var nums = getNums(), next = nums.length > 0 ? nums[nums.length-1]+1 : 1;
  var d = getDrafts(); d[String(next)] = ''; saveDrafts(d);
  curPage = next; editing = true; render();
}

function toggleEdit(){
  if(editing) return;
  var pages = getAllPages();
  if(!pages.hasOwnProperty(String(curPage))){
    var d = getDrafts(); d[String(curPage)] = ''; saveDrafts(d);
  }
  editing = true; render();
}

function saveEdit(){
  var t = document.getElementById('earea').value;
  var d = getDrafts(); d[String(curPage)] = t; saveDrafts(d);
  editing = false; render(); toast('Страница '+curPage+' сохранена в черновик');
}

function cancelEdit(){ editing = false; render(); }

function deletePage(){
  var pages = getAllPages();
  if(!pages.hasOwnProperty(String(curPage))){ toast('Страница не существует'); return; }
  var preview = (pages[String(curPage)] || '').substring(0, 200);
  if(preview.trim() === '') preview = '(пустая страница)';
  var pubStatus = isPub(curPage) ? 'Эта страница опубликована и видна зрителям.' : 'Эта страница существует только в черновике.';
  var h = '<div class="dlg">';
  h += '<h3>УДАЛИТЬ СТРАНИЦУ '+curPage+'?</h3>';
  h += '<div class="warn">⚠ '+pubStatus+'</div>';
  h += '<div class="prev">'+esc(preview)+'</div>';
  h += '<div class="warn">Действие необратимо. После удаления нужно нажать «СКОПИРОВАТЬ КОД» и обновить файл.</div>';
  h += '<div class="brow"><button class="btn d" onclick="confirmDelete()">ДА, УДАЛИТЬ</button><button class="btn" onclick="closeModal()">ОТМЕНА</button></div>';
  h += '</div>';
  showModal(h);
}

function confirmDelete(){
  var d = getDrafts();
  if(isPub(curPage)) d[String(curPage)] = null;
  else delete d[String(curPage)];
  saveDrafts(d);
  var nums = getNums();
  var deletedNum = curPage;
  if(nums.length === 0){
    curPage = 1;
  } else {
    var prev = null, next = null;
    for(var i=0;i<nums.length;i++){
      if(nums[i] < deletedNum) prev = nums[i];
      if(nums[i] > deletedNum && next === null) next = nums[i];
    }
    curPage = next !== null ? next : (prev !== null ? prev : nums[0]);
  }
  closeModal();
  render();
  if(nums.length === 0) toast('Страница '+deletedNum+' удалена. Страниц больше нет.');
  else toast('Страница '+deletedNum+' удалена. Открыта страница '+curPage);
}

function showPublished(){
  var pk = Object.keys(PUBLISHED_PAGES).map(Number).sort(function(a,b){return a-b;});
  var d = getDrafts(), mc = 0;
  for(var k in d){ if(d[k]===null||!PUBLISHED_PAGES.hasOwnProperty(k)||d[k]!==PUBLISHED_PAGES[k]) mc++; }
  var h = '<h2>ВИДНЫЕ ЗРИТЕЛЯМ</h2>';
  h += '<p>Страницы, которые видят зрители (сохранены в файле):</p>';
  if(pk.length === 0) h += '<p style="color:var(--d)">Нет опубликованных страниц</p>';
  else {
    h += '<div class="plist">';
    for(var i=0;i<pk.length;i++){
      var n = pk[i], prev = PUBLISHED_PAGES[String(n)].substring(0,60);
      if(PUBLISHED_PAGES[String(n)].length > 60) prev += '...';
      var mod = isModified(n);
      h += '<div class="pitem"><span>Страница '+n+(mod?' <span style="color:var(--y)">(есть черновик)</span>':'')+
        '</span><span style="color:var(--d);font-size:11px">'+esc(prev)+'</span></div>';
    }
    h += '</div>';
  }
  h += '<p style="margin-top:12px;color:var(--d);font-size:12px">Опубликовано: '+pk.length+' | Изменено в черновике: '+mc;
  h += '<br>Чтобы изменения стали видны зрителям — нажмите «СКОПИРОВАТЬ КОД» и сохраните новый файл.</p>';
  h += '<div class="brow"><button class="btn" onclick="closeModal()">ЗАКРЫТЬ</button></div>';
  showModal(h);
}

/* ====== ГЕНЕРАЦИЯ АВТОНОМНОГО КОДА (ТОЛЬКО ПРОСМОТР) ====== */

function copyCode(){
  var pages = getAllPages();
  var clean = {};
  for(var k in pages){
    if(pages[k] !== null && pages[k] !== undefined && pages[k] !== '') clean[k] = pages[k];
  }
  var json = JSON.stringify(clean);
  fetchAssetsAndBuild(json);
}

function fetchAssetsAndBuild(json){
  var cssFetched = '', jsFetched = '';
  var cssDone = false, jsDone = false;
  fetch('style.css').then(function(r){return r.text();}).then(function(t){
    cssFetched = t; cssDone = true; check();
  }).catch(function(){ cssDone = true; check(); });
  fetch('script.js').then(function(r){return r.text();}).then(function(t){
    jsFetched = t; jsDone = true; check();
  }).catch(function(){ jsDone = true; check(); });
  function check(){
    if(cssDone && jsDone){
      buildViewerSite(cssFetched, json);
    }
  }
}

function buildViewerSite(cssText, json){
  var L = [];
  L.push('<!DOCTYPE html>');
  L.push('<html lang="ru">');
  L.push('<head>');
  L.push('<meta charset="UTF-8">');
  L.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  L.push('<title>ГОЛОГРАММА</title>');
  L.push('<style>');
  L.push(cssText);
  L.push('</style>');
  L.push('</head>');
  L.push('<body>');
  L.push('<div id="login">');
  L.push('<h1 class="glow">ГОЛОГРАММА</h1>');
  L.push('<div class="sub">/// ВВЕДИТЕ ПАРОЛЬ ДОСТУПА ///</div>');
  L.push('<input type="password" id="pwd" placeholder="• • • • • •" autocomplete="off">');
  L.push('<button id="loginBtn">ВОЙТИ</button>');
  L.push('<div class="lerr" id="lerr"></div>');
  L.push('</div>');
  L.push('<div id="app">');
  L.push('<div class="sbar" id="sbar"></div>');
  L.push('<div class="tbar">');
  L.push('<div class="logo glow">◈ ГОЛОГРАММА</div>');
  L.push('<div class="tabs" id="tabs"></div>');
  L.push('</div>');
  L.push('<div class="content"><div id="pdisp"></div></div>');
  L.push('</div>');
  L.push('<script>');
  L.push('var PUBLISHED_PAGES = ' + json + ';');
  L.push('var VPWD = "взб";');
  L.push('var user = null, curPage = 1;');
  L.push('document.getElementById("loginBtn").onclick = login;');
  L.push('document.getElementById("pwd").addEventListener("keydown", function(e){if(e.key==="Enter")login();});');
  L.push('function login(){');
  L.push('  var p = document.getElementById("pwd").value;');
  L.push('  var err = document.getElementById("lerr");');
  L.push('  if(p === VPWD){ user = "viewer"; }');
  L.push('  else { err.textContent = "НЕВЕРНЫЙ ПАРОЛЬ"; document.getElementById("pwd").value=""; return; }');
  L.push('  document.getElementById("login").style.display="none";');
  L.push('  document.getElementById("app").style.display="flex";');
  L.push('  render();');
  L.push('}');
  L.push('function esc(t){ var d=document.createElement("div"); d.textContent=t; return d.innerHTML; }');
  L.push('function getNums(){ return Object.keys(PUBLISHED_PAGES).map(Number).sort(function(a,b){return a-b;}); }');
  L.push('function render(){ renderSbar(); renderTabs(); renderPage(); }');
  L.push('function renderSbar(){');
  L.push('  var pc = Object.keys(PUBLISHED_PAGES).length;');
  L.push('  document.getElementById("sbar").innerHTML = "<span>СТАТУС: ЗРИТЕЛЬ</span><span class=\\"pub\\">СТРАНИЦ: "+pc+"</span><span>СТРАНИЦА: "+curPage+"</span>";');
  L.push('}');
  L.push('function renderTabs(){');
  L.push('  var nums = getNums(), h = "";');
  L.push('  if(nums.length === 0){ document.getElementById("tabs").innerHTML = "<span style=\\"color:var(--d);padding:8px;font-size:13px\\">НЕТ СТРАНИЦ</span>"; return; }');
  L.push('  for(var i=0;i<nums.length;i++){');
  L.push('    var n = nums[i], act = n === curPage;');
  L.push('    h += "<div class=\\"tab"+(act?" active":"")+"\\" onclick=\\"goToPage("+n+")\\">Стр."+n+"</div>";');
  L.push('  }');
  L.push('  document.getElementById("tabs").innerHTML = h;');
  L.push('}');
  L.push('function renderPage(){');
  L.push('  var disp = document.getElementById("pdisp"), nums = getNums();');
  L.push('  if(nums.length === 0){ disp.innerHTML = "<div class=\\"empty\\">/// СТРАНИЦЫ ОТСУТСТВУЮТ ///</div>"; return; }');
  L.push('  if(!PUBLISHED_PAGES.hasOwnProperty(String(curPage))) curPage = nums[0] || 1;');
  L.push('  var pc = PUBLISHED_PAGES[String(curPage)] || "";');
  L.push('  if(pc.trim() === "") disp.innerHTML = "<div class=\\"pcard empty\\">/// ПУСТАЯ СТРАНИЦА "+curPage+" ///</div>";');
  L.push('  else disp.innerHTML = "<div class=\\"pcard\\">"+esc(pc)+"</div>";');
  L.push('}');
  L.push('function goToPage(n){ curPage = n; render(); }');
  L.push('document.addEventListener("keydown", function(e){');
  L.push('  if(!user) return;');
  L.push('  if(e.target.tagName === "INPUT") return;');
  L.push('  var nums = getNums(); if(nums.length === 0) return;');
  L.push('  var idx = nums.indexOf(curPage);');
  L.push('  if(e.key === "ArrowLeft" && idx > 0){ curPage = nums[idx-1]; render(); }');
  L.push('  else if(e.key === "ArrowRight" && idx < nums.length-1){ curPage = nums[idx+1]; render(); }');
  L.push('});');
  L.push('<\/script>');
  L.push('</body>');
  L.push('</html>');
  var html = L.join('\n');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(html).then(function(){
      toast('Код для зрителей скопирован! Вставьте в index.html и сохраните.');
    }).catch(function(){ showCodeModal(html); });
  } else { showCodeModal(html); }
}

function showCodeModal(html){
  var h = '<h2>КОД ДЛЯ ЗРИТЕЛЕЙ</h2><p>Скопируйте код (Ctrl+A → Ctrl+C) и вставьте в файл index.html:</p>';
  h += '<textarea readonly id="codeArea" onclick="this.select()"></textarea>';
  h += '<div class="brow"><button class="btn" onclick="closeModal()">ЗАКРЫТЬ</button></div>';
  showModal(h);
  setTimeout(function(){ document.getElementById('codeArea').value = html; }, 50);
}

function logout(){
  user = null; curPage = 1; editing = false;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'flex';
  document.getElementById('pwd').value = '';
  document.getElementById('lerr').textContent = '';
  document.getElementById('apanel').style.display = 'none';
}

function showModal(html){
  var o = document.createElement('div'); o.className='ovr'; o.id='ovr';
  o.innerHTML = '<div class="mdl">'+html+'</div>';
  o.addEventListener('click', function(e){ if(e.target===o) closeModal(); });
  document.body.appendChild(o);
}
function closeModal(){ var m=document.getElementById('ovr'); if(m) m.remove(); }

var tt;
function toast(msg){
  var ex = document.querySelector('.toast'); if(ex) ex.remove();
  var t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  clearTimeout(tt); tt = setTimeout(function(){ t.remove(); }, 3000);
}

document.addEventListener('keydown', function(e){
  if(!user||editing) return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  var nums = getNums(); if(nums.length===0) return;
  var idx = nums.indexOf(curPage);
  if(e.key==='ArrowLeft' && idx>0){ curPage=nums[idx-1]; render(); }
  else if(e.key==='ArrowRight' && idx<nums.length-1){ curPage=nums[idx+1]; render(); }
});
