function fillCurrentListInFavPage() {
    $('#favText').text("User favourites");

    $('#projectList').empty();
    $('#favList').empty();

    for (var i = 0; i < favMap.length; i++) {
        var favs = favMap[i];
        $('#favList').append($('<li id="fav:' + i + '"/>').html('<a href="#" data-split-theme="a" data-split-icon="delete">' + favs + '</a><a href="#" onclick="deleteFavourite(' + i + ')"></a>'));
    }
    $('#favList').listview();
    $('#favText').text("Current favourites");
}

function fillSearchListInFavPage() {
    $('#favList').children().remove('li');
    $('#projectList').children().remove('li');
    for (var i = 0; i < regMap.length; i++) {
        var project = regMap[i];
        var projects = project.projectNumber + " (" + project.activityCode + ") " + project.description;
        var pNr = project.projectNumber;
        var aC = project.activityCode;
        $('#projectList').append($("<li/>", {
            id:""
        }).html('<a href="#" data-split-theme="a">' + projects + ' </a><a href="" onclick="addFavourites(\'' + pNr + '\',\'' + aC + '\')"></a>'));
    }
    $('#favText').text("Search results");
    $('#favList').listview();
    $('#projectList').listview();
}

function fillSelectMenuInDayView() {
    var favouritesSelectMenu = $("#fav");

    favouritesSelectMenu.find('.projectOption').remove();
    $.each(favMap, function (key, project) {
        favouritesSelectMenu.append('<option class="projectOption" value="' + key + '">' + project.description + '</option>');
    });
    favouritesSelectMenu.selectmenu('refresh');
}

function fillDayView() {
    var dayListDomElement = $('#dayList');
    var dayListStatus = $("#dayListStatus");
    dayListDomElement.empty();
    dayListStatus.empty();
    dayListDomElement.listview();
    $("#hours").slider("option", "value", 7.5);

    if (weekMap && currentDate.toString() in weekMap) {
        $("#dayPageTitle").text(currentDate.toWeekDayString() + ", " + currentDate.toDateString());

        if ($.isEmptyObject(weekMap[currentDate.toString()])) {
            dayListStatus.text("No time entries registered.");
        }
        $.each(weekMap[currentDate.toString()], function (taskNumber, registration) {
            var dataIcon = registration.approved ? "check" : "";

            var entryText = "";
            if (registration.projectNumber + "_" + registration.activityCode in favMap) {
                var project = favMap[registration.projectNumber + "_" + registration.activityCode];
                entryText = project.description + "<p>" + project.projectName + " (" + project.projectNumber + "), " + project.customerName + "</p>";
            } else {
                entryText = "Project nr: " + registration.projectNumber + ", Activity code: " + registration.activityCode + "<p>" + registration.description + "</p>";
            }

            var listElement = $("<li data-theme='b'></li>");
            listElement.append($('<a href="#" class="ellipsis">' + entryText + '</a><span class="ui-li-count">' + registration.hours + ' hours' + '</span>'));
            if (!registration.approved) {
                listElement.append($('<a href="#" class="deleteEntry" id="' + taskNumber + '">Delete entry</a>').attr("data-icon", "delete"));
            } else {
                listElement.attr("data-icon", "check");
            }
            dayListDomElement.append(listElement);
        });
        dayListDomElement.listview("refresh", true);
    } else {
        throw new Error("Data not synchronized");
    }
}

function fillWeekView() {
    var weekListDomElement = $('#weekList');
    weekListDomElement.empty();
    weekListDomElement.listview();

    var hoursPerDay = {};
    var periodSubmitted = false;
    $.each(weekDateList, function (i, date) {
        var registrations = weekMap[date];
        var daySubmitted = false;
        var dayApproved = false;
        hoursPerDay[date] = 0;
        $.each(registrations, function (j, registration) {
            hoursPerDay[date] += registration.hours;
            daySubmitted |= registration.submitted;
            dayApproved |= registration.approved;
        });
        var dataIcon = daySubmitted ? "check" : "arrow-l";

        var myDate = new MyDate(date);
        weekListDomElement.append($("<li id='day:" + date.toString() + "' data-iconpos='left' data-theme='b' data-icon='" + dataIcon + "'></li>").html('<a href="#">' + myDate.toDateString() + '<p>' + myDate.toWeekDayString() + '</p></a><span class="ui-li-count">' + hoursPerDay[date] + ' hours' + '</span>'));
    });

    weekListDomElement.listview("refresh", true);

    var totalWeek = 0;
    $.each(hoursPerDay, function (i, hoursInDay) {
        totalWeek += parseFloat(hoursInDay);
    });

    $('#weekPageTitle').text(periodStartDate.toDateString() + " - " + periodEndDate.toDateString());
    $('#weekDescription').children('p').text("You have logged " + totalWeek + " hours this week");
    $('#hdrDia').children('h1').text("Do you want to Submit?");
    $('#contentDia').children('p').text("You have registered " + totalWeek + " hours in period. ");
}