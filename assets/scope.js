/* ==========================================================
   Partner scope for the customer control panel.

   Drilling into a customer from the partner portal *is* entering
   that customer's control panel, so index.html is loaded directly
   with the hierarchy carried in the query string:

     index.html?partner=…&tier=…&acct=…&loc=…

   This module then:
     · marks the session as partner-administered,
     · rebuilds the breadcrumb into a clickable
       partner › customer accounts › account › location trail,
     · adds the location picker the partner needs once inside,
     · hides Billing for tiers that may not see it,
     · shows the partner context bar with a way back.

   No query string means an ordinary customer login and this
   module does nothing at all.
   ========================================================== */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var partner = q.get('partner');
  if (!partner) return;

  var tier = q.get('tier') || 'retail';
  var acct = q.get('acct') || 'Customer Account';
  /* Retail and FSW partners resell at list price and never see billing.
     Master agents and white-label partners do. */
  var CAN_BILL = { master: true, whitelabel: true };
  var showBilling = !!CAN_BILL[tier];
  var TIER_LABEL = { retail: 'Retail / FSW', fsw: 'Retail / FSW',
                     master: 'Master Agent', whitelabel: 'White-label' };

  /* locations come from the same table the portal reads, so the picker can
     never drift from the account list */
  var LOCS = (window.PORTFOLIO && window.PORTFOLIO.locationsFor(acct)) ||
             [{ n: 'Head Office', code: 'HQ-01' }];
  var loc = q.get('loc') || LOCS[0].n;

  document.documentElement.setAttribute('data-scope', 'partner');

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function portal(hash) {
    return 'partner.html?view=app&tier=' + encodeURIComponent(tier) + '#' + hash;
  }
  function self(nextLoc) {
    return 'index.html?partner=' + encodeURIComponent(partner) +
      '&tier=' + encodeURIComponent(tier) + '&acct=' + encodeURIComponent(acct) +
      '&loc=' + encodeURIComponent(nextLoc) + (location.hash || '#home');
  }

  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
             '<path d="M9 6l6 6-6 6"/></svg>';

  /* The trail above the control panel keeps the partner hierarchy visible and
     every level above the current page is a link back to it. */
  function buildCrumb() {
    var c = document.querySelector('.crumb');
    if (!c) return;
    var page = document.getElementById('crumbPage');
    var current = page ? page.textContent : 'Home';

    var opts = LOCS.map(function (l) {
      return '<div class="cr-o' + (l.n === loc ? ' on' : '') + '" data-loc="' + esc(l.n) + '">' +
        '<b>' + esc(l.n) + '</b><span class="code mono">' + esc(l.code) + '</span></div>';
    }).join('');

    c.innerHTML =
      '<a class="cr-l" href="' + portal('pdash') + '">' + esc(partner) + '</a>' + CHEV +
      '<a class="cr-l" href="' + portal('customers') + '">Customer Accounts</a>' + CHEV +
      '<a class="cr-l" href="' + portal('customers') + '">' + esc(acct) + '</a>' + CHEV +
      '<span class="cr-sel" id="locSel">' +
        '<button class="cr-btn" aria-haspopup="true" aria-expanded="false">' +
          '<span id="locSelV">' + esc(loc) + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="m6 9 6 6 6-6"/></svg>' +
        '</button>' +
        '<div class="cr-menu" role="menu">' + opts + '</div>' +
      '</span>' + CHEV +
      '<b id="crumbPage">' + esc(current) + '</b>';

    var sel = document.getElementById('locSel');
    var btn = sel.querySelector('.cr-btn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = sel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    sel.addEventListener('click', function (e) {
      var o = e.target.closest('.cr-o');
      if (!o) return;
      /* switching site reloads the panel scoped to that site, which keeps the
         URL shareable and the trail truthful */
      location.href = self(o.dataset.loc);
    });
    document.addEventListener('click', function () {
      sel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  function boot() {
    /* 1 — account name in the rail switcher */
    var sw = document.querySelector('.acct span');
    if (sw) sw.textContent = acct;

    /* 2 — remove Billing where the tier forbids it */
    if (!showBilling) {
      var nav = document.querySelector('.rail .nav-item[data-key="billing"]');
      if (nav) nav.remove();
      var page = document.getElementById('v-billing');
      if (page) page.remove();
      if ((location.hash || '').indexOf('billing') > -1) location.hash = '#home';
    }

    /* 3 — clickable hierarchy + location picker in the topbar */
    buildCrumb();

    /* 4 — partner context bar above the page content */
    var host = document.querySelector('.page');
    if (host && !document.querySelector('.ctx')) {
      var bar = document.createElement('div');
      bar.className = 'ctx';
      bar.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/>' +
        '<path d="M3 16l9 5 9-5M3 12l9 5 9-5"/></svg>' +
        '<span>Administering <b>' + esc(acct) + '</b> &middot; <b>' + esc(loc) + '</b> as <b>' +
        esc(partner) + '</b> &middot; ' + (TIER_LABEL[tier] || tier) + '</span>' +
        '<span class="sp"></span>' +
        '<a class="lnk" href="' + portal('customers') + '">Back to Partner Portal</a>';
      host.insertBefore(bar, host.firstChild);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
