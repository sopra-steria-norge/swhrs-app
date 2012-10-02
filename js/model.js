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

function updateFavouriteModel(projects) {
    favMap = $.extend(projects, {});
}

function updateWeekModel(days) {
    weekMap = $.extend(days, {});
    weekDateList = Object.keys(weekMap);
    weekDateList.sort();
    findPeriodBoundaries(weekMap);
}

function findPeriodBoundaries(dates) {
    var startDate = currentDate.date;
    var endDate = currentDate.date;
    $.each(dates, function (dateString, element) {
        var date = new Date(dateString);
        startDate = date < startDate ? date : startDate;
        endDate = date > endDate ? date : endDate;
    });

    periodStartDate.setDate(new MyDate(startDate));
    periodEndDate.setDate(new MyDate(endDate));
}