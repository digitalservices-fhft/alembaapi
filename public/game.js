window.playerSpriteIndex = 0;
// ===== Character options =====
const CHARACTERS = [
  { name: "David", desc: "Grumpy, bald, casual", draw: function(x, y, ctx) {
    // Draw grumpy bald David in jeans+tee
    ctx.fillStyle = "#888"; ctx.fillRect(x+4, y, 16, 15); // head
    ctx.fillStyle = "#bbb"; ctx.fillRect(x+7, y+7, 10, 5); // eyebrows
    ctx.fillStyle = "#315d7d"; ctx.fillRect(x, y+16, 24, 12); // T-shirt
    ctx.fillStyle = "#225"; ctx.fillRect(x, y+28, 24, 10); // Jeans
  }},
  { name: "Chris", desc: "Handsome, brown hair, smart", draw: function(x, y, ctx) {
    ctx.fillStyle = "#6b4e23"; ctx.fillRect(x+4, y, 16, 15); // brown hair/head
    ctx.fillStyle = "#fff"; ctx.fillRect(x+7, y+17, 10, 10); // white shirt
    ctx.fillStyle = "#1a237e"; ctx.fillRect(x, y+27, 24, 8); // navy slacks
    ctx.strokeStyle = "#bdbdbd"; ctx.strokeRect(x+8, y+18, 8, 8); // tie outline
  }},
  { name: "Jon", desc: "Smiling, brown hair, smart casual", draw: function(x, y, ctx) {
    ctx.fillStyle = "#795548"; ctx.fillRect(x+4, y, 16, 15); // brown hair/head
    ctx.fillStyle = "#b0bec5"; ctx.fillRect(x+3, y+15, 18, 8); // shirt (grey/blue)
    ctx.fillStyle = "#7b1fa2"; ctx.fillRect(x, y+23, 24, 10); // jacket
  }},
  { name: "Emma", desc: "Blonde, nurse", draw: function(x, y, ctx) {
    ctx.fillStyle = "#ffeb3b"; ctx.fillRect(x+4, y, 16, 15); // blonde hair/head
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y+16, 24, 20); // nurse dress
    ctx.fillStyle = "#e57373"; ctx.fillRect(x+10, y+16, 4, 4); // cross badge
  }},
  { name: "Karen", desc: "Long brown hair, power suit", draw: function(x, y, ctx) {
    ctx.fillStyle = "#4e342e"; ctx.fillRect(x+3, y, 18, 17); // hair
    ctx.fillStyle = "#fff"; ctx.fillRect(x+8, y+12, 8, 7); // white shirt
    ctx.fillStyle = "#607d8b"; ctx.fillRect(x, y+19, 24, 15); // suit
  }},
  { name: "Maria", desc: "Long brown hair, smart clothes, Greek", draw: function(x, y, ctx) {
    ctx.fillStyle = "#7b5435"; ctx.fillRect(x+3, y, 18, 17); // hair
    ctx.fillStyle = "#607d8b"; ctx.fillRect(x, y+19, 24, 10); // dress
    ctx.fillStyle = "#ffd54f"; ctx.fillRect(x+15, y+18, 6, 2); // jewelry
  }},
  { name: "Rob", desc: "Light brown hair, suit", draw: function(x, y, ctx) {
    ctx.fillStyle = "#bcaaa4"; ctx.fillRect(x+4, y, 16, 15); // light brown head
    ctx.fillStyle = "#212121"; ctx.fillRect(x, y+14, 24, 15); // suit
    ctx.fillStyle = "#fff"; ctx.fillRect(x+8, y+16, 8, 8); // shirt
    ctx.fillStyle = "#64b5f6"; ctx.fillRect(x+11, y+17, 2, 7); // tie
  }}
];
let selectedChar = 0;

$(function () {
  // ========== GAME CONSTANTS ==========
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let W = canvas.width;
  let H = canvas.height;
  // Player properties
  const player = {
    x: 50, y: H - 54,
    w: 24, h: 28,
    vx: 0, vy: 0,
    speed: 3,
    jump_strength: 8,
    grounded: true,
    color: "#003087"
  };

  // Simple 8-bit hospital platforms
  const platforms = [
    { x: 0, y: H - 24, w: 2000, h: 24 },
    { x: 140, y: H - 64, w: 60, h: 12 },
    { x: 320, y: H - 84, w: 60, h: 12 },
    { x: 470, y: H - 105, w: 40, h: 12 },
    // add more as you wish
  ];

  // Hazards (nurses, patients, carts, etc)
  let hazards = [
    { x: 240, y: H - 40, w: 20, h: 20, color: "#ff4136" },
    { x: 390, y: H - 96, w: 20, h: 20, color: "#e2bc1b" }
    // add more later
  ];

  // Camera
  let cameraX = 0;

  // Controls
  let moveLeft = false, moveRight = false, jump = false;

  function resetGame() {
    player.x = 50; player.y = H - 54;
    player.vx = 0; player.vy = 0; cameraX = 0;
  }
  // ------- CONTROLS (touch & mouse) -------
  // Touch events for buttons
  $("#leftBtn")
    .on("touchstart mousedown", function (e) { moveLeft = true; e.preventDefault(); })
    .on("touchend mouseup mouseleave", function (e) { moveLeft = false; e.preventDefault(); });
  $("#rightBtn")
    .on("touchstart mousedown", function (e) { moveRight = true; e.preventDefault(); })
    .on("touchend mouseup mouseleave", function (e) { moveRight = false; e.preventDefault(); });
  $("#jumpBtn")
    .on("touchstart mousedown", function (e) { jump = true; e.preventDefault(); })
    .on("touchend mouseup mouseleave", function (e) { jump = false; e.preventDefault(); });

  // Keyboard fallback
  $(document).on("keydown", e => {
    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
    if (e.key === " " || e.key === "ArrowUp") jump = true;
  });
  $(document).on("keyup", e => {
    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
    if (e.key === " " || e.key === "ArrowUp") jump = false;
  });

  $(function () {

  // Inject character options visually
  let list = $("#characterList");
  CHARACTERS.forEach((char, idx) => {
    let canvas = document.createElement("canvas");
    canvas.width = 40; canvas.height = 45;
    canvas.style.border = "2px solid #666";
    canvas.style.background = "#333";
    canvas.style.borderRadius = "8px";
    canvas.style.touchAction = "manipulation";
    canvas.style.margin = "0 4px";
    canvas.title = char.desc;

    // Draw preview
    char.draw(8, 5, canvas.getContext("2d"));

    // For accessibility:
    canvas.tabIndex = 0;
    // Selection highlight
    canvas.addEventListener('click', function () {
      selectedChar = idx;
      window.playerSpriteIndex = idx;
      for (let i = 0; i < list[0].children.length; i++) {
        list[0].children[i].style.borderColor = (i === idx) ? "#ffd700" : "#666";
        list[0].children[i].style.boxShadow = (i === idx) ? "0 0 8px #ffa" : "";
      }
      $("#startGameBtn").prop("disabled", false);
    });
    list.append(canvas);
  });

  $("#startGameBtn").on("click touchstart", function () {
    $("#characterSelect").hide();
    window.playerSpriteIndex = selectedChar;
    setTimeout(() => { resetGame(); }, 20);
  });

  // Make sure game does not start before selection:
  $(".game-container").hide();
  $("#characterSelect").show();

  $("#startGameBtn").on("click touchstart", function () {
    $(".game-container").show();
  });
});

  // ========== GAME LOOP ==========

  function update() {
    // Horizontal movement
    player.vx = 0;
    if (moveLeft) player.vx = -player.speed;
    if (moveRight) player.vx = player.speed;

    // Gravity
    player.vy += 0.5; // gravity

    // Jump
    if (jump && player.grounded) {
      player.vy = -player.jump_strength;
      player.grounded = false;
    }

    // Movement
    player.x += player.vx;
    player.y += player.vy;

    // Platform collision
    player.grounded = false;
    for (let plat of platforms) {
      // simple AABB collision
      if (
        player.x + player.w > plat.x &&
        player.x < plat.x + plat.w &&
        player.y + player.h > plat.y &&
        player.y + player.h - player.vy <= plat.y // was above before
      ) {
        player.y = plat.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }
    // Prevent falling below base
    if (player.y > H) resetGame();

    // Hazards collision
    for (let haz of hazards) {
      if (
        player.x + player.w > haz.x &&
        player.x < haz.x + haz.w &&
        player.y + player.h > haz.y &&
        player.y < haz.y + haz.h
      ) {
        // Player hit a hazard!
        resetGame();
        break;
      }
    }

    // Camera follows player
    cameraX = player.x - 50;
    if (cameraX < 0) cameraX = 0;
  }

  // Draw health/hud
  function drawHUD() {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.fillText("Avoid the hazards! Touch arrows to move, jump", 14 + cameraX, 18);
  }

  // Simple 8-bit styled figure for IT engineer
 function drawPlayer(px, py) {
  // Use function from selected character to render
  if (typeof window.playerSpriteIndex === "number" && CHARACTERS[window.playerSpriteIndex] && CHARACTERS[window.playerSpriteIndex].draw) {
    CHARACTERS[window.playerSpriteIndex].draw(px, py, ctx);
  }
}

  // Main draw
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Move camera by translation
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Draw platforms
    for (let plat of platforms) {
      ctx.fillStyle = "#396";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = "#264";
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    }

    // Draw hazards
    for (let haz of hazards) {
      ctx.fillStyle = haz.color;
      ctx.fillRect(haz.x, haz.y, haz.w, haz.h);
      // Smiley for "Nurse"
      ctx.fillStyle = "#fff";
      ctx.fillRect(haz.x + 2, haz.y + 2, haz.w - 4, haz.h - 4);
      ctx.fillStyle = "#000";
      ctx.fillRect(haz.x + 5, haz.y + 5, 2, 2);
      ctx.fillRect(haz.x + 11, haz.y + 5, 2, 2);
      ctx.fillRect(haz.x + 7, haz.y + 12, 4, 2);
    }

    // Draw player
    drawPlayer(player.x, player.y);

    // HUD
    drawHUD();

    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop(); // Start game
});