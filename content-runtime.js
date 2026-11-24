/* The HTML already contains final text and image URLs. Only bind interactions. */
(() => {
  const content=window.SITE_CONTENT;
  const vacancies=new Map(content.vacancies.map(vacancy=>[vacancy.id,vacancy]));
  document.querySelectorAll('[data-vacancy-id]').forEach(card=>{
    const vacancy=vacancies.get(card.dataset.vacancyId);
    if(vacancy)card.addEventListener('click',()=>window.openVacancy(vacancy,card));
  });
  for(const [key,edits] of Object.entries(content.bios||{})){
    if(CMD_BIOS[key])Object.assign(CMD_BIOS[key],edits);
  }
  document.querySelectorAll('.cmd-card').forEach((card,i)=>{
    const bio=CMD_BIOS[`cmd-${i+1}`];
    const photo=card.querySelector('img');
    if(bio&&photo)bio.photo=photo.getAttribute('src');
  });
})();
