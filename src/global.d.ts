// Copyright (C) 2021, MyMail Labs Inc.  Proprietary and Confidential.
// All rights reserved.  Unauthorized copying or use of this file, in whole or in part, using any medium is strictly prohibited.

/// <reference types="@sveltejs/kit" />

function getDayOfYear(date : Date) : number {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = (+date - +start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
}

let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct","Nov","Dec"]

function getFormattedTime(timestamp : number) : string {
    var date = new Date();
    date.setTime(timestamp);
    let d1 = getDayOfYear(date);
    let d2 = getDayOfYear(new Date());

    if (d1 === d2) {
        let hours = date.getHours();
        if (hours > 12) {
            return `${hours-12}:${date.getMinutes()}pm`;
        } else {
            return `${hours}:${date.getMinutes()}am`;
        }
    } else {
        return `${months[date.getMonth()-1]} ${date.getDate()}`;
    }
}