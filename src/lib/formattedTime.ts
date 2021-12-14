function getDayOfYear(date : Date) : number {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = (+date - +start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
}

const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",  "Oct", "Nov", "Dec"]
const months = [
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
  ]

export function getFormattedTime(timestamp : number) : string {
    var date = new Date();
    date.setTime(timestamp);
    let d1 = getDayOfYear(date);
    let d2 = getDayOfYear(new Date());

    if (d1 === d2) {
        let hours = date.getHours();
        if (hours > 12) {
            return `${hours-12}:${date.getMinutes().toLocaleString('en-US', {
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

export function getExpireLabel(timestamp : number, days : number) : string {
    let sentDate = new Date();
    sentDate.setTime(timestamp);
    let sentDayOfYear = getDayOfYear(sentDate);
    let expireDayOfYear = sentDayOfYear + days;
    let currentDayOfYear = getDayOfYear(new Date());
    let expireDays = expireDayOfYear - currentDayOfYear;
    return `${expireDays} days`;
}

export function getFormattedDate(timestamp: number) : string {
    var date = new Date();
    date.setTime(timestamp);
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}