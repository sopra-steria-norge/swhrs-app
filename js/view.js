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
        var projects = project.projectnumber + " (" + project.activitycode + ") " + project.description;
        var pNr = project.projectnumber;
        var aC = project.activitycode;
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
    $('#dayList').empty();
    $('#hours').val(0);

    $("#dayPageTitle").text(currentDate.toStringWithDayAndDate());
}

function fillWeekView() {
    var dayHours = [];
    var submitted = false;
    var hoursPerDay = {};
    $.each(weekMap, function (i, day) {
        var daySubmitted = false;
        var dayApproved = false;
        hoursPerDay[i] = 0;
        $.each(day, function (j, registration) {
            hoursPerDay[i] += registration.hours;
            daySubmitted |= registration.submitted;
            dayApproved |= registration.approved;
        });
        var dataIcon = daySubmitted ? " data-icon='check'": "";

        $('#weekList').append($("<li data-theme='b' " + dataIcon +"></li>").html('<a href="#">' + day.name + '<p>' + weekDayForDate(day.name) + '</p></a><span class="ui-li-count">' + hoursPerDay + ' hours' + '</span>'));
    });

    var totalWeek = 0;
    $.each(hoursPerDay, function (i, hoursInDay) {
        totalWeek += parseFloat(hoursInDay);
    });

    $('#weekDescription').children('p').text("You have logged " + totalWeek + " hours this week");
    $('#hdrDia').children('h1').text("Do you want to Submit?");
    $('#contentDia').children('p').text("You have registered " + totalWeek + " hours in period. ");
}