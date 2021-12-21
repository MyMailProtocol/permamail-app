/// <reference types="@sveltejs/kit" />

function getDayOfYear(
  date: Date,
): number {
  const start: Date = new Date(date.getFullYear(), 0, 0);
  const diff: number = (+date - +start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay: number = 1000 * 60 * 60 * 24;
  const day: number = Math.floor(diff / oneDay);
  return day;
}

let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct","Nov","Dec"]

function getFormattedTime(timestamp : number) : string {
  const date: Date = new Date();
  date.setTime(timestamp);

  const d1: number = getDayOfYear(date);
  const d2: number = getDayOfYear(new Date());
  if (d1 === d2) {
    const hours = date.getHours();
    if (hours > 12) {
      return `${hours - 12}:${date.getMinutes()}pm`;
    }
    return `${hours}:${date.getMinutes()}am`;
  }
  return `${months[date.getMonth() - 1]} ${date.getDate()}`;
}
