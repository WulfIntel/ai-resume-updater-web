# AI Resume Upgrade — ATS-Optimized, Job-Matched Rewrite (3 Versions Included)

## 1. Overview

This project is a complete web application that sells an AI-powered resume rewrite service.

- **Product name:** AI Resume Upgrade — ATS-Optimized, Job-Matched Rewrite (3 Versions Included)
- **Offer:** A one-time payment of **$5** via Stripe Checkout.
- **What you get:** Up to **3 AI-optimized versions** of your resume:
  - 1 initial enhanced resume right after payment.
  - Up to **2 additional revisions** generated on the success page using remaining credits.

The app focuses on **sales and customer-facing roles**, uses **OpenAI gpt-4o-mini** to rewrite resumes, and keeps the flow deliberately simple and transparent.

> **Important:** This project uses an **in-memory store** for sessions and credits. It is suitable for demos and MVPs, but not production-grade by itself.

---

## 2. Features

- Upload or paste your resume, plus optional notes.
- Paste a target **job description** to tailor each version.
- AI-enhanced resume rewrite using:
  - A structured **RTFC workflow** (Retrieve → Transform → Filter → Command).
  - **OpenAI gpt-4o-mini** as the model for all resume enhancement calls.
- **Stripe Checkout** integration for secure payment:
  - Uses a configured `STRIPE_PRICE_ID` for the $5 product.
- **3-credits system per purchase**:
  - Credits are tied to a single Stripe Checkout session.
  - 1 credit is consumed for the initial generation after payment.
  - Each revision on the success page consumes an additional credit.
  - When credits reach zero, the revision form is disabled and the user is prompted to start a new purchase.

---

## 3. Tech stack

**Backend**

- Node.js 18+
- Express
- Stripe Node SDK
- OpenAI Node SDK
- multer (file uploads)
- dotenv (environment configuration)

**Frontend**

- Static HTML pages served from `/public`
  - `index.html` (landing + initial form)
  - `success.html` (results + revisions)
  - `cancel.html` (payment canceled)
- Vanilla JavaScript:
  - `app.js` (landing page logic)
  - `success.js` (success page logic)
- One main stylesheet:
  - `styles.css`

**Storage / state**

- Custom **in-memory session store** (`server/store/sessionStore.js`) for:
  - Resume input data keyed by a `clientSessionId`.
  - Credit counts keyed by Stripe `checkoutSessionId`.

---

## 4. Prerequisites

Before running the app, you need:

1. **Node.js**
   - Version **18+** is recommended.

2. **Stripe account**
   - A Stripe account with:
     - A secret key (`STRIPE_SECRET_KEY`).
     - A **Price** set at **$5** (or your chosen amount) and its ID (`STRIPE_PRICE_ID`).

3. **OpenAI API key**
   - An active OpenAI API key (`OPENAI_API_KEY`) with access to **gpt-4o-mini**.

4. **App base URL**
   - The external or local base URL (e.g., `http://localhost:3000`) used to build Stripe success and cancel URLs (`APP_BASE_URL`).

---

## 5. Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your `.env` file**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. **Fill in environment variables in `.env`**

   ```dotenv
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PRICE_ID=price_your_price_id_here
   OPENAI_API_KEY=sk-your-openai-key-here
   APP_BASE_URL=http://localhost:3000
   PORT=3000
   ```

   - `STRIPE_SECRET_KEY` – your Stripe secret API key.
   - `STRIPE_PRICE_ID` – the ID of the Stripe Price for the $5 product.
   - `OPENAI_API_KEY` – your OpenAI API key.
   - `APP_BASE_URL` – must match how your app is accessed from the browser. For local development, `http://localhost:3000` is typical.
   - `PORT` – optional; defaults to `3000` if omitted.

On startup, `server/config.js` validates these variables and exits with a clear error if any are missing.

---

## 6. Running the app

### Start in normal mode

```bash
npm start
```

### Start in dev mode with auto-reload (optional)

```bash
npm run dev
```

This uses `nodemon` (included as a devDependency) to restart the server when files change.

### Default URL

Once running, open:

- `http://localhost:3000`

---

## 7. Project structure

```text
.
├─ package.json
├─ .env.example
├─ server
│  ├─ index.js                 # Express app entrypoint
│  ├─ config.js                # Environment/config loader & validation
│  ├─ routes
│  │  ├─ payments.js           # /api/payments endpoints (Stripe Checkout)
│  │  └─ resume.js             # /api/resume endpoints (upload & generate)
│  ├─ services
│  │  ├─ rtfcPromptBuilder.js  # Builds RTFC prompt for OpenAI
│  │  └─ resumeUpdater.js      # Calls OpenAI gpt-4o-mini to enhance resume
│  └─ store
│     └─ sessionStore.js       # In-memory store for resume data & credits
└─ public
   ├─ index.html               # Landing page & initial form
   ├─ success.html             # Success page & revision form
   ├─ cancel.html              # Payment canceled page
   ├─ app.js                   # Frontend logic for index.html
   ├─ success.js               # Frontend logic for success.html
   └─ styles.css               # Shared styles
```

---

## 8. Backend behavior

### 8.1 Config (`server/config.js`)

- Loads environment variables via `dotenv`.
- Exports:

  ```js
  {
    port,           // default 3000
    stripeSecretKey,
    stripePriceId,
    openAiApiKey,
    appBaseUrl
  }
  ```

- Validates that `stripeSecretKey`, `stripePriceId`, `openAiApiKey`, and `appBaseUrl` are set.
- If any are missing, logs a helpful error and exits.

### 8.2 Server entry (`server/index.js`)

- Sets up an Express app with:
  - `express.json()`
  - `express.urlencoded({ extended: true })`
- Serves static files from `/public`.
- Mounts routers:
  - `app.use("/api/payments", paymentsRouter);`
  - `app.use("/api/resume", resumeRouter);`
- Implements `GET /health` returning `{ status: "ok" }`.
- Starts listening on `config.port`.

### 8.3 Session store (`server/store/sessionStore.js`)

In-memory store for demo use:

- `saveResumeData(clientSessionId, data)`
  - Stores `{ resumeText, notes, jobDescription }`.
- `getResumeData(clientSessionId)`
  - Returns stored data or `null`.
- `initCreditsForPayment(checkoutSessionId, initialCredits = 3)`
  - Initializes credit count if not already present.
- `consumeCredit(checkoutSessionId)`
  - If credits > 0, decrements and returns `{ success: true, remainingCredits }`.
  - If no credits left, returns `{ success: false, remainingCredits: 0 }`.
- `getRemainingCredits(checkoutSessionId)`
  - Returns current credits or `null` if session unknown.

> Because this store is in-memory, all sessions and credits are lost if the server restarts.

### 8.4 Payments route (`server/routes/payments.js`)

Endpoint:

- **POST `/api/payments/create-checkout-session`**

  - Request body (JSON):

    ```json
    {
      "clientSessionId": "string"
    }
    ```

  - Validates `clientSessionId` is present.
  - Creates a Stripe Checkout Session:

    - `mode: "payment"`
    - `line_items: [{ price: config.stripePriceId, quantity: 1 }]`
    - `success_url: config.appBaseUrl + "/success.html?session_id={CHECKOUT_SESSION_ID}"`
    - `cancel_url: config.appBaseUrl + "/cancel.html"`
    - `metadata: { clientSessionId }`

  - Responds with:

    ```json
    {
      "url": "https://checkout.stripe.com/..."
    }
    ```

  - Webhooks are **not** used; instead, the app checks payment status when generating resumes.

### 8.5 Resume routes (`server/routes/resume.js`)

#### POST `/api/resume/upload-and-prepare`

Uploads and prepares resume data before payment and for revisions.

- Accepts `multipart/form-data`:

  - `resumeFile` (optional file)
  - `resumeText` (optional text field)
  - `notes` (optional text field)
  - `jobDescription` (required text field)

- Behavior:

  1. Validate that `jobDescription` is not empty.
  2. Build `finalResumeText`:
     - If `resumeText` exists and is non-empty → use it (trimmed).
     - Else, if `resumeFile` present:
       - If `mimetype === "text/plain"` → read buffer as UTF-8.
       - Otherwise → return a **friendly error** explaining that only text files are supported in this demo and that PDF/Word parsing is not implemented.
  3. If `finalResumeText` is still empty, respond with a validation error.
  4. Generate a simple `clientSessionId` (timestamp + random).
  5. Store `{ resumeText, notes, jobDescription }` in `sessionStore`.
  6. Respond with:

     ```json
     { "clientSessionId": "..." }
     ```

- Error responses use:

  ```json
  { "error": "CODE", "message": "Human-readable message" }
  ```

#### POST `/api/resume/generate`

Generates an enhanced resume, consuming one credit.

- Accepts JSON body:

  ```json
  {
    "checkoutSessionId": "string",
    "clientSessionId": "string"
  }
  ```

- Steps:

  1. Validate both fields are present.
  2. Use Stripe to retrieve the Checkout Session by `checkoutSessionId`.
  3. Ensure `payment_status === "paid"`.
  4. Initialize credits with `sessionStore.initCreditsForPayment(checkoutSessionId, 3)` if not present.
  5. Attempt to **consume** a credit with `sessionStore.consumeCredit(checkoutSessionId)`:
     - If `success === false`, return:

       ```json
       {
         "error": "NO_CREDITS",
         "message": "You have used all 3 resume upgrades for this purchase."
       }
       ```

       (HTTP 403)
  6. Fetch resume data with `getResumeData(clientSessionId)`:
     - If not found, return:

       ```json
       {
         "error": "INVALID_SESSION",
         "message": "Resume data not found for this session."
       }
       ```

       (HTTP 400)
  7. Call `resumeUpdater.generateEnhancedResume({ resumeText, notes, jobDescription })`.
  8. Return:

     ```json
     {
       "enhancedResumeText": "string",
       "remainingCredits": 2
     }
     ```

---

## 9. AI integration & RTFC prompt

### 9.1 RTFC prompt builder (`server/services/rtfcPromptBuilder.js`)

Exports:

```js
function buildRtfcPrompt({ resumeText, notes, jobDescription }) => { system, user }
```

- **System message**:
  - Frames the assistant as an expert resume writer for sales/customer-facing roles.
  - Enforces:
    - Use only true information from the original resume.
    - No invented companies, titles, dates, degrees, or certifications.
    - No placeholders like `[Your Name]`.
    - ATS-friendly output with simple headings and bullet points only.

- **User message**:
  - Describes the RTFC workflow:
    - **RETRIEVE** candidate resume, notes, and job description.
    - **TRANSFORM** resume to align with job description and emphasize customer-facing impact.
    - **FILTER** out irrelevant info and buzzword stuffing.
    - **COMMAND**: output only the final resume text, no commentary.
  - Includes the full `resumeText`, `notes`, and `jobDescription` in clearly delimited sections.
  - Specifies a desired structure:
    - Contact block
    - Professional Summary
    - Core Skills
    - Professional Experience
    - Education / additional sections only if present originally.

### 9.2 Resume updater (`server/services/resumeUpdater.js`)

- Imports and initializes the OpenAI Node SDK with `config.openAiApiKey`.
- Uses **`gpt-4o-mini`** for all completion calls:

  ```js
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.4,
    max_tokens: 900
  });
  ```

- Extracts the text of the first choice, trims it, and returns it.
- Logs and rethrows a concise error if the OpenAI call fails.

---

## 10. Frontend usage walkthrough

### 10.1 Landing page (`/` → `public/index.html` + `app.js`)

1. User visits `http://localhost:3000/`.
2. They see:
   - Product description and pricing: **$5 for up to 3 versions**.
   - A form to:
     - Upload a resume file (`.txt` fully supported in this demo).
     - Paste resume text (recommended).
     - Add optional notes.
     - Paste required job description.
3. On form submit:
   - `app.js`:
     - Validates:
       - At least one of `resumeFile` or `resumeText` is provided.
       - `jobDescription` is not empty.
     - Shows "Preparing payment…" status.
     - Sends `FormData` to `POST /api/resume/upload-and-prepare`.
     - On success:
       - Stores `clientSessionId` in `localStorage` under `aiResume_clientSessionId`.
       - Calls `POST /api/payments/create-checkout-session` with `{ clientSessionId }`.
       - Redirects browser to `session.url` (Stripe Checkout).

### 10.2 Payment (Stripe Checkout)

- Stripe hosts the payment form.
- On success, Stripe redirects to:

  ```text
  /success.html?session_id={CHECKOUT_SESSION_ID}
  ```

- On cancel, Stripe redirects to:

  ```text
  /cancel.html
  ```

### 10.3 Success page (`public/success.html` + `success.js`)

On load:

1. `success.js` reads:
   - `checkoutSessionId` from `session_id` query parameter.
   - `clientSessionId` from `localStorage`.
2. If either is missing:
   - Shows an error asking the user to return to the home page.
3. If both exist:
   - Immediately `POST /api/resume/generate` with `{ checkoutSessionId, clientSessionId }`.
   - On success:
     - Displays `enhancedResumeText` in `<pre id="enhancedResume">`.
     - Shows credits badge `"Credits left: X / 3"`.
   - On error:
     - Displays server message and stops.

Also on this page:

- Buttons to:
  - **Copy to clipboard** – uses `navigator.clipboard` to copy the enhanced resume text.
  - **Download .txt** – creates a `.txt` file from the resume text.
  - **Download .md** – same text with a `.md` filename.

### 10.4 Revisions (using remaining credits)

On the same success page:

- A "Request another version" form contains fields for:
  - Updated resume file (optional).
  - Updated resume text (optional).
  - Additional notes (optional).
  - Target job description (required).
- On submission, `success.js`:
  1. Validates:
     - One of `resumeFile` or `resumeText` is present.
     - `jobDescription` is present.
  2. Sends `FormData` to `/api/resume/upload-and-prepare`.
  3. Receives a new `clientSessionId` for the new input.
  4. Immediately calls `/api/resume/generate` with the same `checkoutSessionId` and new `clientSessionId`.
  5. On success:
     - Replaces displayed resume with the new version.
     - Updates the credits badge to the new `remainingCredits`.
     - Shows a success message: “New version generated from your remaining credits.”
  6. If the backend returns `NO_CREDITS`:
     - Shows the server message prominently.
     - Disables the revision form and shows a link/button back to `/` to start a new purchase.

---

## 11. Notes & limitations

- **In-memory storage only**
  - All data (resume text, notes, job descriptions, and credit counts) live only in memory.
  - If the server restarts:
    - All existing sessions and credits are lost.
    - Users would need to start a new purchase.
  - For production, replace `sessionStore.js` with a persistent database-backed implementation.

- **File parsing limitations**
  - The app **only fully supports plain text (`.txt`) files** for uploaded resumes.
  - PDF and Word docs (`.pdf`, `.doc`, `.docx`) are **not parsed**:
    - The `/api/resume/upload-and-prepare` endpoint returns a clear error if a non-`text/plain` file is uploaded.
    - Users are encouraged to paste the resume text directly into the textarea.
  - In production, you might integrate robust PDF/DOC parsing libraries to handle these formats.

- **Security & production readiness**
  - For production deployment:
    - Use **HTTPS** for all traffic and for `APP_BASE_URL`.
    - Restrict CORS, apply rate limiting, and validate inputs more strictly.
    - Consider adding Stripe webhooks for more robust payment verification.
    - Use proper logging, monitoring, and error tracking tools.
    - Implement persistent storage for sessions, resumes, and audit trails.

---

## 12. License & customization

This project is intended as a **demo/MVP** for an AI-powered resume upgrade service.

You are free to:

- Extend it with:
  - Database-backed sessions & credits.
  - Better file parsing for PDFs and Word documents.
  - Additional role-specific prompt variants.
  - Multi-language support or multiple pricing tiers.
- Integrate it into a larger application or portal.

Before using in production, be sure to:

- Harden security and input validation.
- Replace in-memory storage with a reliable database.
- Adjust pricing logic and Stripe configuration to match your real product.
- Review and monitor OpenAI usage and costs.