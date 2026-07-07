export function calculateCurrentAgeLabel(purchaseDate: string) {
  if (!purchaseDate) return "";

  const purchased = new Date(`${purchaseDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (Number.isNaN(purchased.getTime())) return "";
  if (purchased.getTime() > today.getTime()) return "Future purchase date";

  let years = today.getFullYear() - purchased.getFullYear();
  let yearAnchor = addCalendarYears(purchased, years);

  if (yearAnchor.getTime() > today.getTime()) {
    years -= 1;
    yearAnchor = addCalendarYears(purchased, years);
  }

  let months = (today.getFullYear() - yearAnchor.getFullYear()) * 12 + today.getMonth() - yearAnchor.getMonth();
  let monthAnchor = addCalendarMonths(yearAnchor, months);

  if (monthAnchor.getTime() > today.getTime()) {
    months -= 1;
    monthAnchor = addCalendarMonths(yearAnchor, months);
  }

  const days = Math.floor((today.getTime() - monthAnchor.getTime()) / 86_400_000);

  if (years > 0) {
    return [formatAgePart(years, "year"), formatAgePart(months, "month"), formatAgePart(days, "day")].join(" ");
  }

  if (months > 0) {
    return [formatAgePart(months, "month"), formatAgePart(days, "day")].join(" ");
  }

  return formatAgePart(days, "day");
}

export function estimateAgeMonthsFromLabel(purchaseDate: string, currentAge: string) {
  const normalized = currentAge.toLowerCase();
  const years = Number(normalized.match(/(\d+)\s*year/)?.[1] ?? 0);
  const months = Number(normalized.match(/(\d+)\s*month/)?.[1] ?? 0);
  const days = Number(normalized.match(/(\d+)\s*day/)?.[1] ?? 0);

  if (years || months || days) {
    return Math.max(0, years * 12 + months + Math.round(days / 30));
  }

  const generated = calculateCurrentAgeLabel(purchaseDate);
  if (!generated || generated === "Future purchase date") return 12;
  return estimateAgeMonthsFromLabel("", generated);
}

function formatAgePart(value: number, unit: "year" | "month" | "day") {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function addCalendarYears(date: Date, years: number) {
  return addCalendarMonths(date, years * 12);
}

function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(targetMonth);
  result.setDate(Math.min(originalDay, daysInMonth(result.getFullYear(), result.getMonth())));
  return result;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
