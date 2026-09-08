// Aya: Calendar

let currentDate = new Date();

function generateCalendar() {
    const calendar = document.getElementById("calendarDays");
    if (!calendar) return;

    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthYearDisplay = document.getElementById("monthYear");
    if (monthYearDisplay) {
        monthYearDisplay.textContent = monthNames[month] + " " + year;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty spaces
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "day";
        calendar.appendChild(emptyDay);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.innerHTML = `<span>${day}</span>`;
        calendar.appendChild(dayElement);
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
}

// Fetch calendar data from API
function fetchCalendar() {
    // This will be expanded when API is ready
    generateCalendar();
}