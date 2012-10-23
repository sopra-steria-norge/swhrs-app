

function fillCurrentListInFavPage() {
    $('#favText').text("User favourites");

    $('#projectList').empty();
    $('#favList').empty();

    for (var i = 0; i < favMap.length; i++) {
        var favs = favMap[i];
        $('#favList').append($('<li id="fav:' + i + '"/>').html('<a href="#" data-split-theme="a" data-split-icon="trash">' + favs + '</a><a href="#" onclick="deleteFavourite(' + i + ')"></a>'));
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

    if (weekStatusMap.approved || weekStatusMap.rejected) {
        $("#dayForm").hide();
    } else {
        $("#dayForm").show();
    }

    if (weekMap && currentDate.format(DATE_FORMAT) in weekMap) {
        $("#dayPageTitle").text(WEEK_DAYS_ABBR[currentDate.day()] + ", " + currentDate.format("DD.MM.YY"));

        if ($.isEmptyObject(weekMap[currentDate.format(DATE_FORMAT)])) {
            $("#dayListStatus").text("No time entries registered.");
        } else {
            var dayListContent = "";
            if (weekStatusMap.rejected) {
                $("#dayListStatus").text("Period rejected, use the desktop version to edit time entries.");
            }
            $.each(weekMap[currentDate.format(DATE_FORMAT)], function (taskNumber, registration) {
                if (registration.projectNumber + "_" + registration.activityCode in favMap) {
                    var project = favMap[registration.projectNumber + "_" + registration.activityCode];
                    var entryText = (project.description || "<span class='nodescription'>No description</span>") + "<p>" + project.projectName + " (" + project.projectNumber + ")";
                    if (registration.workType) {
                        entryText += "<br/><span class='workType'>" + registration.workType + "</span>";
                    }
                    entryText += "</p>";
                } else {
                    var entryText = "Project nr: " + registration.projectNumber + ", Activity code: " + registration.activityCode + "<p>" + (registration.description || "<span class='nodescription'>No description</span>") + "</p>";
                }

                if (!weekStatusMap.submitted && !weekStatusMap.approved && !weekStatusMap.rejected) {
                    dayListContent += '<li id="entry' + taskNumber + '" data-icon="trash" data-theme="b">';
                    dayListContent += ' <a href="#" class="editEntry" id="edit:' + taskNumber + '">' + entryText + '</a><span class="ui-li-count">' + registration.hours + 'h</span>';
                    dayListContent += ' <a href="#" class="deleteEntry" id="delete:' + taskNumber + '">Delete entry</a>';
                } else if (registration.rejected) {
                    dayListContent += '<li class="rejectedEntry" data-theme="f">' + entryText + '<span class="ui-li-count">' + registration.hours + ' h</span>';
                } else {
                    dayListContent += '<li data-theme="f">' + entryText + '<span class="ui-li-count">' + registration.hours + 'h</span>';
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
    $('#editDescription').val(weekMap[currentDate.format(DATE_FORMAT)][editTaskNumber].description || "");
    $('#editHours').val(weekMap[currentDate.format(DATE_FORMAT)][editTaskNumber].hours);
    console.log(weekMap[currentDate.format(DATE_FORMAT)][editTaskNumber].hours);
    var workType = weekMap[currentDate.format(DATE_FORMAT)][editTaskNumber].workType;
    $('#editWorkType').val(workType);
    $('#editWorkType').selectmenu('refresh', true);
    $('#editHours').slider('refresh');
}

function fillWeekView() {
    var dataIcon;
    var listContent = "";

    if (!weekStatusMap.hoursPerDay) {
        throw new Error("Data not synchronized");
    }
    var datesInPeriod = Object.keys(weekStatusMap.hoursPerDay).sort();

    for (var i = 0; i < datesInPeriod.length; i++) {
        var date = datesInPeriod[i];
        var myDate = moment(date, DATE_FORMAT);

        if (weekStatusMap.submitted && !weekStatusMap.rejectedPerDay[date]) {
            dataIcon = "check";
        } else if (weekStatusMap.rejectedPerDay[date]) {
            dataIcon = "delete";
        } else {
            dataIcon = "edit";
        }

        listContent += "<li id='day:" + myDate.format(DATE_FORMAT) + "' data-transition='fade' data-iconpos='left' data-theme='b' data-icon='" + dataIcon + "'>";
        listContent += '    <a href="#">' + myDate.format("DD.MM.YY") + '<p>' + WEEK_DAYS[myDate.day()] + '</p></a><span class="ui-li-count ' + (weekStatusMap.rejectedPerDay[date] ? 'rejectedEntry' : '') + '">' + weekStatusMap.hoursPerDay[date] + ' hours' + '</span>';
        listContent += "</li>";
    }

    $('#weekDescription').empty();
    $('#weekButtonDiv').empty();
    if (weekStatusMap.submitted && !weekStatusMap.approved && !weekStatusMap.rejected) {
        $('#weekDescription').append("<p class='submitted'>Period submitted.</p>");
        $("#weekButtonDiv").html('<a href="#dialogReopen" data-role="button" id="reopenPopup" data-rel="dialog" data-transition="pop" data-theme="a">Reopen period</a>').trigger("create");
    } else if (weekStatusMap.rejected) {
        $('#weekDescription').append("<p class='rejected'>Period rejected. Use the desktop version to edit time period.</p>");
    } else if (weekStatusMap.approved) {
        $('#weekDescription').append("<p class='approved'>Period approved.</p>");
    } else {
        $("#weekButtonDiv").html('<a href="#dialogPopUp" data-role="button" id="submitPopup" data-rel="dialog" data-transition="pop" data-theme="e">Submit period</a>').trigger("create");
    }
    $('#weekDescription').append("<p>You have logged " + weekStatusMap.totalHours + " hours this period.</p>");

    $("#weekList").html(listContent).listview("refresh", true);

    $('#weekPageTitle').text(weekStatusMap.periodDescription || "");
    $('#contentDia').children('p').html("You have logged <strong>" + weekStatusMap.totalHours + "</strong> hours in the period <strong>" + weekStatusMap.periodDescription + "</strong> (" + periodStartDate.format(DATE_FORMAT) + " - " + periodEndDate.format(DATE_FORMAT) + ").");
}