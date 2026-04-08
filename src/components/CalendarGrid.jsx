import { useState, useRef, useEffect, useMemo } from "react";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateKey,
  isSameDay,
  isInRange,
  isRangeStart,
  isRangeEnd,
  isToday,
  compareDates,
} from "../utils/dateHelpers";
import { HOLIDAY_MAP } from "../data/calendarData";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to figure out the CSS for the range highlight on a cell
function getWrapperClasses(dateObj, rangeStart, rangeEnd, hoverDate) {
  let cls = "cell-wrap";

  // actual confirmed range
  const hasFullRange = rangeStart && rangeEnd && !isSameDay(rangeStart, rangeEnd);

  if (hasFullRange) {
    if (isRangeStart(dateObj, rangeStart, rangeEnd)) cls += " range-start-cell";
    else if (isRangeEnd(dateObj, rangeStart, rangeEnd)) cls += " range-end-cell";
    else if (isInRange(dateObj, rangeStart, rangeEnd)) cls += " in-range";
  }

  // single day selected (no end yet)
  if (rangeStart && !rangeEnd && isSameDay(dateObj, rangeStart)) {
    cls += " single-day";
  }

  // hover preview — only shown when a start is picked but end is not yet
  if (rangeStart && !rangeEnd && hoverDate && !isSameDay(rangeStart, hoverDate)) {
    const inPreview = isInRange(dateObj, rangeStart, hoverDate);
    const isPreviewStart = isRangeStart(dateObj, rangeStart, hoverDate);
    const isPreviewEnd = isRangeEnd(dateObj, rangeStart, hoverDate);

    if (isPreviewStart) cls += " hover-start";
    else if (isPreviewEnd) cls += " hover-end";
    else if (inPreview) cls += " hover-range";
  }

  return cls;
}

function getCellClasses(dateObj, rangeStart, rangeEnd, year, month, day, colIdx, pulseRange) {
  let cls = "date-cell";

  const isOther = dateObj === null;
  if (isOther) return cls + " other-month";

  const hasFullRange = rangeStart && rangeEnd;
  const isStart = hasFullRange && isRangeStart(dateObj, rangeStart, rangeEnd);
  const isEnd = hasFullRange && isRangeEnd(dateObj, rangeStart, rangeEnd);
  const isSingle = rangeStart && !rangeEnd && isSameDay(dateObj, rangeStart);

  if (isStart || isEnd || isSingle) cls += " endpoint";
  if (pulseRange && isInRange(dateObj, pulseRange.start, pulseRange.end || pulseRange.start)) {
    cls += " pulse-flash";
  }
  if (isToday(year, month, day)) cls += " is-today";
  if (colIdx === 5 || colIdx === 6) cls += " is-weekend";

  return cls;
}

export default function CalendarGrid({
  year,
  month,
  rangeStart,
  rangeEnd,
  hoverDate,
  onDateClick,
  onDateHover,
  onDateLeave,
  navDir,
  navKey,
  savedNotes = [], 
  onNoteIndicatorClick,
  pulseRange
}) {
  const [animClass, setAnimClass] = useState("");
  const prevNavKey = useRef(navKey);

  useEffect(() => {
    // only animate when navKey actually changed (i.e. user navigated)
    if (navKey === prevNavKey.current) return;
    prevNavKey.current = navKey;

    const cls = navDir === "next" ? "grid-anim-right" : "grid-anim-left";
    setAnimClass(cls);

    // remove the class after animation finishes so it can retrigger next time
    const timer = setTimeout(() => setAnimClass(""), 500);
    return () => clearTimeout(timer);
  }, [navKey, navDir]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfMonth(year, month); // 0=Mon, 6=Sun

  const prevMonthDayCount = getDaysInMonth(year, month === 0 ? 11 : month - 1);

  // build an array of 42 cell descriptors (6 rows × 7 cols)
  const cells = useMemo(() => {
    const arr = [];
    // leading ghost days from prev month
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      arr.push({ day: prevMonthDayCount - i, isOther: true });
    }
    // actual days of this month
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, isOther: false });
    }
    // trailing ghost days to fill the grid up to 42
    let trailing = 1;
    while (arr.length < 42) {
      arr.push({ day: trailing++, isOther: true });
    }
    return arr;
  }, [daysInMonth, firstDayOffset, prevMonthDayCount]);

  return (
    <div>
      {/* weekday name row */}
      <div className="weekday-header">
        {WEEKDAYS.map((label, i) => (
          <div key={label} className={`wd-label ${i >= 5 ? "is-weekend" : ""}`}>
            {label}
          </div>
        ))}
      </div>

      {/* the 7-column date grid */}
      <div className={`date-grid ${animClass}`}>
        {cells.map((cell, idx) => {
          const colIdx = idx % 7;

          if (cell.isOther) {
            return (
              <div key={`g-${idx}`} className="cell-wrap other-wrap">
                <div className="date-cell other-month">
                  <div className="date-num">{cell.day}</div>
                </div>
              </div>
            );
          }

          const dateObj = { year, month, day: cell.day };
          const dateKey = formatDateKey(year, month, cell.day);
          const holiday = HOLIDAY_MAP[dateKey];

          const wrapperCls = getWrapperClasses(dateObj, rangeStart, rangeEnd, hoverDate);
          const cellCls = getCellClasses(dateObj, rangeStart, rangeEnd, year, month, cell.day, colIdx, pulseRange);

          const attachedNotes = savedNotes.filter(note => 
            note.rangeStart && 
            (compareDates(dateObj, note.rangeStart) >= 0) && 
            (compareDates(dateObj, note.rangeEnd || note.rangeStart) <= 0)
          );
          const hasAttachedNote = attachedNotes.length > 0;

          return (
            <div
              key={`d-${cell.day}`}
              className={wrapperCls}
            >
              <div
                className={cellCls}
                onClick={() => onDateClick(dateObj)}
                onMouseEnter={() => onDateHover(dateObj)}
                onMouseLeave={onDateLeave}
                role="button"
                tabIndex={0}
                aria-label={`${cell.day} ${holiday ? `- ${holiday.name}` : ""}`}
                onKeyDown={e => e.key === "Enter" && onDateClick(dateObj)}
              >
                <div className="date-num">{cell.day}</div>
                {holiday && <div className="holiday-pip" />}
                {holiday && (
                  <div className="holiday-tip">
                    {holiday.emoji} {holiday.name}
                  </div>
                )}
                {hasAttachedNote && (
                  <div 
                    className="note-badge-container" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNoteIndicatorClick) onNoteIndicatorClick(dateObj);
                    }}
                  >
                    <div className="note-badge">
                      <div className="dot" />
                      {attachedNotes.length > 1 && <span className="count">{attachedNotes.length}</span>}
                    </div>
                    <div className="custom-tooltip">
                      <div className="tooltip-head">
                        {attachedNotes.length === 1 ? "1 note added" : `${attachedNotes.length} notes added`}
                      </div>
                      {attachedNotes.length === 1 && attachedNotes[0].text && (
                        <div className="tooltip-body">
                          {attachedNotes[0].text.length > 40 ? attachedNotes[0].text.slice(0, 40) + "..." : attachedNotes[0].text}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
