(function () {
  'use strict';

  var cvs = document.getElementById('c');
  var ctx = cvs.getContext('2d');
  var CW = cvs.width;
  var CH = cvs.height;
  var TW = 22;
  var TH = 11;
  var OX = CW / 2;
  var OY = 85;

  var G = 0, WA = 1, SH = 2, FO = 3, TR = 4, BU = 5, RO = 6, DR = 7, FI = 8, PO = 9, TC = 10;

  /* Layout from aerial reference (images/aveze-aerial-reference.png): N=top, S=bottom, W=left, E=right.
     L'Huisne enters NE and splits around a wooded island (FO enclosed by WA, rows 2-6) that
     sits off to the NW, to the side of the grounds rather than behind them — the river then
     narrows to hug the W edge and never reaches the house. A separate stand of trees (rows
     6-8, cols 7-14) forms the park directly behind the main house, with open lawn between it
     and the island so the two read as distinct features. Main house BU sits behind a forecourt
     (rows 10-11); a second, smaller building (pool house, rows 12-13) sits beside the pool PO,
     with a garden loop path TR curling east toward the tennis court TC. The private drive DR
     winds from the D59 road RO (bottom-left, crossing the river) up to the house forecourt.
     A handful of neighbouring rooftops (BU) sit beyond the court, SE corner. */
  var M = [
    [FI, FI, FI, FI, FI, FI, FI, FI, FI, FI, FI, FI, WA, WA, WA, WA, WA, WA, WA, WA],
    [FI, FI, FI, FI, FI, FI, FI, FI, FI, FI, SH, SH, WA, WA, WA, WA, WA, WA, WA, WA],
    [FI, FI, FO, FO, FO, FO, FO, FO, FO, G, SH, SH, WA, WA, WA, WA, WA, WA, WA, WA],
    [FI, WA, FO, FO, FO, FO, FO, FO, FO, G, G, WA, WA, WA, SH, SH, WA, WA, WA, WA],
    [WA, WA, FO, FO, FO, FO, FO, FO, WA, WA, WA, WA, WA, SH, WA, WA, WA, WA, WA, WA],
    [WA, WA, FO, FO, FO, FO, FO, WA, WA, WA, WA, G, G, G, G, G, G, G, G, G],
    [WA, WA, G, G, G, G, G, FO, FO, FO, FO, FO, FO, FO, FO, G, G, G, G, G],
    [WA, WA, G, G, G, G, G, FO, FO, FO, FO, FO, FO, FO, FO, G, G, G, G, G],
    [WA, WA, G, G, G, G, G, FO, FO, FO, FO, FO, FO, FO, FO, G, G, G, G, G],
    [WA, WA, G, G, G, G, DR, G, G, G, G, TR, TR, TR, G, G, G, G, G, G],
    [WA, WA, G, G, DR, DR, BU, BU, BU, BU, BU, G, TR, G, TR, G, G, G, G, G],
    [WA, WA, G, DR, DR, G, BU, BU, BU, BU, BU, G, TR, TR, G, TR, G, G, G, G],
    [G, WA, DR, DR, G, G, BU, BU, PO, PO, G, G, G, G, G, TC, TC, TC, G, G],
    [G, WA, DR, G, G, G, BU, BU, PO, PO, G, TR, G, G, G, TC, TC, TC, G, G],
    [RO, WA, DR, G, G, G, G, G, G, G, G, TR, TR, G, G, TC, TC, TC, G, G],
    [RO, WA, DR, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G],
    [RO, RO, DR, G, G, G, G, G, G, G, G, G, G, G, G, G, G, BU, BU, G],
    [RO, RO, RO, DR, G, G, G, G, G, G, G, G, G, G, G, G, BU, BU, BU, BU],
    [RO, RO, RO, RO, DR, G, G, G, G, G, G, G, G, G, G, G, BU, BU, BU, G],
    [G, RO, RO, RO, RO, RO, RO, RO, RO, RO, RO, G, G, G, G, G, G, BU, BU, G]
  ];
  var ROWS = 20;
  var COLS = 20;

  /* Pokémon / GBC-style ramps: light, mid, shadow, outline */
  var PAL = {
    grass: ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'],
    field: ['#88c070', '#78b050', '#589040', '#306850'],
    water: ['#639bff', '#4888e8', '#3060c8', '#104878'],
    waterShallow: ['#88c0f0', '#68a8e0', '#5090c8', '#306878'],
    forest: ['#58a848', '#489038', '#387028', '#185018'],
    trail: ['#a0b868', '#88a050', '#688040', '#405028'],
    building: ['#d8c8a8', '#c0b090', '#a89878', '#584830'],
    roof: ['#a05050', '#884040', '#683030', '#401818'],
    roofSide: ['#c07070', '#a85858', '#884040', '#502020'],
    road: ['#787878', '#606060', '#484848', '#282828'],
    drive: ['#b8ac8c', '#9c9070', '#7c7058', '#4c4030'],
    tennis: ['#d8945c', '#c07840', '#a05c28', '#603c18'],
    pond: ['#50c0e8', '#38a8d8', '#2890c0', '#186878']
  };

  function iso(c, r) {
    return [(c - r) * TW + OX, (c + r) * TH + OY];
  }

  var gp = [];
  for (var r = 0; r < ROWS; r++) {
    gp[r] = [];
    for (var c = 0; c < COLS; c++) {
      gp[r][c] = iso(c, r);
    }
  }

  function hv(a, b) {
    return ((a * 2654435761 + b * 40503) >>> 0) % 1000 / 1000;
  }

  function diamondPath(px, py) {
    ctx.beginPath();
    ctx.moveTo(px, py - TH);
    ctx.lineTo(px + TW, py);
    ctx.lineTo(px, py + TH);
    ctx.lineTo(px - TW, py);
    ctx.closePath();
  }

  /** Pokémon-style iso diamond: gradient fill + speckle variation + bold outline */
  function drawTerrainDiamond(px, py, pal, v) {
    var light = pal[0];
    var mid = pal[1];
    var dark = pal[2];
    var outline = pal[3];
    var g = ctx.createLinearGradient(px - TW, py - TH, px + TW, py + TH);
    g.addColorStop(0, dark);
    g.addColorStop(0.35, mid);
    g.addColorStop(0.65, light);
    g.addColorStop(1, mid);
    diamondPath(px, py);
    ctx.fillStyle = g;
    ctx.fill();
    if (v > 0.55) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      diamondPath(px - 1, py - 1);
      ctx.fill();
    } else if (v < 0.15) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      diamondPath(px + 1, py + 1);
      ctx.fill();
    }
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.25;
    diamondPath(px, py);
    ctx.stroke();
  }

  function drawWaterDiamond(px, py, t, c, r, pal) {
    var wave = Math.sin(t * 1.5 + c * 0.7 + r * 0.5) * 0.5 + 0.5;
    var g = ctx.createLinearGradient(px, py - TH, px, py + TH);
    g.addColorStop(0, pal[1]);
    g.addColorStop(0.5, pal[0]);
    g.addColorStop(1, pal[2]);
    diamondPath(px, py);
    ctx.fillStyle = g;
    ctx.fill();
    if (Math.sin(t * 2 + c * 1.3 + r * 0.9) > 0.55) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      diamondPath(px, py);
      ctx.fill();
    }
    ctx.strokeStyle = pal[3];
    ctx.lineWidth = 1.25;
    diamondPath(px, py);
    ctx.stroke();
  }

  var seed = 42;
  function rng() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  var trees = [];
  var waterCells = [];
  for (var rr0 = 0; rr0 < ROWS; rr0++) {
    for (var cc0 = 0; cc0 < COLS; cc0++) {
      var t0 = M[rr0][cc0];
      if (t0 === WA || t0 === SH || t0 === PO) {
        waterCells.push({ r: rr0, c: cc0, tile: t0 });
        continue;
      }
      if (t0 !== FO && t0 !== TR) continue;
      var n = t0 === FO ? 3 + (rng() * 2 | 0) : 1 + (rng() * 2 | 0);
      for (var i = 0; i < n; i++) {
        trees.push({
          r: rr0,
          c: cc0,
          ox: (rng() - 0.5) * TW * 1.2,
          oy: (rng() - 0.5) * TH * 1.2,
          sz: t0 === FO ? 6 + rng() * 5 : 4.5 + rng() * 3,
          dp: cc0 + rr0 + rng() * 0.3
        });
      }
    }
  }
  trees.sort(function (a, b) { return a.dp - b.dp; });

  /** Chunky overworld-style tree */
  function drawTreePokemon(px, py, sz) {
    ctx.beginPath();
    ctx.ellipse(px + 2, py + 2, sz * 0.55, sz * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15,56,15,0.35)';
    ctx.fill();

    ctx.fillStyle = '#584020';
    ctx.fillRect(px - 2, py - sz * 0.3, 4, sz * 0.55);

    var greens = ['#306230', '#4a8c3a', '#6aac4a', '#8bc85a'];
    var rr;
    for (var layer = 0; layer < 3; layer++) {
      rr = sz * (0.75 - layer * 0.18);
      var oy = py - sz * (1.1 + layer * 0.35);
      ctx.beginPath();
      ctx.arc(px, oy, rr, 0, Math.PI * 2);
      ctx.fillStyle = greens[layer + 1] || greens[2];
      ctx.fill();
      ctx.strokeStyle = '#0f380f';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px - rr * 0.35, py - sz * 1.35, Math.max(2, rr * 0.25), Math.max(2, rr * 0.12));
  }

  function drawManorPokemon() {
    var c1 = 6;
    var r1 = 10;
    var c2 = 11;
    var r2 = 12;
    var wh = 28;
    var rh = 11;
    var p1 = iso(c1, r1);
    var nx = p1[0];
    var ny = p1[1];
    var p2 = iso(c2, r1);
    var ex = p2[0];
    var ey = p2[1];
    var p3 = iso(c2, r2);
    var sx = p3[0];
    var sy = p3[1];
    var p4 = iso(c1, r2);
    var wx = p4[0];
    var wy = p4[1];
    var mc = (c1 + c2) / 2;
    var prn = iso(mc, r1);
    var rnx = prn[0];
    var rny = prn[1];
    var prs = iso(mc, r2);
    var rsx = prs[0];
    var rsy = prs[1];

    function strokePoly(points, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke || '#0f380f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    strokePoly([[wx, wy], [sx, sy], [sx, sy - wh], [wx, wy - wh]], PAL.building[1], PAL.building[3]);
    strokePoly([[ex, ey], [sx, sy], [sx, sy - wh], [ex, ey - wh]], PAL.building[0], PAL.building[3]);

    ctx.lineWidth = 1;
    for (var fi = 0; fi < 3; fi++) {
      var f = (fi + 0.5) / 3;
      var lx = wx + (sx - wx) * f;
      var ly = wy + (sy - wy) * f;
      ctx.fillStyle = '#5090b0';
      ctx.fillRect(lx - 2.5, ly - wh * 0.5 - 3, 5, 5);
      ctx.strokeStyle = '#104060';
      ctx.strokeRect(lx - 2.5, ly - wh * 0.5 - 3, 5, 5);
      var rx = ex + (sx - ex) * f;
      var ry = ey + (sy - ey) * f;
      ctx.fillStyle = '#68a8c8';
      ctx.fillRect(rx - 2.5, ry - wh * 0.5 - 3, 5, 5);
      ctx.strokeRect(rx - 2.5, ry - wh * 0.5 - 3, 5, 5);
    }

    strokePoly([[nx, ny - wh], [ex, ey - wh], [rnx, rny - wh - rh]], PAL.roofSide[1], PAL.roof[3]);
    strokePoly([[nx, ny - wh], [wx, wy - wh], [rsx, rsy - wh - rh], [rnx, rny - wh - rh]], PAL.roof[0], PAL.roof[3]);
    strokePoly([[ex, ey - wh], [sx, sy - wh], [rsx, rsy - wh - rh], [rnx, rny - wh - rh]], PAL.roof[2], PAL.roof[3]);
    strokePoly([[wx, wy - wh], [sx, sy - wh], [rsx, rsy - wh - rh]], PAL.building[2], PAL.building[3]);

    var ct = 0.3;
    var chx = rnx + (rsx - rnx) * ct;
    var chy = rny + (rsy - rny) * ct;
    ctx.fillStyle = '#403028';
    ctx.fillRect(chx - 2.5, chy - wh - rh - 10, 5, 10);
    ctx.fillStyle = '#584838';
    ctx.fillRect(chx - 3, chy - wh - rh - 11, 6, 2.5);
  }

  function drawStaticTerrain() {
    ctx.fillStyle = '#152218';
    ctx.fillRect(0, 0, CW, CH);

    for (var rr = 0; rr < ROWS; rr++) {
      for (var cc = 0; cc < COLS; cc++) {
        var tile = M[rr][cc];
        if (tile === WA || tile === SH || tile === PO) continue;

        var p = gp[rr][cc];
        var px = p[0];
        var py = p[1];
        var v = hv(cc, rr);

        switch (tile) {
          case G:
            drawTerrainDiamond(px, py, PAL.grass, v);
            break;
          case FI:
            drawTerrainDiamond(px, py, PAL.field, v);
            break;
          case FO:
            drawTerrainDiamond(px, py, PAL.forest, v);
            break;
          case TR:
            drawTerrainDiamond(px, py, PAL.trail, v);
            break;
          case BU:
            drawTerrainDiamond(px, py, PAL.building, v);
            break;
          case RO:
            drawTerrainDiamond(px, py, PAL.road, v);
            break;
          case DR:
            drawTerrainDiamond(px, py, PAL.drive, v);
            break;
          case TC:
            drawTerrainDiamond(px, py, PAL.tennis, v);
            break;
          default:
            break;
        }
      }
    }

    for (var ti = 0; ti < trees.length; ti++) {
      var tr = trees[ti];
      var bp = gp[tr.r][tr.c];
      drawTreePokemon(bp[0] + tr.ox, bp[1] + tr.oy, tr.sz);
    }

    drawManorPokemon();
  }

  // Render the static layer (terrain + trees + manor) once onto an offscreen
  // canvas, since it never changes frame to frame — only water animates.
  var staticCvs = document.createElement('canvas');
  staticCvs.width = CW;
  staticCvs.height = CH;
  var staticCtx = staticCvs.getContext('2d');
  var liveCtx = ctx;
  ctx = staticCtx;
  drawStaticTerrain();
  ctx = liveCtx;

  var vignette = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.28, CW / 2, CH / 2, CW * 0.55);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(13,27,42,0.5)');

  function drawFrame(t) {
    ctx.drawImage(staticCvs, 0, 0);

    for (var wi = 0; wi < waterCells.length; wi++) {
      var wc = waterCells[wi];
      var p = gp[wc.r][wc.c];
      var px = p[0];
      var py = p[1];
      if (wc.tile === WA) {
        drawWaterDiamond(px, py, t, wc.c, wc.r, PAL.water);
      } else if (wc.tile === SH) {
        drawWaterDiamond(px, py, t * 1.2, wc.c, wc.r, PAL.waterShallow);
      } else {
        drawWaterDiamond(px, py, t * 0.9, wc.c, wc.r, PAL.pond);
      }
    }

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CW, CH);
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    drawFrame(0);
  } else {
    var t = 0;
    (function loop() {
      t += 0.016;
      drawFrame(t);
      requestAnimationFrame(loop);
    })();
  }
})();
