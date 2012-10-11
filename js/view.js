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
    var projects = "";

    $.each(favMap, function (key, project) {
        projects += '<option class="projectOption" value="' + key + '">' + project.description + '</option>';
    });

    $("#fav").html(projects).selectmenu('refresh');
}

function fillDayView() {
    $("#dayListStatus").empty();
    $("#dayList").empty();
    $("#hours").slider("option", "value", 7.5);

    if (weekStatusMap.approved || weekStatusMap.submitted) {
        $("#dayForm").hide();
    } else {
        $("#dayForm").show();
    }

    if (weekMap && currentDate.toString() in weekMap) {
        $("#dayPageTitle").text(currentDate.toWeekDayString() + ", " + currentDate.toDateString());

        if ($.isEmptyObject(weekMap[currentDate.toString()])) {
            $("#dayListStatus").text("No time entries registered.");
        } else {
            var dayListContent = "";
            $.each(weekMap[currentDate.toString()], function (taskNumber, registration) {
                if (registration.projectNumber + "_" + registration.activityCode in favMap) {
                    var project = favMap[registration.projectNumber + "_" + registration.activityCode];
                    var entryText = project.description + "<p>" + project.projectName + " (" + project.projectNumber + ")";
                    if (registration.workType) {
                        entryText += "<br/><strong>" + registration.workType + "</strong>";
                    }
                    entryText += "</p>";
                } else {
                    var entryText = "Project nr: " + registration.projectNumber + ", Activity code: " + registration.activityCode + "<p>" + registration.description + "</p>";
                }

                if (!weekStatusMap.submitted && !weekStatusMap.approved) {
                    dayListContent += '<li data-icon="delete" data-theme="b">';
                    dayListContent += ' <a href="#" class="editEntry" id="edit:' + taskNumber + '">' + entryText + '</a><span class="ui-li-count">' + registration.hours + 'h</span>';
                    dayListContent += ' <a href="#" class="deleteEntry" id="delete:' + taskNumber + '">Delete entry</a>';
                } else {
                    dayListContent += '<li data-icon="check" data-theme="f">';
                    dayListContent += entryText + '<span class="ui-li-count">' + registration.hours + 'h</span>';
                }
                dayListContent += '</li>';
            });

            $("#dayList").html(dayListContent).listview("refresh", true);
        }
    } else {
        throw new Error("Data not synchronized");
    }
}

function fillEditRegistrationView() {
    try {
        $('#editDescription').val(weekMap[currentDate.toString()][editTaskNumber].description);
        $('#editHours').val(weekMap[currentDate.toString()][editTaskNumber].hours);
        $('#editWorkType').val(weekMap[currentDate.toString()][editTaskNumber].workType);
        $('#editHours').slider('refresh');
    } catch (error) {

    }
}

function fillWeekView() {
    var listContent = "";

    if (weekStatusMap.approved) {
        var dataIcon = "check";
    } else if (weekStatusMap.submitted) {
        var dataIcon = "check";
    } else {
        var dataIcon = "back";
    }

    var datesInPeriod = Object.keys(weekStatusMap.hoursPerDay).sort();

    for (var i = 0; i < datesInPeriod.length; i++) {
        var date = datesInPeriod[i];
        var myDate = new MyDate(date);

        listContent += "<li id='day:" + date.toString() + "' data-iconpos='left' data-theme='b' data-icon='" + dataIcon + "'>";
        listContent += '    <a href="#">' + myDate.toDateString() + '<p>' + myDate.toWeekDayString() + '</p></a><span class="ui-li-count">' + weekStatusMap.hoursPerDay[date] + ' hours' + '</span>';
        listContent += "</li>";
    }

    $('#weekDescription').empty();
    if (!weekStatusMap.submitted) {
        $("#weekButtonDiv").html('<a href="#dialogPopUp" data-role="button" id="submitPopup" data-rel="dialog" data-transition="pop" data-theme="e">Submit period</a>').trigger("create");
    } else if (weekStatusMap.submitted && !weekStatusMap.approved) {
        $('#weekDescription').append("<p class='submitted'>Period submitted.</p>");
        $("#weekButtonDiv").html('<a href="#dialogReopen" data-role="button" id="reopenPopup" data-rel="dialog" data-transition="pop" data-theme="a">Reopen period</a>').trigger("create");
    } else if (weekStatusMap.approved) {
        $('#weekDescription').append("<p class='approved'>Period submitted and approved.</p>");
    }
    $('#weekDescription').append("<p>You have logged " + weekStatusMap.totalHours + " hours this period.</p>");


    $("#weekList").html(listContent).listview("refresh", true);

    $('#weekPageTitle').text(periodStartDate.toDateString() + " - " + periodEndDate.toDateString());
    $('#contentDia').children('p').text("You have logged " + weekStatusMap.totalHours + " hours in the period: " + periodStartDate.toDateString() + " - " + periodEndDate.toDateString());
}