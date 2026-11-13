// Rendu graphique de Dark Nova RP : terrain, bâtiments, arbres, personnages, fontaine.
// Tout est déterministe (pas d'aléatoire) pour que la ville soit identique à chaque image.

export function hash(a, b = 0) {
  let n = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function hashText(text) {
  let s = 7;
  for (const ch of String(text)) s = (Math.imul(s, 31) + ch.charCodeAt(0)) | 0;
  return s >>> 0;
}

// Éclaircit (amt > 0) ou assombrit (amt < 0) une couleur #rrggbb.
export function shade(color, amt) {
  if (!/^#[0-9a-f]{6}/i.test(color)) return color;
  const n = parseInt(color.slice(1, 7), 16);
  const target = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const mix = v => Math.round((target - v) * p + v);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

function box(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function label(ctx, text, x, y, size, color) {
  ctx.font = `700 ${size}px system-ui`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

// Herbe : clairières, zones d'ombre, brins et quelques fleurs, uniquement dans la zone visible.
export function ground(ctx, cameraX, cameraY, viewW, viewH, world) {
  const S = 42;
  const x0 = Math.floor(cameraX / S) * S, y0 = Math.floor(cameraY / S) * S;
  const x1 = Math.min(world.width, cameraX + viewW + S), y1 = Math.min(world.height, cameraY + viewH + S);
  const flowers = ['#f2e6a0', '#f4c1d9', '#fff4e8'];
  for (let x = x0; x < x1; x += S) {
    for (let y = y0; y < y1; y += S) {
      const i = x / S, j = y / S, n = hash(i, j), m = hash(i + 91, j + 17);
      if (n < .16 || n > .9) {
        ctx.fillStyle = n < .16 ? '#a0b59d' : '#93a990';
        ctx.beginPath();
        ctx.ellipse(x + 21, y + 21, 22 + hash(i + 11, j) * 16, 17 + hash(i, j + 13) * 12, hash(i + 4, j + 4) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      if (m < .5) {
        const px = x + 6 + hash(i, j + 3) * 28, py = y + 8 + hash(i + 5, j) * 26;
        ctx.fillStyle = '#86a085';
        ctx.fillRect(px, py, 2, 5);
        ctx.fillRect(px + 3, py + 1, 2, 4);
        ctx.fillRect(px - 3, py + 2, 2, 3);
      } else if (m > .965) {
        disc(ctx, x + 10 + hash(i + 2, j) * 22, y + 10 + hash(i, j + 2) * 22, 2, flowers[Math.floor(hash(i, j + 9) * 3)]);
      }
    }
  }
}

// Bordures de trottoir le long d'une avenue verticale et d'une rue horizontale.
export function verticalCurb(ctx, x, top, height) {
  ctx.fillStyle = '#56676a';
  ctx.fillRect(x - 57, top, 3, height);
  ctx.fillRect(x + 54, top, 3, height);
}

export function horizontalCurb(ctx, y, left, width) {
  ctx.fillStyle = '#56676a';
  ctx.fillRect(left, y - 41, width, 3);
  ctx.fillRect(left, y + 38, width, 3);
}

// Ligne centrale pointillée, limitée à la zone visible (la phase reste stable pendant le défilement).
export function centerLine(ctx, x, top, height) {
  ctx.save();
  ctx.setLineDash([13, 17]);
  ctx.lineDashOffset = ((top % 30) + 30) % 30;
  ctx.strokeStyle = '#c7cbb2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top + height);
  ctx.stroke();
  ctx.restore();
}

export function tree(ctx, x, y, size = 21, time = 0) {
  const sway = Math.sin(time / 1100 + x * .013 + y * .007) * 1.6;
  ctx.fillStyle = '#1f33281f';
  ctx.beginPath();
  ctx.ellipse(x + 9, y + 14, size * 1.05, size * .62, 0, 0, 7);
  ctx.fill();
  box(ctx, x - 3, y, 6, 18, 2, '#6e6250');
  box(ctx, x - 3, y, 2, 18, 1, '#85775f');
  const cx = x + sway;
  disc(ctx, cx, y - 5, size, '#3d6f5e');
  disc(ctx, cx - 4, y - 9, size * .8, '#4f8570');
  disc(ctx, cx - 7, y - 13, size * .45, '#6aa088');
  disc(ctx, cx - 9, y - 16, size * .2, '#8dbda0');
}

// Bâtiment : ombre, façade dégradée, toit, fenêtres (même position que l'éclairage de nuit), enseigne, auvent, porte.
export function building(ctx, b, index) {
  const { x, y, w, h } = b, c = b.color, cx = x + w / 2;
  box(ctx, x + 16, y + 22, w, h, 12, '#26352e1f');
  box(ctx, x + 10, y + 14, w, h, 9, '#26352e33');

  const wall = ctx.createLinearGradient(0, y, 0, y + h);
  wall.addColorStop(0, shade(c, .1));
  wall.addColorStop(1, shade(c, -.2));
  box(ctx, x, y, w, h, 6, wall);
  box(ctx, x, y + h - 6, w, 6, 3, shade(c, -.32));

  // Équipements de toit.
  for (let k = 0; k < 3; k++) {
    if (hash(index + 3, k) < .5) continue;
    const ux = x + 24 + k * Math.max(60, (w - 90) / 2) + hash(index, k + 7) * 14;
    box(ctx, ux, y - 15, 26, 12, 2, '#8e9a9c');
    box(ctx, ux, y - 15, 26, 4, 2, '#b8c3c4');
    box(ctx, ux + 5, y - 11, 6, 6, 3, '#6d797b');
  }
  box(ctx, x - 4, y - 7, w + 8, 17, 5, shade(c, -.32));
  box(ctx, x - 4, y - 7, w + 8, 11, 5, shade(c, .18));
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(x, y + 10, w, 2);

  // Fenêtres : cadre, vitre, reflet, croisillon, rebord.
  for (let wx = x + 22; wx < x + w - 20; wx += 44) {
    box(ctx, wx - 2, y + 25, 30, 31, 3, shade(c, -.35));
    box(ctx, wx, y + 27, 26, 27, 2, '#263f55');
    ctx.fillStyle = '#a9d2dc55';
    ctx.beginPath();
    ctx.moveTo(wx + 2, y + 28);
    ctx.lineTo(wx + 15, y + 28);
    ctx.lineTo(wx + 2, y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1c2f40';
    ctx.fillRect(wx + 12, y + 27, 2, 27);
    box(ctx, wx - 3, y + 54, 32, 3, 1, shade(c, .25));
  }
  ctx.fillStyle = shade(c, -.25);
  ctx.fillRect(x, y + 62, w, 2);
  ctx.fillStyle = '#ffffff1a';
  ctx.fillRect(x, y + 64, w, 1);

  if (b.rentable) {
    box(ctx, x + 80, y + 18, 100, 22, 4, '#263b32');
    label(ctx, 'À LOUER · H', x + 130, y + 33, 10, '#ffd1eb');
  }

  // Enseigne.
  box(ctx, x + 18, y + h - 73, w - 36, 27, 3, '#20313bcc');
  label(ctx, b.name, cx, y + h - 55, 11, '#eef2e6');
  if (b.name === 'COMMISSARIAT') {
    box(ctx, cx - 7, y + 76, 14, 28, 3, '#a9c8ed');
    box(ctx, cx - 14, y + 83, 28, 14, 3, '#a9c8ed');
  }

  // Marches, auvent rayé et porte vitrée.
  box(ctx, cx - 24, y + h, 48, 6, 2, '#d4d0bb');
  box(ctx, cx - 20, y + h + 6, 40, 5, 2, '#c4c0ab');
  box(ctx, cx - 17, y + h - 34, 34, 34, 3, '#293d49');
  box(ctx, cx - 14, y + h - 31, 13, 28, 2, '#4a7086');
  box(ctx, cx + 1, y + h - 31, 13, 28, 2, '#3f6177');
  disc(ctx, cx - 3, y + h - 17, 1.4, '#e8d9a0');
  disc(ctx, cx + 3, y + h - 17, 1.4, '#e8d9a0');
  box(ctx, cx - 26, y + h - 45, 52, 12, 3, '#ece6d2');
  ctx.fillStyle = shade(c, -.3);
  for (let s = 0; s < 8; s += 2) ctx.fillRect(cx - 26 + s * 6.5, y + h - 45, 6.5, 12);
  ctx.fillStyle = '#1f2f2a2a';
  ctx.fillRect(cx - 26, y + h - 33, 52, 3);
}

// Personnage : jambes et bras qui bougent quand il marche, cheveux et teint variés selon son identifiant.
export function person(ctx, p, time, moving) {
  const seed = hashText(p.id || p.name || 'x');
  const hair = ['#3c3436', '#5a3d2b', '#1f1d26', '#8a5a2f', '#b0833d'][seed % 5];
  const skin = ['#e3b998', '#d9a77f', '#c68b64', '#f0cfb2'][(seed >> 3) % 4];
  const swing = moving ? Math.sin(time / 85) : 0;
  const bob = moving ? -Math.abs(Math.sin(time / 85)) * 1.5 : 0;
  const x = p.x, y = p.y;

  box(ctx, x - 8, y + 13 + swing * 3, 6, 9, 2, '#293c4a');
  box(ctx, x + 2, y + 13 - swing * 3, 6, 9, 2, '#293c4a');
  box(ctx, x - 9, y + 20 + swing * 3, 8, 3, 1.5, '#1c2831');
  box(ctx, x + 1, y + 20 - swing * 3, 8, 3, 1.5, '#1c2831');
  box(ctx, x - 14, y - 2 + bob - swing * 2.5, 5, 13, 2.5, shade(p.color, -.22));
  box(ctx, x + 9, y - 2 + bob + swing * 2.5, 5, 13, 2.5, shade(p.color, -.22));
  disc(ctx, x - 11.5, y + 11 + bob - swing * 2.5, 2.3, skin);
  disc(ctx, x + 11.5, y + 11 + bob + swing * 2.5, 2.3, skin);
  box(ctx, x - 9, y - 4 + bob, 18, 22, 6, p.color);
  box(ctx, x - 9, y - 4 + bob, 18, 8, 6, shade(p.color, .2));
  ctx.fillStyle = '#00000022';
  ctx.fillRect(x - 9, y + 11 + bob, 18, 3);
  disc(ctx, x, y - 10 + bob, 9, skin);
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(x, y - 13 + bob, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  box(ctx, x - 9, y - 14 + bob, 18, 3, 1.5, hair);
  disc(ctx, x - 3, y - 9 + bob, 1.2, '#2b2523');
  disc(ctx, x + 3, y - 9 + bob, 1.2, '#2b2523');
}

// Fontaine animée du jardin : bassin en pierre, eau dégradée, ondes et jet central.
export function fountain(ctx, x, y, time) {
  disc(ctx, x, y, 52, '#1f33281f');
  disc(ctx, x, y, 50, '#c9c6ae');
  disc(ctx, x, y, 47, '#dedcc7');
  const water = ctx.createRadialGradient(x, y, 4, x, y, 38);
  water.addColorStop(0, '#a6dbde');
  water.addColorStop(1, '#5fa9bb');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const phase = (time / 1800 + k / 3) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(.55 * (1 - phase)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 8 + phase * 28, 0, Math.PI * 2);
    ctx.stroke();
  }
  disc(ctx, x, y, 9, '#d6d4be');
  disc(ctx, x, y, 5, '#eaf6f6');
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3 + time / 2400, r = 11 + Math.abs(Math.sin(time / 420 + k)) * 6;
    disc(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.8, '#f2fbfb');
  }
}
