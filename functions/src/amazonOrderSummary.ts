// Amazon's late-2026 confirmation template drops all per-item detail (no
// ASIN links, product image, title, price or quantity). What's left is a
// summary — subject `Ordered 1 item: Storage`, body line `1 Storage item` —
// giving an item count and a coarse category, not a product title.
export interface AmazonOrderSummary {
    itemCount: number;
    category: string;
}

export function parseAmazonOrderSummary(subject: string | undefined, bodyText: string): AmazonOrderSummary | null {
    const subjectMatch = subject?.match(/^\s*Ordered\s+(\d+)\s+items?:\s*(.+?)\s*$/i);
    if (subjectMatch) return { itemCount: parseInt(subjectMatch[1], 10), category: subjectMatch[2] };

    const bodyMatch = bodyText.match(/^\s*(\d+)\s+(.+?)\s+items?\s*$/im);
    if (bodyMatch) return { itemCount: parseInt(bodyMatch[1], 10), category: bodyMatch[2] };

    return null;
}

// Amazon's own order times are Pacific; resolving there (rather than UTC)
// keeps a US evening order from rolling over to the next calendar day.
const DELIVERY_TIME_ZONE = "America/Los_Angeles";
const DAY_MS = 24 * 60 * 60 * 1000;

// "Arriving tomorrow" is relative to when the email was sent, so stored
// as-is it goes stale the next day. Resolve today/tomorrow to a concrete
// date in the same "Weekday, Month D" shape the older template used.
export function resolveRelativeDeliveryEstimate(estimate: string | null, receivedAt: Date): string | null {
    if (!estimate) return estimate;
    const offsetDays = /^today$/i.test(estimate) ? 0 : /^tomorrow$/i.test(estimate) ? 1 : null;
    if (offsetDays === null) return estimate;
    return new Date(receivedAt.getTime() + offsetDays * DAY_MS).toLocaleDateString("en-US", {
        timeZone: DELIVERY_TIME_ZONE,
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

export function amazonOrderDetailsUrl(orderNumber: string): string {
    return `https://www.amazon.com/your-orders/order-details?orderID=${orderNumber}`;
}
