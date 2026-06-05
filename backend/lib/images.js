import OpenAI from 'openai';
import { supabase } from './supabase.js';

const BUCKET = 'meal-images';
let openai = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

// Ensure the public storage bucket exists (idempotent)
export async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    console.log(`Created storage bucket: ${BUCKET}`);
  }
}

function promptFor(meal) {
  return `A wide, pulled-back food photograph showing a full place setting of "${meal.name}". `
    + `The meal is served on a colourful hand-painted patterned ceramic plate (Mediterranean majolica style), `
    + `sitting on a table covered with a bright, cheerfully patterned Mediterranean tablecloth. `
    + `The entire plate is visible with plenty of the colourful tablecloth surrounding it. `
    + `Shot from a 35-degree angle showing the table setting, not a close-up. `
    + `Warm sunny natural daylight, rich saturated colours, rustic Mediterranean styling, `
    + `professional food photography. No text, no hands, no faces.`;
}

/**
 * Generate an image for a meal, upload to Supabase Storage, return the public URL.
 */
export async function generateMealImage(meal) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const result = await getOpenAI().images.generate({
    model: 'gpt-image-1',
    prompt: promptFor(meal),
    size: '1024x1024',
    quality: 'medium',
    n: 1,
  });

  const b64 = result.data[0].b64_json;
  const buffer = Buffer.from(b64, 'base64');
  const path = `${meal.id}.png`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust: same filename is reused on regenerate, so add a version param
  const imageUrl = `${pub.publicUrl}?v=${Date.now()}`;

  // Save URL back to the meal
  await supabase.from('meal_library').update({ image_url: imageUrl }).eq('id', meal.id);

  return imageUrl;
}
