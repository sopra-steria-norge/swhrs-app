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

function checkAuthentication(loginToken, onError) {
    $.mobile.showPageLoadingMsg();
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
        error:defaultFunction(onError),
        complete:$.mobile.hidePageLoadingMsg
    });
}
$(document).on('ready', function () {
    var dayPageDomElement = $("#dayPage");
    var weekPageDomElement = $("#weekPage");
    var syncDataOnWeekPage = syncData(weekPageDomElement);
    var syncDataOnDayPage = syncData(dayPageDomElement);

    function addModelViewBinding() {
        dayPageDomElement.on('modelChanged', function () {
            fillDayView();
            fillSelectMenuInDayView();
        });

        weekPageDomElement.on('modelChanged', function () {
            fillWeekView();
        });

        $("#favPage").on('modelChanged', function () {
            fillCurrentListInFavPage();
        });
    }

    function addDayPageEventHandlers() {
        function deleteRegistrationHandler(taskNr) {
            var delreg = {
                taskNumber:taskNr
            };

            var onSuccess = function (data) {
                if (data.indexOf('Already submitted') !== -1) {
                    $.mobile.changePage("#dialogPopUpNoDelete");
                } else {
                    deleteRegistration(taskNr);
                    dayPageDomElement.trigger("modelChanged");
                }
            };

            authenticatedAjax("POST", "hours/deleteRegistration", delreg, onSuccess);
        }

        function postHourRegistration(myData) {
            authenticatedAjax('POST', 'hours/registration', myData, function () {
                syncDataOnDayPage();
            });
        }

        $('#prevDayBtn').on("click", function () {
            currentDate.setDate(currentDate, -1);
            if (currentDate.date < periodStartDate.date) {
                syncDataOnDayPage();
            } else {
                dayPageDomElement.trigger("modelChanged");
            }
        });

        $('#nextDayBtn').on("click", function () {
            currentDate.setDate(currentDate, 1);
            if (currentDate.date > periodEndDate.date) {
                syncDataOnDayPage();
            } else {
                dayPageDomElement.trigger("modelChanged");
            }
        });

        function removeValidationHighlighting() {
            $('#favLabel').removeClass(MISSING);
            $('#hoursLabel').removeClass(MISSING);
        }

        dayPageDomElement.on('pagebeforeshow', function (event) {
            removeValidationHighlighting();
            if (event.target.id !== "dayPage") {
                try {
                    fillDayView();
                    fillSelectMenuInDayView();
                } catch (error) {
                    syncDataOnDayPage();
                }
            }
        });

        $("#dayForm").find("input,select").on("change", removeValidationHighlighting);


        $('#dayForm').submit(function (event) {
            event.preventDefault();
            var err = false;
            removeValidationHighlighting();
            hourForm = $("#hours").val();

            if ($('#fav').val() === "") {
                $('#favLabel').addClass(MISSING);
                err = true;
            }
            if (hourForm === "0") {
                $('#hoursLabel').addClass(MISSING);
                err = true;
            }

            // Validation error of input fields
            if (err === true) {
                window.setTimeout(removeValidationHighlighting, 2000);
                return false;
            }

            $.mobile.silentScroll(200);
            var favForm = $("#fav").val();
            var hourForm = $("#hours").val();
            var lunchForm = $("#lunch").val();
            var selectedFav = favMap[favForm]; //The Favourite object selected in the select box

            if (lunchForm === "1" && selectedFav.projectNumber !== "LUNSJ" && $.isEmptyObject(weekMap[currentDate.toString()])) {
                postHourRegistration({
                    'projectNumber':'LUNSJ',
                    'activityCode':'LU',
                    'description':'Lunsj',
                    'hours':0.5,
                    'date':currentDate.toString()
                });
            }

            postHourRegistration({
                'projectNumber':selectedFav.projectNumber,
                'activityCode':selectedFav.activityCode,
                'description':selectedFav.description,
                'hours':hourForm,
                'date':currentDate.toString()
            });
            return false;
        });


        /*
         * #dayPage
         * Editing of registrations in dayList
         * Listens to click of a list element in dayList
         */
        $('#editReg').on('click', function () {
            var err = false;

            // Reset highlighted form elements
            $('#hoursEditLabel').removeClass(MISSING);

            var editHours = $('#editHours').val();
            var editDescription = $('#editDescription').val();
            var editWorkType = $('#editWorkType').val();

            // Validation error of input fields
            if (err === true) {
                return false;
            }

            var edit = {
                'taskNumber':editTaskNumber,
                'projectNumber':weekMap[currentDate.toString()][editTaskNumber].projectNumber,
                'activityCode':weekMap[currentDate.toString()][editTaskNumber].activityCode,
                'date':currentDate.toString(),
                'workType':editWorkType,
                'description':editDescription,
                'hours':editHours
            };

            authenticatedAjax("POST", "hours/updateRegistration", edit, function () {
                syncDataOnDayPage();
            });
        });

        dayPageDomElement.find("#dayList").on("click", ".editEntry", function () {
            editTaskNumber = $(this).attr("id").substring("edit:".length);
            $.mobile.changePage("#dialogEditReg");
        });

        dayPageDomElement.find("#dayList").on("click", ".deleteEntry", function () {
            var taskNumber = $(this).attr("id").substring("delete:".length);
            deleteRegistrationHandler(taskNumber);
        });
    }

    function addWeekPageEventHandlers() {
        $('#prevWeekBtn').on("click", function () {
            currentDate.setDate(periodStartDate, -1);
            syncDataOnWeekPage();
        });

        $('#nextWeekBtn').on("click", function () {
            currentDate.setDate(periodEndDate, 1);
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
            dayPageDomElement.trigger("modelChanged");
        });

        $("#submitPeriod").on("click", function () {
            authenticatedAjax("POST", "hours/submitPeriod", {date:periodStartDate.toString()}, function () {
                syncDataOnWeekPage();
            });
        });

        $("#reopenPeriod").on("click", function () {
            authenticatedAjax("POST", "hours/reopenPeriod", {date:periodStartDate.toString()}, function () {
                syncDataOnWeekPage();
            });
        });
    }

    function addFavPageEventHandlers() {
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

    function addConnectionLostEventHandler() {
        $("#connectionLostLink").on("click", function () {
            returnToPage = location.hash;
            checkAuthentication(getLoginToken());
        });
    }

    function addLoginPageEventHandlers() {
        $('#loginForm').submit(function () {
            var pw = $('[name=password]').val();
            var loginToken = {
                username:$('[name=username]').val(),
                password:saltAndHash(pw)
            };
            checkAuthentication(loginToken, function () {
                $('#loginErr').text("Wrong username/password");
            });
        });
    }

    function addSettingPageEventHandlers() {
        $("#logoutBtn").on("click", function () {
            removeLoginToken();
            redirectToLogin();
        });
    }

    addModelViewBinding();
    addDayPageEventHandlers();
    addWeekPageEventHandlers();
    addConnectionLostEventHandler();
    addLoginPageEventHandlers();
//    addFavPageEventHandlers();
    addSettingPageEventHandlers();

    $(document).on("modelChanged", function () {
        if (currentDate.toString() > periodEndDate.toString() || currentDate.toString() < periodStartDate.toString() || periodEndDate.toString() < periodStartDate.toString()) {
            throw new Error("Inconsistent periods");
        }
    });

    weekPageDomElement.on('pagebeforeshow', function () {
        try {
            fillWeekView();
        } catch (error) {
            syncDataOnWeekPage();
        }
    });

    $("#dialogEditReg").on("pagebeforeshow", fillEditRegistrationView);

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

function authenticatedAjax(type, url, data, success) {
    $.mobile.showPageLoadingMsg();
    $.ajax({
        type:type,
        url:serverUrl + url,
        cache:false,
//        timeout:10000,
        data:data,
        headers:{
            "X-Authentication-Token":JSON.stringify(getLoginToken())
        },
        success:defaultFunction(success),
        statusCode:{
            403:redirectToLogin
        },
        error:function (jqXHR, textStatus) {
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

            $.mobile.hidePageLoadingMsg();
            alert(message);
            $.mobile.changePage("#connectionLostPage", {changeHash:false});
        },
        complete:function () {
            $.mobile.hidePageLoadingMsg();
        }
    });
}


function syncData(observingDomElement) {
    if (!observingDomElement || observingDomElement.length === 0) {
        throw new Error("Argument is not a DOM element: '" + observingDomElement + "'.");
    }
    return function () {
        var onSuccess = function (data) {
            updateFavouriteModel(data.projects);
            updateWeekModel(data);
            observingDomElement.trigger("modelChanged");
        };

        authenticatedAjax("GET", "hours/week", {date:currentDate.toString()}, onSuccess);
    }
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