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
    // Days sitting in a status before the first stuck-status push fires.
    statusStuck: {
        "order-placed": 7,
        "add-review": 7,
        "review-pending": 7,
        "send-screenshot": 7,
        "refund-pending": 7,
    } as Record<string, number>,
    // Once stuck, re-notify every N days until the status changes.
    nagIntervalDays: 2,
    // Amazon's return window, and how many days before it closes the
    // return-window override push starts firing (daily, regardless of
    // status) — e.g. 30 - 7 = starts at day 23 since order.
    returnWindowDays: 30,
    returnWindowWarningDays: 7,
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

// Mirrors src/types/Product.ts's Retailer — kept as a local literal union
// (rather than a cross-package import) since functions/ and src/ build
// independently.
type Retailer = "amazon" | "walmart" | "wayfair";

// Gmail search query per retailer — confirmed against a real Amazon sample:
// sender "Amazon Reviews <no-reply@amazon.com>", subject "Thank you for
// reviewing <item>... on Amazon". `after:` (epoch seconds) is appended at
// query time based on lastCheckedAt. Walmart/Wayfair have no entry yet —
// selecting them on an account is inert (no query runs) until a real sample
// email is available to confirm their sender/subject format.
const RETAILER_EMAIL_PATTERNS: Partial<Record<Retailer, string>> = {
    amazon: 'from:(no-reply@amazon.com) subject:("Thank you for reviewing")',
};

// Order-confirmation emails, per retailer — confirmed against real samples:
// Amazon sender auto-confirm@amazon.com, subject `Ordered: "..."`; Wayfair
// sender account-updates@wayfair.com, subject "Order received! Does
// everything look right?".
const ORDER_CONFIRMATION_PATTERNS: Partial<Record<Retailer, string>> = {
    // No trailing colon in the subject term — Gmail's search parser treats
    // ":" as a field separator, so "subject:(Ordered:)" silently matched
    // nothing rather than erroring.
    amazon: "from:(auto-confirm@amazon.com) subject:(Ordered)",
    wayfair: 'from:(account-updates@wayfair.com) subject:("Order received")',
};

// Checks every product for every user, and pushes a notification for any
// item that needs attention: either it's within the return-window deadline
// (highest priority — see isNearingReturnWindow) or it's been sitting in
// the same status too long (see THRESHOLDS.statusStuck). Shared by the
// daily schedule and the manual test-trigger endpoint below.
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

            const returnWindow = isNearingReturnWindow(product);
            if (returnWindow && shouldNotifyReturnWindow(product)) {
                // Return-window deadline takes priority over the regular stuck-status
                // nag — an item never gets both pushes on the same run.
                try {
                    const wasSent = await sendReturnWindowPush(db, userDoc.id, productDoc.ref, product, returnWindow.daysSinceOrder);
                    if (wasSent) {
                        totalPushSent++;
                        logger.info(`✅ Sent return-window push for ${product.item} (${returnWindow.daysSinceOrder}d since order)`);
                    }
                } catch (error) {
                    totalPushFailed++;
                    logger.error(`❌ Failed to send return-window push for ${product.item}:`, error);
                }
                continue;
            }

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

function daysSince(isoDate: string): number {
    return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 3600 * 24));
}

// Keeps re-notifying every THRESHOLDS.nagIntervalDays for as long as the item
// stays stuck — a dismissed push isn't the last one you'll get. Naturally
// stops on its own once the status moves on, since daysStuckInStatus() will
// stop matching for the new status.
function shouldNotifyStuckStatus(product: any): boolean {
    if (!product.lastStuckNotifiedAt) return true;
    return daysSince(product.lastStuckNotifiedAt) >= THRESHOLDS.nagIntervalDays;
}

// Returns days since order if the item is within THRESHOLDS.returnWindowWarningDays
// of the return window closing (or already past it) — null if resolved
// (void/reviewLive) or there's no order date. No upper bound: keeps matching
// (and therefore keeps notifying) even after the window has closed.
function isNearingReturnWindow(product: any): { daysSinceOrder: number } | null {
    if (!product.orderDate || product.isVoid || product.reviewLive) return null;

    const daysSinceOrder = daysSince(product.orderDate);
    const warningStartsAt = THRESHOLDS.returnWindowDays - THRESHOLDS.returnWindowWarningDays;

    return daysSinceOrder >= warningStartsAt ? { daysSinceOrder } : null;
}

// Return-window pushes repeat daily (constant interval, by design — the
// closer-you-get escalation was considered and explicitly not wanted).
function shouldNotifyReturnWindow(product: any): boolean {
    if (!product.lastReturnWindowNotifiedAt) return true;
    return daysSince(product.lastReturnWindowNotifiedAt) >= 1;
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

async function sendReturnWindowPush(
    db: Firestore,
    userId: string,
    productRef: FirebaseFirestore.DocumentReference,
    product: any,
    daysSinceOrder: number
): Promise<boolean> {
    const daysRemaining = THRESHOLDS.returnWindowDays - daysSinceOrder;
    const body = daysRemaining >= 0
        ? `${product.item}: ordered ${daysSinceOrder} days ago, ~${daysRemaining}d left in the return window. Reach out to the seller for a refund or start a return.`
        : `${product.item}: ordered ${daysSinceOrder} days ago — the ~${THRESHOLDS.returnWindowDays}-day return window may have closed. Act now if you haven't already.`;

    const wasSent = await sendPushToAllSubscriptions(db, userId, {
        title: "⚠️ Return window closing",
        body,
        url: "/products",
        tag: `return-window-${productRef.id}`,
    });

    if (wasSent) {
        await productRef.set({ lastReturnWindowNotifiedAt: new Date().toISOString() }, { merge: true });
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

            // Fetch which Gmail address this actually is — surfaced in Settings so
            // it's obvious if the wrong Google account got connected.
            let emailAddress: string | null = null;
            try {
                const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                if (profileRes.ok) {
                    const profile = (await profileRes.json()) as { emailAddress?: string };
                    emailAddress = profile.emailAddress ?? null;
                }
            } catch (profileErr) {
                logger.warn(`Gmail OAuth: couldn't fetch profile email for uid ${uid}:`, profileErr);
            }

            const db = getFirestore();
            const accountsRef = db.collection("users").doc(uid).collection("gmailAccounts");

            // Reconnecting the same Gmail address (including recovering from an
            // expired-token disconnect) reuses its existing account doc instead
            // of creating a duplicate — matched by emailAddress since that's the
            // only stable identifier the OAuth flow gives us back.
            let accountRef = accountsRef.doc();
            let existingData: { retailers?: Retailer[]; lastOrderCheckedAt?: string | null } | undefined;
            if (emailAddress) {
                const existing = await accountsRef.where("emailAddress", "==", emailAddress).limit(1).get();
                if (!existing.empty) {
                    accountRef = existing.docs[0].ref;
                    existingData = existing.docs[0].data();
                }
            }

            await accountRef.collection("secret").doc("token").set({ refreshToken: tokens.refresh_token });
            await accountRef.set(
                {
                    connected: true,
                    connectedAt: new Date().toISOString(),
                    // Reset on every (re)connect, same as the single-account
                    // behavior this replaces — a fresh token starts its own
                    // review-live search window.
                    lastCheckedAt: null,
                    // Only defaulted on first-ever connect; preserved across a
                    // reconnect so the order-import cursor doesn't rewind and
                    // re-surface already-handled orders.
                    lastOrderCheckedAt: existingData?.lastOrderCheckedAt ?? null,
                    emailAddress,
                    // Defaults to every retailer with a real parser today —
                    // harmless to over-select (an inbox with no matching
                    // emails just finds nothing) and saves a trip to Settings
                    // to turn on Wayfair detection on a freshly connected
                    // account. The user narrows this down per account.
                    retailers: existingData?.retailers ?? ["amazon", "wayfair"],
                },
                { merge: true }
            );

            response.redirect(`${settingsUrl}?gmail=connected`);
        } catch (err) {
            logger.error(`Gmail OAuth callback failed for uid ${uid}:`, err);
            response.redirect(`${settingsUrl}?gmail=error`);
        }
    }
);

// Removes a linked Gmail account entirely (its status doc and refresh
// token) — the client can't do this directly since Firestore rules deny
// client-side create/delete on gmailAccounts, and a plain doc delete
// wouldn't clean up the secret subdoc anyway.
export const disconnectGmailAccount = onRequest({ cors: true }, async (request, response) => {
    if (request.method !== "POST") {
        response.status(405).json({ error: "Use POST" });
        return;
    }

    const uid = String(request.query.uid || request.body?.uid || "");
    const accountId = String(request.query.accountId || request.body?.accountId || "");
    if (!uid || !accountId) {
        response.status(400).json({ error: "Missing uid or accountId" });
        return;
    }

    const db = getFirestore();
    const accountRef = db.collection("users").doc(uid).collection("gmailAccounts").doc(accountId);
    await accountRef.collection("secret").doc("token").delete();
    await accountRef.delete();

    response.status(200).json({ ok: true });
});

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

async function listGmailMessageIds(accessToken: string, query: string): Promise<string[]> {
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
    return (data.messages ?? []).map((m) => m.id);
}

interface GmailMessagePart {
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailMessagePart[];
}

interface GmailMessageGetResponse {
    internalDate?: string; // epoch millis, as a string
    payload?: GmailMessagePart;
}

function decodeGmailBase64Url(data: string): string {
    return Buffer.from(data, "base64url").toString("utf-8");
}

// Walks the MIME part tree for a message, preferring text/plain (closer to
// what a human sees when they copy the email as text) and falling back to a
// tag-stripped text/html if no plain part exists.
function findGmailBodyText(part: GmailMessagePart | undefined): { plain?: string; html?: string } {
    if (!part) return {};

    if (part.mimeType === "text/plain" && part.body?.data) {
        return { plain: decodeGmailBase64Url(part.body.data) };
    }
    if (part.mimeType === "text/html" && part.body?.data) {
        return { html: decodeGmailBase64Url(part.body.data) };
    }

    let plain: string | undefined;
    let html: string | undefined;
    for (const child of part.parts ?? []) {
        const found = findGmailBodyText(child);
        plain = plain ?? found.plain;
        html = html ?? found.html;
    }
    return { plain, html };
}

function stripHtmlTags(html: string): string {
    return html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|td|tr|li)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim();
}

async function fetchGmailMessage(accessToken: string, messageId: string): Promise<{ text: string; html?: string; receivedAt: Date }> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

    if (!res.ok) {
        const err = new Error(`Gmail API error ${res.status}`) as Error & { statusCode: number };
        err.statusCode = res.status;
        throw err;
    }

    const data = (await res.json()) as GmailMessageGetResponse;
    const { plain, html } = findGmailBodyText(data.payload);
    const receivedAt = data.internalDate ? new Date(Number(data.internalDate)) : new Date();

    return { text: plain ?? (html ? stripHtmlTags(html) : ""), html, receivedAt };
}

// Shape matches the frontend's BookmarkletPayload (src/utils/bookmarkletPayload.ts)
// exactly, so a detected order can be handed to the existing Add Product
// prefill flow without any new form logic.
interface GmailOrderProduct {
    productName: string;
    productUrl: string;
    imageUrl: string;
    quantity?: number;
    price?: number | null;
}

interface GmailOrderPayload {
    retailer: Retailer;
    orderDate: string;
    orderNumber: string;
    orderTotal: number | null;
    tax: number | null;
    deliveryEstimate: string | null;
    productName: string;
    productUrl: string;
    imageUrl: string;
    products?: GmailOrderProduct[];
}

// Amazon's templates sprinkle invisible Unicode formatting characters
// (zero-width spaces/joiners, bidi embedding/override/mark controls, soft
// hyphens) into both the HTML and plain-text bodies — e.g. a right-to-left
// embedding character (U+202B) between "Order #" and the digits, which
// otherwise silently breaks the order-number regex.
const INVISIBLE_MARKS = /[​-‏‪-‮⁠-⁤­﻿]/g;
function normalizeEmailText(text: string): string {
    return text.replace(INVISIBLE_MARKS, "");
}

// Amazon routes nearly every link (including the product page link) through
// a click-tracking redirect — gp/r.html?...&U=<url-encoded-destination>&... —
// so the literal substring "/dp/" never appears unescaped in href values;
// it shows up as "%2Fdp%2F" inside the encoded U= param instead.
function extractAsin(html: string): string | null {
    const direct = html.match(/\/dp\/([A-Z0-9]{10})(?:[/?"&]|$)/i);
    if (direct) return direct[1].toUpperCase();
    const encoded = html.match(/%2[Ff]dp%2[Ff]([A-Z0-9]{10})/i);
    return encoded ? encoded[1].toUpperCase() : null;
}

// First occurrence of each distinct ASIN, in document order. Used to slice
// the HTML into per-item windows for multi-item orders — each item's
// window runs from its own first occurrence up to the next item's, so
// price/quantity extraction can never bleed into a neighboring item.
function findAsinOccurrences(html: string): { asin: string; index: number }[] {
    const seen = new Set<string>();
    const result: { asin: string; index: number }[] = [];
    const pattern = /(?:\/dp\/|%2[Ff]dp%2[Ff])([A-Z0-9]{10})/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
        const asin = match[1].toUpperCase();
        if (!seen.has(asin)) {
            seen.add(asin);
            result.push({ asin, index: match.index });
        }
    }
    return result;
}

// The real product thumbnail is nested inside the same anchor that links to
// the product's ASIN — not the first <img> in the email, which is usually a
// 1x1 open-tracking pixel or the Amazon logo. Its alt text also holds the
// full, untruncated product title.
function findProductImage(html: string, asin: string): { src: string; alt: string } | null {
    const anchorPattern = new RegExp(
        `<a\\s+[^>]*href="[^"]*(?:/dp/|%2[Ff]dp%2[Ff])${asin}[^"]*"[^>]*>([\\s\\S]{0,400}?)</a>`,
        "i"
    );
    const scoped = html.match(anchorPattern)?.[1];
    const searchIn = scoped ?? html;
    const imgMatch = searchIn.match(/<img\s+[^>]*src="([^"]+)"[^>]*>/i);
    if (imgMatch) {
        const altMatch = imgMatch[0].match(/alt="([^"]*)"/i);
        return { src: imgMatch[1].replace(/&amp;/g, "&"), alt: altMatch?.[1] ?? "" };
    }
    if (scoped) return null;

    // Fallback: a real product image URL (images/I/...), never a logo
    // (images/G/...) or a tracking-redirect link (gp/r.html).
    const fallback = html.match(/<img\s+[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"[^>]*>/i);
    if (!fallback) return null;
    const altMatch = fallback[0].match(/alt="([^"]*)"/i);
    return { src: fallback[1].replace(/&amp;/g, "&"), alt: altMatch?.[1] ?? "" };
}

// Amazon renders price as split superscript tags (<sup>$</sup>8<sup>97</sup>),
// which collapses to "$897" (no decimal) once tags are stripped — in both
// the HTML and the plain-text MIME part. The enclosing element instead
// carries a structured aria-label ("{amount=8.97, currencyCode={...}}")
// which is exact and doesn't need decimal-guessing.
function extractPriceInWindow(htmlWindow: string): number | null {
    const match = htmlWindow.match(/aria-label="\{amount=([\d.]+)/i);
    return match ? parseFloat(match[1]) : null;
}

function extractQuantityInWindow(htmlWindow: string): number | undefined {
    const match = htmlWindow.match(/Quantity:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
}

// Parses an Amazon order-confirmation email body into a draft order.
// Returns null if it can't find at minimum an order number and item name,
// since a draft missing both isn't worth surfacing.
function parseAmazonOrderEmail(rawBodyText: string, html: string | undefined, receivedAt: Date): GmailOrderPayload | null {
    const bodyText = normalizeEmailText(rawBodyText);

    const orderNumberMatch = bodyText.match(/Order #\s*(\d{3}-\d{7}-\d{7})/);
    const orderNumber = orderNumberMatch?.[1] ?? "";

    const lines = bodyText.split("\n").map((l) => l.trim());
    const quantityIndex = lines.findIndex((l) => /^Quantity:\s*\d+/i.test(l));

    function fallbackProductNameFromLines(fromIndex: number): string {
        const candidates: string[] = [];
        for (let i = fromIndex - 1; i >= 0 && candidates.length < 2; i--) {
            const line = lines[i];
            if (!line) continue;
            if (/^View or edit order$/i.test(line) || /^Order #/i.test(line)) break;
            candidates.push(line);
        }
        // Prefer whichever candidate isn't truncated with "..."; fall back to the longer one.
        const untruncated = candidates.find((c) => !c.endsWith("..."));
        return untruncated ?? candidates.sort((a, b) => b.length - a.length)[0] ?? "";
    }

    const fallbackProductName = quantityIndex >= 0 ? fallbackProductNameFromLines(quantityIndex) : "";

    if (!orderNumber && !fallbackProductName) return null;

    const grandTotalMatch = bodyText.match(/Grand Total:\s*\$?([\d,]+\.\d{2})/i);
    const orderTotal = grandTotalMatch ? parseFloat(grandTotalMatch[1].replace(/,/g, "")) : null;

    const deliveryMatch = bodyText.match(/Arriving\s+([A-Za-z]+(?:,\s*[A-Za-z]{3,9}\s+\d{1,2})?)/);
    const deliveryEstimate = deliveryMatch?.[1] ?? null;

    const asinOccurrences = html ? findAsinOccurrences(html) : [];

    if (html && asinOccurrences.length > 0) {
        const items: GmailOrderProduct[] = asinOccurrences.map(({ asin, index }, i) => {
            const windowEnd = asinOccurrences[i + 1]?.index ?? html.length;
            const itemWindow = html.slice(index, windowEnd);
            const image = findProductImage(html, asin);
            return {
                productName: image?.alt || fallbackProductName,
                productUrl: `https://www.amazon.com/dp/${asin}`,
                imageUrl: image?.src ?? "",
                quantity: extractQuantityInWindow(itemWindow),
                price: extractPriceInWindow(itemWindow),
            };
        });

        const isMultiItem = items.length > 1;
        const first = items[0];
        const tax = !isMultiItem && orderTotal !== null && first.price != null
            ? Math.round((orderTotal - first.price) * 100) / 100
            : null;

        return {
            retailer: "amazon",
            orderDate: receivedAt.toISOString(),
            orderNumber,
            orderTotal,
            tax,
            deliveryEstimate,
            productName: first.productName,
            productUrl: first.productUrl,
            imageUrl: first.imageUrl,
            ...(isMultiItem ? { products: items } : {}),
        };
    }

    // No HTML (or no ASIN found in it) — fall back to the original
    // text-only heuristics, including the decimal-guessing price scan.
    let itemPrice: number | null = null;
    if (quantityIndex >= 0) {
        for (let i = quantityIndex + 1; i < lines.length && i < quantityIndex + 6; i++) {
            const priceMatch = lines[i].match(/^\$(\d{3,})$/);
            if (priceMatch) {
                const digits = priceMatch[1];
                const dollars = digits.slice(0, -2);
                const cents = digits.slice(-2);
                itemPrice = parseFloat(`${dollars}.${cents}`);
                break;
            }
        }
    }

    const quantityMentions = bodyText.match(/Quantity:\s*\d+/gi) ?? [];
    const isMultiItem = quantityMentions.length > 1;
    const tax = !isMultiItem && orderTotal !== null && itemPrice !== null
        ? Math.round((orderTotal - itemPrice) * 100) / 100
        : null;

    let productUrl = "";
    let imageUrl = "";
    if (html) {
        const asin = extractAsin(html);
        if (asin) productUrl = `https://www.amazon.com/dp/${asin}`;
        else {
            const productLinkMatch = html.match(/href="([^"]*\/dp\/[^"]*)"/i);
            if (productLinkMatch) productUrl = productLinkMatch[1].replace(/&amp;/g, "&");
        }
        // Never fall back to the unconditional first <img> — that's
        // reliably a 1x1 open-tracking pixel routed through the same
        // gp/r.html redirect scheme as links. Only trust a real product
        // image path.
        const imgMatch = html.match(/<img\s+[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"[^>]*>/i);
        if (imgMatch) imageUrl = imgMatch[1].replace(/&amp;/g, "&");
    }

    return {
        retailer: "amazon",
        orderDate: receivedAt.toISOString(),
        orderNumber,
        orderTotal,
        tax,
        deliveryEstimate,
        productName: fallbackProductName,
        productUrl,
        imageUrl,
    };
}

interface WayfairJsonLdOffer {
    itemOffered?: { name?: string; url?: string; image?: string; sku?: string };
    price?: string;
    eligibleQuantity?: { value?: string };
}

interface WayfairJsonLdOrder {
    "@type"?: string;
    orderNumber?: string;
    orderDate?: string;
    price?: string;
    acceptedOffer?: WayfairJsonLdOffer[];
}

// Wayfair's template HTML-entity-escapes "=" and "&" even inside JSON-LD
// string values (e.g. a product URL's query string arrives as
// "?piid&#x3D;1447725679" instead of "?piid=1447725679") — decode before
// parsing so URLs come out usable.
function decodeWayfairJsonLdEntities(text: string): string {
    return text.replace(/&amp;/g, "&").replace(/&#x3D;/gi, "=");
}

// Wayfair's order-confirmation template embeds the entire order as a
// schema.org JSON-LD <script> block — confirmed against a real "Order
// received! Does everything look right?" sample. Scans every ld+json block
// on the page (there can be more than one) for the one whose @type is
// "Order", rather than assuming it's the first script tag.
function extractWayfairOrderJsonLd(html: string): WayfairJsonLdOrder | null {
    const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = scriptPattern.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(decodeWayfairJsonLdEntities(match[1]).trim());
            const candidates = Array.isArray(parsed) ? parsed : [parsed];
            const order = candidates.find((c) => c && c["@type"] === "Order");
            if (order) return order as WayfairJsonLdOrder;
        } catch {
            // Not valid JSON, or not the block we want — keep scanning.
        }
    }
    return null;
}

// Wayfair doesn't put tax in the JSON-LD, only in the visible "Payment
// Summary" table — scans forward from the text label for the next dollar
// amount, since the label and its value sit in separate table cells rather
// than adjacent text.
function extractLabeledDollarAmount(html: string, label: string, windowSize = 800): number | null {
    const labelIndex = html.search(new RegExp(`${label}\\s*(?:</[a-z0-9]+>)?`, "i"));
    if (labelIndex < 0) return null;
    const window = html.slice(labelIndex, labelIndex + windowSize);
    const amountMatch = window.match(/\$([\d,]+\.\d{2})/);
    return amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
}

function extractWayfairDeliveryEstimate(html: string): string | null {
    const match = html.match(/Estimated Delivery:[^<]*(?:<[^>]+>\s*)*<strong>([^<]+)<\/strong>/i);
    return match ? match[1].trim() : null;
}

// Parses a Wayfair order-confirmation email. Unlike Amazon, this leans on
// the embedded JSON-LD for the order/item data (name, url, image, sku,
// price, quantity) and only falls back to HTML-label scanning for the two
// fields Wayfair doesn't put in the JSON-LD: tax and the delivery estimate.
function parseWayfairOrderEmail(html: string | undefined, receivedAt: Date): GmailOrderPayload | null {
    if (!html) return null;
    const order = extractWayfairOrderJsonLd(html);
    if (!order?.orderNumber) return null;

    const offers = order.acceptedOffer ?? [];
    const items: GmailOrderProduct[] = offers
        .filter((offer) => offer.itemOffered?.name)
        .map((offer) => ({
            productName: offer.itemOffered!.name!,
            productUrl: offer.itemOffered!.url ?? "",
            imageUrl: offer.itemOffered!.image ?? "",
            quantity: offer.eligibleQuantity?.value ? parseInt(offer.eligibleQuantity.value, 10) : undefined,
            price: offer.price ? parseFloat(offer.price) : null,
        }));

    const first = items[0];
    const isMultiItem = items.length > 1;

    return {
        retailer: "wayfair",
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString() : receivedAt.toISOString(),
        orderNumber: order.orderNumber,
        orderTotal: order.price ? parseFloat(order.price) : null,
        tax: extractLabeledDollarAmount(html, "Tax:"),
        deliveryEstimate: extractWayfairDeliveryEstimate(html),
        productName: first?.productName ?? "",
        productUrl: first?.productUrl ?? "",
        imageUrl: first?.imageUrl ?? "",
        ...(isMultiItem ? { products: items } : {}),
    };
}

// Dispatches order-email parsing by retailer. Walmart has no real parser
// yet — this is the seam where it gets added later (needs its own
// sample-email-verified implementation, same as the two below) without
// touching the surrounding check loop.
function parseOrderEmail(retailer: Retailer, text: string, html: string | undefined, receivedAt: Date): GmailOrderPayload | null {
    if (retailer === "amazon") return parseAmazonOrderEmail(text, html, receivedAt);
    if (retailer === "wayfair") return parseWayfairOrderEmail(html, receivedAt);
    return null;
}

// Checks every connected user's Gmail for new retailer "review is live"
// emails and new order-confirmation emails since their last check, pushing a
// notification for either. Order confirmations also get parsed into a draft
// product written to pendingGmailImports for the user to review and confirm.
async function runGmailReviewCheck(db: Firestore, ignoreCursors = false): Promise<{ checked: number; notified: number; ordersDetected: number; reauthNeeded: number }> {
    let checked = 0;
    let notified = 0;
    let ordersDetected = 0;
    let reauthNeeded = 0;

    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
        const accountsSnapshot = await db.collection("users").doc(userDoc.id).collection("gmailAccounts").get();

        for (const accountDoc of accountsSnapshot.docs) {
            const account = accountDoc.data();
            if (account.connected !== true) continue;

            const refreshToken = (await accountDoc.ref.collection("secret").doc("token").get()).data()?.refreshToken;
            if (!refreshToken) continue;

            const retailers: Retailer[] = account.retailers ?? [];
            const accountLabel = account.emailAddress ?? accountDoc.id;

            checked++;

            try {
                const accessToken = await getGmailAccessToken(refreshToken);
                const lastCheckedAt = account.lastCheckedAt && !ignoreCursors ? new Date(account.lastCheckedAt) : new Date(0);
                const afterEpoch = Math.floor(lastCheckedAt.getTime() / 1000);

                // Only queries the retailers this account is tagged with —
                // e.g. a Walmart-only inbox never runs the Amazon pattern —
                // which keeps Gmail API usage proportional to what the user
                // actually expects in each inbox instead of every pattern
                // against every connected account.
                let matches = 0;
                for (const retailer of retailers) {
                    const pattern = RETAILER_EMAIL_PATTERNS[retailer];
                    if (!pattern) continue; // no pattern for this retailer yet (e.g. walmart/wayfair)

                    // Gmail's search parser doesn't treat "after:0" as "no lower
                    // bound" — it silently fails to match anything. Omit the
                    // clause entirely instead (true for both a fresh ignoreCursors
                    // rescan and any brand-new account's very first check).
                    const query = afterEpoch > 0 ? `${pattern} after:${afterEpoch}` : pattern;
                    const count = await countGmailMatches(accessToken, query);
                    logger.info(`Gmail review search "${query}" → ${count} match(es) for ${accountLabel} (user ${userDoc.id})`);
                    matches += count;
                }

                if (matches > 0) {
                    const wasSent = await sendPushToAllSubscriptions(db, userDoc.id, {
                        title: "📝 A review may be live",
                        body: `Found ${matches} new email${matches === 1 ? "" : "s"} in ${accountLabel} that look like a review confirmation — check your inbox and update the tracker.`,
                        url: "/products",
                        tag: `gmail-review-live-${accountDoc.id}`,
                    });
                    if (wasSent) notified++;
                }

                await accountDoc.ref.set({ lastCheckedAt: new Date().toISOString() }, { merge: true });

                // Separate cursor from the review-live check above, so one
                // query type's activity never affects the other's search window.
                const lastOrderCheckedAt = account.lastOrderCheckedAt && !ignoreCursors ? new Date(account.lastOrderCheckedAt) : new Date(0);
                const orderAfterEpoch = Math.floor(lastOrderCheckedAt.getTime() / 1000);

                let newOrdersFound = 0;
                for (const retailer of retailers) {
                    const pattern = ORDER_CONFIRMATION_PATTERNS[retailer];
                    if (!pattern) continue; // no pattern for this retailer yet (e.g. walmart/wayfair)

                    const query = orderAfterEpoch > 0 ? `${pattern} after:${orderAfterEpoch}` : pattern;
                    const messageIds = await listGmailMessageIds(accessToken, query);
                    logger.info(`Gmail order search "${query}" → ${messageIds.length} match(es) for ${accountLabel} (user ${userDoc.id})`);

                    for (const messageId of messageIds) {
                        // Prefixed by accountId: message IDs are only unique per
                        // mailbox, so two different linked accounts could
                        // otherwise collide on the same doc.
                        const pendingRef = db
                            .collection("users")
                            .doc(userDoc.id)
                            .collection("pendingGmailImports")
                            .doc(`${accountDoc.id}_${messageId}`);
                        if ((await pendingRef.get()).exists) continue;

                        const { text, html, receivedAt } = await fetchGmailMessage(accessToken, messageId);
                        const draft = parseOrderEmail(retailer, text, html, receivedAt);
                        if (!draft) {
                            logger.warn(`Gmail order message ${messageId} (${retailer}) didn't parse into a usable draft`);
                            continue;
                        }

                        await pendingRef.set({
                            ...draft,
                            detectedAt: new Date().toISOString(),
                            sourceAccountId: accountDoc.id,
                            sourceEmail: account.emailAddress ?? null,
                        });
                        newOrdersFound++;
                    }
                }

                // Report actual detections regardless of whether the push also
                // succeeded — "detected" and "notified" are different things,
                // and a user with no push subscriptions yet shouldn't look like
                // nothing was found.
                ordersDetected += newOrdersFound;

                if (newOrdersFound > 0) {
                    await sendPushToAllSubscriptions(db, userDoc.id, {
                        title: "📦 New order detected",
                        body: `Found ${newOrdersFound} new order${newOrdersFound === 1 ? "" : "s"} in ${accountLabel} — review and add ${newOrdersFound === 1 ? "it" : "them"} to the tracker.`,
                        url: "/products",
                        tag: `gmail-new-order-${accountDoc.id}`,
                    });
                }

                await accountDoc.ref.set({ lastOrderCheckedAt: new Date().toISOString() }, { merge: true });
            } catch (err: any) {
                if (err?.statusCode === 401 || String(err?.message).includes("invalid_grant")) {
                    reauthNeeded++;
                    await accountDoc.ref.set({ connected: false }, { merge: true });
                    await sendPushToAllSubscriptions(db, userDoc.id, {
                        title: "🔌 Reconnect Gmail",
                        body: `Your Gmail connection for ${accountLabel} expired — reconnect it in Settings to keep getting review alerts.`,
                        url: "/settings",
                        tag: `gmail-reconnect-${accountDoc.id}`,
                    });
                    logger.warn(`Gmail token expired for ${accountLabel} (user ${userDoc.id}), marked disconnected`);
                } else {
                    logger.error(`Gmail check failed for ${accountLabel} (user ${userDoc.id}):`, err);
                }
            }
        }
    }

    return { checked, notified, ordersDetected, reauthNeeded };
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
        logger.info(`Gmail review check: ${result.checked} users checked, ${result.notified} notified, ${result.ordersDetected} orders detected, ${result.reauthNeeded} need reauth`);
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
        // ?ignoreCursors=true re-scans from the beginning instead of just
        // since the last check — handy for testing without waiting.
        const ignoreCursors = request.query.ignoreCursors === "true";
        const result = await runGmailReviewCheck(db, ignoreCursors);
        logger.info(`Gmail review check (manual): ${result.checked} users checked, ${result.notified} notified, ${result.ordersDetected} orders detected, ${result.reauthNeeded} need reauth`);
        response.status(200).json(result);
    }
);
