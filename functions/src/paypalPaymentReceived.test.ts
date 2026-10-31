import { describe, expect, it } from 'vitest';
import { parsePaypalPaymentReceivedHeadline } from './paypalPaymentReceived';

describe('parsePaypalPaymentReceivedHeadline', () => {
    it('reads amount, currency and payer from the RT000019 headline', () => {
        const corpus = 'Hello, Kshitij Poudyal\nYou received a payment of $104.71 USD from Jack George (PriscoDilley@gmail.com)\nThanks for using PayPal.';
        expect(parsePaypalPaymentReceivedHeadline(corpus)).toEqual({ amount: 104.71, currency: 'USD', name: 'Jack George' });
    });

    it('handles thousands separators and a headline without an email', () => {
        const corpus = 'You received a payment of $1,204.00 USD from Jane Doe';
        expect(parsePaypalPaymentReceivedHeadline(corpus)).toEqual({ amount: 1204, currency: 'USD', name: 'Jane Doe' });
    });

    it('returns null for other PayPal emails', () => {
        expect(parsePaypalPaymentReceivedHeadline('Jack George sent you $10.00 USD')).toBeNull();
    });
});
