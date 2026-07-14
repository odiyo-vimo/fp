/* Intelligrator — Phased Productionisation Plan
 * Extends intelligrator-stories-data.js with:
 *   - PHASES        : the delivery phases, objectives, automation, exit criteria
 *   - PHASE_MAP     : existing story ID -> phase
 *   - NEW_STORIES   : stories introduced by phases 1..5 that did not exist in v1.0
 *   - MILESTONES    : plan-on-a-page milestones
 *   - PLAN_CHALLENGES : deliberate challenges to this plan
 * Exports ALL_STORIES (v1.0 stories + new, each carrying a `phase`).
 */

const base = require('/home/claude/fp/assets/intelligrator-stories-data.js');

const PLAN_META = {
  version: '2.0',
  date: '14 July 2026',
  horizon: '60 weeks · 6 phases · MVP live at week 14'
};

const PHASES = [
  {
    id: 'P0', short: 'Foundations',
    name: 'Foundations',
    tag: 'Platform enablement',
    weeks: 'Weeks 1–4',
    start: 1, end: 4,
    goal: 'Build the spine that every later phase sits on. Nothing user-facing ships in this phase — and that is the point.',
    inscope: [
      'MFT configuration schema designed and versioned (the table that the generic engine reads).',
      'The single generic Boomi MFT engine process hardened, parameterised and deployed to all environments.',
      'Secrets store integrated (vault) — no credential ever lands in the portal database.',
      'Append-only audit store stood up.',
      'Environments (DEV / TEST / PRE-PROD / PROD) and the CI/CD pipeline that promotes configuration, not code.',
      'Pluggable authentication abstraction — so that swapping local login for enterprise SSO in Phase 3 is a configuration change, not a rebuild.'
    ],
    outscope: ['Any portal UI. Any request form. Any approval workflow.'],
    automation: [
      'Pipeline that promotes a config row between environments with approval gates.',
      'Automated deployment of the generic engine to every Atom/environment.',
      'Schema-migration tooling so the config table can be extended without downtime.'
    ],
    exit: [
      'A config row inserted by hand causes the generic engine to run a file transfer end-to-end, with no Boomi component created.',
      'A secret written to the vault is retrievable by the engine and by nothing else.',
      'The audit store rejects an update or delete.',
      'Authentication can be switched between two providers by configuration alone.'
    ],
    stories: '—  (platform work, tracked as technical enablers)'
  },
  {
    id: 'P1', short: 'MVP · MFT',
    name: 'MVP — MFT Self-Service',
    tag: 'The one that proves it',
    weeks: 'Weeks 3–14',
    start: 3, end: 14,
    goal: 'A user logs in with a username and password, submits a Managed File Transfer request, an admin accepts or rejects it, and an approved request is provisioned automatically with no human touching Boomi.',
    inscope: [
      'Local username-and-password authentication with self-registration and account approval.',
      'The full MFT request form: identity, endpoints, file characteristics, trigger, security, classification, resilience, environment.',
      'Draft, submit, track, withdraw. Respond to a request for information.',
      'Admin approval queue with basic pre-checks (naming standard, duplicate detection, credential validity).',
      'Accept, reject with reason code, or return for more information. Segregation of duties enforced server-side.',
      'The build automation: approval writes ONE config row, the generic engine picks it up, the endpoint is provisioned, credentials are issued into the vault, and a smoke test runs.'
    ],
    outscope: [
      'Enterprise SSO and step-up MFA — Phase 3.',
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
      'End-to-end lead time from submission to Live is under the agreed target, measured, not asserted.',
      'Zero new Boomi components created per interface — verified by component count before and after ten onboardings.',
      'No requester can approve their own request, proven by a direct API call that is rejected.'
    ],
    stories: 'ACC-01, ACC-03..07, REQ-01, REQ-03, MFT-01..10, TRK-01..03, TRK-05, ADM-02, ADM-03, DEC-01..03, DEC-06, PRV-01..03, AUD-01'
  },
  {
    id: 'P2', short: 'API build & mashup',
    name: 'API Onboarding, Build & Composition',
    tag: 'Contract in, API out',
    weeks: 'Weeks 15–28',
    start: 15, end: 28,
    goal: 'A user uploads an OpenAPI specification, the platform validates it, builds and deploys the API automatically, and lets them compose several published APIs into a single mashup — all without a developer writing a Boomi process.',
    inscope: [
      'API request form: identity, contract-first upload (OpenAPI 3.x), interaction style, auth model, traffic profile, routing.',
      'Contract linting against the departmental API standards ruleset, with errors anchored to the offending line.',
      'Automated build: the API proxy, its operations and its gateway policies are generated from the contract and deployed.',
      'Sandbox: a mock generated from the contract so the requester can test before submitting.',
      'Mashup / composite APIs: declaratively compose published APIs into a new one — sequence, parallel fan-out/fan-in, field mapping and response shaping.',
      'Consumer self-service: browse the catalogue, subscribe to a published API, request credentials.',
      'Versioning, deprecation and retirement of a published API.',
      'The guided pattern-selection wizard, including detection of async-disguised-as-sync.'
    ],
    outscope: ['AsyncAPI and event-driven onboarding — Phase 4.', 'SSO — Phase 3.'],
    automation: [
      'OpenAPI document → API proxy definition → gateway deployment, per environment, from one named policy bundle.',
      'Mock service generated from the same contract for the sandbox.',
      'Mashup composition spec (a declarative document, not code) executed by ONE generic orchestration engine — the same discipline as MFT.',
      'Contract diff on republish: breaking-change detection blocks the deploy.',
      'Consumer credentials issued into the vault and delivered by one-time reveal.'
    ],
    exit: [
      'An OpenAPI file uploaded by a non-developer becomes a live, secured, rate-limited API in the sandbox with no manual Boomi work.',
      'A mashup of three published APIs is composed, tested and published — and inspection of Boomi shows no new per-mashup process.',
      'A breaking change to a published contract is detected and blocked before deployment.'
    ],
    stories: 'REQ-02, API-01..07, API-08..13'
  },
  {
    id: 'P3', short: 'SSO & governance',
    name: 'Enterprise Identity, Governance & Scale',
    tag: 'Production-grade',
    weeks: 'Weeks 29–38',
    start: 29, end: 38,
    goal: 'Replace the MVP\'s local login with enterprise SSO, add the controls an auditor will actually test, and take the service to production at scale.',
    inscope: [
      'Enterprise SSO (OIDC/SAML) via the pluggable auth layer built in Phase 0. Local accounts migrated and retired.',
      'Step-up multi-factor authentication at the moment of decision — not merely at sign-in.',
      'The full automated pre-check engine: credential strength and expiry, classification-versus-protocol compatibility, capacity thresholds, IP allow-list validity, contract lint, anti-pattern flags.',
      'Conditional approval with tracked conditions, delegation and reassignment, fast-path batch approval for low-risk non-production requests.',
      'Reporting: throughput, time-to-decision against SLA, rejection reason codes ranked by frequency.',
      'Accessibility to WCAG 2.2 AA. Performance and availability against the agreed SLO.'
    ],
    outscope: ['Event-driven onboarding — Phase 4.'],
    automation: [
      'Automated migration of local accounts to SSO identities with no re-registration.',
      'Pre-check engine runs on submission; the approver sees a pass/warn/fail panel before they open the request.',
      'Condition-monitoring job escalates a conditional approval whose condition passes its due date unmet.'
    ],
    exit: [
      'Local username-and-password authentication is switched off entirely.',
      'An auditor can be shown, for any live interface, who approved it, when, on what basis, and the state of every pre-check at that moment.',
      'The service passes an independent WCAG 2.2 AA assessment.'
    ],
    stories: 'ACC-02, ADM-01, ADM-04, DEC-04, DEC-05, DEC-07, AUD-02, NFR-01, NFR-02'
  },
  {
    id: 'P4', short: 'Event-driven',
    name: 'Event-Driven Onboarding',
    tag: 'The third pattern family',
    weeks: 'Weeks 39–48',
    start: 39, end: 48,
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
    ],
    stories: 'EVT-01..04'
  },
  {
    id: 'P5', short: 'Optimise & retire',
    name: 'Optimise, Automate & Retire',
    tag: 'Retire the legacy tail',
    weeks: 'Weeks 49–60',
    start: 49, end: 60,
    goal: 'Make the estate self-maintaining, make its cost visible, and use the portal to industrialise the migration off the legacy integration estate.',
    inscope: [
      'Interface health and usage dashboards for owners — not just for the platform team.',
      'Cost transparency and chargeback by service line, so that volume has an owner.',
      'Dormancy detection and automated recertification: an interface nobody has used and nobody will vouch for is retired.',
      'Bulk onboarding: import a set of legacy interfaces and generate config rows in batch, for the migration off the legacy estate.',
      'Change and decommission requests against live interfaces, with field-level diff for the approver.'
    ],
    outscope: ['Retirement of the legacy platform itself — a programme activity that this phase enables but does not own.'],
    automation: [
      'Dormancy job flags an unused interface, prompts the owner, and retires it on non-response — config row disabled, never deleted.',
      'Bulk import validates a legacy interface inventory and generates config rows for approval in batch rather than one at a time.',
      'Chargeback report generated automatically from actual transfer and call volumes.'
    ],
    exit: [
      'Every live interface has a named, currently-verified owner.',
      'A legacy interface inventory can be migrated in batch, through the same approval controls as a single request.',
      'The dormant tail of the estate is measurably shrinking, not growing.'
    ],
    stories: 'TRK-04, TRK-06, OPS-01..04'
  }
];

/* ---- existing v1.0 stories mapped to phases ---- */
const PHASE_MAP = {
  'ACC-01': 'P1', 'ACC-02': 'P3', 'ACC-03': 'P1', 'ACC-04': 'P1', 'ACC-05': 'P1',
  'REQ-01': 'P1', 'REQ-02': 'P2', 'REQ-03': 'P1',
  'MFT-01': 'P1', 'MFT-02': 'P1', 'MFT-03': 'P1', 'MFT-04': 'P1', 'MFT-05': 'P1',
  'MFT-06': 'P1', 'MFT-07': 'P1', 'MFT-08': 'P1', 'MFT-09': 'P1', 'MFT-10': 'P1',
  'API-01': 'P2', 'API-02': 'P2', 'API-03': 'P2', 'API-04': 'P2', 'API-05': 'P2',
  'API-06': 'P2', 'API-07': 'P2',
  'TRK-01': 'P1', 'TRK-02': 'P1', 'TRK-03': 'P1', 'TRK-04': 'P5', 'TRK-05': 'P1', 'TRK-06': 'P5',
  'ADM-01': 'P3', 'ADM-02': 'P1', 'ADM-03': 'P1', 'ADM-04': 'P3',
  'DEC-01': 'P1', 'DEC-02': 'P1', 'DEC-03': 'P1', 'DEC-04': 'P3', 'DEC-05': 'P3',
  'DEC-06': 'P1', 'DEC-07': 'P3',
  'PRV-01': 'P1', 'PRV-02': 'P1', 'PRV-03': 'P1',
  'AUD-01': 'P1', 'AUD-02': 'P3', 'NFR-01': 'P3', 'NFR-02': 'P3'
};

/* ---- new stories introduced by the phased plan ---- */
const NEW_STORIES = [
  /* ---- Phase 1: local authentication (MVP) ---- */
  {
    id: 'ACC-06', epic: 'E1', phase: 'P1', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Sign in with a username and password (MVP authentication)',
    story: 'As a Standard User, I want to sign in with a username and password, so that I can use the portal in the MVP before enterprise single sign-on is available.',
    ac: [
      'Given I hold an approved account, when I enter my username and password, then I am authenticated and taken to my dashboard.',
      'Given passwords are stored, when a password is persisted, then it is hashed with a current, memory-hard algorithm and salted — never encrypted, never reversible, never logged.',
      'Given a password is set, when it is validated, then it is checked for length, and against a breached-password list; complexity theatre (forced symbols, 90-day rotation) is not imposed.',
      'Given repeated failed attempts, when the threshold is reached, then the account is rate-limited and then locked, and the attempts are written to the audit trail.',
      'Given I forget my password, when I use the reset flow, then a single-use, time-limited link is sent to my registered address and the old password is invalidated only when the new one is set.',
      'Given the authentication layer is pluggable (Phase 0), when SSO is introduced in Phase 3, then local authentication is switched off by configuration without changing the portal application.'
    ]
  },
  {
    id: 'ACC-07', epic: 'E1', phase: 'P1', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Register an account and have it approved by an administrator',
    story: 'As an MFT Admin, I want new accounts to require my approval before they become active, so that the MVP\'s local login does not become an open door.',
    ac: [
      'Given a colleague self-registers, when they submit, then the account is created in a Pending state and cannot sign in.',
      'And registration is restricted to a permitted email domain list; anything else is rejected at submission.',
      'Given an account is Pending, when I review it in the admin console, then I can approve it and assign it a role (Requester or Approver), or reject it with a reason.',
      'Given I approve an account, when the approval commits, then the user is notified and can sign in, and the approval is written to the audit trail.',
      'Given an account has been inactive for the configured period, when the dormancy job runs, then it is automatically disabled.'
    ]
  },

  /* ---- Phase 2: API build automation and composition ---- */
  {
    id: 'API-08', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Must', points: 13,
    title: 'Build and deploy my API automatically from the uploaded contract',
    story: 'As a Standard User, I want the platform to build and deploy my API directly from the OpenAPI specification I uploaded, so that I get a working, secured endpoint without a developer writing a single Boomi process.',
    ac: [
      'Given my contract has passed linting and my request is approved, when the build automation runs, then the API proxy, every operation in the contract and the selected gateway policy bundle are generated and deployed to the target environment.',
      'And the build is driven from the contract plus a named policy bundle — no per-API bespoke component is created.',
      'Given the build runs, when it completes, then I am shown the deployed base URL, the operations exposed, the policies applied and the credentials issuance status.',
      'Given the build fails, when the failure occurs, then any partially deployed configuration is rolled back and the failure reason is shown against the offending part of the contract.',
      'Given I republish an amended contract, when the build runs, then a contract diff is performed first and a breaking change blocks the deployment until it is either fixed or explicitly versioned (API-12).',
      'Given the same contract is promoted to a higher environment, when promotion runs, then only environment-specific values (back-end URL, credentials, rate limits) differ; the build is otherwise identical.'
    ]
  },
  {
    id: 'API-09', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Test my API in a sandbox before I submit it',
    story: 'As a Standard User, I want a working mock of my API generated from my contract, so that I can prove the design works before I ask anyone to approve it.',
    ac: [
      'Given I have uploaded a valid contract, when I select "Create sandbox", then a mock service is generated from the contract\'s schemas and examples, and I am given a sandbox URL.',
      'And I can invoke every operation against the mock from within the portal and see the request and response.',
      'Given the sandbox exists, when I amend the contract, then the mock is regenerated automatically.',
      'Given the sandbox is not production, when it is created, then it is time-limited, carries no real data and is destroyed automatically on expiry or on submission.',
      'Given I have exercised the sandbox, when I submit the request, then the sandbox test evidence is attached to the request for the approver to see.'
    ]
  },
  {
    id: 'API-10', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Must', points: 13,
    title: 'Compose a mashup of published APIs',
    story: 'As a Standard User, I want to compose several published APIs into a single composite API, so that my consumer makes one call instead of orchestrating four — and so that I do not have to ask for a bespoke integration to be built.',
    ac: [
      'Given I select "New composite API", when the composer loads, then I can search the catalogue and select two or more published APIs I am entitled to consume.',
      'And I can arrange the calls in sequence, in parallel (fan-out / fan-in), or conditionally, using a declarative composition — not by writing code.',
      'Given a downstream call depends on an earlier response, when I define the step, then I can bind a field from the earlier response to a parameter of the later call.',
      'Given any downstream API fails, when I define the composition, then I must declare the failure behaviour for each step (fail the whole composite, return partial with a documented degraded response, or apply a fallback).',
      'Given the composition is complete, when I save it, then the platform generates the composite OpenAPI contract automatically, and it is linted like any other contract.',
      'Given the composite is approved and built, when it is deployed, then it is executed by ONE generic orchestration engine reading the composition specification as configuration — no new Boomi process is created per mashup.',
      'Given a source API of my composite is deprecated or retired, when that happens, then I am notified and my composite is flagged as at risk.'
    ]
  },
  {
    id: 'API-11', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Should', points: 8,
    title: 'Map and shape the composite response',
    story: 'As a Standard User, I want to define how the responses from my mashup\'s sources are combined into one response, so that my consumer gets the shape they asked for rather than a bag of nested payloads.',
    ac: [
      'Given I have defined the composition steps, when I open the response mapper, then I can map any field from any source response to any field of the composite response.',
      'And I can apply the permitted transformation set (rename, concatenate, format a date, cast a type, default a null, filter a collection) from a governed list — arbitrary scripting is not offered.',
      'Given a mapping is invalid against the target schema, when I attempt to save, then I am blocked with the offending mapping highlighted.',
      'Given the mapping is complete, when I preview it, then I see the resulting composite response rendered from the sources\' sandbox examples.',
      'Given I need a transformation the governed list does not provide, when I request it, then it is raised to the platform team as a request to extend the transformation library — never as a request for a bespoke process.'
    ]
  },
  {
    id: 'API-12', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Should', points: 8,
    title: 'Version, deprecate and retire a published API',
    story: 'As a Standard User, I want to publish a new version of my API without breaking my existing consumers, so that change does not become an outage.',
    ac: [
      'Given I republish a contract with a breaking change, when the diff runs, then I am required to publish it as a new major version rather than overwrite the existing one.',
      'Given a new version is published, when it goes live, then the previous version continues to serve its existing consumers and both are listed in the catalogue with their status.',
      'Given I deprecate a version, when the deprecation commits, then every subscribed consumer is notified with the sunset date and the migration path.',
      'Given a version reaches its sunset date and consumers remain subscribed, when the sunset job runs, then retirement is blocked and escalated rather than silently breaking those consumers.',
      'Given a version is retired, when the retirement commits, then its gateway configuration is disabled, not deleted, and retained for the audit period.'
    ]
  },
  {
    id: 'API-13', epic: 'E4', phase: 'P2', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Discover and subscribe to a published API as a consumer',
    story: 'As a Standard User, I want to find an existing API in the catalogue and request access to it, so that I do not build a duplicate of something the department already has.',
    ac: [
      'Given I open the API catalogue, when it loads, then I can search and filter published APIs by name, owning service, domain and status.',
      'And for each API I can view its contract, its operations, its policies, its rate limits and its owner — without needing a subscription.',
      'Given I want access, when I select "Subscribe", then I raise a subscription request stating my purpose, expected volume and environment, which routes to the API owner for approval.',
      'Given my subscription is approved, when provisioning runs, then my credentials are issued into the vault and delivered by a one-time, re-authenticated reveal.',
      'Given a duplicate API is proposed, when a new publication request is submitted, then the platform surfaces catalogue matches to the approver so that duplication can be challenged before it is built.'
    ]
  },

  /* ---- Phase 4: event-driven ---- */
  {
    id: 'EVT-01', epic: 'E4', phase: 'P4', persona: 'Standard User', priority: 'Should', points: 13,
    title: 'Onboard an event-driven interface with an AsyncAPI contract',
    story: 'As a Standard User, I want to onboard a publisher or subscriber using an AsyncAPI contract, so that event streaming goes through the same front door and the same governance as everything else.',
    ac: [
      'Given I select an event-driven request, when I reach the contract step, then I must supply an AsyncAPI document, which is linted against the departmental event standards.',
      'Given I am a publisher, when I complete the request, then I declare the topic, the event schema, the partitioning key, the retention period and the expected event rate.',
      'Given I am a subscriber, when I complete the request, then I select an existing topic from the event catalogue and declare my consumer group and delivery guarantee.',
      'Given the request is approved, when provisioning runs, then the topic, the ACL and the consumer group are created as configuration — no bespoke process is created.'
    ]
  },
  {
    id: 'EVT-02', epic: 'E4', phase: 'P4', persona: 'Standard User', priority: 'Should', points: 8,
    title: 'Browse the event catalogue',
    story: 'As a Standard User, I want to see what events the department already publishes, so that I consume an existing stream instead of asking a team to build me a point-to-point feed.',
    ac: [
      'Given I open the event catalogue, when it loads, then I can search published topics by name, domain, owning service and schema.',
      'And for each topic I can view its AsyncAPI contract, its schema versions, its retention and its owner.',
      'And I can see the subscriber count, so that a topic\'s blast radius is visible before it is changed.',
      'Given I select a topic, when I request a subscription, then it routes to the topic owner for approval.'
    ]
  },
  {
    id: 'EVT-03', epic: 'E4', phase: 'P4', persona: 'Platform Engineer', priority: 'Should', points: 8,
    title: 'Enforce schema compatibility through a registry',
    story: 'As a Platform Engineer, I want an incompatible schema change to be rejected at submission, so that a producer cannot break every subscriber at runtime.',
    ac: [
      'Given a schema is published, when it is registered, then it is versioned in the schema registry and bound to its topic.',
      'Given a producer submits a schema change, when the compatibility check runs, then it is evaluated against the topic\'s declared compatibility mode (backward, forward or full).',
      'Given the change is incompatible, when the check fails, then the request is rejected at submission with the offending field named — not discovered in production.',
      'Given the change is compatible, when it is approved, then the new schema version is registered and subscribers are notified.'
    ]
  },
  {
    id: 'EVT-04', epic: 'E4', phase: 'P4', persona: 'MFT Admin', priority: 'Could', points: 5,
    title: 'Approve event interfaces with event-specific pre-checks',
    story: 'As an MFT Admin, I want event requests to arrive with event-specific pre-checks already performed, so that I am not asked to eyeball a schema by hand.',
    ac: [
      'Given an event request enters my queue, when I open it, then the pre-check panel includes AsyncAPI lint result, schema compatibility result, topic naming conformance and retention-versus-classification compatibility.',
      'Given a topic already exists with a materially similar schema, when the duplicate check runs, then the potential duplicate is surfaced to me.',
      'Given the declared event rate exceeds the platform threshold, when the request is submitted, then it is flagged for capacity review.'
    ]
  },

  /* ---- Phase 5: optimise, automate, retire ---- */
  {
    id: 'OPS-01', epic: 'E9', phase: 'P5', persona: 'Standard User', priority: 'Should', points: 8,
    title: 'See the health and usage of the interfaces I own',
    story: 'As a Standard User, I want a dashboard for the interfaces I own, so that I find out my transfer is failing before the business does.',
    ac: [
      'Given I own live interfaces, when I open my dashboard, then I see per-interface success rate, volume, latency and last-run status over a selectable period.',
      'And a failing or degraded interface is visually distinguished and explains what failed, not merely that something did.',
      'Given an interface breaches its declared "must complete by" deadline, when the breach occurs, then I am alerted through the channel I nominated at onboarding.',
      'Given I need evidence for a service review, when I export, then I can download the usage and availability data for my interfaces.'
    ]
  },
  {
    id: 'OPS-02', epic: 'E9', phase: 'P5', persona: 'MFT Admin', priority: 'Could', points: 8,
    title: 'Make the cost of the estate visible by service line',
    story: 'As an MFT Admin, I want consumption attributed to the service line that caused it, so that volume has an owner and growth has a conversation attached to it.',
    ac: [
      'Given interfaces are live, when the chargeback report runs, then transfer volume, API call volume and event volume are attributed to the owning service line.',
      'And the report is generated from actual measured volume, not from the volumetrics declared at onboarding — and the variance between the two is shown.',
      'Given a service line materially exceeds its declared volumetrics, when the variance threshold is crossed, then the owner and the platform team are notified.',
      'Given a service line needs to plan, when they view their consumption, then they see a trend, not only a point-in-time figure.'
    ]
  },
  {
    id: 'OPS-03', epic: 'E9', phase: 'P5', persona: 'MFT Admin', priority: 'Should', points: 8,
    title: 'Detect dormancy and force recertification',
    story: 'As an MFT Admin, I want interfaces nobody uses and nobody will vouch for to be retired automatically, so that the estate stops accumulating a dead tail that we still pay to secure.',
    ac: [
      'Given an interface has had no activity for the configured dormancy period, when the dormancy job runs, then its owner is prompted to confirm it is still required.',
      'Given the owner confirms, when they recertify, then the interface is retained and the recertification is recorded with a next-review date.',
      'Given the owner does not respond within the configured period, when the period elapses, then the interface is disabled and its owner and service line are notified — the config row is disabled, never deleted.',
      'Given every live interface must have an owner, when an owner leaves and is not replaced, then the interface is flagged as orphaned and escalated to the service line.'
    ]
  },
  {
    id: 'OPS-04', epic: 'E9', phase: 'P5', persona: 'Platform Engineer', priority: 'Should', points: 13,
    title: 'Bulk-onboard a legacy interface inventory',
    story: 'As a Platform Engineer, I want to import a validated inventory of legacy interfaces and generate their config rows in batch, so that migrating hundreds of interfaces off the legacy estate does not mean typing hundreds of forms.',
    ac: [
      'Given I hold a legacy interface inventory, when I import it, then every row is validated against the same rules as a portal-submitted request, and every failure is reported against its row before anything is created.',
      'Given the import validates, when I submit it, then each interface becomes an individual request in the approval queue — batched for the approver, but individually auditable.',
      'Given the approver accepts a batch, when provisioning runs, then config rows are created for each and any individual failure does not roll back the successful ones.',
      'Given a legacy interface is migrated, when it goes Live in the new platform, then it is linked to its legacy identifier so that the coexistence period and the eventual decommission can be tracked.',
      'Given the migration is in flight, when I view the migration dashboard, then I see how many legacy interfaces are pending, migrated, coexisting and decommissioned.'
    ]
  }
];

const MILESTONES = [
  { id: 'M0', week: 4,  name: 'Foundations ready',        test: 'A hand-inserted config row moves a file end-to-end. No component created.' },
  { id: 'M1', week: 14, name: 'MVP live',                 test: 'A non-Boomi user self-serves a live SFTP interface. Approval → provisioned, automatically.' },
  { id: 'M2', week: 22, name: 'Contract-to-API build',    test: 'An uploaded OpenAPI file becomes a live, secured, rate-limited API with no manual Boomi work.' },
  { id: 'M3', week: 28, name: 'First mashup in production', test: 'Three published APIs composed into one composite. Boomi component count unchanged.' },
  { id: 'M4', week: 38, name: 'SSO cutover · production at scale', test: 'Local login switched off. Full pre-check engine and step-up MFA live. WCAG 2.2 AA passed.' },
  { id: 'M5', week: 48, name: 'Event-driven onboarding',  test: 'Publisher and subscriber onboarded through the portal. Incompatible schema rejected at submission.' },
  { id: 'M6', week: 60, name: 'Migration engine live',    test: 'A legacy inventory bulk-onboarded through the same controls. Dormant tail shrinking.' }
];

const PLAN_CHALLENGES = [
  {
    q: 'Username and password in the MVP, for a tax authority. Is that acceptable?',
    a: 'For an internal, invitation-only pilot onboarding <em>non-production</em> interfaces — yes, and it buys perhaps six to eight weeks of schedule. For production interfaces carrying real data — no. Two things make this safe rather than merely fast. First, <strong>Phase 0 builds a pluggable authentication abstraction</strong> (ACC-06 AC6), so Phase 3 swaps in SSO by configuration, not by rebuild; if that abstraction is dropped to save time, the whole argument collapses and you will rebuild. Second, <strong>local accounts are admin-approved, domain-restricted and never long-lived</strong> (ACC-07). <strong>Recommendation:</strong> gate the MVP so that it cannot provision a Production interface until Phase 3 lands. If the programme will not accept that gate, pull SSO forward into Phase 1 and accept the delay — do not simply hope.'
  },
  {
    q: 'The mashup capability is where "config over construction" goes to die. What stops it?',
    a: 'Nothing, unless it is designed in. A mashup is an orchestration, and the instinctive Boomi answer is a new process per mashup — at which point you have rebuilt the sprawl you are migrating away from, in a newer product. <strong>API-10 AC6 is the line:</strong> the composition is a <em>declarative specification</em> executed by ONE generic orchestration engine, exactly as an MFT config row is executed by one generic MFT engine. <strong>API-11 AC2 is the second line:</strong> transformations come from a governed library, not from arbitrary scripting. The moment someone is allowed to drop a Groovy step into a mashup, the principle is gone. Expect that request in month four and decide the answer now, not then.'
  },
  {
    q: 'Should the MVP really include the build automation, or just the request form?',
    a: 'It must include the automation. A portal that captures a request and then hands a spreadsheet to the platform team is a nicer-looking ticket queue — and the business case for Intelligrator is not "prettier tickets", it is lead time and the removal of per-interface build. If Phase 1 ships without PRV-01, the MVP has not tested the hypothesis the product exists to test. Cut scope from the <em>form</em> (fewer protocols, SFTP only) before you cut it from the <em>automation</em>.'
  },
  {
    q: 'Six phases over sixty weeks. Is the sequence right?',
    a: 'The debatable one is Phase 3 sitting <em>after</em> Phase 2. It means the API build capability lands before enterprise SSO and the full pre-check engine — which is uncomfortable. The argument for it is that Phase 2 is where the value and the political capital are, and that the Phase 1 controls (admin-approved accounts, segregation of duties, audit trail, basic pre-checks) are adequate for a governed pilot. The argument against is that an API estate is harder to retrofit governance onto than an MFT estate. <strong>If the security assurance position will not tolerate it, swap Phases 2 and 3.</strong> That is a decision for the SRO, and it should be taken explicitly rather than discovered at a gate review.'
  },
  {
    q: 'What is the single thing most likely to derail this?',
    a: 'The config schema (Phase 0). Every later phase reads from it. If it is designed narrowly around SFTP because that is what the MVP needs, then Phase 2 will bolt an API table onto the side, Phase 4 will bolt an event table onto the side, and by Phase 5 you have three products sharing a login page. <strong>Design the schema for all three pattern families in Phase 0, even though only one is implemented.</strong> That is four weeks of thinking that saves a rewrite.'
  }
];

const ALL_STORIES = [
  ...base.STORIES.map(s => ({ ...s, phase: PHASE_MAP[s.id] || 'P1' })),
  ...NEW_STORIES
];

module.exports = {
  ...base,
  PLAN_META, PHASES, PHASE_MAP, NEW_STORIES, MILESTONES, PLAN_CHALLENGES,
  ALL_STORIES
};
