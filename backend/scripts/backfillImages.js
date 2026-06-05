// One-time: generate images for all meals that don't have one.
// Run locally:  node scripts/backfillImages.js
import 'dotenv/config';
import { supabase } from '../lib/supabase.js';
import { ensureBucket, generateMealImage } from '../lib/images.js';

async function main() {
  await ensureBucket();

  const { data: meals, error } = await supabase
    .from('meal_library').select('*').is('image_url', null);

  if (error) { console.error(error.message); process.exit(1); }
  console.log(`${meals.length} meals need images.\n`);

  for (const meal of meals) {
    process.stdout.write(`Generating "${meal.name}"… `);
    try {
      await generateMealImage(meal);
      console.log('✓');
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }
  console.log('\nDone.');
  process.exit(0);
}

main();
