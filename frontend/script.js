const API_URL = "http://127.0.0.1:8000";

let inventoryData = [];
let chart = null;


// ===============================
// LOAD DASHBOARD
// ===============================

async function loadDashboard() {
    try {
        const response = await fetch(
            `${API_URL}/inventory/smart-recommendations`
        );

        if (!response.ok) {
            throw new Error("Failed to load inventory data");
        }

        inventoryData = await response.json();

        updateSummaryCards();
        updateInventoryTable();
        generateAIInsights();
        updateProductSelector();

    } catch (error) {
        console.error(error);

        document.getElementById("aiInsights").innerHTML = `
            <div class="insight-card">
                <strong>⚠ Backend Connection Error</strong>
                <p>Make sure FastAPI is running on port 8000.</p>
            </div>
        `;
    }
}


// ===============================
// SUMMARY CARDS
// ===============================

function updateSummaryCards() {

    const totalProducts = inventoryData.length;

    const highRisk = inventoryData.filter(
        item => item.stockout_risk === "HIGH"
    ).length;

    const mediumRisk = inventoryData.filter(
        item => item.stockout_risk === "MEDIUM"
    ).length;

    const demandValues = inventoryData
        .map(item => Number(item.predicted_daily_demand))
        .filter(value => !isNaN(value));

    const averageDemand =
        demandValues.length > 0
            ? demandValues.reduce((a, b) => a + b, 0) /
              demandValues.length
            : 0;

    document.getElementById("totalProducts").textContent =
        totalProducts;

    document.getElementById("highRisk").textContent =
        highRisk;

    document.getElementById("mediumRisk").textContent =
        mediumRisk;

    document.getElementById("avgDemand").textContent =
        averageDemand.toFixed(1);
}


// ===============================
// INVENTORY TABLE
// ===============================

function updateInventoryTable() {

    const tableBody = document.getElementById("inventoryTable");

    tableBody.innerHTML = "";

    inventoryData.forEach(item => {

        const row = document.createElement("tr");

        const riskClass =
            item.stockout_risk.toLowerCase().replace(" ", "-");

        row.innerHTML = `
            <td>
                <strong>${item.product_name}</strong>
            </td>

            <td>
                ${item.current_stock} ${item.unit}
            </td>

            <td>
                ${item.predicted_daily_demand ?? "-"}
            </td>

            <td>
                ${item.days_until_stockout ?? "-"} days
            </td>

            <td>
                <span class="risk-badge ${riskClass}">
                    ${item.stockout_risk}
                </span>
            </td>

            <td>
                <strong>
                    ${item.recommended_reorder ?? 0}
                    ${item.unit}
                </strong>
            </td>

            <td>
                
    <button
        class="edit-btn"
        onclick="editProduct(${item.product_id})"
    >
        Edit
    </button>

    <button
        class="delete-btn"
        onclick="deleteProduct(${item.product_id})"
    >
        Delete
    </button>
</td>
            
        `;

        tableBody.appendChild(row);
    });
}


// ===============================
// AI INSIGHTS
// ===============================

function generateAIInsights() {

    const insightsContainer =
        document.getElementById("aiInsights");

    if (inventoryData.length === 0) {
        insightsContainer.innerHTML = `
            <p>No inventory data available.</p>
        `;
        return;
    }

    const sortedProducts = [...inventoryData].sort(
        (a, b) =>
            (a.days_until_stockout ?? 999999) -
            (b.days_until_stockout ?? 999999)
    );

    const criticalProduct = sortedProducts[0];

    const totalReorder = inventoryData.reduce(
        (total, item) =>
            total + Number(item.recommended_reorder || 0),
        0
    );

    insightsContainer.innerHTML = `
        <div class="insight-card">
            <div class="insight-icon">⚠</div>
            <div>
                <strong>Stockout Risk Alert</strong>
                <p>
                    ${criticalProduct.product_name}
                    is expected to run out in approximately
                    ${criticalProduct.days_until_stockout} days.
                </p>
            </div>
        </div>

        <div class="insight-card">
            <div class="insight-icon">📦</div>
            <div>
                <strong>Reorder Recommendation</strong>
                <p>
                    The AI system recommends approximately
                    ${totalReorder.toFixed(1)}
                 in total reorder quantity across all products.
                </p>
            </div>
        </div>

        <div class="insight-card">
            <div class="insight-icon">🤖</div>
            <div>
                <strong>AI Decision Support</strong>
                <p>
            Demand forecasting and stockout risk analysis help
            prioritize inventory actions and reorder decisions.
        </p>
            </div>
        </div>
    `;
}


// ===============================
// FORECAST CHART
// ===============================

async function loadForecast(productName) {

    try {

        const inventoryResponse = await fetch(
            `${API_URL}/inventory`
        );

        const inventory = await inventoryResponse.json();

        const product = inventory.find(
            item => item.product_name === productName
        );

        if (!product) {
            return;
        }

        const forecastResponse = await fetch(
            `${API_URL}/inventory/${encodeURIComponent(productName)}/forecast?days=7`
        );

        const forecast = await forecastResponse.json();

        renderForecastChart(
            productName,
            Number(product.daily_usage),
            Number(forecast.predicted_daily_demand)
        );

    } catch (error) {
        console.error("Forecast error:", error);
    }
}


// ===============================
// CHART.JS
// ===============================

function renderForecastChart(
    productName,
    currentDemand,
    predictedDemand
) {

    const canvas =
        document.getElementById("demandChart");

    if (!canvas) {
        return;
    }

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "Current Daily Usage",
                "AI Predicted Demand"
            ],

            datasets: [
                {
                    label: productName,
                    data: [
                        currentDemand,
                        predictedDemand
                    ],

                    borderWidth: 1
                }
            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: true
                },

                tooltip: {
                    enabled: true
                }
            },

            scales: {

                y: {
                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Units / Day"
                    }
                }
            }
        }
    });
}

// UPDATE PRODUCT SELECTOR
function updateProductSelector() {
    const selector =
        document.getElementById("productSelect");

    if (!selector) return;

    const currentValue = selector.value;

    selector.innerHTML = `
        <option value="">Select Product</option>
        ${inventoryData.map(item => `
            <option value="${item.product_name}">
                ${item.product_name}
            </option>
        `).join("")}
    `;

    if (
        inventoryData.some(
            item => item.product_name === currentValue
        )
    ) {
        selector.value = currentValue;
    } else if (inventoryData.length > 0) {
        selector.value = inventoryData[0].product_name;
        loadForecast(inventoryData[0].product_name);
    }
}

// ===============================
// PRODUCT SELECTOR
// ===============================

function setupProductSelector() {

    const selector =
        document.getElementById("productSelect");

    if (!selector) {
        return;
    }

    selector.addEventListener(
        "change",
        function () {

            const productName =
                this.value;

            if (productName) {
                loadForecast(productName);
            }
        }
    );

    if (selector.value) {
        loadForecast(selector.value);
    }
}


// ===============================
// SEARCH
// ===============================

function setupSearch() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                this.value.toLowerCase();

            const rows =
                document.querySelectorAll(
                    "#inventoryTable tr"
                );

            rows.forEach(row => {

                const productName =
                    row.textContent.toLowerCase();

                row.style.display =
                    productName.includes(searchTerm)
                        ? ""
                        : "none";
            });
        }
    );
}



// ===============================
// START APPLICATION
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

        setupProductSelector();

        setupSearch();

        // REFRESH BUTTON
const refreshButton = document.getElementById("refreshButton");

refreshButton.addEventListener("click", async function () {
    refreshButton.textContent = "↻ Refreshing...";

    await loadDashboard();

    refreshButton.textContent = "↻ Refresh";
});

    

    }
);

// ===============================
// ADD PRODUCT MODAL
// ===============================

const addProductBtn = document.getElementById("addProductBtn");
const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");
const productForm = document.getElementById("productForm");

addProductBtn.addEventListener("click", () => {

    delete productForm.dataset.editingId;

    productForm.reset();

    document.getElementById("modalTitle").textContent =
        "Add New Product";

        document.getElementById("submitProductBtn").textContent =
    "Add Product";

    productModal.classList.add("active");
});

// Close modal
closeModal.addEventListener("click", () => {
    productModal.classList.remove("active");
});

// Close when clicking outside modal
productModal.addEventListener("click", (event) => {
    if (event.target === productModal) {
        productModal.classList.remove("active");
    }
});

// Add product
productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productName =
        document.getElementById("productName").value;

    const category =
        document.getElementById("category").value =
    "";

    const currentStock =
        document.getElementById("currentStock").value;

    const dailyUsage =
        document.getElementById("dailyUsage").value;

    const unit =
        document.getElementById("unit").value;

    const editingId = productForm.dataset.editingId;

    try {

        // EDIT PRODUCT
        if (editingId) {

            const response = await fetch(
                `${API_URL}/inventory/${editingId}?product_name=${encodeURIComponent(productName)}&category=${encodeURIComponent(category)}&current_stock=${currentStock}&daily_usage=${dailyUsage}&unit=${encodeURIComponent(unit)}`,
                {
                    method: "PUT"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update product");
            }

            alert("Product updated successfully!");

            delete productForm.dataset.editingId;

        }

        // ADD PRODUCT
        else {

            const response = await fetch(
                `${API_URL}/inventory?product_name=${encodeURIComponent(productName)}&category=${encodeURIComponent(category)}&current_stock=${currentStock}&daily_usage=${dailyUsage}&unit=${encodeURIComponent(unit)}`,
                {
                    method: "POST"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to add product");
            }

            alert("Product added successfully!");
        }

        productForm.reset();

        productModal.classList.remove("active");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        alert("Operation failed. Please try again.");
    }
});

// ===============================
// DELETE PRODUCT
// ===============================

async function deleteProduct(productId) {

    const confirmed = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/inventory/${productId}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete product");
        }

        alert("Product deleted successfully!");

        await loadDashboard();

    } catch (error) {

        console.error(error);

        alert("Failed to delete product.");
    }
}

// EDIT PRODUCT
async function editProduct(productId) {

    const product = inventoryData.find(
        item => item.product_id === productId
    );

    if (!product) {
        alert("Product not found.");
        return;
    }
    productForm.dataset.editingId = productId;
    document.getElementById("modalTitle").textContent =
    "Edit Product";

    document.getElementById("submitProductBtn").textContent =
    "Update Product";

    document.getElementById("productName").value =
        product.product_name;

    document.getElementById("category").value =
        "";

    document.getElementById("currentStock").value =
        product.current_stock;

    document.getElementById("dailyUsage").value =
    product.daily_usage;

    document.getElementById("unit").value =
        product.unit;

    productModal.classList.add("active");
}

// SIDEBAR NAVIGATION
document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", function () {

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});