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


  /* quote / order grid — RQQID is the quote-request id, ID the order number.
     NRC = one-time charge, RC = monthly recurring. Saved date is US Central. */
  var ORDERS = [
    { rqq: 'RQQ-100482', id: '884012', cust: 'Acme Manufacturing', qt: 'Standard',  ot: 'New',     nrc: 4200, rc: 3180, st: 'Submitted', saved: '12 May 2024 · 09:41 CT', title: 'Austin HQ — 40 Premium seats',       owner: 'Michael Okafor',  partner: 'Northwind Communications' },
    { rqq: 'RQQ-100479', id: '884006', cust: 'Belmont Health',     qt: 'Bundle',    ot: 'Port',    nrc: 1860, rc: 5240, st: 'In Review', saved: '09 May 2024 · 14:08 CT', title: 'Riverside — 86 DID number port',      owner: 'Dana Whitfield',  partner: 'Northwind Communications' },
    { rqq: 'RQQ-100471', id: '883994', cust: 'Northgate Retail',   qt: 'Standard',  ot: 'New',     nrc: 3120, rc: 2680, st: 'Draft',     saved: '06 May 2024 · 11:22 CT', title: 'Tacoma WA — new location build',      owner: 'Michael Okafor',  partner: 'Northwind Communications' },
    { rqq: 'RQQ-100468', id: '883977', cust: 'Cascade Logistics',  qt: 'Amendment', ot: 'Upgrade', nrc: 0,    rc: 6120, st: 'Approved',  saved: '02 May 2024 · 16:50 CT', title: '+120 Advanced seat upgrade',          owner: 'Priya Raman',     partner: 'Northwind Communications' },
    { rqq: 'RQQ-100460', id: '883951', cust: 'Pinnacle Financial', qt: 'Standard',  ot: 'New',     nrc: 5400, rc: 1980, st: 'Ordered',   saved: '28 Apr 2024 · 08:15 CT', title: 'Head Office — 60 handset shipment',   owner: 'Grace Bell',      partner: 'Northwind Communications' },
    { rqq: 'RQQ-100455', id: '883940', cust: 'Summit Hospitality', qt: 'Bundle',    ot: 'Port',    nrc: 980,  rc: 1440, st: 'Rejected',  saved: '24 Apr 2024 · 13:37 CT', title: '24 DID port — carrier reject',        owner: 'Tomas Lindqvist', partner: 'Northwind Communications' },
    { rqq: 'RQQ-100448', id: '883922', cust: 'Riverstone Schools', qt: 'Standard',  ot: 'Renewal', nrc: 0,    rc: 4360, st: 'Approved',  saved: '21 Apr 2024 · 10:04 CT', title: 'Annual renewal — 760 seats',          owner: 'Grace Bell',      partner: 'Northwind Communications' },
    { rqq: 'RQQ-100441', id: '883910', cust: 'Harbor Point Legal', qt: 'Standard',  ot: 'New',     nrc: 1240, rc: 1120, st: 'Submitted', saved: '18 Apr 2024 · 15:29 CT', title: 'Meet add-on — 180 seats',             owner: 'Dana Whitfield',  partner: 'Northwind Communications' },
    { rqq: 'RQQ-100437', id: '883901', cust: 'Acme Manufacturing', qt: 'Amendment', ot: 'Upgrade', nrc: 0,    rc: 920,  st: 'In Review', saved: '15 Apr 2024 · 09:12 CT', title: 'Dallas Depot — 12 seat add',          owner: 'Priya Raman',     partner: 'Northwind Communications' },
    { rqq: 'RQQ-100429', id: '883888', cust: 'Belmont Health',     qt: 'Standard',  ot: 'New',     nrc: 2680, rc: 2210, st: 'Draft',     saved: '11 Apr 2024 · 17:41 CT', title: 'Eastgate Clinic — new site',          owner: 'Michael Okafor',  partner: 'Northwind Communications' },
    { rqq: 'RQQ-100420', id: '883874', cust: 'Cascade Logistics',  qt: 'Bundle',    ot: 'Port',    nrc: 1520, rc: 3040, st: 'Ordered',   saved: '08 Apr 2024 · 12:55 CT', title: 'Dallas — 48 DID port + seats',        owner: 'Grace Bell',      partner: 'Northwind Communications' },
    { rqq: 'RQQ-100413', id: '883860', cust: 'Northgate Retail',   qt: 'Standard',  ot: 'Renewal', nrc: 0,    rc: 2980, st: 'Approved',  saved: '04 Apr 2024 · 08:47 CT', title: 'Trial → paid conversion',             owner: 'Tomas Lindqvist', partner: 'Northwind Communications' }
  ];

  /* order/quote grid runtime state */
  var ordS = { q: '', st: '', ot: '', qt: '', page: 1, size: 8, sel: {} };

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
    var m = { Active: 'ok', Live: 'ok', Completed: 'ok', Resolved: 'ok', Approved: 'ok', Ordered: 'info',
              Trial: 'warn', Provisioning: 'warn', 'In progress': 'warn', 'Awaiting FOC': 'warn',
              'Awaiting Sangoma': 'warn', 'Awaiting customer': 'warn', Submitted: 'warn', 'In Review': 'warn',
              Draft: 'deg', Expired: 'deg', Suspended: 'bad', Blocked: 'bad', Open: 'bad', Rejected: 'bad' };
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
    var head = '<th>Account</th><th>Locations</th><th>Services</th><th>Status</th><th style="width:44px"></th>';
    var body = CUSTOMERS.map(function (c) {
      return '<tr class="drill" data-cust="' + c.id + '">' +
        '<td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="mono">' + c.loc + '</td>' +
        '<td>' + c.svc.map(function (s) { return '<span class="tag">' + s + '</span>'; }).join(' ') + '</td>' +
        '<td>' + pill(c.st) + '</td>' +
        '<td><span class="kebab" data-custmenu="' + c.id + '" tabindex="0" role="button" aria-label="Account actions">' + KEBAB + '</span></td></tr>';
    }).join('');
    tbl('custTable', head, body);
  }

  function renderRecent() {
    var head = '<th>Account</th><th>Last activity</th><th>Status</th><th style="width:44px"></th>';
    var body = CUSTOMERS.slice(0, 5).map(function (c, i) {
      var act = ['Seats assigned', 'Location added', 'Order submitted', 'User invited', 'License changed'][i];
      return '<tr class="drill" data-cust="' + c.id + '">' +
        '<td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="muted">' + act + ' · ' + (i + 1) + 'd ago</td>' +
        '<td>' + pill(c.st) + '</td>' +
        '<td><span class="drill-x">' + CHEV + '</span></td></tr>';
    }).join('');
    tbl('pdRecent', head, body);
  }



  var KEBAB = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>';

  function money(n) { return '$' + n.toLocaleString('en-US'); }

  function ordFiltered() {
    var q = ordS.q.trim().toLowerCase();
    return ORDERS.filter(function (o) {
      if (ordS.st && o.st !== ordS.st) return false;
      if (ordS.ot && o.ot !== ordS.ot) return false;
      if (ordS.qt && o.qt !== ordS.qt) return false;
      if (q) {
        var hay = (o.rqq + ' ' + o.id + ' ' + o.cust + ' ' + o.title + ' ' + o.owner).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderOrders() {
    var rows = ordFiltered();
    var size = ordS.size, pages = Math.max(1, Math.ceil(rows.length / size));
    if (ordS.page > pages) ordS.page = pages;
    var start = (ordS.page - 1) * size, slice = rows.slice(start, start + size);

    var head = '<th class="ckc"><input type="checkbox" class="ck" id="ordAll" aria-label="Select all quotes"></th>' +
      '<th>RQQID</th><th>ID</th><th>Customer Name</th><th>Quote Type</th><th>Order Type</th>' +
      '<th class="num">NRC</th><th class="num">RC</th><th>Status</th><th>Saved Date (Central)</th>' +
      '<th>Quote Title</th><th>Quote Owner</th><th>Partner</th><th style="width:44px"></th>';

    var body;
    if (!slice.length) {
      body = '<tr><td colspan="14"><div class="grid-empty">No quotes match your filters.</div></td></tr>';
    } else {
      body = slice.map(function (o) {
        var on = !!ordS.sel[o.rqq];
        return '<tr data-rqq="' + o.rqq + '"' + (on ? ' class="sel-row"' : '') + '>' +
          '<td class="ckc"><input type="checkbox" class="ck ord-ck" data-rqq="' + o.rqq + '"' + (on ? ' checked' : '') + ' aria-label="Select ' + o.rqq + '"></td>' +
          '<td class="mono">' + o.rqq + '</td>' +
          '<td class="mono">' + o.id + '</td>' +
          '<td><b style="font-weight:600">' + o.cust + '</b></td>' +
          '<td>' + o.qt + '</td>' +
          '<td>' + o.ot + '</td>' +
          '<td class="num">' + money(o.nrc) + '</td>' +
          '<td class="num">' + money(o.rc) + '</td>' +
          '<td>' + pill(o.st) + '</td>' +
          '<td class="muted nw">' + o.saved + '</td>' +
          '<td><span class="q-title" title="' + o.title + '">' + o.title + '</span></td>' +
          '<td class="muted nw">' + o.owner + '</td>' +
          '<td class="muted nw">' + o.partner + '</td>' +
          '<td><span class="kebab" data-ordmenu="' + o.rqq + '" tabindex="0" role="button" aria-label="Quote actions">' + KEBAB + '</span></td>' +
          '</tr>';
      }).join('');
    }
    tbl('ordTable', head, body);
    renderOrdPager(rows.length, pages);
    syncOrdHead(slice);
    updateOrdBulk();
  }

  function renderOrdPager(total, pages) {
    var p = document.getElementById('ordPager'); if (!p) return;
    var size = ordS.size, cur = ordS.page;
    var start = total ? (cur - 1) * size + 1 : 0, end = Math.min(cur * size, total);
    var nums = '';
    for (var i = 1; i <= pages; i++) {
      if (pages > 7 && i > 1 && i < pages && Math.abs(i - cur) > 1) {
        if (i === 2 || i === pages - 1) nums += '<span class="pg-ell">…</span>';
        continue;
      }
      nums += '<button class="pg' + (i === cur ? ' on' : '') + '" data-pg="' + i + '">' + i + '</button>';
    }
    p.innerHTML =
      '<span class="rng">' + start + '\u2013' + end + ' of ' + total + '</span>' +
      '<span class="pg-sp"></span>' +
      '<div class="pg-btns">' +
        '<button class="pg" data-pg="prev"' + (cur <= 1 ? ' disabled' : '') + ' aria-label="Previous page">\u2039</button>' +
        nums +
        '<button class="pg" data-pg="next"' + (cur >= pages ? ' disabled' : '') + ' aria-label="Next page">\u203a</button>' +
      '</div>' +
      '<div class="psize">Rows <select id="ordSize">' +
        [8, 15, 25].map(function (n) { return '<option' + (n === size ? ' selected' : '') + '>' + n + '</option>'; }).join('') +
      '</select></div>';
  }

  function syncOrdHead(slice) {
    var all = document.getElementById('ordAll'); if (!all) return;
    var vis = slice.map(function (o) { return o.rqq; });
    var n = vis.filter(function (r) { return ordS.sel[r]; }).length;
    all.checked = vis.length > 0 && n === vis.length;
    all.indeterminate = n > 0 && n < vis.length;
  }

  function ordSelCount() {
    return Object.keys(ordS.sel).filter(function (k) { return ordS.sel[k]; }).length;
  }

  function updateOrdBulk() {
    var bar = document.getElementById('ordBulk'); if (!bar) return;
    var n = ordSelCount();
    document.getElementById('ordSelN').textContent = n;
    bar.hidden = n === 0;
  }

  function ordByRqq(r) {
    for (var i = 0; i < ORDERS.length; i++) if (ORDERS[i].rqq === r) return ORDERS[i];
    return null;
  }

  function renderTeam() {
    var head = '<th>Name</th><th>Email</th><th>Role</th><th>Account scope</th><th style="width:44px"></th>';
    var body = TEAM.map(function (m) {
      return '<tr><td><span class="cell-ic"><span class="uav">' + initials(m.n) + '</span>' +
        '<b style="font-weight:600">' + m.n + '</b></span></td>' +
        '<td class="muted">' + m.e + '</td><td>' + m.r + '</td><td class="muted">' + m.sc + '</td>' +
        '<td><span class="kebab" data-teammenu="' + m.e + '" tabindex="0" role="button" aria-label="Member actions">' + KEBAB + '</span></td></tr>';
    }).join('');
    tbl('teamTable', head, body);
  }

  function renderTickets() {
    /* Site rides along in the account cell's second line — an eighth column
       squeezes Subject, the field people actually scan, down to three lines. */
    var head = '<th>Ticket</th><th>Subject</th><th>Customer account &middot; site</th>' +
               '<th>Priority</th><th>Status</th><th>Raised by</th><th>Updated</th><th style="width:44px"></th>';
    var body = TICKETS.map(function (t) {
      return '<tr>' +
        '<td class="mono">' + t.id + '</td>' +
        '<td><b style="font-weight:600">' + t.sub + '</b></td>' +
        '<td>' + acctCell(t.acct, t.loc + ' \u00b7 ' + acctId(t.acct)) + '</td>' +
        '<td>' + prio(t.pr) + '</td>' +
        '<td>' + pill(t.st) + '</td>' +
        '<td class="muted nw">' + t.by + '</td>' +
        '<td class="muted nw">' + t.upd + '</td>' +
        '<td><span class="kebab" data-tktmenu="' + t.id + '" tabindex="0" role="button" aria-label="Ticket actions">' + KEBAB + '</span></td></tr>';
    }).join('');
    tbl('tktTable', head, body);
  }

  function acctId(n) {
    for (var i = 0; i < CUSTOMERS.length; i++) if (CUSTOMERS[i].n === n) return CUSTOMERS[i].id;
    return '—';
  }

  function renderPerf() {
    var head = '<th>Account</th><th>Locations</th><th>Utilisation</th><th>Trend</th><th>Status</th>';
    var body = CUSTOMERS.map(function (c, i) {
      var util = [92, 86, 78, 96, 61, 88, 74, 55][i];
      var trend = ['+4.2%', '+2.8%', '+1.4%', '+6.1%', '+0.3%', '+3.5%', '\u22121.1%', '\u22123.4%'][i];
      return '<tr><td>' + acctCell(c.n, c.id) + '</td>' +
        '<td class="mono">' + c.loc + '</td>' +
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
    orders: 'Orders & Quotes', team: 'Partner Team', preports: 'Analytics', netops: 'NetOps Dashboard'
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
    if (key === 'netops') netopsEnsure();
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

  /* ==========================================================
     Dialogs, toasts and row menus — the partner portal is
     self-contained (no panels.js), so it ships its own light
     modal + toast + floating-menu primitives.
     ========================================================== */
  var IC = {
    view:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    edit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    copy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    dl:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    info:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    x:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    key:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 8.3-8.3"/><path d="m16 5 3 3"/><path d="m13 8 3 3"/></svg>'
  };

  var toastWrap = null;
  function pToast(kind, msg) {
    if (!toastWrap) { toastWrap = document.createElement('div'); toastWrap.className = 'p-toasts'; document.body.appendChild(toastWrap); }
    var t = document.createElement('div'); t.className = 'p-toast ' + (kind || 'ok');
    var ic = kind === 'err' ? IC.alert : kind === 'info' ? IC.info : IC.check;
    t.innerHTML = '<span class="ti">' + ic + '</span><span>' + msg + '</span>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 240); }, 3200);
  }

  /* modal dialog. opts: {icon, iconKind, title, sub, body(html), wide,
     actions:[{label, kind:'p'|'ghost'|'danger', close, act}]}  -> returns {close, root} */
  function pDialog(opts) {
    var scrim = document.createElement('div'); scrim.className = 'pm-scrim';
    var acts = (opts.actions || [{ label: 'Close', kind: 'ghost', close: true }]).map(function (a, i) {
      var cls = a.kind === 'p' ? 'btn btn-p' : a.kind === 'danger' ? 'btn btn-ghost danger' : 'btn btn-ghost';
      return '<button class="' + cls + '" data-ai="' + i + '"><span class="lbl">' + a.label + '</span></button>';
    }).join('');
    scrim.innerHTML =
      '<div class="pm' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + (opts.title || 'Dialog') + '">' +
        '<div class="pm-h">' +
          (opts.icon ? '<span class="pm-ic ' + (opts.iconKind || '') + '">' + opts.icon + '</span>' : '') +
          '<div class="pm-hd"><div class="pm-ttl">' + (opts.title || '') + '</div>' +
            (opts.sub ? '<div class="pm-sub">' + opts.sub + '</div>' : '') + '</div>' +
          '<button class="pm-x" aria-label="Close">' + IC.x + '</button>' +
        '</div>' +
        (opts.body ? '<div class="pm-b">' + opts.body + '</div>' : '') +
        (acts ? '<div class="pm-f">' + acts + '</div>' : '') +
      '</div>';
    document.body.appendChild(scrim);
    requestAnimationFrame(function () { scrim.classList.add('show'); });

    function close() {
      scrim.classList.remove('show');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(function () { scrim.remove(); }, 200);
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    scrim.querySelector('.pm-x').addEventListener('click', close);
    (opts.actions || []).forEach(function (a, i) {
      var btn = scrim.querySelector('[data-ai="' + i + '"]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var keep = a.act && a.act(scrim) === false;
        if (a.close !== false && !keep) close();
      });
    });
    var focusEl = scrim.querySelector('.pm-b input,.pm-b textarea,.pm-b select') || scrim.querySelector('.pm-f .btn-p') || scrim.querySelector('.pm-x');
    if (focusEl) focusEl.focus();
    return { close: close, root: scrim };
  }

  /* floating action menu near an anchor. items:[{label,icon,danger,sep,act}] */
  var openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; document.removeEventListener('click', closeMenu, true); document.removeEventListener('keydown', menuKey, true); } }
  function menuKey(e) { if (e.key === 'Escape') closeMenu(); }
  function pMenu(anchor, items) {
    closeMenu();
    var m = document.createElement('div'); m.className = 'pop-menu';
    m.innerHTML = items.map(function (it) {
      if (it.sep) return '<div class="sepr"></div>';
      return '<div class="mi' + (it.danger ? ' danger' : '') + '" data-k="' + it.k + '">' + (it.icon || '') + '<span>' + it.label + '</span></div>';
    }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    var x = Math.min(r.right - mw, innerWidth - mw - 8), y = r.bottom + 6;
    if (y + mh > innerHeight - 8) y = r.top - mh - 6;
    m.style.left = Math.max(8, x) + 'px'; m.style.top = Math.max(8, y) + 'px';
    m.addEventListener('click', function (e) {
      var mi = e.target.closest('.mi'); if (!mi) return;
      var it = items.filter(function (i) { return i.k === mi.dataset.k; })[0];
      closeMenu(); if (it && it.act) it.act();
    });
    openMenu = m;
    setTimeout(function () { document.addEventListener('click', closeMenu, true); document.addEventListener('keydown', menuKey, true); }, 0);
  }

  /* ---------- Orders & Quotes: dialogs ---------- */
  function quoteDetail(o) {
    var body = '<div class="pm-list">' +
      kv('RQQID', o.rqq) + kv('Order ID', o.id) + kv('Customer', o.cust) +
      kv('Quote Type', o.qt) + kv('Order Type', o.ot) +
      kv('NRC (one-time)', money(o.nrc)) + kv('RC (monthly)', money(o.rc)) +
      kv('Status', o.st) + kv('Saved', o.saved) + kv('Quote Owner', o.owner) +
      kv('Partner', o.partner) + '</div>';
    pDialog({
      icon: IC.view, iconKind: '', wide: true,
      title: o.title, sub: o.rqq + ' · ' + o.cust,
      body: body,
      actions: [
        { label: 'Download PDF', kind: 'ghost', act: function () { pToast('ok', 'Quote ' + o.rqq + ' exported to PDF.'); return false; }, close: false },
        { label: 'Close', kind: 'ghost' }
      ]
    });
  }
  function kv(k, v) { return '<div class="pm-kv"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; }

  function submitQuote(o) {
    pDialog({
      icon: IC.send, iconKind: '', title: 'Submit quote to Sangoma?',
      sub: o.rqq + ' · ' + o.cust,
      body: '<div class="pm-note">' + IC.info + '<span>Once submitted the quote is locked for pricing review. You will be notified when it is approved or returned.</span></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Submit quote', kind: 'p', act: function () { o.st = 'Submitted'; renderOrders(); pToast('ok', o.rqq + ' submitted for review.'); } }
      ]
    });
  }
  function duplicateQuote(o) {
    pDialog({
      icon: IC.copy, title: 'Duplicate quote', sub: o.rqq,
      body: '<div class="field"><label>New quote title</label><input class="inp" id="dupTitle" value="' + o.title + ' (copy)"></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Create copy', kind: 'p', act: function (root) {
          var t = root.querySelector('#dupTitle').value.trim() || o.title + ' (copy)';
          var n = JSON.parse(JSON.stringify(o));
          n.rqq = 'RQQ-' + (100483 + Math.floor(Math.random() * 400));
          n.id = '' + (884020 + Math.floor(Math.random() * 400)); n.title = t; n.st = 'Draft';
          n.saved = 'Just now · CT'; ORDERS.unshift(n); ordS.page = 1; renderOrders();
          pToast('ok', 'Created ' + n.rqq + '.');
        } }
      ]
    });
  }
  function deleteQuote(list) {
    var many = list.length > 1;
    pDialog({
      icon: IC.trash, iconKind: 'bad',
      title: many ? 'Delete ' + list.length + ' quotes?' : 'Delete quote ' + list[0].rqq + '?',
      sub: 'This action cannot be undone.',
      body: '<div class="pm-note bad">' + IC.alert + '<span>Deleting ' + (many ? 'these quotes' : 'this quote') + ' removes ' +
            (many ? 'them' : 'it') + ' permanently from your partner workspace.</span></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: many ? 'Delete quotes' : 'Delete quote', kind: 'danger', act: function () {
          var rm = {}; list.forEach(function (o) { rm[o.rqq] = 1; ordS.sel[o.rqq] = false; });
          for (var i = ORDERS.length - 1; i >= 0; i--) if (rm[ORDERS[i].rqq]) ORDERS.splice(i, 1);
          renderOrders(); pToast('ok', (many ? list.length + ' quotes' : list[0].rqq) + ' deleted.');
        } }
      ]
    });
  }
  function newQuoteDialog() {
    var opts = CUSTOMERS.map(function (c) { return '<option>' + c.n + '</option>'; }).join('');
    pDialog({
      icon: IC.edit, title: 'New quote', sub: 'Draft a quote on behalf of a customer',
      wide: true,
      body:
        '<div class="field"><label>Customer</label><select class="inp">' + opts + '</select></div>' +
        '<div class="field row2">' +
          '<div><label>Quote Type</label><select class="inp"><option>Standard</option><option>Bundle</option><option>Amendment</option></select></div>' +
          '<div><label>Order Type</label><select class="inp"><option>New</option><option>Upgrade</option><option>Renewal</option><option>Port</option></select></div>' +
        '</div>' +
        '<div class="field"><label>Quote title</label><input class="inp" id="nqTitle" placeholder="e.g. Austin HQ — 40 Premium seats"></div>' +
        '<div class="field row2">' +
          '<div><label>NRC (one-time)</label><input class="inp" id="nqNrc" value="0"></div>' +
          '<div><label>RC (monthly)</label><input class="inp" id="nqRc" value="0"></div>' +
        '</div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Save draft', kind: 'p', act: function (root) {
          var sels = root.querySelectorAll('select'); var title = root.querySelector('#nqTitle').value.trim();
          if (!title) { pToast('err', 'Add a quote title first.'); return false; }
          var n = { rqq: 'RQQ-' + (100483 + Math.floor(Math.random() * 400)), id: '' + (884020 + Math.floor(Math.random() * 400)),
            cust: sels[0].value, qt: sels[1].value, ot: sels[2].value,
            nrc: parseInt(root.querySelector('#nqNrc').value, 10) || 0, rc: parseInt(root.querySelector('#nqRc').value, 10) || 0,
            st: 'Draft', saved: 'Just now · CT', title: title, owner: 'Michael Okafor', partner: PARTNER };
          ORDERS.unshift(n); ordS.page = 1; ordS.q = ''; var si = document.getElementById('ordSearch'); if (si) si.value = '';
          renderOrders(); pToast('ok', 'Draft ' + n.rqq + ' created.');
        } }
      ]
    });
  }

  function rowMenuItems(o) {
    var items = [
      { k: 'view', label: 'View quote', icon: IC.view, act: function () { quoteDetail(o); } },
      { k: 'edit', label: 'Edit quote', icon: IC.edit, act: function () { pToast('info', 'Opening editor for ' + o.rqq + '…'); } },
      { k: 'dup', label: 'Duplicate', icon: IC.copy, act: function () { duplicateQuote(o); } },
      { k: 'dl', label: 'Download PDF', icon: IC.dl, act: function () { pToast('ok', 'Quote ' + o.rqq + ' exported to PDF.'); } }
    ];
    if (o.st === 'Draft' || o.st === 'Rejected') items.push({ k: 'sub', label: 'Submit to Sangoma', icon: IC.send, act: function () { submitQuote(o); } });
    items.push({ sep: true, k: 's1' });
    items.push({ k: 'del', label: 'Delete quote', icon: IC.trash, danger: true, act: function () { deleteQuote([o]); } });
    return items;
  }

  /* ---------- Orders & Quotes: wiring ---------- */
  function wireOrders() {
    var sec = document.getElementById('v-orders'); if (!sec) return;

    var search = document.getElementById('ordSearch');
    if (search) search.addEventListener('input', function () { ordS.q = this.value; ordS.page = 1; renderOrders(); });

    document.getElementById('ordNew').addEventListener('click', newQuoteDialog);
    document.getElementById('ordRefresh').addEventListener('click', function () {
      this.classList.add('spinning'); var self = this;
      renderOrders(); pToast('info', 'Quotes refreshed.');
      setTimeout(function () { self.classList.remove('spinning'); }, 520);
    });

    /* filter chips (inline menus) */
    sec.querySelectorAll('.chip[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        var opt = e.target.closest('.dd-i');
        if (opt) {
          e.stopPropagation();
          var f = chip.dataset.filter, v = opt.dataset.v;
          ordS[f] = v; ordS.page = 1;
          chip.querySelector('.lab').textContent = v || (f === 'st' ? 'Status' : f === 'ot' ? 'Order Type' : 'Quote Type');
          chip.classList.toggle('act', !!v);
          chip.querySelectorAll('.dd-i').forEach(function (d) { d.classList.toggle('on', d === opt); });
          chip.classList.remove('dd-on');
          renderOrders();
          return;
        }
        e.stopPropagation();
        var wasOpen = chip.classList.contains('dd-on');
        sec.querySelectorAll('.chip.dd-on').forEach(function (c) { c.classList.remove('dd-on'); });
        if (!wasOpen) chip.classList.add('dd-on');
      });
    });
    document.addEventListener('click', function () { sec.querySelectorAll('.chip.dd-on').forEach(function (c) { c.classList.remove('dd-on'); }); });

    /* delegated grid interactions */
    var table = document.getElementById('ordTable');
    table.addEventListener('change', function (e) {
      if (e.target.id === 'ordAll') {
        var on = e.target.checked;
        ordFiltered().slice((ordS.page - 1) * ordS.size, ordS.page * ordS.size).forEach(function (o) { ordS.sel[o.rqq] = on; });
        renderOrders(); return;
      }
      if (e.target.classList.contains('ord-ck')) {
        ordS.sel[e.target.dataset.rqq] = e.target.checked;
        var tr = e.target.closest('tr'); if (tr) tr.classList.toggle('sel-row', e.target.checked);
        syncOrdHead(ordFiltered().slice((ordS.page - 1) * ordS.size, ordS.page * ordS.size)); updateOrdBulk();
      }
    });
    table.addEventListener('click', function (e) {
      var kb = e.target.closest('[data-ordmenu]');
      if (kb) { e.stopPropagation(); var o = ordByRqq(kb.dataset.ordmenu); if (o) pMenu(kb, rowMenuItems(o)); return; }
      var tr = e.target.closest('tr[data-rqq]');
      if (tr && !e.target.closest('.ckc')) { var oo = ordByRqq(tr.dataset.rqq); if (oo) quoteDetail(oo); }
    });
    table.addEventListener('keydown', function (e) {
      var kb = e.target.closest('[data-ordmenu]');
      if (kb && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); var o = ordByRqq(kb.dataset.ordmenu); if (o) pMenu(kb, rowMenuItems(o)); }
    });

    /* pager */
    var pager = document.getElementById('ordPager');
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('.pg'); if (!b || b.disabled) return;
      var pg = b.dataset.pg, pages = Math.max(1, Math.ceil(ordFiltered().length / ordS.size));
      if (pg === 'prev') ordS.page = Math.max(1, ordS.page - 1);
      else if (pg === 'next') ordS.page = Math.min(pages, ordS.page + 1);
      else ordS.page = parseInt(pg, 10);
      renderOrders();
    });
    pager.addEventListener('change', function (e) {
      if (e.target.id === 'ordSize') { ordS.size = parseInt(e.target.value, 10); ordS.page = 1; renderOrders(); }
    });

    /* bulk bar */
    document.getElementById('ordClearSel').addEventListener('click', function () { ordS.sel = {}; renderOrders(); });
    document.getElementById('ordBulk').addEventListener('click', function (e) {
      var b = e.target.closest('[data-bulk]'); if (!b) return;
      var sel = ORDERS.filter(function (o) { return ordS.sel[o.rqq]; });
      if (!sel.length) return;
      if (b.dataset.bulk === 'submit') {
        pDialog({ icon: IC.send, title: 'Submit ' + sel.length + ' quotes?', sub: 'They will be locked for pricing review.',
          actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Submit all', kind: 'p', act: function () {
            sel.forEach(function (o) { if (o.st === 'Draft' || o.st === 'Rejected') o.st = 'Submitted'; });
            ordS.sel = {}; renderOrders(); pToast('ok', sel.length + ' quotes submitted.'); } }] });
      } else if (b.dataset.bulk === 'export') {
        pToast('ok', 'Exporting ' + sel.length + ' quotes to CSV…'); ordS.sel = {}; renderOrders();
      } else if (b.dataset.bulk === 'delete') {
        deleteQuote(sel);
      }
    });
  }

  /* ---------- Row action menus on other tabs (J.5) ---------- */
  function wireRowMenus() {
    /* customer accounts */
    var ct = document.getElementById('custTable');
    if (ct) ct.addEventListener('click', function (e) {
      var kb = e.target.closest('[data-custmenu]'); if (!kb) return;
      e.stopPropagation();
      var c = CUSTOMERS.filter(function (x) { return x.id === kb.dataset.custmenu; })[0]; if (!c) return;
      pMenu(kb, [
        { k: 'open', label: 'Open control panel', icon: IC.view, act: function () { openCustomer(c.id); } },
        { k: 'users', label: 'Manage users', icon: IC.user, act: function () { pToast('info', 'Opening users for ' + c.n + '…'); } },
        { k: 'ord', label: 'New quote', icon: IC.edit, act: function () { go('orders'); setTimeout(newQuoteDialog, 80); } },
        { sep: true, k: 's' },
        { k: 'susp', label: c.st === 'Suspended' ? 'Reactivate account' : 'Suspend account', icon: IC.pause, danger: c.st !== 'Suspended',
          act: function () { suspendCustomer(c); } }
      ]);
    });

    /* support tickets */
    var tt = document.getElementById('tktTable');
    if (tt) tt.addEventListener('click', function (e) {
      var kb = e.target.closest('[data-tktmenu]'); if (!kb) return;
      e.stopPropagation();
      var t = TICKETS.filter(function (x) { return x.id === kb.dataset.tktmenu; })[0]; if (!t) return;
      pMenu(kb, [
        { k: 'view', label: 'View ticket', icon: IC.view, act: function () { ticketDetail(t); } },
        { k: 'reply', label: 'Add reply', icon: IC.edit, act: function () { ticketReply(t); } },
        { k: 'esc', label: 'Escalate to Sangoma', icon: IC.send, act: function () { escalateTicket(t); } },
        { sep: true, k: 's' },
        { k: 'close', label: 'Close ticket', icon: IC.check, act: function () { closeTicket(t); } }
      ]);
    });

    /* partner team */
    var tm = document.getElementById('teamTable');
    if (tm) tm.addEventListener('click', function (e) {
      var kb = e.target.closest('[data-teammenu]'); if (!kb) return;
      e.stopPropagation();
      var m = TEAM.filter(function (x) { return x.e === kb.dataset.teammenu; })[0]; if (!m) return;
      pMenu(kb, [
        { k: 'edit', label: 'Edit role & scope', icon: IC.edit, act: function () { editMember(m); } },
        { k: 'reset', label: 'Send password reset', icon: IC.key, act: function () { pToast('ok', 'Reset link sent to ' + m.e + '.'); } },
        { sep: true, k: 's' },
        { k: 'remove', label: 'Remove from team', icon: IC.trash, danger: true, act: function () { removeMember(m); } }
      ]);
    });
  }

  /* ---------- Dialogs for other tabs (J.6) ---------- */
  function suspendCustomer(c) {
    var suspending = c.st !== 'Suspended';
    pDialog({
      icon: suspending ? IC.pause : IC.check, iconKind: suspending ? 'warn' : 'ok',
      title: (suspending ? 'Suspend ' : 'Reactivate ') + c.n + '?',
      sub: c.id,
      body: '<div class="pm-note' + (suspending ? '' : '') + '">' + IC.info + '<span>' +
        (suspending ? 'Users at this account will lose access to calling and messaging until reactivated. Billing is paused.'
                    : 'Service and billing resume immediately for all users at this account.') + '</span></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: suspending ? 'Suspend account' : 'Reactivate', kind: suspending ? 'danger' : 'p', act: function () {
          c.st = suspending ? 'Suspended' : 'Active'; renderCustomers(); renderRecent(); renderPerf();
          pToast('ok', c.n + (suspending ? ' suspended.' : ' reactivated.'));
        } }
      ]
    });
  }
  function ticketDetail(t) {
    var body = '<div class="pm-list">' + kv('Ticket', t.id) + kv('Account', t.acct) + kv('Site', t.loc) +
      kv('Priority', t.pr) + kv('Status', t.st) + kv('Raised by', t.by) + kv('Updated', t.upd) + '</div>';
    pDialog({ icon: IC.view, wide: true, title: t.sub, sub: t.id + ' · ' + t.acct, body: body,
      actions: [
        { label: 'Escalate', kind: 'ghost', act: function () { escalateTicket(t); }, close: true },
        { label: 'Add reply', kind: 'p', act: function () { ticketReply(t); }, close: true }
      ] });
  }
  function ticketReply(t) {
    pDialog({ icon: IC.edit, title: 'Reply to ' + t.id, sub: t.sub,
      body: '<div class="field"><label>Your reply</label><textarea class="inp" id="tkReply" placeholder="Type your update…"></textarea></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Send reply', kind: 'p', act: function (root) {
          if (!root.querySelector('#tkReply').value.trim()) { pToast('err', 'Write a reply first.'); return false; }
          pToast('ok', 'Reply added to ' + t.id + '.');
        } }
      ] });
  }
  function escalateTicket(t) {
    pDialog({ icon: IC.send, iconKind: 'warn', title: 'Escalate ' + t.id + ' to Sangoma?',
      sub: t.sub,
      body: '<div class="pm-note">' + IC.info + '<span>Escalation moves the ticket to Sangoma Tier-2 support and marks it high priority. You keep visibility on all updates.</span></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Escalate', kind: 'p', act: function () { t.st = 'Awaiting Sangoma'; t.pr = 'High'; renderTickets(); pToast('ok', t.id + ' escalated to Sangoma.'); } }
      ] });
  }
  function closeTicket(t) {
    pDialog({ icon: IC.check, iconKind: 'ok', title: 'Close ' + t.id + '?', sub: 'Marks the ticket resolved.',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Close ticket', kind: 'p', act: function () { t.st = 'Resolved'; renderTickets(); pToast('ok', t.id + ' closed.'); } }
      ] });
  }
  function editMember(m) {
    pDialog({ icon: IC.edit, title: 'Edit ' + m.n, sub: m.e,
      body:
        '<div class="field"><label>Role</label><select class="inp" id="emRole">' +
          ['Partner Admin', 'Engineer', 'Support', 'Billing'].map(function (r) { return '<option' + (r === m.r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label>Account scope</label><input class="inp" id="emScope" value="' + m.sc + '"></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Save changes', kind: 'p', act: function (root) {
          m.r = root.querySelector('#emRole').value; m.sc = root.querySelector('#emScope').value.trim() || m.sc;
          renderTeam(); pToast('ok', m.n + ' updated.');
        } }
      ] });
  }
  function removeMember(m) {
    pDialog({ icon: IC.trash, iconKind: 'bad', title: 'Remove ' + m.n + '?', sub: 'They will lose all partner portal access.',
      body: '<div class="pm-note bad">' + IC.alert + '<span>This immediately revokes ' + m.n + '\u2019s access to every customer account.</span></div>',
      actions: [
        { label: 'Cancel', kind: 'ghost' },
        { label: 'Remove member', kind: 'danger', act: function () {
          var i = TEAM.indexOf(m); if (i > -1) TEAM.splice(i, 1); renderTeam(); pToast('ok', m.n + ' removed from the team.');
        } }
      ] });
  }

  window.pToast = pToast; window.pDialog = pDialog;

  /* ---------- NetOps iframe tab ----------
     The NetOps dashboard is a self-contained portal bundled under netops/.
     It is heavy, so the iframe is created lazily the first time the tab is
     opened, behind a branded overlay that stays up until the frame fires
     onload (with a short floor so it never flashes). */
  var netopsState = { loaded: false, cyc: null, floor: null };
  var NL_STEPS = [
    'Establishing secure session\u2026',
    'Authenticating with your BV portal\u2026',
    'Loading network topology\u2026',
    'Syncing live device telemetry\u2026',
    'Rendering the operations dashboard\u2026'
  ];

  function netopsSrc() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    /* the self-contained build inlines both docs as data URIs on window.__NETOPS__
       so the single-file partner portal has no external dependencies */
    if (window.__NETOPS__) return dark ? window.__NETOPS__.dark : window.__NETOPS__.light;
    return dark ? 'netops/dark.html' : 'netops/index.html';
  }

  /* The bundled NetOps doc carries its own public-preview password gate. Inside
     the partner portal the operator is already authenticated, so we satisfy the
     gate's own session token (same-origin, shared with the frame) rather than
     showing a second password wall. */
  function netopsUnlock() {
    try { sessionStorage.setItem('nu_gate', '1'); } catch (e) {}
  }

  function netopsCycle() {
    var el = document.getElementById('nlStep'); if (!el) return;
    var i = 0; el.textContent = NL_STEPS[0];
    netopsState.cyc = setInterval(function () {
      i = (i + 1) % NL_STEPS.length; el.textContent = NL_STEPS[i];
    }, 2600);
  }
  function netopsStopCycle() {
    if (netopsState.cyc) { clearInterval(netopsState.cyc); netopsState.cyc = null; }
  }

  function netopsShowOverlay() {
    var ov = document.getElementById('netopsLoad'); if (!ov) return;
    ov.classList.remove('hide');
    netopsState.floor = Date.now();
    netopsStopCycle(); netopsCycle();
  }
  function netopsHideOverlay() {
    var ov = document.getElementById('netopsLoad'); if (!ov) return;
    var wait = Math.max(0, 700 - (Date.now() - (netopsState.floor || 0)));
    setTimeout(function () { ov.classList.add('hide'); netopsStopCycle(); }, wait);
  }

  function netopsEnsure() {
    var frame = document.querySelector('.netops-frame'); if (!frame) return;
    var f = document.getElementById('netopsFrame');
    if (!netopsState.loaded) {
      netopsUnlock();
      netopsShowOverlay();
      if (!f) {
        f = document.createElement('iframe');
        f.id = 'netopsFrame'; f.title = 'NetOps Dashboard';
        f.setAttribute('loading', 'lazy');
        f.addEventListener('load', netopsHideOverlay);
        frame.appendChild(f);
      }
      f.src = netopsSrc();
      netopsState.loaded = true;
    }
  }

  function netopsReload() {
    var f = document.getElementById('netopsFrame');
    netopsUnlock();
    netopsShowOverlay();
    if (f) { f.src = netopsSrc(); }
    else { netopsState.loaded = false; netopsEnsure(); }
  }

  function wireNetops() {
    var r = document.getElementById('netopsReload');
    if (r) r.addEventListener('click', netopsReload);
    var o = document.getElementById('netopsOpen');
    if (o) o.addEventListener('click', function () { this.href = netopsSrc(); });
    /* theme toggle: if NetOps is on screen, swap the framed doc immediately;
       otherwise mark it stale so the correct theme loads on next open. */
    var t = document.getElementById('tsw');
    if (t) t.addEventListener('click', function () {
      setTimeout(function () {
        var live = document.getElementById('v-netops');
        if (live && live.classList.contains('on')) netopsReload();
        else netopsState.loaded = false;
      }, 0);
    });
  }

  /* ---------- boot ---------- */
  renderCustomers(); renderRecent(); renderOrders(); renderTeam();
  renderPerf(); renderTickets();
  wireOrders(); wireRowMenus(); wireNetops();
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
