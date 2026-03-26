/* ── NAVIGATION ── */
function nav(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById('pg-' + p).classList.add('active');
  document.getElementById('nl-' + p).classList.add('active');
  if (p === 'scorers') { buildFilter(); loadScorers(currentLeague); }
}

/* ── API CALLS via Netlify Functions ── */
async function apiCall(fn, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/${fn}${qs ? '?' + qs : ''}`);
  if (!res.ok) throw new Error('Erreur ' + res.status);
  return res.json();
}

/* ── TOAST ── */
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ══════════════════════════
   PAGE JOUEURS
══════════════════════════ */
async function searchPlayer() {
  const name = document.getElementById('psearch').value.trim();
  if (!name) return;
  pState('load');
  try {
    const data = await apiCall('player', { name });
    if (!data.response?.length) { pState('err', 'Joueur introuvable. Essaie un autre nom.'); return; }
    renderPlayer(data.response[0]);
    pState('card');
  } catch (e) {
    pState('err', 'Erreur de connexion. Réessaie dans quelques secondes.');
  }
}

function pState(s, msg = '') {
  document.getElementById('p-empty').style.display = s === 'empty' ? 'block' : 'none';
  document.getElementById('p-load').classList.toggle('show', s === 'load');
  document.getElementById('p-err').classList.toggle('show', s === 'err');
  document.getElementById('p-card').classList.toggle('show', s === 'card');
  if (msg) document.getElementById('p-errmsg').textContent = msg;
}

function renderPlayer(entry) {
  const p = entry.player, s = entry.statistics?.[0] || {};
  const av = document.getElementById('p-av');
  av.innerHTML = p.photo ? `<img src="${p.photo}" alt="${p.name}">` : '⚽';
  document.getElementById('p-pos').textContent = s.games?.position || '—';
  document.getElementById('p-name').textContent = p.name || '—';
  document.getElementById('p-nat').textContent = p.nationality || '—';
  document.getElementById('p-age').textContent = p.age ? p.age + ' ans' : '—';
  document.getElementById('p-team').textContent = s.team?.name || '—';
  document.getElementById('p-league').textContent = s.league?.name || '—';

  const g = s.games || {}, gl = s.goals || {}, pa = s.passes || {},
        ta = s.tackles || {}, dr = s.dribbles || {}, ca = s.cards || {},
        sh = s.shots || {}, du = s.duels || {};

  const items = [
    { i: '🎮', v: g.appearences || 0,                          l: 'Matchs joués',      c: '' },
    { i: '⚽', v: gl.total || 0,                               l: 'Buts',              c: 'g' },
    { i: '🅰️', v: gl.assists || 0,                             l: 'Passes déc.',       c: 'au' },
    { i: '🎯', v: sh.total || 0,                               l: 'Tirs totaux',       c: '' },
    { i: '🎱', v: sh.on || 0,                                  l: 'Tirs cadrés',       c: '' },
    { i: '🔑', v: pa.key || 0,                                 l: 'Passes clés',       c: '' },
    { i: '💯', v: pa.accuracy ? pa.accuracy + '%' : '—',       l: 'Précision passes',  c: '' },
    { i: '🏃', v: dr.success || 0,                             l: 'Dribbles réussis',  c: '' },
    { i: '🛡️', v: ta.total || 0,                               l: 'Tacles',            c: '' },
    { i: '🤼', v: du.won || 0,                                 l: 'Duels gagnés',      c: '' },
    { i: '🟨', v: ca.yellow || 0,                              l: 'Cartons jaunes',    c: 'au' },
    { i: '🟥', v: ca.red || 0,                                 l: 'Cartons rouges',    c: 'r' },
    { i: '⏱️', v: g.minutes || 0,                              l: 'Minutes jouées',    c: '' },
    { i: '⭐', v: g.rating ? parseFloat(g.rating).toFixed(1) : '—', l: 'Note moyenne', c: 'g' },
  ];

  document.getElementById('p-grid').innerHTML = items.map(x =>
    `<div class="sb"><div class="si">${x.i}</div><div class="sv ${x.c}">${x.v}</div><div class="slb">${x.l}</div></div>`
  ).join('');

  loadMatches(p.id);
}

async function loadMatches(pid) {
  const ml = document.getElementById('p-mlist');
  ml.innerHTML = '<p style="color:#999;font-size:.88rem;padding:.75rem 0">Chargement des matchs...</p>';
  try {
    const data = await apiCall('matches', { player: pid });
    if (!data.response?.length) { ml.innerHTML = '<p style="color:#999;font-size:.88rem">Aucun match trouvé.</p>'; return; }
    ml.innerHTML = '<div class="mlist">' + data.response.map(f => {
      const dt = new Date(f.fixture.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      return `<div class="mrow"><div class="mdate">${dt}</div><div class="mteams">${f.teams.home.name}<span class="vs">vs</span>${f.teams.away.name}</div><div class="mscore">${f.goals.home ?? '?'} — ${f.goals.away ?? '?'}</div></div>`;
    }).join('') + '</div>';
  } catch (e) {
    ml.innerHTML = '<p style="color:#999;font-size:.88rem">Impossible de charger les matchs.</p>';
  }
}

function stab(id, el) {
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.tp').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  document.getElementById(id).classList.add('on');
}

/* ══════════════════════════
   PAGE CLASSEMENT
══════════════════════════ */
let currentLeague = 39;

const LEAGUES = [
  { id: 39,  name: 'Premier League', f: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',        f: '🇪🇸' },
  { id: 135, name: 'Serie A',        f: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',     f: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',        f: '🇫🇷' },
];

function buildFilter() {
  document.getElementById('fbar').innerHTML = LEAGUES.map(l =>
    `<button class="fbtn ${l.id === currentLeague ? 'on' : ''}" onclick="selLeague(${l.id}, this)">${l.f} ${l.name}</button>`
  ).join('');
}

function selLeague(id, el) {
  currentLeague = id;
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  loadScorers(id);
}

async function loadScorers(leagueId) {
  scState('load');
  try {
    const data = await apiCall('scorers', { league: leagueId });
    if (!data.response?.length) { scState('err', 'Impossible de charger le classement.'); return; }
    renderScorers(data.response);
    scState('res');
  } catch (e) {
    scState('err', 'Erreur de connexion. Réessaie dans quelques secondes.');
  }
}

function scState(s, msg = '') {
  document.getElementById('sc-load').classList.toggle('show', s === 'load');
  document.getElementById('sc-err').classList.toggle('show', s === 'err');
  document.getElementById('sc-res').style.display = s === 'res' ? 'block' : 'none';
  if (msg) document.getElementById('sc-errmsg').textContent = msg;
}

function renderScorers(list) {
  const rc = ['', 'r1', 'r2', 'r3'];
  document.getElementById('sc-body').innerHTML = list.slice(0, 20).map((entry, i) => {
    const p = entry.player, s = entry.statistics?.[0] || {};
    const rk = i + 1;
    return `
      <div class="srow">
        <div class="rank ${rc[rk] || ''}">${rk}</div>
        <div class="sinfo">
          <div class="sphoto">${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : '⚽'}</div>
          <div><div class="sn">${p.name}</div><div class="steam">${s.team?.name || '—'}</div></div>
        </div>
        <div class="sstat g">${s.goals?.total || 0}</div>
        <div class="sstat a">${s.goals?.assists || 0}</div>
        <div class="sstat m">${s.games?.appearences || 0}</div>
      </div>`;
  }).join('');
}
