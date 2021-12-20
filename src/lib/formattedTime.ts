const ONE_DAY: number = 1000 * 60 * 60 * 24;

function getDayOfYear(date: Date): number {
  const start: Date = new Date(date.getFullYear(), 0, 0);
  const diff: number = (+date - +start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const day: number = Math.floor(diff / ONE_DAY);
  return day;
}

const monthsShort: string[] = [
  "Jan", 
  "Feb", 
  "Mar", 
  "Apr", 
  "May", 
  "Jun", 
  "Jul", 
  "Aug", 
  "Sep", 
  "Oct", 
  "Nov", 
  "Dec"
];

const months: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function getFormattedTime(
  timestamp: number,
): string {
  let date: Date = new Date();
  date.setTime(timestamp);

  const d1: number = getDayOfYear(date);
  const d2: number = getDayOfYear(new Date());

  if (d1 === d2) {
    const hours: number = date.getHours();
    if (hours > 12) {
      return `${hours - 12}:${date.getMinutes().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })}pm`;
    } else {
      return `${hours}:${date.getMinutes().toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })}am`;
    }
  } else {
    return `${monthsShort[date.getMonth()]} ${date.getDate()}`;
  }
}

export function getExpireLabel(
  timestamp: number, 
  days: number,
): string {
  let sentDate: Date = new Date();
  sentDate.setTime(timestamp);

  const sentDayOfYear: number = getDayOfYear(sentDate);
  const expireDayOfYear: number = sentDayOfYear + days;
  const currentDayOfYear: number = getDayOfYear(new Date());
  const expireDays: number = expireDayOfYear - currentDayOfYear;
  return `${expireDays} days`;
}

export function getFormattedDate(
  timestamp: number,
): string {
  let date: Date = new Date();
  date.setTime(timestamp);
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}