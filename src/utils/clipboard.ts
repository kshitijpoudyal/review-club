/**
 * Copies text to the clipboard. Prefers the async Clipboard API; falls back to a
 * hidden textarea + execCommand for non-secure contexts or unsupported browsers.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('Copy command was unsuccessful');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
