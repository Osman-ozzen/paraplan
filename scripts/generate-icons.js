// Icon oluşturucu - Bütçe Takip PWA ikonları
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Arkaplan gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // B harfi
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.55}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', size / 2, size / 2 + size * 0.02);

  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), canvas.toBuffer('image/png'));
  console.log(`✓ icon-${size}.png oluşturuldu`);
});
