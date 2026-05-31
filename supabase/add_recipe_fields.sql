-- Add recipe fields to meal_library
alter table meal_library
  add column if not exists description text,
  add column if not exists method jsonb default '[]',
  add column if not exists prep_time text,
  add column if not exists cook_time text,
  add column if not exists serves integer default 2;

-- Clear existing meals and reseed with proper recipes
delete from meal_library;

insert into meal_library (name, category, description, prep_time, cook_time, serves, ingredients, method, tags) values

-- SALMON
('Lemon & herb salmon with new potatoes',
 'salmon',
 'Crispy-skinned salmon with buttered new potatoes and a simple lemon herb sauce',
 '10 mins', '20 mins', 2,
 '[
   {"name":"Salmon fillets","qty":"2 (skin on)","aisle":"fish"},
   {"name":"New potatoes","qty":"500g","aisle":"produce"},
   {"name":"Lemon","qty":"1","aisle":"produce"},
   {"name":"Fresh dill","qty":"small bunch","aisle":"produce"},
   {"name":"Unsalted butter","qty":"50g","aisle":"dairy"},
   {"name":"Garlic","qty":"2 cloves","aisle":"produce"},
   {"name":"Olive oil","qty":"1 tbsp","aisle":"condiments"}
 ]',
 '[
   "Halve the new potatoes and boil in salted water for 15-18 mins until tender. Drain and toss with half the butter, season well.",
   "Pat the salmon dry with kitchen paper and season generously on both sides.",
   "Heat the olive oil in a non-stick pan over medium-high heat. Place salmon skin-side down and press gently for 30 seconds. Cook 4-5 mins until skin is crispy.",
   "Flip and cook a further 2 mins. The flesh should be just opaque.",
   "Melt remaining butter in the pan with the crushed garlic and a squeeze of lemon. Let it foam, then spoon over the salmon.",
   "Serve the salmon over the potatoes, topped with fresh dill and lemon wedges."
 ]',
 '{"fish","potato","quick"}'),

('Teriyaki salmon with jasmine rice',
 'salmon',
 'Glazed salmon in a sweet-savoury teriyaki sauce served with steamed jasmine rice and broccoli',
 '10 mins', '20 mins', 2,
 '[
   {"name":"Salmon fillets","qty":"2","aisle":"fish"},
   {"name":"Jasmine rice","qty":"200g","aisle":"dry goods"},
   {"name":"Tenderstem broccoli","qty":"200g","aisle":"produce"},
   {"name":"Soy sauce","qty":"3 tbsp","aisle":"condiments"},
   {"name":"Honey","qty":"2 tbsp","aisle":"dry goods"},
   {"name":"Rice vinegar","qty":"1 tbsp","aisle":"condiments"},
   {"name":"Garlic","qty":"2 cloves","aisle":"produce"},
   {"name":"Fresh ginger","qty":"1 tsp grated","aisle":"produce"},
   {"name":"Sesame seeds","qty":"1 tbsp","aisle":"dry goods"},
   {"name":"Spring onions","qty":"2","aisle":"produce"}
 ]',
 '[
   "Cook jasmine rice according to packet instructions.",
   "Mix together the soy sauce, honey, rice vinegar, grated ginger and crushed garlic to make the teriyaki glaze.",
   "Place the salmon in a shallow dish and spoon half the glaze over it. Leave to marinate for 5 mins.",
   "Heat a non-stick pan over medium-high heat. Cook the salmon skin-side up for 3 mins, then flip.",
   "Pour the remaining glaze into the pan and cook 3-4 mins more, basting the salmon as the sauce thickens.",
   "Meanwhile, blanch the broccoli in boiling salted water for 3 mins.",
   "Serve the salmon and broccoli over rice, spoon over any remaining sauce, scatter with sesame seeds and sliced spring onions."
 ]',
 '{"fish","rice","asian"}'),

('Honey garlic salmon with sweet potato mash',
 'salmon',
 'Pan-fried salmon in a sticky honey garlic sauce with smooth sweet potato mash',
 '10 mins', '25 mins', 2,
 '[
   {"name":"Salmon fillets","qty":"2 (skin on)","aisle":"fish"},
   {"name":"Sweet potatoes","qty":"600g","aisle":"produce"},
   {"name":"Honey","qty":"2 tbsp","aisle":"dry goods"},
   {"name":"Garlic","qty":"3 cloves","aisle":"produce"},
   {"name":"Soy sauce","qty":"1 tbsp","aisle":"condiments"},
   {"name":"Butter","qty":"40g","aisle":"dairy"},
   {"name":"Green beans","qty":"200g","aisle":"produce"},
   {"name":"Lemon","qty":"half","aisle":"produce"}
 ]',
 '[
   "Peel and cube the sweet potatoes. Boil in salted water for 15 mins until completely tender.",
   "Drain and mash with butter, season with salt and pepper. Keep warm.",
   "Mix honey, soy sauce and crushed garlic in a small bowl.",
   "Heat a little oil in a non-stick pan. Season the salmon and cook skin-side down for 4 mins until crispy.",
   "Flip the salmon, pour the honey garlic sauce into the pan and cook 2-3 mins, spooning sauce over as it bubbles.",
   "Blanch the green beans in boiling water for 3 mins.",
   "Plate the mash, top with salmon and spoon over the sauce. Serve with green beans and a squeeze of lemon."
 ]',
 '{"fish","potato"}'),

-- RICE
('Thai green chicken curry',
 'rice',
 'Aromatic, creamy Thai green curry with coconut milk and jasmine rice',
 '10 mins', '25 mins', 2,
 '[
   {"name":"Chicken breast","qty":"2 large","aisle":"meat"},
   {"name":"Jasmine rice","qty":"200g","aisle":"dry goods"},
   {"name":"Thai green curry paste","qty":"2-3 tbsp","aisle":"condiments"},
   {"name":"Coconut milk","qty":"400ml can","aisle":"dry goods"},
   {"name":"Courgette","qty":"1","aisle":"produce"},
   {"name":"Baby spinach","qty":"80g","aisle":"produce"},
   {"name":"Fish sauce","qty":"1 tbsp","aisle":"condiments"},
   {"name":"Lime","qty":"1","aisle":"produce"},
   {"name":"Fresh coriander","qty":"small bunch","aisle":"produce"},
   {"name":"Vegetable oil","qty":"1 tbsp","aisle":"condiments"}
 ]',
 '[
   "Cook jasmine rice according to packet instructions.",
   "Slice the chicken into strips and dice the courgette.",
   "Heat oil in a wide pan or wok over medium heat. Fry the curry paste for 2 mins until fragrant.",
   "Add the chicken and stir-fry for 3-4 mins until sealed all over.",
   "Pour in the coconut milk and add the courgette. Simmer gently for 10 mins until the chicken is cooked through.",
   "Stir in the fish sauce and a squeeze of lime. Taste and adjust seasoning.",
   "Add the spinach and let it wilt for 1 min.",
   "Serve over rice topped with fresh coriander and lime wedges."
 ]',
 '{"chicken","rice","curry","asian"}'),

('Chicken & chorizo rice',
 'rice',
 'One-pot Spanish-style rice with smoky chorizo, chicken thighs and roasted peppers',
 '10 mins', '40 mins', 2,
 '[
   {"name":"Chicken thighs (bone-in)","qty":"4","aisle":"meat"},
   {"name":"Chorizo","qty":"100g","aisle":"meat"},
   {"name":"Basmati rice","qty":"200g","aisle":"dry goods"},
   {"name":"Chicken stock","qty":"500ml","aisle":"dry goods"},
   {"name":"Tinned chopped tomatoes","qty":"400g can","aisle":"dry goods"},
   {"name":"Red pepper","qty":"1","aisle":"produce"},
   {"name":"Onion","qty":"1","aisle":"produce"},
   {"name":"Garlic","qty":"3 cloves","aisle":"produce"},
   {"name":"Smoked paprika","qty":"1.5 tsp","aisle":"spices"},
   {"name":"Olive oil","qty":"1 tbsp","aisle":"condiments"}
 ]',
 '[
   "Season the chicken thighs with smoked paprika, salt and pepper.",
   "Heat oil in a large wide pan. Brown the chicken skin-side down for 5 mins until golden. Remove and set aside.",
   "In the same pan, fry the sliced chorizo for 2 mins until it releases its oil.",
   "Add the diced onion and pepper. Cook 5 mins until softened.",
   "Stir in the crushed garlic and remaining paprika. Cook 1 min.",
   "Add the rice and stir to coat in the oil. Pour in the tomatoes and stock. Stir well.",
   "Nestle the chicken thighs on top, skin-side up. Bring to a simmer, cover and cook 25 mins on low heat.",
   "Remove the lid for the last 5 mins to crisp the chicken skin. Rest 5 mins before serving."
 ]',
 '{"chicken","rice","one-pot","spanish"}'),

('Prawn fried rice',
 'rice',
 'Quick wok-fried rice with king prawns, egg and vegetables',
 '10 mins', '15 mins', 2,
 '[
   {"name":"King prawns (raw)","qty":"250g","aisle":"fish"},
   {"name":"Cooked long-grain rice","qty":"300g (day-old is best)","aisle":"dry goods"},
   {"name":"Eggs","qty":"2","aisle":"dairy"},
   {"name":"Frozen peas","qty":"100g","aisle":"frozen"},
   {"name":"Spring onions","qty":"4","aisle":"produce"},
   {"name":"Soy sauce","qty":"3 tbsp","aisle":"condiments"},
   {"name":"Sesame oil","qty":"1 tbsp","aisle":"condiments"},
   {"name":"Garlic","qty":"2 cloves","aisle":"produce"},
   {"name":"Fresh ginger","qty":"1 tsp grated","aisle":"produce"},
   {"name":"Vegetable oil","qty":"2 tbsp","aisle":"condiments"}
 ]',
 '[
   "Heat a wok or large frying pan over the highest heat possible until smoking.",
   "Add 1 tbsp oil and stir-fry the prawns with garlic and ginger for 2 mins until pink. Remove and set aside.",
   "Add another tbsp oil. Break in the eggs and scramble quickly, then push to one side.",
   "Add the rice, breaking up any clumps. Stir-fry 3-4 mins until heated through and beginning to crisp.",
   "Add the peas and sliced spring onions. Toss everything together.",
   "Return the prawns to the wok. Drizzle over the soy sauce and sesame oil. Toss well.",
   "Serve immediately."
 ]',
 '{"prawns","rice","asian","quick"}'),

-- PASTA
('Spaghetti bolognese',
 'pasta',
 'A proper slow-cooked ragu that fills the whole house with the smell of Sunday dinner',
 '15 mins', '45 mins', 2,
 '[
   {"name":"Beef mince (15% fat)","qty":"400g","aisle":"meat"},
   {"name":"Spaghetti","qty":"200g","aisle":"dry goods"},
   {"name":"Tinned chopped tomatoes","qty":"400g can","aisle":"dry goods"},
   {"name":"Tomato puree","qty":"2 tbsp","aisle":"condiments"},
   {"name":"Onion","qty":"1","aisle":"produce"},
   {"name":"Carrot","qty":"1","aisle":"produce"},
   {"name":"Celery","qty":"2 sticks","aisle":"produce"},
   {"name":"Garlic","qty":"3 cloves","aisle":"produce"},
   {"name":"Red wine","qty":"100ml","aisle":"alcohol"},
   {"name":"Beef stock","qty":"150ml","aisle":"dry goods"},
   {"name":"Parmesan","qty":"to serve","aisle":"dairy"},
   {"name":"Olive oil","qty":"2 tbsp","aisle":"condiments"}
 ]',
 '[
   "Finely dice the onion, carrot and celery. Cook in olive oil over low heat for 10 mins until soft but not coloured.",
   "Turn the heat up to medium-high. Add the mince and break it up with a spoon. Cook until browned all over, about 5-6 mins. Season well.",
   "Add the crushed garlic and tomato puree. Cook 2 mins.",
   "Pour in the red wine and let it bubble for 2 mins until reduced by half.",
   "Add the tinned tomatoes and beef stock. Stir well, bring to a simmer.",
   "Reduce heat to very low and cook, partially covered, for at least 30 mins. Top up with a splash of water if it thickens too much.",
   "Cook the spaghetti in well-salted boiling water until al dente. Reserve a cup of pasta water before draining.",
   "Toss the pasta with the ragu, adding a splash of pasta water to loosen. Serve with grated parmesan."
 ]',
 '{"beef","pasta","classic"}'),

('Creamy mushroom tagliatelle',
 'pasta',
 'Earthy wild mushrooms in a rich, garlicky cream sauce with fresh tagliatelle',
 '10 mins', '20 mins', 2,
 '[
   {"name":"Tagliatelle (fresh or dried)","qty":"200g","aisle":"dry goods"},
   {"name":"Mixed mushrooms (chestnut, shiitake, oyster)","qty":"350g","aisle":"produce"},
   {"name":"Double cream","qty":"150ml","aisle":"dairy"},
   {"name":"Garlic","qty":"3 cloves","aisle":"produce"},
   {"name":"Shallot","qty":"1","aisle":"produce"},
   {"name":"Dry white wine","qty":"100ml","aisle":"alcohol"},
   {"name":"Parmesan","qty":"40g","aisle":"dairy"},
   {"name":"Fresh thyme","qty":"4 sprigs","aisle":"produce"},
   {"name":"Unsalted butter","qty":"30g","aisle":"dairy"},
   {"name":"Flat-leaf parsley","qty":"small bunch","aisle":"produce"}
 ]',
 '[
   "Cook tagliatelle in well-salted boiling water until al dente. Reserve a cup of pasta water, then drain.",
   "Tear or slice the mushrooms into large pieces - you want texture, not mush.",
   "Melt butter in a large frying pan over high heat. Add mushrooms in a single layer and leave untouched for 2 mins to colour. Toss and cook another 2 mins. Season well.",
   "Reduce heat to medium. Add finely sliced shallot, crushed garlic and thyme leaves. Cook 3 mins.",
   "Pour in the wine and let it bubble 2 mins until almost gone.",
   "Add the cream and simmer 3-4 mins until slightly thickened.",
   "Add the drained pasta and a splash of pasta water. Toss until coated and glossy. Stir in half the parmesan.",
   "Serve topped with remaining parmesan and chopped parsley."
 ]',
 '{"vegetarian","pasta","creamy"}'),

('Pesto pasta with roasted cherry tomatoes',
 'pasta',
 'Simple and vibrant - sweet roasted tomatoes, good pesto and al dente pasta',
 '5 mins', '25 mins', 2,
 '[
   {"name":"Penne or fusilli","qty":"200g","aisle":"dry goods"},
   {"name":"Cherry tomatoes","qty":"300g","aisle":"produce"},
   {"name":"Good quality pesto","qty":"4 tbsp","aisle":"condiments"},
   {"name":"Parmesan","qty":"30g","aisle":"dairy"},
   {"name":"Pine nuts","qty":"2 tbsp","aisle":"dry goods"},
   {"name":"Garlic","qty":"2 cloves","aisle":"produce"},
   {"name":"Olive oil","qty":"2 tbsp","aisle":"condiments"},
   {"name":"Fresh basil","qty":"small bunch","aisle":"produce"}
 ]',
 '[
   "Preheat oven to 200C. Toss the cherry tomatoes with 1 tbsp olive oil, the garlic cloves (leave whole) and seasoning. Roast 20 mins until blistered and jammy.",
   "Toast the pine nuts in a dry pan for 2-3 mins, tossing often, until golden. Set aside.",
   "Cook pasta in well-salted boiling water until al dente. Reserve half a cup of pasta water before draining.",
   "Squeeze the roasted garlic out of its skin and mix into the tomatoes.",
   "Toss the hot drained pasta with the pesto, adding pasta water 1 tbsp at a time until silky.",
   "Fold through the roasted tomatoes.",
   "Serve topped with parmesan, toasted pine nuts and fresh basil."
 ]',
 '{"vegetarian","pasta","quick"}'),

-- EASY
('Jacket potato with tuna mayo',
 'easy',
 'Perfectly crispy-skinned baked potato loaded with classic tuna mayo',
 '5 mins', '70 mins', 2,
 '[
   {"name":"Large baking potatoes","qty":"2","aisle":"produce"},
   {"name":"Tinned tuna in spring water","qty":"2 x 145g cans","aisle":"dry goods"},
   {"name":"Mayonnaise","qty":"4 tbsp","aisle":"condiments"},
   {"name":"Sweetcorn","qty":"200g can","aisle":"dry goods"},
   {"name":"Spring onions","qty":"3","aisle":"produce"},
   {"name":"Cheddar","qty":"60g (optional)","aisle":"dairy"},
   {"name":"Olive oil","qty":"1 tsp","aisle":"condiments"}
 ]',
 '[
   "Preheat oven to 220C. Scrub the potatoes and dry well. Rub with olive oil and a good pinch of salt.",
   "Bake directly on the oven rack for 60-70 mins until the skin is crispy and the centre is completely soft (test with a skewer).",
   "Drain the tuna and sweetcorn. Mix together with mayonnaise and sliced spring onions. Season well.",
   "Cut the potatoes open and fluff the inside with a fork.",
   "Pile the tuna mayo inside. Add grated cheddar on top if you like, and grill for 2-3 mins to melt."
 ]',
 '{"quick","easy"}'),

('Vegetable frittata',
 'easy',
 'A hearty oven-baked Italian omelette - great for using up whatever veg is in the fridge',
 '10 mins', '20 mins', 2,
 '[
   {"name":"Eggs","qty":"6 large","aisle":"dairy"},
   {"name":"Courgette","qty":"1 small","aisle":"produce"},
   {"name":"Red pepper","qty":"1","aisle":"produce"},
   {"name":"Cherry tomatoes","qty":"100g","aisle":"produce"},
   {"name":"Cheddar or feta","qty":"60g","aisle":"dairy"},
   {"name":"Garlic","qty":"2 cloves","aisle":"produce"},
   {"name":"Fresh basil or parsley","qty":"small bunch","aisle":"produce"},
   {"name":"Olive oil","qty":"1 tbsp","aisle":"condiments"}
 ]',
 '[
   "Preheat oven to 200C. Slice the courgette and pepper into small pieces.",
   "Heat olive oil in an ovenproof frying pan. Cook the courgette and pepper over medium heat for 5 mins until softened.",
   "Add the crushed garlic and cook 1 min more. Season well.",
   "Beat the eggs in a jug, season well, and add half the cheese and the chopped herbs.",
   "Pour the egg mixture over the vegetables. Halve the cherry tomatoes and press them into the top. Scatter over the remaining cheese.",
   "Cook on the hob for 2-3 mins until the edges are just set, then transfer to the oven.",
   "Bake 10-12 mins until the top is golden and the centre is just set. Leave to rest 5 mins before slicing. Serve with a green salad."
 ]',
 '{"vegetarian","easy"}')

on conflict do nothing;
