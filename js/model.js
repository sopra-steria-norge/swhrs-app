function CurrentDate() {
    var self = this;
    this.date = new Date();
    this.setDate = function (fromDate, days) {
        if (fromDate) {
            if (!days) {
                days = 0;
            }
            self.date.setDate(fromDate.date.getDate() + days);
        }
    };
    this.setDateFromString = function (fromDate) {
        self.date = new Date(fromDate);
    };
    this.toString = function () {
        var string = self.date.getFullYear();
        if (self.date.getMonth() + 1 < 10) {
            string += "-0" + (self.date.getMonth() + 1);
        } else {
            string += "-" + (self.date.getMonth() + 1);
        }
        return string + "-" + self.date.getDate();
    };

    this.toStringWithDayAndDate = function () {
        var string = weekDayForDate(self.date);
        string += ", " + self.date.getDate();
        string += "/" + (self.date.getMonth() + 1);
        return string + "-" + self.date.getFullYear();
    };
}

function updateFavouriteModel(projects) {
    favMap = $.extend(projects, {});
    $(document).trigger('favouriteModelChanged');
}

function updateWeekModel(days) {
    weekMap = $.extend(days, {});

    totalHours = {};
    $.each(days, function (day) {
        totalHours[day.name] = day.reduce(function (reg1, reg2) {
            return reg1.hours + reg2.hours;
        });
    });

    $(document).trigger('weekModelChanged');
}

function findPeriodBoundaries(dates) {
    var startDate = currentDate.date;
    var endDate = currentDate.date;
    $.each(dates, function (dateString, element) {
        var date = new Date(dateString);
        startDate = date < startDate ? date : startDate;
        endDate = date > endDate ? date : endDate;
    });
    return {startDate:startDate, endDate:endDate};
}

function updatePeriodModel(days) {
    var periodBoundaries = findPeriodBoundaries(days);
    if (periodStartDate !== periodBoundaries.startDate || periodEndDate !== periodBoundaries.endDate) {
        periodStartDate = periodBoundaries.startDate;
        periodEndDate = periodBoundaries.endDate;
    }
}
