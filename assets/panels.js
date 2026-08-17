/* ==========================================================
   Control panel — side panels and personal account.

   Four things live here, all of which sit on top of the pages
   defined in pages.js and reuse its globals (CEV, vgo, toast,
   initials, ddOpen):

     · the top-right account menu and the My Account page,
     · the dashboard "Customize" panel,
     · the Inventory & Usage product drill-in,
     · the customer-side Support section.

   Loaded after pages.js so those globals already exist.
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------------------------------------------------
     Shared panel plumbing — one scrim, one open drawer.
     The invoice drawer predates this and keeps its own scrim;
     closeAll() below still shuts it so Escape behaves once.
     --------------------------------------------------------- */
  var SCRIM = $('#panel-scrim');
  var openPanel = null;

  function panelOpen(id) {
    panelClose();
    var d = document.getElementById(id);
    if (!d || !SCRIM) return;
    SCRIM.hidden = false;
    requestAnimationFrame(function () { SCRIM.classList.add('show'); });
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
    openPanel = d;
    var f = d.querySelector('.tab, textarea, .drawer-x');
    if (f) f.focus();
  }
  function panelClose() {
    if (!openPanel) return;
    openPanel.classList.remove('open');
    openPanel.setAttribute('aria-hidden', 'true');
    openPanel = null;
    if (SCRIM) {
      SCRIM.classList.remove('show');
      setTimeout(function () { if (!openPanel) SCRIM.hidden = true; }, 300);
    }
  }
  if (SCRIM) SCRIM.addEventListener('click', panelClose);
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-panel-close]')) panelClose();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') panelClose();
  });

  /* Generic tab strips: `data-tab` marks the button, `data-tabp` the panel.
     A `group` attribute keeps the account tabs and the drawer tabs apart. */
  function wireTabs(stripSel, btnAttr, panelAttr, onSwitch) {
    var strip = $(stripSel);
    if (!strip) return;
    var scope = strip.parentNode;
    function show(v) {
      $$('[' + btnAttr + ']', strip).forEach(function (t) {
        t.classList.toggle('on', t.getAttribute(btnAttr) === v);
      });
      $$('[' + panelAttr + ']', scope).forEach(function (p) {
        p.classList.toggle('on', p.getAttribute(panelAttr) === v);
      });
      if (onSwitch) onSwitch(v);
    }
    strip.addEventListener('click', function (e) {
      var t = e.target.closest('[' + btnAttr + ']');
      if (t) show(t.getAttribute(btnAttr));
    });
    strip.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest('[' + btnAttr + ']');
      if (t) { e.preventDefault(); show(t.getAttribute(btnAttr)); }
    });
    return show;
  }

  /* =========================================================
     1. Account menu + My Account
     ========================================================= */
  var showAcctTab = wireTabs('#acctTabs', 'data-tab', 'data-tabp');

  (function accountMenu() {
    var wrap = $('#acctMenu'), btn = $('#avBtn'), pop = $('#acctPop');
    if (!wrap || !btn || !pop) return;

    function open() { wrap.classList.add('open'); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    function close() { wrap.classList.remove('open'); pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', function (e) {
      if (!wrap.classList.contains('open')) return;
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    /* Every menu row (and the pointer from Security Policies) lands on the
       same page with the right tab already selected. */
    document.addEventListener('click', function (e) {
      var it = e.target.closest('[data-acct-tab]');
      if (!it) return;
      close();
      if (typeof vgo === 'function') vgo('account');
      if (showAcctTab) showAcctTab(it.getAttribute('data-acct-tab'));
    });

    var out = $('#acctSignOut');
    if (out) out.addEventListener('click', function () {
      close();
      if (typeof toast === 'function') toast('ok', 'Signed out. Reload the page to sign back in.', true);
    });
  })();

  /* =========================================================
     2. Security policy page — the complexity checklist
     ========================================================= */
  (function passwordPolicy() {
    var list = $('#pwPolicyList');
    if (!list) return;
    var TICK = '<span class="rc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>';
    var RULES = {
      Basic: ['Minimum length: 6 characters', 'Does not contain common passwords'],
      Standard: ['Lowercase letter', 'Uppercase letter', 'Number (0-9)',
        'Minimum length: 8 characters', 'Does not contain common passwords'],
      Strong: ['Lowercase letter', 'Uppercase letter', 'Number (0-9)', 'Symbol (e.g. !@#$)',
        'Minimum length: 8 characters', 'Does not contain part of email',
        'Does not contain first name', 'Does not contain last name',
        'Does not contain common passwords'],
      Custom: ['Lowercase letter', 'Uppercase letter', 'Number (0-9)', 'Symbol (e.g. !@#$)',
        'Minimum length: 12 characters', 'Does not contain part of email',
        'Does not reuse the last 5 passwords']
    };
    var head = $('.pol-t');
    function render(level) {
      list.innerHTML = (RULES[level] || RULES.Strong).map(function (r) {
        return '<li class="ok">' + TICK + esc(r) + '</li>';
      }).join('');
      if (head) head.textContent = 'What \u201C' + level + '\u201D enforces';
    }
    render('Strong');

    /* ddOpen writes the chosen value back onto the anchor, so watching the
       anchor's label is enough — no need to duplicate the menu wiring. */
    var sel = $('#pwComplex');
    if (sel) new MutationObserver(function () {
      render((sel.querySelector('.lab') || {}).textContent || 'Strong');
    }).observe(sel, { subtree: true, childList: true, characterData: true });

    var save = $('#savePolicy');
    if (save) save.addEventListener('click', function () {
      if (typeof toast === 'function') toast('ok', 'Security policy saved. It applies at each user\u2019s next sign-in.', true);
    });
  })();

  /* =========================================================
     3. Dashboard customize panel
     ========================================================= */
  (function customizeDashboard() {
    var btn = $('#dashCust'), list = $('#dashList');
    if (!btn || !list) return;
    var home = $('#v-home');
    var KEY = 'cp.dash.v1';
    var DEFAULT = $$('.dsec', home).map(function (s) { return s.dataset.sec; });

    function load() {
      try {
        var raw = JSON.parse(localStorage.getItem(KEY));
        if (!raw || !raw.order) return null;
        /* A stored layout can outlive the sections it names, so intersect it
           with what actually exists and append anything new at the end. */
        var order = raw.order.filter(function (k) { return DEFAULT.indexOf(k) >= 0; });
        DEFAULT.forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
        return { order: order, off: (raw.off || []).filter(function (k) { return DEFAULT.indexOf(k) >= 0; }) };
      } catch (e) { return null; }
    }
    function save(st) {
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode */ }
    }

    var state = load() || { order: DEFAULT.slice(), off: [] };

    function apply() {
      var secs = {};
      $$('.dsec', home).forEach(function (s) { secs[s.dataset.sec] = s; });
      var anchor = null;
      state.order.forEach(function (k) {
        var s = secs[k];
        if (!s) return;
        s.classList.toggle('off', state.off.indexOf(k) >= 0);
        if (anchor) anchor.after(s); /* keeps the phead above them all */
        anchor = s;
      });
      var vis = $$('.dsec:not(.off)', home);
      $$('.dsec', home).forEach(function (s) { s.classList.remove('lead'); });
      if (vis[0]) vis[0].classList.add('lead');
    }

    function paint() {
      var secs = {};
      $$('.dsec', home).forEach(function (s) { secs[s.dataset.sec] = s; });
      list.innerHTML = state.order.map(function (k) {
        var s = secs[k];
        if (!s) return '';
        var on = state.off.indexOf(k) < 0;
        return '<div class="drow" draggable="true" data-k="' + esc(k) + '">' +
          '<span class="grip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/></svg></span>' +
          '<span class="dnm"><b>' + esc(s.dataset.nm) + '</b><span>' + esc(s.dataset.ds) + '</span></span>' +
          '<span class="sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" aria-label="Show ' + esc(s.dataset.nm) + '"></span>' +
          '</div>';
      }).join('');
    }

    list.addEventListener('click', function (e) {
      var sw = e.target.closest('.sw');
      if (!sw) return;
      var k = sw.closest('.drow').dataset.k;
      var i = state.off.indexOf(k);
      if (i >= 0) state.off.splice(i, 1); else state.off.push(k);
      sw.classList.toggle('on', i >= 0);
      sw.setAttribute('aria-checked', String(i >= 0));
      save(state); apply();
    });

    /* Drag to reorder. The dragged row is the only source of truth for
       position; state.order is rebuilt from the DOM once the drop lands. */
    var dragged = null;
    list.addEventListener('dragstart', function (e) {
      dragged = e.target.closest('.drow');
      if (!dragged) return;
      dragged.classList.add('drag');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragged.dataset.k);
    });
    list.addEventListener('dragover', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var over = e.target.closest('.drow');
      if (!over || over === dragged) return;
      var r = over.getBoundingClientRect();
      var after = (e.clientY - r.top) > r.height / 2;
      list.insertBefore(dragged, after ? over.nextSibling : over);
    });
    list.addEventListener('dragend', function () {
      if (!dragged) return;
      dragged.classList.remove('drag');
      dragged = null;
      state.order = $$('.drow', list).map(function (r) { return r.dataset.k; });
      save(state); apply();
    });

    btn.addEventListener('click', function () { paint(); panelOpen('dash-drawer'); });
    var done = $('#dashDone');
    if (done) done.addEventListener('click', panelClose);
    var reset = $('#dashReset');
    if (reset) reset.addEventListener('click', function () {
      state = { order: DEFAULT.slice(), off: [] };
      save(state); apply(); paint();
    });

    apply();
  })();

  /* =========================================================
     4. Inventory & Usage — product drill-in
     ========================================================= */
  var PRODUCTS = {
    'chat-adv': {
      nm: 'Chat — Advanced', sub: '560 of 1,600 licences assigned',
      users: [
        ['Leslie Alexander', 'lalexander@sangoma.com', 'Austin HQ', 'Active'],
        ['Theresa Webb', 'twebb@sangoma.com', 'Austin HQ', 'Active'],
        ['Cody Fisher', 'cfisher@sangoma.com', 'Denver Branch', 'Active'],
        ['Arlene McCoy', 'amccoy@sangoma.com', 'Denver Branch', 'Idle 14d'],
        ['Jacob Jones', 'jjones@sangoma.com', 'Remote', 'Idle 31d'],
        ['Cameron Williamson', 'cwilliamson@sangoma.com', 'Austin HQ', 'Active']
      ],
      devices: [
        ['MacBook Pro 14"', 'Desktop app 7.4.1', 'Leslie Alexander', 'Online'],
        ['Windows 11 Desktop', 'Desktop app 7.4.1', 'Theresa Webb', 'Online'],
        ['iPhone 15', 'Mobile app 4.9.0', 'Cody Fisher', 'Online'],
        ['Pixel 8', 'Mobile app 4.8.2', 'Arlene McCoy', 'Offline']
      ]
    },
    'chat-prem': {
      nm: 'Chat — Premium', sub: '200 of 400 licences assigned',
      users: [
        ['Guy Hawkins', 'ghawkins@sangoma.com', 'Austin HQ', 'Active'],
        ['Darlene Robertson', 'drobertson@sangoma.com', 'Portland Office', 'Active'],
        ['Savannah Nguyen', 'snguyen@sangoma.com', 'Remote', 'Idle 9d']
      ],
      devices: [
        ['MacBook Air 13"', 'Desktop app 7.4.1', 'Guy Hawkins', 'Online'],
        ['iPad Pro', 'Mobile app 4.9.0', 'Darlene Robertson', 'Online']
      ]
    },
    'meet-adv': {
      nm: 'Meet — Advanced', sub: '560 of 1,600 licences assigned',
      users: [
        ['Ralph Edwards', 'redwards@sangoma.com', 'Austin HQ', 'Active'],
        ['Leslie Alexander', 'lalexander@sangoma.com', 'Austin HQ', 'Active'],
        ['Cameron Williamson', 'cwilliamson@sangoma.com', 'Denver Branch', 'Active'],
        ['Jacob Jones', 'jjones@sangoma.com', 'Remote', 'Idle 22d']
      ],
      devices: [
        ['Meet Room — Boardroom A', 'Room system 3.2', 'Austin HQ', 'Online'],
        ['Meet Room — Huddle 2', 'Room system 3.1', 'Denver Branch', 'Offline'],
        ['MacBook Pro 16"', 'Desktop app 7.4.1', 'Ralph Edwards', 'Online']
      ]
    },
    'sms': {
      nm: 'SMS Licenses', sub: '560 of 1,600 licences assigned',
      users: [
        ['Leslie Alexander', 'lalexander@sangoma.com', '(207) 555-0119', 'Active'],
        ['Theresa Webb', 'twebb@sangoma.com', '(684) 555-0102', 'Active'],
        ['Guy Hawkins', 'ghawkins@sangoma.com', '(307) 555-0133', 'Active'],
        ['Cody Fisher', 'cfisher@sangoma.com', '(252) 555-0126', 'Idle 6d']
      ],
      devices: [
        ['Sangoma Mobile — iOS', 'Mobile app 4.9.0', 'Leslie Alexander', 'Online'],
        ['Sangoma Mobile — Android', 'Mobile app 4.8.2', 'Theresa Webb', 'Online']
      ]
    },
    'voice-ext': {
      nm: 'Voice Extensions', sub: '7,302 of 8,000 extensions assigned',
      users: [
        ['Ralph Edwards', 'Ext. 1042', 'Austin HQ', 'Active'],
        ['Leslie Alexander', 'Ext. 1043', 'Austin HQ', 'Active'],
        ['Theresa Webb', 'Ext. 1088', 'Denver Branch', 'Active'],
        ['Guy Hawkins', 'Ext. 1120', 'Portland Office', 'Active'],
        ['Savannah Nguyen', 'Ext. 1204', 'Remote', 'Idle 45d'],
        ['Darlene Robertson', 'Ext. 1250', 'Portland Office', 'Active']
      ],
      devices: [
        ['Sangoma P330', 'Desk phone · FW 2.8.1', 'Ext. 1042', 'Online'],
        ['Sangoma P370', 'Desk phone · FW 2.8.1', 'Ext. 1043', 'Online'],
        ['Sangoma D80', 'Desk phone · FW 2.6.4', 'Ext. 1088', 'Online'],
        ['Sangoma S705', 'Desk phone · FW 2.6.4', 'Ext. 1120', 'Offline'],
        ['Analog gateway A200', 'Gateway · FW 1.9.0', 'Portland Office', 'Online']
      ]
    }
  };

  var USER_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  var DEV_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';

  function stateTag(s) {
    if (s === 'Active' || s === 'Online') return '<span class="tag ok">' + esc(s) + '</span>';
    if (/^Idle/.test(s)) return '<span class="tag warn">' + esc(s) + '</span>';
    return '<span class="tag" style="background:var(--deg-tint);color:var(--ink-3)">' + esc(s) + '</span>';
  }
  function arow(ic, a, b, c, st) {
    return '<div class="arow"><span class="ic">' + ic + '</span>' +
      '<span class="amain"><b>' + esc(a) + '</b><span>' + esc(b) + ' \u00b7 ' + esc(c) + '</span></span>' +
      stateTag(st) + '</div>';
  }
  function sumbox(pairs) {
    return pairs.map(function (p) {
      return '<div class="tsb"><div class="k">' + esc(p[0]) + '</div><div class="v mono">' + esc(p[1]) + '</div></div>';
    }).join('');
  }

  wireTabs('#prodTabs', 'data-ptab', 'data-ptabp');

  (function inventoryDrill() {
    var page = $('#v-inventory');
    if (!page) return;
    page.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-drill]');
      if (!tr) return;
      var p = PRODUCTS[tr.dataset.drill];
      if (!p) return;

      $('#prodName').textContent = p.nm;
      $('#prodSub').textContent = p.sub;

      var idle = p.users.filter(function (u) { return /^Idle/.test(u[3]); }).length;
      $('#prodUserSum').innerHTML = sumbox([['Assigned', p.users.length], ['Idle 7d+', idle]]);
      $('#prodUsers').innerHTML = p.users.map(function (u) {
        return arow(USER_IC, u[0], u[1], u[2], u[3]);
      }).join('');

      var off = p.devices.filter(function (d) { return d[3] === 'Offline'; }).length;
      $('#prodDevSum').innerHTML = sumbox([['Registered', p.devices.length], ['Offline', off]]);
      $('#prodDevices').innerHTML = p.devices.length
        ? p.devices.map(function (d) { return arow(DEV_IC, d[0], d[1], d[2], d[3]); }).join('')
        : '<div class="dnone">No devices registered against this product.</div>';

      panelOpen('prod-drawer');
    });
  })();

  /* =========================================================
     5. Support — customer-side tickets
     ========================================================= */
  var CS_TICKETS = [
    { id: 'TCK-51288', sub: 'Inbound calls drop after 30 seconds on the Austin trunk', pr: 'Urgent', st: 'In progress', prod: 'Voice', by: 'Marcus Oyelaran', upd: '18 min ago', opened: '12 May 2024', eng: 'Priya Raman',
      thread: [
        ['you', 'Marcus Oyelaran', '12 May, 09:14', 'Since this morning every inbound call on the Austin HQ trunk cuts out at almost exactly 30 seconds. Outbound is fine. Roughly 40 calls affected so far.'],
        ['agent', 'Priya Raman — Sangoma Support', '12 May, 09:41', 'Thanks Marcus. A 30-second cut-off almost always means SIP ACK is not reaching us, usually a firewall rule. I have pulled the SIP traces for the trunk and can confirm we send 200 OK but see no ACK.'],
        ['agent', 'Priya Raman — Sangoma Support', '12 May, 10:02', 'Could you confirm whether anything changed on the edge firewall in the last 24 hours? In the meantime I have raised the trunk to priority monitoring.']
      ] },
    { id: 'TCK-51241', sub: 'Add 25 Chat Premium licences to the Denver branch', pr: 'Normal', st: 'Awaiting you', prod: 'Chat', by: 'Marcus Oyelaran', upd: '2 hours ago', opened: '11 May 2024', eng: 'Tom Alvarez',
      thread: [
        ['you', 'Marcus Oyelaran', '11 May, 14:20', 'We are onboarding 25 people in Denver on 20 May and need Chat Premium seats ready for them.'],
        ['agent', 'Tom Alvarez — Sangoma Support', '11 May, 15:05', 'Happy to help. That takes the Denver site to 225 Premium seats. It is a mid-term change so it will be prorated on the June invoice. Can you confirm you want the seats live from 20 May?']
      ] },
    { id: 'TCK-51190', sub: 'SMS delivery receipts missing for the marketing short code', pr: 'High', st: 'Open', prod: 'CPaaS', by: 'Dana Whitfield', upd: 'Yesterday', opened: '10 May 2024', eng: 'Unassigned',
      thread: [
        ['you', 'Dana Whitfield', '10 May, 16:48', 'Delivery receipts stopped arriving on our webhook for the marketing short code some time on Thursday. Sends themselves are still going out.']
      ] },
    { id: 'TCK-51102', sub: 'Meet room system in Boardroom A shows offline', pr: 'Normal', st: 'Open', prod: 'Meet', by: 'Dana Whitfield', upd: '2 days ago', opened: '9 May 2024', eng: 'Priya Raman',
      thread: [
        ['you', 'Dana Whitfield', '9 May, 11:02', 'The Boardroom A room system has been showing offline in the control panel since the weekend, although the screen itself works.'],
        ['agent', 'Priya Raman — Sangoma Support', '9 May, 13:30', 'The device last checked in on Friday at 18:40. A power-cycle usually re-registers it. Could you try that and let me know?']
      ] },
    { id: 'TCK-50944', sub: 'Export call detail records for Q1 audit', pr: 'Low', st: 'Resolved', prod: 'Voice', by: 'Marcus Oyelaran', upd: '6 days ago', opened: '2 May 2024', eng: 'Tom Alvarez',
      thread: [
        ['you', 'Marcus Oyelaran', '2 May, 10:15', 'Our auditors need the full CDR export for January to March.'],
        ['agent', 'Tom Alvarez — Sangoma Support', '2 May, 12:40', 'Generated and sent to your registered email as an encrypted archive. Marking this resolved — reopen any time if the auditors need a different format.']
      ] }
  ];

  function prioTag(p) {
    var c = { Urgent: 'bad', High: 'warn', Normal: 'ok', Low: '' }[p];
    return c ? '<span class="tag ' + c + '">' + p + '</span>'
             : '<span class="tag" style="background:var(--deg-tint);color:var(--ink-3)">' + p + '</span>';
  }
  function stTag(s) {
    if (s === 'Resolved') return '<span class="tag ok nw">Resolved</span>';
    if (s === 'Awaiting you') return '<span class="tag warn nw">Awaiting you</span>';
    if (s === 'In progress') return '<span class="tag nw" style="background:var(--info-tint);color:var(--info-ink)">In progress</span>';
    return '<span class="tag nw" style="background:var(--deg-tint);color:var(--ink-3)">Open</span>';
  }

  (function support() {
    var mount = $('#sup-table');
    if (!mount) return;
    var filt = { q: '', st: '', pr: '' };

    function render() {
      var rows = CS_TICKETS.filter(function (t) {
        if (filt.st && filt.st.indexOf('All') < 0 && t.st !== filt.st) return false;
        if (filt.pr && filt.pr.indexOf('All') < 0 && t.pr !== filt.pr) return false;
        if (filt.q && (t.sub + ' ' + t.id + ' ' + t.by).toLowerCase().indexOf(filt.q) < 0) return false;
        return true;
      });
      var head = '<th>Ticket</th><th>Subject</th><th>Product</th><th>Priority</th>' +
                 '<th>Status</th><th>Raised by</th><th>Updated</th><th style="width:40px"></th>';
      var body = rows.map(function (t) {
        return '<tr data-tkt="' + t.id + '">' +
          '<td class="mono">' + t.id + '</td>' +
          '<td><b style="font-weight:600">' + esc(t.sub) + '</b></td>' +
          '<td class="muted nw">' + t.prod + '</td>' +
          '<td>' + prioTag(t.pr) + '</td>' +
          '<td>' + stTag(t.st) + '</td>' +
          '<td class="muted nw">' + esc(t.by) + '</td>' +
          '<td class="muted nw">' + t.upd + '</td>' +
          '<td><span class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span></td></tr>';
      }).join('');
      mount.innerHTML = rows.length
        ? '<div class="tw"><div class="tscroll"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div></div>'
        : '<div class="tw"><div class="state empty"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><h3>No matching tickets</h3><p>Try a different search term or clear the status and priority filters.</p></div></div>';
      $$('tr[data-tkt]', mount).forEach(function (tr) { tr.setAttribute('data-drill', ''); });
    }

    var search = $('#supSearch');
    if (search) search.addEventListener('input', function () {
      filt.q = search.value.trim().toLowerCase(); render();
    });

    /* ddOpen stores the pick on the chip; re-read it after the menu closes. */
    $$('[data-supfilter]').forEach(function (chip) {
      new MutationObserver(function () {
        filt[chip.getAttribute('data-supfilter')] = (chip.querySelector('.lab') || {}).textContent || '';
        render();
      }).observe(chip, { subtree: true, childList: true, characterData: true });
    });

    mount.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-tkt]');
      if (!tr) return;
      var t = CS_TICKETS.filter(function (x) { return x.id === tr.dataset.tkt; })[0];
      if (!t) return;

      $('#tktSubj').textContent = t.sub;
      $('#tktId').textContent = t.id + ' \u00b7 opened ' + t.opened;
      $('#tktMeta').innerHTML = [
        ['Status', stTag(t.st)], ['Priority', prioTag(t.pr)],
        ['Product', esc(t.prod)], ['Support engineer', esc(t.eng)],
        ['Raised by', esc(t.by)], ['Last update', esc(t.upd)]
      ].map(function (p) {
        return '<div><div class="k">' + p[0] + '</div><div class="v">' + p[1] + '</div></div>';
      }).join('');
      $('#tktThread').innerHTML = t.thread.map(function (m) {
        return '<div class="tmsg ' + m[0] + '"><span class="uav">' + initials(m[1]) + '</span>' +
          '<div class="tbody"><div class="twho"><b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span></div>' +
          '<p>' + esc(m[3]) + '</p></div></div>';
      }).join('');

      var reply = $('#tktReply');
      if (reply) reply.value = '';
      panelOpen('tkt-drawer');
    });

    var send = $('#tktSend');
    if (send) send.addEventListener('click', function () {
      var reply = $('#tktReply');
      if (!reply || !reply.value.trim()) {
        if (typeof toast === 'function') toast('err', 'Write a reply before sending.', true);
        return;
      }
      reply.value = '';
      panelClose();
      if (typeof toast === 'function') toast('ok', 'Reply sent. The support engineer has been notified.', true);
    });

    var nt = $('#newTicket');
    if (nt) nt.addEventListener('click', function () {
      if (typeof toast === 'function') toast('ok', 'Ticket draft started \u2014 pick a product and priority to continue.', true);
    });

    render();
  })();
})();
