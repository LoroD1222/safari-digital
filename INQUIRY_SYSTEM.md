# Safari Digital inquiry system

The website now includes a four-step qualification form, secure inquiry persistence, email notifications, a private admin dashboard, and a customer-facing project progress page.

## Production setup

1. Create or select a Supabase project.
2. Run `supabase/migrations/202610290001_inquiry_system.sql` in the Supabase SQL editor.
3. Add every variable from `.env.example` to the Vercel project. Use a long random value for `RATE_LIMIT_SALT` and at least 32 random characters for `ADMIN_SESSION_SECRET`.
4. Verify the sending domain in Resend and set `RESEND_FROM_EMAIL` to an address on that domain.
5. Set `SAFARI_DIGITAL_INQUIRY_EMAIL` to the team inbox that should receive new leads.
6. Redeploy after the environment variables are saved.

The Supabase service-role key must only be stored as a server-side environment variable. Do not expose it through a `NEXT_PUBLIC_` variable.

## Main routes

- `/get-started` — lead qualification form. Package buttons preselect the relevant service and package through allowlisted query parameters.
- `/thank-you?token=...` — private progress link returned after a successful submission.
- `/admin` — password-protected inquiry dashboard and status editor.

## Lead workflow

New inquiries start at **Inquiry Received**. The admin dashboard can move them through:

1. Inquiry Received
2. Agency Review
3. Strategy Consultation
4. Proposal & Agreement
5. Project Onboarding

Every change creates an immutable status-history record. Internal notes are never returned by the public status endpoint.

## Email and analytics

- The team notification is sent through Resend after the inquiry is stored successfully.
- Set `SEND_CUSTOMER_CONFIRMATION=true` to send the optional customer confirmation.
- The form emits `form_start`, `form_step_complete`, and `lead_submission_success` to an existing Google `dataLayer`.
- An existing Meta Pixel receives a deduplicated `Lead` event only after the server confirms that the inquiry was stored.

## Smoke test after deployment

1. Open `/get-started` in an incognito window.
2. Complete one test inquiry with a unique email address.
3. Confirm that the thank-you page shows the generated reference and first progress stage.
4. Confirm that the team email arrives.
5. Sign in at `/admin`, locate the inquiry, add a note, and move it to the next stage.
6. Refresh the customer's progress link and confirm the updated stage appears without exposing the internal note.

If required production variables are missing, the submission endpoint returns a safe service-unavailable response and does not display a false success page.
