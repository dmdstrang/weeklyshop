-- Weekly Meal Planner Schema

-- Meal library
create table if not exists meal_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- 'salmon', 'rice', 'pasta', 'easy', 'basics'
  ingredients jsonb not null default '[]',
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Weekly meal plan
create table if not exists meal_plan (
  id uuid primary key default gen_random_uuid(),
  week_start date not null, -- always a Monday
  day text not null, -- 'monday' .. 'sunday'
  meal_id uuid references meal_library(id) on delete set null,
  custom_meal text, -- free-text override if not in library
  notes text,
  is_out boolean default false, -- out for dinner, no meal needed
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (week_start, day)
);

-- Shopping list
create table if not exists shopping_list (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  items jsonb not null default '[]',
  sent_to_sainsburys boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Preferences
create table if not exists preferences (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Enable realtime on meal_plan and shopping_list
alter publication supabase_realtime add table meal_plan;
alter publication supabase_realtime add table shopping_list;

-- Seed meal library
insert into meal_library (name, category, ingredients, tags) values
  ('Lemon herb salmon & new potatoes', 'salmon', '[
    {"name": "Salmon fillets", "qty": "2", "aisle": "fish"},
    {"name": "New potatoes", "qty": "500g", "aisle": "produce"},
    {"name": "Lemon", "qty": "1", "aisle": "produce"},
    {"name": "Fresh dill", "qty": "1 bunch", "aisle": "produce"},
    {"name": "Butter", "qty": "50g", "aisle": "dairy"},
    {"name": "Garlic", "qty": "2 cloves", "aisle": "produce"}
  ]', '{"fish", "potato", "quick"}'),

  ('Teriyaki salmon with jasmine rice', 'salmon', '[
    {"name": "Salmon fillets", "qty": "2", "aisle": "fish"},
    {"name": "Jasmine rice", "qty": "300g", "aisle": "dry goods"},
    {"name": "Teriyaki sauce", "qty": "4 tbsp", "aisle": "condiments"},
    {"name": "Spring onions", "qty": "4", "aisle": "produce"},
    {"name": "Sesame seeds", "qty": "1 tbsp", "aisle": "dry goods"},
    {"name": "Tenderstem broccoli", "qty": "200g", "aisle": "produce"}
  ]', '{"fish", "rice", "asian"}'),

  ('Honey garlic salmon & sweet potato mash', 'salmon', '[
    {"name": "Salmon fillets", "qty": "2", "aisle": "fish"},
    {"name": "Sweet potatoes", "qty": "600g", "aisle": "produce"},
    {"name": "Honey", "qty": "2 tbsp", "aisle": "dry goods"},
    {"name": "Garlic", "qty": "3 cloves", "aisle": "produce"},
    {"name": "Butter", "qty": "50g", "aisle": "dairy"},
    {"name": "Green beans", "qty": "200g", "aisle": "produce"}
  ]', '{"fish", "potato"}'),

  ('Chicken stir-fry with noodles', 'rice', '[
    {"name": "Chicken breast", "qty": "2", "aisle": "meat"},
    {"name": "Egg noodles", "qty": "300g", "aisle": "dry goods"},
    {"name": "Mixed stir-fry veg", "qty": "400g", "aisle": "produce"},
    {"name": "Soy sauce", "qty": "3 tbsp", "aisle": "condiments"},
    {"name": "Sesame oil", "qty": "1 tbsp", "aisle": "condiments"},
    {"name": "Ginger", "qty": "thumb-size", "aisle": "produce"}
  ]', '{"chicken", "noodles", "asian", "quick"}'),

  ('Thai green curry with rice', 'rice', '[
    {"name": "Chicken breast", "qty": "2", "aisle": "meat"},
    {"name": "Jasmine rice", "qty": "300g", "aisle": "dry goods"},
    {"name": "Thai green curry paste", "qty": "2 tbsp", "aisle": "condiments"},
    {"name": "Coconut milk", "qty": "400ml can", "aisle": "dry goods"},
    {"name": "Baby spinach", "qty": "100g", "aisle": "produce"},
    {"name": "Courgette", "qty": "1", "aisle": "produce"},
    {"name": "Lime", "qty": "1", "aisle": "produce"}
  ]', '{"chicken", "rice", "curry", "asian"}'),

  ('Prawn fried rice', 'rice', '[
    {"name": "King prawns", "qty": "250g", "aisle": "fish"},
    {"name": "Cooked rice", "qty": "300g", "aisle": "dry goods"},
    {"name": "Eggs", "qty": "2", "aisle": "dairy"},
    {"name": "Frozen peas", "qty": "100g", "aisle": "frozen"},
    {"name": "Soy sauce", "qty": "3 tbsp", "aisle": "condiments"},
    {"name": "Spring onions", "qty": "4", "aisle": "produce"},
    {"name": "Sesame oil", "qty": "1 tbsp", "aisle": "condiments"}
  ]', '{"prawns", "rice", "asian", "quick"}'),

  ('Chicken & chorizo rice', 'rice', '[
    {"name": "Chicken thighs", "qty": "4", "aisle": "meat"},
    {"name": "Chorizo", "qty": "150g", "aisle": "meat"},
    {"name": "Basmati rice", "qty": "300g", "aisle": "dry goods"},
    {"name": "Chicken stock", "qty": "500ml", "aisle": "dry goods"},
    {"name": "Tinned tomatoes", "qty": "400g can", "aisle": "dry goods"},
    {"name": "Red pepper", "qty": "1", "aisle": "produce"},
    {"name": "Smoked paprika", "qty": "1 tsp", "aisle": "spices"}
  ]', '{"chicken", "rice", "one-pot"}'),

  ('Spaghetti bolognese', 'pasta', '[
    {"name": "Beef mince", "qty": "500g", "aisle": "meat"},
    {"name": "Spaghetti", "qty": "400g", "aisle": "dry goods"},
    {"name": "Tinned tomatoes", "qty": "2 x 400g cans", "aisle": "dry goods"},
    {"name": "Onion", "qty": "1", "aisle": "produce"},
    {"name": "Garlic", "qty": "3 cloves", "aisle": "produce"},
    {"name": "Carrot", "qty": "1", "aisle": "produce"},
    {"name": "Parmesan", "qty": "50g", "aisle": "dairy"},
    {"name": "Tomato puree", "qty": "2 tbsp", "aisle": "condiments"}
  ]', '{"beef", "pasta", "classic"}'),

  ('Pesto pasta with roasted veg', 'pasta', '[
    {"name": "Penne pasta", "qty": "400g", "aisle": "dry goods"},
    {"name": "Pesto", "qty": "190g jar", "aisle": "condiments"},
    {"name": "Cherry tomatoes", "qty": "250g", "aisle": "produce"},
    {"name": "Courgette", "qty": "1", "aisle": "produce"},
    {"name": "Red pepper", "qty": "1", "aisle": "produce"},
    {"name": "Parmesan", "qty": "50g", "aisle": "dairy"},
    {"name": "Pine nuts", "qty": "30g", "aisle": "dry goods"}
  ]', '{"vegetarian", "pasta", "quick"}'),

  ('Creamy mushroom tagliatelle', 'pasta', '[
    {"name": "Tagliatelle", "qty": "400g", "aisle": "dry goods"},
    {"name": "Mixed mushrooms", "qty": "400g", "aisle": "produce"},
    {"name": "Double cream", "qty": "200ml", "aisle": "dairy"},
    {"name": "Garlic", "qty": "3 cloves", "aisle": "produce"},
    {"name": "Parmesan", "qty": "50g", "aisle": "dairy"},
    {"name": "Fresh thyme", "qty": "4 sprigs", "aisle": "produce"},
    {"name": "White wine", "qty": "100ml", "aisle": "alcohol"}
  ]', '{"vegetarian", "pasta", "creamy"}'),

  ('Chicken pasta bake', 'pasta', '[
    {"name": "Chicken breast", "qty": "2", "aisle": "meat"},
    {"name": "Penne pasta", "qty": "400g", "aisle": "dry goods"},
    {"name": "Passata", "qty": "500g", "aisle": "dry goods"},
    {"name": "Cheddar", "qty": "100g", "aisle": "dairy"},
    {"name": "Mozzarella", "qty": "125g", "aisle": "dairy"},
    {"name": "Onion", "qty": "1", "aisle": "produce"},
    {"name": "Garlic", "qty": "2 cloves", "aisle": "produce"}
  ]', '{"chicken", "pasta", "bake"}'),

  ('Jacket potato with beans & cheese', 'easy', '[
    {"name": "Baking potatoes", "qty": "2 large", "aisle": "produce"},
    {"name": "Baked beans", "qty": "400g can", "aisle": "dry goods"},
    {"name": "Cheddar", "qty": "100g", "aisle": "dairy"},
    {"name": "Butter", "qty": "30g", "aisle": "dairy"},
    {"name": "Soured cream", "qty": "100ml", "aisle": "dairy"}
  ]', '{"vegetarian", "easy", "quick"}'),

  ('Veggie omelette with salad', 'easy', '[
    {"name": "Eggs", "qty": "4", "aisle": "dairy"},
    {"name": "Cheddar", "qty": "75g", "aisle": "dairy"},
    {"name": "Cherry tomatoes", "qty": "100g", "aisle": "produce"},
    {"name": "Mixed salad leaves", "qty": "80g bag", "aisle": "produce"},
    {"name": "Mushrooms", "qty": "100g", "aisle": "produce"},
    {"name": "Butter", "qty": "20g", "aisle": "dairy"}
  ]', '{"vegetarian", "easy", "quick"}'),

  ('Tomato soup with crusty bread', 'easy', '[
    {"name": "Tinned tomatoes", "qty": "2 x 400g cans", "aisle": "dry goods"},
    {"name": "Sourdough loaf", "qty": "1", "aisle": "bakery"},
    {"name": "Onion", "qty": "1", "aisle": "produce"},
    {"name": "Garlic", "qty": "2 cloves", "aisle": "produce"},
    {"name": "Vegetable stock", "qty": "500ml", "aisle": "dry goods"},
    {"name": "Butter", "qty": "30g", "aisle": "dairy"},
    {"name": "Double cream", "qty": "50ml", "aisle": "dairy"}
  ]', '{"vegetarian", "easy", "soup"}')

on conflict do nothing;
