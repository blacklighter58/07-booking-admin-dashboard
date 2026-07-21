import {
  CALENDAR_END_MINUTES,
  CALENDAR_START_MINUTES,
  GRID_HEIGHT,
  GRID_MINUTE_HEIGHT,
  GRID_STEP_MINUTES,
  formatCalendarDate,
  getWeekDates,
  minutesToTime,
  timeToMinutes,
} from "./dateUtils.js";

const CALENDAR_HEADER_HEIGHT = 56;

function getEventEnd(booking) {
  const start = timeToMinutes(booking.time);
  return start + (booking.durationMinutes || 60);
}

function getColumns({ view, date, employees, employeeId, bookings }) {
  if (view === "week") {
    return getWeekDates(date).map((value) => ({ id: value, label: formatCalendarDate(value, { weekday: "short", day: "numeric", month: "short" }), date: value }));
  }

  const selectedEmployees = employeeId === "all" ? employees : employees.filter((employee) => employee.id === employeeId);
  if (selectedEmployees.length) return selectedEmployees.map((employee) => ({ ...employee, label: employee.name }));
  if (bookings.some((booking) => !booking.employeeId)) return [{ id: "unassigned", name: "Не указан", label: "Не указан" }];
  return [];
}

function getColumnEvents(column, { view, date, bookings }) {
  const events = bookings.filter((booking) => {
    if (view === "week") return booking.date === column.date;
    if (booking.date !== date) return false;
    return column.id === "unassigned" ? !booking.employeeId : booking.employeeId === column.id;
  });

  return events
    .map((booking) => ({ booking, start: timeToMinutes(booking.time), end: getEventEnd(booking) }))
    .filter((event) => event.start !== null && event.end > CALENDAR_START_MINUTES && event.start < CALENDAR_END_MINUTES)
    .sort((first, second) => first.start - second.start || second.end - first.end);
}

function assignEventLanes(events) {
  const groups = [];
  let group = [];
  let groupEnd = -1;

  const pushGroup = () => {
    if (!group.length) return;
    const active = [];
    let laneCount = 1;
    group.forEach((event) => {
      for (let index = active.length - 1; index >= 0; index -= 1) {
        if (active[index].end <= event.start) active.splice(index, 1);
      }
      let lane = 0;
      while (active.some((activeEvent) => activeEvent.lane === lane)) lane += 1;
      event.lane = lane;
      active.push(event);
      laneCount = Math.max(laneCount, lane + 1);
    });
    group.forEach((event) => { event.laneCount = laneCount; });
    groups.push(...group);
    group = [];
    groupEnd = -1;
  };

  events.forEach((event) => {
    if (group.length && event.start >= groupEnd) pushGroup();
    group.push(event);
    groupEnd = Math.max(groupEnd, event.end);
  });
  pushGroup();
  return groups;
}

function fallbackColor(service) {
  const palette = ["#a8d78c", "#f1ca72", "#c0b4e5", "#91cbd1", "#f0aead"];
  const hash = [...String(service || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function createEvent(event, { view, employeeId, onBookingClick }) {
  const { booking } = event;
  const top = Math.max(0, event.start - CALENDAR_START_MINUTES) * GRID_MINUTE_HEIGHT;
  const height = Math.max(GRID_STEP_MINUTES, Math.min(CALENDAR_END_MINUTES, event.end) - Math.max(CALENDAR_START_MINUTES, event.start)) * GRID_MINUTE_HEIGHT;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `calendar-event calendar-event--${booking.status || "unknown"}`;
  button.style.top = `${top}px`;
  button.style.height = `${height}px`;
  button.style.left = `${(event.lane / event.laneCount) * 100}%`;
  button.style.width = `${100 / event.laneCount}%`;
  button.style.setProperty("--event-color", booking.serviceColor || fallbackColor(booking.service));
  button.title = `${booking.time} · ${booking.clientName} · ${booking.service}`;
  button.dataset.bookingId = booking.id;

  const time = document.createElement("strong");
  time.textContent = `${booking.time} — ${minutesToTime(event.end)}`;
  const client = document.createElement("span");
  client.textContent = booking.clientName;
  const service = document.createElement("small");
  service.textContent = height < 54 ? booking.service : `${booking.service} · ${booking.durationMinutes || 60} мин`;
  button.append(time, client, service);
  if (view === "week" && employeeId === "all") {
    const employee = document.createElement("small");
    employee.className = "calendar-event__employee";
    employee.textContent = booking.employeeName || "Не указан";
    button.append(employee);
  }
  button.addEventListener("click", () => onBookingClick(booking, button));
  return button;
}

function createTimeScale() {
  const scale = document.createElement("div");
  scale.className = "calendar-time-scale";
  for (let minutes = CALENDAR_START_MINUTES; minutes <= CALENDAR_END_MINUTES; minutes += GRID_STEP_MINUTES) {
    const label = document.createElement("span");
    label.style.top = `${CALENDAR_HEADER_HEIGHT + (minutes - CALENDAR_START_MINUTES) * GRID_MINUTE_HEIGHT}px`;
    label.textContent = minutesToTime(minutes);
    scale.append(label);
  }
  return scale;
}

function createColumnHeading(column, view) {
  const heading = document.createElement("h3");
  if (view === "week") {
    heading.textContent = column.label;
    return heading;
  }

  heading.className = "calendar-employee";
  const name = document.createElement("span");
  name.className = "calendar-employee__name";
  name.textContent = column.label;
  heading.append(name);
  return heading;
}

export function renderCalendarGrid(container, options) {
  const columns = getColumns(options);
  container.replaceChildren();
  if (!columns.length) {
    const empty = document.createElement("p");
    empty.className = "calendar-empty";
    empty.textContent = options.employees.length ? "Нет сотрудников для выбранного фильтра." : "Нет активных сотрудников.";
    container.append(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = `calendar-grid calendar-grid--${options.view}`;
  grid.style.setProperty("--calendar-columns", columns.length);
  grid.style.setProperty("--calendar-grid-height", `${GRID_HEIGHT}px`);
  grid.style.setProperty("--calendar-half-hour", `${GRID_STEP_MINUTES * GRID_MINUTE_HEIGHT}px`);
  grid.style.setProperty("--calendar-hour", `${GRID_STEP_MINUTES * 2 * GRID_MINUTE_HEIGHT}px`);
  grid.style.setProperty("--calendar-header-height", `${CALENDAR_HEADER_HEIGHT}px`);
  grid.style.minWidth = `${78 + columns.length * 220}px`;
  grid.append(createTimeScale());
  const columnsContainer = document.createElement("div");
  columnsContainer.className = "calendar-grid__columns";

  columns.forEach((column) => {
    const columnElement = document.createElement("section");
    columnElement.className = "calendar-grid__column";
    const heading = createColumnHeading(column, options.view);
    const body = document.createElement("div");
    body.className = "calendar-grid__body";
    body.style.height = `${GRID_HEIGHT}px`;
    if (typeof options.onSlotClick === "function") {
      body.addEventListener("click", (event) => {
        if (event.target !== body) return;
        const offset = event.clientY - body.getBoundingClientRect().top;
        const minutes = CALENDAR_START_MINUTES + Math.max(0, Math.min(GRID_HEIGHT - 1, offset)) / GRID_MINUTE_HEIGHT;
        const snapped = Math.floor(minutes / GRID_STEP_MINUTES) * GRID_STEP_MINUTES;
        options.onSlotClick({
          date: options.view === "week" ? column.date : options.date,
          time: minutesToTime(snapped),
          employeeId: options.view === "day" && column.id !== "unassigned" ? column.id : (options.employeeId === "all" ? "" : options.employeeId),
        }, body);
      });
    }
    assignEventLanes(getColumnEvents(column, options)).forEach((event) => body.append(createEvent(event, options)));
    columnElement.append(heading, body);
    columnsContainer.append(columnElement);
  });
  grid.append(columnsContainer);
  container.append(grid);
}
