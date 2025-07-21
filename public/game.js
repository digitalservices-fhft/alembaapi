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

  // Simple 8-bit styled figure for IT engineer (blue body, white head, yellow tie)
  function drawPlayer(px, py) {
    // body
    ctx.fillStyle = player.color;
    ctx.fillRect(px, py + 10, 24, 18);
    // head
    ctx.fillStyle = "#fff";
    ctx.fillRect(px + 4, py, 16, 13);
    // tie
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(px + 11, py + 17, 3, 7);
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