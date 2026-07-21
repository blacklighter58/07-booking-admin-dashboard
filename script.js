import { cancelBooking, createBooking, getBooking, getBookings, restoreBooking, updateBooking, updateBookingStatus } from "./src/api/bookingsApi.js";
import { getAvailableSlots } from "./src/api/availabilityApi.js";
import { createEmployee, deleteEmployeeFromApi, getEmployees, updateEmployee, updateEmployeeServices } from "./src/api/employeesApi.js";
import { createService, deleteServiceFromApi, getServices, updateService } from "./src/api/servicesApi.js";
import { createClient, getClient, getClients, mergeClient, updateClient } from "./src/api/clientsApi.js";
import { getDashboardOverview } from "./src/api/overviewApi.js";
import { clearAuthToken, getAuthToken, login } from "./src/api/authApi.js";
import { changePassword, getSettings, logoutAll, testTelegramConnection, updateSettings } from "./src/api/settingsApi.js";
import { addCalendarDays, formatCalendarTitle, getCalendarRange, minutesToTime, startOfWeek, timeToMinutes, todayIsoDate } from "./src/calendar/dateUtils.js";
import { renderCalendarGrid } from "./src/calendar/calendarGrid.js";
import { BOOKING_STATUS_LABELS, normalizeBookingStatus } from "./src/bookingStatuses.js";
import { refreshBookingViews } from "./src/bookingRefresh.js";
import { normalizeBookingTime } from "./src/bookingTime.js";

const LOGIN_ROUTE = "#/login";
const BOOKINGS_ROUTE = "#bookings";
const CALENDAR_ROUTE = "#calendar";
const SERVICES_ROUTE = "#services";
const EMPLOYEES_ROUTE = "#employees";
const CLIENTS_ROUTE = "#clients";
const OVERVIEW_ROUTE = "#overview";
const SETTINGS_ROUTE = "#settings";

const VALID_SERVICES = new Set([
  "Брови",
  "Ламинирование ресниц",
  "Дневной макияж",
  "Вечерний макияж",
  "Комплекс"
]);

const statusLabels = BOOKING_STATUS_LABELS;
const bookingDiagnosticsEnabled = import.meta.env.VITE_BOOKING_DIAGNOSTICS === "true";

function logBookingDiagnostics(event, details) {
  if (bookingDiagnosticsEnabled) console.info("Booking diagnostics", { event, ...details });
}

const elements = {
  loginPage: document.querySelector("#loginPage"),
  dashboardPage: document.querySelector("#dashboardPage"),
  loginForm: document.querySelector("#loginForm"),
  loginInput: document.querySelector("#loginInput"),
  passwordInput: document.querySelector("#passwordInput"),
  loginError: document.querySelector("#loginError"),
  loginSubmit: document.querySelector("#loginSubmit"),
  loginSubmitLabel: document.querySelector(".login-submit__label"),
  loginSubmitLoader: document.querySelector(".login-submit__loader"),
  logoutButton: document.querySelector("#logoutButton"),
  tableBody: document.querySelector("#bookingsTableBody"),
  search: document.querySelector("#bookingSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  employeeFilter: document.querySelector("#employeeFilter"),
  calendarEmployeeFilter: document.querySelector("#calendarEmployeeFilter"),
  sort: document.querySelector("#bookingSort"),
  resetButton: document.querySelector("#resetFilters"),
  refreshButton: document.querySelector("#refreshBookingsButton"),
  resultsCount: document.querySelector("#resultsCount"),
  sidebarCount: document.querySelector("#sidebarBookingCount"),
  sidebar: document.querySelector("#sidebar"),
  sidebarOverlay: document.querySelector("[data-sidebar-overlay]"),
  menuOpenButton: document.querySelector("[data-menu-open]"),
  menuCloseButton: document.querySelector("[data-menu-close]"),
  currentDate: document.querySelector("#currentDate"),
  dataSourceNote: document.querySelector("#dataSourceNote"),
  pageEyebrow: document.querySelector(".page-header > div:first-child .page-header__eyebrow"),
  pageTitle: document.querySelector(".page-header h1"),
  pageSubtitle: document.querySelector(".page-header__subtitle"),
  sidebarBusinessName: document.querySelector("#sidebarBusinessName"), headerBusinessName: document.querySelector("#headerBusinessName"),
  addButton: document.querySelector("#addBookingButton"),
  bookingsPanel: document.querySelector(".bookings-panel"),
  statsGrid: document.querySelector(".stats-grid"),
  bookingsOverview: document.querySelector("#bookingsOverview"),
  bookingStatusDonut: document.querySelector("#bookingStatusDonut"),
  bookingStatusTotal: document.querySelector("#bookingStatusTotal"),
  bookingStatusList: document.querySelector("#bookingStatusList"),
  bookingUpcomingList: document.querySelector("#bookingUpcomingList"),
  bookingSourceList: document.querySelector("#bookingSourceList"),
  clientsOverview: document.querySelector("#clientsOverview"),
  overviewPanel: document.querySelector("#overviewPanel"), overviewNavLink: document.querySelector("#overviewNavLink"), overviewDate: document.querySelector("#overviewDate"), overviewState: document.querySelector("#overviewState"), overviewContent: document.querySelector("#overviewContent"), overviewTotal: document.querySelector("#overviewTotal"), overviewProgressText: document.querySelector("#overviewProgressText"), overviewProgress: document.querySelector("#overviewProgress"), overviewConfirmed: document.querySelector("#overviewConfirmed"), overviewPending: document.querySelector("#overviewPending"), overviewExpected: document.querySelector("#overviewExpected"), overviewCompletedRevenue: document.querySelector("#overviewCompletedRevenue"), overviewAttention: document.querySelector("#overviewAttention"), overviewUpcoming: document.querySelector("#overviewUpcoming"), overviewChart: document.querySelector("#overviewChart"), overviewEmployees: document.querySelector("#overviewEmployees"), overviewServices: document.querySelector("#overviewServices"), overviewSources: document.querySelector("#overviewSources"), overviewFreeSlots: document.querySelector("#overviewFreeSlots"), overviewNewBooking: document.querySelector("#overviewNewBooking"), overviewNewClient: document.querySelector("#overviewNewClient"),
  clientStats: document.querySelectorAll("[data-client-stat]"),
  clientStatNotes: document.querySelectorAll("[data-client-stat-note]"),
  bookingsNavLink: document.querySelector('a[href="#bookings"]'),
  calendarNavLink: document.querySelector("#calendarNavLink"),
  calendarPanel: document.querySelector("#calendarPanel"),
  calendarPeriod: document.querySelector("#calendarPeriod"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarState: document.querySelector("#calendarState"),
  calendarTodayButton: document.querySelector("#calendarTodayButton"),
  calendarUpcoming: document.querySelector("#calendarUpcoming"),
  calendarStatsPeriod: document.querySelector("#calendarStatsPeriod"),
  calendarStatTotal: document.querySelector("#calendarStatTotal"),
  calendarStatConfirmed: document.querySelector("#calendarStatConfirmed"),
  calendarStatPending: document.querySelector("#calendarStatPending"),
  calendarStatCancelled: document.querySelector("#calendarStatCancelled"),
  calendarDonut: document.querySelector("#calendarDonut"),
  calendarDonutTotal: document.querySelector("#calendarDonutTotal"),
  calendarStatAll: document.querySelector("#calendarStatAll"),
  servicesPanel: document.querySelector("#servicesPanel"), servicesNavLink: document.querySelector("#servicesNavLink"), servicesTableBody: document.querySelector("#servicesTableBody"), servicesState: document.querySelector("#servicesState"), addServiceButton: document.querySelector("#addServiceButton"),
  employeesPanel: document.querySelector("#employeesPanel"), employeesNavLink: document.querySelector("#employeesNavLink"), employeesTableBody: document.querySelector("#employeesTableBody"), employeesState: document.querySelector("#employeesState"), addEmployeeButton: document.querySelector("#addEmployeeButton"),
  clientsPanel: document.querySelector("#clientsPanel"), clientsNavLink: document.querySelector("#clientsNavLink"), clientsTableBody: document.querySelector("#clientsTableBody"), clientsState: document.querySelector("#clientsState"), clientsSummary: document.querySelector("#clientsSummary"), clientsSearch: document.querySelector("#clientsSearch"), clientsTagFilter: document.querySelector("#clientsTagFilter"), clientsFavoriteFilter: document.querySelector("#clientsFavoriteFilter"), clientsSort: document.querySelector("#clientsSort"), refreshClientsButton: document.querySelector("#refreshClientsButton"), clientsPrevious: document.querySelector("#clientsPrevious"), clientsNext: document.querySelector("#clientsNext"), clientsPage: document.querySelector("#clientsPage"), addClientButton: document.querySelector("#addClientButton"),
  settingsPanel: document.querySelector("#settingsPanel"), settingsNavLink: document.querySelector("#settingsNavLink"), settingsForm: document.querySelector("#settingsForm"), settingsState: document.querySelector("#settingsState"), settingsRetryButton: document.querySelector("#settingsRetryButton"), settingsUnsaved: document.querySelector("#settingsUnsaved"), saveSettingsButton: document.querySelector("#saveSettingsButton"), telegramConnectionState: document.querySelector("#telegramConnectionState"), testTelegramButton: document.querySelector("#testTelegramButton"), changePasswordForm: document.querySelector("#changePasswordForm"), currentPassword: document.querySelector("#currentPassword"), newPassword: document.querySelector("#newPassword"), confirmPassword: document.querySelector("#confirmPassword"), logoutAllButton: document.querySelector("#logoutAllButton"), logoutAllConfirmation: document.querySelector("#logoutAllConfirmation"), confirmLogoutAllButton: document.querySelector("#confirmLogoutAllButton"), cancelLogoutAllButton: document.querySelector("#cancelLogoutAllButton"),
  settingsDiscardDialog: document.querySelector("#settingsDiscardDialog"), keepSettingsButton: document.querySelector("#keepSettingsButton"), discardSettingsButton: document.querySelector("#discardSettingsButton"),
  clientDialog: document.querySelector("#clientDialog"), clientForm: document.querySelector("#clientForm"), clientDialogTitle: document.querySelector("#clientDialogTitle"), clientDialogSubtitle: document.querySelector("#clientDialogSubtitle"), clientMetrics: document.querySelector("#clientMetrics"), clientRecordName: document.querySelector("#clientRecordName"), clientRecordPhone: document.querySelector("#clientRecordPhone"), clientRecordTelegram: document.querySelector("#clientRecordTelegram"), clientRecordTags: document.querySelector("#clientRecordTags"), clientRecordNotes: document.querySelector("#clientRecordNotes"), clientRecordFavorite: document.querySelector("#clientRecordFavorite"), clientHistory: document.querySelector("#clientHistory"), clientHistoryList: document.querySelector("#clientHistoryList"), mergeClientButton: document.querySelector("#mergeClientButton"), clientMergePanel: document.querySelector("#clientMergePanel"), clientMergeTarget: document.querySelector("#clientMergeTarget"), confirmMergeClientButton: document.querySelector("#confirmMergeClientButton"), saveClientButton: document.querySelector("#saveClientButton"),
  serviceDialog: document.querySelector("#serviceDialog"), serviceForm: document.querySelector("#serviceForm"), serviceName: document.querySelector("#serviceName"), serviceDescription: document.querySelector("#serviceDescription"), serviceDuration: document.querySelector("#serviceDuration"), servicePrice: document.querySelector("#servicePrice"), serviceColor: document.querySelector("#serviceColor"), serviceActive: document.querySelector("#serviceActive"), saveServiceButton: document.querySelector("#saveServiceButton"),
  employeeDialog: document.querySelector("#employeeDialog"), employeeForm: document.querySelector("#employeeForm"), employeeName: document.querySelector("#employeeName"), employeeDescription: document.querySelector("#employeeDescription"), employeeColor: document.querySelector("#employeeColor"), employeeStart: document.querySelector("#employeeStart"), employeeEnd: document.querySelector("#employeeEnd"), employeeDays: document.querySelector("#employeeDays"), employeeServices: document.querySelector("#employeeServices"), employeeActive: document.querySelector("#employeeActive"), saveEmployeeButton: document.querySelector("#saveEmployeeButton"),
  bookingDialog: document.querySelector("#bookingDialog"),
  bookingForm: document.querySelector("#bookingForm"),
  dialogTitle: document.querySelector("#bookingDialogTitle"),
  dialogId: document.querySelector("#bookingDialogId"),
  deleteButton: document.querySelector("#deleteBookingButton"),
  confirmBookingButton: document.querySelector("#confirmBookingButton"),
  completeBookingButton: document.querySelector("#completeBookingButton"),
  cancelBookingButton: document.querySelector("#cancelBookingButton"),
  bookingDetails: document.querySelector("#bookingDetails"),
  detailEmployee: document.querySelector("#detailEmployee"),
  detailEndTime: document.querySelector("#detailEndTime"),
  detailDuration: document.querySelector("#detailDuration"),
  detailTelegram: document.querySelector("#detailTelegram"),
  clientName: document.querySelector("#clientName"),
  phone: document.querySelector("#phone"),
  service: document.querySelector("#service"),
  bookingDate: document.querySelector("#bookingDate"),
  bookingTime: document.querySelector("#bookingTime"),
  bookingStatus: document.querySelector("#bookingStatus"),
  comment: document.querySelector("#comment"),
  toast: document.querySelector("#toast")
};

document.querySelector(".clients-toolbar").append(elements.addClientButton);
elements.addClientButton.classList.add("clients-add-button");
document.querySelector(".clients-table thead th:last-child").textContent = "Действие";

function ensureManualBookingControls() {
  const serviceField = elements.service.closest("label");
  const employeeField = document.createElement("label");
  employeeField.className = "form-field";
  employeeField.innerHTML = '<span>Сотрудник <b aria-hidden="true">*</b></span><select id="bookingEmployee" required disabled><option value="">Сначала выберите услугу</option></select>';
  serviceField.insertAdjacentElement("afterend", employeeField);

  const telegramField = document.createElement("label");
  telegramField.className = "form-field form-field--full";
  telegramField.innerHTML = '<span>Telegram username</span><input id="telegramUsername" maxlength="64" autocomplete="off" placeholder="@username (необязательно)">';
  elements.phone.closest("label").insertAdjacentElement("afterend", telegramField);

  const timeInput = elements.bookingTime;
  const timeSelect = document.createElement("select");
  timeSelect.id = "bookingTime";
  timeSelect.name = "time";
  timeSelect.required = true;
  timeSelect.disabled = true;
  timeSelect.innerHTML = '<option value="">Выберите дату</option>';
  timeInput.replaceWith(timeSelect);

  const restoreButton = document.createElement("button");
  restoreButton.className = "secondary-button";
  restoreButton.type = "button";
  restoreButton.id = "restoreBookingButton";
  restoreButton.hidden = true;
  restoreButton.textContent = "Восстановить";
  elements.cancelBookingButton.insertAdjacentElement("afterend", restoreButton);

  elements.bookingEmployee = timeSelect.form.querySelector("#bookingEmployee");
  elements.telegramUsername = timeSelect.form.querySelector("#telegramUsername");
  elements.bookingTime = timeSelect;
  elements.restoreBookingButton = restoreButton;
  const sourceDetail = document.createElement("div");
  sourceDetail.innerHTML = '<dt>Источник</dt><dd id="detailSource"></dd>';
  const createdDetail = document.createElement("div");
  createdDetail.innerHTML = '<dt>Создана</dt><dd id="detailCreated"></dd>';
  const cancellationDetail = document.createElement("div");
  cancellationDetail.hidden = true;
  cancellationDetail.innerHTML = '<dt>Причина отмены</dt><dd id="detailCancellation"></dd>';
  elements.bookingDetails.append(sourceDetail, createdDetail, cancellationDetail);
  elements.detailSource = sourceDetail.querySelector("dd");
  elements.detailCreated = createdDetail.querySelector("dd");
  elements.detailCancellation = cancellationDetail.querySelector("dd");
  elements.detailCancellationRow = cancellationDetail;
  elements.deleteButton.hidden = true;
}

ensureManualBookingControls();

let editingBookingId = null;
let toastTimer;
let bookings = [];
let employees = [];
let calendarBookings = [];
let calendarWeekBookings = [];
let calendarAllBookings = [];
let services = [];
let managementEmployees = [];
let clients = [];
let clientsPage = 1;
let clientsPages = 1;
let clientsTotal = 0;
let clientsSearchTimer;
let editingClientId = null;
let editingServiceId = null;
let editingEmployeeId = null;
let calendarView = "day";
let calendarDate = todayIsoDate();
let isLoadingCalendar = false;
let isLoadingBookings = false;
let initialFormState = "";
let isFormDirty = false;
let dialogTrigger = null;
let dialogFocusTarget = null;
let dashboardStarted = false;
let overviewPeriod = "today";
let overviewRequestController = null;
let currentSettings = { businessName: "Beauty-студия", currency: "RUB", language: "ru", timezone: "Europe/Moscow" };
let settingsInitialState = "";
let isSavingSettings = false;
let pendingSettingsRoute = null;
let allowSettingsRouteChange = false;

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const currentDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

const createdDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function formatBookingDate(date) {
  return new Intl.DateTimeFormat(currentSettings.language || "ru", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(" г.", "");
}

function formatCreatedAt(createdAt) {
  return new Intl.DateTimeFormat(currentSettings.language || "ru", { day: "numeric", month: "long", year: "numeric", timeZone: currentSettings.timezone || "Europe/Moscow" }).format(new Date(createdAt));
}

function normalizeBookingDate(rawDate) {
  if (typeof rawDate !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

  const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function normalizeBooking(rawBooking) {
  if (!rawBooking || typeof rawBooking !== "object") return null;

  const id = typeof rawBooking.id === "string" || typeof rawBooking.id === "number"
    ? String(rawBooking.id)
    : "";
  const clientName = typeof rawBooking.clientName === "string" ? rawBooking.clientName.trim() : "";
  const phone = typeof rawBooking.phone === "string" ? rawBooking.phone.trim() : "";
  const service = typeof rawBooking.service === "string" ? rawBooking.service.trim() : "";
  const date = normalizeBookingDate(rawBooking.date);
  const time = normalizeBookingTime(rawBooking.time);
  const status = normalizeBookingStatus(rawBooking.status);
  const createdAt = typeof rawBooking.createdAt === "string" && !Number.isNaN(Date.parse(rawBooking.createdAt))
    ? rawBooking.createdAt
    : "1970-01-01T00:00:00.000Z";

  if (
    !id ||
    !clientName ||
    !phone ||
    service.length < 2 ||
    !date ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return null;
  }

  return {
    id,
    clientName,
    phone,
    service,
    serviceId: typeof rawBooking.serviceId === "string" ? rawBooking.serviceId : null,
    durationMinutes: Number.isInteger(rawBooking.durationMinutes) && rawBooking.durationMinutes > 0 ? rawBooking.durationMinutes : null,
    serviceColor: typeof rawBooking.serviceColor === "string" ? rawBooking.serviceColor : null,
    employeeId: typeof rawBooking.employeeId === "string" ? rawBooking.employeeId : null,
    employeeName: typeof rawBooking.employeeName === "string" && rawBooking.employeeName.trim() ? rawBooking.employeeName.trim() : null,
    telegramUserId: typeof rawBooking.telegramUserId === "string" ? rawBooking.telegramUserId : null,
    telegramUsername: typeof rawBooking.telegramUsername === "string" ? rawBooking.telegramUsername : null,
    source: typeof rawBooking.source === "string" ? rawBooking.source : null,
    cancelledAt: typeof rawBooking.cancelledAt === "string" ? rawBooking.cancelledAt : null,
    cancellationReason: typeof rawBooking.cancellationReason === "string" ? rawBooking.cancellationReason : null,
    date,
    time,
    status,
    comment: typeof rawBooking.comment === "string" ? rawBooking.comment.slice(0, 300) : "",
    createdAt,
    updatedAt: typeof rawBooking.updatedAt === "string" ? rawBooking.updatedAt : null,
  };
}

function getBookingStatus(booking) {
  return normalizeBookingStatus(booking.status);
}

function sortBookings(bookingsToSort) {
  return [...bookingsToSort].sort((firstBooking, secondBooking) => {
    if (elements.sort.value === "date-asc") {
      return `${firstBooking.date}T${firstBooking.time}`.localeCompare(`${secondBooking.date}T${secondBooking.time}`);
    }
    if (elements.sort.value === "date-desc") {
      return `${secondBooking.date}T${secondBooking.time}`.localeCompare(`${firstBooking.date}T${firstBooking.time}`);
    }
    if (elements.sort.value === "name-asc") {
      return firstBooking.clientName.localeCompare(secondBooking.clientName, "ru-RU");
    }
    return Date.parse(secondBooking.createdAt) - Date.parse(firstBooking.createdAt)
      || String(secondBooking.id).localeCompare(String(firstBooking.id));
  });
}

function getFilteredBookings() {
  const query = elements.search.value.trim().toLocaleLowerCase("ru-RU");
  const status = elements.statusFilter.value;
  const employeeId = elements.employeeFilter.value;
  const queryDigits = query.replace(/\D/g, "");

  const filteredBookings = bookings.filter((booking) => {
    const searchableText = [booking.clientName, booking.phone, booking.service]
      .join(" ")
      .toLocaleLowerCase("ru-RU");
    const phoneDigits = booking.phone.replace(/\D/g, "");
    const matchesText = !query || searchableText.includes(query);
    const matchesPhone = queryDigits.length >= 3 && phoneDigits.includes(queryDigits);
    const matchesStatus = status === "all" || getBookingStatus(booking) === status;
    const matchesEmployee = employeeId === "all" || booking.employeeId === employeeId;

    return (matchesText || matchesPhone) && matchesStatus && matchesEmployee;
  });

  return sortBookings(filteredBookings);
}

function createBookingRow(booking) {
  const row = document.createElement("tr");

  const clientCell = document.createElement("td");
  clientCell.className = "client-cell";
  clientCell.dataset.label = "Клиент";
  const clientName = document.createElement("strong");
  clientName.textContent = booking.clientName;
  const bookingId = document.createElement("span");
  bookingId.className = "booking-id";
  bookingId.textContent = `Заявка #${booking.id}`;
  clientCell.append(clientName, bookingId);

  const contactCell = document.createElement("td");
  contactCell.dataset.label = "Контакт";
  const phoneLink = document.createElement("a");
  phoneLink.className = "phone-link";
  phoneLink.href = `tel:${booking.phone.replace(/\D/g, "")}`;
  phoneLink.textContent = booking.phone;
  contactCell.append(phoneLink);

  const serviceCell = document.createElement("td");
  serviceCell.className = "service-cell";
  serviceCell.dataset.label = "Услуга";
  const serviceName = document.createElement("strong");
  serviceName.textContent = booking.service;
  serviceCell.append(serviceName);
  if (booking.durationMinutes) {
    const duration = document.createElement("span");
    duration.textContent = `${booking.durationMinutes} мин`;
    serviceCell.append(duration);
  }

  const employeeCell = document.createElement("td");
  employeeCell.className = "employee-cell";
  employeeCell.dataset.label = "Сотрудник";
  employeeCell.textContent = booking.employeeName || "Не указан";

  const dateCell = document.createElement("td");
  dateCell.className = "date-cell";
  dateCell.dataset.label = "Дата и время";
  const date = document.createElement("strong");
  date.textContent = formatBookingDate(booking.date);
  const time = document.createElement("span");
  time.textContent = booking.time;
  dateCell.append(date, time);

  const statusCell = document.createElement("td");
  statusCell.dataset.label = "Статус";
  const status = document.createElement("span");
  const statusKey = getBookingStatus(booking);
  status.className = `status-badge status-badge--${statusKey}`;
  status.textContent = statusLabels[statusKey];
  statusCell.append(status);

  const sourceCell = document.createElement("td");
  sourceCell.className = "booking-source-cell";
  sourceCell.dataset.label = "Источник";
  const source = document.createElement("span");
  source.className = "booking-source-badge";
  source.textContent = formatBookingSource(booking.source);
  sourceCell.append(source);

  const actionCell = document.createElement("td");
  actionCell.className = "action-cell";
  const actionButton = document.createElement("button");
  actionButton.className = "row-action";
  actionButton.type = "button";
  actionButton.dataset.bookingId = booking.id;
  actionButton.setAttribute("aria-label", `Открыть заявку ${booking.id} клиента ${booking.clientName}`);
  actionButton.title = "Открыть заявку";
  const actionIcon = document.createElement("span");
  actionIcon.className = "row-action__icon";
  actionIcon.setAttribute("aria-hidden", "true");
  actionIcon.textContent = "•••";
  const actionLabel = document.createElement("span");
  actionLabel.className = "row-action__label";
  actionLabel.textContent = "Открыть заявку";
  actionButton.append(actionIcon, actionLabel);
  actionCell.append(actionButton);

  row.append(clientCell, contactCell, serviceCell, employeeCell, dateCell, statusCell, sourceCell, actionCell);

  return row;
}

function renderEmptyState() {
  const row = document.createElement("tr");
  row.className = "empty-state";
  row.innerHTML = `
    <td colspan="7">
      <span class="empty-state__icon" aria-hidden="true">⌕</span>
      <strong>Заявки не найдены</strong>
      <p>Измените запрос или сбросьте выбранные фильтры.</p>
    </td>
  `;
  elements.tableBody.append(row);
}

function createTableState(type, title, message, actionLabel = "") {
  const row = document.createElement("tr");
  row.className = `table-state table-state--${type}`;

  const cell = document.createElement("td");
  cell.colSpan = 7;
  const icon = document.createElement("span");
  icon.className = "table-state__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = type === "loading" ? "…" : "!";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const description = document.createElement("p");
  description.textContent = message;
  cell.append(icon, heading, description);

  if (actionLabel) {
    const action = document.createElement("button");
    action.className = "state-action";
    action.type = "button";
    action.dataset.retryBookings = "true";
    action.textContent = actionLabel;
    cell.append(action);
  }

  row.append(cell);
  return row;
}

function renderLoadingState() {
  elements.tableBody.replaceChildren(
    createTableState("loading", "Загружаем заявки", "Получаем актуальные данные из Booking API.")
  );
  elements.tableBody.setAttribute("aria-busy", "true");
  elements.resultsCount.textContent = "Загрузка заявок…";
}

function renderErrorState(message) {
  elements.tableBody.replaceChildren(
    createTableState("error", "Не удалось загрузить заявки", message, "Повторить")
  );
  elements.tableBody.setAttribute("aria-busy", "false");
  elements.resultsCount.textContent = "Ошибка загрузки";
}

function setDataSourceNote(message) {
  elements.dataSourceNote.textContent = message;
}

function populateEmployeeFilter() {
  [elements.employeeFilter, elements.calendarEmployeeFilter].forEach((select) => {
    const selectedEmployeeId = select.value;
    const options = [new Option("Все сотрудники", "all")];
    employees.forEach((employee) => {
      if (typeof employee?.id === "string" && typeof employee?.name === "string") options.push(new Option(employee.name, employee.id));
    });
    select.replaceChildren(...options);
    select.value = options.some((option) => option.value === selectedEmployeeId) ? selectedEmployeeId : "all";
  });
}

async function loadEmployeesFromApi() {
  try {
    employees = await getEmployees();
    populateEmployeeFilter();
    if (!elements.calendarPanel.hidden) renderCalendar();
  } catch (error) {
    // The bookings page can still load while the employee filter is unavailable.
  }
}

async function loadBookingsFromApi() {
  if (isLoadingBookings) return bookings;

  isLoadingBookings = true;
  elements.refreshButton.disabled = true;
  renderLoadingState();

  try {
    const apiBookings = await getBookings();
    const normalizedBookings = apiBookings.map(normalizeBooking).filter(Boolean);

    bookings = normalizedBookings;
    logBookingDiagnostics("bookings-loaded", { bookingsCount: normalizedBookings.length, bookingIds: normalizedBookings.slice(0, 10).map((booking) => booking.id) });
    setDataSourceNote("API-режим · заявки загружены из Booking API");
    refreshBookings();
    return normalizedBookings;
  } catch (error) {
    renderErrorState(error.message || "Попробуйте повторить запрос.");
  } finally {
    isLoadingBookings = false;
    elements.refreshButton.disabled = false;
    elements.tableBody.setAttribute("aria-busy", "false");
  }
}

function renderCalendar() {
  elements.calendarPeriod.textContent = formatCalendarTitle(calendarDate, calendarView);
  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.calendarView === calendarView);
  });
  renderCalendarGrid(elements.calendarGrid, {
    view: calendarView,
    date: calendarDate,
    employees,
    employeeId: elements.calendarEmployeeFilter.value,
    bookings: calendarBookings,
    onBookingClick: openExistingBooking,
    onSlotClick: (prefill, trigger) => openNewBooking(trigger, prefill),
  });
  renderCalendarInsights();
}

function getBookingEndTime(booking) {
  const start = timeToMinutes(booking.time);
  return start === null ? "" : minutesToTime(start + (booking.durationMinutes || 60));
}

function getChronologicalBookings(items) {
  return [...items].sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`));
}

function renderUpcomingBooking() {
  const upcoming = getChronologicalBookings(calendarWeekBookings)
    .find((booking) => !["cancelled", "completed", "no_show"].includes(booking.status));
  elements.calendarUpcoming.replaceChildren();

  if (!upcoming) {
    const empty = document.createElement("p");
    empty.className = "calendar-upcoming__empty";
    empty.textContent = "В выбранной неделе нет предстоящих записей.";
    elements.calendarUpcoming.append(empty);
    return;
  }

  const date = document.createElement("p");
  date.className = "calendar-upcoming__date";
  date.textContent = formatBookingDate(upcoming.date);
  const time = document.createElement("strong");
  time.className = "calendar-upcoming__time";
  time.textContent = `${upcoming.time} — ${getBookingEndTime(upcoming)}`;
  const client = document.createElement("p");
  client.className = "calendar-upcoming__client";
  client.textContent = `${upcoming.clientName} · ${upcoming.service}`;
  const details = document.createElement("p");
  details.className = "calendar-upcoming__details";
  details.textContent = [upcoming.employeeName, upcoming.phone].filter(Boolean).join(" · ") || "Детали записи";
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "calendar-upcoming__button";
  openButton.textContent = "Открыть запись";
  openButton.addEventListener("click", () => openExistingBooking(upcoming, openButton));
  elements.calendarUpcoming.append(date, time, client, details, openButton);
}

function renderCalendarInsights() {
  const stats = calendarWeekBookings.reduce((result, booking) => {
    result.total += 1;
    if (booking.status === "confirmed") result.confirmed += 1;
    else if (["new", "pending", "in_progress"].includes(booking.status)) result.pending += 1;
    else if (["cancelled", "no_show"].includes(booking.status)) result.cancelled += 1;
    return result;
  }, { total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const completed = Math.max(0, stats.total - stats.confirmed - stats.pending - stats.cancelled);
  elements.calendarStatTotal.textContent = stats.total;
  elements.calendarStatConfirmed.textContent = stats.confirmed;
  elements.calendarStatPending.textContent = stats.pending;
  elements.calendarStatCancelled.textContent = stats.cancelled;
  elements.calendarStatAll.textContent = calendarAllBookings.length;
  const weekRange = getCalendarRange(calendarDate, "week");
  elements.calendarStatsPeriod.textContent = formatCalendarTitle(weekRange.dateFrom, "week");
  elements.calendarDonutTotal.textContent = stats.total;
  const toAngle = (value) => stats.total ? (value / stats.total) * 360 : 0;
  const confirmedEnd = toAngle(stats.confirmed);
  const pendingEnd = confirmedEnd + toAngle(stats.pending);
  const completedEnd = pendingEnd + toAngle(completed);
  elements.calendarDonut.style.background = stats.total
    ? `conic-gradient(#76be8c 0deg ${confirmedEnd}deg, #f0b960 ${confirmedEnd}deg ${pendingEnd}deg, #8dbcf0 ${pendingEnd}deg ${completedEnd}deg, #e8899d ${completedEnd}deg 360deg)`
    : "#edf0f3";
  renderUpcomingBooking();
}

async function loadCalendarBookings() {
  if (isLoadingCalendar) return;
  isLoadingCalendar = true;
  elements.calendarState.hidden = false;
  elements.calendarState.textContent = "Загружаем записи…";
  elements.calendarGrid.replaceChildren();

  try {
    const { dateFrom, dateTo } = getCalendarRange(calendarDate, calendarView);
    const weekRange = getCalendarRange(calendarDate, "week");
    const employeeId = elements.calendarEmployeeFilter.value;
    const filters = { limit: 100, ...(employeeId !== "all" ? { employeeId } : {}) };
    const calendarRequest = getBookings({ dateFrom, dateTo, ...filters });
    const weekRequest = calendarView === "week"
      ? calendarRequest
      : getBookings({ dateFrom: weekRange.dateFrom, dateTo: weekRange.dateTo, ...filters });
    const allRequest = getBookings({ limit: 100 });
    const [apiBookings, apiWeekBookings, apiAllBookings] = await Promise.all([calendarRequest, weekRequest, allRequest]);
    calendarBookings = apiBookings.map(normalizeBooking).filter(Boolean);
    calendarWeekBookings = apiWeekBookings.map(normalizeBooking).filter(Boolean);
    calendarAllBookings = apiAllBookings.map(normalizeBooking).filter(Boolean);
    elements.calendarState.hidden = false;
    elements.calendarState.textContent = calendarBookings.length
      ? `Записей в выбранном периоде: ${calendarBookings.length}`
      : "В выбранном периоде записей нет.";
    renderCalendar();
  } catch (error) {
    elements.calendarState.hidden = false;
    elements.calendarState.textContent = error.message || "Не удалось загрузить календарь.";
  } finally {
    isLoadingCalendar = false;
  }
}

function showDashboardSection(section) {
  const isOverview = section === "overview";
  const isCalendar = section === "calendar";
  const isServices = section === "services";
  const isEmployees = section === "employees";
  const isClients = section === "clients";
  const isSettings = section === "settings";
  const isBookings = !isOverview && !isCalendar && !isServices && !isEmployees && !isClients && !isSettings;
  elements.overviewPanel.hidden = !isOverview;
  elements.calendarPanel.hidden = !isCalendar;
  elements.servicesPanel.hidden = !isServices;
  elements.employeesPanel.hidden = !isEmployees;
  elements.clientsPanel.hidden = !isClients;
  elements.settingsPanel.hidden = !isSettings;
  elements.bookingsPanel.hidden = !isBookings;
  elements.statsGrid.hidden = true;
  elements.bookingsOverview.hidden = !isBookings;
  elements.clientsOverview.hidden = !isClients;
  const businessLabel = currentSettings.businessName || "Beauty-студия";
  const pageCopy = {
    overview: [businessLabel, "Обзор", "Ключевые показатели и ближайшие действия"],
    bookings: [businessLabel, "Заявки", "Управление записями клиентов"],
    calendar: ["Расписание", "Календарь", "Планирование записей сотрудников"],
    services: ["Каталог", "Услуги", "Длительность, стоимость и доступность услуг"],
    employees: ["Команда", "Сотрудники", "Услуги и индивидуальное расписание"],
    clients: [businessLabel, "Клиенты", "Управление клиентской базой и историей посещений"],
    settings: [businessLabel, "Настройки", "Централизованное управление параметрами бизнеса"]
  }[section] || [businessLabel, "Заявки", "Управление записями клиентов"];
  [elements.pageEyebrow.textContent, elements.pageTitle.textContent, elements.pageSubtitle.textContent] = pageCopy;
  elements.dataSourceNote.hidden = !isBookings;
  elements.addButton.hidden = isSettings;
  elements.addButton.innerHTML = '<span aria-hidden="true">+</span>Добавить заявку';
  elements.addButton.setAttribute("aria-label", "Добавить заявку");
  elements.addClientButton.hidden = !isClients;
  [[elements.overviewNavLink, isOverview], [elements.bookingsNavLink, isBookings], [elements.calendarNavLink, isCalendar], [elements.servicesNavLink, isServices], [elements.employeesNavLink, isEmployees], [elements.clientsNavLink, isClients], [elements.settingsNavLink, isSettings]].forEach(([link, active]) => {
    link.classList.toggle("nav-link--active", active);
    link.toggleAttribute("aria-current", active);
  });
  if (isOverview) loadOverview();
  if (isCalendar) loadCalendarBookings();
  if (isServices) loadServicesFromApi();
  if (isEmployees) loadManagementEmployees();
  if (isClients) loadClientsFromApi();
  if (isSettings) loadSettingsPage();
}

function settingsFormData() {
  return Object.fromEntries([...elements.settingsForm.querySelectorAll("[data-setting]")].map((field) => {
    const key = field.dataset.setting;
    if (field.type === "checkbox") return [key, field.checked];
    if (field.type === "number") return [key, Number(field.value)];
    return [key, field.value.trim()];
  }));
}

function settingsSnapshot() {
  return JSON.stringify(settingsFormData());
}

function clearSettingsErrors() {
  elements.settingsForm.querySelectorAll(".field-error").forEach((error) => error.remove());
  elements.settingsForm.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
}

function showSettingsErrors(fields = {}) {
  clearSettingsErrors();
  Object.entries(fields).forEach(([key, message]) => {
    const input = elements.settingsForm.querySelector(`[data-setting="${key}"]`);
    if (!input) return;
    const field = input.closest("label");
    field.classList.add("has-error");
    const error = document.createElement("p");
    error.className = "field-error";
    error.textContent = message;
    field.append(error);
  });
}

function updateSettingsDirtyState() {
  const isDirty = Boolean(settingsInitialState) && settingsSnapshot() !== settingsInitialState;
  elements.settingsUnsaved.hidden = !isDirty;
  elements.saveSettingsButton.disabled = !isDirty || isSavingSettings;
}

function populateSettingsForm(settings) {
  [...elements.settingsForm.querySelectorAll("[data-setting]")].forEach((field) => {
    const value = settings[field.dataset.setting];
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value ?? "";
  });
  currentSettings = settings;
  elements.sidebarBusinessName.textContent = settings.shortName || settings.businessName || "Booking Desk";
  elements.headerBusinessName.textContent = settings.shortName || settings.businessName || "Booking Desk";
  settingsInitialState = settingsSnapshot();
  clearSettingsErrors();
  updateSettingsDirtyState();
  displayCurrentDate();
  const hasBotToken = Boolean(settings.telegram?.hasBotToken);
  elements.telegramConnectionState.textContent = hasBotToken ? "Токен бота доступен API. Можно выполнить безопасную проверку подключения." : "Токен не хранится в API. Настройки бота сохраняются, но проверка подключения из Dashboard недоступна.";
  elements.telegramConnectionState.className = hasBotToken ? "is-success" : "is-error";
}

async function loadDashboardSettings() {
  try {
    const settings = await getSettings();
    currentSettings = settings;
    elements.sidebarBusinessName.textContent = settings.shortName || settings.businessName || "Booking Desk";
    elements.headerBusinessName.textContent = settings.shortName || settings.businessName || "Booking Desk";
    displayCurrentDate();
    return settings;
  } catch {
    return null;
  }
}

async function loadSettingsPage() {
  elements.settingsState.textContent = "Загружаем настройки…";
  elements.settingsRetryButton.hidden = true;
  elements.settingsForm.setAttribute("aria-busy", "true");
  try {
    populateSettingsForm(await getSettings());
    elements.settingsState.textContent = "";
  } catch (error) {
    elements.settingsState.textContent = `${error.message || "Не удалось загрузить настройки."} Попробуйте обновить страницу.`;
    elements.settingsRetryButton.hidden = false;
  } finally {
    elements.settingsForm.removeAttribute("aria-busy");
  }
}

async function saveSettings(event) {
  event.preventDefault();
  if (isSavingSettings || settingsSnapshot() === settingsInitialState) return;
  isSavingSettings = true;
  updateSettingsDirtyState();
  elements.settingsForm.querySelectorAll("[data-setting]").forEach((field) => { field.disabled = true; });
  clearSettingsErrors();
  elements.settingsState.textContent = "Сохраняем изменения…";
  try {
    populateSettingsForm(await updateSettings(settingsFormData()));
    elements.settingsState.textContent = "";
    showToast("Настройки сохранены");
    renderRoute();
  } catch (error) {
    showSettingsErrors(error.details);
    elements.settingsState.textContent = error.message || "Не удалось сохранить настройки.";
  } finally {
    elements.settingsForm.querySelectorAll("[data-setting]").forEach((field) => { field.disabled = false; });
    isSavingSettings = false;
    updateSettingsDirtyState();
  }
}

function selectSettingsTab(tab) {
  document.querySelectorAll("[data-settings-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.settingsTab === tab));
  document.querySelectorAll("[data-settings-tab-panel]").forEach((panel) => { panel.hidden = panel.dataset.settingsTabPanel !== tab; });
  elements.settingsForm.hidden = tab === "security";
}

async function checkTelegramConnection() {
  elements.testTelegramButton.disabled = true;
  elements.telegramConnectionState.className = "";
  elements.telegramConnectionState.textContent = "Проверяем подключение…";
  try {
    const result = await testTelegramConnection();
    elements.telegramConnectionState.className = "is-success";
    elements.telegramConnectionState.textContent = result.bot?.username ? `Подключено: @${result.bot.username}` : "Подключение к Telegram подтверждено.";
  } catch (error) {
    elements.telegramConnectionState.className = "is-error";
    elements.telegramConnectionState.textContent = error.message || "Не удалось проверить подключение.";
  } finally {
    elements.testTelegramButton.disabled = false;
  }
}

async function saveNewPassword(event) {
  event.preventDefault();
  if (elements.newPassword.value.length < 8) return showToast("Новый пароль должен содержать не менее 8 символов");
  if (elements.newPassword.value !== elements.confirmPassword.value) return showToast("Новые пароли не совпадают");
  const submit = elements.changePasswordForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await changePassword({ currentPassword: elements.currentPassword.value, newPassword: elements.newPassword.value });
    elements.changePasswordForm.reset();
    showToast("Пароль изменён. Войдите с новым паролем.");
    clearAuthToken();
    window.location.hash = LOGIN_ROUTE;
  } catch (error) {
    showToast(error.message || "Не удалось сменить пароль");
  } finally {
    submit.disabled = false;
  }
}

async function confirmLogoutAll() {
  elements.confirmLogoutAllButton.disabled = true;
  try {
    await logoutAll();
    clearAuthToken();
    window.location.hash = LOGIN_ROUTE;
  } catch (error) {
    showToast(error.message || "Не удалось завершить сессии");
    elements.confirmLogoutAllButton.disabled = false;
  }
}

function overviewItem(container, title, value, className = "") { const item = document.createElement("button"); item.type = "button"; item.className = `overview-list-item ${className}`; const text = document.createElement("span"); text.textContent = title; const count = document.createElement("strong"); count.textContent = value; item.append(text, count); container.append(item); return item; }
function overviewTextItem(container, lines, className = "") { const item = document.createElement("button"); item.type = "button"; item.className = `overview-record ${className}`; lines.forEach(([tag, text]) => { const element = document.createElement(tag); element.textContent = text; item.append(element); }); container.append(item); return item; }
function renderOverview(data) {
  const { summary, attention, upcomingBookings, bookingDynamics, employeeUtilization, popularServices, sources, freeSlots, period } = data;
  const completedPercent = summary.totalBookings ? Math.round((summary.completedBookings / summary.totalBookings) * 100) : 0;
  elements.overviewDate.textContent = `${period.start} — ${period.end}`;
  elements.overviewTotal.textContent = `${summary.totalBookings} ${summary.totalBookings === 1 ? "запись" : "записей"}`;
  elements.overviewProgressText.textContent = `Выполнено ${summary.completedBookings} из ${summary.totalBookings}`;
  elements.overviewProgress.style.width = `${completedPercent}%`;
  elements.overviewConfirmed.textContent = String(summary.confirmedBookings);
  elements.overviewPending.textContent = String(summary.pendingBookings);
  elements.overviewExpected.textContent = formatCurrency(summary.expectedRevenue);
  elements.overviewCompletedRevenue.textContent = formatCurrency(summary.completedRevenue);
  elements.overviewAttention.replaceChildren();
  [["Ожидают подтверждения", attention.pendingBookings, "#bookings"], ["Без сотрудника", attention.unassignedBookings, "#bookings"], ["Отменены сегодня", attention.cancelledToday, "#bookings"], ["Начнутся в течение часа", attention.startingSoon, "#calendar"], ["Свободные окна сегодня", attention.todayFreeSlots, "#calendar"]].forEach(([label, value, route]) => { const item = overviewItem(elements.overviewAttention, label, String(value)); item.addEventListener("click", () => { window.location.hash = route; }); });
  elements.overviewUpcoming.replaceChildren(); upcomingBookings.forEach((booking) => { const item = overviewTextItem(elements.overviewUpcoming, [["span", `${booking.date} · ${booking.time}`], ["strong", `${booking.clientName} · ${booking.service}`], ["small", `${booking.employeeName || "Сотрудник не назначен"} · ${statusLabels[booking.status] || booking.status}`]], !booking.employeeId ? "is-warning" : ""); item.addEventListener("click", async () => { try { const record = await getBooking(booking.id); await openExistingBooking(normalizeBooking(record), elements.addButton); } catch (error) { showToast(error.message || "Не удалось открыть запись"); } }); });
  if (!upcomingBookings.length) elements.overviewUpcoming.textContent = "Ближайших записей нет.";
  elements.overviewChart.replaceChildren(); const max = Math.max(1, ...bookingDynamics.map((item) => item.created)); bookingDynamics.forEach((item) => { const bar = document.createElement("button"); bar.type = "button"; bar.className = "overview-bar"; bar.style.height = `${Math.max(8, (item.created / max) * 100)}%`; bar.title = `${item.date}: ${item.created} записей`; const label = document.createElement("span"); label.textContent = item.date.slice(5); bar.append(label); elements.overviewChart.append(bar); });
  const renderMetricList = (container, items, mapper) => { container.replaceChildren(); items.forEach((item) => overviewTextItem(container, mapper(item))); if (!items.length) container.textContent = "Нет данных за выбранный период."; };
  renderMetricList(elements.overviewEmployees, employeeUtilization, (item) => [["strong", item.name], ["span", `${item.utilizationPercent}% загрузка · ${item.bookingCount} записей`]]);
  renderMetricList(elements.overviewServices, popularServices, (item) => [["strong", item.name], ["span", `${item.bookingCount} записей · ${formatCurrency(item.revenue)}`]]);
  elements.overviewSources.replaceChildren();
  sources.forEach((item) => {
    const sourceKey = String(item.source || "unknown").toLowerCase();
    const sourceIcons = { telegram: "✈", bot: "✈", dashboard: "▦", api: "⌘", site: "⌂", phone: "☎", instagram: "◎" };
    const record = overviewTextItem(elements.overviewSources, [["strong", formatBookingSource(item.source)], ["span", `${item.count} · ${item.percentage}%`]], "overview-source-record");
    const icon = document.createElement("span");
    icon.className = `overview-source-icon overview-source-icon--${sourceKey}`;
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = sourceIcons[sourceKey] || "•";
    record.prepend(icon);
  });
  if (!sources.length) elements.overviewSources.textContent = "Нет данных за выбранный период.";
  renderMetricList(elements.overviewFreeSlots, freeSlots, (item) => [["strong", `${item.time} · ${item.employeeName}`], ["span", `${item.durationMinutes} минут свободно`]]);
  elements.overviewContent.hidden = false;
}
async function loadOverview() { if (overviewRequestController) overviewRequestController.abort(); overviewRequestController = new AbortController(); elements.overviewContent.hidden = true; elements.overviewState.textContent = "Загружаем аналитику…"; try { const data = await getDashboardOverview(overviewPeriod, overviewRequestController.signal); renderOverview(data); elements.overviewState.textContent = ""; } catch (error) { if (error.name === "AbortError") return; elements.overviewState.textContent = `${error.message || "Не удалось загрузить аналитику."} Попробуйте ещё раз.`; } finally { overviewRequestController = null; } }

function createCell(value) { const cell = document.createElement("td"); cell.textContent = value; return cell; }
function createManagementActions(id, active) {
  const cell = document.createElement("td"); cell.className = "management-actions";
  [["edit", "Редактировать"], ["toggle", active ? "Отключить" : "Включить"], ["delete", "Удалить"]].forEach(([action, label]) => {
    const button = document.createElement("button"); button.type = "button"; button.dataset.action = action; button.dataset.id = id; button.textContent = label; cell.append(button);
  }); return cell;
}
function statusText(active) { return active ? "Активна" : "Отключена"; }
function formatWorkingDays(days = []) {
  const names = { 0: "Вс", 1: "Пн", 2: "Вт", 3: "Ср", 4: "Чт", 5: "Пт", 6: "Сб" };
  return [...days].sort((first, second) => (first === 0 ? 7 : first) - (second === 0 ? 7 : second)).map((day) => names[day]).join(", ") || "Не указаны";
}
function renderServices() {
  elements.servicesTableBody.replaceChildren();
  elements.servicesState.textContent = services.length ? `Услуг: ${services.length}` : "Услуг пока нет.";
  services.forEach((service) => { const row = document.createElement("tr"); const name = document.createElement("td"); const marker = document.createElement("span"); marker.className = "color-marker"; marker.style.background = service.color || "#9b5a66"; name.append(marker, document.createTextNode(service.name)); row.append(name, createCell(`${service.durationMinutes} мин`), createCell(service.price === null || service.price === undefined ? "—" : `${service.price} ₽`), createCell(String(service.employeeCount || 0)), createCell(statusText(service.active)), createManagementActions(service.id, service.active)); elements.servicesTableBody.append(row); });
}
async function loadServicesFromApi() { elements.servicesState.textContent = "Загружаем услуги…"; try { services = await getServices({ includeInactive: true }); renderServices(); } catch (error) { elements.servicesState.textContent = error.message || "Не удалось загрузить услуги."; } }
function renderEmployeesManagement() {
  elements.employeesTableBody.replaceChildren(); elements.employeesState.textContent = managementEmployees.length ? `Сотрудников: ${managementEmployees.length}` : "Сотрудников пока нет.";
  managementEmployees.forEach((employee) => { const row = document.createElement("tr"); const name = document.createElement("td"); const marker = document.createElement("span"); marker.className = "color-marker"; marker.style.background = employee.color || "#9b5a66"; name.append(marker, document.createTextNode(employee.name)); row.append(name, createCell((employee.services || []).join(", ") || "Не назначены"), createCell(`${formatWorkingDays(employee.workingDays)} · ${employee.workingHoursStart}–${employee.workingHoursEnd}`), createCell(String(employee.futureBookingsCount || 0)), createCell(statusText(employee.active)), createManagementActions(employee.id, employee.active)); elements.employeesTableBody.append(row); });
}
async function loadManagementEmployees() { elements.employeesState.textContent = "Загружаем сотрудников…"; try { managementEmployees = await getEmployees({ includeInactive: true }); renderEmployeesManagement(); } catch (error) { elements.employeesState.textContent = error.message || "Не удалось загрузить сотрудников."; } }
function openServiceDialog(service = null) { editingServiceId = service?.id || null; elements.serviceForm.reset(); elements.serviceName.value = service?.name || ""; elements.serviceDescription.value = service?.description || ""; elements.serviceDuration.value = service?.durationMinutes || 60; elements.servicePrice.value = service?.price ?? ""; elements.serviceColor.value = service?.color || "#9b5a66"; elements.serviceActive.checked = service?.active ?? true; elements.serviceDialog.showModal(); }
function checkbox(label, value, checked) { const wrapper = document.createElement("label"); wrapper.className = "checkbox-field"; const input = document.createElement("input"); input.type = "checkbox"; input.value = value; input.checked = checked; wrapper.append(input, document.createTextNode(` ${label}`)); return wrapper; }
function openEmployeeDialog(employee = null) { editingEmployeeId = employee?.id || null; elements.employeeForm.reset(); elements.employeeName.value = employee?.name || ""; elements.employeeDescription.value = employee?.description || ""; elements.employeeColor.value = employee?.color || "#9b5a66"; elements.employeeStart.value = employee?.workingHoursStart || "10:00"; elements.employeeEnd.value = employee?.workingHoursEnd || "20:00"; elements.employeeActive.checked = employee?.active ?? true; elements.employeeDays.replaceChildren(...[[1,"Пн"],[2,"Вт"],[3,"Ср"],[4,"Чт"],[5,"Пт"],[6,"Сб"],[0,"Вс"]].map(([value,label]) => checkbox(label, String(value), (employee?.workingDays || [1,2,3,4,5,6]).includes(value)))); elements.employeeServices.replaceChildren(...services.filter((service) => service.active || employee?.serviceIds?.includes(service.id)).map((service) => checkbox(service.name, service.id, employee?.serviceIds?.includes(service.id)))); elements.employeeDialog.showModal(); }
function serviceFormData() { return { name: elements.serviceName.value.trim(), description: elements.serviceDescription.value.trim(), durationMinutes: Number(elements.serviceDuration.value), price: elements.servicePrice.value === "" ? null : Number(elements.servicePrice.value), color: elements.serviceColor.value, active: elements.serviceActive.checked }; }
function employeeFormData() { return { name: elements.employeeName.value.trim(), description: elements.employeeDescription.value.trim(), color: elements.employeeColor.value, active: elements.employeeActive.checked, workingDays: [...elements.employeeDays.querySelectorAll("input:checked")].map((input) => Number(input.value)), workingHoursStart: elements.employeeStart.value, workingHoursEnd: elements.employeeEnd.value, serviceIds: [...elements.employeeServices.querySelectorAll("input:checked")].map((input) => input.value) }; }
async function saveService(event) { event.preventDefault(); const data = serviceFormData(); elements.saveServiceButton.disabled = true; try { editingServiceId ? await updateService(editingServiceId, data) : await createService(data); elements.serviceDialog.close(); await loadServicesFromApi(); await loadManagementEmployees(); showToast("Услуга сохранена"); } catch (error) { showToast(error.message || "Не удалось сохранить услугу"); } finally { elements.saveServiceButton.disabled = false; } }
async function saveEmployee(event) { event.preventDefault(); const data = employeeFormData(); elements.saveEmployeeButton.disabled = true; try { const employee = editingEmployeeId ? await updateEmployee(editingEmployeeId, data) : await createEmployee(data); await updateEmployeeServices(employee.id, data.serviceIds); elements.employeeDialog.close(); await loadManagementEmployees(); await loadEmployeesFromApi(); showToast("Сотрудник сохранён"); } catch (error) { showToast(error.message || "Не удалось сохранить сотрудника"); } finally { elements.saveEmployeeButton.disabled = false; } }
async function manageServiceAction(event) { const button = event.target.closest("button[data-action]"); if (!button) return; const service = services.find((item) => item.id === button.dataset.id); if (!service) return; if (button.dataset.action === "edit") return openServiceDialog(service); if (button.dataset.action === "toggle") { try { await updateService(service.id, { ...service, active: !service.active }); await loadServicesFromApi(); showToast("Статус услуги обновлён"); } catch (error) { showToast(error.message); } return; } if (!confirm(`Удалить услугу «${service.name}»?`)) return; try { await deleteServiceFromApi(service.id); await loadServicesFromApi(); showToast("Услуга удалена"); } catch (error) { showToast(error.message || "Услугу нельзя удалить"); } }
async function manageEmployeeAction(event) { const button = event.target.closest("button[data-action]"); if (!button) return; const employee = managementEmployees.find((item) => item.id === button.dataset.id); if (!employee) return; if (button.dataset.action === "edit") return openEmployeeDialog(employee); if (button.dataset.action === "toggle") { try { await updateEmployee(employee.id, { ...employee, active: !employee.active }); await loadManagementEmployees(); await loadEmployeesFromApi(); showToast("Статус сотрудника обновлён"); } catch (error) { showToast(error.message); } return; } if (!confirm(`Удалить сотрудника «${employee.name}»?`)) return; try { await deleteEmployeeFromApi(employee.id); await loadManagementEmployees(); await loadEmployeesFromApi(); showToast("Сотрудник удалён"); } catch (error) { showToast(error.message || "Сотрудника нельзя удалить"); } }

function formatClientDate(value) { return value ? formatBookingDate(value) : "—"; }
function formatCurrency(value) { return new Intl.NumberFormat(currentSettings.language === "ru" ? "ru-RU" : "en-US", { style: "currency", currency: currentSettings.currency || "RUB", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function clientFilters() { return { page: clientsPage, limit: 20, search: elements.clientsSearch.value.trim(), tag: elements.clientsTagFilter.value.trim(), favorite: elements.clientsFavoriteFilter.value, sort: elements.clientsSort.value }; }

function renderClientsSkeleton() {
  elements.clientsTableBody.replaceChildren(...Array.from({ length: 5 }, () => {
    const row = document.createElement("tr"); row.className = "clients-skeleton"; row.innerHTML = '<td colspan="9"><span></span></td>'; return row;
  }));
}
function renderClientTags(tags = []) { const wrapper = document.createElement("div"); wrapper.className = "client-tags"; tags.forEach((tag) => { const item = document.createElement("span"); item.textContent = tag; wrapper.append(item); }); return wrapper; }
function clientInitials(name = "") { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "К"; }
function setClientStat(name, value) { elements.clientStats.forEach((element) => { if (element.dataset.clientStat === name) element.textContent = value; }); }
function setClientStatNote(name, value) { elements.clientStatNotes.forEach((element) => { if (element.dataset.clientStatNote === name) element.textContent = value; }); }
function renderClientOverview() {
  const newClients = clients.filter((client) => Number(client.completedBookingsCount || 0) === 0).length;
  const regularClients = clients.filter((client) => Number(client.completedBookingsCount || 0) >= 2).length;
  const pageAmount = clients.reduce((sum, client) => sum + Number(client.totalAmount || 0), 0);
  setClientStat("total", String(clientsTotal));
  setClientStat("new", String(newClients));
  setClientStat("regular", String(regularClients));
  setClientStat("amount", formatCurrency(pageAmount));
  setClientStatNote("total", `Страница ${clientsPage} из ${clientsPages}`);
  setClientStatNote("new", "Без завершённых визитов");
  setClientStatNote("regular", "2+ завершённых визита");
  setClientStatNote("amount", "По текущей выборке");
}
function renderClients() {
  elements.clientsTableBody.replaceChildren();
  elements.clientsSummary.textContent = clientsTotal ? `Клиентов в базе: ${clientsTotal}` : "Клиентов пока нет.";
  if (!clients.length) {
    const row = document.createElement("tr"); row.className = "empty-state"; row.innerHTML = '<td colspan="9"><strong>Клиенты не найдены</strong><p>Измените поиск или добавьте первого клиента.</p></td>'; elements.clientsTableBody.append(row);
  } else clients.forEach((client) => {
    const row = document.createElement("tr");
    const name = document.createElement("td"); name.className = "client-name-cell"; const avatar = document.createElement("span"); avatar.className = "client-initials"; avatar.setAttribute("aria-hidden", "true"); avatar.textContent = clientInitials(client.name); const nameMeta = document.createElement("span"); nameMeta.className = "client-name-meta"; const nameButton = document.createElement("button"); nameButton.type = "button"; nameButton.className = "client-open"; nameButton.dataset.clientId = client.id; nameButton.textContent = `${client.isFavorite ? "★ " : ""}${client.name}`; const clientKind = document.createElement("small"); clientKind.textContent = Number(client.completedBookingsCount || 0) >= 2 ? "Постоянный клиент" : "Новый клиент"; nameMeta.append(nameButton, clientKind); name.append(avatar, nameMeta);
    const phone = createCell(client.phone); const telegram = createCell(client.telegramUsername ? `@${client.telegramUsername}` : "—");
    const lastVisit = createCell(formatClientDate(client.lastVisit)); const nextVisit = createCell(formatClientDate(client.nextVisit)); const visits = createCell(String(client.completedBookingsCount)); const amount = createCell(formatCurrency(client.totalAmount));
    const tags = document.createElement("td"); tags.append(renderClientTags(client.tags));
    const action = document.createElement("td"); action.className = "client-action-cell"; const open = document.createElement("button"); open.type = "button"; open.className = "client-open-action"; open.dataset.clientId = client.id; open.textContent = "Открыть"; action.append(open);
    row.append(name, phone, telegram, lastVisit, nextVisit, visits, amount, tags, action); elements.clientsTableBody.append(row);
  });
  renderClientOverview();
  elements.clientsPage.textContent = `Страница ${clientsPage} из ${clientsPages}`; elements.clientsPrevious.disabled = clientsPage <= 1; elements.clientsNext.disabled = clientsPage >= clientsPages;
}
async function loadClientsFromApi() {
  renderClientsSkeleton(); elements.clientsState.textContent = "Загружаем клиентов…"; elements.refreshClientsButton.disabled = true;
  try { const response = await getClients(clientFilters()); clients = Array.isArray(response.clients) ? response.clients : []; clientsTotal = Number(response.total || 0); clientsPages = Number(response.pages || 1); clientsPage = Math.min(Number(response.page || 1), clientsPages); elements.clientsState.textContent = ""; renderClients(); }
  catch (error) { elements.clientsTableBody.replaceChildren(); elements.clientsState.textContent = error.message || "Не удалось загрузить клиентов."; }
  finally { elements.refreshClientsButton.disabled = false; }
}
function clientFormData() { return { name: elements.clientRecordName.value.trim(), phone: elements.clientRecordPhone.value.trim(), telegramUsername: elements.clientRecordTelegram.value.trim().replace(/^@/, "") || null, tags: [...new Set(elements.clientRecordTags.value.split(",").map((tag) => tag.trim()).filter(Boolean))], notes: elements.clientRecordNotes.value.trim(), isFavorite: elements.clientRecordFavorite.checked }; }
function renderClientMetrics(client) {
  const values = [["Первый визит", formatClientDate(client.firstVisit)], ["Последний визит", formatClientDate(client.lastVisit)], ["Следующий визит", formatClientDate(client.nextVisit)], ["Записей", client.bookingsCount], ["Завершено", client.completedBookingsCount], ["Отменено", client.cancelledBookingsCount], ["Сумма", formatCurrency(client.totalAmount)], ["Средний чек", formatCurrency(client.averageCheck)]];
  elements.clientMetrics.replaceChildren(...values.map(([label, value]) => { const item = document.createElement("div"); item.innerHTML = `<span>${label}</span><strong>${value}</strong>`; return item; })); elements.clientMetrics.hidden = false;
}
function renderClientHistory(history = []) {
  elements.clientHistoryList.replaceChildren();
  if (!history.length) { const empty = document.createElement("p"); empty.textContent = "У клиента пока нет записей."; elements.clientHistoryList.append(empty); }
  else history.forEach((booking) => { const button = document.createElement("button"); button.type = "button"; button.className = "client-history__item"; button.dataset.bookingId = booking.id; button.textContent = `${formatClientDate(booking.date)} · ${booking.time} · ${booking.service} · ${booking.employeeName || "Без сотрудника"}`; elements.clientHistoryList.append(button); });
  elements.clientHistory.hidden = false;
}
function populateMergeTargets(currentId) { elements.clientMergeTarget.replaceChildren(new Option("Выберите основного клиента", "")); clients.filter((client) => Number(client.id) !== Number(currentId)).forEach((client) => elements.clientMergeTarget.add(new Option(`${client.name} · ${client.phone}`, client.id))); }
async function openClientDialog(id = null) {
  editingClientId = id; elements.clientForm.reset(); elements.clientMergePanel.hidden = true; elements.clientMetrics.hidden = true; elements.clientHistory.hidden = true; elements.mergeClientButton.hidden = !id; elements.clientDialogTitle.textContent = id ? "Карточка клиента" : "Новый клиент"; elements.clientDialogSubtitle.textContent = id ? "Данные, заметки и история посещений." : "Добавьте клиента без создания записи.";
  elements.clientDialog.showModal();
  if (!id) return;
  elements.clientDialogSubtitle.textContent = "Загружаем карточку…";
  try { const { client, bookings: history } = await getClient(id); elements.clientRecordName.value = client.name; elements.clientRecordPhone.value = client.phone; elements.clientRecordTelegram.value = client.telegramUsername || ""; elements.clientRecordTags.value = (client.tags || []).join(", "); elements.clientRecordNotes.value = client.notes || ""; elements.clientRecordFavorite.checked = client.isFavorite; elements.clientDialogSubtitle.textContent = "Данные, заметки и история посещений."; renderClientMetrics(client); renderClientHistory(history); populateMergeTargets(client.id); }
  catch (error) { elements.clientDialog.close(); showToast(error.message || "Не удалось открыть клиента"); }
}
async function saveClient(event) {
  event.preventDefault(); if (!elements.clientForm.reportValidity()) return; elements.saveClientButton.disabled = true;
  try { const data = clientFormData(); editingClientId ? await updateClient(editingClientId, data) : await createClient(data); await loadClientsFromApi(); elements.clientDialog.close(); showToast(editingClientId ? "Карточка клиента сохранена" : "Клиент добавлен"); }
  catch (error) { showToast(error.message || "Не удалось сохранить клиента"); } finally { elements.saveClientButton.disabled = false; }
}
async function toggleMergeClient() { if (!editingClientId) return; if (!elements.clientMergePanel.hidden) { elements.clientMergePanel.hidden = true; return; } const all = await getClients({ page: 1, limit: 100, sort: "name", order: "asc" }); clients = all.clients; populateMergeTargets(editingClientId); elements.clientMergePanel.hidden = false; }
async function confirmClientMerge() { const targetClientId = elements.clientMergeTarget.value; if (!targetClientId) { showToast("Выберите основного клиента"); return; } if (!confirm("Объединить клиентов? Все записи перейдут к основному клиенту.")) return; elements.confirmMergeClientButton.disabled = true; try { await mergeClient(editingClientId, targetClientId); elements.clientDialog.close(); await loadClientsFromApi(); showToast("Клиенты объединены, история сохранена"); } catch (error) { showToast(error.message || "Не удалось объединить клиентов"); } finally { elements.confirmMergeClientButton.disabled = false; } }
async function handleClientAction(event) { const button = event.target.closest("button[data-client-id]"); if (button) await openClientDialog(button.dataset.clientId); }
async function openClientHistoryBooking(event) { const button = event.target.closest("button[data-booking-id]"); if (!button) return; try { const booking = await getBooking(button.dataset.bookingId); elements.clientDialog.close(); window.location.hash = BOOKINGS_ROUTE; await openExistingBooking(normalizeBooking(booking), elements.addButton); } catch (error) { showToast(error.message || "Запись не найдена"); } }

function formatResultsCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let noun = "заявок";

  if (mod10 === 1 && mod100 !== 11) noun = "заявка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "заявки";

  return `Найдено: ${count} ${noun}`;
}

function updateFilterControls(filteredCount) {
  const filtersAreActive = elements.search.value.trim() !== "" || elements.statusFilter.value !== "all" || elements.employeeFilter.value !== "all";
  elements.resetButton.disabled = !filtersAreActive;
  elements.resultsCount.textContent = formatResultsCount(filteredCount);
}

function renderBookings() {
  const filteredBookings = getFilteredBookings();
  elements.tableBody.replaceChildren();

  if (filteredBookings.length === 0) {
    renderEmptyState();
  } else {
    const fragment = document.createDocumentFragment();
    filteredBookings.forEach((booking) => fragment.append(createBookingRow(booking)));
    elements.tableBody.append(fragment);
  }

  updateFilterControls(filteredBookings.length);
}

function renderStats() {
  const stats = bookings.reduce(
    (result, booking) => {
      result.total += 1;
      if (Object.hasOwn(result, booking.status)) result[booking.status] += 1;
      return result;
    },
    { total: 0, new: 0, confirmed: 0, completed: 0 }
  );

  document.querySelectorAll("[data-stat]").forEach((element) => {
    element.textContent = stats[element.dataset.stat];
  });
  elements.sidebarCount.textContent = stats.total;
  renderBookingsOverview(stats);
}

function formatBookingSource(source) {
  const sourceLabels = { telegram: "Telegram", bot: "Telegram", dashboard: "Панель", api: "API", site: "Сайт", phone: "Телефон", instagram: "Instagram" };
  return sourceLabels[String(source || "").toLowerCase()] || "Вручную";
}

function makeInsightStatus(label, value, color) {
  const item = document.createElement("div");
  const text = document.createElement("span");
  const dot = document.createElement("i");
  dot.style.background = color;
  text.append(dot, document.createTextNode(label));
  const count = document.createElement("strong");
  count.textContent = String(value);
  item.append(text, count);
  return item;
}

function renderBookingsOverview(stats) {
  const statusItems = [
    ["Подтверждённые", stats.confirmed, "#69c99a"],
    ["Новые", stats.new, "#ffad47"],
    ["В работе", bookings.filter((booking) => booking.status === "in_progress").length, "#a96bf1"],
    ["Завершённые", stats.completed, "#91bfff"]
  ];
  elements.bookingStatusList.replaceChildren(...statusItems.map(([label, value, color]) => makeInsightStatus(label, value, color)));
  elements.bookingStatusTotal.textContent = String(stats.total);
  const total = statusItems.reduce((sum, [, value]) => sum + value, 0);
  let offset = 0;
  const gradient = statusItems.map(([, value, color]) => {
    const nextOffset = offset + (total ? (value / total) * 360 : 0);
    const segment = `${color} ${offset}deg ${nextOffset}deg`;
    offset = nextOffset;
    return segment;
  }).join(", ");
  elements.bookingStatusDonut.style.background = total ? `conic-gradient(${gradient})` : "#edf1f5";

  const upcoming = [...bookings]
    .filter((booking) => !["cancelled", "completed"].includes(booking.status))
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .slice(0, 3);
  elements.bookingUpcomingList.replaceChildren();
  if (!upcoming.length) {
    const empty = document.createElement("p");
    empty.className = "booking-insight-empty";
    empty.textContent = "Ближайших записей нет.";
    elements.bookingUpcomingList.append(empty);
  } else upcoming.forEach((booking) => {
    const item = document.createElement("div");
    item.className = "booking-upcoming-item";
    const date = document.createElement("span");
    date.textContent = `${formatBookingDate(booking.date)}, ${booking.time}`;
    const title = document.createElement("strong");
    title.textContent = `${booking.clientName} · ${booking.service}`;
    const state = document.createElement("em");
    state.className = `booking-upcoming-state booking-upcoming-state--${getBookingStatus(booking)}`;
    state.textContent = statusLabels[getBookingStatus(booking)];
    item.append(date, title, state);
    elements.bookingUpcomingList.append(item);
  });

  const sources = new Map();
  bookings.forEach((booking) => {
    const source = formatBookingSource(booking.source);
    sources.set(source, (sources.get(source) || 0) + 1);
  });
  const sourceEntries = [...sources.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
  elements.bookingSourceList.replaceChildren();
  if (!sourceEntries.length) {
    const empty = document.createElement("p"); empty.className = "booking-insight-empty"; empty.textContent = "Источников пока нет."; elements.bookingSourceList.append(empty);
  } else sourceEntries.forEach(([source, count], index) => {
    const item = document.createElement("div"); item.className = "booking-source-item";
    const heading = document.createElement("div"); const name = document.createElement("span"); name.textContent = source; const value = document.createElement("strong"); value.textContent = `${count} (${Math.round((count / stats.total) * 100)}%)`; heading.append(name, value);
    const track = document.createElement("i"); const fill = document.createElement("b"); fill.style.width = `${(count / stats.total) * 100}%`; fill.dataset.sourceColor = String(index); track.append(fill); item.append(heading, track); elements.bookingSourceList.append(item);
  });
}

function resetFilters() {
  elements.search.value = "";
  elements.statusFilter.value = "all";
  elements.employeeFilter.value = "all";
  renderBookings();
  elements.search.focus();
}

function openSidebar() {
  elements.sidebar.classList.add("is-open");
  elements.sidebarOverlay.hidden = false;
  document.body.classList.add("menu-open");
  elements.menuOpenButton.setAttribute("aria-expanded", "true");
  elements.menuCloseButton.focus();
}

function closeSidebar() {
  elements.sidebar.classList.remove("is-open");
  elements.sidebarOverlay.hidden = true;
  document.body.classList.remove("menu-open");
  elements.menuOpenButton.setAttribute("aria-expanded", "false");
}

function resetBookingForm() {
  elements.bookingForm.reset();
  elements.clientName.setCustomValidity("");
  elements.phone.setCustomValidity("");
  elements.service.setCustomValidity("");
  elements.bookingStatus.value = "new";
  elements.bookingEmployee.replaceChildren(new Option("Сначала выберите услугу", ""));
  elements.bookingEmployee.disabled = true;
  elements.bookingTime.replaceChildren(new Option("Выберите дату", ""));
  elements.bookingTime.disabled = true;
  editingBookingId = null;
  initialFormState = "";
  isFormDirty = false;
}

function getFormState() {
  return JSON.stringify({
    clientName: elements.clientName.value,
    phone: elements.phone.value,
    service: elements.service.value,
    employeeId: elements.bookingEmployee.value,
    telegramUsername: elements.telegramUsername.value,
    date: elements.bookingDate.value,
    time: elements.bookingTime.value,
    status: elements.bookingStatus.value,
    comment: elements.comment.value
  });
}

function captureInitialFormState() {
  initialFormState = getFormState();
  isFormDirty = false;
}

function updateFormDirtyState() {
  isFormDirty = elements.bookingDialog.open && getFormState() !== initialFormState;
}

function restoreDialogFocus() {
  const focusTarget = dialogFocusTarget || dialogTrigger;
  dialogFocusTarget = null;
  dialogTrigger = null;

  if (focusTarget && focusTarget.isConnected && !focusTarget.disabled) {
    focusTarget.focus();
  } else {
    elements.addButton.focus();
  }
}

function closeBookingDialog(options = {}) {
  const { force = false, focusTarget = null } = options;
  if (!elements.bookingDialog.open) {
    resetBookingForm();
    return true;
  }
  if (!force && isFormDirty && !confirm("Закрыть форму без сохранения изменений?")) return false;

  dialogFocusTarget = focusTarget;
  elements.bookingDialog.close();
  return true;
}

async function prepareBookingForm({ serviceId = "", employeeId = "", date = "", time = "" } = {}) {
  if (!services.length) services = await getServices({ includeInactive: true });
  elements.service.replaceChildren(new Option("Выберите услугу", ""));
  services.filter((service) => service.active || service.id === serviceId).forEach((service) => {
    elements.service.add(new Option(`${service.name} · ${service.durationMinutes} мин`, service.id));
  });
  elements.service.value = serviceId;
  if (serviceId) await loadBookingEmployees(serviceId, employeeId);
  elements.bookingDate.value = date;
  if (date && elements.bookingEmployee.value) await loadAvailableTimes(time);
}

async function loadBookingEmployees(serviceId = elements.service.value, selectedId = "") {
  elements.bookingEmployee.disabled = true;
  elements.bookingEmployee.replaceChildren(new Option("Загрузка сотрудников…", ""));
  elements.bookingTime.replaceChildren(new Option("Выберите дату", ""));
  elements.bookingTime.disabled = true;
  if (!serviceId) {
    elements.bookingEmployee.replaceChildren(new Option("Сначала выберите услугу", ""));
    return;
  }
  try {
    const availableEmployees = await getEmployees({ serviceId });
    elements.bookingEmployee.replaceChildren(new Option("Выберите сотрудника", ""));
    availableEmployees.forEach((employee) => elements.bookingEmployee.add(new Option(employee.name, employee.id)));
    elements.bookingEmployee.disabled = false;
    elements.bookingEmployee.value = selectedId;
  } catch (error) {
    elements.bookingEmployee.replaceChildren(new Option("Не удалось загрузить сотрудников", ""));
    showToast(error.message || "Не удалось загрузить сотрудников");
  }
}

async function loadAvailableTimes(selectedTime = "") {
  const serviceId = elements.service.value;
  const employeeId = elements.bookingEmployee.value;
  const date = elements.bookingDate.value;
  elements.bookingTime.disabled = true;
  elements.bookingTime.replaceChildren(new Option("Загрузка времени…", ""));
  if (!serviceId || !employeeId || !date) {
    elements.bookingTime.replaceChildren(new Option("Выберите дату", ""));
    return;
  }
  try {
    const { slots } = await getAvailableSlots({ serviceId, employeeId, date });
    elements.bookingTime.replaceChildren(new Option(slots.length ? "Выберите время" : "Нет свободного времени", ""));
    slots.forEach((slot) => elements.bookingTime.add(new Option(slot, slot)));
    if (selectedTime && slots.includes(selectedTime)) elements.bookingTime.value = selectedTime;
    elements.bookingTime.disabled = slots.length === 0;
  } catch (error) {
    elements.bookingTime.replaceChildren(new Option("Время недоступно", ""));
    showToast(error.message || "Не удалось получить свободное время");
  }
}

async function openNewBooking(trigger = elements.addButton, prefill = {}) {
  resetBookingForm();
  elements.dialogTitle.textContent = "Новая заявка";
  elements.dialogId.hidden = true;
  elements.deleteButton.hidden = true;
  elements.confirmBookingButton.hidden = true;
  elements.completeBookingButton.hidden = true;
  elements.cancelBookingButton.hidden = true;
  elements.restoreBookingButton.hidden = true;
  elements.bookingDetails.hidden = true;
  elements.bookingDialog.showModal();
  dialogTrigger = trigger;
  try {
    await prepareBookingForm(prefill);
    if (prefill.time) elements.bookingTime.value = prefill.time;
  } catch (error) {
    showToast(error.message || "Не удалось подготовить форму записи");
  }
  captureInitialFormState();
  elements.clientName.focus();
}

async function openExistingBooking(booking, trigger = document.activeElement) {
  resetBookingForm();
  editingBookingId = booking.id;
  elements.dialogTitle.textContent = `Заявка #${booking.id}`;
  elements.dialogId.textContent = `ID заявки: ${booking.id} · Создана ${formatCreatedAt(booking.createdAt)}`;
  elements.dialogId.hidden = false;
  elements.deleteButton.hidden = true;
  elements.confirmBookingButton.hidden = booking.status === "confirmed";
  elements.completeBookingButton.hidden = booking.status === "completed";
  elements.cancelBookingButton.hidden = booking.status === "cancelled";
  elements.restoreBookingButton.hidden = booking.status !== "cancelled";
  const startMinutes = timeToMinutes(booking.time);
  elements.detailEmployee.textContent = booking.employeeName || "Не указан";
  elements.detailEndTime.textContent = startMinutes === null ? "Не указано" : minutesToTime(startMinutes + (booking.durationMinutes || 60));
  elements.detailDuration.textContent = `${booking.durationMinutes || 60} мин`;
  elements.detailTelegram.textContent = booking.telegramUsername ? `@${booking.telegramUsername}` : (booking.telegramUserId || "Не указан");
  elements.detailSource.textContent = booking.source || "Не указан";
  elements.detailCreated.textContent = formatCreatedAt(booking.createdAt);
  elements.detailCancellationRow.hidden = !booking.cancellationReason;
  elements.detailCancellation.textContent = booking.cancellationReason || "";
  elements.bookingDetails.hidden = false;
  elements.clientName.value = booking.clientName;
  elements.phone.value = booking.phone;
  await prepareBookingForm({ serviceId: booking.serviceId, employeeId: booking.employeeId, date: booking.date, time: booking.time });
  elements.bookingStatus.value = booking.status || "";
  elements.comment.value = booking.comment;
  elements.telegramUsername.value = booking.telegramUsername || "";
  elements.bookingDialog.showModal();
  dialogTrigger = trigger;
  captureInitialFormState();
  elements.clientName.focus();
}

function legacyValidateBookingForm() {
  const clientName = elements.clientName.value.trim();
  const phoneDigits = elements.phone.value.replace(/\D/g, "");

  elements.clientName.setCustomValidity(clientName.length >= 2 ? "" : "Введите минимум 2 символа");
  elements.phone.setCustomValidity(phoneDigits.length >= 10 ? "" : "Введите не менее 10 цифр");
  elements.service.setCustomValidity(
    VALID_SERVICES.has(elements.service.value) ? "" : "Выберите услугу из списка"
  );

  return elements.bookingForm.reportValidity();
}

function legacyGetFormData() {
  return {
    clientName: elements.clientName.value.trim(),
    phone: elements.phone.value.trim(),
    service: elements.service.value,
    date: elements.bookingDate.value,
    time: elements.bookingTime.value,
    status: elements.bookingStatus.value || null,
    comment: elements.comment.value.trim()
  };
}

// The form is deliberately checked against API identifiers rather than legacy display names.
function validateBookingForm() {
  const clientName = elements.clientName.value.trim();
  const phoneDigits = elements.phone.value.replace(/\D/g, "");
  elements.clientName.setCustomValidity(clientName.length >= 2 ? "" : "Введите минимум 2 символа");
  elements.phone.setCustomValidity(phoneDigits.length >= 10 ? "" : "Введите не менее 10 цифр");
  elements.service.setCustomValidity(elements.service.value ? "" : "Выберите услугу");
  elements.bookingEmployee.setCustomValidity(elements.bookingEmployee.value ? "" : "Выберите сотрудника");
  elements.bookingTime.setCustomValidity(elements.bookingTime.value ? "" : "Выберите свободное время");
  return elements.bookingForm.reportValidity();
}

function getFormData() {
  return {
    clientName: elements.clientName.value.trim(),
    phone: elements.phone.value.trim(),
    telegramUsername: elements.telegramUsername.value.trim().replace(/^@/, "") || undefined,
    serviceId: elements.service.value,
    employeeId: elements.bookingEmployee.value,
    date: elements.bookingDate.value,
    time: elements.bookingTime.value,
    status: elements.bookingStatus.value || "new",
    comment: elements.comment.value.trim(),
  };
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

function refreshBookings() {
  renderBookings();
  renderStats();
}

async function refreshAfterBookingMutation(bookingId) {
  return refreshBookingViews({
    bookingId,
    loadBookings: loadBookingsFromApi,
    loadOverview,
    loadClients: loadClientsFromApi,
    loadCalendar: elements.calendarPanel.hidden ? null : loadCalendarBookings,
    onDiagnostics: (details) => logBookingDiagnostics("booking-reloaded", details),
  });
}

async function changeBookingStatus(status) {
  if (editingBookingId === null) return;
  const buttons = [elements.confirmBookingButton, elements.completeBookingButton, elements.cancelBookingButton, elements.restoreBookingButton];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    const booking = status === "cancelled"
      ? await cancelBooking(editingBookingId)
      : status === "restore"
        ? await restoreBooking(editingBookingId)
        : await updateBookingStatus(editingBookingId, status);
    await refreshAfterBookingMutation(booking.id);
    closeBookingDialog({ force: true });
    showToast("Статус заявки обновлён");
  } catch (error) {
    showToast(error.message || "Не удалось обновить статус");
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function saveBooking(event) {
  event.preventDefault();
  if (!validateBookingForm()) return;
  const submitButton = elements.bookingForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const formData = getFormData();
    const booking = editingBookingId === null
      ? await createBooking(formData)
      : await updateBooking(editingBookingId, formData);
    await refreshAfterBookingMutation(booking.id);
    closeBookingDialog({ force: true });
    showToast(editingBookingId === null ? "Запись создана" : "Изменения сохранены");
  } catch (error) {
    if (error.code === "BOOKING_SLOT_TAKEN") {
      await loadAvailableTimes();
      showToast("Этот слот уже занят. Выберите другое время.");
    } else {
      showToast(error.message || "Не удалось сохранить запись");
    }
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteBooking() {
  if (editingBookingId === null) return;
  const bookingId = editingBookingId;
  if (!confirm(`Удалить заявку #${bookingId}?`)) return;

  const bookingIndex = bookings.findIndex((booking) => String(booking.id) === String(bookingId));
  if (bookingIndex === -1) return;
  try {
    if (!String(bookingId).startsWith("local-")) {
      await deleteBookingFromApi(bookingId);
      await refreshAfterBookingMutation(bookingId);
    } else {
      bookings.splice(bookingIndex, 1);
      calendarBookings = calendarBookings.filter((booking) => String(booking.id) !== String(bookingId));
      calendarWeekBookings = calendarWeekBookings.filter((booking) => String(booking.id) !== String(bookingId));
      calendarAllBookings = calendarAllBookings.filter((booking) => String(booking.id) !== String(bookingId));
      refreshBookings();
      if (!elements.calendarPanel.hidden) renderCalendar();
    }
    closeBookingDialog({ force: true, focusTarget: elements.addButton });
    showToast("Заявка удалена");
  } catch (error) {
    showToast(error.message || "Не удалось удалить заявку");
  }
}

function handleBookingAction(event) {
  const retryButton = event.target.closest("[data-retry-bookings]");
  if (retryButton) {
    loadBookingsFromApi();
    return;
  }

  const button = event.target.closest("[data-booking-id]");
  if (!button) return;

  const booking = bookings.find((item) => String(item.id) === button.dataset.bookingId);
  if (booking) openExistingBooking(booking, button);
}

function displayCurrentDate() {
  const now = new Date();
  const timezone = currentSettings.timezone || "Europe/Moscow";
  const formattedDate = new Intl.DateTimeFormat(currentSettings.language || "ru", { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(now);
  const localDate = todayIsoDate(timezone);
  elements.currentDate.dateTime = localDate;
  elements.currentDate.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function setLoginLoading(isLoading) {
  elements.loginSubmit.disabled = isLoading;
  elements.loginSubmitLabel.textContent = isLoading ? "Входим..." : "Войти";
  elements.loginSubmitLoader.hidden = !isLoading;
}

function showLoginError(message = "") {
  elements.loginError.textContent = message;
  elements.loginError.hidden = !message;
}

function showLoginPage() {
  elements.dashboardPage.hidden = true;
  elements.loginPage.hidden = false;
  showLoginError();
  window.setTimeout(() => elements.loginInput.focus(), 0);
}

function startDashboard() {
  elements.loginPage.hidden = true;
  elements.dashboardPage.hidden = false;

  if (dashboardStarted) return;
  dashboardStarted = true;
  displayCurrentDate();
  loadDashboardSettings();
  renderStats();
  loadEmployeesFromApi();
  loadBookingsFromApi();
}

function renderRoute() {
  if (!getAuthToken()) {
    if (window.location.hash !== LOGIN_ROUTE) window.location.replace(LOGIN_ROUTE);
    showLoginPage();
    return;
  }

  if (![OVERVIEW_ROUTE, BOOKINGS_ROUTE, CALENDAR_ROUTE, SERVICES_ROUTE, EMPLOYEES_ROUTE, CLIENTS_ROUTE, SETTINGS_ROUTE, "#/dashboard"].includes(window.location.hash)) window.location.replace(OVERVIEW_ROUTE);
  startDashboard();
  const currentRoute = window.location.hash;
  showDashboardSection(currentRoute === OVERVIEW_ROUTE || currentRoute === "#/dashboard" ? "overview" : currentRoute === CALENDAR_ROUTE ? "calendar" : currentRoute === SERVICES_ROUTE ? "services" : currentRoute === EMPLOYEES_ROUTE ? "employees" : currentRoute === CLIENTS_ROUTE ? "clients" : currentRoute === SETTINGS_ROUTE ? "settings" : "bookings");
}

async function handleLogin(event) {
  event.preventDefault();
  const loginValue = elements.loginInput.value.trim();
  const password = elements.passwordInput.value;

  if (!loginValue || !password) {
    showLoginError("Введите логин и пароль.");
    return;
  }

  setLoginLoading(true);
  showLoginError();

  try {
    await login(loginValue, password);
    elements.passwordInput.value = "";
    window.location.hash = BOOKINGS_ROUTE;
  } catch (error) {
    showLoginError(error.message || "Не удалось выполнить вход.");
  } finally {
    setLoginLoading(false);
  }
}

function logout() {
  clearAuthToken();
  window.location.hash = LOGIN_ROUTE;
}

elements.search.addEventListener("input", renderBookings);
elements.statusFilter.addEventListener("change", renderBookings);
elements.employeeFilter.addEventListener("change", renderBookings);
elements.calendarEmployeeFilter.addEventListener("change", loadCalendarBookings);
elements.sort.addEventListener("change", renderBookings);
elements.resetButton.addEventListener("click", resetFilters);
elements.refreshButton.addEventListener("click", loadBookingsFromApi);
elements.tableBody.addEventListener("click", handleBookingAction);
elements.addButton.addEventListener("click", () => openNewBooking(elements.addButton));
document.querySelectorAll("[data-overview-period]").forEach((button) => button.addEventListener("click", () => { overviewPeriod = button.dataset.overviewPeriod; document.querySelectorAll("[data-overview-period]").forEach((item) => item.classList.toggle("is-active", item === button)); loadOverview(); }));
elements.overviewNewBooking.addEventListener("click", () => openNewBooking(elements.overviewNewBooking));
elements.overviewNewClient.addEventListener("click", () => openClientDialog());
elements.bookingForm.addEventListener("submit", saveBooking);
elements.deleteButton.addEventListener("click", deleteBooking);
elements.confirmBookingButton.addEventListener("click", () => changeBookingStatus("confirmed"));
elements.completeBookingButton.addEventListener("click", () => changeBookingStatus("completed"));
elements.cancelBookingButton.addEventListener("click", () => changeBookingStatus("cancelled"));
elements.restoreBookingButton.addEventListener("click", () => changeBookingStatus("restore"));
elements.service.addEventListener("change", () => loadBookingEmployees());
elements.bookingEmployee.addEventListener("change", () => loadAvailableTimes());
elements.bookingDate.addEventListener("change", () => loadAvailableTimes());
document.querySelectorAll("[data-calendar-view]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarView = button.dataset.calendarView;
    loadCalendarBookings();
  });
});
document.querySelectorAll("[data-calendar-nav]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarDate = addCalendarDays(calendarDate, button.dataset.calendarNav === "previous" ? (calendarView === "week" ? -7 : -1) : (calendarView === "week" ? 7 : 1));
    loadCalendarBookings();
  });
});
elements.calendarTodayButton.addEventListener("click", () => {
  const today = todayIsoDate(currentSettings.timezone);
  calendarDate = calendarView === "week" ? startOfWeek(today) : today;
  loadCalendarBookings();
});
elements.addServiceButton.addEventListener("click", () => openServiceDialog());
elements.addEmployeeButton.addEventListener("click", async () => { if (!services.length) await loadServicesFromApi(); openEmployeeDialog(); });
elements.servicesTableBody.addEventListener("click", manageServiceAction);
elements.employeesTableBody.addEventListener("click", manageEmployeeAction);
elements.clientsTableBody.addEventListener("click", handleClientAction);
elements.addClientButton.addEventListener("click", () => openClientDialog());
elements.refreshClientsButton.addEventListener("click", loadClientsFromApi);
elements.clientsFavoriteFilter.addEventListener("change", () => { clientsPage = 1; loadClientsFromApi(); });
elements.clientsSort.addEventListener("change", () => { clientsPage = 1; loadClientsFromApi(); });
elements.clientsSearch.addEventListener("input", () => { window.clearTimeout(clientsSearchTimer); clientsSearchTimer = window.setTimeout(() => { clientsPage = 1; loadClientsFromApi(); }, 280); });
elements.clientsTagFilter.addEventListener("input", () => { window.clearTimeout(clientsSearchTimer); clientsSearchTimer = window.setTimeout(() => { clientsPage = 1; loadClientsFromApi(); }, 280); });
elements.clientsPrevious.addEventListener("click", () => { if (clientsPage > 1) { clientsPage -= 1; loadClientsFromApi(); } });
elements.clientsNext.addEventListener("click", () => { if (clientsPage < clientsPages) { clientsPage += 1; loadClientsFromApi(); } });
document.querySelectorAll("[data-settings-tab]").forEach((button) => button.addEventListener("click", () => selectSettingsTab(button.dataset.settingsTab)));
elements.settingsForm.addEventListener("input", updateSettingsDirtyState);
elements.settingsForm.addEventListener("change", updateSettingsDirtyState);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.settingsRetryButton.addEventListener("click", loadSettingsPage);
elements.testTelegramButton.addEventListener("click", checkTelegramConnection);
elements.changePasswordForm.addEventListener("submit", saveNewPassword);
elements.logoutAllButton.addEventListener("click", () => { elements.logoutAllConfirmation.hidden = false; });
elements.cancelLogoutAllButton.addEventListener("click", () => { elements.logoutAllConfirmation.hidden = true; });
elements.confirmLogoutAllButton.addEventListener("click", confirmLogoutAll);
elements.keepSettingsButton.addEventListener("click", () => { pendingSettingsRoute = null; elements.settingsDiscardDialog.close(); });
elements.discardSettingsButton.addEventListener("click", () => { const target = pendingSettingsRoute; pendingSettingsRoute = null; populateSettingsForm(currentSettings); elements.settingsDiscardDialog.close(); if (target) { allowSettingsRouteChange = true; window.location.hash = target; } });
elements.clientForm.addEventListener("submit", saveClient);
elements.mergeClientButton.addEventListener("click", toggleMergeClient);
elements.confirmMergeClientButton.addEventListener("click", confirmClientMerge);
elements.clientHistoryList.addEventListener("click", openClientHistoryBooking);
document.querySelectorAll("[data-client-close]").forEach((button) => button.addEventListener("click", () => elements.clientDialog.close()));
elements.serviceForm.addEventListener("submit", saveService);
elements.employeeForm.addEventListener("submit", saveEmployee);
document.querySelectorAll("[data-service-close]").forEach((button) => button.addEventListener("click", () => elements.serviceDialog.close()));
document.querySelectorAll("[data-employee-close]").forEach((button) => button.addEventListener("click", () => elements.employeeDialog.close()));
document.querySelectorAll("[data-dialog-close]").forEach((button) => {
  button.addEventListener("click", () => closeBookingDialog());
});
elements.bookingDialog.addEventListener("click", (event) => {
  if (event.target === elements.bookingDialog) closeBookingDialog();
});
elements.bookingDialog.addEventListener("cancel", (event) => {
  if (!isFormDirty) return;
  event.preventDefault();
  closeBookingDialog();
});
elements.bookingDialog.addEventListener("close", () => {
  resetBookingForm();
  restoreDialogFocus();
});
elements.bookingForm.addEventListener("input", updateFormDirtyState);
elements.bookingForm.addEventListener("change", updateFormDirtyState);
elements.menuOpenButton.addEventListener("click", openSidebar);
elements.menuCloseButton.addEventListener("click", closeSidebar);
elements.sidebarOverlay.addEventListener("click", closeSidebar);
elements.sidebar.addEventListener("click", (event) => {
  const navLink = event.target.closest(".nav-link");
  if (navLink && !navLink.classList.contains("nav-link--disabled") && window.innerWidth <= 820) closeSidebar();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.sidebar.classList.contains("is-open")) closeSidebar();
});
elements.loginForm.addEventListener("submit", handleLogin);
elements.logoutButton.addEventListener("click", logout);
document.addEventListener("auth:unauthorized", () => {
  showLoginError("Сессия завершилась. Войдите снова.");
  window.location.hash = LOGIN_ROUTE;
});
window.addEventListener("hashchange", () => {
  const target = window.location.hash;
  const hasUnsavedSettings = !elements.settingsPanel.hidden && settingsInitialState && settingsSnapshot() !== settingsInitialState;
  if (!allowSettingsRouteChange && target !== SETTINGS_ROUTE && hasUnsavedSettings) {
    pendingSettingsRoute = target;
    window.location.hash = SETTINGS_ROUTE;
    elements.settingsDiscardDialog.showModal();
    return;
  }
  allowSettingsRouteChange = false;
  renderRoute();
});
window.addEventListener("beforeunload", (event) => {
  if (!elements.settingsPanel.hidden && settingsInitialState && settingsSnapshot() !== settingsInitialState) {
    event.preventDefault();
    event.returnValue = "";
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 820 && elements.sidebar.classList.contains("is-open")) closeSidebar();
});

renderRoute();
