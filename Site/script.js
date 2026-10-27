// Элементы страницы
const form = document.querySelector("#booking-form");
const hallInput = document.querySelector("#hall");
const dateInput = document.querySelector("#date");
const timeInput = document.querySelector("#time");
const hoursInput = document.querySelector("#hours");
const totalPrice = document.querySelector("#total-price");
const message = document.querySelector("#booking-message");
const bookingsList = document.querySelector("#bookings-list");

// Названия и цены за час
const halls = {
    football: {
        name: "Футбольный зал",
        price: 10000
    },
    volleyball: {
        name: "Волейбольный зал",
        price: 8000
    }
};

const storageKey = "sporthall-bookings-v1";
let bookings = [];

// Загрузка сохранённых бронирований
try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");

    if (Array.isArray(saved)) {
        bookings = saved.filter(booking =>
            booking &&
            typeof booking.id === "string" &&
            Object.hasOwn(halls, booking.hall) &&
            Number.isFinite(booking.start) &&
            Number.isFinite(booking.end) &&
            Number.isFinite(booking.total) &&
            booking.end > booking.start
        );
    }
} catch {
    message.textContent = "Не удалось загрузить бронирования.";
}

// Запрещаем выбирать прошедшие даты
const today = new Date();

dateInput.min = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

function formatPrice(price) {
    return price.toLocaleString("ru-RU") + " ₸";
}

// Расчёт стоимости
function updatePrice() {
    const hall = halls[hallInput.value];
    const hours = Number(hoursInput.value);

    const price = hall && Number.isFinite(hours) && hours > 0
        ? hall.price * hours
        : 0;

    totalPrice.textContent = formatPrice(price);
}

// Сохранение в браузере
function saveBookings(updatedBookings) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(updatedBookings));
        bookings = updatedBookings;
        renderBookings();
        return true;
    } catch {
        message.textContent =
            "Не удалось сохранить изменения в браузере.";
        return false;
    }
}

// Вывод бронирований на страницу
function renderBookings() {
    bookingsList.replaceChildren();

    if (bookings.length === 0) {
        bookingsList.textContent = "У вас пока нет бронирований.";
        return;
    }

    const sorted = [...bookings].sort((a, b) => a.start - b.start);

    for (const booking of sorted) {
        const card = document.createElement("article");
        card.className = "booking-card";

        const title = document.createElement("h3");
        title.textContent = halls[booking.hall].name;

        const start = new Date(booking.start);
        const end = new Date(booking.end);

        const timeOptions = {
            hour: "2-digit",
            minute: "2-digit"
        };

        const details = document.createElement("p");
        details.textContent =
            start.toLocaleDateString("ru-RU") + " · " +
            start.toLocaleTimeString("ru-RU", timeOptions) + " — " +
            end.toLocaleTimeString("ru-RU", timeOptions);

        const price = document.createElement("p");
        price.textContent = "Стоимость: " + formatPrice(booking.total);

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel-booking";
        cancelButton.textContent = "Отменить бронь";

        cancelButton.addEventListener("click", () => {
            const remaining = bookings.filter(
                item => item.id !== booking.id
            );

            if (saveBookings(remaining)) {
                message.textContent = "Бронирование отменено.";
            }
        });

        card.append(title, details, price, cancelButton);
        bookingsList.append(card);
    }
}

// Создание бронирования
form.addEventListener("submit", event => {
    event.preventDefault();
    message.textContent = "";

    if (!form.reportValidity()) return;

    const hall = halls[hallInput.value];
    const hours = Number(hoursInput.value);

    if (!hall || !Number.isInteger(hours) || hours < 1 || hours > 8) {
        message.textContent =
            "Выберите зал и длительность от 1 до 8 часов.";
        return;
    }

    const start = new Date(
        `${dateInput.value}T${timeInput.value}`
    ).getTime();

    const end = start + hours * 60 * 60 * 1000;

    if (!Number.isFinite(start) || start <= Date.now()) {
        message.textContent = "Выберите дату и время в будущем.";
        return;
    }

    if (new Date(start).toDateString() !== new Date(end).toDateString()) {
        message.textContent =
            "Бронирование должно закончиться до полуночи.";
        return;
    }

    // Проверка: занят ли этот зал в выбранное время
    const occupied = bookings.some(booking =>
        booking.hall === hallInput.value &&
        start < booking.end &&
        end > booking.start
    );

    if (occupied) {
        message.textContent =
            "Зал занят в это время. Выберите другое время.";
        return;
    }

    const booking = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        hall: hallInput.value,
        start,
        end,
        total: hall.price * hours
    };

    if (saveBookings([...bookings, booking])) {
        form.reset();
        updatePrice();
        message.textContent = "Зал успешно забронирован!";
    }
});

hallInput.addEventListener("change", updatePrice);
hoursInput.addEventListener("input", updatePrice);

updatePrice();
renderBookings();