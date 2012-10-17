"use strict";

var returnToPage,
    regMap,
    currentDate,
    periodStartDate,
    periodEndDate;

var WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var DATE_FORMAT = "YYYY-MM-DD";
var favMap = {};
var weekMap = {};
var weekStatusMap = {};
var regMap = {};
var editTaskNumber = null;
var MISSING = "missing";
var LOGIN_TOKEN = "loginToken";
//var serverUrl = "http://192.168.119.1:8081/swhrs-app/";
var serverUrl = "";

$(document).on("pageinit", function () {
    $.mobile.defaultPageTransition = 'none';
});