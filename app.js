const API = "http://localhost:3000/jobs";

const form = document.getElementById("submitForm");
const list = document.getElementById("list");
const filter = document.getElementById("filter");
const search = document.getElementById("search");
const msg = document.getElementById("msg");

// ---- Load and show jobs ----

async function loadJobs() {
    list.innerHTML = "<div class='loading-msg'>Loading...</div>";
    msg.innerHTML = "";

    try {
        let response = await fetch(API);

        if (!response.ok) {
            throw new Error("Server error");
        }

        let jobs = await response.json();
        showJobs(jobs);

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Could not connect to server. Make sure JSON Server is running.</div>";
        list.innerHTML = "";
    }
}

function showJobs(jobs) {
    list.innerHTML = "";

    // Only show active jobs (not hidden ones)
    let visible = jobs.filter(j => j.status !== "hidden");

    // Apply category filter
    if (filter.value !== "All") {
        visible = visible.filter(j => j.category === filter.value);
    }

    // Apply search filter
    if (search && search.value.trim() !== "") {
        let term = search.value.toLowerCase().trim();
        visible = visible.filter(j => 
            j.title.toLowerCase().includes(term) || 
            j.company.toLowerCase().includes(term) ||
            j.location.toLowerCase().includes(term)
        );
    }

    if (visible.length === 0) {
        list.innerHTML = "<div class='loading-msg'>No listings found.</div>";
        return;
    }

    visible.forEach(function(job) {
        let badgeClass = job.category === "Internship" ? "badge intern" : "badge";
        let salaryText = job.salary;

        list.innerHTML += `
            <div class="card">
                <span class="badge ${badgeClass} bg-secondary">${job.category}</span>
                <h3>${job.title}</h3>
                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Salary:</strong> ${salaryText}</p>
                <p><strong>Deadline:</strong> ${job.deadline}</p>
                <button class="btn btn-primary mt-2">Apply</button>
            </div>
        `;
    });
}

// ---- Form validation ----

function validate() {
    let valid = true;

    // Reset all errors first
    document.querySelectorAll(".error-text").forEach(function(el) {
        el.classList.remove("show");
    });
    document.querySelectorAll("input, select").forEach(function(el) {
        el.classList.remove("error");
    });

    let title    = document.getElementById("title");
    let company  = document.getElementById("company");
    let location = document.getElementById("location");
    let category = document.getElementById("category");
    let salary   = document.getElementById("salary");
    let deadline = document.getElementById("deadline");

    if (title.value.trim() === "") {
        title.classList.add("error");
        document.getElementById("titleErr").classList.add("show");
        valid = false;
    }

    if (company.value.trim() === "") {
        company.classList.add("error");
        document.getElementById("companyErr").classList.add("show");
        valid = false;
    }

    if (location.value.trim() === "") {
        location.classList.add("error");
        document.getElementById("locationErr").classList.add("show");
        valid = false;
    }

    if (category.value === "") {
        category.classList.add("error");
        document.getElementById("categoryErr").classList.add("show");
        valid = false;
    }

    if (salary.value === "" || Number(salary.value) <= 0) {
        salary.classList.add("error");
        document.getElementById("salaryErr").classList.add("show");
        valid = false;
    }

    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let picked = new Date(deadline.value);

    if (deadline.value === "" || picked < today) {
        deadline.classList.add("error");
        document.getElementById("deadlineErr").classList.add("show");
        valid = false;
    }

    return valid;
}

// ---- Submit form (POST) ----

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!validate()) {
        return;
    }

    let newJob = {
        title:    document.getElementById("title").value.trim(),
        company:  document.getElementById("company").value.trim(),
        location: document.getElementById("location").value.trim(),
        category: document.getElementById("category").value,
        salary:   document.getElementById("salary").value,
        deadline: document.getElementById("deadline").value,
        status:   "active"
    };

    try {
        let response = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newJob)
        });

        if (!response.ok) {
            throw new Error("Post failed");
        }

        form.reset();
        msg.innerHTML = "<div class='alert alert-success mt-3'>Listing submitted successfully!</div>";
        loadJobs();

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Failed to submit. Check server.</div>";
    }
});

// ---- Filter change ----

filter.addEventListener("change", async function() {
    try {
        let response = await fetch(API);
        let jobs = await response.json();
        showJobs(jobs);
    } catch (err) {}
});

if (search) {
    search.addEventListener("input", async function() {
        try {
            let response = await fetch(API);
            let jobs = await response.json();
            showJobs(jobs);
        } catch (err) {}
    });
}

// ---- Start ----

loadJobs();