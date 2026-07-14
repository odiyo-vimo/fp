/* Intelligrator — Self-Service Onboarding Portal
 * User Story Backlog: Requester (MFT + API) and Approver (MFT Admin)
 * Single source of truth. Consumed by:
 *   - build-html.js   -> index.html
 *   - build-docx.js   -> assets/intelligrator-user-stories.docx
 *   - build-xlsx.py   -> assets/intelligrator-user-stories.xlsx  (via stories.json)
 */

const META = {
  product: 'Intelligrator',
  subtitle: 'Self-Service Integration Onboarding Portal',
  scope: 'Requester journey (MFT + API request submission) and Approver journey (review, accept, reject)',
  version: '1.0',
  date: '14 July 2026',
  platform: 'Boomi iPaaS · Boomi native MFT (Thru) · Boomi API Management'
};

const PERSONAS = [
  {
    id: 'P1',
    name: 'Standard User (Requester)',
    who: 'Delivery lead, developer or business analyst in a service line who needs a file transfer or an API published/consumed.',
    goals: 'Get an interface onboarded without needing to know Boomi, without raising tickets, and without waiting on the platform team.',
    pains: 'Today: email threads, spreadsheets, unclear standards, long lead times, no visibility of where a request sits.'
  },
  {
    id: 'P2',
    name: 'MFT Admin (Approver)',
    who: 'Integration platform gatekeeper. Owns the standards, the config store and the operational risk of what goes live.',
    goals: 'Review submissions quickly against policy, approve the safe ones, reject or return the rest, with a defensible audit trail.',
    pains: 'Today: incomplete requests, no automated pre-checks, no segregation of duties, no SLA visibility.'
  },
  {
    id: 'P3',
    name: 'Platform Engineer',
    who: 'Owns the generic Boomi MFT engine process, the API gateway policies and the config schema behind them.',
    goals: 'Never build a new component per interface. Extend the config schema, not the code.',
    pains: 'Component sprawl, per-interface bespoke processes, drift between environments.'
  }
];

const PRINCIPLES = [
  {
    t: 'Config over construction',
    d: 'An approved request becomes a <strong>row in the config store</strong>, consumed by one generic MFT engine process (and one generic API gateway policy set). It does <strong>not</strong> generate a new Boomi component per interface. Every story below must preserve this.'
  },
  {
    t: 'Contract-first, not sync-by-default',
    d: '"API-First" means the contract comes first — OpenAPI for synchronous, AsyncAPI for event-driven. Consumer count is <em>not</em> the axis for choosing sync vs async. Availability, response-time budget, reliability and NFRs are.'
  },
  {
    t: 'No async disguised as sync',
    d: 'The guided selection wizard (REQ-02) must actively detect and flag the anti-pattern where a long-running or unreliable back-end is exposed behind a blocking synchronous call.'
  },
  {
    t: 'Segregation of duties',
    d: 'A requester can never approve their own request. This is a hard platform rule, not a policy hope (DEC-06).'
  },
  {
    t: 'The portal is a front door, not a runtime',
    d: 'Intelligrator provisions and governs. It does not sit in the data path. File payloads and API traffic never traverse the portal.'
  }
];

const EPICS = [
  { id: 'E1', name: 'Portal Access & Identity',        persona: 'P1 / P2', desc: 'Get the right person into the right view, securely.' },
  { id: 'E2', name: 'Request Initiation & Guidance',   persona: 'P1',      desc: 'Route the user to the correct request type and warn them off anti-patterns before they fill anything in.' },
  { id: 'E3', name: 'MFT Request Submission',          persona: 'P1',      desc: 'Capture everything the generic MFT engine needs as a config row.' },
  { id: 'E4', name: 'API Request Submission',          persona: 'P1',      desc: 'Capture everything the gateway needs, contract-first.' },
  { id: 'E5', name: 'Track, Amend & Withdraw',         persona: 'P1',      desc: 'Visibility and control after submission.' },
  { id: 'E6', name: 'Admin Access & Approval Queue',   persona: 'P2',      desc: 'Get the approver to the work, prioritised and pre-checked.' },
  { id: 'E7', name: 'Decision: Accept / Reject',       persona: 'P2',      desc: 'The decision itself, with rationale and defensibility.' },
  { id: 'E8', name: 'Provisioning on Approval',        persona: 'P2 / P3', desc: 'Turn an approval into a live config row, safely.' },
  { id: 'E9', name: 'Audit, Reporting & NFRs',         persona: 'All',     desc: 'Prove what happened, and hold the service to a standard.' }
];

const STORIES = [
  /* ---------------- E1 Portal Access & Identity ---------------- */
  {
    id: 'ACC-01', epic: 'E1', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Discover the portal and understand what it is for',
    story: 'As a Standard User, I want a landing page that explains what Intelligrator onboards and what it does not, so that I do not waste time submitting a request the portal cannot service.',
    ac: [
      'Given I am an unauthenticated visitor, when I open the portal URL, then I see a landing page stating that Intelligrator onboards Managed File Transfer interfaces and APIs.',
      'And I see an explicit "not in scope" statement (no runtime data flows through the portal; no bespoke Boomi process build requests).',
      'And I see a single, prominent "Sign in" action.',
      'And I see links to the Integration Pattern Catalogue so I can self-assess which pattern applies before signing in.'
    ]
  },
  {
    id: 'ACC-02', epic: 'E1', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Sign in with departmental single sign-on',
    story: 'As a Standard User, I want to sign in using my existing departmental identity via SSO, so that I do not need another credential and my access reflects my organisational role.',
    ac: [
      'Given I hold a valid departmental identity, when I select "Sign in", then I am redirected to the corporate IdP (OIDC/SAML) and returned authenticated.',
      'Given authentication succeeds, when I land in the portal, then my display name, email and organisational unit are populated from IdP claims without me typing them.',
      'Given my IdP group entitles me only to the requester role, when I land, then no administrative navigation is rendered anywhere in the UI (not merely hidden by CSS).',
      'Given authentication fails, when I am returned, then I see a clear, non-technical error and a route to service support.'
    ]
  },
  {
    id: 'ACC-03', epic: 'E1', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Role-based landing dashboard',
    story: 'As a Standard User, I want a dashboard on sign-in showing my requests and a clear call to action to raise a new one, so that I can pick up where I left off in one click.',
    ac: [
      'Given I sign in as a requester, when the dashboard loads, then I see counts for Draft, Submitted, Awaiting Info, Approved and Rejected.',
      'And I see a primary "New request" button.',
      'And I see my five most recently updated requests with status and last-updated timestamp.',
      'Given I have no requests, when the dashboard loads, then I see an empty state that explains the next step rather than a blank panel.'
    ]
  },
  {
    id: 'ACC-04', epic: 'E1', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Organisation and service-line context',
    story: 'As a Standard User, I want my requests automatically associated with my organisation and service line, so that approval routing and ownership are correct without manual entry.',
    ac: [
      'Given my IdP claims include an organisational unit, when I create a request, then the owning organisation is pre-populated and read-only.',
      'Given I belong to more than one service line, when I create a request, then I am asked to select which one this request belongs to.',
      'Given the service line drives the approver group, when I submit, then the request is routed to that group\'s queue.'
    ]
  },
  {
    id: 'ACC-05', epic: 'E1', persona: 'Standard User', priority: 'Should', points: 2,
    title: 'Secure session handling and sign-out',
    story: 'As a Standard User, I want my session to expire on inactivity and to be able to sign out explicitly, so that an unattended machine cannot be used to submit or approve requests.',
    ac: [
      'Given I have been inactive for the configured idle timeout, when the timeout elapses, then my session is terminated and I am returned to the landing page.',
      'Given I am two minutes from timeout, when the warning threshold is reached, then I am prompted and offered the option to extend.',
      'Given I have unsaved form input, when a timeout occurs, then that input is preserved as a draft rather than lost.',
      'Given I select "Sign out", when the action completes, then the session token is invalidated server-side, not just cleared client-side.'
    ]
  },

  /* ---------------- E2 Request Initiation & Guidance ---------------- */
  {
    id: 'REQ-01', epic: 'E2', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Choose the request type: MFT or API',
    story: 'As a Standard User, I want to choose whether I am requesting a file transfer or an API, so that I am shown only the fields relevant to my interface.',
    ac: [
      'Given I select "New request", when the type picker loads, then I am offered "Managed File Transfer (MFT)" and "API" with a one-line description of each.',
      'And each option shows the governing catalogue pattern reference (for example P-116 for MFT) so the choice is anchored to the standard.',
      'Given I choose a type, when I continue, then the correct submission form is loaded and the type is fixed for the life of the request.',
      'Given I am unsure, when I select "Help me choose", then I am taken to the guided selection wizard (REQ-02).'
    ]
  },
  {
    id: 'REQ-02', epic: 'E2', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Guided pattern selection with anti-pattern detection',
    story: 'As a Standard User, I want the portal to ask me about my non-functional needs and recommend the right interaction style, so that I do not accidentally request an async workload disguised as a synchronous API.',
    ac: [
      'Given I enter the wizard, when it runs, then it asks about response-time budget, back-end availability, expected volume, payload size and reliability/delivery guarantee — not about the number of consumers.',
      'Given my back-end response time exceeds the synchronous budget or my payload exceeds the size threshold, when the wizard evaluates my answers, then it flags the synchronous option as an anti-pattern and recommends an asynchronous or file-based pattern with the reason stated in plain English.',
      'Given my answers indicate a bulk, scheduled or large-payload movement, when the wizard evaluates, then it recommends MFT and offers to start an MFT request pre-populated with my answers.',
      'Given the wizard makes a recommendation, when I disagree, then I may override it, but the override and my stated justification are recorded on the request and surfaced to the approver.'
    ]
  },
  {
    id: 'REQ-03', epic: 'E2', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Save a draft and resume later',
    story: 'As a Standard User, I want to save a partially completed request and come back to it, so that I can go and find information I do not have to hand without losing my work.',
    ac: [
      'Given I am part-way through a form, when I select "Save draft", then the request is persisted with status Draft and no validation is enforced.',
      'And drafts auto-save at a defined interval without me taking any action.',
      'Given I return to a draft, when I open it, then every previously entered value is restored and I resume at the section I left.',
      'Given a draft has not been touched for the configured retention period, when the retention job runs, then I am notified before it is archived.'
    ]
  },

  /* ---------------- E3 MFT Request Submission ---------------- */
  {
    id: 'MFT-01', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Capture MFT interface identity and ownership',
    story: 'As a Standard User, I want to name my file transfer interface and record who owns it, so that it can be uniquely identified, supported and charged correctly for its whole life.',
    ac: [
      'Given I start an MFT request, when I complete the identity section, then I must supply an interface name, business purpose, owning service, technical contact and business owner.',
      'Given the naming standard is enforced by the platform, when I enter a name that does not conform, then I am shown the required convention inline and cannot proceed until it conforms.',
      'Given an interface with the same name already exists, when I attempt to proceed, then I am warned of the collision and offered a link to the existing interface.',
      'Given all mandatory identity fields are complete, when I continue, then the section is marked complete in the progress indicator.'
    ]
  },
  {
    id: 'MFT-02', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Define source and target endpoints and transfer direction',
    story: 'As a Standard User, I want to declare where the file comes from and where it goes, and by what protocol, so that the generic MFT engine can be configured without any bespoke build.',
    ac: [
      'Given I reach the endpoints section, when it loads, then I declare direction (inbound to the department, outbound to a partner, or internal) and select a protocol from the supported set (SFTP, AS2, HTTPS, FTPS).',
      'Given I select a protocol, when the form updates, then only the connection fields valid for that protocol are shown (for example, host/port/path/known-host key for SFTP; AS2 identifier and MDN settings for AS2).',
      'Given the platform distinguishes Accelerated File Transfer from standard File Streaming, when I declare a payload size above the AFT threshold or a cross-region route, then the portal recommends AFT and explains why.',
      'Given I complete the endpoint definition, when I continue, then the values map to named columns in the MFT config schema — no free-text blob is created.'
    ]
  },
  {
    id: 'MFT-03', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Specify file characteristics and volumetrics',
    story: 'As a Standard User, I want to describe the files themselves, so that the platform can validate what arrives and capacity-plan for it.',
    ac: [
      'Given I reach the file section, when I complete it, then I supply the filename pattern (glob or regex), file format, expected average and peak file size, and expected files per day and per peak hour.',
      'Given I enter a filename pattern, when I select "Test pattern", then I can paste a sample filename and immediately see whether it matches.',
      'Given my declared peak volumetrics exceed the platform capacity threshold, when I continue, then the request is automatically flagged for capacity review by the approver.',
      'Given files must be archived or purged after transfer, when I complete the section, then I declare the retention period and post-transfer action (archive, delete, leave in place).'
    ]
  },
  {
    id: 'MFT-04', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Specify the trigger: event-driven, polled or scheduled',
    story: 'As a Standard User, I want to declare how the transfer is initiated, so that the engine either watches, polls or schedules it correctly.',
    ac: [
      'Given I reach the trigger section, when it loads, then I choose between event/arrival-driven, polled at an interval, or scheduled on a cron expression.',
      'Given I choose polled, when I set the interval, then the portal enforces the minimum permitted polling interval and explains the reason for the floor.',
      'Given I choose scheduled, when I enter a cron expression, then the portal shows the next five run times in plain English so I can confirm my intent.',
      'Given the transfer has a business deadline, when I complete the section, then I declare the "must complete by" time so that SLA breach alerting can be configured.'
    ]
  },
  {
    id: 'MFT-05', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Declare security: keys, certificates, encryption and allow-listing',
    story: 'As a Standard User, I want to supply or request the credentials and encryption my transfer needs, so that the interface is secure by default and no secret is ever emailed.',
    ac: [
      'Given I reach the security section, when it loads, then I declare authentication method (SSH key, certificate, mutual TLS, username/password where permitted) for each endpoint.',
      'Given I hold a public key or certificate, when I upload it, then the portal validates its format, algorithm strength and expiry date and rejects a weak or expired credential with a clear reason.',
      'Given I do not hold a key, when I select "Request platform-generated key", then the request is marked for key issuance on approval and no secret is ever entered into a free-text field.',
      'Given payload encryption is required, when I complete the section, then I declare whether PGP encryption is applied and supply or request the relevant key.',
      'Given the platform enforces network controls, when I complete the section, then I supply the source IP ranges to be allow-listed.'
    ]
  },
  {
    id: 'MFT-06', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Declare data classification and residency',
    story: 'As a Standard User, I want to classify the data in the files and state where it may reside, so that the approver can assess risk and the platform can route the transfer to a compliant region.',
    ac: [
      'Given I reach the data section, when it loads, then I select a data classification from the departmental scheme and declare whether the payload contains personal data.',
      'Given I declare personal data, when I continue, then I must supply the lawful basis and the retention period, and the request is automatically flagged for enhanced review.',
      'Given I declare a residency constraint, when I continue, then the portal restricts the selectable target regions to those that satisfy the constraint.',
      'Given the classification exceeds the threshold for the selected protocol, when I attempt to continue, then I am blocked with an explanation of the required protocol or additional control.'
    ]
  },
  {
    id: 'MFT-07', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Configure error handling, retries and alert routing',
    story: 'As a Standard User, I want to say what should happen when a transfer fails and who should be told, so that failures are handled predictably and reach the right team.',
    ac: [
      'Given I reach the resilience section, when I complete it, then I declare the retry count, retry interval and back-off strategy from the permitted options.',
      'Given retries are exhausted, when I complete the section, then I declare the failure action (quarantine, alert only, alert and page).',
      'Given an alert must reach a team, when I complete the section, then I supply an alert distribution address and, where paging is selected, an on-call rota reference.',
      'Given the alert address does not resolve, when I attempt to submit, then validation fails with a clear message.'
    ]
  },
  {
    id: 'MFT-08', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Select environments and promotion path',
    story: 'As a Standard User, I want to request the interface in a specific environment and understand the path to production, so that expectations about go-live are clear from the outset.',
    ac: [
      'Given I reach the environment section, when it loads, then I select the target environment (Development, Test, Pre-production, Production).',
      'Given I select Production, when I continue, then the portal shows the prerequisite environments that must already hold an approved, tested instance of this interface.',
      'Given a prerequisite is not met, when I attempt to submit for Production, then submission is blocked with a link to raise the prerequisite request.',
      'Given the same interface is promoted between environments, when I raise the promotion request, then all previously supplied values are carried forward and only environment-specific values (hosts, keys, IPs) are re-entered.'
    ]
  },
  {
    id: 'MFT-09', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Review the generated config row before submitting',
    story: 'As a Standard User, I want to see exactly what configuration my answers will produce, so that I can confirm it is right before it goes for approval — and so I can see that no bespoke build is being requested on my behalf.',
    ac: [
      'Given every mandatory section is complete, when I reach the review step, then I see a read-only, human-readable rendering of the full config row that would be created.',
      'And I see a statement confirming that approval creates a configuration entry consumed by the shared MFT engine process, and does not create a new Boomi component.',
      'Given I spot an error, when I select the edit link beside any section, then I return to that section with my values intact and can return directly to review.',
      'Given a mandatory field is missing, when I reach review, then the incomplete sections are listed and the submit action is disabled.'
    ]
  },
  {
    id: 'MFT-10', epic: 'E3', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Submit the MFT request for approval',
    story: 'As a Standard User, I want to submit my completed MFT request, so that it enters the approval queue and I get a reference I can quote.',
    ac: [
      'Given the request passes all validation, when I select "Submit", then the status changes from Draft to Submitted and the request becomes read-only to me.',
      'And a unique, human-quotable request reference is generated and displayed.',
      'And a confirmation is sent to me and to the nominated business owner.',
      'And the request appears in the approval queue of the approver group derived from my service line.',
      'Given submission fails for a technical reason, when the error occurs, then my request is retained as a Draft with all data intact and I am told plainly what to do next.'
    ]
  },

  /* ---------------- E4 API Request Submission ---------------- */
  {
    id: 'API-01', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Capture API identity, ownership and consumer intent',
    story: 'As a Standard User, I want to record what API I am publishing or consuming and who owns it, so that it can be governed, discovered and supported.',
    ac: [
      'Given I start an API request, when I complete the identity section, then I declare whether I am publishing an API or requesting access to an existing one.',
      'And I supply API name, business purpose, owning service, technical contact and business owner.',
      'Given I am requesting access to an existing API, when I search the catalogue, then I can select the published API and my request is linked to it rather than duplicating its definition.',
      'Given the naming standard is enforced, when I enter a non-conforming name, then I am blocked inline with the required convention shown.'
    ]
  },
  {
    id: 'API-02', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Provide the contract first — OpenAPI or AsyncAPI',
    story: 'As a Standard User, I want to upload or link my API contract as the primary artefact of the request, so that the design is agreed before anything is provisioned.',
    ac: [
      'Given I am publishing a synchronous API, when I reach the contract step, then I must supply an OpenAPI (3.x) document by upload or by URL.',
      'Given I am publishing an event-driven or asynchronous interface, when I reach the contract step, then I must supply an AsyncAPI document instead.',
      'Given I supply a contract, when it is received, then it is linted against the departmental API standards ruleset and every error and warning is displayed against the offending line.',
      'Given the contract has linting errors of severity "error", when I attempt to submit, then submission is blocked until they are resolved.',
      'Given I have no contract yet, when I reach this step, then I can download a conforming starter template rather than being left stuck.'
    ]
  },
  {
    id: 'API-03', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Declare the interaction style with NFR-driven justification',
    story: 'As a Standard User, I want to declare whether my API is synchronous request/response, asynchronous, or publish/subscribe, and justify it against NFRs, so that the platform is not asked to expose an unsuitable back-end behind a blocking call.',
    ac: [
      'Given I reach the interaction step, when it loads, then I select from synchronous request/response, asynchronous (request/callback or polling), or publish/subscribe.',
      'And I supply the back-end response-time profile (p50, p95, p99), the back-end availability target, and the delivery guarantee required (at-most-once, at-least-once, exactly-once).',
      'Given my declared p99 exceeds the synchronous threshold, when I nonetheless select synchronous, then the anti-pattern is flagged, I must record a justification, and the flag is carried through to the approver.',
      'Given I select publish/subscribe, when I continue, then I declare the topic, the event schema reference and the expected subscriber growth.'
    ]
  },
  {
    id: 'API-04', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Define the authentication and authorisation model',
    story: 'As a Standard User, I want to declare how consumers of my API will authenticate, so that the correct gateway policy is applied and no unprotected endpoint is ever published.',
    ac: [
      'Given I reach the security step, when it loads, then I select an authorisation model from the permitted set (OAuth 2.0 client credentials, OAuth 2.0 authorization code, mutual TLS, API key where permitted).',
      'Given the platform forbids unauthenticated APIs, when no model is selected, then I cannot proceed.',
      'Given I select OAuth 2.0, when I continue, then I declare the required scopes and the mapping of each scope to each operation in the contract.',
      'Given I select mutual TLS, when I continue, then I upload or request the client certificate and the portal validates its algorithm strength and expiry.',
      'Given credentials must be issued, when the request is approved, then they are issued by the platform and delivered by a secure one-time mechanism — never rendered in the portal UI or in an email body.'
    ]
  },
  {
    id: 'API-05', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Declare traffic profile, rate limits and service levels',
    story: 'As a Standard User, I want to declare my expected load and required service level, so that gateway throttling is set correctly and the platform can capacity-plan.',
    ac: [
      'Given I reach the traffic step, when I complete it, then I declare expected average TPS, peak TPS, peak window, average and maximum payload size, and required availability SLO.',
      'Given I declare a peak TPS above the standard tier, when I continue, then the request is automatically flagged for capacity review.',
      'Given rate limiting is mandatory, when I complete the step, then a default rate limit and burst allowance are proposed and I may request a different value with a justification.',
      'Given I request an availability SLO above the platform standard, when I continue, then I am shown the cost and architectural implication before I can proceed.'
    ]
  },
  {
    id: 'API-06', epic: 'E4', persona: 'Standard User', priority: 'Should', points: 5,
    title: 'Select environment, routing and gateway policy set',
    story: 'As a Standard User, I want to declare the environment and back-end routing for my API, so that the gateway can be configured from my request without a bespoke build.',
    ac: [
      'Given I reach the routing step, when I complete it, then I supply the back-end base URL per environment and the public-facing base path.',
      'Given the base path collides with an existing published API, when I attempt to continue, then I am blocked and shown the conflicting API.',
      'Given policy sets are standardised, when I complete the step, then I select from named, pre-approved gateway policy bundles (for example: standard, high-security, partner-facing) rather than composing policies myself.',
      'Given I need a policy that no bundle provides, when I select "Request non-standard policy", then the request is routed for enhanced review with my justification attached.'
    ]
  },
  {
    id: 'API-07', epic: 'E4', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Review and submit the API request',
    story: 'As a Standard User, I want to review the full API request and submit it, so that it enters the approval queue with a reference I can quote.',
    ac: [
      'Given every mandatory section is complete and the contract lints clean, when I reach review, then I see the full request including the resolved contract summary (operations, schemas, scopes).',
      'And I see a statement confirming that approval creates gateway configuration from my declared values and does not create a bespoke integration component.',
      'Given I submit, when submission succeeds, then the status changes to Submitted, a unique reference is generated, confirmations are sent, and the request enters the correct approval queue.',
      'Given any anti-pattern flag or non-standard request is present, when the request enters the queue, then it is visibly badged as requiring enhanced review.'
    ]
  },

  /* ---------------- E5 Track, Amend & Withdraw ---------------- */
  {
    id: 'TRK-01', epic: 'E5', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Track the status of my requests',
    story: 'As a Standard User, I want to see where each of my requests is in the approval process, so that I do not have to chase anyone to find out.',
    ac: [
      'Given I open "My requests", when the list loads, then each request shows its reference, type, environment, current status, current owner and the age in working days.',
      'Given I open a request, when the detail loads, then I see a full timeline of every state transition with actor and timestamp.',
      'Given a request is awaiting approval, when I view it, then I see the target SLA date for the decision.',
      'Given I want to find one request among many, when I use the filters, then I can filter by type, status, environment and date range.'
    ]
  },
  {
    id: 'TRK-02', epic: 'E5', persona: 'Standard User', priority: 'Must', points: 3,
    title: 'Be notified when a decision or query is raised',
    story: 'As a Standard User, I want to be notified when my request is approved, rejected or queried, so that I can act without watching the portal.',
    ac: [
      'Given my request changes status, when the transition is committed, then I receive a notification containing the reference, the new status and the reason where one was given.',
      'And the notification contains a deep link to the request in the portal.',
      'And the notification never contains a secret, key or credential.',
      'Given the business owner is nominated on the request, when a terminal decision is made, then they are copied.'
    ]
  },
  {
    id: 'TRK-03', epic: 'E5', persona: 'Standard User', priority: 'Must', points: 5,
    title: 'Respond to a request for more information',
    story: 'As a Standard User, I want to answer an approver\'s query and resubmit, so that a query does not force me to start again.',
    ac: [
      'Given the approver has set my request to "Awaiting Information", when I open it, then it becomes editable again and their question is displayed prominently against the section it concerns.',
      'Given I have answered, when I resubmit, then the request returns to the same approver (not to the back of a generic queue) with my answer attached to the thread.',
      'Given the request is Awaiting Information, when the SLA clock is evaluated, then the time spent waiting on me is excluded from the approver\'s SLA.',
      'Given I do not respond within the configured period, when the period elapses, then I am reminded, and after a second period the request is auto-withdrawn with notification.'
    ]
  },
  {
    id: 'TRK-04', epic: 'E5', persona: 'Standard User', priority: 'Should', points: 3,
    title: 'Amend a rejected request and resubmit',
    story: 'As a Standard User, I want to clone a rejected request, fix the issue and resubmit, so that I retain the effort I already invested.',
    ac: [
      'Given my request was rejected, when I select "Amend and resubmit", then a new request is created pre-populated with every value from the rejected one.',
      'And the new request retains a link to its predecessor and to the rejection reason.',
      'Given I resubmit, when the approver opens it, then they see a field-level difference against the rejected version so they can review only what changed.'
    ]
  },
  {
    id: 'TRK-05', epic: 'E5', persona: 'Standard User', priority: 'Should', points: 2,
    title: 'Withdraw a request',
    story: 'As a Standard User, I want to withdraw a request that is no longer needed, so that I do not consume approver time on work that has been cancelled.',
    ac: [
      'Given my request is in Draft or Submitted, when I select "Withdraw" and confirm, then its status becomes Withdrawn and it is removed from the approval queue.',
      'Given a request has been approved, when I view it, then "Withdraw" is not offered; I must instead raise a decommission request (TRK-06).',
      'And the withdrawal, with actor and timestamp, is written to the audit trail.'
    ]
  },
  {
    id: 'TRK-06', epic: 'E5', persona: 'Standard User', priority: 'Should', points: 5,
    title: 'Request a change or decommission of a live interface',
    story: 'As a Standard User, I want to change or retire an interface that is already live, so that the config store stays accurate and dead interfaces do not linger.',
    ac: [
      'Given an interface of mine is live, when I select "Request change", then a new request is opened pre-populated with the current live configuration.',
      'And the approver sees a field-level difference between the live config and the proposed config.',
      'Given I select "Request decommission", when the request is approved, then the config row is disabled (not deleted) and retained for the audit retention period.',
      'Given the interface has been inactive for the configured dormancy period, when the dormancy job runs, then I am prompted to confirm whether it is still required.'
    ]
  },

  /* ---------------- E6 Admin Access & Approval Queue ---------------- */
  {
    id: 'ADM-01', epic: 'E6', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Sign in as an administrator with step-up authentication',
    story: 'As an MFT Admin, I want to sign in with my elevated role and complete a step-up authentication challenge, so that approval authority cannot be exercised from a merely-authenticated session.',
    ac: [
      'Given my IdP group grants the approver role, when I sign in, then the administrative navigation and approval queue are available to me.',
      'Given I attempt a decision action (approve, reject, conditionally approve), when the action is invoked, then I am challenged for multi-factor step-up authentication before the decision is committed.',
      'Given I fail the step-up challenge, when the decision is attempted, then no state change occurs and the failed attempt is written to the audit trail.',
      'Given I do not hold the approver role, when I attempt to reach an administrative URL directly, then the server rejects the request — access is enforced at the API, not only in the UI.',
      'Given administrative sessions carry higher risk, when I am idle, then a shorter idle timeout applies to me than to a standard user.'
    ]
  },
  {
    id: 'ADM-02', epic: 'E6', persona: 'MFT Admin', priority: 'Must', points: 8,
    title: 'Work an approval queue prioritised by risk and SLA',
    story: 'As an MFT Admin, I want a single queue of everything awaiting my decision, ordered so the urgent and risky surface first, so that I spend my attention where it matters.',
    ac: [
      'Given I open the approval queue, when it loads, then I see every request awaiting decision in my approver group with reference, type (MFT/API), requester, service line, environment, age in working days and SLA status.',
      'And requests are badged where they carry an anti-pattern flag, an enhanced-review flag (personal data, non-standard policy, capacity), or a Production target.',
      'And I can sort and filter by any of those attributes.',
      'Given a request is approaching or has breached its decision SLA, when the queue renders, then it is visually distinguished.',
      'Given the queue is empty, when it loads, then I see an explicit empty state rather than an ambiguous blank list.'
    ]
  },
  {
    id: 'ADM-03', epic: 'E6', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Open a request and see the complete submission',
    story: 'As an MFT Admin, I want to see everything the requester submitted on one screen, so that I can make a decision without hunting through attachments or emailing for context.',
    ac: [
      'Given I open a request from the queue, when the detail loads, then every submitted section is rendered read-only in a single scrollable view with a section index.',
      'And for an MFT request I see the exact config row that would be written on approval.',
      'And for an API request I see the parsed contract summary — operations, schemas, scopes, and the linting result.',
      'Given the request is an amendment or a change to a live interface, when I open it, then I see a field-level difference highlighting only what changed.',
      'Given I need to see the history, when I open the timeline, then every prior state transition, comment and prior decision on the lineage is visible.'
    ]
  },
  {
    id: 'ADM-04', epic: 'E6', persona: 'MFT Admin', priority: 'Must', points: 8,
    title: 'See the automated pre-check results before deciding',
    story: 'As an MFT Admin, I want the platform to have already checked the mechanical things, so that my review is spent on judgement rather than on validation a machine could do.',
    ac: [
      'Given a request enters the queue, when I open it, then a pre-check panel shows a pass/warn/fail result for each automated check.',
      'And the checks include at minimum: naming-standard conformance, duplicate/collision detection, credential strength and expiry, contract linting (API), data-classification-versus-protocol compatibility, capacity threshold, IP allow-list validity, and anti-pattern flags.',
      'Given any check has failed, when I view the panel, then the failure is stated in one line with a link to the offending field.',
      'Given every check has passed and the request carries no enhanced-review flag, when I view the request, then it is eligible for the low-risk fast path (DEC-07).',
      'Given a pre-check fails, when I attempt to approve, then I am not blocked, but I must record an explicit override justification which is retained in the audit trail.'
    ]
  },

  /* ---------------- E7 Decision ---------------- */
  {
    id: 'DEC-01', epic: 'E7', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Approve a request',
    story: 'As an MFT Admin, I want to approve a request with a recorded rationale, so that the interface can be provisioned and the decision is defensible after the fact.',
    ac: [
      'Given I am reviewing a request, when I select "Approve", then I am required to complete step-up authentication (ADM-01).',
      'And I may record an approval rationale, which is mandatory where any pre-check warned or failed, or where an anti-pattern flag is present.',
      'Given I confirm, when the decision commits, then the status becomes Approved, the request becomes immutable, and provisioning is triggered (PRV-01).',
      'And the requester and the business owner are notified.',
      'And the decision, the actor, the timestamp, the rationale and the state of every pre-check at the moment of decision are written to the immutable audit trail.'
    ]
  },
  {
    id: 'DEC-02', epic: 'E7', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Reject a request with a reason the requester can act on',
    story: 'As an MFT Admin, I want to reject a request with a structured reason, so that the requester understands precisely what to fix and does not simply resubmit the same thing.',
    ac: [
      'Given I am reviewing a request, when I select "Reject", then I must choose at least one reason code from a governed list (for example: fails security policy, fails naming standard, unsuitable pattern, incomplete information, duplicate interface, capacity not available, data classification not permitted).',
      'And I must supply free-text detail; a reason code alone is not sufficient.',
      'And I may attach the rejection to one or more specific fields so the requester sees it in context.',
      'Given I confirm after step-up authentication, when the decision commits, then the status becomes Rejected, the requester and business owner are notified with the reason, and no provisioning occurs.',
      'Given the request is rejected, when the requester views it, then "Amend and resubmit" is offered (TRK-04).'
    ]
  },
  {
    id: 'DEC-03', epic: 'E7', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Return a request for more information',
    story: 'As an MFT Admin, I want to ask the requester a question without rejecting the request outright, so that a single missing detail does not cost the requester a full resubmission.',
    ac: [
      'Given I am reviewing a request, when I select "Request information", then I must supply a question and may anchor it to one or more specific fields.',
      'Given I confirm, when the action commits, then the status becomes Awaiting Information, the request becomes editable by the requester, and it leaves my active queue.',
      'And my decision SLA clock is paused for the duration the request is with the requester.',
      'Given the requester responds, when they resubmit, then the request returns to me specifically, with their answer threaded against my question.'
    ]
  },
  {
    id: 'DEC-04', epic: 'E7', persona: 'MFT Admin', priority: 'Should', points: 5,
    title: 'Approve conditionally, with binding conditions',
    story: 'As an MFT Admin, I want to approve a request subject to stated conditions, so that a low-risk interface is not held up while a non-blocking issue is resolved.',
    ac: [
      'Given I am reviewing a request, when I select "Approve with conditions", then I must state each condition and a due date for it.',
      'Given I confirm, when the decision commits, then provisioning proceeds, and the interface is flagged as conditionally approved in the config store.',
      'Given a condition passes its due date unmet, when the condition-monitoring job runs, then the requester and I are alerted and the interface is escalated for review.',
      'Given all conditions are marked met, when the last one is closed, then the conditional flag is cleared and the audit trail records who closed it.'
    ]
  },
  {
    id: 'DEC-05', epic: 'E7', persona: 'MFT Admin', priority: 'Should', points: 3,
    title: 'Reassign or delegate a request to another approver',
    story: 'As an MFT Admin, I want to hand a request to a colleague, so that absence or a specialist question does not stall the queue.',
    ac: [
      'Given I hold a request, when I select "Reassign", then I can select another approver within an eligible approver group and must supply a reason.',
      'Given I reassign, when the action commits, then the request moves to their queue, the SLA clock continues unbroken, and the requester sees the new owner.',
      'Given I will be absent, when I set a delegation period, then requests routed to me during that period are automatically routed to my nominated delegate.'
    ]
  },
  {
    id: 'DEC-06', epic: 'E7', persona: 'MFT Admin', priority: 'Must', points: 3,
    title: 'Enforce segregation of duties',
    story: 'As an MFT Admin, I want the platform to make it impossible for anyone to approve their own request, so that the control is guaranteed by the system rather than by good behaviour.',
    ac: [
      'Given I raised a request and I also hold the approver role, when that request reaches the queue, then it is not presented to me and the decision actions are not available to me on it.',
      'And the rule is enforced server-side: a direct API call to approve my own request is rejected.',
      'Given I am the only approver in the group, when I raise a request, then it is automatically routed to the escalation approver group rather than being blocked indefinitely.',
      'Given any attempt to bypass the rule occurs, when it is rejected, then the attempt is written to the audit trail.'
    ]
  },
  {
    id: 'DEC-07', epic: 'E7', persona: 'MFT Admin', priority: 'Could', points: 5,
    title: 'Fast-path approval for low-risk requests',
    story: 'As an MFT Admin, I want to approve a batch of requests that passed every pre-check and carry no risk flags, so that routine non-production work does not consume the same effort as a production change.',
    ac: [
      'Given multiple requests have passed every automated pre-check, carry no enhanced-review flag and target a non-production environment, when I open the fast path, then I may select and approve them together.',
      'Given I fast-path approve, when the decision commits, then step-up authentication is still required once for the batch, and each request receives its own individual audit entry.',
      'Given any request in my selection is not fast-path eligible, when I attempt to include it, then it is excluded from the batch with the reason shown.',
      'Given a request targets Production, when I attempt to fast-path it, then it is never eligible, regardless of pre-check results.'
    ]
  },

  /* ---------------- E8 Provisioning ---------------- */
  {
    id: 'PRV-01', epic: 'E8', persona: 'Platform Engineer', priority: 'Must', points: 8,
    title: 'Approval writes a configuration row — not a new component',
    story: 'As a Platform Engineer, I want an approved request to become a row in the config store consumed by the existing generic engine, so that the estate does not accumulate one Boomi component per interface.',
    ac: [
      'Given a request is approved, when provisioning runs, then a single configuration record is written to the MFT config store (or the gateway policy store, for an API) keyed by the request reference.',
      'And no new Boomi process, connection or component is created for that interface.',
      'And the generic engine picks up the new configuration without redeployment.',
      'Given the config schema does not have a column for something a requester needs, when that gap is identified, then it is handled by a schema extension, never by a bespoke per-interface process.',
      'Given provisioning completes, when I inspect the config store, then the row is traceable to the approved request, the approver and the timestamp.'
    ]
  },
  {
    id: 'PRV-02', epic: 'E8', persona: 'Standard User', priority: 'Must', points: 8,
    title: 'Issue credentials securely on approval',
    story: 'As a Standard User, I want any keys or credentials my interface needs to be issued and delivered securely, so that no secret is ever sent by email or displayed in a page I might screenshot.',
    ac: [
      'Given my approved request asked for platform-generated credentials, when provisioning runs, then they are generated in the secrets store and never written to the portal database in plaintext.',
      'And I am notified that credentials are ready via a link that requires me to re-authenticate.',
      'And the secret is revealed once, is time-limited, and cannot be retrieved a second time through the portal.',
      'Given the credential has an expiry, when the expiry approaches, then I and the technical contact are notified in advance with instructions to rotate.',
      'Given a credential must be rotated, when I request rotation, then it follows the same secure issuance path without requiring a new onboarding request.'
    ]
  },
  {
    id: 'PRV-03', epic: 'E8', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'See provisioning succeed or fail, and roll back cleanly',
    story: 'As an MFT Admin, I want to know whether the approval actually resulted in a working interface, so that an approved-but-broken interface does not sit undetected.',
    ac: [
      'Given a request is approved, when provisioning runs, then its status moves through Provisioning to either Live or Provisioning Failed.',
      'Given provisioning fails, when the failure occurs, then any partial configuration is rolled back, the approver and requester are notified, and the failure reason is displayed.',
      'Given provisioning succeeds, when the status becomes Live, then a connectivity smoke test result is recorded against the interface.',
      'Given the smoke test fails, when the result is recorded, then the interface is flagged as Live (Unverified) rather than being silently marked healthy.'
    ]
  },

  /* ---------------- E9 Audit, Reporting & NFRs ---------------- */
  {
    id: 'AUD-01', epic: 'E9', persona: 'MFT Admin', priority: 'Must', points: 5,
    title: 'Maintain an immutable audit trail',
    story: 'As an MFT Admin, I want every action on every request permanently recorded, so that I can demonstrate to an auditor exactly who approved what, when and on what basis.',
    ac: [
      'Given any state transition, decision, override, reassignment or credential issuance occurs, when it commits, then an audit record is written capturing actor, role, action, timestamp, request reference and rationale.',
      'And audit records are append-only; no user, including an administrator, can edit or delete one through any interface.',
      'And the audit trail records failed authorisation attempts as well as successful actions.',
      'Given an auditor needs evidence, when they export the trail for a request or a date range, then a complete, tamper-evident export is produced.',
      'Given the retention policy applies, when the retention period elapses, then records are archived, not destroyed, unless destruction is explicitly mandated.'
    ]
  },
  {
    id: 'AUD-02', epic: 'E9', persona: 'MFT Admin', priority: 'Should', points: 5,
    title: 'Report on throughput, SLA and rejection reasons',
    story: 'As an MFT Admin, I want to see how the onboarding service is actually performing, so that I can fix the causes of rejection rather than just processing the symptoms.',
    ac: [
      'Given I open reporting, when it loads, then I see requests submitted, approved, rejected and withdrawn over a selectable period, split by MFT and API.',
      'And I see median and 90th-percentile time-to-decision against SLA, with time spent Awaiting Information excluded.',
      'And I see rejection reason codes ranked by frequency, so that the commonest causes can be designed out of the form.',
      'And I see the proportion of requests requiring enhanced review and the proportion carrying anti-pattern overrides.',
      'Given I need the underlying data, when I select export, then I can download the dataset.'
    ]
  },
  {
    id: 'NFR-01', epic: 'E9', persona: 'All', priority: 'Must', points: 5,
    title: 'Meet accessibility standards',
    story: 'As any user, I want the portal to be usable with assistive technology, so that the service is available to every colleague and meets the department\'s legal obligation.',
    ac: [
      'Given the portal is assessed, when it is tested, then it conforms to WCAG 2.2 Level AA.',
      'And every function, including the full request forms, review screens and decision actions, is completable by keyboard alone.',
      'And every form error is announced by a screen reader and associated programmatically with the field it concerns.',
      'And no meaning is conveyed by colour alone — risk badges and SLA warnings carry a text or icon equivalent.'
    ]
  },
  {
    id: 'NFR-02', epic: 'E9', persona: 'All', priority: 'Should', points: 3,
    title: 'Meet performance and availability targets',
    story: 'As any user, I want the portal to be responsive and available, so that it is faster to self-serve than to raise a ticket — otherwise nobody will use it.',
    ac: [
      'Given normal load, when I load any page, then it renders within the agreed response-time budget at the 95th percentile.',
      'Given the approval queue contains a large number of requests, when it loads, then it pages and filters server-side rather than degrading.',
      'Given the portal is unavailable, when the outage occurs, then no in-flight request data is lost and drafts survive.',
      'Given the service level is defined, when availability is measured, then it is reported against the agreed SLO in the reporting view (AUD-02).'
    ]
  }
];

const CHALLENGES = [
  {
    q: 'Intelligrator was scoped as MFT-only. This request adds API onboarding. Is that right?',
    a: 'It is defensible, but it is a genuine scope change and must be recognised as one. The two journeys share a great deal — identity, drafting, queue, decision, audit, provisioning-as-config — and duplicating that machinery for a separate API portal would be waste. The divergence is entirely in Epic 3 versus Epic 4. <strong>Recommendation:</strong> build the shared spine once, treat MFT and API as two request types over it, and deliver MFT first. Do not, however, quietly re-label the existing MFT-only product overview — the client signed off on a narrower scope and should be shown the delta explicitly.'
  },
  {
    q: 'Should the API journey really go through the same approval gate as MFT?',
    a: 'Not necessarily the same approvers. An MFT Admin is not automatically qualified to assess an OpenAPI contract, an OAuth scope model or a rate-limit profile. The queue and decision machinery should be shared; the <em>approver group</em> should be routed by request type and service line. The stories above are deliberately written so that ADM-02 routes by approver group rather than assuming one pool of humans.'
  },
  {
    q: 'Does adding API onboarding break the "config over construction" principle?',
    a: 'No, provided the discipline holds. For MFT, an approved request is a config row consumed by the generic engine. For API, an approved request is a gateway configuration derived from the contract plus a <em>named, pre-approved policy bundle</em> (API-06). The moment someone is allowed to compose arbitrary policies per interface, the principle is broken and component sprawl returns in a new costume. API-06 exists precisely to hold that line.'
  },
  {
    q: 'Is the anti-pattern check (REQ-02, API-03) going to be resented as the portal telling people what to do?',
    a: 'Probably, at first. Which is why it is designed as an <em>override with recorded justification</em>, not a hard block. The requester keeps agency; the approver gets visibility; the reporting view (AUD-02) makes the pattern of overrides visible over time. If a particular flag is being overridden nine times out of ten, the threshold is wrong and should be tuned — the data will tell you.'
  },
  {
    q: 'Why is step-up authentication on the decision action rather than at admin sign-in?',
    a: 'Both, in fact — but the decision action is the one that matters. Session-level MFA proves who opened the browser hours ago. Action-level step-up proves who is exercising approval authority at the moment authority is exercised. For a control that an auditor will test, that distinction is the whole point.'
  }
];

const STATES = [
  { s: 'Draft',                a: 'Requester', d: 'Being completed. Not visible to approvers. Auto-saved. Subject to retention.' },
  { s: 'Submitted',            a: 'Approver',  d: 'In the approval queue. Read-only to the requester. Decision SLA clock running.' },
  { s: 'Awaiting Information', a: 'Requester', d: 'Returned with a question. Editable by requester. Approver SLA clock paused.' },
  { s: 'Approved',             a: 'Platform',  d: 'Decision committed and immutable. Provisioning triggered.' },
  { s: 'Approved (Conditional)', a: 'Platform', d: 'Provisioning proceeds; conditions tracked to a due date and escalated if unmet.' },
  { s: 'Rejected',             a: 'Requester', d: 'Terminal. Reason code and detail attached. May be amended and resubmitted as a new request.' },
  { s: 'Withdrawn',            a: '—',         d: 'Terminal. Cancelled by the requester or auto-withdrawn after non-response.' },
  { s: 'Provisioning',         a: 'Platform',  d: 'Config row / gateway config being written. Transient.' },
  { s: 'Provisioning Failed',  a: 'Approver',  d: 'Partial config rolled back. Approver and requester notified.' },
  { s: 'Live',                 a: 'Requester', d: 'Config active and smoke-tested. Change and decommission requests available.' },
  { s: 'Live (Unverified)',    a: 'Approver',  d: 'Config active but smoke test failed or was not run. Flagged, not silently healthy.' },
  { s: 'Decommissioned',       a: '—',         d: 'Config row disabled, not deleted. Retained for the audit retention period.' }
];

if (typeof module !== 'undefined') {
  module.exports = { META, PERSONAS, PRINCIPLES, EPICS, STORIES, CHALLENGES, STATES };
}
