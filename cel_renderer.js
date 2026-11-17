/**
 * MULBERRY BUSH (1976 -> 2026)
 * Hand-Made 16mm Cel & Rotoscope Animation Engine (HTML5 Canvas)
 */

class MulberryCelRenderer {
  constructor(canvas, videoElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.video = videoElement;

    this.width = 720;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Load extracted 1976 paper textures and hand-lettered credit cels
    this.assets = {
      paperMulberry: this.loadImage("assets/paper_mulberry.jpg"),
      paperViolet: this.loadImage("assets/paper_violet.jpg"),
      creditTitle: this.loadImage("assets/credit_title.png"),
      creditAuthor: this.loadImage("assets/credit_author.png"),
      creditMusic: this.loadImage("assets/credit_music.png"),
      creditThanks: this.loadImage("assets/credit_thanks.png"),
    };

    // Offscreen buffer for multi-cel onion-skin ghosting
    this.ghostBuffers = [0, 1, 2].map(() => {
      const c = document.createElement("canvas");
      c.width = this.width;
      c.height = this.height;
      return c;
    });
    this.lastGhostFrame12 = -1;

    // Offscreen canvas for hybrid video keying
    this.videoBuf = document.createElement("canvas");
    this.videoBuf.width = this.width;
    this.videoBuf.height = this.height;
    this.videoBufCtx = this.videoBuf.getContext("2d");

    // 4 Rotoscoped Dancers from the 1976 film
    this.dancers = [
      {
        id: "ken",
        name: "Ken",
        gender: "m",
        baseAngle: 0,
        shirtColor: "#5e141c",
        pantsColor: "#c59e94",
        hairColor: "#191216",
        skinColor: "#b87a6c",
        hatchColors: ["#3b161d", "#1b141a", "#781e22"],
        stickerBottom: "#1d1d22",
        stickerFeet: "#5c7228",
        hasBeard: true,
        hasPonytail: true,
      },
      {
        id: "fannie",
        name: "Fannie",
        gender: "f",
        baseAngle: Math.PI * 0.5,
        vestColor: "#3d121a",
        sleeveColor: "#8b72a6",
        skirtColor: "#171622",
        legColor: "#26233a",
        hairColor: "#18141c",
        skinColor: "#be8276",
        hatchColors: ["#221722", "#3d1620", "#18141e"],
        stickerBottom: "#1d2445",
        stickerFeet: "#c88a22",
      },
      {
        id: "dave",
        name: "Dave",
        gender: "m",
        baseAngle: Math.PI,
        shirtColor: "#27171d",
        pantsColor: "#1e1d28",
        hairColor: "#181216",
        skinColor: "#b27468",
        hatchColors: ["#1e161e", "#4a1b20", "#281c26"],
        stickerBottom: "#1c2342",
        stickerFeet: "#c88a22",
        hasBeard: true,
        hasPonytail: false,
      },
      {
        id: "cathy",
        name: "Cathy",
        gender: "f",
        baseAngle: Math.PI * 1.5,
        vestColor: "#b8281c",
        sleeveColor: "#b8281c",
        skirtColor: "#18161f",
        legColor: "#b4786c",
        hairColor: "#1a141b",
        skinColor: "#be8276",
        hatchColors: ["#801d1e", "#1e1620", "#3a161e"],
        stickerBottom: "#1d1d22",
        stickerFeet: "#5a7028",
      },
    ];

    // Physics particles for the 01:53 Dot Pile Collapse!
    this.dotParticles = [];
    this.wasCollapsing = false;

    // Interactive user-stamped cel marks on the 3D ring
    this.userStamps = [];

    // Options / Interactive overrides
    this.showMulberryBush = false;
    this.paperTint = "auto"; // 'auto' | 'mulberry' | 'violet' | 'parchment'
    this.ringSpeed = 1.0;
    this.hybridMix = 0.55;
    this.splitScreen = false;
    this.manualGiantSweepTime = -10;
    this.manualPeekTime = -10;
    this.manualCollapseActive = false;
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  // Deterministic 12fps hand-drawn boil jitter
  boil(val, seed, frame12, amp = 1.8) {
    const h = Math.sin(seed * 127.1 + frame12 * 311.7) * 43758.5453;
    const frac = h - Math.floor(h);
    return val + (frac - 0.5) * 2.0 * amp;
  }

  addUserStamp(normX, normY, tool, ringPhase) {
    // Convert canvas (normX, normY) into an angle around the ring + vertical offset
    const angle = Math.asin(Math.max(-0.95, Math.min(0.95, (normX - 0.5) * 2.1))) - ringPhase;
    const colors = ["#921a1e", "#1d2445", "#c88a22", "#5a7028", "#1c1b21"];
    this.userStamps.push({
      angle,
      normY: Math.max(0.16, Math.min(0.84, normY)),
      tool,
      color: colors[this.userStamps.length % colors.length],
      seed: Math.random() * 100,
    });
    if (this.userStamps.length > 90) {
      this.userStamps.shift();
    }
  }

  clearUserStamps() {
    this.userStamps = [];
  }

  /**
   * Computes articulated 2D pose joints & garment polygons for a dancer at a given phase
   */
  computeDancerPose(dancer, cx, footY, scale, stepPhase, dir, holdHands, frame12, idx) {
    const h = 305 * scale; // Base figure height in pixels
    const skipBob = Math.abs(Math.sin(stepPhase * 2)) * 18 * scale;
    const baseFootY = footY - skipBob;
    const hipY = baseFootY - h * 0.46;
    const waistY = baseFootY - h * 0.54;
    const shoulderY = baseFootY - h * 0.80;
    const headY = baseFootY - h * 0.91;

    const lean = dir * 8 * scale;
    const torsoX = cx + lean * 0.5;
    const headX = cx + lean * 0.85;

    // Skipping legs (6/8 step-hop cycle)
    const stride = Math.sin(stepPhase) * 34 * scale;
    const liftL = Math.max(0, Math.cos(stepPhase)) * 26 * scale;
    const liftR = Math.max(0, -Math.cos(stepPhase)) * 26 * scale;

    const kneeLX = cx - stride * 0.55 + dir * 10 * scale;
    const kneeLY = (hipY + baseFootY) * 0.5 - liftL * 0.65;
    const footLX = cx - stride - dir * 5 * scale;
    const footLY = baseFootY - liftL;

    const kneeRX = cx + stride * 0.55 + dir * 10 * scale;
    const kneeRY = (hipY + baseFootY) * 0.5 - liftR * 0.65;
    const footRX = cx + stride - dir * 5 * scale;
    const footRY = baseFootY - liftR;

    // Outstretched arms (holding hands in ring or balancing while skipping)
    const armSwing = Math.cos(stepPhase) * 10 * scale;
    const armSpan = (holdHands ? 92 : 76) * scale;
    const handLY = shoulderY + (holdHands ? 18 : 8) * scale + armSwing;
    const handRY = shoulderY + (holdHands ? 18 : 8) * scale - armSwing;
    const elbowLX = torsoX - armSpan * 0.52;
    const elbowLY = shoulderY + 16 * scale + armSwing * 0.5;
    const handLX = torsoX - armSpan;

    const elbowRX = torsoX + armSpan * 0.52;
    const elbowRY = shoulderY + 16 * scale - armSwing * 0.5;
    const handRX = torsoX + armSpan;

    return {
      dancer,
      cx,
      footY: baseFootY,
      scale,
      dir,
      frame12,
      idx,
      h,
      headX,
      headY,
      headR: 21 * scale,
      shoulderY,
      waistY,
      hipY,
      torsoX,
      shoulderW: (dancer.gender === "m" ? 26 : 21) * scale,
      waistW: (dancer.gender === "m" ? 20 : 16) * scale,
      hipW: (dancer.gender === "m" ? 22 : 24) * scale,
      skirtHemW: 54 * scale + Math.sin(stepPhase * 2 + idx) * 7 * scale,
      skirtHemY: baseFootY - h * 0.17,
      kneeLX,
      kneeLY,
      footLX,
      footLY,
      kneeRX,
      kneeRY,
      footRX,
      footRY,
      elbowLX,
      elbowLY,
      handLX,
      handLY,
      elbowRX,
      elbowRY,
      handRX,
      handRY,
    };
  }

  /**
   * Draws a hand-boiled polygon with optional directional felt-marker strokes
   */
  drawBoiledPolygon(ctx, pts, frame12, seed, fillStyle, strokeStyle, lineWidth = 2.4, markerTexture = false) {
    if (pts.length < 3) return;
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => {
      const bx = this.boil(p[0], seed + i * 3.1, frame12, 1.6);
      const by = this.boil(p[1], seed + i * 7.3, frame12, 1.6);
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    });
    ctx.closePath();

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();

      if (markerTexture) {
        // Add authentic 1976 streaky felt-tip marker texture inside clip
        ctx.save();
        ctx.clip();
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "#120c10";
        ctx.lineWidth = 3.5;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of pts) {
          if (p[0] < minX) minX = p[0];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[1] > maxY) maxY = p[1];
        }
        for (let x = minX - 10; x <= maxX + 10; x += 9) {
          ctx.beginPath();
          ctx.moveTo(this.boil(x, seed + x, frame12, 1.5), minY - 5);
          ctx.lineTo(this.boil(x + 4, seed + x * 2, frame12, 1.5), maxY + 5);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Helper: Builds limb quad points around a 2-segment bone (A -> B -> C)
   */
  buildLimbPoly(ax, ay, bx, by, cx, cy, wTop, wMid, wBot) {
    const perp = (x1, y1, x2, y2, w) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      return [(-dy / len) * w, (dx / len) * w];
    };
    const [nx1, ny1] = perp(ax, ay, bx, by, wTop);
    const [nx2, ny2] = perp(ax, ay, cx, cy, wMid);
    const [nx3, ny3] = perp(bx, by, cx, cy, wBot);

    return [
      [ax + nx1, ay + ny1],
      [bx + nx2, by + ny2],
      [cx + nx3, cy + ny3],
      [cx - nx3, cy - ny3],
      [bx - nx2, by - ny2],
      [ax - nx1, ay - ny1],
    ];
  }

  /**
   * STYLE 1 & 2 & 3: Renders a Dancer in Colored Felt-Marker Rotoscope, Solid Black Silhouette, or Giant Crimson/Charcoal Wash
   */
  renderDancerSolidOrColored(ctx, pose, mode = "colored", alpha = 1.0) {
    const { dancer, scale, dir, frame12, idx } = pose;
    const seed = idx * 100;

    ctx.save();
    ctx.globalAlpha = alpha;

    const isSilhouette = mode === "silhouette";
    const isGiantRed = mode === "giant_red";
    const isCharcoal = mode === "charcoal";

    const silColor = isGiantRed
      ? dancer.gender === "f" && idx === 1
        ? "#241d29"
        : "#68111a"
      : "#171218";
    const outlineColor = isSilhouette || isGiantRed || isCharcoal ? null : "#161015";
    const lw = Math.max(1.6, 2.5 * scale);

    // 1. Left & Right Arms
    const armWTop = 9 * scale;
    const armWMid = 7.5 * scale;
    const armWBot = 5.5 * scale;
    const leftArmPoly = this.buildLimbPoly(
      pose.torsoX - pose.shoulderW * 0.75,
      pose.shoulderY + 5 * scale,
      pose.elbowLX,
      pose.elbowLY,
      pose.handLX,
      pose.handLY,
      armWTop,
      armWMid,
      armWBot
    );
    const rightArmPoly = this.buildLimbPoly(
      pose.torsoX + pose.shoulderW * 0.75,
      pose.shoulderY + 5 * scale,
      pose.elbowRX,
      pose.elbowRY,
      pose.handRX,
      pose.handRY,
      armWTop,
      armWMid,
      armWBot
    );

    const armFill =
      isSilhouette || isGiantRed || isCharcoal
        ? silColor
        : dancer.gender === "f" && dancer.id === "fannie"
        ? dancer.sleeveColor
        : dancer.skinColor;

    this.drawBoiledPolygon(ctx, leftArmPoly, frame12, seed + 10, armFill, outlineColor, lw, !isSilhouette);
    this.drawBoiledPolygon(ctx, rightArmPoly, frame12, seed + 20, armFill, outlineColor, lw, !isSilhouette);

    // 2. Legs & Boots/Shoes
    const legWTop = (dancer.gender === "m" ? 15 : 10) * scale;
    const legWMid = (dancer.gender === "m" ? 13 : 8) * scale;
    const legWBot = (dancer.gender === "m" ? 14 : 6.5) * scale; // Flared 1976 trousers for men!

    const leftLegPoly = this.buildLimbPoly(
      pose.torsoX - pose.hipW * 0.45,
      pose.hipY,
      pose.kneeLX,
      pose.kneeLY,
      pose.footLX,
      pose.footLY,
      legWTop,
      legWMid,
      legWBot
    );
    const rightLegPoly = this.buildLimbPoly(
      pose.torsoX + pose.hipW * 0.45,
      pose.hipY,
      pose.kneeRX,
      pose.kneeRY,
      pose.footRX,
      pose.footRY,
      legWTop,
      legWMid,
      legWBot
    );

    const legFill =
      isSilhouette || isGiantRed || isCharcoal
        ? silColor
        : dancer.gender === "m"
        ? dancer.pantsColor
        : dancer.legColor;

    this.drawBoiledPolygon(ctx, leftLegPoly, frame12, seed + 30, legFill, outlineColor, lw, !isSilhouette);
    this.drawBoiledPolygon(ctx, rightLegPoly, frame12, seed + 40, legFill, outlineColor, lw, !isSilhouette);

    // Shoes / Boots
    for (const [fx, fy, sOff] of [
      [pose.footLX, pose.footLY, 50],
      [pose.footRX, pose.footRY, 60],
    ]) {
      const shoePoly = [
        [fx - 8 * scale, fy - 4 * scale],
        [fx + dir * 16 * scale, fy - 2 * scale],
        [fx + dir * 15 * scale, fy + 6 * scale],
        [fx - 9 * scale, fy + 6 * scale],
      ];
      this.drawBoiledPolygon(
        ctx,
        shoePoly,
        frame12,
        seed + sOff,
        isSilhouette || isGiantRed || isCharcoal ? silColor : "#181318",
        outlineColor,
        lw * 0.8
      );
    }

    // 3. Skirt (for women) or Hip/Pelvis block (for men)
    if (dancer.gender === "f") {
      const skirtPoly = [
        [pose.torsoX - pose.waistW, pose.waistY],
        [pose.torsoX + pose.waistW, pose.waistY],
        [pose.torsoX + pose.skirtHemW * 0.95, pose.skirtHemY],
        [pose.torsoX + pose.skirtHemW * 0.35, pose.skirtHemY + 7 * scale],
        [pose.torsoX - pose.skirtHemW * 0.35, pose.skirtHemY + 6 * scale],
        [pose.torsoX - pose.skirtHemW * 0.95, pose.skirtHemY],
      ];
      const skirtFill = isSilhouette || isGiantRed || isCharcoal ? silColor : dancer.skirtColor;
      this.drawBoiledPolygon(ctx, skirtPoly, frame12, seed + 70, skirtFill, outlineColor, lw, !isSilhouette);
    } else {
      const pelvisPoly = [
        [pose.torsoX - pose.waistW, pose.waistY],
        [pose.torsoX + pose.waistW, pose.waistY],
        [pose.torsoX + pose.hipW, pose.hipY + 12 * scale],
        [pose.torsoX - pose.hipW, pose.hipY + 12 * scale],
      ];
      const pFill = isSilhouette || isGiantRed || isCharcoal ? silColor : dancer.pantsColor;
      this.drawBoiledPolygon(ctx, pelvisPoly, frame12, seed + 70, pFill, outlineColor, lw, !isSilhouette);
    }

    // 4. Torso / Shirt / Vest
    const torsoPoly = [
      [pose.torsoX - pose.shoulderW, pose.shoulderY],
      [pose.torsoX + pose.shoulderW, pose.shoulderY],
      [pose.torsoX + pose.waistW, pose.waistY + 4 * scale],
      [pose.torsoX - pose.waistW, pose.waistY + 4 * scale],
    ];
    const torsoFill =
      isSilhouette || isGiantRed || isCharcoal
        ? silColor
        : dancer.gender === "m"
        ? dancer.shirtColor
        : dancer.vestColor;
    this.drawBoiledPolygon(ctx, torsoPoly, frame12, seed + 80, torsoFill, outlineColor, lw, !isSilhouette);

    // 5. Head, Hair, Ponytail & Beard
    const headPts = [];
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      headPts.push([
        pose.headX + Math.cos(ang) * pose.headR * 0.88,
        pose.headY + Math.sin(ang) * pose.headR * 1.05,
      ]);
    }
    const faceFill = isSilhouette || isGiantRed || isCharcoal ? silColor : dancer.skinColor;
    this.drawBoiledPolygon(ctx, headPts, frame12, seed + 90, faceFill, outlineColor, lw);

    // Hair & Beard silhouette cap
    const hairColor = isSilhouette || isGiantRed || isCharcoal ? silColor : dancer.hairColor;
    const hairPoly = [
      [pose.headX - dir * pose.headR * 1.1, pose.headY + pose.headR * 0.5],
      [pose.headX - dir * pose.headR * 1.15, pose.headY - pose.headR * 0.8],
      [pose.headX, pose.headY - pose.headR * 1.18],
      [pose.headX + dir * pose.headR * 0.95, pose.headY - pose.headR * 0.65],
      [pose.headX + dir * pose.headR * 0.3, pose.headY - pose.headR * 0.2],
      [pose.headX - dir * pose.headR * 0.4, pose.headY + pose.headR * 0.7],
    ];
    this.drawBoiledPolygon(ctx, hairPoly, frame12, seed + 95, hairColor, outlineColor, lw * 0.8);

    if (dancer.hasPonytail) {
      const ptPoly = [
        [pose.headX - dir * pose.headR * 0.95, pose.headY + 2 * scale],
        [pose.headX - dir * pose.headR * 1.85, pose.headY + 7 * scale],
        [pose.headX - dir * pose.headR * 1.65, pose.headY + 16 * scale],
        [pose.headX - dir * pose.headR * 0.8, pose.headY + 9 * scale],
      ];
      this.drawBoiledPolygon(ctx, ptPoly, frame12, seed + 97, hairColor, outlineColor, lw * 0.7);
    }

    if (dancer.hasBeard) {
      const beardPoly = [
        [pose.headX + dir * pose.headR * 0.85, pose.headY + 2 * scale],
        [pose.headX + dir * pose.headR * 0.95, pose.headY + pose.headR * 1.15],
        [pose.headX - dir * pose.headR * 0.25, pose.headY + pose.headR * 1.2],
        [pose.headX - dir * pose.headR * 0.2, pose.headY + 4 * scale],
      ];
      this.drawBoiledPolygon(ctx, beardPoly, frame12, seed + 99, hairColor, outlineColor, lw * 0.7);
    }

    ctx.restore();
  }

  /**
   * STYLE 4: Parallel Contour Hatching Stripes (Horizontal marker dashes for men + curly hair/beard;
   * vertical/pleated skirt & bodice stripes + zigzag arms for women!)
   */
  renderDancerHatching(ctx, pose, alpha = 1.0) {
    const { dancer, scale, frame12, idx } = pose;
    const seed = idx * 200;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const colors = dancer.hatchColors;
    const spacing = Math.max(5.5, 7.8 * scale);
    ctx.lineWidth = Math.max(1.8, 2.4 * scale);

    // 1. Curly scribble hair & beard loops (exact 1976 look from t=70s, 74s!)
    ctx.strokeStyle = colors[0];
    ctx.beginPath();
    for (let c = 0; c < 14; c++) {
      const ang = (c / 14) * Math.PI * 2;
      const rx = pose.headX + Math.cos(ang) * pose.headR * 0.75;
      const ry = pose.headY + Math.sin(ang) * pose.headR * 0.85;
      const rLoop = 5.5 * scale;
      ctx.moveTo(
        this.boil(rx + rLoop, seed + c, frame12, 1.5),
        this.boil(ry, seed + c + 50, frame12, 1.5)
      );
      ctx.arc(
        this.boil(rx, seed + c, frame12, 1.5),
        this.boil(ry, seed + c + 50, frame12, 1.5),
        rLoop,
        0,
        Math.PI * 1.7
      );
    }
    ctx.stroke();

    if (dancer.gender === "m") {
      // MEN (Ken & Dave): Parallel HORIZONTAL marker dashes down torso and legs!
      let dashIdx = 0;
      // Torso horizontal stripes
      for (let y = pose.shoulderY; y <= pose.hipY + 8 * scale; y += spacing) {
        const frac = (y - pose.shoulderY) / Math.max(1, pose.hipY - pose.shoulderY);
        const halfW = pose.shoulderW * (1 - frac * 0.2);
        ctx.strokeStyle = colors[dashIdx % colors.length];
        ctx.beginPath();
        ctx.moveTo(
          this.boil(pose.torsoX - halfW, seed + dashIdx, frame12, 2.0),
          this.boil(y, seed + dashIdx * 2, frame12, 1.2)
        );
        ctx.lineTo(
          this.boil(pose.torsoX + halfW, seed + dashIdx * 3, frame12, 2.0),
          this.boil(y, seed + dashIdx * 4, frame12, 1.2)
        );
        ctx.stroke();
        dashIdx++;
      }

      // Left & Right Legs horizontal stripes
      const drawHorizLimbStripes = (ax, ay, bx, by, cx, cy, halfW, sOff) => {
        const steps = Math.max(5, Math.floor((Math.hypot(bx - ax, by - ay) + Math.hypot(cx - bx, cy - by)) / spacing));
        for (let i = 1; i <= steps; i++) {
          const u = i / steps;
          const px = u < 0.5 ? ax + (bx - ax) * (u * 2) : bx + (cx - bx) * ((u - 0.5) * 2);
          const py = u < 0.5 ? ay + (by - ay) * (u * 2) : by + (cy - by) * ((u - 0.5) * 2);
          ctx.strokeStyle = colors[(i + sOff) % colors.length];
          ctx.beginPath();
          ctx.moveTo(this.boil(px - halfW, seed + i + sOff, frame12, 1.8), this.boil(py, seed + i * 2 + sOff, frame12, 1.2));
          ctx.lineTo(this.boil(px + halfW, seed + i * 3 + sOff, frame12, 1.8), this.boil(py, seed + i * 4 + sOff, frame12, 1.2));
          ctx.stroke();
        }
        // Vertical toe tick-marks at foot!
        for (let t = -2; t <= 2; t++) {
          ctx.beginPath();
          const tx = cx + t * 4.5 * scale;
          ctx.moveTo(tx, cy - 3 * scale);
          ctx.lineTo(tx, cy + 5 * scale);
          ctx.stroke();
        }
      };

      drawHorizLimbStripes(pose.torsoX - pose.hipW * 0.45, pose.hipY, pose.kneeLX, pose.kneeLY, pose.footLX, pose.footLY, 13 * scale, 10);
      drawHorizLimbStripes(pose.torsoX + pose.hipW * 0.45, pose.hipY, pose.kneeRX, pose.kneeRY, pose.footRX, pose.footRY, 13 * scale, 30);

      // Arms: horizontal dashes on upper arm + wavy scribble on forearm
      for (const [sx, sy, ex, ey, hx, hy, aOff] of [
        [pose.torsoX - pose.shoulderW * 0.8, pose.shoulderY + 4 * scale, pose.elbowLX, pose.elbowLY, pose.handLX, pose.handLY, 50],
        [pose.torsoX + pose.shoulderW * 0.8, pose.shoulderY + 4 * scale, pose.elbowRX, pose.elbowRY, pose.handRX, pose.handRY, 70],
      ]) {
        ctx.strokeStyle = colors[2];
        ctx.beginPath();
        const segs = 10;
        for (let s = 0; s <= segs; s++) {
          const u = s / segs;
          const ax = u < 0.5 ? sx + (ex - sx) * (u * 2) : ex + (hx - ex) * ((u - 0.5) * 2);
          const ay = u < 0.5 ? sy + (ey - sy) * (u * 2) : ey + (hy - ey) * ((u - 0.5) * 2);
          const zig = (s % 2 === 0 ? 1 : -1) * 5.5 * scale;
          if (s === 0) ctx.moveTo(ax, ay + zig);
          else ctx.lineTo(this.boil(ax, seed + s + aOff, frame12, 1.4), this.boil(ay + zig, seed + s * 2 + aOff, frame12, 1.4));
        }
        ctx.stroke();
      }
    } else {
      // WOMEN (Fannie & Cathy): Vertical bodice stripes + Fanning radial skirt pleats + vertical leg lines + zigzag arms!
      ctx.strokeStyle = colors[0];
      // Vertical bodice stripes
      const nBodice = 6;
      for (let i = 0; i < nBodice; i++) {
        const u = (i / (nBodice - 1)) * 2 - 1;
        const xTop = pose.torsoX + u * pose.shoulderW * 0.85;
        const xBot = pose.torsoX + u * pose.waistW * 0.85;
        ctx.beginPath();
        ctx.moveTo(this.boil(xTop, seed + i, frame12, 1.5), this.boil(pose.shoulderY, seed + i + 10, frame12, 1.5));
        ctx.lineTo(this.boil(xBot, seed + i + 20, frame12, 1.5), this.boil(pose.waistY, seed + i + 30, frame12, 1.5));
        ctx.stroke();
      }
      // Two horizontal waist belt lines
      for (const wy of [pose.waistY - 2 * scale, pose.waistY + 3 * scale]) {
        ctx.beginPath();
        ctx.moveTo(pose.torsoX - pose.waistW, wy);
        ctx.lineTo(pose.torsoX + pose.waistW, wy);
        ctx.stroke();
      }
      // Fanning pleated skirt lines (9 radial lines!)
      const nPleats = 9;
      for (let i = 0; i < nPleats; i++) {
        const u = (i / (nPleats - 1)) * 2 - 1;
        const xWaist = pose.torsoX + u * pose.waistW * 0.9;
        const xHem = pose.torsoX + u * pose.skirtHemW * 0.95;
        ctx.strokeStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(this.boil(xWaist, seed + i + 40, frame12, 1.5), this.boil(pose.waistY + 5 * scale, seed + i + 50, frame12, 1.5));
        ctx.lineTo(this.boil(xHem, seed + i + 60, frame12, 2.0), this.boil(pose.skirtHemY, seed + i + 70, frame12, 2.0));
        ctx.stroke();
      }
      // Parallel vertical lower-leg lines
      for (const [kx, ky, fx, fy, lOff] of [
        [pose.kneeLX, pose.kneeLY, pose.footLX, pose.footLY, 80],
        [pose.kneeRX, pose.kneeRY, pose.footRX, pose.footRY, 90],
      ]) {
        for (const offX of [-3.5 * scale, 0, 3.5 * scale]) {
          ctx.beginPath();
          ctx.moveTo(this.boil(kx + offX, seed + lOff, frame12, 1.2), pose.skirtHemY + 2 * scale);
          ctx.lineTo(this.boil(fx + offX, seed + lOff + 5, frame12, 1.2), fy);
          ctx.stroke();
        }
      }
      // Zigzag arms
      for (const [sx, sy, ex, ey, hx, hy, aOff] of [
        [pose.torsoX - pose.shoulderW * 0.85, pose.shoulderY + 4 * scale, pose.elbowLX, pose.elbowLY, pose.handLX, pose.handLY, 110],
        [pose.torsoX + pose.shoulderW * 0.85, pose.shoulderY + 4 * scale, pose.elbowRX, pose.elbowRY, pose.handRX, pose.handRY, 130],
      ]) {
        ctx.strokeStyle = colors[1];
        ctx.beginPath();
        const segs = 9;
        for (let s = 0; s <= segs; s++) {
          const u = s / segs;
          const ax = u < 0.5 ? sx + (ex - sx) * (u * 2) : ex + (hx - ex) * ((u - 0.5) * 2);
          const ay = u < 0.5 ? sy + (ey - sy) * (u * 2) : ey + (hy - ey) * ((u - 0.5) * 2);
          const zig = (s % 2 === 0 ? 1 : -1) * 5 * scale;
          if (s === 0) ctx.moveTo(ax, ay);
          else ctx.lineTo(this.boil(ax, seed + s + aOff, frame12, 1.2), this.boil(ay + zig, seed + s * 2 + aOff, frame12, 1.2));
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Computes anatomical dot target coordinates for STYLE 5 (Small Pointillist Dots)
   */
  getSmallDotTargets(pose) {
    const { dancer, scale } = pose;
    const pts = [];

    // Head cluster (8 dots)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = (i % 2 === 0 ? 0.72 : 0.35) * pose.headR;
      pts.push([pose.headX + Math.cos(a) * r, pose.headY + Math.sin(a) * r]);
    }

    // Torso grid (15 dots)
    for (let r = 0; r < 5; r++) {
      const y = pose.shoulderY + (r / 4) * (pose.waistY - pose.shoulderY);
      const w = pose.shoulderW * (1 - r * 0.05);
      for (let c = -1; c <= 1; c++) {
        pts.push([pose.torsoX + c * w * 0.68, y]);
      }
    }

    // Skirt or Hips (15 dots)
    for (let r = 0; r < 4; r++) {
      const u = r / 3;
      const y = pose.waistY + u * (pose.skirtHemY - pose.waistY);
      const halfW = dancer.gender === "f" ? pose.waistW + u * (pose.skirtHemW - pose.waistW) * 0.85 : pose.hipW * 0.85;
      const cols = dancer.gender === "f" && r >= 2 ? 4 : 3;
      for (let c = 0; c < cols; c++) {
        const cu = cols === 1 ? 0 : (c / (cols - 1)) * 2 - 1;
        pts.push([pose.torsoX + cu * halfW, y]);
      }
    }

    // Arms (5 dots per arm)
    for (const [sx, sy, ex, ey, hx, hy] of [
      [pose.torsoX - pose.shoulderW * 0.8, pose.shoulderY + 5 * scale, pose.elbowLX, pose.elbowLY, pose.handLX, pose.handLY],
      [pose.torsoX + pose.shoulderW * 0.8, pose.shoulderY + 5 * scale, pose.elbowRX, pose.elbowRY, pose.handRX, pose.handRY],
    ]) {
      for (let i = 1; i <= 5; i++) {
        const u = i / 5;
        const ax = u < 0.5 ? sx + (ex - sx) * (u * 2) : ex + (hx - ex) * ((u - 0.5) * 2);
        const ay = u < 0.5 ? sy + (ey - sy) * (u * 2) : ey + (hy - ey) * ((u - 0.5) * 2);
        pts.push([ax, ay]);
      }
    }

    // Legs (6 dots per leg)
    for (const [hx, hy, kx, ky, fx, fy] of [
      [pose.torsoX - pose.hipW * 0.45, pose.hipY, pose.kneeLX, pose.kneeLY, pose.footLX, pose.footLY],
      [pose.torsoX + pose.hipW * 0.45, pose.hipY, pose.kneeRX, pose.kneeRY, pose.footRX, pose.footRY],
    ]) {
      for (let i = 1; i <= 6; i++) {
        const u = i / 6;
        const lx = u < 0.5 ? hx + (kx - hx) * (u * 2) : kx + (fx - kx) * ((u - 0.5) * 2);
        const ly = u < 0.5 ? hy + (ky - hy) * (u * 2) : ky + (fy - ky) * ((u - 0.5) * 2);
        pts.push([lx, ly]);
      }
    }

    return pts;
  }

  /**
   * STYLE 5: Renders Small Pointillist Hole-Punch Ink Dots (or the 01:53 Corner Pile Collapse!)
   */
  renderSmallDotsLayer(ctx, poses, frame12, isCollapsing, dt, alpha = 1.0) {
    // Collect all target dot positions from visible dancers
    const allTargets = [];
    poses.forEach((pose) => {
      const tPts = this.getSmallDotTargets(pose);
      tPts.forEach((pt, idx) => {
        allTargets.push({
          x: this.boil(pt[0], pose.idx * 50 + idx, frame12, 1.5),
          y: this.boil(pt[1], pose.idx * 50 + idx + 100, frame12, 1.5),
          r: Math.max(4.2, 5.8 * pose.scale),
        });
      });
    });

    // Sync particle array size
    while (this.dotParticles.length < allTargets.length) {
      const t = allTargets[this.dotParticles.length] || { x: 560, y: 520, r: 5.5 };
      this.dotParticles.push({
        x: t.x,
        y: t.y,
        vx: (Math.random() - 0.3) * 140,
        vy: (Math.random() - 0.5) * 80,
        r: t.r,
      });
    }

    // Corner pile bounds inside the 16mm film gate (bottom-right corner, matching t=113.5s!)
    const floorY = this.height * 0.835;
    const rightWallX = this.width * 0.915;
    const pileLeftX = this.width * 0.72;

    if (isCollapsing) {
      if (!this.wasCollapsing) {
        // Kick particles toward the bottom-right corner pile!
        this.dotParticles.forEach((p, idx) => {
          p.vx = 120 + (idx % 17) * 14;
          p.vy = -40 + (idx % 11) * 18;
        });
      }
      // Step gravity + pile stacking in bottom-right corner
      const subDt = Math.min(0.033, dt);
      for (let i = 0; i < this.dotParticles.length; i++) {
        const p = this.dotParticles[i];
        p.vy += 880 * subDt; // Gravity
        p.vx += (rightWallX - 55 - p.x) * 1.8 * subDt; // Gentle pull toward corner heap
        p.x += p.vx * subDt;
        p.y += p.vy * subDt;

        // Pile height contour in bottom-right corner (arches up near right wall)
        const distFromRight = Math.max(0, rightWallX - p.x);
        const moundH = Math.max(0, 72 - distFromRight * 0.52) * ((i % 7) / 6);
        const localFloor = floorY - moundH;

        if (p.y > localFloor) {
          p.y = localFloor;
          p.vy *= -0.28;
          p.vx *= 0.72;
        }
        if (p.x > rightWallX) {
          p.x = rightWallX;
          p.vx *= -0.4;
        }
        if (p.x < pileLeftX && p.y > floorY - 40) {
          p.x = pileLeftX + (i % 25) * 3.5;
          p.vx *= 0.5;
        }
      }
    } else {
      // Smoothly spring back (or lock) to dancer anatomical targets
      for (let i = 0; i < allTargets.length; i++) {
        const p = this.dotParticles[i];
        const t = allTargets[i];
        if (this.wasCollapsing) {
          p.x += (t.x - p.x) * Math.min(1, dt * 11);
          p.y += (t.y - p.y) * Math.min(1, dt * 11);
          p.r = t.r;
        } else {
          p.x = t.x;
          p.y = t.y;
          p.r = t.r;
        }
      }
    }
    this.wasCollapsing = isCollapsing;

    // Render the pointillist hole-punch ink dots
    ctx.save();
    ctx.globalAlpha = alpha;
    const count = isCollapsing ? Math.min(this.dotParticles.length, 95) : allTargets.length;
    for (let i = 0; i < count; i++) {
      const p = this.dotParticles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#191218";
      ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(75, 42, 54, 0.55)";
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * STYLE 6: Giant Avery Color-Coding Sticker Dots (Red head/torso/arms, Blue/Black skirt/hips, Yellow/Green legs!)
   */
  renderDancerGiantStickers(ctx, pose, alpha = 1.0) {
    const { dancer, scale, frame12, idx } = pose;
    const seed = idx * 300;
    const r = Math.max(13, 18.5 * scale); // Large round physical sticker radius!

    const stickers = [
      // Head (Red)
      { x: pose.headX, y: pose.headY - r * 0.3, c: "#8f191e" },
      // Torso (Red)
      { x: pose.torsoX, y: pose.shoulderY + r * 0.4, c: "#961b20" },
      { x: pose.torsoX - r * 0.65, y: (pose.shoulderY + pose.waistY) * 0.5, c: "#88161b" },
      { x: pose.torsoX + r * 0.65, y: (pose.shoulderY + pose.waistY) * 0.5, c: "#961b20" },
      { x: pose.torsoX, y: pose.waistY - r * 0.2, c: "#8f191e" },
      // Left & Right Arms (Red)
      { x: pose.elbowLX, y: pose.elbowLY, c: "#961b20" },
      { x: pose.handLX, y: pose.handLY, c: "#8f191e" },
      { x: pose.elbowRX, y: pose.elbowRY, c: "#961b20" },
      { x: pose.handRX, y: pose.handRY, c: "#8f191e" },
      // Hips / Skirt (Navy Blue or Charcoal Black)
      { x: pose.torsoX - r * 0.75, y: pose.waistY + r * 0.95, c: dancer.stickerBottom },
      { x: pose.torsoX + r * 0.75, y: pose.waistY + r * 0.95, c: dancer.stickerBottom },
      { x: pose.torsoX - r * 1.15, y: pose.hipY + r * 1.1, c: dancer.stickerBottom },
      { x: pose.torsoX, y: pose.hipY + r * 1.05, c: dancer.stickerBottom },
      { x: pose.torsoX + r * 1.15, y: pose.hipY + r * 1.1, c: dancer.stickerBottom },
      // Lower Legs / Feet (Golden Yellow or Moss Green)
      { x: pose.kneeLX, y: pose.kneeLY + r * 0.3, c: dancer.stickerFeet },
      { x: pose.footLX, y: pose.footLY - r * 0.4, c: dancer.stickerFeet },
      { x: pose.kneeRX, y: pose.kneeRY + r * 0.3, c: dancer.stickerFeet },
      { x: pose.footRX, y: pose.footRY - r * 0.4, c: dancer.stickerFeet },
    ];

    ctx.save();
    ctx.globalAlpha = alpha;
    stickers.forEach((s, i) => {
      const bx = this.boil(s.x, seed + i * 5, frame12, 2.0);
      const by = this.boil(s.y, seed + i * 9, frame12, 2.0);

      // Paper sticker shadow
      ctx.beginPath();
      ctx.arc(bx + 1.5, by + 1.8, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(18, 10, 14, 0.28)";
      ctx.fill();

      // Sticker body
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fillStyle = s.c;
      ctx.fill();

      // Subtle paper label rim highlight
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = "rgba(255, 225, 220, 0.22)";
      ctx.stroke();
    });
    ctx.restore();
  }

  /**
   * Optional Centerpiece: Hand-Made 1976 Mulberry Bush that morphs its style to match the dancers!
   */
  renderMulberryBushCenterpiece(ctx, activeStyles, frame12) {
    if (!this.showMulberryBush) return;
    const cx = this.width * 0.5;
    const baseY = this.height * 0.78;

    ctx.save();
    // Trunk
    const trunkPoly = [
      [cx - 16, baseY - 125],
      [cx + 16, baseY - 125],
      [cx + 26, baseY],
      [cx - 26, baseY],
    ];

    const clusters = [
      { x: cx, y: baseY - 215, r: 62 },
      { x: cx - 58, y: baseY - 175, r: 52 },
      { x: cx + 58, y: baseY - 175, r: 52 },
      { x: cx - 38, y: baseY - 245, r: 46 },
      { x: cx + 38, y: baseY - 245, r: 46 },
    ];

    if (activeStyles.colored > 0.2 || activeStyles.silhouette > 0.2) {
      const isSil = activeStyles.silhouette > activeStyles.colored;
      this.drawBoiledPolygon(
        ctx,
        trunkPoly,
        frame12,
        701,
        isSil ? "#171218" : "#4a2422",
        isSil ? null : "#161015",
        2.5,
        !isSil
      );
      clusters.forEach((c, idx) => {
        const pts = [];
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2;
          const rad = c.r * (0.88 + 0.14 * Math.sin(a * 3 + idx));
          pts.push([c.x + Math.cos(ang) * rad, c.y + Math.sin(ang) * rad]);
        }
        this.drawBoiledPolygon(
          ctx,
          pts,
          frame12,
          710 + idx * 10,
          isSil ? "#171218" : idx % 2 === 0 ? "#364a26" : "#4c2238",
          isSil ? null : "#161015",
          2.4,
          !isSil
        );
      });
    }

    if (activeStyles.hatching > 0.2) {
      ctx.strokeStyle = "#2c1820";
      ctx.lineWidth = 2.3;
      clusters.forEach((c, idx) => {
        for (let y = c.y - c.r * 0.8; y <= c.y + c.r * 0.8; y += 9) {
          const dy = (y - c.y) / c.r;
          const hw = Math.sqrt(Math.max(0, 1 - dy * dy)) * c.r * 0.85;
          ctx.beginPath();
          ctx.moveTo(this.boil(c.x - hw, 800 + y, frame12, 1.8), this.boil(y, 810 + y, frame12, 1.2));
          ctx.lineTo(this.boil(c.x + hw, 820 + y, frame12, 1.8), this.boil(y, 830 + y, frame12, 1.2));
          ctx.stroke();
        }
      });
    }

    if (activeStyles.small_dots > 0.2) {
      clusters.forEach((c, idx) => {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + idx;
          const rad = ((i % 3) + 1) * (c.r * 0.28);
          const dx = this.boil(c.x + Math.cos(ang) * rad, 900 + i + idx * 20, frame12, 1.5);
          const dy = this.boil(c.y + Math.sin(ang) * rad, 950 + i + idx * 20, frame12, 1.5);
          ctx.beginPath();
          ctx.arc(dx, dy, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = "#191218";
          ctx.fill();
        }
      });
    }

    if (activeStyles.giant_dots > 0.2) {
      const bushStickers = [
        [cx, baseY - 220, "#5a7028"],
        [cx - 45, baseY - 180, "#5a7028"],
        [cx + 45, baseY - 180, "#5a7028"],
        [cx - 28, baseY - 240, "#8f191e"],
        [cx + 28, baseY - 240, "#8f191e"],
        [cx, baseY - 175, "#921a1e"],
        [cx, baseY - 95, "#1d1d22"],
        [cx, baseY - 45, "#1d1d22"],
      ];
      bushStickers.forEach(([sx, sy, col], i) => {
        ctx.beginPath();
        ctx.arc(this.boil(sx, 980 + i, frame12, 1.8), this.boil(sy, 990 + i, frame12, 1.8), 19, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      });
    }

    ctx.restore();
  }

  /**
   * Renders the special 00:39 Right-Edge Sideways Peek-a-Boo figure!
   */
  renderRightEdgePeek(ctx, t, frame12) {
    // Figure leaning out horizontally from the right border of the 16mm gate (x ~ 665, y ~ 430)
    const reach = Math.sin(t * 5) * 14 + 78;
    const gx = this.width * 0.93 - reach;
    const gy = this.height * 0.61;

    const poly = [
      [this.width * 0.95, gy - 42],
      [gx + 28, gy - 36],
      [gx - 15, gy - 52], // Outstretched arm
      [gx - 22, gy - 40],
      [gx + 12, gy - 20],
      [gx, gy - 12], // Head profile
      [gx + 4, gy + 14],
      [this.width * 0.95, gy + 48],
    ];
    this.drawBoiledPolygon(ctx, poly, frame12, 555, "#171218", null, 2);
  }

  /**
   * Renders user-stamped interactive cels around the rotating 3D ring
   */
  renderUserStamps(ctx, ringPhase, frame12) {
    if (this.userStamps.length === 0) return;
    ctx.save();
    for (let i = 0; i < this.userStamps.length; i++) {
      const s = this.userStamps[i];
      const ang = s.angle + ringPhase;
      const depth = Math.cos(ang); // -1 back, +1 front
      const scale = 0.78 + 0.28 * (depth + 1) * 0.5;
      const sx = this.width * 0.5 + Math.sin(ang) * (this.width * 0.38);
      const sy = s.normY * this.height;

      if (s.tool === "avery") {
        ctx.beginPath();
        ctx.arc(this.boil(sx, s.seed, frame12, 1.8), this.boil(sy, s.seed + 5, frame12, 1.8), 19 * scale, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255,230,220,0.28)";
        ctx.stroke();
      } else if (s.tool === "dots") {
        for (let d = 0; d < 4; d++) {
          const ox = Math.cos(d * 1.7 + s.seed) * 12 * scale;
          const oy = Math.sin(d * 1.7 + s.seed) * 12 * scale;
          ctx.beginPath();
          ctx.arc(this.boil(sx + ox, s.seed + d, frame12, 1.4), this.boil(sy + oy, s.seed + d + 9, frame12, 1.4), 5.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = "#191218";
          ctx.fill();
        }
      } else if (s.tool === "hatching") {
        ctx.strokeStyle = "#2b161e";
        ctx.lineWidth = 2.4 * scale;
        for (let r = -1; r <= 1; r++) {
          ctx.beginPath();
          ctx.moveTo(this.boil(sx - 20 * scale, s.seed + r, frame12, 1.5), this.boil(sy + r * 8 * scale, s.seed + r + 4, frame12, 1.2));
          ctx.lineTo(this.boil(sx + 20 * scale, s.seed + r + 8, frame12, 1.5), this.boil(sy + r * 8 * scale, s.seed + r + 12, frame12, 1.2));
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  /**
   * Main Frame Render Entry Point
   */
  render(t, dt, activeStyles, viewMode, isLinearPlaying) {
    const ctx = this.ctx;
    const frame12 = Math.floor(t * 12);

    // 1. Subtle 12fps 16mm Camera Gate Weave
    const weaveX = this.boil(0, 11, frame12, 1.1);
    const weaveY = this.boil(0, 23, frame12, 0.9);

    ctx.save();
    ctx.fillStyle = "#080608";
    ctx.fillRect(0, 0, this.width, this.height);

    // If View Mode is strictly "1976 Original Film", render the video directly into the canvas
    if (viewMode === "video_only") {
      if (this.video && this.video.readyState >= 2) {
        ctx.drawImage(this.video, 0, 0, this.width, this.height);
      }
      ctx.restore();
      return;
    }

    // Determine paper background (Mulberry Pink vs. Credit Violet vs. Dark Leader)
    const isCredits = activeStyles.credits > 0.5 || this.paperTint === "violet";
    const isDarkLeader = isLinearPlaying && (t < 3.75 || t >= 169.0) && this.paperTint === "auto";

    const paperImg = isCredits ? this.assets.paperViolet : this.assets.paperMulberry;
    if (paperImg && paperImg.complete && paperImg.naturalWidth > 0) {
      ctx.drawImage(paperImg, weaveX, weaveY, this.width, this.height);
    } else {
      ctx.fillStyle = isCredits ? "#685094" : "#9c5870";
      ctx.fillRect(28, 82, this.width - 56, this.height - 164);
    }

    if (this.paperTint === "parchment") {
      ctx.save();
      ctx.globalCompositeOperation = "Soft-Light";
      ctx.fillStyle = "rgba(215, 185, 130, 0.35)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // Clip to the interior of the rounded 16mm film gate so dancers are framed exactly like 1976!
    ctx.save();
    this.clip16mmGate(ctx, weaveX, weaveY);

    // 2. If in Violet Credits sequence (152.25s - 169.0s), render the authentic hand-lettered 1976 credit cards!
    if (activeStyles.credits > 0.5) {
      this.renderCreditsSequence(ctx, t, weaveX, weaveY);
      ctx.restore();
      ctx.restore();
      return;
    }

    // 3. Render the Dancers & Cel Layers on an offscreen cel layer (so we can also do 3x Onion-Skin Ghosting!)
    const celCanvas = this.ghostBuffers[0];
    const celCtx = celCanvas.getContext("2d");
    celCtx.clearRect(0, 0, this.width, this.height);

    const isBlank = activeStyles.blank > 0.75 && !this.manualCollapseActive;
    const isCollapsing = activeStyles.dot_collapse > 0.5 || this.manualCollapseActive;

    if (!isBlank) {
      const ringPhase = t * 0.95 * this.ringSpeed;
      const stepPhase = t * Math.PI * 4.0 * this.ringSpeed; // Locked to 120 BPM (2 steps/sec)!

      // Compute back-arc poses (far side of the Mulberry Bush circle, moving left-to-right or right-to-left)
      const swingDir = Math.sin(t * 0.28) >= 0 ? 1 : -1;
      const holdHands =
        (t >= 5.0 && t <= 19.5) ||
        (t >= 69.0 && t <= 85.5) ||
        (t >= 141.5 && t <= 150.5) ||
        !isLinearPlaying;

      const backPoses = [];
      for (let i = 0; i < 4; i++) {
        const d = this.dancers[i];
        // Position dancers along a horizontal ring wave so 2 to 3 dancers are visible in the gate
        const spacing = 195;
        const loopW = spacing * 4;
        const rawX = ((t * 145 * this.ringSpeed * swingDir + i * spacing) % loopW + loopW) % loopW;
        const cx = rawX - 110;
        if (cx < -130 || cx > this.width + 130) continue;

        const scale = 0.88 + 0.06 * Math.sin(t * 1.5 + i);
        const footY = this.height * 0.865;
        const pose = this.computeDancerPose(
          d,
          cx,
          footY,
          scale,
          stepPhase + i * 1.4,
          swingDir,
          holdHands,
          frame12,
          i
        );
        backPoses.push(pose);
      }

      // Optional Mulberry Bush centerpiece behind/amidst the ring
      this.renderMulberryBushCenterpiece(celCtx, activeStyles, frame12);

      // Render active Cel Styles for the ring dancers
      if (!isCollapsing) {
        if (activeStyles.silhouette > 0.1) {
          backPoses.forEach((p) =>
            this.renderDancerSolidOrColored(celCtx, p, "silhouette", activeStyles.silhouette)
          );
        }
        if (activeStyles.colored > 0.1) {
          backPoses.forEach((p) =>
            this.renderDancerSolidOrColored(celCtx, p, "colored", activeStyles.colored)
          );
        }
        if (activeStyles.hatching > 0.1) {
          backPoses.forEach((p) =>
            this.renderDancerHatching(celCtx, p, activeStyles.hatching)
          );
        }
      }

      if (activeStyles.small_dots > 0.1 || isCollapsing) {
        this.renderSmallDotsLayer(
          celCtx,
          backPoses,
          frame12,
          isCollapsing,
          dt,
          Math.max(activeStyles.small_dots || 0, isCollapsing ? 1 : 0)
        );
      }

      if (!isCollapsing && activeStyles.giant_dots > 0.1) {
        backPoses.forEach((p) =>
          this.renderDancerGiantStickers(celCtx, p, activeStyles.giant_dots)
        );
      }

      // Foreground Giant Close-Up Dancer Sweep (near side of the 3D circle!)
      const manualSweepAge = t - this.manualGiantSweepTime;
      const showGiant =
        activeStyles.giant_red > 0.2 || (manualSweepAge >= 0 && manualSweepAge < 2.4);
      if (showGiant && !isCollapsing) {
        const sweepProg =
          manualSweepAge >= 0 && manualSweepAge < 2.4
            ? manualSweepAge / 2.4
            : (t * 0.55) % 1.0;
        const fgX = this.width * (1.18 - sweepProg * 1.36);
        const fgDancer = this.dancers[Math.floor(t * 0.5) % 4];
        const fgPose = this.computeDancerPose(
          fgDancer,
          fgX,
          this.height * 1.18,
          1.72,
          stepPhase + 0.7,
          -1,
          false,
          frame12,
          3
        );
        this.renderDancerSolidOrColored(celCtx, fgPose, "giant_red", 0.92);
      }

      // Special 00:39 Right-Edge Peek-a-Boo!
      const manualPeekAge = t - this.manualPeekTime;
      if (activeStyles.edge_peek > 0.4 || (manualPeekAge >= 0 && manualPeekAge < 2.0)) {
        this.renderRightEdgePeek(celCtx, t, frame12);
      }

      // User interactive cel stamps
      this.renderUserStamps(celCtx, ringPhase, frame12);
    }

    // 4. Multi-Exposure Onion-Skin Ghost Trails (draws delayed ghostBuffers[2] and [1] at reduced opacity)
    if (activeStyles.ghost_echo > 0.2) {
      ctx.save();
      ctx.globalAlpha = 0.26 * activeStyles.ghost_echo;
      ctx.drawImage(this.ghostBuffers[2], -18, 0);
      ctx.globalAlpha = 0.42 * activeStyles.ghost_echo;
      ctx.drawImage(this.ghostBuffers[1], -9, 0);
      ctx.restore();
    }

    // Draw current cel onto paper
    ctx.drawImage(celCanvas, 0, 0);

    // Advance onion-skin history buffers on 12fps ticks
    if (frame12 !== this.lastGhostFrame12) {
      this.lastGhostFrame12 = frame12;
      const g2 = this.ghostBuffers[2].getContext("2d");
      g2.clearRect(0, 0, this.width, this.height);
      g2.drawImage(this.ghostBuffers[1], 0, 0);

      const g1 = this.ghostBuffers[1].getContext("2d");
      g1.clearRect(0, 0, this.width, this.height);
      g1.drawImage(this.ghostBuffers[0], 0, 0);
    }

    // 5. If in Hybrid Lightbox Mode, composite or split-screen with the original 1976 film!
    if (viewMode === "hybrid" && this.video && this.video.readyState >= 2) {
      ctx.save();
      if (this.splitScreen) {
        // Left half: 1976 Original Film, Right half: 2026 Living Hand-Made Canvas
        ctx.beginPath();
        ctx.rect(0, 0, this.width * this.hybridMix, this.height);
        ctx.clip();
        ctx.drawImage(this.video, 0, 0, this.width, this.height);
        // Draw split curtain line
        ctx.strokeStyle = "rgba(255, 235, 190, 0.75)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.width * this.hybridMix, 80);
        ctx.lineTo(this.width * this.hybridMix, this.height - 80);
        ctx.stroke();
      } else {
        // Translucent Lightbox Onion-Skin Blend
        ctx.globalAlpha = 1.0 - this.hybridMix;
        ctx.globalCompositeOperation = "darken";
        ctx.drawImage(this.video, 0, 0, this.width, this.height);
      }
      ctx.restore();
    }

    // 6. Subtle 1976 16mm Optical Film Grain, Occasional Hair/Dust Speck, & Dark Leader Fade
    this.render16mmFilmArtifacts(ctx, t, frame12, isDarkLeader);

    ctx.restore(); // End 16mm gate clip
    ctx.restore();
  }

  clip16mmGate(ctx, ox, oy) {
    const x = 32 + ox;
    const y = 84 + oy;
    const w = this.width - 64;
    const h = this.height - 168;
    const r = 38;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.clip();
  }

  renderCreditsSequence(ctx, t, ox, oy) {
    let cardImg = null;
    let cardStart = 0;
    if (t >= 153.8 && t < 157.0) {
      cardImg = this.assets.creditTitle;
      cardStart = 153.8;
    } else if (t >= 157.8 && t < 161.0) {
      cardImg = this.assets.creditAuthor;
      cardStart = 157.8;
    } else if (t >= 161.8 && t < 165.0) {
      cardImg = this.assets.creditMusic;
      cardStart = 161.8;
    } else if (t >= 165.8 && t < 168.4) {
      cardImg = this.assets.creditThanks;
      cardStart = 165.8;
    }

    if (cardImg && cardImg.complete && cardImg.naturalWidth > 0) {
      // Progressive left-to-right hand-lettering reveal over the first 0.55s of each card
      const reveal = Math.min(1, (t - cardStart) / 0.55);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, this.width * reveal, this.height);
      ctx.clip();
      ctx.drawImage(cardImg, ox, oy, this.width, this.height);
      ctx.restore();
    }
  }

  render16mmFilmArtifacts(ctx, t, frame12, isDarkLeader) {
    // Occasional tiny 16mm dust speck on cel
    if (frame12 % 5 === 0) {
      const sx = ((frame12 * 173) % 560) + 80;
      const sy = ((frame12 * 293) % 460) + 130;
      ctx.fillStyle = "rgba(25, 15, 20, 0.35)";
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Opening / Closing 16mm dark leader fade
    if (isDarkLeader || (t >= 3.75 && t < 5.75)) {
      let darkness = 0;
      if (t < 3.75) darkness = 0.96;
      else if (t < 5.75) darkness = 0.65 * (1 - (t - 3.75) / 2.0);
      else if (t >= 169.0) darkness = Math.min(0.98, (t - 169.0) / 0.6);

      if (darkness > 0) {
        ctx.fillStyle = `rgba(6, 5, 8, ${darkness})`;
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }
  }
}

window.MulberryCelRenderer = MulberryCelRenderer;
