var MyDate = (function () {
    function MyDate(fromDate) {
        if (fromDate) {
            this.date = new Date(fromDate);
        } else {
            this.date = new Date();
        }
    }

    MyDate.prototype.setDate = function (fromDate, days) {
        if (fromDate) {
            if (!days) {
                days = 0;
            }
            this.date.setTime(fromDate.date.getTime() + 24 * 60 * 60 * 1000 * days);
        }
    };

    MyDate.prototype.setDateFromString = function (fromDate) {
        this.date = moment(fromDate, DATE_FORMAT).toDate();
    };

    MyDate.prototype.toString = function () {
        return moment(this.date).format("YYYY-MM-DD");
    };

    MyDate.prototype.toDateString = function () {
        return moment(this.date).format("DD.MM.YY");
    };

    MyDate.prototype.toWeekDayString = function () {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][this.date.getDay()];
    };

    return MyDate;
})();

function updateFavouriteModel(projects) {
    favMap = $.extend(projects, {});
}

function updateWeekModel(days) {
    weekMap = $.extend(days, {});
    var datesInWeek = Object.keys(weekMap).sort();
    periodStartDate.setDate(new MyDate(datesInWeek[0]));
    periodEndDate.setDate(new MyDate(datesInWeek[datesInWeek.length - 1]));

    weekStatusMap = {submitted: false, approved: false, totalHours: 0, hoursPerDay: {}};

    $.each(datesInWeek, function (i, date) {
        weekStatusMap.hoursPerDay[date] = 0;
        $.each(weekMap[date], function (j, registration) {
            weekStatusMap.hoursPerDay[date] += registration.hours;
            weekStatusMap.submitted |= registration.submitted;
            weekStatusMap.approved |= registration.approved;
        });
        weekStatusMap.totalHours += weekStatusMap.hoursPerDay[date];
    });
}

function deleteRegistration(taskNr) {
    delete weekMap[currentDate.toString()][taskNr];
    weekStatusMap = {submitted: false, approved: false, totalHours: 0, hoursPerDay: {}};

    $.each(Object.keys(weekMap), function (i, date) {
        weekStatusMap.hoursPerDay[date] = 0;
        $.each(weekMap[date], function (j, registration) {
            weekStatusMap.hoursPerDay[date] += registration.hours;
            weekStatusMap.submitted |= registration.submitted;
            weekStatusMap.approved |= registration.approved;
        });
        weekStatusMap.totalHours += weekStatusMap.hoursPerDay[date];
    });
}