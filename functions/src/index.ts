/**
 * Firebase Functions for Amazon Review Tracker
 * Push notifications (stuck-status + Gmail review-live watcher)
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import webpush from "web-push";
import { OAuth2Client } from "google-auth-library";

// Initialize Firebase Admin
initializeApp();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// ─── Notification thresholds (edit these to adjust when pushes fire) ─────────
const THRESHOLDS = {
    statusStuck: {
        "add-review": 5,
        "review-pending": 10,
        "send-screenshot": 3,
        "refund-pending": 14,
    } as Record<string, number>,
};
// ─────────────────────────────────────────────────────────────────────────────

// Define secrets for Web Push (VAPID)
const vapidPublicKey = defineSecret("VAPID_PUBLIC_KEY");
const vapidPrivateKey = defineSecret("VAPID_PRIVATE_KEY");
const vapidSubject = defineSecret("VAPID_SUBJECT");

// Define secrets for Gmail OAuth (review-live watcher)
const gmailOAuthClientId = defineSecret("GMAIL_OAUTH_CLIENT_ID");
const gmailOAuthClientSecret = defineSecret("GMAIL_OAUTH_CLIENT_SECRET");
const gmailOAuthRedirectUri = defineSecret("GMAIL_OAUTH_REDIRECT_URI");
// Base URL of the deployed frontend, e.g. https://your-app.vercel.app — used to
// build the redirect target after the OAuth callback completes.
const appBaseUrl = defineSecret("APP_BASE_URL");

// Gmail search query per retailer — tune these once real subject lines are confirmed.
// `after:` (epoch seconds) is appended at query time based on lastCheckedAt.
const RETAILER_EMAIL_PATTERNS: Record<string, string> = {
    amazon: "from:(amazon.com) subject:(review)",
};

// Scheduled function: checks every product for every user daily, and pushes
// a notification for any item that's been sitting in the same status too
// long (see THRESHOLDS.statusStuck).
// Checks every product for every user, and pushes a notification for any
// item that's been sitting in the same status too long. Shared by the daily
// schedule and the manual test-trigger endpoint below.
async function runStuckStatusCheck(db: Firestore): Promise<{ totalPushSent: number; totalPushFailed: number }> {
    let totalPushSent = 0;
    let totalPushFailed = 0;

    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
        logger.info("No users found in database");
        return { totalPushSent, totalPushFailed };
    }

    logger.info(`Found ${usersSnapshot.size} users to check`);

    for (const userDoc of usersSnapshot.docs) {
        const productsSnapshot = await db
            .collection("users")
            .doc(userDoc.id)
            .collection("products")
            .get();

        if (productsSnapshot.empty) continue;

        logger.info(`Checking ${productsSnapshot.size} products for user ${userDoc.id}`);

        for (const productDoc of productsSnapshot.docs) {
            const data = productDoc.data();
            const product = { id: productDoc.id, item: data.item || 'Unknown Product', ...data };

            const stuck = daysStuckInStatus(product);
            if (stuck && shouldNotifyStuckStatus(product)) {
                try {
                    const wasSent = await sendStuckStatusPush(db, userDoc.id, productDoc.ref, product, stuck.status, stuck.days);
                    if (wasSent) {
                        totalPushSent++;
                        logger.info(`✅ Sent stuck-status push for ${product.item} (${stuck.status}, ${stuck.days}d)`);
                    }
                } catch (error) {
                    totalPushFailed++;
                    logger.error(`❌ Failed to send stuck-status push for ${product.item}:`, error);
                }
            }
        }
    }

    return { totalPushSent, totalPushFailed };
}

// Scheduled function: runs the stuck-status check daily.
export const dailyStuckStatusCheck = onSchedule(
    {
        schedule: "0 14 * * *", // 9 AM EST = 2 PM UTC (14:00)
        timeZone: "America/New_York",
        secrets: [vapidPublicKey, vapidPrivateKey, vapidSubject],
    },
    async () => {
        logger.info("🕘 Daily stuck-status check started");
        const db = getFirestore();
        configureWebPush();

        try {
            const result = await runStuckStatusCheck(db);
            logger.info(`🎯 Daily stuck-status check completed: ${result.totalPushSent} pushes sent, ${result.totalPushFailed} failed`);
        } catch (error) {
            logger.error("❌ Error in daily stuck-status check:", error);
        }
    }
);

// Manual trigger for testing — POST /triggerStuckStatusCheck
export const triggerStuckStatusCheck = onRequest(
    { secrets: [vapidPublicKey, vapidPrivateKey, vapidSubject], cors: true },
    async (request, response) => {
        if (request.method !== "POST") {
            response.status(405).json({ error: "Use POST" });
            return;
        }

        const db = getFirestore();
        configureWebPush();
        const result = await runStuckStatusCheck(db);
        response.status(200).json(result);
    }
);

// Returns number of days stuck in current status, or null if not applicable
function daysStuckInStatus(product: any): { status: string; days: number } | null {
    const status: string = product.lastStatus;
    if (!status || status === "complete" || status === "void") return null;
    if (!(status in THRESHOLDS.statusStuck)) return null;
    if (!product.statusChangedAt) return null;

    const changedAt = new Date(product.statusChangedAt);
    const today = new Date();
    const days = Math.floor((today.getTime() - changedAt.getTime()) / (1000 * 3600 * 24));
    const threshold = THRESHOLDS.statusStuck[status];

    return days >= threshold ? { status, days } : null;
}

const STATUS_LABELS: Record<string, string> = {
    "order-placed": "Order Placed",
    "add-review": "Add Review",
    "review-pending": "Review Pending",
    "send-screenshot": "Send Screenshot",
    "refund-pending": "Refund Pending",
};

// True if this stuck period hasn't been push-notified yet (i.e. no notification
// since the status last changed) — keeps stuck alerts to once per stuck period.
function shouldNotifyStuckStatus(product: any): boolean {
    if (!product.statusChangedAt) return true;
    if (!product.lastStuckNotifiedAt) return true;
    return new Date(product.lastStuckNotifiedAt).getTime() < new Date(product.statusChangedAt).getTime();
}

let webPushConfigured = false;
function configureWebPush(): void {
    if (webPushConfigured) return;
    const subject = vapidSubject.value();
    const publicKey = vapidPublicKey.value();
    const privateKey = vapidPrivateKey.value();
    if (!subject || !publicKey || !privateKey) {
        logger.warn("VAPID secrets not configured — push notifications will fail to send");
        return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    webPushConfigured = true;
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}

// Sends a push to every device the user has subscribed on, cleaning up dead
// subscriptions along the way. Returns false (without erroring) if the user
// has no active subscriptions yet — that's a normal "not opted in" case, not
// a failure.
async function sendPushToAllSubscriptions(
    db: Firestore,
    userId: string,
    payload: PushPayload
): Promise<boolean> {
    const subsSnapshot = await db.collection("users").doc(userId).collection("pushSubscriptions").get();
    if (subsSnapshot.empty) return false;

    const serialized = JSON.stringify(payload);
    let sent = 0;
    for (const subDoc of subsSnapshot.docs) {
        const sub = subDoc.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
        try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, serialized);
            sent++;
        } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
                await subDoc.ref.delete();
            } else {
                logger.error(`Push send failed for user ${userId}:`, err);
            }
        }
    }

    return sent > 0;
}

// Sends the stuck-status push to every device the user has subscribed on.
// Returns false (without erroring) if the user has no active subscriptions yet.
async function sendStuckStatusPush(
    db: Firestore,
    userId: string,
    productRef: FirebaseFirestore.DocumentReference,
    product: any,
    status: string,
    days: number
): Promise<boolean> {
    const statusLabel = STATUS_LABELS[status] ?? status;
    const wasSent = await sendPushToAllSubscriptions(db, userId, {
        title: `⏰ Stuck in "${statusLabel}"`,
        body: `${product.item} has been in "${statusLabel}" for ${days} days.`,
        url: "/products",
        tag: `stuck-${productRef.id}`,
    });

    if (wasSent) {
        await productRef.set({ lastStuckNotifiedAt: new Date().toISOString() }, { merge: true });
    }
    return wasSent;
}

// ─── Gmail "review is live" watcher ───────────────────────────────────────
// Watches each connected user's Gmail for retailer emails that look like a
// review confirmation, and pushes a notification when one shows up. This is
// notify-only by design — it never tries to auto-match the email to a
// specific product, since matching by name from email text is too fragile
// to trust unattended.

function gmailOAuthClient(): OAuth2Client {
    return new OAuth2Client(
        gmailOAuthClientId.value(),
        gmailOAuthClientSecret.value(),
        gmailOAuthRedirectUri.value()
    );
}

// Redirect the user's browser here (with ?uid=<uid>) to start the Gmail OAuth flow.
export const gmailOAuthStart = onRequest(
    { secrets: [gmailOAuthClientId, gmailOAuthClientSecret, gmailOAuthRedirectUri] },
    async (request, response) => {
        const uid = String(request.query.uid || "");
        if (!uid) {
            response.status(400).send("Missing uid");
            return;
        }

        const url = gmailOAuthClient().generateAuthUrl({
            access_type: "offline",
            // "select_account" forces Google's account chooser instead of silently
            // reusing whatever account is already signed into the device/browser.
            prompt: "select_account consent",
            scope: ["https://www.googleapis.com/auth/gmail.readonly"],
            state: uid,
        });

        response.redirect(url);
    }
);

// Handles Google's redirect back after consent, exchanges the code for
// tokens, and stores them for the scheduled checker to use.
export const gmailOAuthCallback = onRequest(
    { secrets: [gmailOAuthClientId, gmailOAuthClientSecret, gmailOAuthRedirectUri, appBaseUrl] },
    async (request, response) => {
        const code = String(request.query.code || "");
        const uid = String(request.query.state || "");
        const settingsUrl = `${appBaseUrl.value()}/settings`;

        if (!code || !uid) {
            response.redirect(`${settingsUrl}?gmail=error`);
            return;
        }

        try {
            const { tokens } = await gmailOAuthClient().getToken(code);

            if (!tokens.refresh_token) {
                // Google only returns a refresh_token on the first consent for a given
                // account/client. `prompt: "consent"` should force a fresh one each
                // time, but guard in case Google ever omits it anyway.
                logger.error(`Gmail OAuth: no refresh_token returned for uid ${uid}`);
                response.redirect(`${settingsUrl}?gmail=error`);
                return;
            }

            const db = getFirestore();
            const integrations = db.collection("users").doc(uid).collection("integrations");
            await integrations.doc("gmailSecret").set({ refreshToken: tokens.refresh_token }, { merge: true });
            await integrations.doc("gmailStatus").set(
                { connected: true, connectedAt: new Date().toISOString(), lastCheckedAt: null },
                { merge: true }
            );

            response.redirect(`${settingsUrl}?gmail=connected`);
        } catch (err) {
            logger.error(`Gmail OAuth callback failed for uid ${uid}:`, err);
            response.redirect(`${settingsUrl}?gmail=error`);
        }
    }
);

async function getGmailAccessToken(refreshToken: string): Promise<string> {
    const client = gmailOAuthClient();
    client.setCredentials({ refresh_token: refreshToken });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("Failed to obtain Gmail access token");
    return token;
}

interface GmailMessageListResponse {
    messages?: { id: string; threadId: string }[];
}

async function countGmailMatches(accessToken: string, query: string): Promise<number> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${new URLSearchParams({
        q: query,
        maxResults: "10",
    })}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

    if (!res.ok) {
        const err = new Error(`Gmail API error ${res.status}`) as Error & { statusCode: number };
        err.statusCode = res.status;
        throw err;
    }

    const data = (await res.json()) as GmailMessageListResponse;
    return data.messages?.length ?? 0;
}

// Checks every connected user's Gmail for new retailer "review is live"
// emails since their last check, and pushes a notification if any are found.
async function runGmailReviewCheck(db: Firestore): Promise<{ checked: number; notified: number; reauthNeeded: number }> {
    let checked = 0;
    let notified = 0;
    let reauthNeeded = 0;

    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
        const integrations = db.collection("users").doc(userDoc.id).collection("integrations");
        const statusRef = integrations.doc("gmailStatus");
        const status = (await statusRef.get()).data();
        if (!status || status.connected !== true) continue;

        const refreshToken = (await integrations.doc("gmailSecret").get()).data()?.refreshToken;
        if (!refreshToken) continue;

        checked++;

        try {
            const accessToken = await getGmailAccessToken(refreshToken);
            const lastCheckedAt = status.lastCheckedAt ? new Date(status.lastCheckedAt) : new Date(0);
            const afterEpoch = Math.floor(lastCheckedAt.getTime() / 1000);

            let matches = 0;
            for (const pattern of Object.values(RETAILER_EMAIL_PATTERNS)) {
                matches += await countGmailMatches(accessToken, `${pattern} after:${afterEpoch}`);
            }

            if (matches > 0) {
                const wasSent = await sendPushToAllSubscriptions(db, userDoc.id, {
                    title: "📝 A review may be live",
                    body: `Found ${matches} new email${matches === 1 ? "" : "s"} that look like a review confirmation — check your inbox and update the tracker.`,
                    url: "/products",
                    tag: "gmail-review-live",
                });
                if (wasSent) notified++;
            }

            await statusRef.set({ lastCheckedAt: new Date().toISOString() }, { merge: true });
        } catch (err: any) {
            if (err?.statusCode === 401 || String(err?.message).includes("invalid_grant")) {
                reauthNeeded++;
                await statusRef.set({ connected: false }, { merge: true });
                await sendPushToAllSubscriptions(db, userDoc.id, {
                    title: "🔌 Reconnect Gmail",
                    body: "Your Gmail connection expired — reconnect it in Settings to keep getting review alerts.",
                    url: "/settings",
                    tag: "gmail-reconnect",
                });
                logger.warn(`Gmail token expired for user ${userDoc.id}, marked disconnected`);
            } else {
                logger.error(`Gmail check failed for user ${userDoc.id}:`, err);
            }
        }
    }

    return { checked, notified, reauthNeeded };
}

// Runs the Gmail review-live check hourly for every connected user.
export const checkGmailForReviewLive = onSchedule(
    {
        schedule: "0 * * * *", // every hour on the hour
        secrets: [gmailOAuthClientId, gmailOAuthClientSecret, gmailOAuthRedirectUri, vapidPublicKey, vapidPrivateKey, vapidSubject],
    },
    async () => {
        const db = getFirestore();
        configureWebPush();
        const result = await runGmailReviewCheck(db);
        logger.info(`Gmail review check: ${result.checked} users checked, ${result.notified} notified, ${result.reauthNeeded} need reauth`);
    }
);

// Manual trigger for testing — POST /triggerGmailCheck (remove before production)
export const triggerGmailCheck = onRequest(
    {
        secrets: [gmailOAuthClientId, gmailOAuthClientSecret, gmailOAuthRedirectUri, vapidPublicKey, vapidPrivateKey, vapidSubject],
        cors: true,
    },
    async (request, response) => {
        if (request.method !== "POST") {
            response.status(405).json({ error: "Use POST" });
            return;
        }
        const db = getFirestore();
        configureWebPush();
        const result = await runGmailReviewCheck(db);
        response.status(200).json(result);
    }
);
