/* Read-only content binding. All data and media are bundled with this site. */
(() => {
  const content=window.SITE_CONTENT;
  const texts=[],images=[],links=[];
  const grid=document.getElementById('jobs-grid');
  const template=document.getElementById('vacancy-card').content.firstElementChild;
  // Preserve the historical content IDs while mapping the existing template.
  Object.keys(JOBS).forEach((title,i)=>{
    const card=template.cloneNode(true);
    card.querySelector('.job-title').textContent=title;
    card.querySelector('.job-tag').textContent=`[Категорія ${i+1}]`;
    card.querySelector('img').src=`assets/images/jobs/job-${i+1}.webp`;
    grid.append(card);
  });
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let textIndex=0,imageIndex=0,node;
  while((node=walker.nextNode())){
    if(!node.textContent.trim()||node.parentElement.closest('script,style,svg,.modal-overlay,.tl-ongoing'))continue;
    texts.push({id:node.parentElement.dataset.cmsText||`t${textIndex++}`,node});
  }
  document.querySelectorAll('img').forEach(node=>{
    if(!node.closest('.modal-overlay'))images.push({id:node.dataset.cmsImage||`i${imageIndex++}`,node});
  });
  document.querySelectorAll('a[href]').forEach(node=>links.push({id:`l${links.length}`,node}));
  texts.forEach(({id,node})=>{
    if(grid.contains(node))return;
    if(content.texts[id]!==undefined)node.textContent=content.texts[id];
    if(node.parentElement.classList.contains('stat-num-inner'))node.parentElement.dataset.target=node.textContent;
    if(node.parentElement.classList.contains('tl-name'))node.parentElement.title=node.textContent;
  });
  images.forEach(({id,node})=>{if(!grid.contains(node)&&content.images[id])node.src=content.images[id];});
  const emblem=document.querySelector('.hero-emblem img');
  if(emblem)document.querySelectorAll('[data-cms-linked-image="hero-emblem"]').forEach(node=>node.src=emblem.src);
  links.forEach(({id,node})=>{
    if(grid.contains(node)||node.matches('.modal-anketa-btn'))return;
    const url=content.links[id]??node.getAttribute('href');
    node.setAttribute('href',url||'#');
    if(url&&url!=='#'){node.removeAttribute('data-pending-link');node.removeAttribute('aria-disabled');}
    else{node.setAttribute('data-pending-link','');node.setAttribute('aria-disabled','true');}
  });
  const cards=[];
  for(const vacancy of content.vacancies){
    if(!vacancy.title.trim())continue;
    const card=template.cloneNode(true);
    card.querySelector('.job-title').textContent=vacancy.title;
    const tag=card.querySelector('.job-tag');
    tag.textContent=vacancy.category;tag.hidden=!vacancy.category.trim();
    const image=card.querySelector('img');
    if(vacancy.image)image.src=vacancy.image;else image.remove();
    card.setAttribute('aria-label','Деталі вакансії «'+vacancy.title+'»');
    card.addEventListener('click',()=>window.openVacancy(vacancy,card));
    cards.push(card);
  }
  if(!cards.length){const empty=document.createElement('p');empty.textContent='Наразі відкритих вакансій немає.';cards.push(empty);}
  grid.replaceChildren(...cards);
  for(const [key,edits] of Object.entries(content.bios||{}))if(CMD_BIOS[key])Object.assign(CMD_BIOS[key],edits);
  document.querySelectorAll('.cmd-card').forEach((card,i)=>{
    const key=`cmd-${i+1}`,bio=CMD_BIOS[key],edits=content.bios?.[key]||{};
    if(!bio)return;
    if(edits.name!==undefined)card.querySelector('.cmd-name').textContent=edits.name;
    if(edits.rank!==undefined)card.dataset.rank=edits.rank;
    const photo=card.querySelector('img');if(photo)bio.photo=photo.getAttribute('src');
  });
})();
