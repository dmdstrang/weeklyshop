import { formatWeekLabel } from '../lib/weeks';

export default function WeekNav({ monday, onPrev, onNext }) {
  return (
    <div className="week-nav">
      <button onClick={onPrev} className="nav-btn">&#8249;</button>
      <span className="week-label">{formatWeekLabel(monday)}</span>
      <button onClick={onNext} className="nav-btn">&#8250;</button>
    </div>
  );
}
