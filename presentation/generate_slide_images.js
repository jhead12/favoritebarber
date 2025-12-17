/*
Generate PNG images (1920x1080) for each slide by opening the PPTX in the browser via data URL is not straightforward.
Instead, we'll render slides from the slide markdown as HTML templates and capture them with Puppeteer.

Usage:
  cd presentation
  npm install
  npm run build-images

Output: presentation/slides_png/slide-1.png ... slide-6.png
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const slidesMd = fs.readFileSync(path.join(__dirname, 'slides.md'), 'utf8');
const slides = slidesMd.split('\n\n').map(s => s.trim()).filter(Boolean);

const outDir = path.join(__dirname, 'slides_png');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function renderSlideHtml(title, content, index) {
  const logoPath = path.join(__dirname, '..', 'web', 'public', 'logo.png');
  const logoData = fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}` : null;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @media screen {
      body { margin:0; padding:0; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
      .slide { width:1920px; height:1080px; display:flex; background: linear-gradient(180deg,#FFFFFF,#F7F9FC); color:#111; }
      .left { padding:100px; width:100%; }
      h1 { font-size:72px; margin:0 0 18px 0; color:#0B2545; letter-spacing:-1px }
      h2 { font-size:30px; margin:0 0 16px 0; color:#6B7280 }
      p { font-size:28px; line-height:1.25; color:#0F1724 }
      ul { font-size:28px; color:#0F1724; padding-left:18px }
      li { margin-bottom:12px }
      .logo { position:absolute; right:56px; bottom:56px; width:120px; }
      .footer { position:absolute; left:100px; bottom:56px; color:#6B7280; font-size:16px }
      .accent { color:#F59E0B }
    }
  </style>
</head>
<body>
  <div class="slide">
    <div class="left">
      <h1>${title}</h1>
      <div>${content}</div>
    </div>
    ${logoData ? `<img class="logo" src="${logoData}"/>` : ''}
    <div class="footer">Favorite Barber — 5-minute pitch</div>
  </div>
</body>
</html>`;
}

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const lines = s.split('\n');
    const title = lines[0].replace(/Slide \d+ — /,'').trim();
    const content = lines.slice(1).map(l => `<p>${l}</p>`).join('');
    const html = renderSlideHtml(title, content, i+1);
    const tmp = path.join(outDir, `slide-${i+1}.html`);
    fs.writeFileSync(tmp, html, 'utf8');
    await page.goto(`file:${tmp}`);
    await page.screenshot({ path: path.join(outDir, `slide-${i+1}.png`) });
    console.log('Wrote', path.join(outDir, `slide-${i+1}.png`));
  }

  await browser.close();
})();
