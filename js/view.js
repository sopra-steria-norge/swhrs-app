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

    favouritesSelectMenu.empty();
    favouritesSelectMenu.append('<option value="NO_FAV" data-placeholder="true">Select a favourite</option>');
    $.each(favMap, function (key, project) {
        favouritesSelectMenu.append('<option value="' + key + '">' + project.description + '</option>');
    });
    favouritesSelectMenu.selectmenu('refresh');
}

function fillDayView() {
    var dayListDomElement = $('#dayList');
    dayListDomElement.empty();
    dayListDomElement.listview();
    $("#hours").slider("option", "value", 7.5);

    if (weekMap && currentDate.toString() in weekMap) {
        $("#dayPageTitle").text(currentDate.toWeekDayString() + ", " + currentDate.toDateString());

        $.each(weekMap[currentDate.toString()], function (taskNumber, registration) {
            var dataIcon = registration.approved ? " data-icon='check'" : "";

            var entryText = "";
            if (registration.projectNumber + "_" + registration.activityCode in favMap) {
                var project = favMap[registration.projectNumber + "_" + registration.activityCode];
                entryText = project.projectName + " (" + project.projectNumber + "), " + project.description + "<p>" + project.customerName + "</p>";
            } else {
                entryText = "Project nr: " + registration.projectNumber + ", Activity code: " + registration.activityCode + ", " + registration.description + "<p></p>";
            }

            dayListDomElement.append($("<li data-theme='b' " + dataIcon + "></li>").html('<a href="#">' + entryText + '</a><span class="ui-li-count">' + registration.hours + ' hours' + '</span>'))
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
    $.each(weekMap, function (date, registrations) {
        var daySubmitted = false;
        var dayApproved = false;
        hoursPerDay[date] = 0;
        $.each(registrations, function (j, registration) {
            hoursPerDay[date] += registration.hours;
            daySubmitted |= registration.submitted;
            dayApproved |= registration.approved;
        });
        var dataIcon = daySubmitted ? " data-icon='check'" : "";

        var myDate = new MyDate(date);
        weekListDomElement.append($("<li data-theme='b' " + dataIcon + "></li>").html('<a href="#">' + myDate.toDateString() + '<p>' + myDate.toWeekDayString() + '</p></a><span class="ui-li-count">' + hoursPerDay[date] + ' hours' + '</span>'));
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