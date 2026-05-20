/* 養生帖 - personal recovery journal */
(() => {
  'use strict';

  const STORAGE_KEY = 'yojo-cho-v1';
  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

  // ===== State =====
  let state = load() || { days: {} };
  let currentTab = 'today';

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast('保存に失敗しました'); }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ===== Date helpers =====
  function dateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function parseKey(k) {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function fmtDateLong(k) {
    const d = parseKey(k);
    return `${d.getFullYear()}年 ${d.getMonth() + 1}月 ${d.getDate()}日`;
  }
  function fmtDateShort(k) {
    const d = parseKey(k);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  function weekday(k) { return WEEKDAYS[parseKey(k).getDay()]; }
  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ===== Data accessors =====
  function getDay(key, create = true) {
    if (!state.days[key]) {
      if (!create) return null;
      state.days[key] = { toilet: { small: 0, large: 0 }, rehab: [] };
    }
    return state.days[key];
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ===== Actions =====
  function incToilet(type, delta) {
    const d = getDay(dateKey());
    d.toilet[type] = Math.max(0, (d.toilet[type] || 0) + delta);
    save();
    renderToday();
  }
  function addRehab() {
    const d = getDay(dateKey());
    d.rehab.push({
      id: uid(),
      time: nowTime(),
      note: '',
      rom: { selfUp: null, assistUp: null, selfDown: null, assistDown: null }
    });
    save();
    renderToday();
    // focus the new textarea
    setTimeout(() => {
      const sessions = document.querySelectorAll('.session textarea');
      if (sessions.length) sessions[sessions.length - 1].focus();
    }, 50);
  }
  function removeRehab(id) {
    const d = getDay(dateKey());
    d.rehab = d.rehab.filter(r => r.id !== id);
    save();
    renderToday();
  }
  function updateRehab(id, patch) {
    const d = getDay(dateKey());
    const s = d.rehab.find(r => r.id === id);
    if (!s) return;
    Object.assign(s, patch);
    save();
  }
  function updateRom(id, key, val) {
    const d = getDay(dateKey());
    const s = d.rehab.find(r => r.id === id);
    if (!s) return;
    s.rom[key] = (val === '' || val == null) ? null : Number(val);
    save();
  }

  // ===== Rendering =====
  const view = document.getElementById('view');

  function el(tag, props = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function renderToday() {
    const k = dateKey();
    const day = getDay(k);
    const d = new Date();

    view.innerHTML = '';
    view.appendChild(el('div', { class: 'date-row' },
      el('div', { class: 'date-main' }, fmtDateLong(k)),
      el('div', { class: 'date-sub' }, `${weekday(k)}曜日`)
    ));

    // Toilet section
    view.appendChild(el('section', { class: 'section' },
      el('h2', { class: 'section-title' }, '排泄'),
      el('div', { class: 'toilet-grid' },
        toiletCell('小', 'small', day.toilet.small || 0, false),
        toiletCell('大', 'large', day.toilet.large || 0, true)
      )
    ));

    // Rehab section
    const rehabSection = el('section', { class: 'section' },
      el('h2', { class: 'section-title' },
        'リハビリ',
        el('span', { class: 'section-meta' }, `本日 ${day.rehab.length} 回`)
      )
    );
    for (const s of day.rehab) rehabSection.appendChild(renderSession(s));
    rehabSection.appendChild(
      el('button', { class: 'rehab-add', onclick: addRehab },
        el('span', { html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>' }),
        'セッションを追加'
      )
    );
    view.appendChild(rehabSection);
  }

  function toiletCell(label, key, count, isLarge) {
    return el('div', { class: 'toilet-cell' + (isLarge ? ' large' : '') },
      el('div', { class: 'toilet-label' }, label),
      el('div', { class: 'toilet-count' }, String(count)),
      el('div', { class: 'toilet-controls' },
        el('button', { class: 'round-btn minus', onclick: () => incToilet(key, -1), 'aria-label': `${label} -1` }, '−'),
        el('button', { class: 'round-btn plus', onclick: () => incToilet(key, +1), 'aria-label': `${label} +1` }, '+')
      )
    );
  }

  function renderSession(s) {
    const session = el('div', { class: 'session', dataset: { id: s.id } });

    // head
    const timeInput = el('input', {
      type: 'time',
      value: s.time || nowTime(),
      onchange: (e) => updateRehab(s.id, { time: e.target.value })
    });
    session.appendChild(el('div', { class: 'session-head' },
      el('div', { class: 'session-time' }, timeInput),
      el('button', {
        class: 'session-del',
        onclick: () => {
          if (confirm('このセッションを削除しますか?')) removeRehab(s.id);
        }
      }, '削除')
    ));

    // note
    const note = el('textarea', {
      placeholder: 'リハビリ内容のメモ (例: 歩行訓練 5m、膝の屈伸 10回...)',
      oninput: (e) => updateRehab(s.id, { note: e.target.value })
    });
    note.value = s.note || '';
    session.appendChild(note);

    // ROM
    session.appendChild(el('div', { class: 'rom-grid' },
      romCell(s, 'selfUp', '自力', '上げ', 'mode-self'),
      romCell(s, 'assistUp', '補助', '上げ', 'mode-assist'),
      romCell(s, 'selfDown', '自力', '下げ', 'mode-self'),
      romCell(s, 'assistDown', '補助', '下げ', 'mode-assist')
    ));

    return session;
  }

  function romCell(s, key, mode, dir, modeClass) {
    const input = el('input', {
      type: 'number',
      inputmode: 'decimal',
      step: '1',
      min: '0',
      max: '180',
      placeholder: '–',
      oninput: (e) => updateRom(s.id, key, e.target.value)
    });
    if (s.rom[key] != null) input.value = s.rom[key];
    return el('div', { class: 'rom-cell' },
      el('div', { class: 'rom-label' },
        el('span', { class: modeClass }, mode),
        el('span', { class: 'dir' }, dir)
      ),
      el('div', { class: 'rom-input' }, input, el('span', { class: 'unit' }, '°'))
    );
  }

  // ===== History =====
  function renderHistory() {
    view.innerHTML = '';
    view.appendChild(el('div', { class: 'date-row' },
      el('div', { class: 'date-main' }, '履歴'),
      el('div', { class: 'date-sub' }, `${Object.keys(state.days).length} 日`)
    ));

    const keys = Object.keys(state.days).sort().reverse();
    if (keys.length === 0) {
      view.appendChild(el('div', { class: 'empty' },
        el('div', { class: 'empty-icon' }, '☘'),
        el('div', {}, 'まだ記録がありません')
      ));
      return;
    }

    for (const k of keys) {
      const d = state.days[k];
      const sessionsHasContent = d.rehab.some(r => r.note || hasAnyRom(r));
      const card = el('div', { class: 'history-day' },
        el('div', { class: 'history-day-head' },
          el('div', {},
            el('span', { class: 'history-date' }, fmtDateLong(k)),
            el('span', { class: 'history-weekday' }, `(${weekday(k)})`)
          )
        ),
        el('div', { class: 'history-row' },
          el('div', {}, el('span', { class: 'lbl' }, '小'), String(d.toilet.small || 0)),
          el('div', {}, el('span', { class: 'lbl' }, '大'), String(d.toilet.large || 0)),
          el('div', {}, el('span', { class: 'lbl' }, 'リハビリ'), `${d.rehab.length} 回`)
        )
      );

      if (d.rehab.length > 0) {
        const notes = el('div', { class: 'history-notes' });
        for (const s of d.rehab) {
          const line = el('div', { class: 'session-note' });
          line.appendChild(el('span', { class: 't' }, s.time || ''));
          let txt = s.note ? s.note : '(メモなし)';
          const romParts = [];
          if (s.rom.selfUp != null) romParts.push(`自上${s.rom.selfUp}°`);
          if (s.rom.assistUp != null) romParts.push(`補上${s.rom.assistUp}°`);
          if (s.rom.selfDown != null) romParts.push(`自下${s.rom.selfDown}°`);
          if (s.rom.assistDown != null) romParts.push(`補下${s.rom.assistDown}°`);
          if (romParts.length) txt += `  〔${romParts.join(' / ')}〕`;
          line.appendChild(document.createTextNode(txt));
          notes.appendChild(line);
        }
        card.appendChild(notes);
      }
      view.appendChild(card);
    }
  }
  function hasAnyRom(r) {
    return r.rom && (r.rom.selfUp != null || r.rom.assistUp != null || r.rom.selfDown != null || r.rom.assistDown != null);
  }

  // ===== Trend =====
  function renderTrend() {
    view.innerHTML = '';
    view.appendChild(el('div', { class: 'date-row' },
      el('div', { class: 'date-main' }, '推移'),
      el('div', { class: 'date-sub' }, '日次の最大値')
    ));

    const keys = Object.keys(state.days).sort();
    if (keys.length === 0) {
      view.appendChild(el('div', { class: 'empty' },
        el('div', { class: 'empty-icon' }, '☘'),
        el('div', {}, '記録が貯まると推移が見られます')
      ));
      return;
    }

    // Build daily max per ROM key
    const series = { selfUp: [], assistUp: [], selfDown: [], assistDown: [] };
    const toiletSeries = { small: [], large: [] };
    for (const k of keys) {
      const d = state.days[k];
      for (const key of Object.keys(series)) {
        let max = null;
        for (const r of d.rehab) {
          const v = r.rom[key];
          if (v != null && (max == null || v > max)) max = v;
        }
        series[key].push({ x: k, y: max });
      }
      toiletSeries.small.push({ x: k, y: d.toilet.small || 0 });
      toiletSeries.large.push({ x: k, y: d.toilet.large || 0 });
    }

    // ROM chart
    view.appendChild(el('div', { class: 'trend-card' },
      el('div', { class: 'trend-title' }, '足首 可動域 (ROM)'),
      el('div', { class: 'trend-sub' }, '日次の最大角度 (°)'),
      el('div', { class: 'chart-wrap' }, lineChart([
        { name: '自力 上げ', color: '#5e7a5a', points: series.selfUp },
        { name: '補助 上げ', color: '#b56c47', points: series.assistUp },
        { name: '自力 下げ', color: '#3f5a3d', dash: true, points: series.selfDown },
        { name: '補助 下げ', color: '#8e5235', dash: true, points: series.assistDown }
      ], keys)),
      legend([
        { name: '自力 上げ', color: '#5e7a5a' },
        { name: '補助 上げ', color: '#b56c47' },
        { name: '自力 下げ (点線)', color: '#3f5a3d' },
        { name: '補助 下げ (点線)', color: '#8e5235' }
      ])
    ));

    // Toilet chart
    view.appendChild(el('div', { class: 'trend-card' },
      el('div', { class: 'trend-title' }, '排泄'),
      el('div', { class: 'trend-sub' }, '日次の回数'),
      el('div', { class: 'chart-wrap' }, barChart([
        { name: '小', color: '#5e7a5a', points: toiletSeries.small },
        { name: '大', color: '#b56c47', points: toiletSeries.large }
      ], keys)),
      legend([
        { name: '小', color: '#5e7a5a' },
        { name: '大', color: '#b56c47' }
      ])
    ));
  }

  function legend(items) {
    const wrap = el('div', { class: 'legend' });
    for (const it of items) {
      wrap.appendChild(el('span', {},
        el('span', { class: 'sw', style: `background:${it.color}` }),
        it.name
      ));
    }
    return wrap;
  }

  // ===== Charts (SVG) =====
  function chartScale(keys, allValues, maxBuffer = 1.1) {
    const W = Math.max(keys.length * 36, 280);
    const H = 200;
    const padL = 28, padR = 10, padT = 14, padB = 28;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const finiteVals = allValues.filter(v => Number.isFinite(v));
    const maxV = Math.max(10, ...finiteVals) * maxBuffer;
    const minV = 0;
    const xAt = i => padL + (keys.length === 1 ? innerW / 2 : (innerW * i) / (keys.length - 1));
    const yAt = v => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;
    return { W, H, padL, padR, padT, padB, innerW, innerH, maxV, minV, xAt, yAt };
  }

  function svgEl(tag, attrs = {}, ...children) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    for (const c of children.flat()) {
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function gridAndAxis(s, keys, labelEvery = 1) {
    const elems = [];
    // Y grid
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = s.minV + ((s.maxV - s.minV) * i) / ticks;
      const y = s.yAt(v);
      elems.push(svgEl('line', {
        x1: s.padL, x2: s.W - s.padR, y1: y, y2: y,
        stroke: '#e5dccb', 'stroke-width': '1', 'stroke-dasharray': i === 0 ? '0' : '2,3'
      }));
      elems.push(svgEl('text', {
        x: s.padL - 4, y: y + 3, 'text-anchor': 'end',
        'font-size': '9', fill: '#8c8175', 'font-family': 'system-ui'
      }, String(Math.round(v))));
    }
    // X labels (only show every Nth date)
    const stepLabel = Math.max(1, Math.ceil(keys.length / 6));
    keys.forEach((k, i) => {
      if (i % stepLabel !== 0 && i !== keys.length - 1) return;
      const x = s.xAt(i);
      elems.push(svgEl('text', {
        x, y: s.H - 8, 'text-anchor': 'middle',
        'font-size': '9', fill: '#8c8175', 'font-family': 'system-ui'
      }, fmtDateShort(k)));
    });
    return elems;
  }

  function lineChart(seriesList, keys) {
    const allVals = seriesList.flatMap(s => s.points.map(p => p.y)).filter(v => v != null);
    const s = chartScale(keys, allVals, 1.15);
    const svg = svgEl('svg', { width: s.W, height: s.H, viewBox: `0 0 ${s.W} ${s.H}` });

    for (const g of gridAndAxis(s, keys)) svg.appendChild(g);

    for (const ser of seriesList) {
      // Build path skipping null gaps
      const segments = [];
      let cur = [];
      ser.points.forEach((p, i) => {
        if (p.y == null) {
          if (cur.length) segments.push(cur);
          cur = [];
        } else {
          cur.push({ x: s.xAt(i), y: s.yAt(p.y) });
        }
      });
      if (cur.length) segments.push(cur);
      for (const seg of segments) {
        if (seg.length === 1) {
          svg.appendChild(svgEl('circle', { cx: seg[0].x, cy: seg[0].y, r: 3, fill: ser.color }));
        } else {
          const d = seg.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1)).join(' ');
          svg.appendChild(svgEl('path', {
            d, fill: 'none', stroke: ser.color, 'stroke-width': '2',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round',
            'stroke-dasharray': ser.dash ? '4,3' : ''
          }));
          for (const pt of seg) {
            svg.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: 2.5, fill: ser.color }));
          }
        }
      }
    }
    return svg;
  }

  function barChart(seriesList, keys) {
    const allVals = seriesList.flatMap(s => s.points.map(p => p.y));
    const s = chartScale(keys, allVals, 1.2);
    const svg = svgEl('svg', { width: s.W, height: s.H, viewBox: `0 0 ${s.W} ${s.H}` });
    for (const g of gridAndAxis(s, keys)) svg.appendChild(g);
    const groupW = (s.innerW / Math.max(1, keys.length - 1 || 1)) * 0.6;
    const barW = Math.min(10, groupW / seriesList.length);

    keys.forEach((k, i) => {
      const cx = s.xAt(i);
      seriesList.forEach((ser, sIdx) => {
        const v = ser.points[i].y;
        if (!v) return;
        const x = cx - (seriesList.length * barW) / 2 + sIdx * barW;
        const y = s.yAt(v);
        const h = s.yAt(0) - y;
        svg.appendChild(svgEl('rect', {
          x: x.toFixed(1), y: y.toFixed(1), width: barW.toFixed(1), height: h.toFixed(1),
          fill: ser.color, rx: '1.5', opacity: '0.9'
        }));
      });
    });
    return svg;
  }

  // ===== Tab navigation =====
  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === tab);
    });
    if (tab === 'today') renderToday();
    else if (tab === 'history') renderHistory();
    else if (tab === 'trend') renderTrend();
    window.scrollTo(0, 0);
  }

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  // ===== Menu / Export / Import =====
  const menu = document.getElementById('menu');
  document.getElementById('menuBtn').addEventListener('click', () => { menu.hidden = false; });
  menu.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') === e.currentTarget) menu.hidden = true;
    });
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yojo-cho-${dateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    menu.hidden = true;
    toast('書き出しました');
  });

  document.getElementById('importInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data !== 'object' || !data.days) throw new Error('形式不正');
        if (!confirm('現在のデータを上書きします。よろしいですか?')) return;
        state = data;
        save();
        setTab(currentTab);
        menu.hidden = true;
        toast('読み込みました');
      } catch (err) {
        toast('読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (!confirm('全データを消去します。取り消せません。続けますか?')) return;
    if (!confirm('本当に消去しますか?')) return;
    state = { days: {} };
    save();
    setTab(currentTab);
    menu.hidden = true;
    toast('消去しました');
  });

  // ===== Toast =====
  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
  }

  // ===== Init =====
  setTab('today');
})();
