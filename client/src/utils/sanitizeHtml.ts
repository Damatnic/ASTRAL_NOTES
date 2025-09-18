import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
  } as any);
}

export function toSafeInnerHtml(html: string) {
  return { __html: sanitizeHtml(html || '') };
}
