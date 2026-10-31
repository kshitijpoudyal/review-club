// PayPal's merchant-style "Notification of payment received" template
// (RT000019) carries no name or amount in its subject. Both live only in the
// body headline: "You received a payment of $104.71 USD from Jack George
// (PriscoDilley@gmail.com)".
export const PAYPAL_PAYMENT_RECEIVED_SUBJECT = "Notification of payment received";

export interface PaypalPaymentReceivedHeadline {
    amount: number;
    currency: string | null;
    name: string;
}

export function parsePaypalPaymentReceivedHeadline(corpus: string): PaypalPaymentReceivedHeadline | null {
    const match = corpus.match(
        /received a payment of\s+[$€£]?\s*([\d,]+\.\d{2})(?:\s*([A-Z]{3}))?\s+from\s+(.+?)\s*(?:\(|$)/m
    );
    if (!match) return null;
    return {
        amount: parseFloat(match[1].replace(/,/g, "")),
        currency: match[2] ?? null,
        name: match[3].trim(),
    };
}
