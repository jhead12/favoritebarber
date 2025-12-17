/*
Generate a single PDF from slide PNGs using PDFKit.
Usage:
  cd presentation
  npm install
  node generate_pdf.js
Output: presentation/Favorite_Barber_Pitch.pdf
*/

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outFile = path.join(__dirname, 'Favorite_Barber_Pitch.pdf');
const slidesDir = path.join(__dirname, 'slides_png');

const files = fs.readdirSync(slidesDir).filter(f => f.endsWith('.png')).sort();
if (!files.length) {
  console.error('No slide PNGs found in', slidesDir);
  process.exit(1);
}

const doc = new PDFDocument({ autoFirstPage: false });
const out = fs.createWriteStream(outFile);
doc.pipe(out);

files.forEach(f => {
  const imgPath = path.join(slidesDir, f);
  const img = fs.readFileSync(imgPath);
  const { width, height } = require('image-size')(img);
  doc.addPage({ size: [width, height] });
  doc.image(imgPath, 0, 0, { width: width });
});

doc.end();
out.on('finish', () => console.log('PDF written:', outFile));
