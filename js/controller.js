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
    LOGIN_TOKEN;

WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
favMap = {};
regMap = {};
editTaskNumber = null;
MISSING = "missing";
NO_FAV = "NO_FAV";
ZERO = 0;
LOGIN_TOKEN = "loginToken";

currentDate = new CurrentDate();

$(document).on("pagebeforechange", function (event, data) {
    if (typeof data.toPage === 'object' && data.toPage.attr('data-needs-auth') === 'true') {
        if (!getLoginToken()) {
            returnToPage = '#dayPage';
            event.preventDefault();
            redirectToLogin();
        }
    }
});

function registerModelViewBinding() {
    $(document).on('weekModelChanged', function () {
        fillDayView();
        fillWeekView();
    });
    $(document).on('favouriteModelChanged', function () {
        fillSelectMenuInDayView();
        fillCurrentListInFavPage();
    });
}

function onDayPageShow() {
    syncData();

    $('#prevDayBtn').on('click', function () {
        currentDate.setDate(currentDate, -1);
        if (currentDate.date < periodStartDate) {
            syncData();
        }
    });

    $('#nextDayBtn').click(function () {
        currentDate.setDate(currentDate, 1);
        if (currentDate.date > periodEndDate) {
            syncData();
        }
    });

    /*
     * #dayPage
     * Daypageform submit
     * Sends the input to the servlet(url: hours/registration)
     * Stores the input as a HourRegistration object in the database
     */
    $('#dayForm').submit(function () {
        var err = false;
        // Reset highlighted form elements
        $('#favLabel').removeClass(MISSING);
        $('#hoursLabel').removeClass(MISSING);
        $.mobile.silentScroll(100);
        hourForm = $("#hours").val();

        if ($('#fav').val() === NO_FAV) {
            $('#favLabel').addClass(MISSING);
            err = true;
        }
        if (hourForm === ZERO) {
            $('#hoursLabel').addClass(MISSING);
            err = true;
        }


        // Validation error of input fields
        if (err === true) {
            return false;
        }

        var dateForm = $('#hdrDay').children('h1').text();
        var favForm = $("#fav").val();
        var hourForm = $("#hours").val();
        var lunchForm = $("#lunch").val();
        var selectedFav = favMap[favForm]; //The Favourite object selected in the select box

        var lunchCodeString = '';
        if (lunchForm === 1) {
            lunchCodeString = "1";
        } else {
            lunchCodeString = "0";
        }

        var myData = {
            'projectNr':selectedFav.projectNumber,
            'activityCode':selectedFav.activityCode,
            'description':selectedFav.description,
            'billable':selectedFav.billable,
            'internalproject':selectedFav.internalproject,
            'hours':hourForm,
            'date':dateForm,
            'lunchNumber':lunchCodeString
        };
        postHourRegistration(myData);
        return false;
    });


    /*
     * #dayPage
     * Editing of registrations in dayList
     * Listens to click of a list element in dayList
     */
    $('#editReg').on('click', function () {
        var err = false;

        var hourEditVar = $('#hoursEditLabel');
        // Reset highlighted form elements
        hourEditVar.removeClass(MISSING);

        var editHours = $('#editHours').val();

        // Validation error of input fields
        if (err === true) {
            return false;
        }

        var edit = {
            'taskNumber':editTaskNumber,
            'hours':editHours
        };

        var onSuccess = function () {
            syncData();
        };

        authenticatedAjax("POST", "hours/updateRegistration", edit, onSuccess);
    });
}

function onWeekPageShow() {
    syncData();

    $('#prevWeekBtn').click(function () {
        currentDate.setDate(periodStartDate, -1);
        syncData();
    });

    $('#nextWeekBtn').click(function () {
        currentDate.setDate(periodStartDate, 1);
        syncData();
    });

    /*
     * #weekPage
     * Listens to clicks on list elements in weekPage (Monday, Tuesday etc.)
     * If a day is clicked it navigates to that day in dayView
     */
    $('#weekList').on('click', 'li', function () {
        var dayString = $(this).html();
        var index = dayString.indexOf('<p class="ui-li-desc">') + '<p class="ui-li-desc">'.length;
        var dateString = dayString.substring(index, index + 10);

        currentDate.setDateFromString(dateString);
        $.mobile.changePage($("#dayPage"));
    });

}

function onFavPageShow() {
    syncData();

    /*
     * Listens to a click of "Search Projects" in the Fav page
     * Gets search data from the server and displays results in a a list.
     */
    $('#favBtn').on('click', function () {
        var inputSearch = $("#favSearch").val();
        var searchData = {
            search:inputSearch
        };

        authenticatedAjax('GET', 'hours/searchFavourites', searchData, fillSearchListInFavPage);
    });
}

function onLoginPageShow() {
    $('#loginForm').submit(function () {
        var loginToken = {
            username:$('[name=username]').val(),
            password:saltAndHash($('[name=password]').val())
        };

        $.ajax({
            type:'HEAD',
            url:'checkAuthentication',
            headers:{
                "X-Authentication-Token":JSON.stringify(loginToken)
            },
            success:function () {
                localStorage.setItem(LOGIN_TOKEN, JSON.stringify(loginToken));
                if (returnToPage) {
                    $.mobile.changePage(returnToPage);
                } else {
                    $.mobile.changePage("#weekPage");
                }
            },
            error:function () {
                $('#loginErr').text("Wrong username/password");
            }
        });
        return false;
    });
}

$(document).on('pageinit', function () {
    registerModelViewBinding();

    $("#loginPage").on("pagebeforeshow", onLoginPageShow);

    $('#dayPage').on('pagebeforeshow', onDayPageShow);

    $('#weekPage').on('pagebeforechange', onWeekPageShow);

    $('#favPage').on('pagebeforeshow', onFavPageShow);
});

function redirectToLogin() {
    $.mobile.changePage("#loginPage", {
        changeHash:false
    });
}

function getLoginToken() {
    return JSON.parse(localStorage.getItem(LOGIN_TOKEN));
}

function authenticatedAjax(type, url, data, success, error) {
    $.ajax({
        type:type,
        url:url,
        cache:false,
        data:data,
        headers:{
            "X-Authentication-Token":JSON.stringify(getLoginToken())
        },
        success:defaultFunction(success),
        statusCode:{
            403:redirectToLogin
        },
        error:defaultFunction(error)
    });
}


function syncData() {
    var onSuccess = function (data) {
        updateWeekModel(data.days);
        updatePeriodModel(data.days);
        updateFavouriteModel(data.projects);
    };

    var onError = function (jqXHR, textStatus) {
        var message = "There was an error with the AJAX request.\n";
        switch (textStatus) {
            case 'timeout':
                message += "The request timed out.";
                break;
            case 'notmodified':
                message += "The request was not modified but was not retrieved from the cache.";
                break;
            case 'parsererror':
                message += "XML/Json format is bad.";
                break;
            default:
                message += "HTTP Error (" + jqXHR.status + " " + jqXHR.statusText + ").";
        }
        message += "\n";
        console.log(message);
    };
    authenticatedAjax("GET", "hours/week", {date:currentDate.toString()}, onSuccess, onError);
}

/*
 * postHourRegistration(mydata)
 * Sends hourRegistration data to the servlet
 */
function postHourRegistration(myData) {
    authenticatedAjax('POST', 'hours/registration', myData, function () {
        syncData();
    });
}

/*
 * deleteRegistration()
 * sends an hourRegistration to the servlet to be deleted in the database
 */
function deleteRegistration(taskNr, listid) {
    var delreg = {
        taskNumber:taskNr
    };

    var onSuccess = function onSuccess() {
        return function (data) {
            if (data.indexOf('Already submitted') !== -1) {
                $.mobile.changePage($("#dialogPopUpNoDelete"));
            } else {
                $('#reg' + taskNr).remove();
                syncData();
            }
        };
    };

    authenticatedAjax("POST", "hours/deleteRegistration", delreg, onSuccess);
    return true;
}

/**
 * This method is called when the user clicks a list element in the dayList which can
 * @param tasknumber The tasknumber of the time entry in the database
 */
function editRegistration(tasknumber) {
    editTaskNumber = tasknumber;
    $.mobile.changePage($("#dialogEditReg"));
    $('#editDesc').text(regMap[tasknumber].description);
    $('#editHours').val(regMap[tasknumber].hours);
    $('#editHours').slider('refresh');
    return false;
}


function addFavourites(pNr, aC) {
    var data = {
        'projectNumber':pNr,
        'activityCode':aC
    };
    var onSuccess = function () {
        syncData();
        alert('Added project with nr ' + pNr + ' to favourite list');

    };
    authenticatedAjax("POST", "hours/addFavourites", data, onSuccess);
}

function deleteFavourite(key) {
    var fav = favMap[key];
    var delFavourite = {
        'projectNumber':fav.projectnumber,
        'activityCode':fav.activitycode
    };

    var onSuccess = function () {
        alert('Deleted project with nr ' + fav.projectnumber + ' from favourite list');
        $('#favList').children().remove('li');
        syncData();
    };

    authenticatedAjax("POST", "hours/deleteFavourite", delFavourite, onSuccess);
}