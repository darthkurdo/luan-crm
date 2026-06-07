# Luan Technology CRM

MSP CRM for Luan Technology Corp. — reads emails from Microsoft 365 and converts them into support tickets.

## Stack
- **React + Vite** — frontend
- **Vercel Serverless Functions** — M365 integration via Microsoft Graph
- **Microsoft 365** — email source (pescatlantic.com, vonoil.com)

---

## Deploy to Vercel (step by step)

### 1. Upload to GitHub

1. Go to **github.com** → click **"New repository"**
2. Name it `luan-crm`, set it as **Private**, click **Create**
3. On your computer, open a terminal in this folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/luan-crm.git
   git push -u origin main
   ```

### 2. Deploy on Vercel

1. Go to **vercel.com** → Sign in with GitHub
2. Click **"Add New Project"** → Import your `luan-crm` repo
3. Framework: **Vite** (auto-detected)
4. Click **"Deploy"** — first deploy will succeed even without env vars

### 3. Add Environment Variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `AZURE_TENANT_ID` | `63df5237-373a-4acf-91fd-c6fa81b3169d` |
| `AZURE_CLIENT_ID` | `151bc444-dc3b-4b81-a8bc-1914c119ac16` |
| `AZURE_CLIENT_SECRET` | *(your new secret after regenerating)* |
| `MAILBOX` | `alejandro@luantechnology.com` |

After adding variables → **Redeploy** (Deployments tab → ... → Redeploy)

### 4. Enable AI (optional — future)

When ready to add Claude AI suggestions, add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

Then uncomment the AI section in `api/emails.js` and `src/components/TicketPanel.jsx`.

---

## Local development

```bash
npm install
npm run dev
```

For local API testing, create a `.env.local` file:
```
AZURE_TENANT_ID=63df5237-373a-4acf-91fd-c6fa81b3169d
AZURE_CLIENT_ID=151bc444-dc3b-4b81-a8bc-1914c119ac16
AZURE_CLIENT_SECRET=your_secret_here
MAILBOX=alejandro@luantechnology.com
```

---

## Security reminder
- Never commit `.env.local` to GitHub (it's in .gitignore)
- Regenerate the Azure Client Secret since it was shared in chat
- The app never sends emails automatically — all replies require explicit user action
