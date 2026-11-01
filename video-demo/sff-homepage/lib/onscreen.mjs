// What a viewer can actually read at this moment: visible DOM text with its size on the 1080p output.
export const visibleText = (scale) => {
  const out = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const s = n.textContent.replace(/\s+/g, ' ').trim();
    if (!s) continue;
    const el = n.parentElement;
    if (el.closest('script, style, noscript, .mc-visually-hidden, svg defs')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
    let opacity = 1, zoom = 1, hidden = false;
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden') { hidden = true; break; }
      opacity *= parseFloat(c.opacity);
      zoom *= parseFloat(c.zoom) || 1;
    }
    if (hidden || opacity < .2) continue;
    const px = Math.round(parseFloat(getComputedStyle(el).fontSize) * zoom * scale * 10) / 10;
    out[s] = Math.max(out[s] || 0, px);
  }
  return out;
};
