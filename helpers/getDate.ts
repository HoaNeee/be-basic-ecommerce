const listDayOfTheWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const listDayOfTheWeekFull = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const listMonthFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const listMonth = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const oneDay = 1000 * 60 * 60 * 24;

export const dayOfTheWeek = (day: number, type: "full" | "short"): string => {
  return type === "short" ? listDayOfTheWeek[day] : listDayOfTheWeekFull[day];
};
export const monthOfTheYear = (
  month: number,
  type: "full" | "short"
): string => {
  return type === "short" ? listMonth[month] : listMonthFull[month];
};

export const dateOfMonth = (month: number, year?: number) => {
  year = year || new Date().getFullYear();

  if (
    month === 1 ||
    month === 3 ||
    month === 5 ||
    month === 7 ||
    month === 8 ||
    month === 10 ||
    month === 12
  ) {
    return 31;
  }
  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }
    return 28;
  }
  return 30;
};

export const getStartEnd = (
  type: "week" | "month" | "year",
  date?: number,
  year?: number
) => {
  year = year || new Date().getFullYear();

  const now = new Date().getTime();

  let start: Date = new Date(),
    end: Date = new Date();

  if (type === "week") {
    date = date || new Date().getDay();
    date -= 1;
    start = new Date(new Date(now - oneDay * date).setUTCHours(0, 0, 0, 0));
    end = new Date(new Date(now + oneDay * 2 * date).setUTCHours(0, 0, 0, 0));
  } else if (type === "month") {
    date = date || new Date().getMonth();
    start = new Date(
      new Date(new Date(`${date + 1}/1/${year}`).setUTCHours(0, 0, 0, 0))
    );
    end = new Date(
      new Date(
        new Date(`${date + 1}/${dateOfMonth(date + 1)}/${year}`).getTime() +
          oneDay * 2
      ).setUTCHours(0, 0, 0, 0)
    );
  } else {
    start = new Date(new Date(`1/2/${year}`).setUTCHours(0, 0, 0, 0));
    end = new Date(new Date(`1/2/${year + 1}`).setUTCHours(0, 0, 0, 0));
  }

  return [start, end];
};
