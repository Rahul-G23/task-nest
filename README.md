# TaskNest — Personal Productivity & Task Management Web App

TaskNest is a modular, offline-first personal productivity web application built with **HTML5**, **CSS3**, **Vanilla JavaScript**, and **Chart.js**. It features per-user browser storage isolation, interactive analytics, a Pomodoro focus timer, monthly calendar scheduling, and portable JSON backups.

---

## Key Features

- **Per-User Authentication & Data Isolation:** Register and sign in locally with tasks and preferences isolated per account email in `localStorage`.
- **Dashboard Overview:** Live task summary metrics, completion rate doughnut chart, weekly productivity overview, and a customizable Pomodoro countdown timer.
- **Task Management (`My Tasks`):** Create, complete, reopen, delete, and search tasks in real time with priority levels (`High`, `Medium`, `Low`) and categories (`Work`, `Personal`, `Study`).
- **Interactive Calendar:** Monthly calendar grid with priority-colored task indicators and day-level task inspection.
- **Dedicated Analytics:** Deep-dive KPIs (Completion Rate, On-Time Delivery, Active Backlog, Most Productive Weekday) alongside 7-day, 8-week, and 6-month completion trend charts.
- **Settings & Data Management:** Update profile details and passwords, configure default task categories/priorities and Pomodoro duration, and export/import full JSON task backups.
- **Help Center & Global Search:** Built-in searchable FAQ center and `Ctrl + F` / `⌘ + F` global task search across all pages.

---

## Project Structure

```text
TaskNest/
├── index.html                  # Authentication entry point (Login / Register)
├── pages/                      # Main application views
│   ├── dashboard.html
│   ├── tasks.html
│   ├── calendar.html
│   ├── analytics.html
│   ├── settings.html
│   └── help.html
├── components/                 # Reusable HTML partials loaded dynamically
├── css/                        # Modular component & page stylesheets
├── js/                         # Modular business logic & Chart.js integrations
└── README.md
