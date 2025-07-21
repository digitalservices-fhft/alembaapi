// 16-bit-style pixel avatars and selection
const CHARACTERS = [
  { // David
    name: "David",
    desc: "Grumpy, bald, casual",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#d8bb97";ctx.fillRect(x+12,y+8,24,24);
      ctx.fillStyle = "#ad927a";ctx.fillRect(x+12,y+26,24,6);
      ctx.fillStyle = "#b1967a";ctx.fillRect(x+12,y+8,24,8);
      ctx.fillStyle = "#653117";ctx.fillRect(x+20,y+28,8,2);
      ctx.fillStyle = "#222"; ctx.fillRect(x+18,y+20,2,2); ctx.fillRect(x+28,y+20,2,2);
      ctx.fillStyle = "#3d331a"; ctx.fillRect(x+16,y+16,8,2); ctx.fillRect(x+24,y+15,8,2);
      ctx.fillStyle = "#3c5577";ctx.fillRect(x+14,y+34,20,10);
      ctx.fillStyle = "#242279";ctx.fillRect(x+14,y+44,9,12); ctx.fillRect(x+25,y+44,9,12);
      ctx.fillStyle = "#888";ctx.fillRect(x+14,y+56,9,4);ctx.fillRect(x+25,y+56,9,4);
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+8,24,24);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Chris
    name: "Chris",
    desc: "Handsome, brown hair, smartly dressed",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#68421a";ctx.fillRect(x+14,y+8,20,16);
      ctx.fillStyle = "#f9cd8d";ctx.fillRect(x+12,y+14,24,20);
      ctx.fillStyle = "#633813";ctx.fillRect(x+20,y+27,8,2);
      ctx.fillStyle = "#ffdeb4";ctx.fillRect(x+24,y+30,2,2);
      ctx.fillStyle = "#181818"; ctx.fillRect(x+18,y+22,3,2); ctx.fillRect(x+28,y+22,3,2);
      ctx.fillStyle = "#faf8fc";ctx.fillRect(x+14,y+34,20,13);
      ctx.fillStyle = "#22517e";ctx.fillRect(x+12,y+34,6,22);ctx.fillRect(x+30,y+34,6,22);
      ctx.fillStyle = "#7e232a";ctx.fillRect(x+23,y+37,4,10);
      ctx.fillStyle = "#322248";ctx.fillRect(x+14,y+47,9,12); ctx.fillRect(x+25,y+47,9,12);
      ctx.fillStyle = "#544a49";ctx.fillRect(x+14,y+58,9,4);ctx.fillRect(x+25,y+58,9,4);
      ctx.strokeStyle = "#102030"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+8,24,26);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Jon
    name: "Jon",
    desc: "Smiling, brown hair, smart casual",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#6e4830";ctx.fillRect(x+14,y+10,20,14);
      ctx.fillStyle = "#edd09e";ctx.fillRect(x+12,y+16,24,18);
      ctx.fillStyle = "#643c18";ctx.fillRect(x+20,y+27,8,2);ctx.fillRect(x+22,y+29,4,2);
      ctx.fillStyle = "#181818"; ctx.fillRect(x+18,y+21,3,2); ctx.fillRect(x+28,y+21,3,2);
      ctx.fillStyle = "#a4caed";ctx.fillRect(x+14,y+34,20,8);
      ctx.fillStyle = "#6c3483";ctx.fillRect(x+12,y+34,6,24);ctx.fillRect(x+30,y+34,6,24);
      ctx.fillStyle = "#3e2e41";ctx.fillRect(x+14,y+44,9,12);ctx.fillRect(x+25,y+44,9,12);
      ctx.fillStyle = "#775d50";ctx.fillRect(x+14,y+56,9,4);ctx.fillRect(x+25,y+56,9,4);
      ctx.strokeStyle = "#1d1231"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+10,24,24);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Emma
    name: "Emma",
    desc: "Shoulder-length blonde hair, pretty, nurse outfit",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#fee28d";ctx.fillRect(x+10,y+10,28,20);
      ctx.fillStyle = "#ffdcb0";ctx.fillRect(x+14,y+16,20,18);
      ctx.fillStyle = "#b85a48";ctx.fillRect(x+22,y+28,5,2);
      ctx.fillStyle = "#233864"; ctx.fillRect(x+19,y+22,2,2); ctx.fillRect(x+27,y+22,2,2);
      ctx.fillStyle = "#e5eefb";ctx.fillRect(x+16,y+34,16,14);
      ctx.fillStyle = "#d54545";ctx.fillRect(x+27,y+37,2,8);ctx.fillRect(x+24,y+40,8,2);
      ctx.fillStyle = "#e5eefb";ctx.fillRect(x+12,y+34,7,10);ctx.fillRect(x+29,y+34,7,10);
      ctx.fillStyle = "#faf8fc";ctx.fillRect(x+16,y+48,5,9);ctx.fillRect(x+27,y+48,5,9);
      ctx.fillStyle = "#aeb8be";ctx.fillRect(x+16,y+58,5,4);ctx.fillRect(x+27,y+58,5,4);
      ctx.strokeStyle = "#6b5631"; ctx.lineWidth = 2;
      ctx.strokeRect(x+14,y+10,20,26);
      ctx.strokeRect(x+16,y+34,16,24);
    }
  },
  { // Karen
    name: "Karen",
    desc: "Long brown hair, smart power suit",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#563a23";ctx.fillRect(x+10,y+10,28,25);
      ctx.fillStyle = "#ebc192";ctx.fillRect(x+16,y+18,16,18);
      ctx.fillStyle = "#a35c3c";ctx.fillRect(x+22,y+27,4,2);
      ctx.fillStyle = "#232323"; ctx.fillRect(x+20,y+23,2,2);ctx.fillRect(x+26,y+23,2,2);
      ctx.fillStyle = "#4e577d";ctx.fillRect(x+13,y+36,22,13);
      ctx.fillStyle = "#afb3cd";ctx.fillRect(x+16,y+38,3,8);ctx.fillRect(x+29,y+38,3,8);
      ctx.fillStyle = "#fff";ctx.fillRect(x+20,y+38,8,10);
      ctx.fillStyle = "#353a59";ctx.fillRect(x+16,y+49,7,10);ctx.fillRect(x+25,y+49,7,10);
      ctx.fillStyle = "#382e44";ctx.fillRect(x+16,y+59,7,4);ctx.fillRect(x+25,y+59,7,4);
      ctx.strokeStyle = "#2b2331"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,26);
      ctx.strokeRect(x+16,y+36,16,24);
    }
  },
  { // Maria
    name: "Maria",
    desc: "Long brown hair, smart clothes, Greek",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#7e531e";ctx.fillRect(x+12,y+10,24,24);ctx.fillRect(x+8,y+28,32,6);
      ctx.fillStyle = "#edc896";ctx.fillRect(x+14,y+18,20,16);
      ctx.fillStyle = "#ae7231";ctx.fillRect(x+22,y+27,5,2);
      ctx.fillStyle = "#352a17"; ctx.fillRect(x+18,y+24,2,2); ctx.fillRect(x+28,y+24,2,2);
      ctx.fillStyle = "#f3f1eb";ctx.fillRect(x+15,y+34,18,12);
      ctx.fillStyle = "#a19b6b";ctx.fillRect(x+21,y+38,6,3); // necklace
      ctx.fillStyle = "#268288";ctx.fillRect(x+18,y+46,12,12);
      ctx.fillStyle = "#645f4b";ctx.fillRect(x+18,y+58,5,4);ctx.fillRect(x+25,y+58,5,4);
      ctx.strokeStyle = "#47371f"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,26);
      ctx.strokeRect(x+14,y+34,16,24);
    }
  },
  { // Rob
    name: "Rob",
    desc: "Light brown hair, smiles, suit",
    draw: function(x, y, ctx) {
      ctx.fillStyle = "#c1a96b";ctx.fillRect(x+14,y+10,20,13);
      ctx.fillStyle = "#f4dcb2";ctx.fillRect(x+14,y+18,20,16);
      ctx.fillStyle = "#8c543a";ctx.fillRect(x+22,y+28,6,2);
      ctx.fillStyle = "#221c1c"; ctx.fillRect(x+19,y+24,2,2); ctx.fillRect(x+27,y+24,2,2);
      ctx.fillStyle = "#353d50";ctx.fillRect(x+13,y+35,22,12);
      ctx.fillStyle = "#add5ea";ctx.fillRect(x+20,y+38,8,10); // shirt
      ctx.fillStyle = "#355bbc";ctx.fillRect(x+24,y+42,4,7); // tie
      ctx.fillStyle = "#273545";ctx.fillRect(x+16,y+47,7,11);ctx.fillRect(x+25,y+47,7,11);
      ctx.fillStyle = "#93919f";ctx.fillRect(x+16,y+58,7,4);ctx.fillRect(x+25,y+58,7,4);
      ctx.strokeStyle = "#27323d"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,18);
      ctx.strokeRect(x+13,y+35,22,24);
    }
  }
];

let selectedChar = null;
window.playerSpriteIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
  const charList = document.getElementById('characterList');
  CHARACTERS.forEach((char, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';

    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 64;
    canvas.style.width = "48px";
    canvas.style.height = "64px";
    char.draw(0, 0, canvas.getContext('2d'));

    canvas.title = char.name + " - " + char.desc;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', char.name);

    const nameLabel = document.createElement('div');
    nameLabel.innerText = char.name;
    nameLabel.className = "name-label";

    canvas.addEventListener('click', function() {
      selectedChar = idx;
      window.playerSpriteIndex = idx;
      charList.querySelectorAll('canvas').forEach(c => c.classList.remove('selected'));
      canvas.classList.add('selected');
      document.getElementById('startGameBtn').disabled = false;
    });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault(); canvas.click();
    }, {passive:false});

    wrapper.appendChild(canvas);
    wrapper.appendChild(nameLabel);
    charList.appendChild(wrapper);
  });

  document.getElementById('startGameBtn').addEventListener('click', function() {
    document.getElementById('characterSelect').style.display = 'none';
    document.querySelector('.game-container').style.display = '';
    window.playerSpriteIndex = selectedChar !== null ? selectedChar : 0;
    startGame();
  });

  document.getElementById('startGameBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    document.getElementById('startGameBtn').click();
  }, {passive:false});

  document.querySelector('.game-container').style.display = "none";
  document.getElementById('characterSelect').style.display = "flex";
});

// --- Main game code: gameplay, animation, player, patients, hospital, boss, touch controls ---

// Canvas/game state variables
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

let state = "title"; // "title", "running", "gameover", "win", "boss"

// Player state
let player = {
  x: W*0.18,
  y: H-68,
  vy: 0,
  width: 38,
  height: 56,
  grounded: true,
  anim: 0,
  dead: false
};

// Gameplay variables
let input = { left: false, right: false, up: false };
let patients = [];
let patientsPassed = 0;
let spawnTimer = 0, spawnRate = 42;
let bossAppeared = false;
let fireworks = [];

// Touch controls setup
let lastTouchX = 0;
function setupTouchControls() {
  let startX=0, dx=0, moving=false;
  canvas.addEventListener('touchstart', function(e){
    if(e.touches.length===1){
      lastTouchX=e.touches[0].pageX;
      startX=lastTouchX;
      moving=true;
    }
  },{passive:false});
  canvas.addEventListener('touchmove', function(e){
    if(!moving) return;
    dx = e.touches[0].pageX - startX;
    if(dx < -24){ input.left=true; input.right=false; } 
    else if(dx > 24){ input.right=true; input.left=false; }
    else { input.left=false; input.right=false; }
  },{passive:false});
  canvas.addEventListener('touchend', function(e){
    if(moving){
      input.left=false; input.right=false;dx=0;moving=false;
    }
  },{passive:false});
  // Swipe up to jump
  canvas.addEventListener('touchstart', function(e){
    lastTouchX = e.touches[0].clientY;
  },{passive:false});
  canvas.addEventListener('touchend', function(e){
    let dy = e.changedTouches[0].clientY - lastTouchX;
    if(dy<-50) input.up=true;
    setTimeout(()=>{input.up=false;},120);
  },{passive:false});
}
setupTouchControls();

// Keyboard controls
window.addEventListener('keydown', e => {
  if(e.key==='ArrowLeft'||e.key==='a') input.left=true;
  if(e.key==='ArrowRight'||e.key==='d') input.right=true;
  if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') input.up=true;
});
window.addEventListener('keyup', e => {
  if(e.key==='ArrowLeft'||e.key==='a') input.left=false;
  if(e.key==='ArrowRight'||e.key==='d') input.right=false;
  if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') input.up=false;
});

// Game logic functions

function resetGame() {
  player.x = W*0.18;
  player.y = H-68;
  player.vy = 0;
  player.grounded = true;
  patients = [];
  patientsPassed = 0;
  spawnTimer = 0;
  bossAppeared = false;
  fireworks = [];
  state = "running";
}

function spawnPatient() {
  let y=H-64;
  let iv=Math.random()>0.65;
  patients.push({
    x: W+20+Math.random()*70, y, iv,
    t: Math.floor(Math.random()*24)
  });
}
function spawnBoss() {
  patients = [];
  bossAppeared = {x:W+5, y:H-90, vx:-2.4};
}

// Hospital corridor background (parallax style)
function drawHospitalBackground(scroll) {
  ctx.save();
  ctx.fillStyle = "#dbe6f1";
  ctx.fillRect(0,0,W,H);
  // Scrolling floor tiles
  ctx.fillStyle = "#e8eaf2";
  for(let i=0;i<W;i+=44) ctx.fillRect((i-(scroll%44)),H-36,36,9);
  // Wall panels
  for(let i=0;i<W; i+=118) {
    ctx.fillStyle = "#bdc9d9";
    ctx.fillRect((i-(scroll%118)),44,104,98);
    ctx.strokeStyle = "#a6b3c4";
    ctx.strokeRect((i-(scroll%118)),44,104,98);
    ctx.fillStyle = "#ddf5f8";
    ctx.fillRect((i-(scroll%118))+13,52,78,12);
  }
  // Hospital beds
  for(let i=0;i<W;i+=88) {
    ctx.fillStyle = "#b8bdc3";
    ctx.fillRect((i-(scroll%88))+13,H-84,56,19);
    ctx.fillStyle = "#e2ecf3";
    ctx.fillRect((i-(scroll%88))+15,H-79,52,11);
    ctx.strokeStyle = "#8b959c";
    ctx.strokeRect((i-(scroll%88))+13,H-84,56,19);
  }
  // Wheeled IV stand
  ctx.fillStyle = "#888";
  ctx.fillRect(W/1.2-(scroll%21), H-66, 6, 24);
  ctx.strokeStyle = "#aaa6";
  ctx.beginPath(); ctx.arc(W/1.2-(scroll%21)+3,H-42,6,0,2*Math.PI); ctx.stroke();
  ctx.restore();
}

// Ill patient
function drawPatient(p) {
  ctx.save();
  let baseX = p.x, baseY = p.y;
  ctx.fillStyle = "#d9efe9";
  ctx.fillRect(baseX+5,baseY+20,26,35);
  ctx.fillStyle="#b8e0cf";
  ctx.fillRect(baseX+12,baseY+24,12,8);
  ctx.fillStyle = "#c6d5b7";
  ctx.beginPath(); ctx.ellipse(baseX+18,baseY+13,12,13,0,0,2*Math.PI); ctx.fill();
  ctx.fillStyle = "#324d39";
  ctx.fillRect(baseX+12,baseY+16,3,3); ctx.fillRect(baseX+22,baseY+16,3,3);
  ctx.fillStyle = "#666";
  ctx.fillRect(baseX+15,baseY+24,6,3);
  // IV Stand if any
  if(p.iv){
    ctx.strokeStyle="#99aed1";ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(baseX+30,baseY+24); ctx.lineTo(baseX+35,baseY+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(baseX+35,baseY+5); ctx.lineTo(baseX+35,baseY+38); ctx.stroke();
  }
  if(Math.floor(p.t/12)%2===0) ctx.fillStyle="#b8e0cf";
  else ctx.fillStyle="#c6d5b7";
  ctx.fillRect(baseX+13,baseY+43,12,8);
  ctx.fillStyle="#c0d0e0";ctx.fillRect(baseX+5,baseY+51,26,4);
  ctx.restore();
}

// ARRAN boss
function drawBoss(arran) {
  ctx.save();
  let x=arran.x, y=arran.y;
  ctx.fillStyle="#585c67";
  ctx.fillRect(x+2,y+34,38,36);
  ctx.fillStyle="#b8a180";
  ctx.beginPath();
  ctx.ellipse(x+20,y+54,20,17,0,0,Math.PI,true); ctx.fill();
  ctx.fillStyle="#e7cbad";
  ctx.beginPath();
  ctx.ellipse(x+22,y+15,17,20,0,0,2*Math.PI); ctx.fill();
  ctx.fillStyle="#b39c73";
  ctx.fillRect(x+13,y+29,16,5);
  ctx.fillStyle="#222"; ctx.fillRect(x+14,y+19,6,2); ctx.fillRect(x+27,y+19,6,2);
  ctx.fillStyle="#6c3d22"; ctx.fillRect(x+19,y+25,10,4);
  ctx.fillStyle="#ebeced";
  ctx.fillRect(x+11,y+36,8,16); ctx.fillRect(x+31,y+36,8,16);
  ctx.fillStyle="#e3e2db"; ctx.fillRect(x+18,y+41,10,16);
  ctx.fillStyle="#233468"; ctx.fillRect(x+22,y+44,4,12);
  ctx.fillStyle="#595c64"; ctx.fillRect(x-7,y+37,9,22); ctx.fillRect(x+38,y+37,9,22);
  ctx.fillStyle = "#433423"; ctx.fillRect(x+3,y+68,13,6); ctx.fillRect(x+26,y+68,13,6);
  ctx.restore();
}

// Player
function drawPlayerChar(x, y, anim) {
  let bounce = Math.abs(Math.sin(anim/7)*4)*(player.grounded?1:0.5);
  CHARACTERS[window.playerSpriteIndex].draw(x-16, y-bounce-56, ctx);
}

// Fireworks (for win)
function drawFireworks() {
  for(let f of fireworks) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle=f.color;
    ctx.beginPath();
    for(let i=0;i<12;++i){
      let angle=i*Math.PI*2/12;
      ctx.moveTo(f.x,f.y);
      ctx.lineTo(f.x+Math.cos(angle)*f.radius, f.y+Math.sin(angle)*f.radius);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// Messaging
function showMessage(msg, dur){
  let overlay = document.getElementById('messageOverlay');
  overlay.innerText=msg;
  overlay.className="visible";
  setTimeout(()=>{overlay.className='';}, dur||2000);
}

// Game state machine & loop
function stepGame() {
  let speed = 2.38;
  if(input.left) player.x -= speed;
  if(input.right) player.x += speed;
  player.x = Math.max(14, Math.min(W-42, player.x));
  if(player.grounded && input.up) { player.vy=-6.2; player.grounded=false; }
  player.y += player.vy; player.vy+=0.32;
  if(player.y>H-68){player.y=H-68;player.grounded=true;player.vy=0;}

  let scroll = Math.max(0,patientsPassed*14);

  if(!bossAppeared) {
    spawnTimer++;
    if(spawnTimer > spawnRate && patientsPassed<100){
      if(patients.length<4) spawnPatient();
      spawnTimer=0;
    }
    for(let p of patients) {
      p.x -= 2.4; p.t++;
    }
    patients = patients.filter(p => p.x > -40);
    for(let p of patients) {
      if(Math.abs(player.x-p.x)<28 && Math.abs(player.y-p.y)<40) {
        gameOver();
        return;
      }
      if(p.x+18<player.x && !p.passed) {
        p.passed = true; patientsPassed++;
      }
    }
    if(patientsPassed >= 100 && !bossAppeared) {
      setTimeout(()=>{ showMessage("You must void Aaran",1200); setTimeout(spawnBoss,1200); },350);
      bossAppeared=true;
    }
  } else if(bossAppeared && typeof bossAppeared=="object") {
    bossAppeared.x += bossAppeared.vx;
    if(bossAppeared.x<player.x+8) bossAppeared.vx=2.7;
    if(bossAppeared.x>W-48) bossAppeared.vx=-2.2;
    if(Math.abs(player.x-bossAppeared.x)<32 && Math.abs(player.y-bossAppeared.y)<50) {
      gameOver();
      return;
    }
    if(bossAppeared.x<10){
      state="win";
      for(let i=0;i<10;i++){
        fireworks.push({x:60+Math.random()*360,y:80+Math.random()*80,radius:2,color:`hsl(${Math.random()*360},95%,70%)`,frames:48+Math.random()*32});
      }
      showMessage("Congratulations - you win!",4800);
      setTimeout(resetAll,5200);
    }
  }
}

function gameOver() {
  state = "gameover";
  showMessage("Game - Over....\nBetter luck next time",2200);
  setTimeout(resetAll,2500);
}
function resetAll() {
  document.getElementById('characterSelect').style.display = "flex";
  document.querySelector('.game-container').style.display = "none";
  document.getElementById('messageOverlay').className='';
  resetGame();
}

let frame=0;
function gameLoop() {
  frame++;
  let scroll=Math.max(patientsPassed*14, (bossAppeared&&typeof bossAppeared=="object"?Math.max(0, (100*14)+W-bossAppeared.x):0));
  drawHospitalBackground(scroll);

  if(state==="running") {
    for(let p of patients) drawPatient(p);
    drawPlayerChar(player.x,player.y,frame);
    ctx.font="16px monospace";ctx.fillStyle="#377988";
    ctx.fillText(`Patients avoided: ${patientsPassed}`,W-264,34);
    stepGame();
  }
  else if(state==="gameover") {
    drawPlayerChar(player.x,player.y,frame);
  }
  else if(state==="win") {
    fireworks.forEach(f=>{f.radius+=2;f.frames--;});
    fireworks = fireworks.filter(f=>f.frames>0);
    drawFireworks();
  }
  if(bossAppeared && typeof bossAppeared=="object") drawBoss(bossAppeared);

  requestAnimationFrame(gameLoop);
}

function startGame() {
  resetGame();
  document.getElementById('messageOverlay').className='';
  state="running";
  gameLoop();
}