import { useState, useRef } from 'react';
import { ingredientsForStep } from '../lib/scaleQty';

export default function CookingMode({ meal, ingredients, onClose }) {
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);
  const method = meal.method || [];
  const total = method.length;
  const current = method[step];
  const relevantIngredients = ingredientsForStep(current, ingredients);
  const progress = ((step + 1) / total) * 100;

  function next() { if (step < total - 1) setStep(s => s + 1); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next(); else prev();
    }
    touchStartX.current = null;
  }

  const isLast = step === total - 1;

  return (
    <div
      className="cooking-overlay"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="cooking-header">
        <button className="cooking-close" onClick={onClose}>Done</button>
        <span className="cooking-meal-name">{meal.name}</span>
        <span className="cooking-step-count">{step + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="cooking-progress-track">
        <div className="cooking-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step dots */}
      <div className="cooking-dots">
        {method.map((_, i) => (
          <button
            key={i}
            className={`cooking-dot ${i === step ? 'cooking-dot--active' : ''} ${i < step ? 'cooking-dot--done' : ''}`}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      {/* Main step content */}
      <div className="cooking-body">
        <div className="cooking-step-num">Step {step + 1}</div>
        <p className="cooking-step-text">{current}</p>

        {/* Relevant ingredients for this step */}
        {relevantIngredients.length > 0 && (
          <div className="cooking-ingredients">
            <p className="cooking-ingredients-label">You'll need</p>
            <ul className="cooking-ingredients-list">
              {relevantIngredients.map((ing, i) => (
                <li key={i} className="cooking-ingredient-item">
                  <span className="cooking-ingredient-name">{ing.name}</span>
                  <span className="cooking-ingredient-qty">{ing.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="cooking-nav">
        <button
          className="cooking-nav-btn cooking-nav-btn--prev"
          onClick={prev}
          disabled={step === 0}
        >
          Back
        </button>

        {isLast ? (
          <button className="cooking-nav-btn cooking-nav-btn--done" onClick={onClose}>
            Finished
          </button>
        ) : (
          <button className="cooking-nav-btn cooking-nav-btn--next" onClick={next}>
            Next step
          </button>
        )}
      </div>

      {/* Swipe hint on first step */}
      {step === 0 && (
        <p className="cooking-swipe-hint">Swipe left/right to move between steps</p>
      )}
    </div>
  );
}
