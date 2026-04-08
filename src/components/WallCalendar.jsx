import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarGrid from "./CalendarGrid";
import NotesPanel from "./NotesPanel";
import { MONTH_THEMES } from "../data/calendarData";
import { isSameDay, formatShortDate, countDaysInRange, compareDates } from "../utils/dateHelpers";
import "../styles/calendar.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// How long the page-flip animation takes (keep in sync with CSS --flip-duration)
const FLIP_DURATION = 1100;

// SPIRAL BINDING LOGIC
// Using a fixed viewBox to keep everything in sync. 
// Layers: back wires -> bar with holes -> front wires -> top connector.
// The holes use a mask to actually cut through the glass background.
const VB_W     = 1080;  // viewBox width units
const VB_H     = 58;    // viewBox height (bar + wire overhang)
const BAR_Y    = 10;    // bar starts 10px from top (wire extends above)
const BAR_H    = 38;    // metallic bar height
const HOLE_CY  = BAR_Y + BAR_H / 2;  // = 29  (vertical center of holes)
const HOLE_R   = 7;     // hole punch radius
const WIRE_RX  = 4.5;  // wire ellipse x-radius (narrow = angled view)
const WIRE_RY  = 22;   // wire ellipse y-radius (extends above + below hole center)
const N_HOLES  = 18;

// Pre-compute hole X positions — evenly distributed with padding
const HOLE_PAD = 28;
const HOLE_SPAN = VB_W - HOLE_PAD * 2;
const HOLE_XS = Array.from({ length: N_HOLES }, (_, i) =>
  HOLE_PAD + i * (HOLE_SPAN / (N_HOLES - 1))
);

// SVG path: horizontal connecting wire at the TOP of all front arcs
// This gives the illusion of a single continuous coil passing through every hole
const WIRE_TOP_Y = HOLE_CY - WIRE_RY + 1;
const connectPath = HOLE_XS
  .map((x, i) => (i === 0 ? `M ${x},${WIRE_TOP_Y}` : `L ${x},${WIRE_TOP_Y}`))
  .join(" ");

function SpiralBinding() {
  // Unique ID suffix so masks don't collide if somehow rendered twice
  const uid = "sb";

  return (
    <div className="binding-bar" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        width="100%"
        height={VB_H}
        className="binding-svg"
        style={{ display: "block" }}
      >
        <defs>
          {/* Metallic bar with some gradients for depth */}
          <linearGradient id={`barG-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7A7268" />
            <stop offset="8%"   stopColor="#3A3530" />
            <stop offset="25%"  stopColor="#181410" />
            <stop offset="50%"  stopColor="#111" />
            <stop offset="75%"  stopColor="#2A2520" />
            <stop offset="92%"  stopColor="#3A3530" />
            <stop offset="100%" stopColor="#252018" />
          </linearGradient>

          <linearGradient id={`barHi-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* ── Wire gradient (horizontal sheen — left/right edges dark, centre bright) ── */}
          <linearGradient id={`wireG-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1A1A1A" />
            <stop offset="22%"  stopColor="#888" />
            <stop offset="50%"  stopColor="#ECECEC" />
            <stop offset="78%"  stopColor="#777" />
            <stop offset="100%" stopColor="#1A1A1A" />
          </linearGradient>

          {/* ── Connecting line gradient (horizontal, matches wire) ── */}
          <linearGradient id={`lineG-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#333" />
            <stop offset="15%"  stopColor="#888" />
            <stop offset="50%"  stopColor="#CCC" />
            <stop offset="85%"  stopColor="#888" />
            <stop offset="100%" stopColor="#333" />
          </linearGradient>

          {/* Mask for the punch-holes */}
          <mask id={`holeMask-${uid}`}>
            <rect x="0" y={BAR_Y} width={VB_W} height={BAR_H} fill="white" />
            {HOLE_XS.map((x, i) => (
              <circle key={i} cx={x} cy={HOLE_CY} r={HOLE_R} fill="black" />
            ))}
          </mask>

          {/* ── Clip for BACK arcs: only the portion below HOLE_CY (inside / behind bar) ── */}
          <clipPath id={`backClip-${uid}`}>
            <rect x="0" y={HOLE_CY} width={VB_W} height={VB_H - HOLE_CY + 4} />
          </clipPath>

          {/* ── Clip for FRONT arcs: only the portion above HOLE_CY ── */}
          <clipPath id={`frontClip-${uid}`}>
            <rect x="0" y="0" width={VB_W} height={HOLE_CY + 1} />
          </clipPath>

          {/* ── Hole inner-shadow filter: simulates depth inside a punched hole ── */}
          <filter id={`holeDepth-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.7)" />
          </filter>

          {/* ── Subtle filter for the back arcs (darker, less polished) ── */}
          <filter id={`backFlt-${uid}`}>
            <feColorMatrix type="saturate" values="0.6" />
          </filter>
        </defs>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 1: Back arcs — visible below HOLE_CY (inside the bar gap)
                     These are slightly darker/less shiny than front arcs
        ────────────────────────────────────────────────────────────────── */}
        {HOLE_XS.map((x, i) => (
          <ellipse
            key={`back-${i}`}
            cx={x} cy={HOLE_CY}
            rx={WIRE_RX} ry={WIRE_RY}
            fill={`url(#wireG-${uid})`}
            clipPath={`url(#backClip-${uid})`}
            filter={`url(#backFlt-${uid})`}
            opacity="0.75"
          />
        ))}

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 2: Metallic bar with mask-punched holes
                     The holes are GENUINELY transparent — app bg shows through
        ────────────────────────────────────────────────────────────────── */}
        <rect
          x="0" y={BAR_Y}
          width={VB_W} height={BAR_H}
          fill={`url(#barG-${uid})`}
          mask={`url(#holeMask-${uid})`}
        />
        {/* 1-px top highlight strip */}
        <rect
          x="0" y={BAR_Y}
          width={VB_W} height={3}
          fill={`url(#barHi-${uid})`}
          mask={`url(#holeMask-${uid})`}
          opacity="0.7"
        />

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 3: Hole inner-shadow rings — depth inside each hole
        ────────────────────────────────────────────────────────────────── */}
        {HOLE_XS.map((x, i) => (
          <circle
            key={`hd-${i}`}
            cx={x} cy={HOLE_CY}
            r={HOLE_R}
            fill="none"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="1.5"
            filter={`url(#holeDepth-${uid})`}
          />
        ))}
        {/* Top highlight arc inside each hole (adds realism) */}
        {HOLE_XS.map((x, i) => (
          <path
            key={`hhi-${i}`}
            d={`M ${x - HOLE_R + 2},${HOLE_CY - 3} A ${HOLE_R - 2} ${HOLE_R - 2} 0 0 1 ${x + HOLE_R - 2},${HOLE_CY - 3}`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            fill="none"
          />
        ))}

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 4: Front arcs — visible above HOLE_CY (sticking out in front)
        ────────────────────────────────────────────────────────────────── */}
        {HOLE_XS.map((x, i) => (
          <ellipse
            key={`front-${i}`}
            cx={x} cy={HOLE_CY}
            rx={WIRE_RX} ry={WIRE_RY}
            fill={`url(#wireG-${uid})`}
            clipPath={`url(#frontClip-${uid})`}
          />
        ))}

        {/* Main coil connector */}
        <path
          d={connectPath}
          stroke={`url(#lineG-${uid})`}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────
// A single calendar page (front or back). Contains the hero image, grid, notes.
// ─────────────────────────────────────────────────────────────────────────────
function CalendarPage({
  isFront, year, month, theme, isFlipping, flipClass,
  rangeStart, rangeEnd, hoverDate,
  handleDateClick, handleDateHover, handleDateLeave, clearRange,
  goToPrevMonth, goToNextMonth,
  cornerHovered, setCornerHovered,
  navDir, navKey,
  savedNotes, setSavedNotes,
  onNoteIndicatorClick, onNoteClick,
  pulseRange,
  imgCache, onImgLoad, onImgError,
}) {
  const hasActiveRange = rangeStart && rangeEnd && !isSameDay(rangeStart, rangeEnd);
  const hasSingleSelection = rangeStart && !rangeEnd;
  const dayCount = countDaysInRange(rangeStart, rangeEnd);

  // image cache status passed from parent to prevent flashing
  const imgStatus = imgCache[theme.image] || { loaded: false, error: false };
  const imgLoaded = imgStatus.loaded;
  const imgError  = imgStatus.error;

  return (
    <div
      className={`calendar-page ${isFront ? "flipping-front" : "static-back"} ${isFront && isFlipping ? flipClass : ""}`}
      style={{
        "--accent":     theme.accent,
        "--accent-rgb": theme.accentRgb,
        "--season-hue": theme.hue || "210",
      }}
      aria-hidden={!isFront}
    >
      {/* Corner curl — only on the front (visible) page */}
      {isFront && (
        <div
          className={`page-corner ${cornerHovered ? "corner-hover" : ""} ${isFlipping ? "corner-flipping" : ""}`}
          onMouseEnter={() => setCornerHovered(true)}
          onMouseLeave={() => setCornerHovered(false)}
          onClick={goToNextMonth}
          role="button"
          tabIndex={0}
          aria-label="Flip to next month"
          onKeyDown={e => e.key === "Enter" && goToNextMonth()}
        >
          <div className="corner-fold"><div className="corner-underside" /></div>
          <div className="corner-shadow" />
        </div>
      )}

      {/* Hero photo */}
      <div className={`hero-section ${imgLoaded ? "img-ready" : "img-loading"}`}>
        {/* Fallback background (gradient, shown before image loads or on error) */}
        {!imgLoaded && !imgError && (
          <div className="hero-fallback" />
        )}
        {imgError && (
          <div className="hero-fallback" />
        )}

        {!imgError && (
          <img
            key={theme.image}
            src={theme.image}
            alt={`${theme.month} scenery`}
            className={`hero-img${imgLoaded ? " loaded" : ""}`}
            onLoad={() => onImgLoad(theme.image)}
            onError={() => onImgError(theme.image)}
          />
        )}

        <div className="hero-gradient" />

        <div className="hero-label-block">
          <div className="hero-year-text">{year}</div>
          <div className="hero-month-text">{MONTH_NAMES[month]}</div>
          <div className="hero-season-text">{theme.label}</div>
        </div>

        <div className="hero-nav">
          <button className="nav-btn" onClick={goToPrevMonth} aria-label="Previous month" disabled={isFlipping}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <button className="nav-btn" onClick={goToNextMonth} aria-label="Next month" disabled={isFlipping}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Range status bar */}
      {(hasActiveRange || hasSingleSelection) && (
        <div className="range-status-bar">
          <span className="range-status-text">
            {hasActiveRange ? (
              <>
                <strong>{formatShortDate(rangeStart)}</strong>
                <span className="range-status-count"> → </span>
                <strong>{formatShortDate(rangeEnd)}</strong>
                <span className="range-status-count"> · {dayCount} days</span>
              </>
            ) : (
              <>
                <strong>{formatShortDate(rangeStart)}</strong>
                <span className="range-status-count"> · click another date to set end</span>
              </>
            )}
          </span>
          <button className="range-clear-btn" onClick={clearRange}>Clear</button>
        </div>
      )}

      {/* Two-column body */}
      <div className="calendar-body">
        <div className="calendar-main">
          <CalendarGrid
            year={year} month={month}
            rangeStart={rangeStart} rangeEnd={rangeEnd} hoverDate={hoverDate}
            onDateClick={handleDateClick}
            onDateHover={handleDateHover}
            onDateLeave={handleDateLeave}
            navDir={navDir} navKey={navKey}
            savedNotes={savedNotes}
            onNoteIndicatorClick={onNoteIndicatorClick}
            pulseRange={pulseRange}
          />
        </div>
        <NotesPanel
          rangeStart={rangeStart} rangeEnd={rangeEnd}
          savedNotes={savedNotes} setSavedNotes={setSavedNotes}
          displayMonth={month} displayYear={year}
          onNoteClick={onNoteClick}
        />
      </div>

      {/* Footer */}
      <div className="calendar-footer">
        <div className="footer-month-nav">
          <button className="footer-nav-btn" onClick={goToPrevMonth} disabled={isFlipping} aria-label="Previous month">
            <ChevronLeft size={12} />
          </button>
          <span className="footer-month-label">{MONTH_NAMES[month]}</span>
          <button className="footer-nav-btn" onClick={goToNextMonth} disabled={isFlipping} aria-label="Next month">
            <ChevronRight size={12} />
          </button>
        </div>
        <span className="footer-hint">← → arrow keys to navigate</span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function WallCalendar() {
  const today = new Date();
  const containerRef = useRef(null);

  // "display" state = what's currently shown
  const [displayYear,  setDisplayYear]  = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());

  // "target" state = the month we're flipping TO
  const [targetYear,  setTargetYear]  = useState(today.getFullYear());
  const [targetMonth, setTargetMonth] = useState(today.getMonth());

  // Notes — hoisted so CalendarGrid can show indicators
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const raw = localStorage.getItem("wall_cal_notes");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("wall_cal_notes", JSON.stringify(savedNotes)); }
    catch (e) { console.warn("localStorage write failed", e); }
  }, [savedNotes]);

  // Range selection
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [hoverDate,  setHoverDate]  = useState(null);

  // Page flip animation
  const [isFlipping,     setIsFlipping]     = useState(false);
  const [flipDirection,  setFlipDirection]  = useState(null); // "next" | "prev"
  const flipEndTimer = useRef(null);

  // Grid entrance animation
  const [navDir, setNavDir] = useState("next");
  const [navKey, setNavKey] = useState(0);

  // Corner curl hover
  const [cornerHovered, setCornerHovered] = useState(false);

  // Date pulse highlight (when jumping from a note to its calendar date)
  const [pulseRange,  setPulseRange]  = useState(null);
  const pulseTimer = useRef(null);

  // Global Image Cache: prevents images from resetting/disappearing during flip transitions
  const [imgCache, setImgCache] = useState({});

  const onImgLoad = useCallback((url) => {
    setImgCache(prev => ({ ...prev, [url]: { loaded: true, error: false } }));
  }, []);
  const onImgError = useCallback((url) => {
    setImgCache(prev => ({ ...prev, [url]: { loaded: false, error: true } }));
  }, []);

  // Pre-load logic: Start loading the target image as soon as targetMonth changes
  useEffect(() => {
    const url = MONTH_THEMES[targetMonth].image;
    if (!imgCache[url]) {
      const img = new Image();
      img.src = url;
      img.onload = () => onImgLoad(url);
      img.onerror = () => onImgError(url);
    }
  }, [targetMonth, imgCache, onImgLoad, onImgError]);

  // Reduced-motion user preference
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Sync theme variables on month change
  useEffect(() => {
    const t = MONTH_THEMES[targetMonth];
    const root = document.documentElement;
    root.style.setProperty("--accent",     t.accent);
    root.style.setProperty("--accent-rgb", t.accentRgb);
    root.style.setProperty("--season-hue", t.hue || "210");
    root.style.setProperty("--theme-bg",   t.bg);
  }, [targetMonth]);

  // Global mousedown: clear range if user clicks outside the calendar
  useEffect(() => {
    function onDown(e) {
      if (rangeStart && containerRef.current && !containerRef.current.contains(e.target)) {
        clearRange();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [rangeStart]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  // Using a ref so the handler always calls the latest version of `navigate`
  // without needing it in the deps array (avoids stale closure on displayMonth).
  const navigateRef = useRef(null);

  function navigate(direction) {
    if (isFlipping) return;

    const curMonth = displayMonth;
    const curYear  = displayYear;

    let nextMonth, nextYear;
    if (direction === "prev") {
      nextMonth = curMonth === 0  ? 11 : curMonth - 1;
      nextYear  = curMonth === 0  ? curYear - 1 : curYear;
    } else {
      nextMonth = curMonth === 11 ? 0  : curMonth + 1;
      nextYear  = curMonth === 11 ? curYear + 1 : curYear;
    }

    setTargetMonth(nextMonth);
    setTargetYear(nextYear);
    setFlipDirection(direction);
    setIsFlipping(true);

    const delay = prefersReducedMotion.current ? 16 : FLIP_DURATION;
    if (flipEndTimer.current) clearTimeout(flipEndTimer.current);
    flipEndTimer.current = setTimeout(() => {
      setDisplayMonth(nextMonth);
      setDisplayYear(nextYear);
      setIsFlipping(false);
      setFlipDirection(null);
      setNavDir(direction);
      setNavKey(k => k + 1);
    }, delay);
  }

  // Keep the ref pointing at the latest closure so keyboard handler is never stale
  navigateRef.current = navigate;

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft")  navigateRef.current("prev");
      if (e.key === "ArrowRight") navigateRef.current("next");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []); // empty deps — always reads from ref, never stale

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (flipEndTimer.current) clearTimeout(flipEndTimer.current);
    if (pulseTimer.current)   clearTimeout(pulseTimer.current);
  }, []);

  const goToPrevMonth = () => navigate("prev");
  const goToNextMonth = () => navigate("next");

  // ── Date range selection ───────────────────────────────────────────────────
  function handleDateClick(dateObj) {
    if (!rangeStart) {
      setRangeStart(dateObj); setRangeEnd(null); return;
    }
    if (isSameDay(dateObj, rangeStart) && !rangeEnd) {
      // Clicking the same start date again — treat as single-day range
      setRangeEnd(dateObj); return;
    }
    if (!rangeEnd) {
      if (compareDates(dateObj, rangeStart) < 0) {
        setRangeEnd(rangeStart); setRangeStart(dateObj);
      } else {
        setRangeEnd(dateObj);
      }
      return;
    }
    setRangeStart(dateObj); setRangeEnd(null);
  }

  const handleDateHover  = useCallback(d  => setHoverDate(d), []);
  const handleDateLeave  = useCallback(() => setHoverDate(null), []);
  function clearRange() { setRangeStart(null); setRangeEnd(null); setHoverDate(null); }

  // Match note card to grid date
  function handleNoteIndicatorClick(dateObj) {
    const note = savedNotes.find(n =>
      n.rangeStart &&
      compareDates(dateObj, n.rangeStart) >= 0 &&
      compareDates(dateObj, n.rangeEnd || n.rangeStart) <= 0
    );
    if (!note) return;
    const card = document.getElementById(`note-card-${note.id}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      card.classList.remove("highlight");
      void card.offsetWidth; // force reflow so animation restarts
      card.classList.add("highlight");
    }
  }

  // ── Jump to a note's month and highlight its dates ─────────────────────────
  function jumpToNote(note) {
    if (!note.rangeStart) return;

    setRangeStart(note.rangeStart);
    setRangeEnd(note.rangeEnd);
    setPulseRange({ start: note.rangeStart, end: note.rangeEnd });
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulseRange(null), 2200);

    if (note.displayMonth !== displayMonth || note.displayYear !== displayYear) {
      const goNext =
        note.displayYear > displayYear ||
        (note.displayYear === displayYear && note.displayMonth > displayMonth);
      navigate(goNext ? "next" : "prev");
      // navigate() sets targetMonth/Year but we need to override them to the note's month
      setTargetMonth(note.displayMonth);
      setTargetYear(note.displayYear);
    }
  }

  // Page flip class handler
  let flipClass = "";
  if (isFlipping && flipDirection === "next") flipClass = "flipping-next";
  if (isFlipping && flipDirection === "prev") flipClass = "flipping-prev";

  const isReverse = flipDirection === "prev";
  const frontMonth = isReverse ? targetMonth : displayMonth;
  const frontYear  = isReverse ? targetYear  : displayYear;
  const backMonth  = isReverse ? displayMonth : targetMonth;
  const backYear   = isReverse ? displayYear  : targetYear;

  const pageProps = {
    rangeStart, rangeEnd, hoverDate,
    handleDateClick, handleDateHover, handleDateLeave, clearRange,
    goToPrevMonth, goToNextMonth,
    cornerHovered, setCornerHovered,
    navDir, navKey,
    savedNotes, setSavedNotes,
    onNoteIndicatorClick: handleNoteIndicatorClick,
    onNoteClick: jumpToNote,
    pulseRange,
    imgCache, onImgLoad, onImgError,
  };

  return (
    // app-shell: provides the animated glassy background behind the calendar card
    <div className="app-shell">
      <div className="calendar-wrapper" ref={containerRef}>
        <div className="calendar-outer">
          {/* SVG spiral binding — sits above both pages due to z-index */}
          <SpiralBinding />

          {/* Back page (target month) — revealed underneath the flipping front */}
          <CalendarPage
            isFront={false}
            month={backMonth} year={backYear}
            theme={MONTH_THEMES[backMonth]}
            isFlipping={isFlipping} flipClass={flipClass}
            {...pageProps}
          />

          {/* Front page (current month) — peels off during animation */}
          <CalendarPage
            isFront={true}
            month={frontMonth} year={frontYear}
            theme={MONTH_THEMES[frontMonth]}
            isFlipping={isFlipping} flipClass={flipClass}
            {...pageProps}
          />
        </div>
      </div>
    </div>
  );
}
