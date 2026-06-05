import { useEffect, useState } from 'react';
import { generateMealImage } from '../lib/api';

export default function DayCard({ day, entry, onSwap, onToggleOut, onViewRecipe, onImageReady }) {
  const isOut = entry?.is_out;
  const meal = entry?.meal;
  const customMeal = entry?.custom_meal;
  const mealName = meal?.name || customMeal || null;
  const category = meal?.category;
  const rating = meal?.user_rating;
  const [imageUrl, setImageUrl] = useState(meal?.image_url || null);

  // Lazily generate an image if this meal doesn't have one yet
  useEffect(() => {
    setImageUrl(meal?.image_url || null);
    if (meal?.id && !meal.image_url && !meal.id.startsWith('generated-')) {
      let cancelled = false;
      generateMealImage(meal.id).then(res => {
        if (!cancelled && res?.image_url) {
          setImageUrl(res.image_url);
          onImageReady?.(meal.id, res.image_url);
        }
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [meal?.id, meal?.image_url]);

  function handleCardClick() {
    if (!isOut && meal) onViewRecipe(meal);
  }

  return (
    <div
      className={`day-card ${isOut ? 'day-card--out' : ''} ${!isOut && meal ? 'day-card--tappable' : ''}`}
      onClick={handleCardClick}
    >
      <div className="day-card__header">
        <span className="day-card__day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
        <button
          className={`out-toggle ${isOut ? 'out-toggle--active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleOut(day, !isOut); }}
        >
          {isOut ? 'Out' : 'Home'}
        </button>
      </div>

      {isOut ? (
        <p className="day-card__out-msg">No meal needed</p>
      ) : (
        <div className="day-card__body">
          {meal && (
            <div className="day-card__thumb">
              {imageUrl
                ? <img src={imageUrl} alt="" loading="lazy" />
                : <div className="day-card__thumb-placeholder" />}
            </div>
          )}
          <div className="day-card__main">
            <div className="day-card__meal">
              {category && <span className="day-card__category">{category}</span>}
              <span className="day-card__meal-name">
                {mealName || <span className="day-card__empty">Not planned</span>}
              </span>
            </div>
            <div className="day-card__footer">
              {meal && <span className="day-card__tap-hint">Tap to view recipe</span>}
              <div className="day-card__actions">
                {rating === 'liked' && <span className="rating-pill rating-pill--liked">Favourite</span>}
                <button className="swap-btn" onClick={e => { e.stopPropagation(); onSwap(day); }}>Swap</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
