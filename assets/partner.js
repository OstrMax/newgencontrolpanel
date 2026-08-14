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

  /* ---------- data ---------- */
  var CUSTOMERS = [
    { id: 'SNG-40218', n: 'Acme Manufacturing', ind: 'Manufacturing', loc: 6, seats: 840,  dids: 312, svc: ['Voice', 'Chat', 'Meet'], st: 'Active'  },
    { id: 'SNG-40219', n: 'Belmont Health',     ind: 'Healthcare',    loc: 14, seats: 1240, dids: 486, svc: ['Voice', 'Chat'],         st: 'Active'  },
    { id: 'SNG-40224', n: 'Cascade Logistics',  ind: 'Transport',     loc: 9,  seats: 610,  dids: 240, svc: ['Voice', 'Meet'],         st: 'Active'  },
    { id: 'SNG-40231', n: 'Harbor Point Legal', ind: 'Professional',  loc: 2,  seats: 180,  dids: 64,  svc: ['Voice', 'Chat', 'Meet'], st: 'Active'  },
    { id: 'SNG-40240', n: 'Northgate Retail',   ind: 'Retail',        loc: 22, seats: 980,  dids: 410, svc: ['Voice'],                 st: 'Trial'   },
    { id: 'SNG-40255', n: 'Pinnacle Financial', ind: 'Finance',       loc: 4,  seats: 520,  dids: 196, svc: ['Voice', 'Chat'],         st: 'Active'  },
    { id: 'SNG-40261', n: 'Riverstone Schools', ind: 'Education',     loc: 11, seats: 760,  dids: 288, svc: ['Voice', 'Meet'],         st: 'Active'  },
    { id: 'SNG-40272', n: 'Summit Hospitality', ind: 'Hospitality',   loc: 7,  seats: 340,  dids: 130, svc: ['Voice', 'Chat'],         st: 'Suspended' }
  ];

  var LOCATIONS = [
    { n: 'Austin HQ',        code: 'ATX-01', addr: '1400 Congress Ave, Austin, TX 78701',   ext: 248, did: 96, usr: 236, st: 'Live' },
    { n: 'Round Rock Plant', code: 'ATX-02', addr: '2201 Chisholm Trail, Round Rock, TX',   ext: 180, did: 62, usr: 174, st: 'Live' },
    { n: 'Dallas Depot',     code: 'DFW-01', addr: '740 Riverfront Blvd, Dallas, TX 75207', ext: 122, did: 48, usr: 118, st: 'Live' },
    { n: 'Houston Yard',     code: 'HOU-01', addr: '3300 Navigation Blvd, Houston, TX',     ext: 96,  did: 40, usr: 92,  st: 'Live' },
    { n: 'Phoenix Annex',    code: 'PHX-01', addr: '55 N Central Ave, Phoenix, AZ 85004',   ext: 118, did: 44, usr: 108, st: 'Provisioning' },
    { n: 'Remote Workers',   code: 'REM-01', addr: 'Distributed — no fixed site',           ext: 76,  did: 22, usr: 112, st: 'Live' }
  ];

  var LOC_USERS = [
    { n: 'Ralph Edwards',   e: 'redwards@acme-mfg.com',  ext: '2041', did: '+1 512 555 0141', lic: 'Premium'  },
    { n: 'Leslie Alexander', e: 'lalexander@acme-mfg.com', ext: '2042', did: '+1 512 555 0142', lic: 'Advanced' },
    { n: 'Theresa Webb',    e: 'twebb@acme-mfg.com',     ext: '2043', did: '—',               lic: 'Advanced' },
    { n: 'Guy Hawkins',     e: 'ghawkins@acme-mfg.com',  ext: '2044', did: '+1 512 555 0144', lic: 'Premium'  },
    { n: 'Savannah Nguyen', e: 'snguyen@acme-mfg.com',   ext: '2045', did: '—',               lic: 'Standard' },
    { n: 'Darrell Steward', e: 'dsteward@acme-mfg.com',  ext: '2046', did: '+1 512 555 0146', lic: 'Advanced' }
  ];

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

  /* ---------- helpers ---------- */
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  function initials(n) {
    return n.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function pill(s) {
    var m = { Active: 'ok', Live: 'ok', Completed: 'ok', Trial: 'warn', Provisioning: 'warn',
              'In progress': 'warn', 'Awaiting FOC': 'warn', Suspended: 'bad', Blocked: 'bad' };
    return '<span class="pill ' + (m[s] || '') + '">' + s + '</span>';
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

  function renderLocations() {
    var head = '<th>Location</th><th>Address</th><th>Extensions</th><th>DIDs</th><th>Users</th><th>Status</th><th style="width:44px"></th>';
    var body = LOCATIONS.map(function (l, i) {
      return '<tr class="drill" data-loc="' + i + '">' +
        '<td><span class="acc-cell"><span class="loc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg></span>' +
        '<span class="acc-nm"><b>' + l.n + '</b><span>' + l.code + '</span></span></span></td>' +
        '<td class="muted"><span class="trunc">' + l.addr + '</span></td>' +
        '<td class="mono">' + l.ext + '</td><td class="mono">' + l.did + '</td><td class="mono">' + l.usr + '</td>' +
        '<td>' + pill(l.st) + '</td>' +
        '<td><span class="drill-x">' + CHEV + '</span></td></tr>';
    }).join('');
    tbl('locTable', head, body);
  }

  function renderLocUsers() {
    var head = '<th>User Name</th><th>Email</th><th>Extension</th><th>Direct Number</th><th>License</th>';
    var body = LOC_USERS.map(function (u) {
      return '<tr><td><span class="cell-ic"><span class="uav">' + initials(u.n) + '</span>' +
        '<b style="font-weight:600">' + u.n + '</b></span></td>' +
        '<td class="muted">' + u.e + '</td><td class="mono">' + u.ext + '</td>' +
        '<td class="mono">' + u.did + '</td><td>' + u.lic + '</td></tr>';
    }).join('');
    tbl('locUsers', head, body);
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
    pdash: 'Dashboard', customers: 'Customer Accounts', customer: 'Account',
    location: 'Location', orders: 'Orders', team: 'Partner Team', preports: 'Analytics'
  };
  var NAV_FOR = { customer: 'customers', location: 'customers' };

  function crumb(key) {
    var c = document.getElementById('pCrumb');
    var chev = ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg> ';
    var trail = ['Partner Portal'];
    if (key === 'customer') trail.push('Customer Accounts', current.n);
    else if (key === 'location') trail.push('Customer Accounts', current.n, currentLoc.n);
    else trail.push(TITLES[key]);
    c.innerHTML = trail.slice(0, -1).map(function (t) { return t; }).join(chev) +
                  chev + '<b id="crumbPage">' + trail[trail.length - 1] + '</b>';
  }

  var current = CUSTOMERS[0], currentLoc = LOCATIONS[0];

  function go(key) {
    if (!TITLES[key]) key = 'pdash';
    document.querySelectorAll('.vpage').forEach(function (p) {
      p.classList.toggle('on', p.id === 'v-' + key);
    });
    var navKey = NAV_FOR[key] || key;
    document.querySelectorAll('.rail .nav-item').forEach(function (n) {
      n.classList.toggle('on', n.dataset.key === navKey);
    });
    crumb(key);
    document.body.classList.remove('nav-open');
    var s = document.querySelector('.scroll'); if (s) s.scrollTop = 0;
    if (location.hash !== '#' + key) history.replaceState(null, '', '#' + key);
    drawCharts();
  }

  function openCustomer(id) {
    current = CUSTOMERS.filter(function (c) { return c.id === id; })[0] || CUSTOMERS[0];
    document.getElementById('custTtl').textContent = current.n;
    document.getElementById('tierCust').textContent = current.n;
    document.getElementById('tierCust2').textContent = current.n;
    document.getElementById('custSub').textContent =
      'Account ID ' + current.id + ' · ' + current.ind + ' · ' + current.loc + ' locations';
    document.getElementById('cLoc').textContent = current.loc;
    document.getElementById('cSeat').textContent = current.seats.toLocaleString();
    document.getElementById('cDid').textContent = current.dids;
    go('customer');
  }

  function openLocation(i) {
    currentLoc = LOCATIONS[i] || LOCATIONS[0];
    document.getElementById('locTtl').textContent = currentLoc.n;
    document.getElementById('tierLoc').textContent = currentLoc.n;
    document.getElementById('locSub').textContent =
      currentLoc.addr + ' · Site code ' + currentLoc.code;
    go('location');
  }

  /* ---------- charts ---------- */
  function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function drawCharts() {
    if (typeof donut !== 'function') return;
    /* chart series tokens, not status tokens — same palette the control panel uses */
    var s1 = cssv('--ch-ok'), s2 = cssv('--ch5'), s3 = cssv('--ch1');
    donut('pd1', [{ v: 52, c: s1 }, { v: 31, c: s2 }, { v: 17, c: s3 }], 132, 13);
    donut('pr1', [{ v: 52, c: s1 }, { v: 31, c: s2 }, { v: 17, c: s3 }], 132, 13);
    donut('ld1', [{ v: 248, c: s1 }, { v: 96, c: s2 }], 132, 13);
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
    if (row) {
      if (row.dataset.cust) openCustomer(row.dataset.cust);
      else if (row.dataset.loc) openLocation(+row.dataset.loc);
      return;
    }

    if (e.target.closest('#openCp')) {
      location.href = 'index.html?partner=Northwind+Communications&tier=' + tier +
                      '&acct=' + encodeURIComponent(current.n) + '#home';
    }
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
  renderCustomers(); renderRecent(); renderLocations();
  renderLocUsers(); renderOrders(); renderTeam(); renderPerf();
  document.getElementById('scopeV').textContent = tierCfg().label;
  document.getElementById('tsw').addEventListener('click', function () { setTimeout(drawCharts, 0); });

  /* deep link: partner.html?view=app#customers lands straight in the shell */
  var q = new URLSearchParams(location.search);
  if (q.get('tier')) { tier = q.get('tier'); localStorage.setItem('pTier', tier);
    document.getElementById('scopeV').textContent = tierCfg().label; }
  if (q.get('view') === 'app') enterApp();

  window.pGo = go;
  window.pOpenCustomer = openCustomer;
  window.pOpenLocation = openLocation;
  window.pDrawCharts = drawCharts;
})();
