
function flipCard() {
  const card = document.getElementById("card");
 

  // Spamming messes it up so this locks it
  if (card.classList.contains("is-animating")) return;
  card.classList.add("is-animating");
  card.classList.add("fade-shadow");

  setTimeout(() => {card.classList.toggle("flipped");}, 180);

  setTimeout(() => {card.classList.remove("fade-shadow");}, 860);

  setTimeout(() => {card.classList.remove("is-animating");}, 1030);
}

/* ------ B2B BACKGROUND ANIMATION ------ */
// 
(() => {
  const canvas = document.getElementById("b2b-canvas");
  const ctx = canvas.getContext("2d", { alpha: true }); // Create draw context

  // ---------- CONSTANTS ----------
  const MAX_LOGO_COUNT = 50;
  const BASE_FONT_PX = 16;
  const SPEED_MIN = 60, SPEED_MAX = 140;
  const COLOR = "hsl(164, 73%, 30%)";
  const FONT_STACK = "Tomorrow, sans-serif";
  const FONT_WEIGHT = 800;

  // Interaction / feel
  const HOVER_PAD_PX      = 16;     // hitbox to trigger repel
  const KICK_SPEED        = 260;    // outward impulse on split 
  const ANCHOR_FREEZE_MS  = 2000;   // '2' keeps drifting this long, then stays still 
  const B_FREE_FLY_MS     = 3200;   // b's free-fly longer; attraction starts after this
  const B2B_FREE_FLY_MS   = 800;    // the amount of time b2b takes is allowed to float before split is invoked

  // Re-attach (quick but smooth)
  const ATTRACT_K    = 0.70;        // speed in which attraction ccurs
  const ATTRACT_DAMP = 0.98;        // damping (<=1 snappier, >1 heavier)
  const MERGE_POS_EPS = 1.0;        // px tolerance (scaled by DPR)
  const MERGE_VEL_EPS = 28;         // px/s tolerance (scaled by DPR)

  // ---------- VARIABLES FOR DEVICE PIXEL RESOLUTION AND CANVAS INFO ----------
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0, now = 0, last = 0;

  // measured sizes (canvas px)
  let fontPx = BASE_FONT_PX * dpr;
  let totalW = 0, textH = 0, wB = 0, w2 = 0;

  // sprites:
  // WHOLE: {mode:"WHOLE", x,y,w,h, vx,vy, sizePx}
  // SPLIT: {mode:"SPLIT", letters:[{char,x,y,w,h,vx,vy}], anchorFreezeAt, attractAfter, iL,i2,iR, resumeVx,resumeVy}
  const sprites = [];

  // Obstacles (navbar + card)
  const obstacles = [];
  const selNav  = () => document.querySelector("header");
  const selCard = () => document.getElementById("card");
  const selSideNav = () => document.querySelector(".side-bar--header");

  // ---------- HELPERS ----------
  const rand = (a,b)=>a+Math.random()*(b-a);
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  // Determine if px and py are inside given rectangle
  const pointInRect = (px,py,R) => (px>=R.x && px<=R.x+R.w && py>=R.y && py<=R.y+R.h);
  // Increase size of a rectangle by adding padding, helps w/ hitbox
  const inflate = (R, pad) => ({ x: R.x - pad, y: R.y - pad, w: R.w + pad*2, h: R.h + pad*2 });

  const setFontFor = (sizePx) => { 
    ctx.font = `${FONT_WEIGHT} ${sizePx}px ${FONT_STACK}`; 
    // Make x,y in resepect to top left of the text
    ctx.textBaseline = "top"; // y origin is at the top
    ctx.textAlign = "left";  // x origin is at the left
  }

  const measureHeight = (sizePx) => {
    setFontFor(sizePx);
    const m = ctx.measureText("b2b");
    return Math.ceil((m.actualBoundingBoxAscent ?? sizePx*0.8) + (m.actualBoundingBoxDescent ?? sizePx*0.2));
  }


  const measureWidths = (sizePx) => {
    setFontFor(sizePx);
    const wb1 = Math.ceil(ctx.measureText("b").width); // width of left b
    const w_2 = Math.ceil(ctx.measureText("2").width); // width of 2
    const wb2 = Math.ceil(ctx.measureText("b").width); // width of right b
    return { wb: wb1, w2: w_2, wb2, total: wb1 + w_2 + wb2 };
  }


  // Return rectangle for the element passed in
  const rectFor = (el) => { const r = el.getBoundingClientRect(); return { x:r.left*dpr, y:r.top*dpr, w:r.width*dpr, h:r.height*dpr }; }


  // Add obstacles to obstacles array
  const updateObstacles = () => {
    obstacles.length = 0;
    // Translate obstacles to their respective rectangle
    const nav = selNav(); if (nav) obstacles.push(rectFor(nav));
    const card = selCard(); if (card) obstacles.push(rectFor(card));
    const sideNav = selSideNav(); if(sideNav) obstacles.push(rectFor(sideNav));
  }


  const resize = () => {

    // Scale window width and height to device pixel ratio
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth * dpr);
    H = Math.floor(window.innerHeight * dpr);
    canvas.width = W; canvas.height = H;


    fontPx = BASE_FONT_PX * dpr;
    textH = measureHeight(fontPx);
    const ws = measureWidths(fontPx);
    wB = ws.wb; w2 = ws.w2; totalW = ws.total;

    for (const sp of sprites) {
      // for "b2b"
      if (sp.mode === "WHOLE") {
        sp.sizePx = fontPx; sp.w = totalW; sp.h = textH;
        sp.x = clamp(sp.x, 0, Math.max(0, W - sp.w));
        sp.y = clamp(sp.y, 0, Math.max(0, H - sp.h));
      } else {
        // For single b's and 2's
        for (const L of sp.letters) {
          L.w = (L.char === "2" ? w2 : wB);
          L.h = textH;
          L.x = clamp(L.x, 0, Math.max(0, W - L.w));
          L.y = clamp(L.y, 0, Math.max(0, H - L.h));
        }
      }
    }
    updateObstacles();
  }

  // Colliding with obstacles
  // A collider (text)
  // R collision (obastacles)
  const bounceAgainstRect = (A, R) => {
    // If they dont collide return 
    if (A.x + A.w <= R.x || A.x >= R.x + R.w || A.y + A.h <= R.y || A.y >= R.y + R.h) return;
    
    // How far A has overlapped into R
    const left   = (A.x + A.w) - R.x; // Calculate over lap on the left (A is moving right)
    const right  = (R.x + R.w) - A.x; // Calculate over lap on the right (A is moving left)
    const top    = (A.y + A.h) - R.y; // Calculate over lap on the top (A is moving up)
    const bottom = (R.y + R.h) - A.y; // Calculate over lap on the bottom (A is moving down)

    // if minX < minY -> horizontal collision
    // if minY < minx -> vertical collision
    const minX = Math.min(left, right), minY = Math.min(top, bottom); 
    if (minX < minY) {
      if (left < right) {  // Correct by moving to the left by left px
        A.x -= left;  
        if (A.vx > 0) A.vx = -A.vx;  // Invert velocity to move to the left
      } else {  // Correct by moving to the right
        A.x += right; 
        if (A.vx < 0) A.vx = -A.vx;  // Inver velocity to move to opposite direction
      }
    } else {
      if (top < bottom) { // Correct by moving it down
        A.y -= top;   
        if (A.vy > 0) A.vy = -A.vy; 
      } else {  // Correct by moving it up
        A.y += bottom;
        if (A.vy < 0) A.vy = -A.vy; 
      }
    }
  }

  // Handle collision with window screen
  const bounceAgainstBounds = (A) => {
    if (A.x < 0) { A.x = 0; A.vx = -A.vx; } // Collision with left screen
    if (A.x + A.w > W) { A.x = W - A.w; A.vx = -A.vx; }  // Collision with right screen
    if (A.y < 0) { A.y = 0; A.vy = -A.vy; } // Collision with top of screen
    if (A.y + A.h > H) { A.y = H - A.h; A.vy = -A.vy; } // Collision with bottom of screen
  }
  
  // Generate b2b logo
  const makeWholeSprite = (xPos = rand(0, Math.max(0, W - totalW)), yPos = rand(0, Math.max(0, H - textH))) => {
    const speed = rand(SPEED_MIN, SPEED_MAX) * dpr; // Scale speed w/ respect to dpr
    const angle = rand(0, Math.PI * 2); // Generate random angle in a circular direction
    return {
      mode:"WHOLE",
      x: xPos,
      y: yPos,
      w: totalW, h: textH,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      sizePx: fontPx,
      timeGenerated: performance.now(),
    };
  }

  // Generate a cluster of b2b logos around the current mouse coordinates
  const generateCluster = () => {

    const mouseX = mouse.x, mouseY = mouse.y;
    if(mouseX == null || mouseY == null) return;

    const cardRect = rectFor(selCard());
    const navRect = rectFor(selNav());
    if(pointInRect(mouseX, mouseY, cardRect) || pointInRect(mouseX, mouseY, navRect)) return; // If user presses on form card
    
    const numLogosInCluster = rand(1, 5);
    // If number of sprites has been exceeded, remove the first numLogosInCounter sprites
    console.log("Number of elements: " + sprites.length);
    if(sprites.length > MAX_LOGO_COUNT) sprites.splice(0, numLogosInCluster);
    for(let i = 0; i < numLogosInCluster; ++i) sprites.push(makeWholeSprite(mouseX, mouseY));

    
  }

  // ----- SPLITTING, ATTRACTING, MERGING -----
  const splitSprite = (sp) => {
    if (sp.mode === "SPLIT") return; // If already split return out
    sp.mode = "SPLIT";

    // Freeze the 2 character, let B's drift around
    const nowMs = performance.now();
    sp.anchorFreezeAt = nowMs + ANCHOR_FREEZE_MS;
    sp.attractAfter   = nowMs + B_FREE_FLY_MS;

    // Store velocity to continue same drifting velocity before "b2b" got split up
    sp.resumeVx = sp.vx; sp.resumeVy = sp.vy; 

    const startX = sp.x, startY = sp.y;
    const letters = [
      { char:"B", x: startX,           y: startY,           w: wB, h: textH, vx: sp.vx, vy: sp.vy },
      { char:"2", x: startX + wB,      y: startY,           w: w2, h: textH, vx: sp.vx, vy: sp.vy }, // 2 drifts first
      { char:"B", x: startX + wB + w2, y: startY,           w: wB, h: textH, vx: sp.vx, vy: sp.vy },
    ];

    // Outward kick to b's only
    const cx = startX + totalW/2, cy = startY + textH/2;
    const kick = KICK_SPEED * dpr;
    for (const L of letters) {
      if (L.char === "2") continue;

      const lcX = L.x + L.w/2, lcY = L.y + L.h/2;
      let dx = lcX - cx, dy = lcY - cy;
      let len = Math.hypot(dx, dy);
      if (len < 1e-3) { const ang = rand(0, Math.PI*2); dx = Math.cos(ang); dy = Math.sin(ang); len = 1; }
      L.vx += (dx/len) * kick;
      L.vy += (dy/len) * kick;
    }

    sp.letters = letters;
    sp.iL = 0; sp.i2 = 1; sp.iR = 2; // Indexes for letter

    // Remove WHOLE geometry
    delete sp.x; delete sp.y; delete sp.w; delete sp.h; delete sp.vx; delete sp.vy; delete sp.sizePx;
  }

  // pull b's toward the (possibly frozen) '2'
  const attractLetters = (sp, dt) => {
    const L2 = sp.letters[sp.i2];
    const L  = sp.letters[sp.iL];
    const R  = sp.letters[sp.iR];

    const targetLx = L2.x - wB, targetLy = L2.y;
    const targetRx = L2.x + w2, targetRy = L2.y;

    // left spring
    let dx = targetLx - L.x, dy = targetLy - L.y;
    L.vx += (ATTRACT_K * dx - ATTRACT_DAMP * L.vx) * dt;
    L.vy += (ATTRACT_K * dy - ATTRACT_DAMP * L.vy) * dt;

    // right spring
    dx = targetRx - R.x; dy = targetRy - R.y;
    R.vx += (ATTRACT_K * dx - ATTRACT_DAMP * R.vx) * dt;
    R.vy += (ATTRACT_K * dy - ATTRACT_DAMP * R.vy) * dt;
  }


  const tryMerge = (sp) => {
    // Retrive singular letters
    const L2 = sp.letters[sp.i2];
    const L  = sp.letters[sp.iL];
    const R  = sp.letters[sp.iR];

    // How close letter has to be to be considered "merged"
    const posTol = MERGE_POS_EPS * dpr; 
    // How slow a letter has to be to be considered "merged"
    // Prevents from "snapping" into place
    const velTol = MERGE_VEL_EPS * dpr;


    // Chek for valid alignment
    const alignedLeftBX = Math.abs(L.x - (L2.x - wB)) < posTol;
    const alignedLeftBY = Math.abs(L.y - L2.y) < posTol;
    const alignedLeftBVel = Math.hypot(L.vx, L.vy) < velTol; // Compare total velocity vector to velocityTolerance
    const alignedL = alignedLeftBX && alignedLeftBY && alignedLeftBVel;

    const alignedRightBX =  Math.abs(R.x - (L2.x + w2)) < posTol;
    const alignedRightBY = Math.abs(R.y - L2.y) < posTol;
    const alignedRightBVel = Math.hypot(R.vx, R.vy) < velTol;
    const alignedR = alignedRightBX &&  alignedRightBY && alignedRightBVel;

    if (!(alignedL && alignedR)) return false;

    // Initialize x,y position for the whole b2b
    const newX = clamp(L2.x - wB, 0, Math.max(0, W - totalW));
    const newY = clamp(L2.y,       0, Math.max(0, H - textH));

    sp.mode = "WHOLE";
    sp.x = newX; sp.y = newY; sp.w = totalW; sp.h = textH;

    // Resume pre-split velocity (so the word keeps floating)
    const rvx = sp.resumeVx ?? 0, rvy = sp.resumeVy ?? 0;
    sp.vx = rvx; sp.vy = rvy;

    sp.sizePx = fontPx;

    // Delete value of properties, no need to save 
    delete sp.letters; delete sp.iL; delete sp.i2; delete sp.iR; delete sp.resumeVx; delete sp.resumeVy;
    return true;
  }

  // ---------- INITIALIZE SCREEN ----------
  const init = () => {
    resize(); // setup canvas

    // Generate 1 sprite
    sprites.length = 0;
    for(let i = 0; i < 5; ++i) sprites.push(makeWholeSprite()); 
    

    window.addEventListener("resize", resize);

    // Add the flipped card to the obstacles array
    const cardEl = selCard(); if (cardEl) cardEl.addEventListener("transitionend", updateObstacles);
    const sideNavEl = selSideNav(); if(sideNavEl) sideNavEl.addEventListener("transitionend", updateObstacles);
  }
  init();


  // Initialize mouse object for hover effect
  const mouse = { x: null, y: null, inside: false };
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; mouse.inside = true; });
  window.addEventListener("mouseleave", () => { mouse.x = mouse.y = null; mouse.inside = false; });
  window.addEventListener("click", generateCluster);

  // ---------- LOOP ----------
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLOR;
    ctx.textBaseline = "top";
    ctx.textAlign   = "left";

    // Draw all the sprites in the array
    for (const sp of sprites) {
      // If whole draw "b2b"
      if (sp.mode === "WHOLE") {
        ctx.font = `${FONT_WEIGHT} ${sp.sizePx}px ${FONT_STACK}`;
        ctx.fillText("B2B", sp.x, sp.y);
      } else { // If not whole draw individual letters
        ctx.font = `${FONT_WEIGHT} ${fontPx}px ${FONT_STACK}`;
        for (const L of sp.letters) ctx.fillText(L.char, L.x, L.y);
      }
    }
  }


  const bounceAllAgainst = (A) => {
    // Bounce against window screen bounds if needed
    bounceAgainstBounds(A);

    // Bounce against all possible obstacles if needed
    for (const R of obstacles) bounceAgainstRect(A, R);
  }


  const step = (t) => {
    now = t;
    const dt = Math.min((t - last) / 1000, 0.033); // Elpased time per frame
    last = t;


    for (const sp of sprites) {
      if (sp.mode === "WHOLE") {
        
        // Determine if mouse is over a logo
        const timeNow = performance.now();
        if (mouse.x != null 
            && timeNow > sp.timeGenerated + B2B_FREE_FLY_MS
            && pointInRect(mouse.x, mouse.y, inflate(sp, HOVER_PAD_PX * dpr))) {
          splitSprite(sp);
        }

        // Move in a straight line motion
        // x(t) = vx * t
        // y(t) = vy * t
        sp.x += sp.vx * dt; 
        sp.y += sp.vy * dt;
        bounceAllAgainst(sp);

      } else {

        const timeNow = performance.now();

        // keep '2' drifting until freeze moment
        const L2 = sp.letters[sp.i2];
        if (timeNow < sp.anchorFreezeAt) {
          L2.x += L2.vx * dt; 
          L2.y += L2.vy * dt;
          bounceAllAgainst(L2); // Handle collisions
        } else {
          // Freeze the movement of L2
          L2.vx = 0; L2.vy = 0;
          // still ensure it's not overlapping something (push out if so)
          bounceAllAgainst(L2);
        }

        // Extend the tiemr if mouse continues to hover over a letter
        if (mouse.x != null) {
          const pad = HOVER_PAD_PX * dpr;
          const hovered = sp.letters.some(L => pointInRect(mouse.x, mouse.y, inflate(L, pad)));
          if (hovered) {
            sp.anchorFreezeAt = timeNow + ANCHOR_FREEZE_MS;
            sp.attractAfter   = timeNow + B_FREE_FLY_MS;
          }
        }

        // After b's free-flight window, start attraction to the (possibly frozen) '2'
        const doAttract = timeNow > sp.attractAfter;
        if (doAttract) attractLetters(sp, dt);

        // animate the b's drfiting and colliding animation
        for (const L of [sp.letters[sp.iL], sp.letters[sp.iR]]) {
          L.x += L.vx * dt; L.y += L.vy * dt;
          bounceAllAgainst(L);
        }

        // Merge as soon as aligned; resume floating
        if (doAttract) tryMerge(sp);
      }
    }

    draw(); // Clear and redraw everything in new position
    requestAnimationFrame(step); // Recursively call the function over again
  }
  requestAnimationFrame(step);
})();


