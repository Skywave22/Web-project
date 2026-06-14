const API = "http://localhost:3000/jobs";

const form = document.getElementById("adminForm");
const tableBody = document.getElementById("tableBody");
const msg = document.getElementById("msg");
const formTitle = document.getElementById("formTitle");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// ---- Load all jobs and show in table ----

async function loadJobs() {
    tableBody.innerHTML = "<tr><td colspan='7' class='loading-msg'>Loading...</td></tr>";
    msg.innerHTML = "";

    try {
        let response = await fetch(API);

        if (!response.ok) {
            throw new Error("Server error");
        }

        let jobs = await response.json();
        showTable(jobs);
        updateDashboard(jobs);

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Could not connect to server. Make sure JSON Server is running.</div>";
        tableBody.innerHTML = "<tr><td colspan='7' class='table-error'>Error loading data.</td></tr>";
    }
}

function showTable(jobs) {
    tableBody.innerHTML = "";

    if (jobs.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='7' class='table-empty'>No listings yet.</td></tr>";
        return;
    }

    jobs.forEach(function (job) {
        tableBody.innerHTML += `
            <tr>
                <td>${job.title}</td>
                <td>${job.company}</td>
                <td>${job.category}</td>
                <td>PKR ${job.salary}</td>
                <td>${job.deadline}</td>
                <td>${job.status || "active"}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editJob('${job.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteJob('${job.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

// ---- Dashboard Stats ----

function updateDashboard(jobs) {
    let total = jobs.length;
    let jobsCount = jobs.filter(j => j.category === "Job").length;
    let internCount = jobs.filter(j => j.category === "Internship").length;

    document.getElementById("totalCount").innerText = total;
    document.getElementById("jobsCount").innerText = jobsCount;
    document.getElementById("internCount").innerText = internCount;
}

// ---- Validation ----

function validate() {
    let valid = true;

    document.querySelectorAll(".error-text").forEach(function (el) {
        el.style.display = "none";
    });
    document.querySelectorAll("input, select").forEach(function (el) {
        el.classList.remove("error");
    });

    let title = document.getElementById("title");
    let company = document.getElementById("company");
    let location = document.getElementById("location");
    let category = document.getElementById("category");
    let salary = document.getElementById("salary");
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

// ---- Submit form (POST or PATCH) ----

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validate()) {
        return;
    }

    let jobData = {
        title: document.getElementById("title").value.trim(),
        company: document.getElementById("company").value.trim(),
        location: document.getElementById("location").value.trim(),
        category: document.getElementById("category").value,
        salary: document.getElementById("salary").value,
        deadline: document.getElementById("deadline").value,
        status: document.getElementById("status").value
    };

    let id = document.getElementById("jobId").value;

    try {
        let response;

        if (id) {
            // Update existing job (PATCH)
            response = await fetch(API + "/" + id, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jobData)
            });
        } else {
            // Add new job (POST)
            response = await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jobData)
            });
        }

        if (!response.ok) {
            throw new Error("Save failed");
        }

        resetForm();
        msg.innerHTML = "<div class='alert alert-success mt-3'>Listing saved successfully!</div>";
        loadJobs();

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Failed to save. Check server.</div>";
    }
});

// ---- Edit: load job into form ----

async function editJob(id) {
    try {
        let response = await fetch(API + "/" + id);
        let job = await response.json();

        document.getElementById("jobId").value = job.id;
        document.getElementById("title").value = job.title;
        document.getElementById("company").value = job.company;
        document.getElementById("location").value = job.location;
        document.getElementById("category").value = job.category;
        document.getElementById("salary").value = job.salary;
        document.getElementById("deadline").value = job.deadline;
        document.getElementById("status").value = job.status || "active";

        formTitle.textContent = "Edit Listing";
        saveBtn.textContent = "Update";

        window.scrollTo(0, 0);

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Could not load listing for editing.</div>";
    }
}

// ---- Delete job ----

async function deleteJob(id) {
    let confirmed = confirm("Are you sure you want to delete this listing?");

    if (!confirmed) {
        return;
    }

    try {
        let response = await fetch(API + "/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        // If we were editing this job, reset the form
        if (document.getElementById("jobId").value === id) {
            resetForm();
        }

        msg.innerHTML = "<div class='alert alert-success mt-3'>Listing deleted.</div>";
        loadJobs();

    } catch (err) {
        msg.innerHTML = "<div class='alert alert-danger mt-3'>Failed to delete. Check server.</div>";
    }
}

// ---- Reset form to blank state ----

function resetForm() {
    form.reset();
    document.getElementById("jobId").value = "";
    formTitle.textContent = "Add New Listing";
    saveBtn.textContent = "Save";

    document.querySelectorAll(".error-text").forEach(function (el) {
        el.style.display = "none";
    });
    document.querySelectorAll("input, select").forEach(function (el) {
        el.classList.remove("error");
    });
}

cancelBtn.addEventListener("click", function () {
    resetForm();
    msg.innerHTML = "";
});

// ---- Start ----

loadJobs();