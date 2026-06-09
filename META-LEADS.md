# Meta Lead Ads → email nurture sequence

When someone submits one of your Meta (Facebook/Instagram) Lead Ad forms, the
app captures their email and runs them through a **3-stage email sequence**:

| Stage | When | Content |
|---|---|---|
| 1 | Immediately | Welcome + "start your Will" |
| 2 | Day 3 | Why a Scottish Will matters + `WELCOME10` (10% off) |
| 3 | Day 7 | Final nudge + the discount |

Built in: one-click **unsubscribe** (with `List-Unsubscribe` headers), and
existing paying customers are automatically **excluded** from the sequence.

## How it works

```
Meta Lead form submit
  → POST /api/meta-leads      (signature-verified webhook)
  → Graph API fetch lead email/name
  → Lead row created, stage-1 email sent immediately
Daily cron (/api/leads/cron, 09:00 UTC, via vercel.json)
  → sends stage 2 / 3 when due, stops on unsubscribe or conversion
```

Sequence content, cadence (`OFFSET_DAYS`), and the promo live in
`src/lib/leads.ts` — edit there to tune.

---

## Setup

### 1. Vercel environment variables

| Variable | Value |
|---|---|
| `META_VERIFY_TOKEN` | Any string you invent (used in step 2). |
| `META_APP_SECRET` | Facebook App → Settings → Basic → **App Secret**. |
| `META_PAGE_ACCESS_TOKEN` | Long-lived Page token with `leads_retrieval` (step 3). |
| `CRON_SECRET` | `openssl rand -base64 32` — secures the daily cron. |

`NEXT_PUBLIC_SITE_URL` (already set) is used for the email links.

### 2. Create the webhook (Facebook App)

1. At [developers.facebook.com](https://developers.facebook.com) create an App
   (type **Business**) — or reuse one tied to your Page's Business.
2. Add the **Webhooks** product → subscribe to the **Page** object.
3. **Callback URL:** `https://www.willbee.site/api/meta-leads`
   **Verify token:** the same string you set as `META_VERIFY_TOKEN`.
   Click **Verify and Save** (the app answers the handshake automatically).
4. Under the Page object, subscribe to the **`leadgen`** field.

### 3. Connect your Page + get a token

1. In **Graph API Explorer**, select your App and your Page, and grant
   `leads_retrieval`, `pages_show_list`, `pages_manage_metadata`.
2. Generate a **Page Access Token**, then exchange it for a **long-lived**
   token (Access Token Debugger → Extend, or the oauth/access_token endpoint).
   Put it in `META_PAGE_ACCESS_TOKEN`.
3. Subscribe your app to the Page's leads (once):
   ```
   POST https://graph.facebook.com/v21.0/<PAGE_ID>/subscribed_apps
        ?subscribed_fields=leadgen&access_token=<PAGE_ACCESS_TOKEN>
   ```

> **App Review:** to receive leads from the public (not just App admins/testers/
> devs), your app needs **Advanced Access** for `leads_retrieval`, which requires
> Meta App Review. You can fully test in development mode first (see below).

### 4. Redeploy

Set the env vars in Vercel and redeploy. The daily cron is already configured in
`vercel.json` (09:00 UTC). On the **Hobby** plan crons run once per day, which is
exactly right for a day-based drip; on Pro you could raise the frequency.

---

## Testing

1. Use Meta's **Lead Ads Testing Tool**
   (`https://developers.facebook.com/tools/lead-ads-testing`) — pick your Page
   and form, and submit a test lead.
2. Confirm the lead arrived: it should receive the **stage-1 email** within a
   minute (and a `Lead` row is created).
3. Manually trigger the cron to test later stages without waiting days:
   ```
   curl -H "Authorization: Bearer <CRON_SECRET>" https://www.willbee.site/api/leads/cron
   ```
   (Temporarily shorten `OFFSET_DAYS` in `src/lib/leads.ts` if you want stage 2/3
   to be due immediately while testing.)
4. Click **Unsubscribe** in an email → you should land on `/unsubscribe` and the
   lead's status flips to `unsubscribed` (no further emails).

## Notes

- Leads are de-duplicated by email; re-submissions don't restart the sequence.
- Marketing emails send from `RESEND_FROM` with `Reply-To` set to your support
  inbox, and always include an unsubscribe link (UK PECR/GDPR compliant).
- If `META_*` vars are unset, the webhook simply rejects calls — the rest of the
  app is unaffected.
