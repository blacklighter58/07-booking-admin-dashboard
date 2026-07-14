const STORAGE_KEY = "bookingDesk.bookings.v1";
const VALID_STATUSES = new Set(["new", "confirmed", "completed", "cancelled"]);
let shouldSeedStorage = false;

const initialBookings = [
  {
    id: 1042,
    clientName: "Анна Воронова",
    phone: "+7 (916) 248-19-35",
    service: "Брови",
    date: "2026-07-14",
    time: "10:00",
    status: "new",
    comment: "",
    createdAt: "2026-07-13T18:42:00"
  },
  {
    id: 1041,
    clientName: "Мария Крылова",
    phone: "+7 (925) 771-04-83",
    service: "Ламинирование ресниц",
    date: "2026-07-14",
    time: "12:30",
    status: "confirmed",
    comment: "",
    createdAt: "2026-07-13T16:20:00"
  },
  {
    id: 1040,
    clientName: "Елена Макарова",
    phone: "+7 (903) 516-27-92",
    service: "Дневной макияж",
    date: "2026-07-14",
    time: "15:00",
    status: "confirmed",
    comment: "",
    createdAt: "2026-07-13T14:05:00"
  },
  {
    id: 1039,
    clientName: "Дарья Соколова",
    phone: "+7 (977) 140-63-26",
    service: "Вечерний макияж",
    date: "2026-07-15",
    time: "18:30",
    status: "new",
    comment: "",
    createdAt: "2026-07-13T11:47:00"
  },
  {
    id: 1038,
    clientName: "Ольга Белова",
    phone: "+7 (985) 334-80-19",
    service: "Комплекс",
    date: "2026-07-16",
    time: "11:00",
    status: "new",
    comment: "",
    createdAt: "2026-07-12T20:14:00"
  },
  {
    id: 1037,
    clientName: "София Волкова",
    phone: "+7 (926) 892-45-10",
    service: "Брови",
    date: "2026-07-13",
    time: "14:30",
    status: "completed",
    comment: "",
    createdAt: "2026-07-11T15:32:00"
  },
  {
    id: 1036,
    clientName: "Алина Орлова",
    phone: "+7 (915) 623-71-08",
    service: "Ламинирование ресниц",
    date: "2026-07-12",
    time: "13:00",
    status: "completed",
    comment: "",
    createdAt: "2026-07-10T19:08:00"
  },
  {
    id: 1035,
    clientName: "Ксения Морозова",
    phone: "+7 (999) 204-56-77",
    service: "Вечерний макияж",
    date: "2026-07-12",
    time: "17:00",
    status: "cancelled",
    comment: "",
    createdAt: "2026-07-10T12:55:00"
  },
  {
    id: 1034,
    clientName: "Виктория Попова",
    phone: "+7 (968) 445-32-91",
    service: "Комплекс",
    date: "2026-07-11",
    time: "16:30",
    status: "completed",
    comment: "",
    createdAt: "2026-07-09T10:24:00"
  },
  {
    id: 1033,
    clientName: "Наталья Фёдорова",
    phone: "+7 (910) 378-12-64",
    service: "Дневной макияж",
    date: "2026-07-16",
    time: "09:30",
    status: "confirmed",
    comment: "",
    createdAt: "2026-07-08T17:16:00"
  }
];

const statusLabels = {
  new: "Новая",
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена"
};

const elements = {
  tableBody: document.querySelector("#bookingsTableBody"),
  search: document.querySelector("#bookingSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  sort: document.querySelector("#bookingSort"),
  resetButton: document.querySelector("#resetFilters"),
  restoreDemoButton: document.querySelector("#restoreDemoButton"),
  resultsCount: document.querySelector("#resultsCount"),
  sidebarCount: document.querySelector("#sidebarBookingCount"),
  sidebar: document.querySelector("#sidebar"),
  sidebarOverlay: document.querySelector("[data-sidebar-overlay]"),
  menuOpenButton: document.querySelector("[data-menu-open]"),
  menuCloseButton: document.querySelector("[data-menu-close]"),
  currentDate: document.querySelector("#currentDate"),
  addButton: document.querySelector("#addBookingButton"),
  bookingDialog: document.querySelector("#bookingDialog"),
  bookingForm: document.querySelector("#bookingForm"),
  dialogTitle: document.querySelector("#bookingDialogTitle"),
  dialogId: document.querySelector("#bookingDialogId"),
  deleteButton: document.querySelector("#deleteBookingButton"),
  clientName: document.querySelector("#clientName"),
  phone: document.querySelector("#phone"),
  service: document.querySelector("#service"),
  bookingDate: document.querySelector("#bookingDate"),
  bookingTime: document.querySelector("#bookingTime"),
  bookingStatus: document.querySelector("#bookingStatus"),
  comment: document.querySelector("#comment"),
  toast: document.querySelector("#toast")
};

let editingBookingId = null;
let toastTimer;
let bookings = loadBookings();
let initialFormState = "";
let isFormDirty = false;
let dialogTrigger = null;
let dialogFocusTarget = null;

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
  return dateFormatter.format(new Date(`${date}T00:00:00`)).replace(" г.", "");
}

function formatCreatedAt(createdAt) {
  return createdDateFormatter.format(new Date(createdAt));
}

function cloneInitialBookings() {
  return initialBookings.map((booking) => ({ ...booking }));
}

function normalizeBooking(rawBooking) {
  if (!rawBooking || typeof rawBooking !== "object") return null;

  const id = Number(rawBooking.id);
  const clientName = typeof rawBooking.clientName === "string" ? rawBooking.clientName.trim() : "";
  const phone = typeof rawBooking.phone === "string" ? rawBooking.phone.trim() : "";
  const service = typeof rawBooking.service === "string" ? rawBooking.service.trim() : "";
  const date = typeof rawBooking.date === "string" ? rawBooking.date : "";
  const time = typeof rawBooking.time === "string" ? rawBooking.time : "";
  const status = rawBooking.status;
  const createdAt = typeof rawBooking.createdAt === "string" && !Number.isNaN(Date.parse(rawBooking.createdAt))
    ? rawBooking.createdAt
    : "1970-01-01T00:00:00.000Z";

  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !clientName ||
    !phone ||
    !service ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time) ||
    !VALID_STATUSES.has(status)
  ) {
    return null;
  }

  return {
    id,
    clientName,
    phone,
    service,
    date,
    time,
    status,
    comment: typeof rawBooking.comment === "string" ? rawBooking.comment.slice(0, 300) : "",
    createdAt
  };
}

function loadBookings() {
  try {
    const storedBookings = localStorage.getItem(STORAGE_KEY);
    if (storedBookings === null) {
      shouldSeedStorage = true;
      return cloneInitialBookings();
    }

    const parsedBookings = JSON.parse(storedBookings);
    if (!Array.isArray(parsedBookings)) throw new Error("Сохранённые заявки имеют неверный формат");

    return parsedBookings.map(normalizeBooking).filter(Boolean);
  } catch (error) {
    console.warn("Не удалось загрузить сохранённые заявки. Восстановлены демо-данные.", error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.warn("Не удалось удалить повреждённые сохранённые заявки.", removeError);
    }
    return cloneInitialBookings();
  }
}

function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.error("Не удалось сохранить заявки.", error);
    showToast("Не удалось сохранить изменения");
    return false;
  }
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
    return Date.parse(secondBooking.createdAt) - Date.parse(firstBooking.createdAt) || secondBooking.id - firstBooking.id;
  });
}

function getFilteredBookings() {
  const query = elements.search.value.trim().toLocaleLowerCase("ru-RU");
  const status = elements.statusFilter.value;
  const queryDigits = query.replace(/\D/g, "");

  const filteredBookings = bookings.filter((booking) => {
    const searchableText = [booking.clientName, booking.phone, booking.service]
      .join(" ")
      .toLocaleLowerCase("ru-RU");
    const phoneDigits = booking.phone.replace(/\D/g, "");
    const matchesText = !query || searchableText.includes(query);
    const matchesPhone = queryDigits.length >= 3 && phoneDigits.includes(queryDigits);
    const matchesStatus = status === "all" || booking.status === status;

    return (matchesText || matchesPhone) && matchesStatus;
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
  serviceCell.textContent = booking.service;

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
  status.className = `status-badge status-badge--${booking.status}`;
  status.textContent = statusLabels[booking.status];
  statusCell.append(status);

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

  row.append(clientCell, contactCell, serviceCell, dateCell, statusCell, actionCell);

  return row;
}

function renderEmptyState() {
  const row = document.createElement("tr");
  row.className = "empty-state";
  row.innerHTML = `
    <td colspan="6">
      <span class="empty-state__icon" aria-hidden="true">⌕</span>
      <strong>Заявки не найдены</strong>
      <p>Измените запрос или сбросьте выбранные фильтры.</p>
    </td>
  `;
  elements.tableBody.append(row);
}

function formatResultsCount(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let noun = "заявок";

  if (mod10 === 1 && mod100 !== 11) noun = "заявка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "заявки";

  return `Найдено: ${count} ${noun}`;
}

function updateFilterControls(filteredCount) {
  const filtersAreActive = elements.search.value.trim() !== "" || elements.statusFilter.value !== "all";
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
}

function resetFilters() {
  elements.search.value = "";
  elements.statusFilter.value = "all";
  renderBookings();
  elements.search.focus();
}

function restoreDemoBookings() {
  const confirmationMessage = "Вернуть исходные демо-данные? Все сохранённые изменения будут удалены.";
  if (!confirm(confirmationMessage)) return;

  bookings = cloneInitialBookings();
  const saved = saveBookings();
  elements.search.value = "";
  elements.statusFilter.value = "all";
  elements.sort.value = "created-desc";
  refreshBookings();
  if (saved) showToast("Демо-данные восстановлены");
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
  elements.bookingStatus.value = "new";
  editingBookingId = null;
  initialFormState = "";
  isFormDirty = false;
}

function getFormState() {
  return JSON.stringify({
    clientName: elements.clientName.value,
    phone: elements.phone.value,
    service: elements.service.value,
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

function openNewBooking(trigger = elements.addButton) {
  resetBookingForm();
  elements.dialogTitle.textContent = "Новая заявка";
  elements.dialogId.hidden = true;
  elements.deleteButton.hidden = true;
  elements.bookingDialog.showModal();
  dialogTrigger = trigger;
  captureInitialFormState();
  elements.clientName.focus();
}

function openExistingBooking(booking, trigger = document.activeElement) {
  resetBookingForm();
  editingBookingId = booking.id;
  elements.dialogTitle.textContent = `Заявка #${booking.id}`;
  elements.dialogId.textContent = `ID заявки: ${booking.id} · Создана ${formatCreatedAt(booking.createdAt)}`;
  elements.dialogId.hidden = false;
  elements.deleteButton.hidden = false;
  elements.clientName.value = booking.clientName;
  elements.phone.value = booking.phone;
  elements.service.value = booking.service;
  elements.bookingDate.value = booking.date;
  elements.bookingTime.value = booking.time;
  elements.bookingStatus.value = booking.status;
  elements.comment.value = booking.comment;
  elements.bookingDialog.showModal();
  dialogTrigger = trigger;
  captureInitialFormState();
  elements.clientName.focus();
}

function validateBookingForm() {
  const clientName = elements.clientName.value.trim();
  const phoneDigits = elements.phone.value.replace(/\D/g, "");

  elements.clientName.setCustomValidity(clientName.length >= 2 ? "" : "Введите минимум 2 символа");
  elements.phone.setCustomValidity(phoneDigits.length >= 10 ? "" : "Введите не менее 10 цифр");

  return elements.bookingForm.reportValidity();
}

function getFormData() {
  return {
    clientName: elements.clientName.value.trim(),
    phone: elements.phone.value.trim(),
    service: elements.service.value,
    date: elements.bookingDate.value,
    time: elements.bookingTime.value,
    status: elements.bookingStatus.value,
    comment: elements.comment.value.trim()
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

function saveBooking(event) {
  event.preventDefault();
  if (!validateBookingForm()) return;

  const formData = getFormData();
  let message;

  if (editingBookingId === null) {
    const nextId = Math.max(...bookings.map((booking) => booking.id), 0) + 1;
    bookings.unshift({
      id: nextId,
      ...formData,
      createdAt: new Date().toISOString()
    });
    message = "Заявка добавлена";
  } else {
    const booking = bookings.find((item) => item.id === editingBookingId);
    if (!booking) return;
    Object.assign(booking, formData);
    message = "Изменения сохранены";
  }

  const saved = saveBookings();
  refreshBookings();
  closeBookingDialog({ force: true });
  if (saved) showToast(message);
}

function deleteBooking() {
  if (editingBookingId === null) return;
  const bookingId = editingBookingId;
  if (!confirm(`Удалить заявку #${bookingId}?`)) return;

  const bookingIndex = bookings.findIndex((booking) => booking.id === bookingId);
  if (bookingIndex === -1) return;
  bookings.splice(bookingIndex, 1);
  const saved = saveBookings();
  refreshBookings();
  closeBookingDialog({ force: true, focusTarget: elements.addButton });
  if (saved) showToast("Заявка удалена");
}

function handleBookingAction(event) {
  const button = event.target.closest("[data-booking-id]");
  if (!button) return;

  const booking = bookings.find((item) => item.id === Number(button.dataset.bookingId));
  if (booking) openExistingBooking(booking, button);
}

function displayCurrentDate() {
  const now = new Date();
  const formattedDate = currentDateFormatter.format(now);
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
  elements.currentDate.dateTime = localDate;
  elements.currentDate.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

elements.search.addEventListener("input", renderBookings);
elements.statusFilter.addEventListener("change", renderBookings);
elements.sort.addEventListener("change", renderBookings);
elements.resetButton.addEventListener("click", resetFilters);
elements.restoreDemoButton.addEventListener("click", restoreDemoBookings);
elements.tableBody.addEventListener("click", handleBookingAction);
elements.addButton.addEventListener("click", () => openNewBooking(elements.addButton));
elements.bookingForm.addEventListener("submit", saveBooking);
elements.deleteButton.addEventListener("click", deleteBooking);
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
window.addEventListener("resize", () => {
  if (window.innerWidth > 820 && elements.sidebar.classList.contains("is-open")) closeSidebar();
});

displayCurrentDate();
if (shouldSeedStorage) saveBookings();
renderStats();
renderBookings();
