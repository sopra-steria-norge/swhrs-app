// Declare global variables
var pageVars = {};

//favlist contains a list of Strings to displau favourites in lists, it's filled in getFavourites
var favList = [];
/**
 * favMap: In the function getFavourites this is set to contain all the favourites
 * as Favourite objects, stored with incremental numbers as keys
 */
var favMap = {};

//regMap is filled with Hour Registration objects in getDayList
var regMap = {};
var editTaskNumber = null;

// Constants
var MISSING = "missing";
var NO_FAV = "NO_FAV";
var ZERO = 0;
var today = "today";
var LOGIN_TOKEN = "loginToken";

//Constructor to make a Favourite object
function Favourite(projectnumber, activitycode, description, projectname, customername, billable, internalproject) {
    this.projectnumber = projectnumber;
    this.activitycode = activitycode;
    this.description = description;
    this.projectname = projectname;
    this.customername = customername;
    this.billable = billable;
    this.internalproject = internalproject;
}

function HourRegistration(tasknumber, projectnumber, activitycode, description, hours, submitted, approved, projectDescription) {
    this.tasknumber = tasknumber;
    this.projectnumber = projectnumber;
    this.activitycode = activitycode;
    this.description = description; //The description of the Time Entry
    this.hours = hours;
    this.submitted = submitted;
    this.approved = approved;
    this.projectDescription = projectDescription; //The decription of the project
}

function saltAndHash(password) {
    var salt = randomBase64String();
    var digest = CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(salt + "_" + password));
    return salt + "_" + digest;
}

function randomBase64String() {
    var base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var stringLength = 8;
    var randomString = '';
    for (var i = 0; i < stringLength; i++) {
        var randomNumber = Math.floor(Math.random() * base64Alphabet.length);
        randomString += base64Alphabet.charAt(randomNumber);
    }
    return randomString;
}

$(document).ready(function () {
    var favLabelVar = $('#favLabel');
    var hoursLabelVar = $('#hoursLabel');
    var favVar = $('#fav');

    var myDate = new Date();
    dateT = myDate.getDate();
    monthT = myDate.getMonth();
    if (monthT < 10) {
        monthT = "0" + monthT;
    }
    yearT = myDate.getFullYear();

    $('#loginForm').submit(function () {
        var loginToken = {
            username:$('[name=username]').val(),
            password:saltAndHash($('[name=password]').val())
        };

        $.ajax({
            type:'HEAD',
            url:'checkAuthentication',
            headers:{"X-Authentication-Token":JSON.stringify(loginToken)},
            success:function (data) {
                localStorage.setItem(LOGIN_TOKEN, JSON.stringify(loginToken));
                if (pageVars && pageVars.returnAfterLogin) {
                    $.mobile.changePage(pageVars.returnAfterLogin.toPage);
                } else {
                    $.mobile.changePage("#weekPage", { changeHash:true });
                }
            },
            error:function (data) {
                $('#loginErr').text("Wrong username/password");
            }
        });
        return false;
    });

    /*
     * #dayPage
     * Editing of registrations in dayList
     * Listens to click of a list element in dayList
     */
    $('#editReg').click(function () {
        var err = false;

        var hourEditVar = $('#hoursEditLabel');
        // Reset highlighted form elements
        hourEditVar.removeClass(MISSING);

        var editHours = $('#editHours').val();

        // Validation error of input fields
        if (err == true) {
            return false;
        }

        var edit = {'taskNumber':editTaskNumber, 'hours':editHours};

        var onSuccess = function() {
            resetDay();
            getDayList(today);
        };

        authenticatedAjax("POST", "hours/updateRegistration", edit, onSuccess);
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
        favLabelVar.removeClass(MISSING);
        hoursLabelVar.removeClass(MISSING);
        $.mobile.silentScroll(100);
        hourForm = $("#hours").val();

        if (favVar.val() == NO_FAV) {
            favLabelVar.addClass(MISSING);
            err = true;
        }
        if (hourForm == ZERO) {
            $('#hoursLabel').addClass(MISSING);
            err = true;
        }


        // Validation error of input fields
        if (err == true) {
            return false;
        }

        var dateForm = $('#hdrDay').children('h1').text();
        var favForm = $("#fav").val();
        var hourForm = $("#hours").val();
        var lunchForm = $("#lunch").val();
        var selectedFav = favMap[favForm]; //The Favourite object selected in the select box

        var lunchCodeString = '';
        if (lunchForm == 1) {
            lunchCodeString = "1";
        } else {
            lunchCodeString = "0";
        }

        var myData = {'projectNr':selectedFav.projectnumber, 'activityCode':selectedFav.activitycode,
            'description':selectedFav.description, 'billable':selectedFav.billable,
            'internalproject':selectedFav.internalproject, 'hours':hourForm, 'date':dateForm,
            'lunchNumber':lunchCodeString};
        postHourRegistration(myData);
        return false;
    });

    /*
     * Listens to a click of "Search Projects" in the Fav page
     * Gets search data from the server and displays results in a a list. SQL statement is set to return maximum 50 results
     */
    $('#favBtn').click(function () {
        var inputSearch = $("#favSearch").val();
        var searchData = {search:inputSearch}

        authenticatedAjax('GET', 'hours/searchFavourites', searchData, function (data) {
            fillProjectList(data);
        });
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

        $.mobile.changePage($("#dayPage"));
        resetDay();
        getDayList(dateString);
    });

    /*
     * Listens to click on the "Day" button in the footer
     * Resets the view and gets the list for current day
     */
    $('.dayLink').bind('click', function () {
        resetDay();
        getDayList(today);
    });

    /*
     * Listens to clicks on the "Fav" button in the footer
     * Removes any previous content and displays current favourites
     */
    $('.favLink').bind('click', function () {
        $('#favText').text("User favourites");
        $('#projectList').children().remove('li');
        $('#favList').children().remove('li');
        getFavouriteList(fillListInFavPage);
        $('#favList').listview('refresh');
    });

});

function getLoginToken() {
    return $.parseJSON(localStorage.getItem(LOGIN_TOKEN));
}

$(document).bind("pagebeforechange", function (event, data) {
    if (typeof data.toPage == 'object' && data.toPage.attr('data-needs-auth') == 'true') {
        console.log("User needs to be authenticated to reach this page");
        if (!getLoginToken()) {
            redirectToLogin(event);
        }
    }
});

function authenticatedAjax(type, url, data, success, error) {
    $.ajax({
        type:type,
        url:url,
        data:data,
        headers:{"X-Authentication-Token":JSON.stringify(getLoginToken())},
        success:defaultFunction(success),
        error:defaultFunction(error)
    });
}

function defaultFunction(arg) {
    return typeof arg === 'function' ? arg : (function () {
    });
}

$('#dayPage').live('pageinit', function () {
    getFavouriteList(fillSelectMenuInDayPage);
    getDayList(today);
});

$('#weekPage').live('pageinit', function () {
    getWeekList("thisWeek");
});


function redirectToLogin(event) {
    event.preventDefault();
    $.mobile.changePage("#loginPage", { changeHash:false });
}

/*
 * postHourRegistration(mydata)
 * Sends hourRegistration data to the servlet
 */
function postHourRegistration(myData) {
    authenticatedAjax('POST', 'hours/registration', myData, function () {
        getDayList(today);
        resetDay();
    });
}

/*
 * Used to submit a period for approval. Functionality to reopen a period has not yet been made. 
 * Change option value to 0 to reopen the period
 */
function updatePeriod() {
    console.log("updatePeriod not yet implemented")
//    options = {'option':1};
//    authenticatedAjax("POST", "hours/updatePeriod", options);
}


/*
 * prevDay() & nextDay()
 * Resets the dayPage and updates date and previous registrations
 */
function prevDay() {
    var prevDay = "prevDay"
    $('#lunch').val(1);
    getDayList(prevDay);
    resetDay();
}

function nextDay() {
    var nextDay = "nextDay"
    $('#lunch').val(1);
    getDayList(nextDay);
    resetDay();
}


/**
 * gets the weekList for the previous week. Used when the user navigates to previous week through the button "Prev" in header of week view
 * Updates the period in header with new dates
 */
function prevWeek() {
    var prevWeek = "prevWeek";
    getWeekList(prevWeek);
}

/**
 * gets the weekList for next week. Used when the user navigates to next week through the button "Next" in header of week view
 * Updates the period in header with new dates
 */
function nextWeek() {
    var nextWeek = "nextWeek";
    getWeekList(nextWeek);
}


/*
 * loadWeekList()
 * Passes data to the servlet(Period)
 * If success: Loads new period data.  
 */
function getWeekList(newWeek) {
    var weekDays = new Array("", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    var week = {week:newWeek};
    $('#weekList').children().remove('li');
    authenticatedAjax("GET", "hours/week", function (data) {
        var dateArray = new Array();
        var hoursArray = new Array();
        var dayArray = new Array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
        var dataArray = new Array();
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if (key === "weekNumber") {
                    $('#hdrWeek').children('h1').text(data[key]);
                } else if (key === "dateHdr") {
                    var hdrDayText = data[key].split(' ')[0];
                    var hdrDateText = data[key].split(' ')[1];
                    var dateText = hdrDateText.split('-')[2] + "." + hdrDateText.split('-')[1] + "." + hdrDateText.split('-')[0]
                    $('#hdrDay').children('h1').text(weekDays[hdrDayText] + " " + dateText);
                } else {
                    dataArray.push(data[key][0], key, data[key][1], data[key][2]);
                    dateArray.push(key);
                    hoursArray.push(data[key]);
                }
            }
        }
        updateWeekList(dateArray.sort(), data);
    });
}

/*
 * updateWeekList
 * Appends the new week entries to the weekList
 */
function updateWeekList(dateArray, data) {
    var weekDays = new Array("", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
    var dayHours = new Array();
    var submitted = false;
    for (var i = 0; i < dateArray.length; i++) {
        var dayNr = data[dateArray[i]][0];
        var hours = data[dateArray[i]][1];
        dayHours.push(hours);
        if (data[dateArray[i]][2] == 1 || submitted) {
            submitted = true;
            $('#weekList').append($("<li data-theme='b' data-icon='check'></li>").html('<a href="">' +
                weekDays[dayNr] + '<p>' + dateArray[i] + '</p></a><span class="ui-li-count">' + hours + ' hours' + '</span>')).listview('refresh');
        } else {
            $('#weekList').append($("<li data-theme='b'></li>").html('<a href="">' +
                weekDays[dayNr] + '<p>' + dateArray[i] + '</p></a><span class="ui-li-count">' + hours + ' hours' + '</span>')).listview('refresh');
        }
    }
    var totalWeek = 0;
    $.each(dayHours, function () {
        totalWeek += parseFloat(this);
    });
    var norm = 0;
    if (dateArray.length < 5) {
        norm = dateArray.length * 8;
    } else {
        norm = 40;
    }
    $('#weekDescription').children('p').text("You have logged " + totalWeek + " hours this week");
    $('#hdrDia').children('h1').text("Do you want to Submit?");
    $('#contentDia').children('p').text("You have registered " + totalWeek + " hours in period. ");
}

/*
 * deleteRegistration()
 * sends an hourRegistration to the servlet to be deleted in the database
 */
function deleteRegistration(taskNr, listid) {
    var delreg = {taskNumber:taskNr}

    function onSuccess() {
        return function (data) {
            if (data.indexOf('Already submitted') != -1) {
                $.mobile.changePage($("#dialogPopUpNoDelete"));
            } else {
                $('#reg' + taskNr).remove();
                resetDay();
                getDayList("today");
            }
        };
    }

    authenticatedAjax("POST", "hours/deleteRegistration", delreg, onSuccess());
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

function getFavouriteList(addToPage) {
    var onSuccess = function (data) {
        favMap = {};
        favList = [];
        for (var key in data) {
            var jsonMap = data[key];
            var newFav = new Favourite(jsonMap['projectnumber'], jsonMap['activitycode'], jsonMap['description'], jsonMap['projectname'], jsonMap['customername'], jsonMap['billable'], jsonMap['internalproject']);

            favMap[key] = newFav;
            var favtext = newFav.projectname + " (" + newFav.activitycode + ") " + newFav.description;
            favList.push(favtext);
        }
        addToPage(favList);
    };
    authenticatedAjax("GET", "hours/favourite", {}, onSuccess);
}

function fillListInFavPage(favlist) {
    for (var i = 0; i < favList.length; i++) {
        var favs = favList[i];
        $('#favList').append($('<li id="fav:' + i + '"></li>').html('<a href="#" data-split-theme="a" data-split-icon="delete">' +
            favs + '</a><a href="#" onclick="deleteFavourite(' + i + ')"></a>'));
    }
    $('#favList').listview('refresh');
    $('#favText').text("Current favourites");

}

function fillProjectList(data) {
    $('#favList').children().remove('li');
    $('#projectList').children().remove('li');
    for (LOGIN_TOKEN in data) {
        var jsonMap = data[LOGIN_TOKEN];
        var projects = jsonMap['projectnumber'] + " (" + jsonMap['activitycode'] + ") " + jsonMap['description'];
        var pNr = jsonMap['projectnumber'];
        var aC = jsonMap['activitycode'];
        $('#projectList').append($("<li/>", {id:""}).html('<a href="#" data-split-theme="a">' +
            projects + ' </a><a href="" onclick="addFavourites(\'' + pNr + '\',\'' + aC + '\')"></a>'));
    }
    $('#favList').listview();
    $('#favText').text("Search results");
    $('#favList').listview('refresh');
    $('#projectList').listview('refresh');
}

function addFavourites(pNr, aC) {
    var favourite = {'projectNumber':pNr, 'activityCode':aC}
    $.ajax({
        type:"POST",
        url:'hours/addFavourites',
        data:favourite,
        success:function (data) {
            getFavouriteList(fillSelectMenuInDayPage);
            alert('Added project with nr ' + pNr + ' to favourite list');
        }
    });
}

function deleteFavourite(key) {
    var fav = favMap[key];
    var delFavourite = {'projectNumber':fav.projectnumber, 'activityCode':fav.activitycode};

    $.ajax({
        type:"POST",
        url:'hours/deleteFavourite',
        data:delFavourite,
        success:function () {
            alert('Deleted project with nr ' + fav.projectnumber + ' from favourite list');
            $('#favList').children().remove('li');
            getFavouriteList(fillListInFavPage);
            getFavouriteList(fillSelectMenuInDayPage);
        }
    });
}

function fillSelectMenuInDayPage(favList) {
    var options = "NO_FAV";
    var select = "Select a favourite"
    $('#fav').html('');
    $('#fav').append('<option value=' + options + '>' + select + '</option>').selectmenu('refresh', true);
    for (var i = 0; i < favList.length; i++) {
        var favs = favList[i];
        $('#fav').append('<option value=' + i + '>' + favs + '</option>').selectmenu('refresh', true);

    }
}

/*
 * getDayList()
 * Sends a date to the servlet to return all entries on a specific day
 */
function getDayList(newDay) {
    var weekDays = new Array("", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    if (newDay == 1)getFavouriteList(fillSelectMenuInDayPage);
    var totalHours = 0;
    regMap = {};

    var onSuccess = function (data) {
        for (var key in data) {
            var jsonMap = data[key];
            if (jsonMap['projectnumber'] == "LUNSJ") {
                $('#lunch').val(0);
            }
            $('#lunch').slider('refresh');
            if (key === "date") {
                var hdrDayText = data[key].split(' ')[0];
                var hdrDateText = data[key].split(' ')[1];
                var dateText = hdrDateText.split('-')[2] + "." + hdrDateText.split('-')[1] + "." + hdrDateText.split('-')[0]
                $('#hdrDay').children('h1').text(weekDays[hdrDayText] + " " + dateText);
            } else {
                var val = data[key];
                totalHours += val['hours'];

                var projectKey = val['projectnumber'] + '<:>' + val['activitycode'];
                var projectdescription = val['description'];
                //super ugly hack
                if (projectKey in favDescription) {
                    projectdescription = favDescription[projectKey].description;
                }
                var newhr = new HourRegistration(key, val['projectnumber'], val['activitycode'],
                    val['description'], val['hours'], val['submitted'], val['approved'], projectdescription);
                regMap[key] = newhr;
                var editlink = '';
                var buttonlink = '';
                if (newhr['approved']) {
                    editlink = '<a href="#">';
                    buttonlink = '<a href="#" data-icon="check" data-theme="e"></a>';
                } else if (newhr['submitted']) {
                    editlink = '<a href="#" data-icon="check">';
                    buttonlink = '<a href="#" class="split-button split-button-inactive" data-icon="check"></a>';
                } else {
                    editlink = '<a href="#" data-theme="b" data-rel="popup" onclick="editRegistration(' + newhr.tasknumber + ')">';
                    buttonlink = '<a href="#" class="split-button split-button-active" onclick="deleteRegistration(' + newhr.tasknumber + ')" data-icon="delete"></a>';
                }
                $('#dayList').append($('<li id="reg:' + key + '"/>').html(editlink +
                    newhr['projectDescription'] + '</a><span class="ui-li-count">' + newhr['hours'] + ' hours ' +
                    '</span>' + buttonlink)).listview('refresh');
            }
        }
        if (totalHours != 0) {
            $('#dayList').prepend($("<li></li>").html('Total hours: <span class="ui-li-count">' + totalHours + ' hours' + '</span>')).listview('refresh');
        }
    };

    authenticatedAjax("GET", "hours/daylist", { day:"today"}, onSuccess);
}

/*
 * resetDay()
 * Function too reset the daypage
 */
function resetDay() {
    $('#dayList').children().remove('li');
    $('#hours').val(0);
    $('#hours').slider('refresh');
}