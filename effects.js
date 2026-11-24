
/* ── SPARKS ANIMATION ── */
(function(){
  const canvas=document.getElementById('sparks-canvas');
  const ctx=canvas.getContext('2d');
  let particles=[],windParticles=[],time=0;

  function turbulence(x,y,t){
    const scale1=0.003,scale2=0.007,scale3=0.015;
    const tx=
      Math.sin(x*scale1+t*0.8)*Math.cos(y*scale1*0.7+t*0.5)*1.2+
      Math.sin(x*scale2-t*1.1+y*scale2*0.5)*0.6+
      Math.sin(x*scale3*0.9+y*scale3+t*1.6)*0.3;
    const ty=
      Math.cos(x*scale1*0.8+y*scale1+t*0.6)*1.2+
      Math.cos(y*scale2*1.1-t*0.9+x*scale2*0.4)*0.6+
      Math.cos(y*scale3+x*scale3*0.7-t*1.3)*0.3;
    return{tx,ty};
  }

  function setCanvasSize(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
  }
  setCanvasSize();
  window.addEventListener('resize',setCanvasSize);

  class Particle{
    constructor(x,y,isExplosion=false,isWind=false){
      this.x=x;this.y=y;this.isWind=isWind;
      if(isWind){
        const angle=-35*(Math.PI/180);
        const speed=Math.random()*8+6;
        this.vx=Math.cos(angle)*speed;
        this.vy=Math.sin(angle)*speed;
        this.maxLife=Math.random()*60+100;
        this.size=Math.random()*0.8+0.2;
      }else{
        this.vx=(Math.random()-0.5)*(isExplosion?2:0.4);
        this.vy=isExplosion?(Math.random()-0.5)*2:-(Math.random()*1.2+0.8);
        this.maxLife=Math.random()*300+700;
        this.size=Math.random()*0.5+0.1;
      }
      this.life=this.maxLife;
      this.wobble=Math.random()*Math.PI*2;
    }
    update(){
      this.wobble+=0.03;
      const wobbleFactor=this.isWind?0:Math.sin(this.wobble)*0.15;
      const{tx,ty}=turbulence(this.x,this.y,time);
      const turbStrength=this.isWind?0.35:0.55;
      this.x+=this.vx+wobbleFactor+tx*turbStrength;
      this.y+=this.vy+ty*turbStrength;
      this.life--;
    }
    draw(){
      const ratio=this.life/this.maxLife;
      let alpha=ratio;
      if(!this.isWind&&ratio>0.85)alpha=(1-ratio)*6;
      const hue=this.isWind?40:18;
      const lightness=this.isWind?60+ratio*30:40+ratio*50;
      ctx.fillStyle=`hsla(${hue},100%,${lightness}%,${alpha})`;
      ctx.beginPath();
      ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
      ctx.fill();
    }
  }

  function drawFog(){
    const fogHeight=canvas.height*0.3;
    const grad=ctx.createLinearGradient(0,canvas.height,0,canvas.height-fogHeight);
    grad.addColorStop(0,'rgba(20,12,5,0.18)');
    grad.addColorStop(1,'rgba(5,5,5,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,canvas.height-fogHeight,canvas.width,fogHeight);
  }

  function triggerWindGust(){
    const count=Math.floor(Math.random()*10+15);
    const startY=canvas.height*(0.4+Math.random()*0.5);
    for(let i=0;i<count;i++){
      setTimeout(()=>{
        windParticles.push(new Particle(-20,startY+(Math.random()*100-50),false,true));
      },i*25);
    }
  }

  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawFog();
    ctx.globalCompositeOperation='lighter';
    if(particles.length<50&&Math.random()>0.96){
      particles.push(new Particle(Math.random()*canvas.width,canvas.height+5));
    }
    if(Math.random()>0.9925)triggerWindGust();
    [particles,windParticles].forEach(group=>{
      for(let i=group.length-1;i>=0;i--){
        const p=group[i];
        p.update();p.draw();
        if(p.life<=0||p.x>canvas.width+50||p.y<-50)group.splice(i,1);
      }
    });
    time+=0.012;
    ctx.globalCompositeOperation='source-over';
    requestAnimationFrame(animate);
  }

  const handleMove=(e)=>{
    const x=e.clientX||(e.touches&&e.touches[0].clientX);
    const y=e.clientY||(e.touches&&e.touches[0].clientY);
    if(x&&y&&Math.random()>0.9)particles.push(new Particle(x,y,true));
  };
  window.addEventListener('mousemove',handleMove);
  window.addEventListener('touchmove',handleMove,{passive:true});

  animate();
})();
