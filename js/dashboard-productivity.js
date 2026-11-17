// ========================================
// Productivity Timer (Pomodoro Countdown)
// ========================================

function initializeProductivityTimer() {

    const timerDisplay = document.getElementById("timerDisplay");
    const timerStatus = document.getElementById("timerStatus");

    const startButton = document.getElementById("startTimer");
    const pauseButton = document.getElementById("pauseTimer");
    const resetButton = document.getElementById("resetTimer");

    function getConfiguredDurationSeconds() {
        const prefs = typeof getUserTaskPreferences === "function"
            ? getUserTaskPreferences()
            : { pomodoroMinutes: 25 };

        const minutes = Number(prefs.pomodoroMinutes) || 25;
        return minutes * 60;
    }

    let remainingSeconds = getConfiguredDurationSeconds();
    let timerInterval = null;


    // Format seconds into MM:SS (or HH:MM:SS if >= 60 min)
    function formatTime(seconds) {

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return [hours, minutes, secs]
                .map(value => String(value).padStart(2, "0"))
                .join(":");
        }

        return [minutes, secs]
            .map(value => String(value).padStart(2, "0"))
            .join(":");

    }


    // Update timer display
    function updateDisplay() {

        timerDisplay.textContent = formatTime(remainingSeconds);

    }


    // Initialize display immediately with saved duration
    updateDisplay();
    timerStatus.textContent = `Ready for a ${Math.round(remainingSeconds / 60)} min focus session?`;


    // Start timer
    startButton.addEventListener("click", () => {

        if (timerInterval !== null) return;

        if (remainingSeconds <= 0) {
            remainingSeconds = getConfiguredDurationSeconds();
            updateDisplay();
        }

        timerStatus.textContent = "Focus session in progress";

        timerInterval = setInterval(() => {

            if (remainingSeconds > 0) {
                remainingSeconds--;
                updateDisplay();
            }

            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerStatus.textContent = "Focus session complete! Great work.";
            }

        }, 1000);

    });


    // Pause timer
    pauseButton.addEventListener("click", () => {

        if (timerInterval === null) return;

        clearInterval(timerInterval);

        timerInterval = null;

        timerStatus.textContent = "Timer paused";

    });


    // Reset timer
    resetButton.addEventListener("click", () => {

        clearInterval(timerInterval);

        timerInterval = null;

        remainingSeconds = getConfiguredDurationSeconds();

        updateDisplay();

        timerStatus.textContent = `Ready for a ${Math.round(remainingSeconds / 60)} min focus session?`;

    });

}