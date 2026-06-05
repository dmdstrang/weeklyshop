import { useState } from 'react';
import MealSwapper from './MealSwapper';
import CookingMode from './CookingMode';
import { rateMeal } from '../lib/api';
import { scaleIngredients } from '../lib/scaleQty';

const BASE_SERVES = 3;

export default function RecipeModal({ meal: initialMeal, day, onSelect, onClose, onRatingChange }) {
  const [showSwapper, setShowSwapper] = useState(false);
  const [showCooking, setShowCooking] = useState(false);
  const [meal, setMeal] = useState(initialMeal);
  const [rating, setRating] = useState(initialMeal?.user_rating ?? null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [serves, setServes] = useState(BASE_SERVES);

  if (!meal) return null;

  const rawIngredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const method = Array.isArray(meal.method) ? meal.method : [];
  const scaledIngredients = scaleIngredients(rawIngredients, serves, BASE_SERVES);

  async function handleRate(newRating) {
    if (!meal.id || meal.id.startsWith('generated-')) return;
    const toggled = rating === newRating ? null : newRating;
    setRatingLoading(true);
    try {
      const updated = await rateMeal(meal.id, toggled);
      setRating(updated.user_rating);
      setMeal(updated);
      onRatingChange?.(updated);
    } finally {
      setRatingLoading(false);
    }
  }

  if (showCooking) {
    return (
      <CookingMode
        meal={meal}
        ingredients={scaledIngredients}
        onClose={() => setShowCooking(false)}
      />
    );
  }

  return (
    <>
      <div className="recipe-overlay" onClick={onClose}>
        <div className="recipe-sheet" onClick={e => e.stopPropagation()}>

          {meal.image_url && (
            <div className="recipe-hero-image">
              <img src={meal.image_url} alt={meal.name} />
            </div>
          )}

          <div className="recipe-sheet__hero">
            <div className="recipe-handle" />
            <div className="recipe-hero-top">
              <div style={{flex:1}}>
                <div className="recipe-category-tag">{meal.category}</div>
                <h2 className="recipe-title">{meal.name}</h2>
              </div>
              {meal.id && !meal.id.startsWith('generated-') && (
                <div className="recipe-rating">
                  <button
                    className={`rating-btn rating-btn--like ${rating === 'liked' ? 'rating-btn--active' : ''}`}
                    onClick={() => handleRate('liked')}
                    disabled={ratingLoading}
                    title="Favourite"
                  >♥</button>
                  <button
                    className={`rating-btn rating-btn--dislike ${rating === 'disliked' ? 'rating-btn--active' : ''}`}
                    onClick={() => handleRate('disliked')}
                    disabled={ratingLoading}
                    title="Never suggest again"
                  >👎</button>
                </div>
              )}
            </div>

            {meal.description && <p className="recipe-description">{meal.description}</p>}
            {rating === 'disliked' && (
              <p className="recipe-disliked-note">This meal won't be suggested again. Tap 👎 again to undo.</p>
            )}

            <div className="recipe-meta-row">
              <div className="recipe-meta">
                {meal.prep_time && <span className="recipe-meta-item"><strong>Prep</strong> {meal.prep_time}</span>}
                {meal.cook_time && <span className="recipe-meta-item"><strong>Cook</strong> {meal.cook_time}</span>}
              </div>

              {/* Portion adjuster */}
              <div className="serves-adjuster">
                <button
                  className="serves-btn"
                  onClick={() => setServes(s => Math.max(1, s - 1))}
                  disabled={serves <= 1}
                >−</button>
                <span className="serves-label">{serves} {serves === 1 ? 'person' : 'people'}</span>
                <button
                  className="serves-btn"
                  onClick={() => setServes(s => Math.min(10, s + 1))}
                  disabled={serves >= 10}
                >+</button>
              </div>
            </div>
          </div>

          <div className="recipe-body">
            {scaledIngredients.length > 0 && (
              <div>
                <p className="recipe-section-title">Ingredients</p>
                <ul className="ingredient-list">
                  {scaledIngredients.map((ing, i) => (
                    <li key={i} className="ingredient-item">
                      <span className="ingredient-name">{ing.name}</span>
                      <span className="ingredient-qty">{ing.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {method.length > 0 && (
              <div>
                <p className="recipe-section-title">Method</p>
                <ol className="method-list">
                  {method.map((step, i) => (
                    <li key={i} className="method-step">
                      <span className="step-num">{i + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {rawIngredients.length === 0 && method.length === 0 && (
              <p style={{color:'var(--text-2)', fontSize:14, lineHeight:1.6}}>
                Full recipe details not yet added.
              </p>
            )}
          </div>

          <div className="recipe-actions">
            {method.length > 0 && (
              <button className="primary-btn" style={{marginBottom:8}}
                      onClick={() => setShowCooking(true)}>
                Start cooking
              </button>
            )}
            <button className="secondary-btn" style={{marginBottom:0}}
                    onClick={() => setShowSwapper(true)}>
              Swap this meal
            </button>
            <button className="swapper-close" style={{margin:0, width:'100%'}} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {showSwapper && (
        <MealSwapper
          day={day}
          currentMeal={meal}
          onSelect={(d, newMeal) => {
            onSelect(d, newMeal);
            setShowSwapper(false);
            onClose();
          }}
          onClose={() => setShowSwapper(false)}
        />
      )}
    </>
  );
}
