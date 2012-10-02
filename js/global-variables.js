"use strict";

var returnToPage,
    favMap,
    regMap,
    weekMap,
    weekDateList,
    totalHours,
    editTaskNumber,
    MISSING,
    currentDate,
    periodStartDate,
    periodEndDate,
    LOGIN_TOKEN,
    DATE_FORMAT,
    serverUrl;

DATE_FORMAT = "YYYY-MM-DD";
favMap = {};
weekMap = {}
weekDateList = [];
regMap = {};
editTaskNumber = null;
MISSING = "missing";
LOGIN_TOKEN = "loginToken";
serverUrl = "http://localhost:8081/swhrs-app/";