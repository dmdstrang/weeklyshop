// Returns the Monday of the week containing the given date
export function getMondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextMonday(date = new Date()) {
  const monday = getMondayOf(date);
  monday.setDate(monday.getDate() + 7);
  return monday;
}

export function toDateString(date) {
  return date.toISOString().split('T')[0];
}

export function formatWeekLabel(mondayDate) {
  const end = new Date(mondayDate);
  end.setDate(end.getDate() + 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${mondayDate.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`;
}

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function getDayDate(monday, dayName) {
  const idx = DAYS.indexOf(dayName.toLowerCase());
  const d = new Date(monday);
  d.setDate(d.getDate() + idx);
  return d;
}
