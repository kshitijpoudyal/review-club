export interface GeneratedReview {
  title: string;
  review: string;
}

/** Formats a generated review as the single clipboard block: "Title\n\nReview body". */
export function formatReviewForClipboard(generated: GeneratedReview): string {
  return `${generated.title}\n\n${generated.review}`;
}

export async function generateReview(productName: string): Promise<GeneratedReview> {
  const res = await fetch('/api/generate-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName }),
  });

  if (!res.ok) {
    let message = 'Failed to generate review. Please try again.';
    try {
      const data = await res.json();
      if (typeof data?.error === 'string') message = data.error;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  return res.json();
}
