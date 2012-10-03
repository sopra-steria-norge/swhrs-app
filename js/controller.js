currentDate = new MyDate();
periodStartDate = new MyDate();
periodEndDate = new MyDate();

$(document).on("pagebeforechange", function (event, data) {
    if (typeof data.toPage === 'object' && data.toPage.attr('data-needs-auth') === 'true') {
        if (!getLoginToken()) {
            returnToPage = '#dayPage';
            event.preventDefault();
            redirectToLogin();
        }
    }
});

$(document).on('ready', function () {
    var dayPageDomElement = $("#dayPage");
    var weekPageDomElement = $("#weekPage");
    var syncDataOnWeekPage = syncData(weekPageDomElement);
    var syncDataOnDayPage = syncData(dayPageDomElement);

    function registerModelViewBinding() {
        dayPageDomElement.on('modelChanged', function () {
            fillDayView();
            fillSelectMenuInDayView();
        });

        weekPageDomElement.on('modelChanged', function () {
            fillWeekView();
        });

        $("#favPage").on('dataSyncronized', function () {
            fillCurrentListInFavPage();
        });
    }

    function registerDayPageEventHandlers() {
        function deleteRegistration(taskNr) {
            var delreg = {
                taskNumber:taskNr
            };

            var onSuccess = function (data) {
                if (data.indexOf('Already submitted') !== -1) {
                    $.mobile.changePage("#dialogPopUpNoDelete");
                } else {
                    delete weekMap[currentDate.toString()][taskNr];
                    dayPageDomElement.trigger("modelChanged");
                }
            };

            authenticatedAjax("POST", "hours/deleteRegistration", delreg, onSuccess);
        }

        $('#prevDayBtn').click(function () {
            currentDate.setDate(currentDate, -1);
            if (currentDate.date < periodStartDate.date) {
                syncDataOnDayPage();
            } else {
                dayPageDomElement.trigger("modelChanged");
            }
        });

        $('#nextDayBtn').click(function () {
            currentDate.setDate(currentDate, 1);
            if (currentDate.date > periodEndDate.date) {
                syncDataOnDayPage();
            } else {
                dayPageDomElement.trigger("modelChanged");
            }
        });

        function removeAddEntryValidationFeedback() {
            $('#favLabel').removeClass(MISSING);
            $('#hoursLabel').removeClass(MISSING);
        }

        $("#dayForm").find("input,select").on("change", removeAddEntryValidationFeedback);


        $('#dayForm').submit(function (event) {
            var err = false;
            // Reset highlighted form elements
            removeAddEntryValidationFeedback();
            hourForm = $("#hours").val();

            if ($('#fav').val() === "Select project") {
                $('#favLabel').addClass(MISSING);
                err = true;
            }
            if (hourForm === "0") {
                $('#hoursLabel').addClass(MISSING);
                err = true;
            }

            // Validation error of input fields
            if (err === true) {
                event.preventDefault();
                return false;
            }

            $.mobile.silentScroll(200);
            var dateForm = $('#hdrDay').children('h1').text();
            var favForm = $("#fav").val();
            var hourForm = $("#hours").val();
            var lunchForm = $("#lunch").val();
            var selectedFav = favMap[favForm]; //The Favourite object selected in the select box

            var myData = {
                'projectNumber':selectedFav.projectNumber,
                'activityCode':selectedFav.activityCode,
                'workType':'',
                'description':selectedFav.description,
                'hours':hourForm,
                'date':currentDate.toString()
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

            var hourEditDomElement = $('#hoursEditLabel');
            // Reset highlighted form elements
            hourEditDomElement.removeClass(MISSING);

            var editHours = $('#editHours').val();

            // Validation error of input fields
            if (err === true) {
                return false;
            }

            var edit = {
                'taskNumber':editTaskNumber,
                'hours':editHours
            };

            authenticatedAjax("POST", "hours/updateRegistration", edit, function () {
                syncDataOnDayPage();
            });
        });

        $(dayPageDomElement).find("#dayList").on("click", ".deleteEntry", function () {
            var taskNumber = $(this).attr("id");
            deleteRegistration(taskNumber);
        });
    }

    function registerWeekPageEventHandlers() {
        $('#prevWeekBtn').click(function () {
            currentDate.setDate(periodStartDate, -1);
            syncDataOnWeekPage();
        });

        $('#nextWeekBtn').click(function () {
            currentDate.setDate(periodStartDate, 1);
            syncDataOnWeekPage();
        });

        /*
         * #weekPage
         * Listens to clicks on list elements in weekPage (Monday, Tuesday etc.)
         * If a day is clicked it navigates to that day in dayView
         */
        $('#weekList').on('click', 'li', function () {
            var date = $(this).attr("id").substring(4);
            currentDate.setDateFromString(date);
            $.mobile.changePage("#dayPage");
        });

    }

    function registerFavPageEventHandlers() {
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

    function registerLoginPageEventHandlers() {
        $('#loginForm').submit(function () {
            var loginToken = {
                username:$('[name=username]').val(),
                password:saltAndHash($('[name=password]').val())
            };

            $.ajax({
                type:'HEAD',
                url:serverUrl + 'checkAuthentication',
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

    function registerSettingPageEventHandlers() {
        $("#logoutBtn").click(function () {
            removeLoginToken();
            redirectToLogin();
        });
    }

    registerModelViewBinding();
    registerDayPageEventHandlers();
    registerWeekPageEventHandlers();
//    registerLoginPageEventHandlers();
//    registerFavPageEventHandlers();
//    registerSettingPageEventHandlers();

    $(document).on("modelChanged", function () {
        if (currentDate.date > periodEndDate.date || currentDate.date < periodStartDate.date || periodEndDate.date < periodStartDate.date) {
            throw new Error("Inconsistent periods");
        }
    });

    dayPageDomElement.on('pagebeforeshow', function (event) {
        if (event.target.id !== "dayPage") {
            try {
                fillDayView();
                fillSelectMenuInDayView();
            } catch (error) {
                syncDataOnDayPage();
            }
        }
    });

    weekPageDomElement.on('pagebeforeshow', function () {
        fillWeekView();
    });

//    $('#favPage').on('pagebeforeshow', function () { });

//    $('#settingsPage').on('pagebeforeshow', function () { });
    syncDataOnDayPage();
})
;

function redirectToLogin() {
    $.mobile.changePage("#loginPage", {
        changeHash:false
    });
}

function getLoginToken() {
    return JSON.parse(localStorage.getItem(LOGIN_TOKEN));
}

function removeLoginToken() {
    localStorage.removeItem(LOGIN_TOKEN);
}

function authenticatedAjax(type, url, data, success, error) {
    $.ajax({
        type:type,
        url:serverUrl + url,
        cache:false,
        data:data,
//        dataType:'json',
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


function syncData(observingDomElement) {
    if (!observingDomElement || observingDomElement.length === 0) {
        throw new Error("Argument is not a DOM element: '" + observingDomElement + "'.");
    }
    return function () {
        var onSuccess = function (data) {
            updateFavouriteModel(data.projects);
            updateWeekModel(data.days);
            observingDomElement.trigger("modelChanged");
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
}

/*
 * postHourRegistration(mydata)
 * Sends hourRegistration data to the servlet
 */
function postHourRegistration(myData) {
    authenticatedAjax('POST', 'hours/registration', myData, function () {
        syncData($("#dayPage"))();
    }, function (jqXHR, statusText) {
        alert(statusText);
    });
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
        syncData($("#favPage"))();
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
        syncData($("#favPage"))();
    };

    authenticatedAjax("POST", "hours/deleteFavourite", delFavourite, onSuccess);

}