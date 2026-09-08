// Aya: Emotion Selection & Logging

let selectedEmotion = null;

// Emotion selection
const moods = document.querySelectorAll(".mood");

moods.forEach(mood => {
    mood.addEventListener("click", () => {
        moods.forEach(m => m.classList.remove("selected"));
        mood.classList.add("selected");
        selectedEmotion = mood.dataset.emotion;
    });
});

// Log mood
function logMood() {
    const note = document.getElementById("moodNote").value;

    if (!selectedEmotion) {
        alert("Please select an emotion first.");
        return;
    }

    console.log({ emotion: selectedEmotion, note: note });

    fetch('/api/logs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emotion: selectedEmotion,
            note: note
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Mood logged successfully! 😊");
            document.getElementById("moodNote").value = "";
            moods.forEach(m => m.classList.remove("selected"));
            selectedEmotion = null;
            // Refresh stats and calendar
            fetchStats();
            fetchCalendar();
        } else {
            alert("Failed to log mood. Please try again.");
        }
    })
    .catch(err => {
        alert("Error: " + err.message);
    });
}
