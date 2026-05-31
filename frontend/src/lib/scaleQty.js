/**
 * Scale a quantity string by a ratio.
 * e.g. scaleQty("500g", 1.33) => "665g"
 *      scaleQty("2 (skin on)", 1.5) => "3 (skin on)"
 *      scaleQty("small bunch", 1.5) => "small bunch"  (no number — unchanged)
 *      scaleQty("2-3 tbsp", 1.5) => "3-5 tbsp"
 */
export function scaleQty(qtyStr, scale) {
  if (!qtyStr || scale === 1) return qtyStr;

  return qtyStr.replace(/(\d+(?:\.\d+)?)/g, (_, num) => {
    const scaled = parseFloat(num) * scale;
    // Round to a sensible number
    if (scaled >= 100) return Math.round(scaled).toString();
    if (scaled >= 10)  return Math.round(scaled * 2) / 2 + '';   // nearest 0.5
    if (scaled >= 1)   return Math.round(scaled * 4) / 4 + '';   // nearest 0.25
    return Math.round(scaled * 8) / 8 + '';                       // nearest 0.125
  });
}

/**
 * Scale all ingredients in a meal by (serves / basedServes).
 */
export function scaleIngredients(ingredients, serves, baseServes = 3) {
  if (serves === baseServes) return ingredients;
  const ratio = serves / baseServes;
  return ingredients.map(ing => ({
    ...ing,
    qty: scaleQty(ing.qty, ratio),
  }));
}

/**
 * Given a step's text, find which ingredients are mentioned in it.
 * Returns the matched (scaled) ingredients so the cooking view can show them.
 */
export function ingredientsForStep(stepText, ingredients) {
  const lower = stepText.toLowerCase();
  return ingredients.filter(ing => {
    // Match on the first significant word of the ingredient name (e.g. "salmon", "garlic")
    const words = ing.name.toLowerCase().split(/[\s,()]+/).filter(w => w.length > 3);
    return words.some(w => lower.includes(w));
  });
}
