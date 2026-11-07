// Explicaciones para quien entra por primera vez: abiertas la primera vez, luego a un toque.
// Recordar que ya se vieron es solo una comodidad de este navegador.
const KEY = 'e47-guia-';

export function guideSeen(key) {
  try { return localStorage.getItem(KEY + key) === '1'; } catch { return false; }
}

export function markGuide(key) {
  try { localStorage.setItem(KEY + key, '1'); } catch { /* sin almacenamiento, se vuelve a mostrar */ }
}

/** Pasos muy cortos, unidos por flechas. El texto es fijo y puede llevar <b>. */
export function guideHtml(key, steps, title = '¿Cómo funciona?') {
  return `<details class="fold guide" data-guide="${key}" ${guideSeen(key) ? '' : 'open'}>
    <summary><span class="fold-title">${title}</span><span class="fold-chevron" aria-hidden="true"></span></summary>
    <div class="fold-body">
      <ol class="guide-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <button class="btn btn-primary btn-sm" data-guide-ok>Entendido</button>
    </div>
  </details>`;
}

export function bindGuide(root) {
  root.querySelectorAll('[data-guide]').forEach((box) => {
    box.querySelector('[data-guide-ok]').addEventListener('click', () => {
      markGuide(box.dataset.guide);
      box.open = false;
    });
  });
}

/** Sección desplegable: título con icono y un dato a la vista, y el detalle al tocar. */
export function foldHtml({ title, icon = '', meta = '', body, open = false, cls = '' }) {
  return `<details class="fold ${cls}" ${open ? 'open' : ''}>
    <summary>
      ${icon ? `<span class="fold-icon">${icon}</span>` : ''}
      <span class="fold-title">${title}</span>
      ${meta ? `<span class="fold-meta">${meta}</span>` : ''}
      <span class="fold-chevron" aria-hidden="true"></span>
    </summary>
    <div class="fold-body">${body}</div>
  </details>`;
}
