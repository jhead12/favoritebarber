// TODO: implement image processing worker
// Responsibilities:
// - Download image (if allowed), run moderation (Google Vision SafeSearch), run label detection
// - Compute embeddings (CLIP / OpenAI embeddings)
// - Persist analysis to `image_analyses`

export async function processImageJob(imageUrl: string, imageId: number) {
  console.log('processImageJob', { imageUrl, imageId });
}
