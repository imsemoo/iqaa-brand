// Reading jobs on a line: where a job stands, where it goes next, the route it takes, and its metro strip.
// Shared by Today, Orders and the order page, so all three agree on every job.
(function () {
  const isPerson = (k) => k === 'held' || k === 'struck';

  function on(line) {
    const main = line.stations;
    function station(id) {
      const i = main.findIndex((s) => s.id === id);
      if (i >= 0) return { st: main[i], i };
      for (const r of line.routes) {
        if (r.type !== 'branch') continue;
        const j = r.stations.findIndex((s) => s.id === id);
        if (j >= 0) return { st: r.stations[j], i: main.findIndex((s) => s.id === r.from) + 0.5, route: r, j };
      }
      return null;
    }
    const stepOf = (j) => (j.finished ? null : station(j.at).st.steps[j.step]);
    // the station after this one for this job: a big order takes the branch, a branch rejoins the line
    function nextStation(j, id) {
      const p = station(id);
      if (p.route) return p.j + 1 < p.route.stations.length ? p.route.stations[p.j + 1].id : p.route.to;
      const br = line.routes.find((r) => r.type === 'branch' && r.from === id && j.people > r.over);
      if (br) return br.stations[0].id;
      return p.i + 1 < main.length ? main[p.i + 1].id : null;
    }
    // every station this job walks, start to end, in order
    function route(j) {
      const out = [];
      let at = main[0].id, guard = 0;
      while (at && guard++ < 40) { out.push(station(at).st); at = nextStation(j, at); }
      return out;
    }
    // the steps ahead of a job, in order, as far as the end of the line
    function ahead(j) {
      if (j.finished) return [];
      const out = [];
      let at = j.at, k = j.step + 1, guard = 0;
      while (at && guard++ < 40) {
        const st = station(at).st;
        for (; k < st.steps.length; k++) out.push({ st, x: st.steps[k] });
        at = nextStation(j, at); k = 0;
      }
      return out;
    }

    // the metro strip: the line's stations, the ones `ring(st)` names ringed violet, the job a filled stop
    const GAP = 22, PAD = 9, Y = 9;
    const xAt = (i) => PAD + GAP * i;
    function pos(j) {
      if (j.finished) return [xAt(main.length - 1), Y];
      const p = station(j.at);
      if (!p.route) return [xAt(p.i), Y];
      const a = main.findIndex((s) => s.id === p.route.from), b = main.findIndex((s) => s.id === p.route.to);
      return [xAt(a) + ((xAt(b) - xAt(a)) * (p.j + 1)) / (p.route.stations.length + 1), Y + 11];
    }
    function strip(j, ring) {
      const mine = ring || (() => false);
      const w = PAD * 2 + GAP * (main.length - 1);
      let svg = `<svg class="strip" viewBox="0 0 ${w} 26" width="${w}" height="26" aria-hidden="true"><path class="tr" d="M${PAD} ${Y}H${w - PAD}"/>`;
      const p = j.finished ? null : station(j.at);
      if (p && p.route) {
        const a = xAt(main.findIndex((s) => s.id === p.route.from)), b = xAt(main.findIndex((s) => s.id === p.route.to));
        svg += `<path class="tr br" d="M${a} ${Y}L${a + 8} ${Y + 11}H${b - 8}L${b} ${Y}"/>`;
        if (mine(p.st)) { const [x, y] = pos(j); svg += `<circle class="stn me" cx="${x}" cy="${y}" r="4"/>`; }
      }
      main.forEach((st, i) => { svg += `<circle class="stn${mine(st) ? ' me' : ''}" cx="${xAt(i)}" cy="${Y}" r="4"/>`; });
      const [x, y] = pos(j), st = stepOf(j);
      // the stop carries the colour of the step it is on: violet for a person, ink for one that runs by itself
      const cls = j.finished ? ' done' : st && isPerson(st.kind) ? ' hand' : '';
      return `${svg}<circle class="train${cls}" cx="${x}" cy="${y}" r="5.5"/></svg>`;
    }

    return { line, main, station, stepOf, nextStation, route, ahead, pos, strip };
  }

  // ---------- views shared by Orders and Overview: words for time, who a job waits on, a row, the load map ----------
  function views(J, S) {
    const esc = window.Beats.esc, dayMs = 864e5, main = J.main, line = J.line;
    const days = (iso) => Math.round((new Date(iso.slice(0, 10)) - new Date(S.dayIso)) / dayMs);
    function when(iso) {
      const d = days(iso);
      return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? `${-d} ${d === -1 ? 'day' : 'days'} ago` : `in ${d} days`;
    }
    const glyph = (k) => `<span class="g" aria-hidden="true">${window.IQ.glyph(k)}</span>`;
    // who or what the job is waiting on now, in words
    function waitingOn(j) {
      const x = J.stepOf(j);
      if (!x) return { html: `<span class="ow-t">Finished ${esc(j.finished)}</span>`, text: `finished ${j.finished}` };
      if (isPerson(x.kind) && x.who === 'The client') return { html: `${glyph(x.kind)}<span class="ow-t">Waiting for ${esc(j.client)}</span>`, text: `waiting for ${j.client}` };
      if (isPerson(x.kind)) return { html: `<span class="av" aria-hidden="true">${esc(x.who.charAt(0))}</span><span class="ow-t">${esc(x.who)}</span>`, text: `with ${x.who}` };
      if (x.kind === 'rest') return { html: `${glyph('rest')}<span class="ow-t">Waits ${esc(x.who.toLowerCase())}</span>`, text: `a timed wait of ${x.who.toLowerCase()}` };
      return { html: `${glyph('run')}<span class="ow-t">Runs by itself</span>`, text: 'running by itself' };
    }
    function row(j) {
      const p = j.finished ? null : J.station(j.at), x = J.stepOf(j), w = waitingOn(j);
      const where = j.finished ? 'Walked the whole line' : `At <b>${esc(p.st.name)}</b> · ${esc(x.name)}`;
      const soon = !j.finished && days(j.iso) <= 1;
      return `<li><a class="or-row" href="order.html?code=${j.code}" aria-label="${esc(j.title)}, ${j.code}, for ${esc(j.client)}. ${j.finished ? 'Finished' : `At ${esc(p.st.name)}, ${w.text}`}. Due ${esc(j.due)}.">
<span class="or-t"><code>${j.code}</code><b>${esc(j.title)}</b><span>${esc(j.client)}, ${esc(j.of)} · ${j.people} people</span></span>
<span class="or-pos">${J.strip(j)}<span>${where}</span></span>
<span class="or-due${soon ? ' soon' : ''}"><b>${esc(j.due)}</b><span>${when(j.iso)}</span></span>
<span class="or-who">${w.html}</span>
</a></li>`;
    }
    // the line with a count over every station; `at` is the station pressed, if any
    function loadMap(jobs, at) {
      const branch = line.routes.find((r) => r.type === 'branch');
      const n = main.length, xp = (i) => ((i + 0.5) / n) * 100;
      const stations = main.map((s, i) => ({ s, x: xp(i), y: 0 }));
      let dip = '';
      if (branch) {
        const a = main.findIndex((s) => s.id === branch.from), b = main.findIndex((s) => s.id === branch.to);
        branch.stations.forEach((s, k) => stations.push({ s, x: xp(a) + ((xp(b) - xp(a)) * (k + 1)) / (branch.stations.length + 1), y: 1 }));
        dip = `<path class="br" d="M${xp(a)} 12L${xp(a) + 4} 52H${xp(b) - 4}L${xp(b)} 12"/>`;
      }
      const count = (id) => jobs.filter((j) => !j.finished && j.at === id).length;
      const track = `<svg class="om-track" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M${xp(0)} 12H${xp(n - 1)}"/>${dip}</svg>`;
      return `<div class="om-in">${track}${stations.map(({ s, x, y }) => {
        const c = count(s.id), on = at === s.id;
        return `<button type="button" class="om-st${y ? ' br' : ''}${on ? ' on' : ''}${c ? '' : ' none'}" style="--x:${x.toFixed(2)}" data-at="${s.id}" aria-pressed="${on}" aria-label="${esc(s.name)}: ${c} ${c === 1 ? 'job' : 'jobs'}">
<span class="om-n">${c}</span><span class="om-dot" aria-hidden="true"></span><span class="om-name">${esc(s.name)}</span></button>`;
      }).join('')}</div>`;
    }
    return { days, when, glyph, waitingOn, row, loadMap };
  }

  window.JOBS = { on, views, isPerson };
})();
