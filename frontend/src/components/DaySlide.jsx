import { useEffect, useState } from 'react';
import { generateMealImage } from '../lib/api';

export default function DaySlide({ day, entry, onSwap, onToggleOut, onViewRecipe, onImageReady }) {
  const isOut = entry?.is_out;
  const meal = entry?.meal;
  const customMeal = entry?.custom_meal;
  const mealName = meal?.name || customMeal || null;
  const category = meal?.category;
  const rating = meal?.user_rating;
  const [imageUrl, setImageUrl] = useState(meal?.image_url || null);

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

  return (
    <div className="day-slide">
      {/* Background image */}
      {!isOut && imageUrl && (
        <img src={imageUrl} alt="" className="day-slide__img" />
      )}
      {!isOut && !imageUrl && meal && <div className="day-slide__img day-slide__img--loading" />}
      {(isOut || !meal) && <div className="day-slide__img day-slide__img--empty" />}

      {/* Dark gradient for legibility */}
      <div className="day-slide__scrim" />

      {/* Top: day label */}
      <div className="day-slide__top">
        <span className="day-slide__day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
        <button
          className={`day-slide__out ${isOut ? 'day-slide__out--active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleOut(day, !isOut); }}
        >
          {isOut ? 'Out tonight' : 'Eating in'}
        </button>
      </div>

      {/* Bottom: meal info + actions */}
      <div className="day-slide__bottom">
        {isOut ? (
          <p className="day-slide__outmsg">No meal needed — you're out tonight</p>
        ) : (
          <>
            {category && <span className="day-slide__cat">{category}</span>}
            <h2 className="day-slide__name">{mealName || 'No meal planned'}</h2>
            {rating === 'liked' && <span className="day-slide__fav">♥ Favourite</span>}
            <div className="day-slide__actions">
              {meal && (
                <button className="day-slide__btn day-slide__btn--primary"
                        onClick={() => onViewRecipe(meal)}>
                  View recipe
                </button>
              )}
              <button className="day-slide__btn" onClick={() => onSwap(day)}>
                Swap
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
