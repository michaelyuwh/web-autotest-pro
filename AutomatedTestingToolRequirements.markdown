# Automated Testing Tool Requirements

## Project Overview
The goal is to develop a browser-based QA testing tool with a web UI as the control center, simplifying web testing for non-technical users. Users input a URL, launch it in a controlled environment, record actions (clicks, inputs, hovers, scrolls, navigation), handle dynamic elements (redirects, pop-ups), edit/manage test cases, store them locally, import/export for backup/reuse, define success/failure criteria, execute tests, capture video recordings (using Picture-in-Picture mode for live controls), and generate reports. The tool includes an embedded AI LLM (Phi-3 mini) with an on/off toggle, running locally without external APIs. It supports Chrome, Firefox, Edge (with IE mode), and Safari, deployed as a browser extension or PWA (via Docker or on-prem). An Android companion app uses Jetpack Compose for mobile monitoring. Docker is preferred for optimized PWA deployment, but on-prem running is supported for flexibility.

- **Purpose**: Enable intuitive web testing, inspired by Selenium IDE/Playwright, with enhanced usability, video/reporting, AI-driven features, and cross-browser support.
- **Target Audience**: Non-technical users with advanced options for developers.
- **Key Principles**: Clarity (modern UI), reliability, performance, offline capability, cross-browser compatibility.

## Functional Requirements
### 1. User Interface and Navigation
- **Dashboard**: Web-based control center (extension popup/PWA) with URL input (placeholder: "Enter target URL, e.g., https://example.com"). Launches page in new tab/iframe.
- **Dynamic URL Display**: Notify redirects, show final URL.
- **Pop-Up Indicators**: Highlight pop-ups (alerts, modals, windows/tabs) with modals (e.g., "A pop-up appeared—record it?").
- **Layout**: iOS 26 Liquid Glass style with fluid, translucent elements, expressive animations, glass-optics borders. Use Inter/Roboto fonts, colors (blue #007BFF for actions, green #28A745 for success, red #DC3545 for failures).
  - **Header**: Logo ("AutoTest Pro"), tabs (Dashboard, Test Cases, Settings), theme toggle.
  - **Sidebar**: Collapsible (New Recording, My Tests, Reports, Storage, AI Toggle).
  - **Main Area**: Dynamic panels for recording, editing.
  - **Footer**: Status (browser, AI status, Export).
  - Responsive (desktop-primary, mobile-friendly).
- **UI Design Details**:
  - **Style**: Liquid Glass with translucency, glowing effects, fluid animations (ripple on interactions), reactive color shifts. Customizable transparency for accessibility.
  - **Dashboard**: Card-based (e.g., "New Recording") with fluid borders; recent tests with pass/fail icons.
  - **Recording UI**: Split-screen (30% controls, 70% preview); PiP real-time dashboard for actions, inputs, mouse location (x,y). Multiple PiP/tabs for steps/mouse tracker; pause/stop/modify in PiP.
  - **Editing UI**: Canvas-style draggable step cards; glass-like property panel, AI popovers with ripple animations.
  - **Execution/Reports**: Analytics-style with video player, liquid-fill progress bar, tabbed reports (Steps, Errors, Metrics).
- **Accessibility**: WCAG-compliant (keyboard navigation, screen reader, high contrast); transparency toggle.
- **AI Configuration UI**: Toggle in Settings ("Enable AI; may increase resource usage").
- **Browser Adjustments**: Simplify for IE mode (no animations); optimize for Safari touch.
- **Android Companion**: Jetpack Compose app with declarative UI for dashboards, PiP previews, real-time test monitoring (e.g., sync via WebSockets), and composables for step editing (e.g., `LazyColumn` for action lists, `AnimatedVisibility` for animations). Supports UI testing with Compose APIs (e.g., `createComposeRule` for assertions like `onNodeWithText`). Integrates with web app for test case sync (import/export via JSON). Features include:
  - **Dashboard**: Displays test cases, execution status, reports in Material Design 3 layout with fluid transitions.
  - **Recording Control**: Start/pause/stop recordings; view real-time action logs in `LazyColumn`; modify steps via `TextField` composables.
  - **PiP Support**: Android PiP mode for floating dashboard (e.g., mouse coordinates, action previews); toggle via `enterPictureInPictureMode()`.
  - **Testing**: Use Espresso/Compose Test for UI validation; ensure <100ms latency for updates.

### 2. Recording Test Steps
- **Recording Mode**: Capture clicks, inputs, hovers, scrolls, navigation via event listeners (`click`, `input`, `mouseover`, `scroll`) and `MutationObserver`. PiP dashboard shows mouse location, inputs, action previews.
- **Selective Recording**: Pause/resume, select/deselect via PiP/toolbar. Real-time modification: edit/delete actions in PiP.
- **Picture-in-Picture**: Open multiple PiP windows (steps/controls, mouse tracker); limit to 2-3 instances. Real-time dashboard with action logs, inputs, mouse coordinates. Fallback to consolidated PiP (iframes) or docked overlays in VMs/lightweight browsers.
- **Readable Steps**: Natural language (e.g., "Clicked button 'Submit' at mouse (x:200, y:300)") with CSS/XPath selectors.
- **Redirect Handling**: Detect via `navigation` events; log as steps ("Redirected to https://new-url.com"). Include/exclude; follow in playback.
- **Pop-Up Handling**: Detect via `dialog`/`popup` listeners; pause for interact/record, dismiss, or ignore.
- **Context Switching**: Support window/iframe switching (e.g., "Switched to pop-up 'Ad'").
- **Smart Recording**: Heuristics for relevant actions; AI suggests optimal recording.
- **Browser Compatibility**: Playwright for Chrome/Firefox/Edge/Safari; custom DOM for IE mode (limited hover). VM: Screenshot fallbacks if PiP restricted.

### 3. Editing and Managing Test Cases
- **Step Editor**: Drag-and-drop step cards; edit descriptions, selectors, delays, assertions. Button-based reordering for IE mode.
- **Test Case Creation**: Group steps with metadata (description, tags, outcomes).
- **Redirect/Pop-Up Editing**: Modify URLs/pop-up logic; conditions (e.g., "If pop-up, dismiss"). Templates (e.g., "Cookie pop-up").
- **Conditional Logic**: Support via dropdowns (forms for IE mode).
- **Validation**: Warn on invalid edits (e.g., broken URLs).
- **Import/Export**: JSON/YAML files for backup/reuse. Export via "Download" button; import via file picker with schema validation (e.g., check `action`, `selector` fields). Supports team sharing and recovery.
- **Preview Mode**: Simulate redirect/pop-up handling.
- **AI-Assisted Editing**: Suggest optimizations or generate steps from natural language.
- **Browser Compatibility**: Support Safari WebKit drag-and-drop; simplify for IE mode.

### 4. Storage Management
- **Internal Storage**: IndexedDB for test cases; localStorage for IE. AI weights in IndexedDB.
- **Versioning**: Auto-version test cases for reversion.
- **Limits**: Soft limit (100 cases) with export warnings.
- **AI Data**: Bundle model weights with extension/PWA/Docker image; load from IndexedDB.

### 5. Test Execution and Reporting
- **Success/Failure Criteria**: Define via forms/dropdowns (e.g., "Success if '#success-message' contains 'Order Complete'"). AI suggests criteria from DOM.
- **Playback**: Headless/visible mode (visible for IE mode); supports loops/branching using Playwright (Chrome/Firefox/Edge/Safari) or DOM scripts (IE mode).
- **Redirect Playback**: Follow redirects; fail on mismatches; log details.
- **Pop-Up Playback**: Handle as recorded; criteria (e.g., "Fail if pop-up text != 'Confirmed'").
- **Video Recording**: MediaRecorder for MP4/GIF with action overlays; PiP shows progress. Fallback to html2canvas screenshots for Safari/IE.
- **Reports**: Step-by-step with pass/fail, screenshots, logs, metrics (e.g., execution time, failure points). Enhanced export formats:
  - **PDF**: Generated via jsPDF; includes test case name, steps, pass/fail status, timestamps, screenshots (base64-encoded), video embeds (QR code links to local storage), metrics (e.g., execution time, failure rate), and customizable elements (e.g., cover page with logo, table of contents, summary stats like pass/fail percentages, browser details). Supports A4/Letter formats, WCAG-compliant fonts/sizes, and annotations (e.g., failure highlights).
  - **HTML**: Interactive report with collapsible sections (steps, errors, metrics), embedded video player (`<video>` tag with controls), clickable/zoomable screenshots, sortable metrics table (e.g., filter by failed steps), and export buttons for JSON/CSV/Markdown/XML. Styled with Tailwind CSS for Liquid Glass aesthetics; responsive for mobile. Includes interactive charts (e.g., pass/fail pie chart via Chart.js).
  - **JSON**: Machine-readable for CI/CD integration (e.g., `{testCase: {name: "Login", steps: [{step: "click", selector: "#submit", status: "pass", timestamp: "2025-10-01T01:29:00Z"}], metrics: {time: "5s", failures: 0, browser: "Chrome 128"}}`). Includes logs (e.g., error stack traces), metadata (e.g., browser version, device info).
  - **CSV**: Metrics-focused for spreadsheet analysis (e.g., columns: TestCase, Step, Status, Duration, Error, Timestamp, Browser). Example: `"Login,Click #submit,Pass,0.5s,,2025-10-01T01:29:00Z,Chrome"`. Supports bulk export for batch runs.
  - **Markdown**: Human-readable for documentation (e.g., `# Login Test\n## Steps\n- Click #submit: Pass (0.5s)\n## Metrics\n- Total Time: 5s\n- Browser: Chrome`). Includes screenshots as base64 or links, styled for GitHub/Jira rendering.
  - **XML**: Structured for enterprise tools (e.g., `<testcase name="Login"><step action="click" selector="#submit" status="pass" duration="0.5s"/></testcase>`). Supports JUnit-compatible schema for CI/CD pipelines (e.g., Jenkins).
- **Export Process**: "Export Report" button in UI; dropdown to select format (PDF/HTML/JSON/CSV/Markdown/XML). Files saved via `downloads` API; named with test case ID and timestamp (e.g., `LoginTest_20251001.pdf`). Batch exports as ZIP for multiple cases/formats. Docker/on-prem ensures export consistency via identical Node.js environments.
- **Batch Execution**: Run multiple cases with aggregated reports (e.g., pass/fail rates, total time). Export as single file (e.g., combined PDF or ZIP).
- **Error Handling**: Retry failed steps (3 attempts); skip on persistent failures; log with screenshots.
- **AI-Assisted Execution**: Suggest selector fixes, handle dynamic redirects/pop-ups.
- **Browser Compatibility**: Full support in Chrome/Firefox/Edge/Safari; IE mode uses screenshots, no AI.

### 6. Embedded AI LLM Integration
- **Purpose**: Enhance test case design, step generation, execution, and debugging locally using Phi-3 mini (preferred over Llama 3 8B for lightweight <500MB size vs. ~4-5GB, MIT license, and low-end device compatibility).
- **Configuration**: Toggle in Settings ("Enable AI; may increase resource usage"). Disabled in IE mode.
- **AI Use Cases with Examples**:
  - **Test Case Design**:
    - **Scenario Generation**: User inputs "Test e-commerce checkout flow"; AI generates: `{testCase: {name: "Checkout Flow", steps: [{action: "navigate", url: "/products"}, {action: "click", selector: "[data-testid='add-to-cart']"}, {action: "click", selector: "#checkout"}, {action: "input", selector: "#card-number", value: "4111111111111111"}, {action: "assert", selector: ".order-success", value: "Order Complete"}]}}`.
    - **DOM Analysis**: Scans `<form id="login">` and suggests: `{testCase: {name: "Login Test", steps: [{action: "input", selector: "#username", value: "testuser"}, {action: "input", selector: "#password", value: "wrongpass"}, {action: "click", selector: "#login"}, {action: "assert", selector: ".error", value: "Invalid credentials"}]}}`.
    - **Edge Cases**: For `<input type="email">`, suggests: `{testCase: {name: "Email Validation", steps: [{action: "input", selector: "#email", value: "user@"}, {action: "click", selector: "#submit"}, {action: "assert", selector: ".error", value: "Invalid email"}]}}`.
  - **Test Step Generation**:
    - **Natural Language to Steps**: User inputs "Enter 'testuser' in username field and click login"; AI generates: `{steps: [{action: "input", selector: "[data-testid='username']", value: "testuser"}, {action: "click", selector: "[data-testid='login']"}]}`.
    - **Assertions**: Detects `<div class="success">Welcome</div>`; suggests: `{action: "assert", selector: ".success", value: "Welcome"}`.
    - **Dynamic Elements**: For pop-ups, suggests: `{action: "click", selector: "#cookie-accept", condition: "if #cookie-banner exists"}`.
  - **Test Execution**:
    - **Selector Fixes**: On failure (e.g., "#submit not found"), AI suggests: `{selector: "[type='submit']"}` based on DOM attributes.
    - **Dynamic Handling**: For redirects, adds: `{action: "wait", condition: "url=~/success/", timeout: 5000}`. For pop-ups, generates: `if (document.querySelector("#popup")) { click("#popup-close") }`.
    - **Flaky Elements**: Detects slow load; adds: `{action: "waitForSelector", selector: "#loader", timeout: 5000}`.
  - **Debugging**:
    - **Failure Analysis**: On timeout (e.g., "Element #button not found"), AI checks DOM via `document.querySelectorAll()` and suggests: `{action: "waitForSelector", selector: "#button", timeout: 3000}` or `{selector: "[data-testid='button']"}`. Example: Test fails on "#submit"; AI finds `<button type="submit">` and proposes `{selector: "[type='submit']"}`.
    - **Flaky Test Fixes**: Detects intermittent failures (e.g., variable load times); recommends: `{action: "waitForTimeout", value: 1000}` or "Increase retry count to 5". Example: Test fails 30% of runs on "#dynamic-content"; AI suggests: `{action: "waitForSelector", selector: "#dynamic-content", timeout: 5000}`.
    - **Redirect Issues**: On unexpected redirect (e.g., to /error), suggests: `{action: "assert", condition: "url=~/success/", failure: "Log unexpected redirect"}`. Example: Test expects /success but gets /login; AI proposes: `{action: "navigate", url: "/login", condition: "if url=/error"}`.
    - **Pop-Up Handling**: For unrecorded pop-ups, suggests: `{action: "click", selector: "#dismiss", condition: "if #popup exists"}`. Example: Ad pop-up appears; AI generates: `if (document.querySelector("#ad-banner")) { click("#ad-close") }`.
    - **Performance Bottlenecks**: Identifies slow steps (e.g., long DOM queries); suggests: "Optimize selector to [data-testid='btn']" or "Run in headless mode". Example: Step takes 2s with complex XPath; AI proposes: `{selector: "#simple-id"}`.
    - **Cross-Browser Issues**: Detects browser-specific failures (e.g., Safari WebKit issue); suggests: "Use CSS selector instead of XPath for Safari compatibility". Example: XPath fails in Safari; AI recommends: `{selector: ".btn-primary"}`.
    - **Log Analysis**: Parses logs for errors (e.g., "TimeoutError"); suggests: `{action: "waitForLoadState", value: "domcontentloaded"}`. Example: Test hangs on page load; AI proposes: `{action: "waitForLoadState", value: "networkidle"}`.
    - **Network Errors**: Detects HTTP errors (e.g., 404 on resource load); suggests: `{action: "assert", condition: "response.status=200", url: "/api/data"}`. Example: Test fails due to 500 error; AI proposes: `{action: "retry", condition: "response.status!=200", maxAttempts: 3}`.
    - **JavaScript Errors**: Catches unhandled exceptions (e.g., "TypeError: null reference"); suggests: `{action: "assert", condition: "element exists", selector: "#element"}`. Example: Test fails on null DOM element; AI proposes: `{action: "waitForSelector", selector: "#element", timeout: 2000}`.
    - **Accessibility Issues**: Detects WCAG violations (e.g., missing alt text); suggests: "Add alt attribute to <img> for screen reader compatibility". Example: `<img src="logo.png">` fails; AI proposes: `{action: "assert", selector: "img[alt]", condition: "exists"}`.
    - **Shadow DOM Issues**: Detects failures in shadow DOM (e.g., element not accessible); suggests: `{selector: "hostElement /deep/ #inner-element"}`. Example: Test fails on shadow DOM button; AI proposes: `{action: "click", selector: "custom-component #button"}`.
    - **Timing Issues**: Detects race conditions (e.g., click before element renders); suggests: `{action: "waitForFunction", value: "document.querySelector('#element').isVisible"}`. Example: Test clicks too early; AI proposes: `{action: "waitForSelector", selector: "#element", timeout: 4000}`.
    - **Data-Driven Test Failures**: For parameterized tests (e.g., invalid inputs), AI suggests: `{action: "assert", selector: ".error", value: "Expected error for input: {input}"}`. Example: Test fails for input "user@"; AI proposes: `{action: "assert", selector: ".error", value: "Invalid email"}`.
  - **Recommendations**:
    - **Optimization**: Flags redundant steps (e.g., "Merge duplicate navigation to /home"); suggests: `{navigate: "/home"}` once.
    - **Templates**: Offers flows like "Login Flow": `{steps: [{action: "input", selector: "#user"}, {action: "input", selector: "#pass"}, {action: "click", selector: "#submit"}]}`.
    - **Performance**: Suggests: "Parallelize login/checkout tests for 20% faster execution".
- **Implementation**:
  - **Framework**: WebLLM/Transformers.js with WebGPU (primary) or WASM fallback for Chrome/Firefox/Edge/Safari.
  - **Model**: Phi-3 mini (3.8B parameters, Microsoft SLM, <500MB quantized, trained on 3.3T tokens, rivals GPT-3.5; MIT license; runs on low-end devices; 4K/128K context; SFT/DPO fine-tuned). Preferred over Llama 3 8B (~4-5GB, restrictive license, higher resource needs).
  - **Inference**: Use `engine.chat.completions.create()` for prompts (e.g., `Given DOM: <form id="login">, debug failure: Timeout on #submit`). Target 10-20 tokens/sec (WebGPU: <30ms/task; test with benchmarks).
  - **WebGPU**: GPU acceleration (Chrome 113+, Firefox 141+, Safari upcoming) for 3-4x faster inference than WASM. Benefits: low latency, local privacy, no server costs. Drawbacks: needs modern GPU; WASM fallback for others.
  - **Integration Details**:
    - **Setup**: Initialize in background.js: `await engine.load({model: "phi-3-mini", weights: "indexeddb://phi-3-mini"});`. Preload model chunks (<100MB) from IndexedDB (Docker or on-prem).
    - **Prompt Engineering**: Structured prompts (e.g., `Input: "Debug timeout on #submit"; DOM: <form id="login">; Output: JSON steps`). Example: `Prompt: "Debug timeout on #submit"; Response: {action: "waitForSelector", selector: "#submit", timeout: 3000}`.
    - **DOM Integration**: Use `document.querySelectorAll()` to inform AI (e.g., list `<input>` fields). Send outputs to UI via `postMessage` (e.g., debug suggestions in popovers).
    - **Error Handling**: Fallback to heuristics (e.g., static selector rules) if WebGPU/WASM fails; retry inferences once; log via Sentry.
    - **Performance**: Async loading; cache responses (e.g., selector suggestions) in IndexedDB; limit queries to 5-10/session; monitor CPU/GPU usage (<20% on mid-tier devices).
    - **Security**: Sanitize outputs (regex for `<script>`, malformed JSON); restrict to local execution; validate JSON schemas for steps/assertions.
  - **Expansion Notes**: Support fine-tuning with user datasets; enhance DOM parsing (e.g., shadow DOM); monitor latency (<200ms).

### 7. Additional Features
- **Cross-Browser Support**: Chrome, Firefox, Edge (IE mode), Safari.
- **Integration Hooks**: Export to CI/CD formats (e.g., Jest).
- **Parameterized URLs**: Support dynamic URLs (e.g., `https://example.com/{variable}`).
- **Comparisions**: 
  - **Vs TestCafe**: Similar no-driver recording/cross-browser; our tool includes AI, PiP dashboards, video reports, Liquid Glass UI, IE mode—TestCafe is JS/TS scripting-focused, lacks AI/mobile.

### 8. Non-Functional Requirements
- **Usability**: 
  - Layman-Friendly: Simple language, visual cues, tutorials, templates.
  - Guided Prompts: Clear options (e.g., "Record this redirect?").
  - AI Feedback: Show AI status in UI.
  - Browser Adjustments: Simplify for IE mode (no animations); optimize for Safari touch.
  - Responsiveness: Desktop-primary, mobile-friendly.
- **Performance**:
  - Recording: <100ms/action; <200ms in IE mode.
  - Playback: Mimic human speed; handle 100-step tests.
  - AI Inference: 10-20 tokens/sec; minimal impact when disabled.
  - Storage: Videos/reports <50MB; AI weights <500MB.
- **Security and Privacy**:
  - Mask sensitive data (e.g., passwords); HTTPS for backends.
  - Transparent permissions (e.g., screen recording, PiP).
  - GDPR/CCPA compliance for accounts.
  - Sanitize AI outputs; no external APIs.
- **Scalability and Maintainability**:
  - Modular code; self-test tool.
  - Extensible for future features (e.g., cloud sync).
- **Technical Constraints**:
  - Use browser APIs (WebExtensions, WebGPU, PiP); fallbacks for IE mode.
  - Minimize dependencies; use WebLLM, Playwright (preferred over Puppeteer for cross-browser support).

### 9. Deployment
- **Browser Extension**:
  - **Stores**: Chrome Web Store, Firefox Add-ons, Safari Extensions Gallery.
  - **Manifest**: V3 for Chrome/Edge/Firefox, adapt for Safari; V2 fallback for IE mode.
  - **Permissions**: `tabs`, `storage`, `scripting`, `activeTab`, `downloads`, `display`, `webNavigation`.
  - **Packaging**: Bundle React UI, WebLLM, Playwright with Webpack; AI weights in IndexedDB.
  - **Cross-Browser**: Full support in Chrome/Edge/Firefox/Safari; IE mode (no AI/video).
- **PWA (Docker or On-Prem)**:
  - **Docker**: Host on HTTPS (e.g., Nginx/Node.js); service worker for offline. Multi-stage build for optimization. Expose port 443; environment variables for configuration.
  - **On-Prem**: Serve via Node.js or Nginx; install dependencies manually (Node.js, Playwright, WebLLM). HTTPS required; service worker for offline.
  - **Configuration**: Use `manifest.json` for installability; support PiP/MediaRecorder. Limited in IE mode (prompt for extension).
- **AI Deployment**:
  - Bundle quantized Phi-3 mini (<500MB) in extension/PWA/Docker image; load from IndexedDB.
  - No external downloads; WebGPU for Chrome/Edge/Safari, WASM fallback for Firefox.
- **Tech Guidelines for Development Team**:
  - **Build**: Webpack bundle React/Tailwind/Playwright; wasm-loader for WebLLM; Babel for IE ES5. Split AI chunks <100MB; commands: `npm run build:chrome`, `docker build -t autotest-pro .`.
  - **AI Setup**: Phi-3 mini from Hugging Face; WebLLM `initChat` in background.js; set WebGPU via DefinePlugin; test latency <200ms.
  - **Testing**: Load unpacked (chrome://extensions/ etc.); Playwright tests: `npx playwright test`; Lighthouse >90 for PWA; npm audit deps. Docker tests: `docker run -it autotest-pro`.
  - **Release**: Sign for stores (`web-ext sign` for Firefox); .crx for sideloading (GPO for Edge IE); Workbox for PWA caching; push Docker image to registry (e.g., Docker Hub).
  - **Maintenance**: Sentry monitoring; update for browser changes; strict CSP; limit permissions.

### 10. Technology Stack
- **Frontend**: React.js + Tailwind CSS (Liquid Glass via CSS/JS).
- **Android Companion**: Jetpack Compose (declarative Kotlin UI).
- **Automation**: Playwright for recording/playback; DOM scripts for IE mode.
- **PiP/Video**: Document PiP API (multiple instances/tabs); MediaRecorder; html2canvas for Safari/IE.
- **AI**: WebLLM/Transformers.js with WebGPU/WASM (Phi-3 mini).
- **Storage**: IndexedDB; localStorage for IE.
- **Reporting**: jsPDF for PDF/HTML; Papa Parse for CSV; Markdown/XML for additional formats.
- **Build**: Webpack; polyfills (Babel, core-js) for IE; Docker for PWA deployment.