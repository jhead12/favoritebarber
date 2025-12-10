// Simple runnable stub for image analysis pipeline.
// This script simulates analysis results for image relevance/authenticity
// It does NOT call external vision APIs — replace the `analyzeRemoteImage` stub
// with real API calls (Google Vision / OpenAI Vision) in production.

const SAMPLE_IMAGES = [
  { id: 'img1', url: 'https://s3.example.com/uploads/barber-shop-1.jpg', source: 'yelp' },
  { id: 'img2', url: 'https://example.com/photos/landscape.jpg', source: 'scraped' },
  { id: 'img3', url: 'https://images.yelp.com/photo-abc123.jpg', source: 'yelp' }
];

function analyzeRemoteImage(image) {
  // Simulate vision model outputs using heuristics on URL and source
  const lower = (image.url || '').toLowerCase();
  const res = {
    provenance_score: image.source === 'yelp' ? 0.25 : 0.05,
    objects: {},
    faces: { count: 0, score: 0 },
    ocr: { text: null, score: 0 },
    p_hash: `phash-${image.id}`
  };

  if (lower.includes('barber') || lower.includes('shop') || lower.includes('hair')) {
    res.objects.barber_chair = 0.9;
    res.objects.scissors = 0.3;
    res.faces = { count: 1, score: 0.12 };
  } else if (lower.includes('landscape') || lower.includes('mountain')) {
    res.objects.landscape = 0.95;
  } else {
    res.objects.unknown = 0.1;
  }

  // Compute a final relevance/authenticity score using example weights
  const object_score = Math.min(1, Object.values(res.objects).reduce((a,b)=>a+b,0));
  const face_score = res.faces.score || 0;
  const provenance = res.provenance_score;
  const uniqueness = 0.05; // stub

  const relevance = Math.min(1, object_score * 0.6 + face_score * 0.15 + provenance * 0.15 + uniqueness * 0.1);
  const authenticity = Math.min(1, relevance * (1 + provenance));

  return {
    image_id: image.id,
    analysis: res,
    relevance_score: Number(relevance.toFixed(3)),
    authenticity_score: Number(authenticity.toFixed(3)),
    analyzed_at: new Date().toISOString()
  };
}

function main() {
  console.log('Running image_processor_stub analysis for sample images...');
  for (const img of SAMPLE_IMAGES) {
    const out = analyzeRemoteImage(img);
    console.log('Image:', img.id, img.url);
    console.log(' Analysis:', JSON.stringify(out, null, 2));
    console.log('---');
  }
}

if (require.main === module) main();

module.exports = { analyzeRemoteImage };
