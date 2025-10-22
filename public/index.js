const API_URL = "http://localhost:3000/api";

//get

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const data = await response.json();
        displayLeaderboard(data.leaderboard);
    } catch (error) {
        showError("Failed to load leaderboard");
        console.error("Error fetching leaderboard:", error);
    }
}

async function fetchStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);
        const data = await response.json();
        displayStudents(data.students);
    } catch (error) {
        showError("Failed to load students");
        console.error("Error fetching students:", error);
    }
}

//post

async function addStudent(name) {
    try {
        const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
        });

        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
        }

        await refreshData();
        document.getElementById("studentName").value = "";
        hideError();
    } catch (error) {
        showError(error.message);
        console.error("Error adding student:", error);
    }
}

async function addCoffee(studentId) {
    try {
        const response = await fetch(
        `${API_URL}/students/${studentId}/coffee`,
        {
            method: "POST",
        }
        );

        if (!response.ok) {
            throw new Error("Failed to add coffee");
        }

        const countElement = document.getElementById(`count-${studentId}`);
        if (countElement) {
            countElement.classList.add("coffee-added");
            setTimeout(() => {
                countElement.classList.remove("coffee-added");
            }, 500);
        }

        await refreshData();
    } catch (error) {
        showError("Failed to add coffee");
        console.error("Error adding coffee:", error);
    }
}

//display stuff

function displayLeaderboard(students) {
    const podium = document.getElementById("podium");
    const ranks = ["🥇", "🥈", "🥉"];
    const classes = ["first", "second", "third"];

    podium.innerHTML = students
        .map(
        (student, index) => `
    <div class="podium-item ${classes[index]}">
        <div class="rank">${ranks[index]}</div>
        <div class="podium-name">${student.name}</div>
        <div class="podium-count">${student.coffee_count}</div>
        <div class="podium-label">coffees</div>
    </div>
    `
        )
        .join("");

    for (let i = students.length; i < 3; i++) {
        podium.innerHTML += `
        <div class="podium-item ${classes[i]} empty">
        <div class="rank">${ranks[i]}</div>
        <div class="podium-name">???</div>
        <div class="podium-count">0</div>
        <div class="podium-label">coffees</div>
        </div>
    `;
    }
}

function displayStudents(students) {
    const list = document.getElementById("studentsList");

    if (students.length === 0) {
        list.innerHTML = `
        <div class="empty-state">
        <div class="empty-state-icon">🎓</div>
        <p>No students yet. Add someone to start tracking!</p>
        </div>
    `;
    return;
}

list.innerHTML = students
    .map(
    (student) => `
    <div class="student-card" data-id="${student.id}">
        <div class="student-info">
        <span class="student-name">${student.name}</span>
        <span class="coffee-count" id="count-${student.id}">☕ ${student.coffee_count}</span>
        </div>
        <button class="add-coffee-btn" onclick="addCoffee(${student.id})">
        +
        </button>
    </div>
    `
        )
    .join("");
}


async function refreshData() {
    await Promise.all([fetchLeaderboard(), fetchStudents()]);
}


function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
    setTimeout(hideError, 5000);
}

function hideError() {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.classList.remove("show");
}


document
.getElementById("addStudentForm")
.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("studentName").value.trim();
    if (name) {
    addStudent(name);
    }
});



refreshData();

