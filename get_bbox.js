const fs = require('fs');
const svg = fs.readFileSync('static/img/orio.svg', 'utf8');
const paths = svg.match(/d="([^"]+)"/g);
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

paths.forEach(path => {
  const coords = path.replace(/d="/, '').replace(/"/, '').split(/[\s,MCmclz]+/).filter(Boolean);
  let currentX = 0, currentY = 0;
  // This is a naive parser. Let's just find all numbers and get min/max.
  // Wait, relative commands (m, c, l) are relative to previous. This naive parser won't work well for relative paths.
});
