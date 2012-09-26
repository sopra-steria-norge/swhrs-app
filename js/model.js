function MyDate(fromDate) {
    var self = this;

    if (fromDate) {
        this.date = new Date(fromDate);
    } else {
        this.date = new Date();
    }

    this.setDate = function (fromDate, days) {
        if (fromDate) {
            if (!days) {
                days = 0;
            }
            self.date.setTime(fromDate.date.getTime() + 24 * 60 * 60 * 1000 * days);
        }
    };

    this.setDateFromString = function (fromDate) {
        self.date = moment(fromDate, DATE_FORMAT).toDate();
    };

    this.toString = function () {
        return moment(self.date).format("YYYY-MM-DD");
    };

    this.toDateString = function () {
        return moment(self.date).format("DD.MM.YY");
    };

    this.toWeekDayString = function () {
        return WEEK_DAYS[self.date.getDay()];
    };
}

function updateFavouriteModel(projects) {
    favMap = $.extend(projects, {});
}

function updateWeekModel(days) {
    weekMap = $.extend(days, {});
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