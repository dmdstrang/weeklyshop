-- Add user rating to meal_library
alter table meal_library
  add column if not exists user_rating text check (user_rating in ('liked', 'disliked')) default null;
