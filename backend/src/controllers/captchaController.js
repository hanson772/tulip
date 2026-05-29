const crypto = require("crypto");
const cache = require("../util/cache");

const CHAR_SET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SVG_WIDTH = 120;
const SVG_HEIGHT = 44;

function generateCode() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
  }
  return code;
}

function generateSvg(code) {
  const colors = [
    "#409EFF",
    "#67C23A",
    "#E6A23C",
    "#F56C6C",
    "#9B59B6",
    "#1ABC9C",
    "#E67E22",
    "#3498DB",
  ];
  const fonts = [
    "monospace,sans-serif",
    "Arial,sans-serif",
    "Verdana,sans-serif",
    "Georgia,serif",
  ];
  const charSpacing = (SVG_WIDTH - 20) / code.length;

  // Noise lines
  const lines = [];
  const lineCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < lineCount; i++) {
    const x1 = Math.floor(Math.random() * 20) + 5;
    const y1 = Math.floor(Math.random() * 30) + 8;
    const x2 = Math.floor(Math.random() * 20) + SVG_WIDTH - 30;
    const y2 = Math.floor(Math.random() * 30) + 8;
    const color = colors[Math.floor(Math.random() * colors.length)];
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.35"/>`,
    );
  }

  // Noise dots
  const dots = [];
  const dotCount = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < dotCount; i++) {
    const cx = Math.floor(Math.random() * (SVG_WIDTH - 10)) + 5;
    const cy = Math.floor(Math.random() * (SVG_HEIGHT - 10)) + 5;
    const r = Math.random() * 1.5 + 0.5;
    dots.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#bbb" opacity="0.4"/>`,
    );
  }

  // Characters
  const chars = code.split("").map((ch, i) => {
    const baseX = 12 + i * charSpacing + Math.floor(Math.random() * 6 - 3);
    const baseY = 28 + Math.floor(Math.random() * 6 - 3);
    const rotation = Math.floor(Math.random() * 25 - 12);
    const fontSize = Math.floor(Math.random() * 7) + 20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    return `<text x="${baseX}" y="${baseY}" font-family="${font}" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotation},${baseX},${baseY})">${ch}</text>`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">`,
    '<rect width="100%" height="100%" fill="#f5f7fa" rx="4"/>',
    ...lines,
    ...dots,
    ...chars,
    "</svg>",
  ].join("");
}

const getCaptcha = (req, res) => {
  try {
    const code = generateCode();
    const requestId = crypto.randomUUID();
    cache.set(`captcha:${requestId}`, code, 60);
    const svg = generateSvg(code);
    res.json({ requestId, svg });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate captcha" });
  }
};

function validateCaptcha(requestId, userCode) {
  const key = `captcha:${requestId}`;
  const stored = cache.get(key);
  cache.del(key); // one-time use regardless of outcome
  if (!stored) {
    return { valid: false, reason: "验证码已过期" };
  }
  if (userCode.toUpperCase() !== stored) {
    return { valid: false, reason: "验证码不正确" };
  }
  return { valid: true };
}

module.exports = { getCaptcha, validateCaptcha };
