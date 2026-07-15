/* Intelligrator — Phased Productionisation Plan  v2.1
 * Reworks the timeline to a WEEKLY, date-anchored schedule.
 * Week 1 begins Monday 13 July 2026.
 * Reuses all story CONTENT from the v2 data module; only the phase
 * structure, timings and phase->story mapping change here.
 */
const v2 = require('/home/claude/fp/assets/intelligrator-phases-data.js');

const PLAN_META = {
  version: '2.1',
  date: '15 July 2026',
  horizon: '30 weeks · 7 phases · week 1 began Monday 13 Jul 2026 · MVP live at week 5'
};

const PHASE_COLORS = {
  P0: '#5A6472', P1: '#0B5FFF', P2: '#0F7A5A', P3: '#7A3DB8',
  P4: '#B5761B', P5: '#C2410C', P6: '#B3261E'
};

/* ---- date scaffolding: week 1 Monday = 13 Jul 2026 ---- */
const WEEK1 = Date.UTC(2026, 6, 13);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mondayOf = w => new Date(WEEK1 + (w - 1) * 604800000);
const fridayOf = w => new Date(WEEK1 + ((w - 1) * 7 + 4) * 86400000);
const fmtDate = (d, year) => `${d.getUTCDate()} ${MON[d.getUTCMonth()]}${year ? ' ' + d.getUTCFullYear() : ''}`;

const PHASES = [
  {
    id: 'P0', short: 'Foundations', name: 'Foundations', tag: 'Platform enablement · 2 weeks',
    start: 1, end: 2,
    goal: 'Build the spine that every later phase sits on. Nothing user-facing ships in this phase — and that is the point. Two weeks, the platform lane only.',
    inscope: [
      'MFT configuration schema designed and versioned — and designed for all three pattern families (file, API, event), even though only file is implemented now.',
      'The single generic Boomi MFT engine process hardened, parameterised and deployed to every environment.',
      'Secrets store (vault) integrated — no credential ever lands in the portal database.',
      'Append-only audit store stood up.',
      'Environments (DEV / TEST / PRE-PROD / PROD) and the CI/CD pipeline that promotes configuration, not code.',
      'Pluggable authentication abstraction — so that swapping local login + 2FA for enterprise SSO in Phase 4 is a configuration change, not a rebuild.'
    ],
    outscope: ['Any portal UI. Any request form. Any approval workflow.'],
    automation: [
      'Pipeline that promotes a config row between environments with approval gates.',
      'Automated deployment of the generic engine to every Atom / environment.',
      'Schema-migration tooling so the config table can be extended without downtime.'
    ],
    exit: [
      'A config row inserted by hand causes the generic engine to run a file transfer end-to-end, with no Boomi component created.',
      'A secret written to the vault is retrievable by the engine and by nothing else.',
      'The audit store rejects an update or a delete.',
      'Authentication can be switched between two providers by configuration alone.'
    ]
  },
  {
    id: 'P1', short: 'MVP · MFT + 2FA', name: 'MVP — MFT Self-Service + 2FA Access', tag: 'The one that proves it · 3 weeks',
    start: 3, end: 5,
    goal: 'A user signs in with a username, password and a second factor, submits a Managed File Transfer request, an admin accepts or rejects it, and an approved request is provisioned automatically with no human touching Boomi.',
    inscope: [
      'Local username-and-password authentication with self-registration and admin account approval.',
      'Two-factor authentication (TOTP) stood up on every sign-in, with recovery codes.',
      'The full MFT request form: identity, endpoints, file characteristics, trigger, security, classification, resilience, environment.',
      'Draft, submit, track, withdraw. Respond to a request for information.',
      'Admin approval queue with basic pre-checks (naming standard, duplicate detection, credential validity).',
      'Accept, reject with reason code, or return for more information. Segregation of duties enforced server-side.',
      'The build automation: approval writes ONE config row, the generic engine picks it up, the endpoint is provisioned, credentials are issued into the vault, and a smoke test runs.'
    ],
    outscope: [
      'Enterprise SSO and step-up-at-decision MFA — Phase 4.',
      'Anything API. Anything event-driven.',
      'Conditional approval, delegation, fast-path, reporting dashboards.'
    ],
    automation: [
      'Approve → config row written, keyed to the request reference.',
      'Partner endpoint / virtual user created via the Boomi MFT (Thru) management API.',
      'SSH keys or certificates generated in the vault and delivered by a one-time, re-authenticated reveal.',
      'Connectivity smoke test executed; result recorded against the interface.',
      'Rollback of partial configuration on any provisioning failure.'
    ],
    exit: [
      'A requester who has never used Boomi onboards a working SFTP interface without raising a ticket.',
      'Two-factor authentication is enforced on every sign-in; a password alone does not admit anyone.',
      'End-to-end lead time from submission to Live is under the agreed target, measured, not asserted.',
      'Zero new Boomi components created per interface, verified by component count across ten onboardings.',
      'No requester can approve their own request, proven by a direct API call that is rejected.'
    ]
  },
  {
    id: 'P2', short: 'API build (simple)', name: 'API Onboarding & Build (Simple)', tag: 'Contract in, API out · 4 weeks',
    start: 6, end: 9,
    goal: 'A user uploads an OpenAPI specification, the platform validates it, and builds and deploys a live, secured, rate-limited API automatically — with no developer writing a Boomi process. Composition comes next, in Phase 3.',
    inscope: [
      'API request form: identity, contract-first upload (OpenAPI 3.x), interaction style, auth model, traffic profile, routing.',
      'Contract linting against the departmental API standards ruleset, errors anchored to the offending line.',
      'Automated build: the API proxy, its operations and its gateway policies are generated from the contract and deployed.',
      'Sandbox: a mock generated from the contract so the requester can test before submitting.',
      'Consumer self-service: browse the catalogue, subscribe to a published API, request credentials.',
      'The guided pattern-selection wizard, including detection of async-disguised-as-sync.'
    ],
    outscope: [
      'Mashup / composite APIs — Phase 3.',
      'AsyncAPI and event-driven onboarding — Phase 5.',
      'Enterprise SSO — Phase 4.'
    ],
    automation: [
      'OpenAPI document → API proxy definition → gateway deployment, per environment, from one named policy bundle.',
      'Mock service generated from the same contract for the sandbox.',
      'Contract diff on republish: a breaking change blocks the deploy.',
      'Consumer credentials issued into the vault and delivered by one-time reveal.'
    ],
    exit: [
      'An OpenAPI file uploaded by a non-developer becomes a live, secured, rate-limited API in the sandbox with no manual Boomi work.',
      'A breaking change to a published contract is detected and blocked before deployment.',
      'No per-API bespoke component is created — the build is contract plus named policy bundle.'
    ]
  },
  {
    id: 'P3', short: 'API mashup', name: 'API Mashup & Composition', tag: 'Where the principle is tested · 6 weeks',
    start: 10, end: 15,
    goal: 'A user composes several published APIs into a single composite API — sequence, parallel fan-out/fan-in, field mapping and response shaping — executed by one generic orchestration engine, with no bespoke Boomi process per mashup.',
    inscope: [
      'Mashup / composite composer: select two or more published APIs the user is entitled to consume.',
      'Declarative composition: arrange calls in sequence, in parallel (fan-out / fan-in), or conditionally — no code.',
      'Field binding: pass a field from an earlier response into a later call.',
      'Per-step failure behaviour: fail the composite, return a documented degraded response, or apply a fallback.',
      'Response mapping and shaping from a governed transformation library — no arbitrary scripting.',
      'The composite OpenAPI contract generated automatically and linted like any other.',
      'API versioning, deprecation and retirement without breaking existing consumers.'
    ],
    outscope: [
      'Event-driven onboarding — Phase 5.',
      'Enterprise SSO — Phase 4.'
    ],
    automation: [
      'Composition specification (a declarative document, not code) executed by ONE generic orchestration engine — the same discipline as the MFT engine.',
      'Composite OpenAPI generated from the composition and linted automatically.',
      'Version diff and breaking-change detection on every republish.'
    ],
    exit: [
      'A mashup of three published APIs is composed, tested and published — and inspection of Boomi shows no new per-mashup process.',
      'A request for an arbitrary script inside a mashup is refused and routed to extend the governed transform library instead.',
      'A breaking change to a published contract forces a new major version rather than an overwrite.'
    ]
  },
  {
    id: 'P4', short: 'SSO & governance', name: 'Enterprise SSO, Governance & Scale', tag: 'Production-grade · starts ~3 months out',
    start: 14, end: 19,
    goal: 'Replace the MVP\'s local login with enterprise SSO, add step-up MFA at the moment of decision, and stand up the controls an auditor will actually test — running as a parallel identity-and-governance track from around the three-month mark, overlapping the tail of the mashup build.',
    inscope: [
      'Enterprise SSO (OIDC / SAML) via the pluggable auth layer built in Phase 0. Local accounts migrated and retired.',
      'Step-up multi-factor authentication at the moment of decision — beyond the MVP\'s sign-in 2FA.',
      'The full automated pre-check engine: credential strength and expiry, classification-versus-protocol, capacity thresholds, IP allow-list validity, contract lint, anti-pattern flags.',
      'Conditional approval with tracked conditions, delegation and reassignment, and fast-path batch approval for low-risk non-production requests.',
      'Reporting: throughput, time-to-decision against SLA, rejection reason codes ranked by frequency.',
      'Accessibility to WCAG 2.2 AA. Performance and availability against the agreed SLO.'
    ],
    outscope: ['Event-driven onboarding — Phase 5.'],
    automation: [
      'Automated migration of local accounts to SSO identities with no re-registration.',
      'Pre-check engine runs on submission; the approver sees a pass/warn/fail panel before opening the request.',
      'Condition-monitoring job escalates a conditional approval whose condition passes its due date unmet.'
    ],
    exit: [
      'Local username-and-password authentication is switched off entirely.',
      'An auditor can be shown, for any live interface, who approved it, when, on what basis, and the state of every pre-check at that moment.',
      'The service passes an independent WCAG 2.2 AA assessment.'
    ]
  },
  {
    id: 'P5', short: 'Event-driven', name: 'Event-Driven Onboarding', tag: 'The third pattern family · 5 weeks',
    start: 20, end: 24,
    goal: 'Extend the same front door to event streaming: AsyncAPI contracts, a browsable event catalogue, and a schema registry that refuses an incompatible change.',
    inscope: [
      'AsyncAPI contract upload, linting and publication.',
      'Publisher onboarding: declare a topic, its event schema and its retention.',
      'Subscriber onboarding: browse the event catalogue, subscribe to a topic, receive credentials.',
      'Schema registry with forward and backward compatibility enforcement.'
    ],
    outscope: ['Stream processing / transformation logic — that remains a build activity, not a self-service one.'],
    automation: [
      'Topic, ACL and consumer group provisioned from the approved request as configuration.',
      'Schema registered and compatibility-checked automatically; an incompatible change is rejected at submission, not at runtime.'
    ],
    exit: [
      'A publisher and a subscriber are onboarded to a new topic entirely through the portal.',
      'An incompatible schema change is rejected before it can reach an environment.'
    ]
  },
  {
    id: 'P6', short: 'Optimise & retire', name: 'Optimise, Automate & Retire', tag: 'Retire the legacy tail · 6 weeks',
    start: 25, end: 30,
    goal: 'Make the estate self-maintaining, make its cost visible, and use the portal to industrialise the migration off the legacy integration estate.',
    inscope: [
      'Interface health and usage dashboards for owners — not just for the platform team.',
      'Cost transparency and chargeback by service line, so that volume has an owner.',
      'Dormancy detection and automated recertification: an interface nobody uses and nobody will vouch for is retired.',
      'Bulk onboarding: import a legacy interface inventory and generate config rows in batch.',
      'Change and decommission requests against live interfaces, with field-level diff for the approver.'
    ],
    outscope: ['Retirement of the legacy platform itself — a programme activity this phase enables but does not own.'],
    automation: [
      'Dormancy job flags an unused interface, prompts the owner, and retires it on non-response — config row disabled, never deleted.',
      'Bulk import validates a legacy inventory and generates config rows for approval in batch rather than one at a time.',
      'Chargeback report generated automatically from actual transfer and call volumes.'
    ],
    exit: [
      'Every live interface has a named, currently-verified owner.',
      'A legacy inventory can be migrated in batch through the same approval controls as a single request.',
      'The dormant tail of the estate is measurably shrinking, not growing.'
    ]
  }
];

/* attach weekly labels + dates */
PHASES.forEach(p => {
  p.weeks = `W${p.start}\u2013W${p.end}`;
  const endYear = fridayOf(p.end).getUTCFullYear() !== 2026;
  p.dates = `${fmtDate(mondayOf(p.start))} \u2013 ${fmtDate(fridayOf(p.end), endYear)}`;
});

const HORIZON = Math.max(...PHASES.map(p => p.end));

/* ---- new 2FA story for the MVP ---- */
const ACC08 = {
  id: 'ACC-08', epic: 'E1', persona: 'Standard User', priority: 'Must', points: 5,
  title: 'Complete two-factor authentication at sign-in',
  story: 'As a Standard User, I want to confirm a second factor when I sign in, so that a stolen password alone cannot get into the portal in the MVP before enterprise SSO arrives.',
  ac: [
    'Given I have signed in with a correct username and password, when authentication succeeds, then I am prompted for a second factor before any portal function is available.',
    'Given I enrol, when I set up two-factor authentication, then I can register a time-based one-time-password (TOTP) authenticator app and I am issued single-use recovery codes, shown once.',
    'Given I enter a valid one-time code, when it is verified, then I am admitted; given I enter an invalid code, then I am refused, and the attempt is rate-limited and written to the audit trail.',
    'Given the second factor is mandatory, when an account has not completed 2FA enrolment, then it cannot submit or approve anything until enrolment is complete.',
    'Given the authentication layer is pluggable (Phase 0), when enterprise SSO with its own MFA replaces local login in Phase 4, then this local 2FA is retired by configuration, not by a code change.'
  ]
};

/* ---- every story id -> new phase ---- */
const MAP = {
  'ACC-01': 'P1', 'ACC-02': 'P4', 'ACC-03': 'P1', 'ACC-04': 'P1', 'ACC-05': 'P1',
  'ACC-06': 'P1', 'ACC-07': 'P1', 'ACC-08': 'P1',
  'REQ-01': 'P1', 'REQ-02': 'P2', 'REQ-03': 'P1',
  'MFT-01': 'P1', 'MFT-02': 'P1', 'MFT-03': 'P1', 'MFT-04': 'P1', 'MFT-05': 'P1',
  'MFT-06': 'P1', 'MFT-07': 'P1', 'MFT-08': 'P1', 'MFT-09': 'P1', 'MFT-10': 'P1',
  'API-01': 'P2', 'API-02': 'P2', 'API-03': 'P2', 'API-04': 'P2', 'API-05': 'P2',
  'API-06': 'P2', 'API-07': 'P2', 'API-08': 'P2', 'API-09': 'P2', 'API-13': 'P2',
  'API-10': 'P3', 'API-11': 'P3', 'API-12': 'P3',
  'TRK-01': 'P1', 'TRK-02': 'P1', 'TRK-03': 'P1', 'TRK-04': 'P6', 'TRK-05': 'P1', 'TRK-06': 'P6',
  'ADM-01': 'P4', 'ADM-02': 'P1', 'ADM-03': 'P1', 'ADM-04': 'P4',
  'DEC-01': 'P1', 'DEC-02': 'P1', 'DEC-03': 'P1', 'DEC-04': 'P4', 'DEC-05': 'P4',
  'DEC-06': 'P1', 'DEC-07': 'P4',
  'PRV-01': 'P1', 'PRV-02': 'P1', 'PRV-03': 'P1',
  'AUD-01': 'P1', 'AUD-02': 'P4', 'NFR-01': 'P4', 'NFR-02': 'P4',
  'EVT-01': 'P5', 'EVT-02': 'P5', 'EVT-03': 'P5', 'EVT-04': 'P5',
  'OPS-01': 'P6', 'OPS-02': 'P6', 'OPS-03': 'P6', 'OPS-04': 'P6'
};

const rawStories = [...v2.STORIES, ...v2.NEW_STORIES, ACC08];
const seen = new Set();
const ALL_STORIES = [];
for (const s of rawStories) {
  if (seen.has(s.id)) continue;
  seen.add(s.id);
  ALL_STORIES.push({ ...s, phase: MAP[s.id] || 'P1' });
}

const MILESTONES = [
  { id: 'M0', week: 2,  name: 'Foundations ready',            test: 'A hand-inserted config row moves a file end-to-end. No Boomi component created.' },
  { id: 'M1', week: 5,  name: 'MVP live — MFT + 2FA',         test: 'A non-Boomi user self-serves a live SFTP interface, behind a two-factor login. Approval provisions it automatically.' },
  { id: 'M2', week: 9,  name: 'Simple API build live',        test: 'An uploaded OpenAPI file becomes a live, secured, rate-limited API with no manual Boomi work.' },
  { id: 'M3', week: 15, name: 'First mashup in production',   test: 'Three published APIs composed into one composite. Boomi component count unchanged.' },
  { id: 'M4', week: 19, name: 'SSO cutover · governance live', test: 'Local login switched off. Full pre-check engine and step-up MFA live. WCAG 2.2 AA passed.' },
  { id: 'M5', week: 24, name: 'Event-driven onboarding',      test: 'Publisher and subscriber onboarded through the portal. Incompatible schema rejected at submission.' },
  { id: 'M6', week: 30, name: 'Migration engine live',        test: 'A legacy inventory bulk-onboarded through the same controls. Dormant tail shrinking.' }
];
MILESTONES.forEach(m => { m.date = fmtDate(fridayOf(m.week), m.week > 25); });

const PLAN_CHALLENGES = [
  {
    q: 'Username, password and 2FA in the MVP, for a tax authority. Is that acceptable?',
    a: 'For an internal, invitation-only pilot onboarding <em>non-production</em> interfaces — yes, and adding TOTP 2FA at sign-in (ACC-08) closes the biggest hole a password-only login would leave. Two things keep it safe rather than merely fast. First, <strong>Phase 0 builds a pluggable authentication abstraction</strong>, so Phase 4 swaps in enterprise SSO by configuration, not by rebuild; drop that abstraction to save time and the whole argument collapses. Second, <strong>local accounts are admin-approved, domain-restricted and never long-lived</strong> (ACC-07). <strong>Recommendation:</strong> gate the MVP so it cannot provision a <em>Production</em> interface until SSO and the full pre-check engine land in Phase 4. If the programme will not accept that gate, pull SSO forward and accept the schedule hit — do not simply hope.'
  },
  {
    q: 'Phase 3 (mashup) is where "config over construction" goes to die. What stops it?',
    a: 'Nothing, unless it is designed in. A mashup is an orchestration, and the instinctive Boomi answer is a new process per mashup — at which point you have rebuilt the sprawl you are migrating away from, in a newer product. <strong>API-10 AC6 is the line:</strong> the composition is a <em>declarative specification</em> executed by ONE generic orchestration engine, exactly as an MFT config row is executed by one generic MFT engine. <strong>API-11 AC2 is the second line:</strong> transformations come from a governed library, not arbitrary scripting. Expect the first request for a script step in the back half of Phase 3, and decide the answer now.'
  },
  {
    q: 'SSO and governance (Phase 4) start around the three-month mark and overlap the mashup build. Is running the API estate on MVP-grade controls for that long acceptable?',
    a: 'It is the real risk in this schedule. Phases 2 and 3 stand up an API and mashup estate that, until Phase 4 lands at week 19, is governed only by the MVP controls: admin-approved 2FA accounts, segregation of duties, the audit trail and <em>basic</em> pre-checks — not the full pre-check engine, not step-up MFA at the decision, not SSO. Running SSO as a parallel identity track from week 14 is realistic (identity is a different squad from API build), but the exposure is weeks 6–19. <strong>Recommendation:</strong> keep everything built in Phases 2 and 3 in non-production until Phase 4 completes, or pull the pre-check engine (ADM-04) forward into Phase 2. This is an SRO decision, taken now, not discovered at a gate review.'
  },
  {
    q: 'Should the MVP really include the build automation, or just the request form?',
    a: 'It must include the automation. A portal that captures a request and then hands a spreadsheet to the platform team is a nicer-looking ticket queue — and the business case for Intelligrator is not "prettier tickets", it is lead time and the removal of per-interface build. If Phase 1 ships without PRV-01, the MVP has not tested the hypothesis the product exists to test. Cut scope from the <em>form</em> (SFTP only, fewer options) before you cut it from the <em>automation</em>.'
  },
  {
    q: 'What is the single thing most likely to derail this?',
    a: 'The config schema in Phase 0. Every later phase reads from it. If it is designed narrowly around SFTP because that is what the MVP needs, then Phase 2 bolts an API table onto the side, Phase 5 bolts an event table onto the side, and by Phase 6 you have three products sharing a login page. <strong>Design the schema for all three pattern families in Phase 0, even though only file transfer is implemented.</strong> Two weeks is tight for that; protect the thinking time.'
  }
];

module.exports = {
  META: v2.META, PERSONAS: v2.PERSONAS, PRINCIPLES: v2.PRINCIPLES, EPICS: v2.EPICS,
  STATES: v2.STATES, CHALLENGES: v2.CHALLENGES,
  PLAN_META, PHASE_COLORS, PHASES, MILESTONES, PLAN_CHALLENGES, ALL_STORIES, HORIZON,
  WEEK1, mondayOf, fridayOf, fmtDate, MON
};
