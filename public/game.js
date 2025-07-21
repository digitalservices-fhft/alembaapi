// 16-bit-style pixel avatars and selection
const CHARACTERS = [
  { // David
    name: "David",
    desc: "Grumpy, bald, casual",
    draw: function(x, y, ctx) {
      // Head with stubble
      ctx.fillStyle = "#d8bb97";ctx.fillRect(x+12,y+8,24,24);
      ctx.fillStyle = "#ad927a";ctx.fillRect(x+12,y+26,24,6); // heavy shadow jaw
      ctx.fillStyle = "#b1967a";ctx.fillRect(x+12,y+8,24,8); // frown shade
      // Frown mouth
      ctx.fillStyle = "#653117";ctx.fillRect(x+20,y+28,8,2);
      // Eyes
      ctx.fillStyle = "#222"; ctx.fillRect(x+18,y+20,2,2); ctx.fillRect(x+28,y+20,2,2);
      // Brows
      ctx.fillStyle = "#3d331a"; ctx.fillRect(x+16,y+16,8,2); ctx.fillRect(x+24,y+15,8,2);
      // Body (t-shirt blue, jeans blue)
      ctx.fillStyle = "#3c5577";ctx.fillRect(x+14,y+34,20,10);
      ctx.fillStyle = "#242279";ctx.fillRect(x+14,y+44,9,12); ctx.fillRect(x+25,y+44,9,12);
      // Shoes
      ctx.fillStyle = "#888";ctx.fillRect(x+14,y+56,9,4);ctx.fillRect(x+25,y+56,9,4);
      // Outline
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+8,24,24);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Chris
    name: "Chris",
    desc: "Handsome, brown hair, smartly dressed",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#68421a";ctx.fillRect(x+14,y+8,20,16);
      // Head
      ctx.fillStyle = "#f9cd8d";ctx.fillRect(x+12,y+14,24,20);
      // Smile
      ctx.fillStyle = "#633813";ctx.fillRect(x+20,y+27,8,2);
      ctx.fillStyle = "#ffdeb4";ctx.fillRect(x+24,y+30,2,2);
      // Eyes
      ctx.fillStyle = "#181818"; ctx.fillRect(x+18,y+22,3,2); ctx.fillRect(x+28,y+22,3,2);
      // Shirt (white), Blazer (dark blue)
      ctx.fillStyle = "#faf8fc";ctx.fillRect(x+14,y+34,20,13);
      ctx.fillStyle = "#22517e";ctx.fillRect(x+12,y+34,6,22);ctx.fillRect(x+30,y+34,6,22);
      // Tie (burgundy)
      ctx.fillStyle = "#7e232a";ctx.fillRect(x+23,y+37,4,10);
      // Pants
      ctx.fillStyle = "#322248";ctx.fillRect(x+14,y+47,9,12); ctx.fillRect(x+25,y+47,9,12);
      // Shoes
      ctx.fillStyle = "#544a49";ctx.fillRect(x+14,y+58,9,4);ctx.fillRect(x+25,y+58,9,4);
      // Outline
      ctx.strokeStyle = "#102030"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+8,24,26);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Jon
    name: "Jon",
    desc: "Smiling, brown hair, smart casual",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#6e4830";ctx.fillRect(x+14,y+10,20,14);
      // Head
      ctx.fillStyle = "#edd09e";ctx.fillRect(x+12,y+16,24,18);
      // Smile
      ctx.fillStyle = "#643c18";ctx.fillRect(x+20,y+27,8,2);ctx.fillRect(x+22,y+29,4,2);
      // Eyes
      ctx.fillStyle = "#181818"; ctx.fillRect(x+18,y+21,3,2); ctx.fillRect(x+28,y+21,3,2);
      // Shirt (light blue), jacket (violet)
      ctx.fillStyle = "#a4caed";ctx.fillRect(x+14,y+34,20,8);
      ctx.fillStyle = "#6c3483";ctx.fillRect(x+12,y+34,6,24);ctx.fillRect(x+30,y+34,6,24);
      // Pants
      ctx.fillStyle = "#3e2e41";ctx.fillRect(x+14,y+44,9,12);ctx.fillRect(x+25,y+44,9,12);
      // Shoes
      ctx.fillStyle = "#775d50";ctx.fillRect(x+14,y+56,9,4);ctx.fillRect(x+25,y+56,9,4);
      // Outline
      ctx.strokeStyle = "#1d1231"; ctx.lineWidth = 2;
      ctx.strokeRect(x+12,y+10,24,24);
      ctx.strokeRect(x+14,y+34,20,22);
    }
  },
  { // Emma
    name: "Emma",
    desc: "Shoulder-length blonde hair, pretty, nurse outfit",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#fee28d";ctx.fillRect(x+10,y+10,28,20);
      // Head
      ctx.fillStyle = "#ffdcb0";ctx.fillRect(x+14,y+16,20,18);
      // Smile
      ctx.fillStyle = "#b85a48";ctx.fillRect(x+22,y+28,5,2);
      // Eyes
      ctx.fillStyle = "#233864"; ctx.fillRect(x+19,y+22,2,2); ctx.fillRect(x+27,y+22,2,2);
      // Nurse dress
      ctx.fillStyle = "#e5eefb";ctx.fillRect(x+16,y+34,16,14);
      // Red Cross badge
      ctx.fillStyle = "#d54545";ctx.fillRect(x+27,y+37,2,8);ctx.fillRect(x+24,y+40,8,2);
      // Sleeves
      ctx.fillStyle = "#e5eefb";ctx.fillRect(x+12,y+34,7,10);ctx.fillRect(x+29,y+34,7,10);
      // Legs (white leggings)
      ctx.fillStyle = "#faf8fc";ctx.fillRect(x+16,y+48,5,9);ctx.fillRect(x+27,y+48,5,9);
      // Shoes
      ctx.fillStyle = "#aeb8be";ctx.fillRect(x+16,y+58,5,4);ctx.fillRect(x+27,y+58,5,4);
      // Outline
      ctx.strokeStyle = "#6b5631"; ctx.lineWidth = 2;
      ctx.strokeRect(x+14,y+10,20,26);
      ctx.strokeRect(x+16,y+34,16,24);
    }
  },
  { // Karen
    name: "Karen",
    desc: "Long brown hair, smart power suit",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#563a23";ctx.fillRect(x+10,y+10,28,25);
      // Head
      ctx.fillStyle = "#ebc192";ctx.fillRect(x+16,y+18,16,18);
      // Smile
      ctx.fillStyle = "#a35c3c";ctx.fillRect(x+22,y+27,4,2);
      // Eyes
      ctx.fillStyle = "#232323"; ctx.fillRect(x+20,y+23,2,2);ctx.fillRect(x+26,y+23,2,2);
      // Suit (deep steel blue)
      ctx.fillStyle = "#4e577d";ctx.fillRect(x+13,y+36,22,13);
      // Lapels
      ctx.fillStyle = "#afb3cd";ctx.fillRect(x+16,y+38,3,8);ctx.fillRect(x+29,y+38,3,8);
      // Shirt (white)
      ctx.fillStyle = "#fff";ctx.fillRect(x+20,y+38,8,10);
      // Slacks
      ctx.fillStyle = "#353a59";ctx.fillRect(x+16,y+49,7,10);ctx.fillRect(x+25,y+49,7,10);
      // Shoes
      ctx.fillStyle = "#382e44";ctx.fillRect(x+16,y+59,7,4);ctx.fillRect(x+25,y+59,7,4);
      // Outline
      ctx.strokeStyle = "#2b2331"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,26);
      ctx.strokeRect(x+16,y+36,16,24);
    }
  },
  { // Maria
    name: "Maria",
    desc: "Long brown hair, smart clothes, Greek",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#7e531e";ctx.fillRect(x+12,y+10,24,24);ctx.fillRect(x+8,y+28,32,6);
      // Head
      ctx.fillStyle = "#edc896";ctx.fillRect(x+14,y+18,20,16);
      // Smile
      ctx.fillStyle = "#ae7231";ctx.fillRect(x+22,y+27,5,2);
      // Eyes
      ctx.fillStyle = "#352a17"; ctx.fillRect(x+18,y+24,2,2); ctx.fillRect(x+28,y+24,2,2);
      // Smart top and jewelry
      ctx.fillStyle = "#f3f1eb";ctx.fillRect(x+15,y+34,18,12);
      ctx.fillStyle = "#a19b6b";ctx.fillRect(x+21,y+38,6,3); // necklace
      // Skirt (dark teal)
      ctx.fillStyle = "#268288";ctx.fillRect(x+18,y+46,12,12);
      // Shoes
      ctx.fillStyle = "#645f4b";ctx.fillRect(x+18,y+58,5,4);ctx.fillRect(x+25,y+58,5,4);
      // Outline
      ctx.strokeStyle = "#47371f"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,26);
      ctx.strokeRect(x+14,y+34,16,24);
    }
  },
  { // Rob
    name: "Rob",
    desc: "Light brown hair, smiles, suit",
    draw: function(x, y, ctx) {
      // Hair
      ctx.fillStyle = "#c1a96b";ctx.fillRect(x+14,y+10,20,13);
      // Head
      ctx.fillStyle = "#f4dcb2";ctx.fillRect(x+14,y+18,20,16);
      // Smile
      ctx.fillStyle = "#8c543a";ctx.fillRect(x+22,y+28,6,2);
      // Eyes
      ctx.fillStyle = "#221c1c"; ctx.fillRect(x+19,y+24,2,2); ctx.fillRect(x+27,y+24,2,2);
      // Suit jacket (dark), shirt (light blue), tie (blue)
      ctx.fillStyle = "#353d50";ctx.fillRect(x+13,y+35,22,12);
      ctx.fillStyle = "#add5ea";ctx.fillRect(x+20,y+38,8,10); // shirt
      ctx.fillStyle = "#355bbc";ctx.fillRect(x+24,y+42,4,7); // tie
      // Pants
      ctx.fillStyle = "#273545";ctx.fillRect(x+16,y+47,7,11);ctx.fillRect(x+25,y+47,7,11);
      // Shoes
      ctx.fillStyle = "#93919f";ctx.fillRect(x+16,y+58,7,4);ctx.fillRect(x+25,y+58,7,4);
      // Outline
      ctx.strokeStyle = "#27323d"; ctx.lineWidth = 2;
      ctx.strokeRect(x+13,y+10,22,18);
      ctx.strokeRect(x+13,y+35,22,24);
    }
  }
];

let selectedChar = null;
window.playerSpriteIndex = 0;

// Setup character selector UI
document.addEventListener('DOMContentLoaded', function() {
  const charList = document.getElementById('characterList');
  CHARACTERS.forEach((char, idx) => {
    // Create a container for avatar + name
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

    // Name label
    const nameLabel = document.createElement('div');
    nameLabel.innerText = char.name;
    nameLabel.className = "name-label";

    // Select logic
    canvas.addEventListener('click', function() {
      selectedChar = idx;
      window.playerSpriteIndex = idx;
      charList.querySelectorAll('canvas').forEach(c => c.classList.remove('selected'));
      canvas.classList.add('selected');
      document.getElementById('startGameBtn').disabled = false;
    });
    // Touch accessibility
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
    requestAnimationFrame(gameLoop);
  });
  document.getElementById('startGameBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    document.getElementById('startGameBtn').click();
  }, {passive:false});

  // Hide game by default, only show after selection
  document.querySelector('.game-container').style.display = "none";
  document.getElementById('characterSelect').style.display = "flex";
});

// ==== GAME CODE (simple demo platformer) ====
// 16-bit-ish pixel style, super simple demo for selection
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let w = canvas.width, h = canvas.height;

let px = 160, py = 176, vx = 0, vy = 0;
let onGround = true;

function drawPlayer(px, py) {
  // Draw as 16-bit sprite at px py
  CHARACTERS[window.playerSpriteIndex].draw(px-24, py-56, ctx);
}

// Simple platforms for demo
const platforms = [
  {x:0,y:220,w:360,h:20},
  {x:120,y:164,w:80,h:14},
  {x:48,y:110,w:110,h:10},
  {x:220,y:83,w:68,h:9}
];

// Controls (touch/mobile friendly)
let keys = {left:false, right:false, up:false};
function handleKey(e, val) {
  if(e.code === 'ArrowLeft' || e.key === 'a') keys.left = val;
  if(e.code === 'ArrowRight' || e.key === 'd') keys.right = val;
  if(e.code === 'ArrowUp' || e.key === 'w' || e.code === 'Space') keys.up = val;
}
window.addEventListener('keydown', e => handleKey(e,true));
window.addEventListener('keyup', e => handleKey(e,false));

// Touch controls
// Two big transparent buttons on each side for left/right, one for jump
(function touchControlsSetup(){
  let left = document.createElement('div');
  let right = document.createElement('div');
  let jump = document.createElement('div');
  [left,right,jump].forEach(el=>{
    el.style.position="absolute";
    el.style.bottom="0";el.style.width="34vw";el.style.height="32vw";
    el.style.opacity="0.05";el.style.zIndex=99;el.style.userSelect="none";
    el.style.touchAction="none";
  });
  left.style.left="0";  right.style.right="0";
  jump.style.left="35vw"; jump.style.width="30vw";
  jump.style.bottom="32vw"; jump.style.height="16vw";
  document.body.appendChild(left);
  document.body.appendChild(right);
  document.body.appendChild(jump);
  left.addEventListener('touchstart', ()=>keys.left=true); left.addEventListener('touchend', ()=>keys.left=false); left.addEventListener('touchcancel',()=>keys.left=false);
  right.addEventListener('touchstart', ()=>keys.right=true); right.addEventListener('touchend', ()=>keys.right=false); right.addEventListener('touchcancel',()=>keys.right=false);
  jump.addEventListener('touchstart', ()=>keys.up=true);jump.addEventListener('touchend', ()=>keys.up=false);jump.addEventListener('touchcancel',()=>keys.up=false);
})();

function gameLoop(){
  // Physics
  vx = (keys.left?-2.2:0)+(keys.right?2.2:0);
  if(onGround && keys.up){ vy = -6; onGround=false; }
  vy += 0.27; if(vy>5)vy=5;
  px += vx; py += vy;

  // Platform collision
  onGround = false;
  for(const pf of platforms){
    if(px+7>pf.x && px-7<pf.x+pf.w && py+8>pf.y && py<pf.y+pf.h){
      py=pf.y-8; vy=0; onGround=true; keys.up=false;
    }
  }
  // Screen bounds
  if(px<12)px=12;if(px>w-12)px=w-12;
  if(py>220)py=220;

  // Draw background
  ctx.fillStyle = "#2b3560";
  ctx.fillRect(0,0,w,h);

  // Background gradient
  let grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,"#687de4");
  grad.addColorStop(1,"#393b68");
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);

  // Draw platforms
  platforms.forEach(pf=>{
    ctx.fillStyle = "#756b9d";
    ctx.fillRect(pf.x,pf.y,pf.w,pf.h);
    ctx.strokeStyle = "#f0cb4a";
    ctx.strokeRect(pf.x,pf.y,pf.w,pf.h);
    // 16-bit highlight
    ctx.fillStyle = "#e8e0bc"; ctx.fillRect(pf.x,pf.y,pf.w,3);
  });

  // Draw player
  drawPlayer(px, py);

  // Prompt
  ctx.font = "bold 14px 'Press Start 2P', monospace";
  ctx.fillStyle="#fff";
  ctx.fillText("Arrows or Touch: Move  |  Jump",15,22);

  requestAnimationFrame(gameLoop);
}