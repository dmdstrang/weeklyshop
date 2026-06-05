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
  return `A beautiful, appetising overhead food photograph of "${meal.name}". `
    + `Plated on a simple ceramic plate, soft natural daylight, shallow depth of field, `
    + `clean minimal light background, professional food photography. No text, no hands, no cutlery clutter.`;
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
  const imageUrl = pub.publicUrl;

  // Save URL back to the meal
  await supabase.from('meal_library').update({ image_url: imageUrl }).eq('id', meal.id);

  return imageUrl;
}
