export default function DayCard({ day, entry, onSwap, onToggleOut, onViewRecipe }) {
  const isOut = entry?.is_out;
  const meal = entry?.meal;
  const customMeal = entry?.custom_meal;
  const mealName = meal?.name || customMeal || null;
  const category = meal?.category;
  const rating = meal?.user_rating;

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
        <>
          <div className="day-card__meal">
            {category && <span className="day-card__category">{category}</span>}
            <span className="day-card__meal-name">
              {mealName || <span className="day-card__empty">Not planned</span>}
            </span>
            <button className="swap-btn" onClick={e => { e.stopPropagation(); onSwap(day); }}>
              Swap
            </button>
          </div>

          {meal && (
            <div className="day-card__footer">
              <span className="day-card__tap-hint">Tap to view recipe</span>
              <div className="day-card__rating">
                {rating === 'liked' && <span className="rating-pill rating-pill--liked">Favourite</span>}
                {rating === 'disliked' && <span className="rating-pill rating-pill--disliked">Hidden</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
