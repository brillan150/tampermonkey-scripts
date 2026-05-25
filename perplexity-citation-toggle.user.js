// ==UserScript==
// @name         Perplexity Citation Toggle for Speechify 🔊
// @namespace    https://github.com/brillan150/tampermonkey-scripts
// @version      2026.05.24.3
// @description  Toggle Perplexity citations on/off for cleaner Speechify reading
// @author       Brillan P. Morgan
// @homepageURL  https://github.com/brillan150/tampermonkey-scripts
// @license      MIT
// @match        https://www.perplexity.ai/*
// @match        https://perplexity.ai/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/brillan150/tampermonkey-scripts/main/perplexity-citation-toggle.user.js
// @updateURL    https://raw.githubusercontent.com/brillan150/tampermonkey-scripts/main/perplexity-citation-toggle.user.js
// @tag          speechify
// @tag          perplexity
// ==/UserScript==

(function () {
  'use strict';

  let hidden = GM_getValue('citationsHidden', true);
  let styleEl = null;
  let buttonEl = null;
  let iconWrapEl = null;
  let labelEl = null;
  let cleanupScheduled = false;

  const CSS = `
    span.citation.inline,
    span.citation.inline *,
    a[href*="ppl-ai-file-upload.s3.amazonaws.com"] {
      display: none !important;
      visibility: hidden !important;
    }
  `;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createEyeIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path1 = document.createElementNS(SVG_NS, 'path');
    path1.setAttribute('d', 'M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z');
    path1.setAttribute('stroke', 'currentColor');
    path1.setAttribute('stroke-width', '1.4');
    path1.setAttribute('stroke-linecap', 'round');
    path1.setAttribute('stroke-linejoin', 'round');

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '8');
    circle.setAttribute('cy', '8');
    circle.setAttribute('r', '2.2');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '1.4');

    svg.appendChild(path1);
    svg.appendChild(circle);
    return svg;
  }

  function createEyeSlashIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const slash = document.createElementNS(SVG_NS, 'path');
    slash.setAttribute('d', 'M2 2l12 12');
    slash.setAttribute('stroke', 'currentColor');
    slash.setAttribute('stroke-width', '1.4');
    slash.setAttribute('stroke-linecap', 'round');

    const path1 = document.createElementNS(SVG_NS, 'path');
    path1.setAttribute('d', 'M3.2 5.1C1.8 6.5 1 8 1 8s2.5 4.5 7 4.5c1.5 0 2.8-.4 4-1.1');
    path1.setAttribute('stroke', 'currentColor');
    path1.setAttribute('stroke-width', '1.4');
    path1.setAttribute('stroke-linecap', 'round');
    path1.setAttribute('stroke-linejoin', 'round');

    const path2 = document.createElementNS(SVG_NS, 'path');
    path2.setAttribute('d', 'M6.1 3.8C6.7 3.6 7.3 3.5 8 3.5C12.5 3.5 15 8 15 8s-.7 1.3-2 2.7');
    path2.setAttribute('stroke', 'currentColor');
    path2.setAttribute('stroke-width', '1.4');
    path2.setAttribute('stroke-linecap', 'round');
    path2.setAttribute('stroke-linejoin', 'round');

    const path3 = document.createElementNS(SVG_NS, 'path');
    path3.setAttribute('d', 'M6.5 6.5a2.2 2.2 0 0 0 3 3');
    path3.setAttribute('stroke', 'currentColor');
    path3.setAttribute('stroke-width', '1.4');
    path3.setAttribute('stroke-linecap', 'round');

    svg.appendChild(slash);
    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    return svg;
  }

  function ensureStyle() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'tm-hide-perplexity-citations';
      styleEl.textContent = CSS;
    }

    if (hidden) {
      if (document.head && !document.head.contains(styleEl)) {
        document.head.appendChild(styleEl);
      }
    } else if (styleEl.parentNode) {
      styleEl.remove();
    }
  }

  function removeCitationNodes() {
    if (!hidden) return;
    document.querySelectorAll('span.citation.inline').forEach(el => el.remove());
    document.querySelectorAll('a[href*="ppl-ai-file-upload.s3.amazonaws.com"]').forEach(el => el.remove());
  }

  function findShareButton() {
    return Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent && btn.textContent.trim() === 'Share');
  }

  function syncButtonStyleFromShare() {
    if (!buttonEl) return;

    const shareButton = findShareButton();
    if (!shareButton) return;

    const cs = window.getComputedStyle(shareButton);

    buttonEl.style.fontFamily = cs.fontFamily;
    buttonEl.style.fontSize = cs.fontSize;
    buttonEl.style.fontWeight = cs.fontWeight;
    buttonEl.style.lineHeight = cs.lineHeight;
    buttonEl.style.letterSpacing = cs.letterSpacing;
    buttonEl.style.borderRadius = cs.borderRadius;
    buttonEl.style.paddingTop = cs.paddingTop;
    buttonEl.style.paddingRight = cs.paddingRight;
    buttonEl.style.paddingBottom = cs.paddingBottom;
    buttonEl.style.paddingLeft = cs.paddingLeft;
    buttonEl.style.minHeight = cs.height;
    buttonEl.style.border = cs.border;
    buttonEl.style.boxShadow = cs.boxShadow;
    buttonEl.style.background = hidden ? 'rgba(255,255,255,0.08)' : cs.background;
    buttonEl.style.color = hidden ? 'rgba(255,255,255,0.82)' : cs.color;
  }

function updateButton() {
  if (!buttonEl || !iconWrapEl || !labelEl) return;

  labelEl.textContent = 'Citations';
  iconWrapEl.replaceChildren(hidden ? createEyeSlashIcon() : createEyeIcon());

  buttonEl.title = hidden
    ? 'Citations hidden. Click to show citations and reload.'
    : 'Citations visible. Click to hide citations.';

  syncButtonStyleFromShare();

  buttonEl.style.opacity = '0.95';
  buttonEl.style.marginRight = '8px';
  buttonEl.style.whiteSpace = 'nowrap';
  buttonEl.style.alignSelf = 'center';
  buttonEl.style.flexShrink = '0';
  buttonEl.style.cursor = 'pointer';
  buttonEl.style.display = 'inline-flex';
  buttonEl.style.alignItems = 'center';
  buttonEl.style.justifyContent = 'center';
  buttonEl.style.gap = '0.45rem';

  iconWrapEl.style.display = 'inline-flex';
  iconWrapEl.style.alignItems = 'center';
  iconWrapEl.style.justifyContent = 'center';
  iconWrapEl.style.opacity = '0.92';
  iconWrapEl.style.order = '1';

  labelEl.style.display = 'inline-flex';
  labelEl.style.alignItems = 'center';
  labelEl.style.order = '2';
}
  function toggleState() {
    hidden = !hidden;
    GM_setValue('citationsHidden', hidden);

    if (!hidden) {
      location.reload();
      return;
    }

    ensureStyle();
    removeCitationNodes();
    updateButton();
  }

  function addButton() {
    const shareButton = findShareButton();
    if (!shareButton || !shareButton.parentElement) return;

    const parent = shareButton.parentElement;

    if (!buttonEl) {
      buttonEl = document.createElement('button');
      buttonEl.type = 'button';
      buttonEl.setAttribute('aria-label', 'Toggle Perplexity citations');

      iconWrapEl = document.createElement('span');
      labelEl = document.createElement('span');

      buttonEl.appendChild(iconWrapEl);
      buttonEl.appendChild(labelEl);

      buttonEl.addEventListener('click', toggleState);
    }

    if (buttonEl.parentElement !== parent || buttonEl.nextSibling !== shareButton) {
      parent.insertBefore(buttonEl, shareButton);
    }

    updateButton();
  }

  function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;

    requestAnimationFrame(() => {
      cleanupScheduled = false;
      addButton();
      ensureStyle();
      if (hidden) removeCitationNodes();
    });
  }

  function addShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toggleState();
      }
    });
  }

  function init() {
    ensureStyle();
    addButton();
    removeCitationNodes();
    addShortcut();

    const observer = new MutationObserver(() => {
      scheduleCleanup();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
