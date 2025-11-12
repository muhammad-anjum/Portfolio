(()=>{
  const views={home:$('#view-home'),experience:$('#view-experience'),projects:$('#view-projects'),education:$('#view-education'),contact:$('#view-contact'),resume:$('#view-resume')};
  const state={projects:[],experience:[],education:[],favorites:new Set(JSON.parse(localStorage.getItem('favorites')||'[]')),tags:new Set()};
  function $(s,r=document){return r.querySelector(s)}; function $$(s,r=document){return Array.from(r.querySelectorAll(s))}
  const setTheme=t=>document.documentElement.dataset.theme=t; const pref=localStorage.getItem('theme'); if(pref) setTheme(pref);
  $('#theme-toggle').addEventListener('click',()=>{const next=(document.documentElement.dataset.theme==='light')?'':'light'; if(next) localStorage.setItem('theme',next); else localStorage.removeItem('theme'); setTheme(next)});
  $('#year').textContent=new Date().getFullYear();

  function selectTab(id){$$('.nav-links a').forEach(a=>a.setAttribute('aria-selected',String(a.getAttribute('href')==='#'+id)))}
  function route(){const hash=location.hash.replace('#','')||'home'; Object.values(views).forEach(v=>v.hidden=true); (views[hash]||views.home).hidden=false; selectTab(hash);
    if(hash==='projects') renderProjects(); if(hash==='experience') renderExperience(); if(hash==='education') renderEducation(); if(hash==='resume') renderResume();
  }
  addEventListener('hashchange',route); route();

  Promise.all([
    fetch('data/projects.json').then(r=>r.json()),
    fetch('data/experience.json').then(r=>r.json()),
    fetch('data/education.json').then(r=>r.json())
  ]).then(([p,e,d])=>{
    state.projects=p; state.experience=e; state.education=d;
    $('#stat-projects').textContent=p.length;
    $('#stat-years').textContent=e.reduce((acc,x)=>acc+(x.years||0),0);
    $('#stat-awards').textContent=d.reduce((a,s)=>a+(s.awards?.length||0),0);
    p.forEach(pr=>(pr.tags||[]).forEach(t=>state.tags.add(t)));
    renderTagChips(); route();
  }).catch(e=>console.warn('Data load error',e));

  let g=false; addEventListener('keydown',e=>{
    if(e.key==='/'){ if(location.hash==='#projects'){ $('#proj-search').focus(); e.preventDefault(); } }
    else if(e.key==='?'){toggleHelp();}
    else if(e.key.toLowerCase()==='g'){g=true; setTimeout(()=>g=false,800);}
    else if(g){const map={e:'experience',p:'projects',d:'education',c:'contact',h:'home',r:'resume'}; const t=map[e.key.toLowerCase()]; if(t) location.hash=t;}
  });
  function toggleHelp(){const t=$('#kbd-help'); t.hidden=!t.hidden; setTimeout(()=>t.hidden=true,3500);}

  $('#exp-filter').addEventListener('change', renderExperience);
  function renderExperience(){
    const list=$('#experience-timeline'); list.innerHTML='';
    const filter=$('#exp-filter').value;
    state.experience.filter(x=>filter==='all'||(x.tags||[]).includes(filter)).forEach(role=>{
      const li=document.createElement('li');
      li.innerHTML=`<div class="card">
        <div class="row" style="justify-content:space-between">
          <strong>${esc(role.title)}</strong>
          <span class="badge">${esc(role.start)} – ${esc(role.end||'Present')}</span>
        </div>
        <div class="muted">${esc(role.company)} · ${esc(role.location)}</div>
        <details class="accord"><summary>Highlights</summary>
          <ul class="list">${(role.highlights||[]).map(h=>'<li>'+esc(h)+'</li>').join('')}</ul>
        </details>
        <div class="tags">${(role.tags||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join('')}</div>
      </div>`;
      list.appendChild(li);
    });
  }

  const tagContainer=$('#tag-chips');
  function renderTagChips(){
    tagContainer.innerHTML='';
    ['All', ...Array.from(state.tags).sort()].forEach(t=>{
      const b=document.createElement('button'); b.className='chip'; b.type='button'; b.textContent=t;
      b.setAttribute('aria-pressed', t==='All' ? 'true' : 'false');
      b.addEventListener('click', ()=>{
        $$('.chip', tagContainer).forEach(c=>c.setAttribute('aria-pressed','false'));
        b.setAttribute('aria-pressed','true'); renderProjects();
      });
      tagContainer.appendChild(b);
    });
  }
  $('#proj-search').addEventListener('input', renderProjects);
  $('#proj-sort').addEventListener('change', renderProjects);

  function renderProjects(){
    const grid=$('#projects-grid');
    const q=($('#proj-search').value||'').toLowerCase();
    const active=$('.chip[aria-pressed="true"]', tagContainer)?.textContent || 'All';
    const sort=$('#proj-sort').value;
    let items=state.projects.filter(p => (active==='All'||(p.tags||[]).includes(active)) && (!q || [p.title, p.summary, (p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)));
    if(sort==='alpha') items.sort((a,b)=>a.title.localeCompare(b.title));
    if(sort==='recent') items.sort((a,b)=>(b.year||0)-(a.year||0));
    if(sort==='stars') items.sort((a,b)=>(state.favorites.has(b.id)-state.favorites.has(a.id)) || b.year-a.year);
    grid.innerHTML = items.map(cardHtml).join('');
    $$('.star', grid).forEach(btn=>btn.addEventListener('click', toggleStar));
    $$('.open', grid).forEach(btn=>btn.addEventListener('click', openModal));
  }
  function cardHtml(p){
    const starred=state.favorites.has(p.id);
    const tags=(p.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    const links=[
      p.demo && `<a href="${p.demo}" target="_blank" rel="noopener">Demo</a>`,
      p.repo && `<a href="${p.repo}" target="_blank" rel="noopener">Code</a>`,
      p.caseStudy && `<button class="open" data-id="${p.id}">Case study</button>`
    ].filter(Boolean).join(' · ');
    return `<article class="card">
      ${p.image? `<img src="${p.image}" alt="${esc(p.title)} thumbnail">` : ''}
      <div class="row" style="justify-content:space-between">
        <h3>${esc(p.title)}</h3>
        <button class="star" aria-label="Toggle favorite" aria-pressed="${starred}" data-id="${p.id}">★</button>
      </div>
      <p class="muted">${esc(p.summary||'')}</p>
      <div class="tags">${tags}</div>
      <p>${links}</p>
    </article>`;
  }
  function toggleStar(e){
    const id=e.currentTarget.dataset.id;
    if(state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    localStorage.setItem('favorites', JSON.stringify(Array.from(state.favorites))); renderProjects();
  }

  const modal=$('#project-modal');
  modal.addEventListener('click', e=>{ if(e.target.hasAttribute('data-close')) modal.close(); });
  function openModal(e){
    const id=e.currentTarget.dataset.id;
    const p=state.projects.find(x=> String(x.id)===String(id));
    $('#modal-content').innerHTML = `
      <header class="row" style="justify-content:space-between">
        <h3>${esc(p.title)}</h3>
        <button class="close" data-close>Close</button>
      </header>
      <p>${esc(p.description||p.summary||'')}</p>
      ${(p.gallery||[]).map(src=>`<img src="${src}" alt="${esc(p.title)} image">`).join('')}
      <p>${p.repo? `<a href="${p.repo}" target="_blank" rel="noopener">Repository</a>`:''} ${p.demo? ' · <a href="'+p.demo+'" target="_blank" rel="noopener">Live Demo</a>':''}</p>
    `;
    modal.showModal();
  }

  function renderEducation(){
    const root=$('#education-cards'); root.innerHTML = state.education.map(s=>`
      <article class="card">
        <div class="row" style="justify-content:space-between">
          <h3>${esc(s.school)}</h3>
          <span class="badge">${esc(s.start)} – ${esc(s.end||'Present')}</span>
        </div>
        <div class="muted">${esc(s.degree)} · ${esc(s.location)}</div>
        <p>${esc(s.summary||'')}</p>
        <div class="tags">${(s.highlights||[]).map(t=>'<span class="tag">'+esc(t)+'</span>').join('')}</div>
      </article>`).join('');
    $('#coursework-list').innerHTML = (state.education[0]?.coursework||[]).map(c=>'<li>'+esc(c)+'</li>').join('');
  }

  $('#contact-form').addEventListener('submit', e=>{
    e.preventDefault();
    const d=new FormData(e.currentTarget);
    const body=encodeURIComponent(d.get('message'));
    const subj=encodeURIComponent('Portfolio Contact — '+d.get('name'));
    const to=$('#mailto').getAttribute('href').replace('mailto:','');
    location.href = `mailto:${to}?subject=${subj}&body=${body}%0A%0AFrom: ${encodeURIComponent(d.get('name'))} <${encodeURIComponent(d.get('email'))}>`;
  });
  $('#copy-email').addEventListener('click', async()=>{
    const email='muhammad.u.anjum@gmail.com';
    await navigator.clipboard.writeText(email);
    flash('Email copied to clipboard');
  });

  function renderResume(){
    const el=$('#resume-target');
    const exp=state.experience.map(e=>`
      <div><strong>${esc(e.title)}</strong> — ${esc(e.company)} <span class="muted">(${esc(e.start)}–${esc(e.end||'Present')})</span>
      <ul>${(e.highlights||[]).map(h=>'<li>'+esc(h)+'</li>').join('')}</ul></div>`).join('');
    el.innerHTML = `
      <h3>Experience</h3>${exp}
      <h3>Education</h3>${state.education.map(s=>`<div><strong>${esc(s.school)}</strong> — ${esc(s.degree)} (${esc(s.start)}–${esc(s.end||'Present')})</div>`).join('')}
      <h3>Projects</h3>${state.projects.slice(0,6).map(p=>`<div><strong>${esc(p.title)}</strong>: ${esc(p.summary||'')}</div>`).join('')}`;
  }

  function flash(msg){const t=$('#kbd-help'); t.innerHTML=esc(msg); t.hidden=false; setTimeout(()=>t.hidden=true,1500);}
  function esc(s){return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
})();