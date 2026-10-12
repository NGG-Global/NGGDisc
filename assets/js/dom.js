// Small DOM helpers and the line icons used across screens.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESC[c]);
}

const svg = (size, paths, width = 2, stroke = 'currentColor') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

// "Back" points right and "forward" points left (RTL).
export const icon = {
  back: (size = 18) => svg(size, '<path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path>'),
  forward: (size = 18) => svg(size, '<path d="M19 12H5"></path><path d="M11 6l-6 6 6 6"></path>'),
  check: (size, width, stroke) => svg(size, '<path d="M5 12l5 5 9-10"></path>', width, stroke),
  restart: (size = 18) => svg(size, '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 4v5h-5"></path>'),
};

export function badge(letter, size) {
  return `<span class="disc-badge disc-badge--${size}" data-disc="${esc(letter)}" aria-hidden="true">${esc(letter)}</span>`;
}
