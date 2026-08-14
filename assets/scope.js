/* ==========================================================
   Partner scope for the customer control panel.

   When the control panel is opened from the partner portal
   (index.html?partner=…&tier=…&acct=…) this:
     · marks the session as partner-administered,
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

  document.documentElement.setAttribute('data-scope', 'partner');

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

    /* 3 — partner context bar above the page content */
    var host = document.querySelector('.page');
    if (host && !document.querySelector('.ctx')) {
      var bar = document.createElement('div');
      bar.className = 'ctx';
      bar.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/>' +
        '<path d="M3 16l9 5 9-5M3 12l9 5 9-5"/></svg>' +
        '<span>Administering <b>' + acct + '</b> as <b>' + partner + '</b> · ' +
        (TIER_LABEL[tier] || tier) + '</span><span class="sp"></span>' +
        '<a class="lnk" href="partner.html?view=app#customers">Back to Partner Portal</a>';
      host.insertBefore(bar, host.firstChild);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
