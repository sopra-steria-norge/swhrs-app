"use strict";

var returnToPage,
    favMap,
    regMap,
    weekMap,
    totalHours,
    editTaskNumber,
    MISSING,
    NO_FAV,
    ZERO,
    currentDate,
    periodStartDate,
    periodEndDate,
    WEEK_DAYS,
    LOGIN_TOKEN,
    DATE_FORMAT;

WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
DATE_FORMAT = "YYYY-MM-DD";
favMap = {};
weekMap = {}
regMap = {};
editTaskNumber = null;
MISSING = "missing";
NO_FAV = "NO_FAV";
ZERO = 0;
LOGIN_TOKEN = "loginToken";