-- Add image URL to meal_library
alter table meal_library
  add column if not exists image_url text;

-- Note: the 'meal-images' storage bucket is created automatically by the
-- backend on startup (see backend/lib/storage.js). It is public-read.
