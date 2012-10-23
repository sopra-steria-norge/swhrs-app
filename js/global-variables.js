"use strict";

var returnToPage,
    regMap,
    currentDate,
    periodStartDate,
    periodEndDate;

var WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var WEEK_DAYS_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var DATE_FORMAT = "YYYY-MM-DD";
var favMap = {};
var weekMap = {};
var weekStatusMap = {};
var regMap = {};
var editTaskNumber = null;
var MISSING = "missing";
var LOGIN_TOKEN = "loginToken";
var serverUrl = "";
//var serverUrl = "http://192.168.119.1:8081/swhrs-app/";