/* Shared partner portfolio data.
 * Loaded by partner.js (portal) and scope.js (control panel opened by a partner)
 * so the account list and per-account locations cannot drift between the two. */
(function () {
  'use strict';

  var CUSTOMERS = [
    { id: 'SNG-40218', n: 'Acme Manufacturing', ind: 'Manufacturing', loc: 6,  seats: 840,  dids: 312, svc: ['Voice', 'Chat', 'Meet'], st: 'Active' },
    { id: 'SNG-40219', n: 'Belmont Health',     ind: 'Healthcare',    loc: 14, seats: 1240, dids: 486, svc: ['Voice', 'Chat'],         st: 'Active' },
    { id: 'SNG-40224', n: 'Cascade Logistics',  ind: 'Transport',     loc: 9,  seats: 610,  dids: 240, svc: ['Voice', 'Meet'],         st: 'Active' },
    { id: 'SNG-40231', n: 'Harbor Point Legal', ind: 'Professional',  loc: 2,  seats: 180,  dids: 64,  svc: ['Voice', 'Chat', 'Meet'], st: 'Active' },
    { id: 'SNG-40240', n: 'Northgate Retail',   ind: 'Retail',        loc: 22, seats: 980,  dids: 410, svc: ['Voice'],                 st: 'Trial' },
    { id: 'SNG-40255', n: 'Pinnacle Financial', ind: 'Finance',       loc: 4,  seats: 520,  dids: 196, svc: ['Voice', 'Chat'],         st: 'Active' },
    { id: 'SNG-40261', n: 'Riverstone Schools', ind: 'Education',     loc: 11, seats: 760,  dids: 288, svc: ['Voice', 'Meet'],         st: 'Active' },
    { id: 'SNG-40272', n: 'Summit Hospitality', ind: 'Hospitality',   loc: 7,  seats: 340,  dids: 130, svc: ['Voice', 'Chat'],         st: 'Suspended' }
  ];

  /* locations keyed by account name; the control panel location picker reads these */
  var LOCATIONS = {
    'Acme Manufacturing': [
      { n: 'Austin HQ',        code: 'ATX-01', addr: '1400 Congress Ave, Austin, TX 78701',   ext: 248, did: 96, usr: 236, st: 'Live' },
      { n: 'Round Rock Plant', code: 'ATX-02', addr: '2201 Chisholm Trail, Round Rock, TX',   ext: 180, did: 62, usr: 174, st: 'Live' },
      { n: 'Dallas Depot',     code: 'DFW-01', addr: '740 Riverfront Blvd, Dallas, TX 75207', ext: 122, did: 48, usr: 118, st: 'Live' },
      { n: 'Houston Yard',     code: 'HOU-01', addr: '3300 Navigation Blvd, Houston, TX',     ext: 96,  did: 40, usr: 92,  st: 'Live' },
      { n: 'Phoenix Annex',    code: 'PHX-01', addr: '55 N Central Ave, Phoenix, AZ 85004',   ext: 118, did: 44, usr: 108, st: 'Provisioning' },
      { n: 'Remote Workers',   code: 'REM-01', addr: 'Distributed — no fixed site',           ext: 76,  did: 22, usr: 112, st: 'Live' }
    ],
    'Belmont Health': [
      { n: 'Riverside Campus', code: 'RVS-01', addr: '900 Riverside Dr, Columbus, OH',  ext: 420, did: 160, usr: 402, st: 'Live' },
      { n: 'Eastgate Clinic',  code: 'EST-02', addr: '77 Eastgate Blvd, Columbus, OH',  ext: 180, did: 70,  usr: 172, st: 'Live' },
      { n: 'Mercy Annex',      code: 'MCY-03', addr: '1200 Mercy Way, Dayton, OH',      ext: 140, did: 52,  usr: 133, st: 'Live' }
    ]
  };

  /* every other account falls back to a single head office */
  function locationsFor(acct) {
    if (LOCATIONS[acct]) return LOCATIONS[acct];
    return [{ n: 'Head Office', code: 'HQ-01', addr: 'Primary site', ext: 120, did: 48, usr: 116, st: 'Live' }];
  }

  window.PORTFOLIO = { CUSTOMERS: CUSTOMERS, LOCATIONS: LOCATIONS, locationsFor: locationsFor };
})();
