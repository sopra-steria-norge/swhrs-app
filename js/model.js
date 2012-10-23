var MyDate = (function () {
    function MyDate(fromDate) {
        if (fromDate) {
            this.date = new Date(fromDate);
        } else {
            this.date = new Date();
        }
    }

    MyDate.prototype.setDate = function (fromDate, days) {
        this.date.setTime(moment(this.date).add('days', days || 0).toDate().getTime());
    };

    MyDate.prototype.setDateFromString = function (fromDate) {
        this.date = moment(fromDate, DATE_FORMAT).toDate();
    };

    MyDate.prototype.toString = function () {
        return moment(this.date).format(DATE_FORMAT);
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

function updateWeekModel(data) {
    weekMap = $.extend(data.days, {});
    var datesInWeek = Object.keys(weekMap).sort();
    periodStartDate = moment(datesInWeek[0], DATE_FORMAT);
    periodEndDate = moment(datesInWeek[datesInWeek.length - 1], DATE_FORMAT);

    weekStatusMap = {submitted:false, approved:false, rejected:false, periodDescription:data.periodDescription, totalHours:0, hoursPerDay:{}, rejectedPerDay:{}};

    $.each(datesInWeek, function (i, date) {
        weekStatusMap.hoursPerDay[date] = 0;
        weekStatusMap.rejectedPerDay[date] = false;
        $.each(weekMap[date], function (j, registration) {
            weekStatusMap.hoursPerDay[date] += registration.hours;
            weekStatusMap.rejectedPerDay[date] |= registration.rejected;
            weekStatusMap.rejected |= registration.rejected;
            weekStatusMap.submitted |= registration.submitted;
            weekStatusMap.approved |= registration.approved;
        });
        weekStatusMap.totalHours += weekStatusMap.hoursPerDay[date];
    });
}

function deleteRegistration(taskNr) {
    delete weekMap[currentDate.format(DATE_FORMAT)][taskNr];
    weekStatusMap = {submitted:false, approved:false, rejected:false, periodDescription:weekStatusMap.periodDescription, totalHours:0, hoursPerDay:{}, rejectedPerDay:{}};

    $.each(Object.keys(weekMap), function (i, date) {
        weekStatusMap.hoursPerDay[date] = 0;
        $.each(weekMap[date], function (j, registration) {
            weekStatusMap.hoursPerDay[date] += registration.hours;
            weekStatusMap.rejectedPerDay[date] = registration.rejected;
            weekStatusMap.rejected |= registration.rejected;
            weekStatusMap.submitted |= registration.submitted;
            weekStatusMap.approved |= registration.approved;
        });
        weekStatusMap.totalHours += weekStatusMap.hoursPerDay[date];
    });
}