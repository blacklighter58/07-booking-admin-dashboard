const bookings = [
  {
    id: 1042,
    clientName: "Анна Воронова",
    phone: "+7 (916) 248-19-35",
    service: "Брови",
    date: "2026-07-14",
    time: "10:00",
    status: "new",
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
  resetButton: document.querySelector("#resetFilters"),
  resultsCount: document.querySelector("#resultsCount"),
  sidebarCount: document.querySelector("#sidebarBookingCount"),
  sidebar: document.querySelector("#sidebar"),
  sidebarOverlay: document.querySelector("[data-sidebar-overlay]"),
  menuOpenButton: document.querySelector("[data-menu-open]"),
  menuCloseButton: document.querySelector("[data-menu-close]"),
  currentDate: document.querySelector("#currentDate")
};

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

function formatBookingDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00`)).replace(" г.", "");
}

function getFilteredBookings() {
  const query = elements.search.value.trim().toLocaleLowerCase("ru-RU");
  const status = elements.statusFilter.value;
  const queryDigits = query.replace(/\D/g, "");

  return bookings.filter((booking) => {
    const searchableText = [booking.clientName, booking.phone, booking.service]
      .join(" ")
      .toLocaleLowerCase("ru-RU");
    const phoneDigits = booking.phone.replace(/\D/g, "");
    const matchesText = !query || searchableText.includes(query);
    const matchesPhone = queryDigits.length >= 3 && phoneDigits.includes(queryDigits);
    const matchesStatus = status === "all" || booking.status === status;

    return (matchesText || matchesPhone) && matchesStatus;
  });
}

function createBookingRow(booking) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="client-cell">
      <strong>${booking.clientName}</strong>
      <span class="booking-id">Заявка #${booking.id}</span>
    </td>
    <td><a class="phone-link" href="tel:${booking.phone.replace(/\D/g, "")}">${booking.phone}</a></td>
    <td class="service-cell">${booking.service}</td>
    <td class="date-cell">
      <strong>${formatBookingDate(booking.date)}</strong>
      <span>${booking.time}</span>
    </td>
    <td><span class="status-badge status-badge--${booking.status}">${statusLabels[booking.status]}</span></td>
    <td>
      <button class="row-action" type="button" data-booking-id="${booking.id}" aria-label="Открыть заявку ${booking.id} клиента ${booking.clientName}" title="Открыть заявку">•••</button>
    </td>
  `;

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

function handleBookingAction(event) {
  const button = event.target.closest("[data-booking-id]");
  if (!button) return;

  const booking = bookings.find((item) => item.id === Number(button.dataset.bookingId));
  if (booking) alert(`Клиент: ${booking.clientName}\nЗаявка #${booking.id}`);
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
elements.resetButton.addEventListener("click", resetFilters);
elements.tableBody.addEventListener("click", handleBookingAction);
elements.menuOpenButton.addEventListener("click", openSidebar);
elements.menuCloseButton.addEventListener("click", closeSidebar);
elements.sidebarOverlay.addEventListener("click", closeSidebar);
elements.sidebar.addEventListener("click", (event) => {
  if (event.target.closest(".nav-link") && window.innerWidth <= 820) closeSidebar();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.sidebar.classList.contains("is-open")) closeSidebar();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 820 && elements.sidebar.classList.contains("is-open")) closeSidebar();
});

displayCurrentDate();
renderStats();
renderBookings();
