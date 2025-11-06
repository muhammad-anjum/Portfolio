// Theme toggle and project loading
(function(){
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggle = document.getElementById('theme-toggle');
  const apply = (m) => document.documentElement.dataset.theme = m;
  const preferred = localStorage.getItem('theme');
  if (preferred) apply(preferred);

  toggle?.addEventListener('click', () => {
    const curr = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = curr === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    apply(next);
  });

  // Load projects
  fetch('projects.json')
    .then(r => r.json())
    .then(items => {
      const grid = document.getElementById('projects-grid');
      if (!grid) return;
      grid.innerHTML = items.map(p => card(p)).join('');
    })
    .catch(() => {
      console.warn('Could not load projects.json');
    });

  function card(p){
    const tags = (p.tags||[]).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const links = [
      p.demo && `<a href="${p.demo}" target="_blank" rel="noopener">Demo</a>`,
      p.repo && `<a href="${p.repo}" target="_blank" rel="noopener">Code</a>`,
      p.caseStudy && `<a href="${p.caseStudy}" target="_blank" rel="noopener">Case study</a>`
    ].filter(Boolean).join(' · ');

    return `
      <article class="card">
        ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)} project thumbnail">` : ''}
        <div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.summary || '')}</p>
        </div>
        <div class="tags">${tags}</div>
        ${links ? `<p>${links}</p>` : ''}
      </article>
    `;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }
})();
