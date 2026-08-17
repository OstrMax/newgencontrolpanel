/* ==========================================================
   Partner portal — routing, hierarchy drill-in, data
   Depends on core.js (theme, rail) and the shared design system.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- partner tier ----------
     Retail / FSW partners do not see the customer Billing section.
     Master and White-label partners do. */
  var TIERS = {
    retail:     { label: 'Retail / FSW',  billing: false },
    fsw:        { label: 'Retail / FSW',  billing: false },
    master:     { label: 'Master Agent',  billing: true  },
    whitelabel: { label: 'White-label',   billing: true  }
  };
  var tier = localStorage.getItem('pTier') || 'retail';
  function tierCfg() { return TIERS[tier] || TIERS.retail; }

  var PARTNER = 'Northwind Communications';

  /* ---------- who is looking ----------
     Only Sangoma staff can switch which partner account they are viewing; that
     control exists for internal troubleshooting. A partner user belongs to one
     partner account, so for them the rail shows a static name. */
  var isSangomaAdmin = (function () {
    var q = new URLSearchParams(location.search);
    return q.get('role') === 'sangoma' || localStorage.getItem('pRole') === 'sangoma';
  })();

  /* ---------- data ---------- */
  var CUSTOMERS = window.PORTFOLIO.CUSTOMERS;


  var ORDERS = [
    { id: 'ORD-88401', acct: 'Acme Manufacturing', t: 'Seat expansion',   qty: '+40 Premium',  d: '12 May 2024', st: 'In progress' },
    { id: 'ORD-88394', acct: 'Belmont Health',     t: 'Number porting',   qty: '86 DIDs',      d: '09 May 2024', st: 'Awaiting FOC' },
    { id: 'ORD-88377', acct: 'Northgate Retail',   t: 'New location',     qty: 'Tacoma, WA',   d: '06 May 2024', st: 'In progress' },
    { id: 'ORD-88362', acct: 'Cascade Logistics',  t: 'Seat expansion',   qty: '+120 Advanced', d: '02 May 2024', st: 'Completed' },
    { id: 'ORD-88350', acct: 'Pinnacle Financial', t: 'Device shipment',  qty: '60 handsets',  d: '28 Apr 2024', st: 'Completed' },
    { id: 'ORD-88341', acct: 'Summit Hospitality', t: 'Number porting',   qty: '24 DIDs',      d: '24 Apr 2024', st: 'Blocked' }
  ];

  var TEAM = [
    { n: 'Michael Okafor',  e: 'm.okafor@northwind-comms.com',  r: 'Partner Admin', sc: 'All accounts' },
    { n: 'Dana Whitfield',  e: 'd.whitfield@northwind-comms.com', r: 'Engineer',    sc: '12 accounts' },
    { n: 'Priya Raman',     e: 'p.raman@northwind-comms.com',   r: 'Engineer',      sc: '8 accounts' },
    { n: 'Tomas Lindqvist', e: 't.lindqvist@northwind-comms.com', r: 'Support',     sc: 'Read only' },
    { n: 'Grace Bell',      e: 'g.bell@northwind-comms.com',    r: 'Billing',       sc: 'All accounts' }
  ];

  /* support tickets the partner has raised, always attributed to the customer
     account (and site) the ticket was submitted under */
  var TICKETS = [
    { id: 'TCK-51288', sub: 'Inbound calls failing to Austin main line', acct: 'Acme Manufacturing', loc: 'Austin HQ',        pr: 'Urgent', st: 'Open',              by: 'Michael Okafor',  upd: '2h ago' },
    { id: 'TCK-51274', sub: 'Porting FOC date not confirmed (86 DIDs)',  acct: 'Belmont Health',     loc: 'Riverside Campus', pr: 'High',   st: 'Awaiting Sangoma',  by: 'Dana Whitfield',  upd: '6h ago' },
    { id: 'TCK-51261', sub: 'Handset firmware loop after provisioning',  acct: 'Acme Manufacturing', loc: 'Round Rock Plant', pr: 'High',   st: 'Open',              by: 'Priya Raman',     upd: '1d ago' },
    { id: 'TCK-51249', sub: 'E911 address rejected for new site',        acct: 'Northgate Retail',   loc: 'Tacoma, WA',       pr: 'Urgent', st: 'Awaiting customer', by: 'Michael Okafor',  upd: '1d ago' },
    { id: 'TCK-51230', sub: 'SMS delivery receipts missing',             acct: 'Cascade Logistics',  loc: 'Dallas Depot',     pr: 'Normal', st: 'Awaiting Sangoma',  by: 'Priya Raman',     upd: '2d ago' },
    { id: 'TCK-51218', sub: 'Request CDR export for Q1 audit',           acct: 'Pinnacle Financial', loc: 'Head Office',      pr: 'Low',    st: 'Awaiting customer', by: 'Grace Bell',      upd: '3d ago' },
    { id: 'TCK-51204', sub: 'Video bridge quality degradation',          acct: 'Riverstone Schools', loc: 'Head Office',      pr: 'Normal', st: 'Resolved',          by: 'Dana Whitfield',  upd: '4d ago' },
    { id: 'TCK-51199', sub: 'Suspend billing on closed location',        acct: 'Summit Hospitality', loc: 'Head Office',      pr: 'Normal', st: 'Resolved',          by: 'Grace Bell',      upd: '6d ago' },
    { id: 'TCK-51182', sub: 'Bulk user import rejected 14 rows',         acct: 'Belmont Health',     loc: 'Eastgate Clinic',  pr: 'Normal', st: 'Resolved',          by: 'Tomas Lindqvist', upd: '8d ago' }
  ];

  /* ---------- helpers ---------- */
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  function initials(n) {
    return n.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function pill(s) {
    var m = { Active: 'ok', Live: 'ok', Completed: 'ok', Resolved: 'ok', Trial: 'warn', Provisioning: 'warn',
              'In progress': 'warn', 'Awaiting FOC': 'warn', 'Awaiting Sangoma': 'warn',
              'Awaiting customer': 'warn', Suspended: 'bad', Blocked: 'bad', Open: 'bad' };
    return '<span class="pill ' + (m[s] || '') + '">' + s + '</span>';
  }
  function prio(p) {
    var m = { Urgent: 'bad', High: 'warn', Normal: '', Low: '' };
    return '<span class="pill ' + (m[p] || '') + '">' + p + '</span>';
  }
  function tbl(el, head, body) {
    var t = document.getElementById(el);
    if (t) t.innerHTML = '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody>';
  }
  function acctCell(n, sub) {
    return '<span class="acc-cell"><span class="acc-logo">' + initials(n) + '</span>' +
           '<span class="acc-nm"><b>' + n + '</b><span>' + sub + '</span></span></span>';
  }

  /* ---------- table rendering ---------- */
  function renderCustomers() {
    var head = '<th>Account</th><th>Industry</th><th>Locations</th><th>Seats</th><th>Services</th><th>Status</th><th style="width:44px"></th>';
    var body = CUSTOMERS.map(function (c) {
      return '<tr class="drill" data-cust="' + c.id + '">' +
        '<td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="muted">' + c.ind + '</td>' +
        '<td class="mono">' + c.loc + '</td>' +
        '<td class="mono">' + c.seats.toLocaleString() + '</td>' +
        '<td>' + c.svc.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join(' ') + '</td>' +
        '<td>' + pill(c.st) + '</td>' +
        '<td><span class="drill-x">' + CHEV + '</span></td></tr>';
    }).join('');
    tbl('custTable', head, body);
  }

  function renderRecent() {
    var head = '<th>Account</th><th>Last activity</th><th>Seats</th><th>Status</th><th style="width:44px"></th>';
    var body = CUSTOMERS.slice(0, 5).map(function (c, i) {
      var act = ['Seats assigned', 'Location added', 'Order submitted', 'User invited', 'License changed'][i];
      return '<tr class="drill" data-cust="' + c.id + '">' +
        '<td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="muted">' + act + ' · ' + (i + 1) + 'd ago</td>' +
        '<td class="mono">' + c.seats.toLocaleString() + '</td>' +
        '<td>' + pill(c.st) + '</td>' +
        '<td><span class="drill-x">' + CHEV + '</span></td></tr>';
    }).join('');
    tbl('pdRecent', head, body);
  }



  function renderOrders() {
    var head = '<th>Order</th><th>Account</th><th>Type</th><th>Detail</th><th>Submitted</th><th>Status</th>';
    var body = ORDERS.map(function (o) {
      return '<tr><td class="mono">' + o.id + '</td><td><b style="font-weight:600">' + o.acct + '</b></td>' +
        '<td>' + o.t + '</td><td class="muted">' + o.qty + '</td>' +
        '<td class="muted">' + o.d + '</td><td>' + pill(o.st) + '</td></tr>';
    }).join('');
    tbl('ordTable', head, body);
  }

  function renderTeam() {
    var head = '<th>Name</th><th>Email</th><th>Role</th><th>Account scope</th>';
    var body = TEAM.map(function (m) {
      return '<tr><td><span class="cell-ic"><span class="uav">' + initials(m.n) + '</span>' +
        '<b style="font-weight:600">' + m.n + '</b></span></td>' +
        '<td class="muted">' + m.e + '</td><td>' + m.r + '</td><td class="muted">' + m.sc + '</td></tr>';
    }).join('');
    tbl('teamTable', head, body);
  }

  function renderTickets() {
    /* Site rides along in the account cell's second line — an eighth column
       squeezes Subject, the field people actually scan, down to three lines. */
    var head = '<th>Ticket</th><th>Subject</th><th>Customer account &middot; site</th>' +
               '<th>Priority</th><th>Status</th><th>Raised by</th><th>Updated</th>';
    var body = TICKETS.map(function (t) {
      return '<tr>' +
        '<td class="mono">' + t.id + '</td>' +
        '<td><b style="font-weight:600">' + t.sub + '</b></td>' +
        '<td>' + acctCell(t.acct, t.loc + ' \u00b7 ' + acctId(t.acct)) + '</td>' +
        '<td>' + prio(t.pr) + '</td>' +
        '<td>' + pill(t.st) + '</td>' +
        '<td class="muted nw">' + t.by + '</td>' +
        '<td class="muted nw">' + t.upd + '</td></tr>';
    }).join('');
    tbl('tktTable', head, body);
  }

  function acctId(n) {
    for (var i = 0; i < CUSTOMERS.length; i++) if (CUSTOMERS[i].n === n) return CUSTOMERS[i].id;
    return '—';
  }

  function renderPerf() {
    var head = '<th>Account</th><th>Locations</th><th>Seats</th><th>Utilisation</th><th>Trend</th><th>Status</th>';
    var body = CUSTOMERS.map(function (c, i) {
      var util = [92, 86, 78, 96, 61, 88, 74, 55][i];
      var trend = ['+4.2%', '+2.8%', '+1.4%', '+6.1%', '+0.3%', '+3.5%', '\u22121.1%', '\u22123.4%'][i];
      return '<tr><td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="mono">' + c.loc + '</td>' +
        '<td class="mono">' + c.seats.toLocaleString() + '</td>' +
        '<td><span class="bar"><span class="t">' +
        '<span style="width:' + util + '%;background:var(--ch1)"></span></span>' +
        '<b class="mono" style="font-weight:600;font-size:12.5px">' + util + '%</b></span></td>' +
        '<td class="mono' + (trend.charAt(0) === '\u2212' ? ' neg' : '') + '">' + trend + '</td>' +
        '<td>' + pill(c.st) + '</td></tr>';
    }).join('');
    tbl('prTable', head, body);
  }

  /* ---------- routing ---------- */
  var TITLES = {
    pdash: 'Dashboard', customers: 'Customer Accounts', tickets: 'Support Tickets',
    orders: 'Orders', team: 'Partner Team', preports: 'Analytics'
  };

  /* The trail root is the partner account, and every segment before the current
     page is a link back to it. */
  function crumb(key) {
    var c = document.getElementById('pCrumb');
    var chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
    var trail = [{ t: PARTNER, go: 'pdash' }, { t: TITLES[key] }];
    if (key === 'pdash') trail = [{ t: PARTNER, go: 'pdash' }, { t: 'Dashboard' }];
    var html = trail.map(function (seg, i) {
      var last = i === trail.length - 1;
      if (last) return '<b id="crumbPage">' + seg.t + '</b>';
      return '<span class="cr-l" data-go="' + seg.go + '" tabindex="0" role="link">' + seg.t + '</span>';
    }).join(chev);
    c.innerHTML = html;
  }

  function go(key) {
    if (!TITLES[key]) key = 'pdash';
    document.querySelectorAll('.vpage').forEach(function (p) {
      p.classList.toggle('on', p.id === 'v-' + key);
    });
    document.querySelectorAll('.rail .nav-item').forEach(function (n) {
      n.classList.toggle('on', n.dataset.key === key);
    });
    crumb(key);
    document.body.classList.remove('nav-open');
    var s = document.querySelector('.scroll'); if (s) s.scrollTop = 0;
    if (location.hash !== '#' + key) history.replaceState(null, '', '#' + key);
    drawCharts();
  }

  /* Drilling into an account *is* entering that customer's control panel, so
     there is no intermediate page and no "open control panel" button. The
     partner hierarchy travels across in the query string and scope.js rebuilds
     the breadcrumb and location picker on the other side. */
  function openCustomer(id) {
    var c = CUSTOMERS.filter(function (x) { return x.id === id; })[0] || CUSTOMERS[0];
    var loc = window.PORTFOLIO.locationsFor(c.n)[0];
    location.href = 'index.html?partner=' + encodeURIComponent(PARTNER) +
      '&tier=' + tier + '&acct=' + encodeURIComponent(c.n) +
      '&loc=' + encodeURIComponent(loc.n) + '#home';
  }

  /* ---------- charts ---------- */
  function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function drawCharts() {
    if (typeof donut !== 'function') return;
    /* chart series tokens, not status tokens — same palette the control panel uses */
    var s1 = cssv('--ch-ok'), s2 = cssv('--ch5'), s3 = cssv('--ch1');
    donut('pd1', [{ v: 52, c: s1 }, { v: 31, c: s2 }, { v: 17, c: s3 }], 132, 13);
    donut('pr1', [{ v: 52, c: s1 }, { v: 31, c: s2 }, { v: 17, c: s3 }], 132, 13);
    donut('tk1', [{ v: 3, c: cssv('--ch6') }, { v: 2, c: s2 }, { v: 4, c: s1 }], 132, 13);
  }

  /* ---------- login ---------- */
  function enterApp() {
    document.body.setAttribute('data-view', 'app');
    go((location.hash || '#pdash').slice(1));
  }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('stepCred').classList.add('gone');
    document.getElementById('stepMfa').classList.remove('gone');
  });
  document.getElementById('ssoBtn').addEventListener('click', enterApp);
  document.getElementById('mfaVerify').addEventListener('click', enterApp);
  document.getElementById('mfaBack').addEventListener('click', function () {
    document.getElementById('stepMfa').classList.add('gone');
    document.getElementById('stepCred').classList.remove('gone');
  });
  document.querySelector('#stepCred .eye').addEventListener('click', function () {
    var i = document.getElementById('pPass');
    i.type = i.type === 'password' ? 'text' : 'password';
  });

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-go]');
    if (nav) { go(nav.dataset.go); return; }

    var row = e.target.closest('tr.drill');
    if (row && row.dataset.cust) openCustomer(row.dataset.cust);
  });

  /* crumb links and drill rows are reachable by keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('.cr-l[data-go], tr.drill[data-cust]');
    if (!t) return;
    e.preventDefault();
    if (t.dataset.go) go(t.dataset.go); else openCustomer(t.dataset.cust);
  });

  window.addEventListener('hashchange', function () {
    if (document.body.getAttribute('data-view') === 'app') go(location.hash.slice(1));
  });

  /* ---------- tooltips (mirrors the control panel engine) ---------- */
  (function () {
    var tip = null, timer = null, cur = null;
    function label(el) { return el.dataset.tip || ''; }
    function hide() { if (timer) { clearTimeout(timer); timer = null; } if (tip) { tip.remove(); tip = null; } cur = null; }
    function place(el, txt) {
      if (tip) tip.remove();
      tip = document.createElement('div'); tip.className = 'tip';
      tip.textContent = txt; document.body.appendChild(tip);
      var r = el.getBoundingClientRect(), tr = tip.getBoundingClientRect(), gap = 9;
      var pos = el.dataset.tipPos || (el.classList.contains('nav-item') ? 'right' : 'bottom'), x, y;
      if (pos === 'right') { x = r.right + gap; y = r.top + r.height / 2 - tr.height / 2; }
      else { x = r.left + r.width / 2 - tr.width / 2; y = r.bottom + gap; }
      x = Math.max(8, Math.min(x, innerWidth - tr.width - 8));
      y = Math.max(8, Math.min(y, innerHeight - tr.height - 8));
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tip.classList.add('t-' + pos);
      if (el.classList.contains('info-dot')) tip.classList.add('tip-rich');
      void tip.offsetWidth; tip.classList.add('show');
    }
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest('[data-tip]'); if (!el || el === cur) return;
      var txt = label(el); if (!txt) { hide(); return; }
      hide(); cur = el; timer = setTimeout(function () { place(el, txt); }, 380);
    });
    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest('[data-tip]'); if (el && el === cur) hide();
    });
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest('[data-tip]'); if (!el) return;
      var txt = label(el); if (!txt) return; hide(); cur = el; place(el, txt);
    });
    document.addEventListener('focusout', function (e) {
      var el = e.target.closest('[data-tip]'); if (el && el === cur) hide();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
    window.addEventListener('scroll', hide, true);
    document.querySelectorAll('.info-dot[data-tip]').forEach(function (d) {
      if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '0');
      if (!d.hasAttribute('role')) d.setAttribute('role', 'note');
      if (!d.hasAttribute('aria-label')) d.setAttribute('aria-label', d.dataset.tip);
    });
  })();

  /* ---------- boot ---------- */
  renderCustomers(); renderRecent(); renderOrders(); renderTeam();
  renderPerf(); renderTickets();
  document.getElementById('scopeV').textContent = tierCfg().label;
  document.getElementById('tsw').addEventListener('click', function () { setTimeout(drawCharts, 0); });

  /* A partner user belongs to exactly one partner account, so the switcher is
     for Sangoma staff only. Everyone else gets a plain label. */
  (function () {
    var acct = document.querySelector('#pRail .acct');
    if (!acct) return;
    document.getElementById('partnerName').textContent = PARTNER;
    if (isSangomaAdmin) {
      acct.dataset.tip = 'Sangoma admin — switch partner account';
      return;
    }
    acct.classList.add('static');
    acct.removeAttribute('tabindex');
    acct.removeAttribute('role');
    var chev = acct.querySelector('svg');
    if (chev) chev.remove();
  })();

  /* deep link: partner.html?view=app#customers lands straight in the shell */
  var q = new URLSearchParams(location.search);
  if (q.get('tier')) { tier = q.get('tier'); localStorage.setItem('pTier', tier);
    document.getElementById('scopeV').textContent = tierCfg().label; }
  if (q.get('view') === 'app') enterApp();

  window.pGo = go;
  window.pOpenCustomer = openCustomer;
  window.pDrawCharts = drawCharts;
})();
