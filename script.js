/* =========================================================
   INVENTORY MANAGEMENT SYSTEM
   Supabase Authentication + Cloud Database
========================================================= */

const SUPABASE_URL = "https://ehafforfjvpjmkulurnb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GX3QX79zxWDFKOSEjtr7Ww_Kb3rDDna";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

let currentUser = null;
let products = [];
let sales = [];
let lowStockLimit = 10;

const $ = (id) => document.getElementById(id);

const pageTitles = {
    dashboard: ["Dashboard", "Welcome to your inventory management system."],
    products: ["Products", "View and manage your products."],
    "add-product": ["Add Product", "Add a new product to your inventory."],
    sales: ["Sales / Purchase", "Record and review customer purchases."],
    stock: ["Stock Management", "Manage your inventory stock."],
    reports: ["Reports", "Review your inventory and sales."],
    settings: ["Settings", "Manage your inventory preferences."]
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function notify(message) {
    const element = $("appMessage");
    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.classList.add("visible");

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
        element.classList.remove("visible");
    }, 3500);
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function setLoginVisible(visible) {
    $("loginScreen").style.display = visible ? "flex" : "none";
    $("sidebar").style.display = visible ? "none" : "";
    $("mainContent").style.display = visible ? "none" : "";
    $("mobileMenuBtn").style.display = visible ? "none" : "";
}

function updateUserDetails(user) {
    const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

    const email = user.email || "";

    setText("sidebarUserName", name);
    setText("sidebarUserEmail", email);
    setText("headerUserName", name);
    setText("headerUserEmail", email);

    const initial = name.charAt(0).toUpperCase();
    setText("headerAvatar", initial);

    const avatar = document.querySelector("#sidebar .admin-circle");
    if (avatar) avatar.textContent = initial;
}

/* =========================================================
   GOOGLE AUTHENTICATION
========================================================= */

async function signInWithGoogle() {
    $("googleLoginBtn").disabled = true;
    $("loginMessage").textContent = "Connecting to Google...";

    const redirectTo = window.location.origin + window.location.pathname;

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
    });

    if (error) {
        $("loginMessage").textContent = error.message;
        $("googleLoginBtn").disabled = false;
    }
}

async function signOut() {
    const button = $("logoutBtn");
    button.disabled = true;

    const { error } = await supabaseClient.auth.signOut();

    button.disabled = false;

    if (error) {
        notify("Could not log out: " + error.message);
        return;
    }

    products = [];
    sales = [];
    setLoginVisible(true);
    $("loginMessage").textContent = "You have signed out.";
}

$("googleLoginBtn").addEventListener("click", signInWithGoogle);
$("logoutBtn").addEventListener("click", signOut);

/* =========================================================
   NAVIGATION AND MOBILE MENU
========================================================= */

function showSection(sectionName) {
    document.querySelectorAll(".page-section").forEach((section) => {
        section.classList.toggle("active-section", section.id === sectionName);
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );
    });

    const title = pageTitles[sectionName];

    if (title) {
        setText("pageTitle", title[0]);
        setText("pageSubtitle", title[1]);
    }

    closeMobileMenu();
}

document.querySelectorAll(".nav-item[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

function openMobileMenu() {
    $("sidebar").classList.add("open");
    $("sidebarOverlay").classList.add("visible");
    $("mobileMenuBtn").setAttribute("aria-expanded", "true");
}

function closeMobileMenu() {
    $("sidebar").classList.remove("open");
    $("sidebarOverlay").classList.remove("visible");
    $("mobileMenuBtn").setAttribute("aria-expanded", "false");
}

$("mobileMenuBtn").addEventListener("click", () => {
    if ($("sidebar").classList.contains("open")) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
});

$("sidebarOverlay").addEventListener("click", closeMobileMenu);

$("dashboardAddBtn").addEventListener("click", () => {
    showSection("add-product");
});

$("productsAddBtn").addEventListener("click", () => {
    showSection("add-product");
});

$("cancelProductBtn").addEventListener("click", () => {
    $("productForm").reset();
    showSection("products");
});

/* =========================================================
   INVENTORY STATUS
========================================================= */

function getStatus(quantity) {
    const amount = Number(quantity);

    if (amount <= 0) {
        return { text: "Out of Stock", className: "out-stock" };
    }

    if (amount < lowStockLimit) {
        return { text: "Low Stock", className: "low-stock" };
    }

    return { text: "In Stock", className: "in-stock" };
}

function statusHTML(quantity) {
    const status = getStatus(quantity);

    return `<span class="status ${status.className}">
        ${status.text}
    </span>`;
}

/* =========================================================
   DATABASE LOAD
========================================================= */

async function loadSettings() {
    const { data, error } = await supabaseClient
        .from("user_settings")
        .select("low_stock_limit")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) throw error;

    lowStockLimit = data?.low_stock_limit || 10;
    $("lowStockLimit").value = lowStockLimit;
}

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];
}

async function loadSales() {
    const { data, error } = await supabaseClient
        .from("sales")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) throw error;

    sales = data || [];
}

async function refreshData() {
    try {
        await loadSettings();
        await Promise.all([loadProducts(), loadSales()]);
        renderEverything();
    } catch (error) {
        console.error(error);
        notify("Unable to load your data: " + error.message);
    }
}

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboard() {
    const inStock = products.filter(
        (product) => Number(product.quantity) >= lowStockLimit
    ).length;

    const lowStock = products.filter(
        (product) =>
            Number(product.quantity) > 0 &&
            Number(product.quantity) < lowStockLimit
    ).length;

    const outOfStock = products.filter(
        (product) => Number(product.quantity) <= 0
    ).length;

    const totalSales = sales.reduce(
        (sum, sale) => sum + Number(sale.total || 0),
        0
    );

    const itemsSold = sales.reduce(
        (sum, sale) => sum + Number(sale.quantity || 0),
        0
    );

    const inventoryValue = products.reduce(
        (sum, product) =>
            sum + Number(product.quantity) * Number(product.price),
        0
    );

    setText("totalProducts", products.length);
    setText("inStock", inStock);
    setText("lowStock", lowStock);
    setText("outOfStock", outOfStock);
    setText("totalSales", formatMoney(totalSales));
    setText("reportRevenue", formatMoney(totalSales));
    setText("itemsSold", itemsSold);
    setText("reportItemsSold", itemsSold);
    setText("totalTransactions", sales.length);
    setText("reportTransactions", sales.length);
    setText("inventoryValue", formatMoney(inventoryValue));
}

/* =========================================================
   PRODUCT TABLES
========================================================= */

function filteredProducts(searchId, categoryId) {
    const search = ($(searchId)?.value || "").trim().toLowerCase();
    const category = $(categoryId)?.value || "all";

    return products.filter((product) => {
        const matchesSearch =
            String(product.name).toLowerCase().includes(search) ||
            String(product.code || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" || product.category === category;

        return matchesSearch && matchesCategory;
    });
}

function productRow(product, includeSupplier = false) {
    return `<tr>
        <td><strong>${escapeHTML(product.name)}</strong></td>
        <td>${escapeHTML(product.category)}</td>
        ${includeSupplier ? `<td>${escapeHTML(product.supplier || "-")}</td>` : ""}
        <td>${Number(product.quantity)}</td>
        ${includeSupplier ? `<td>${formatMoney(product.price)}</td>` : ""}
        ${includeSupplier ? `<td>${statusHTML(product.quantity)}</td>` : `<td>${formatMoney(product.price)}</td><td>${statusHTML(product.quantity)}</td>`}
        <td>
            <div class="action-buttons">
                <button class="small-btn sell-btn" data-sell="${product.id}" type="button">Sell</button>
                <button class="small-btn delete-btn" data-delete="${product.id}" type="button">Delete</button>
            </div>
        </td>
    </tr>`;
}

function renderProductTables() {
    const dashboardProducts = filteredProducts(
        "dashboardSearch",
        "dashboardCategoryFilter"
    );

    const allProducts = filteredProducts(
        "productSearch",
        "productCategoryFilter"
    );

    $("dashboardProductTable").innerHTML = dashboardProducts.length
        ? dashboardProducts.map((product) => productRow(product)).join("")
        : `<tr><td colspan="6" class="empty-row">No products found.</td></tr>`;

    $("productTable").innerHTML = allProducts.length
        ? allProducts.map((product) => productRow(product, true)).join("")
        : `<tr><td colspan="7" class="empty-row">No products found.</td></tr>`;

    const categories = [...new Set(products.map((product) => product.category))];

    ["dashboardCategoryFilter", "productCategoryFilter"].forEach((id) => {
        const select = $(id);
        const previous = select.value;

        select.innerHTML = `<option value="all">All Categories</option>`;

        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });

        select.value = categories.includes(previous) ? previous : "all";
    });

    renderProductDropdowns();
}

function renderProductDropdowns() {
    ["saleProduct", "stockProduct"].forEach((id) => {
        const select = $(id);
        const previous = select.value;

        select.innerHTML = `<option value="">Select a product</option>`;

        products.forEach((product) => {
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent =
                `${product.name} — Stock: ${product.quantity}`;
            select.appendChild(option);
        });

        if (products.some((product) => product.id === previous)) {
            select.value = previous;
        }
    });

    updateCurrentStock();
    updateSaleTotal();
}

/* =========================================================
   ADD PRODUCT
========================================================= */

$("productForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = $("productName").value.trim();
    const category = $("productCategory").value.trim();
    const quantity = Number($("productQuantity").value);
    const price = Number($("productPrice").value);

    if (!name || !category) {
        notify("Enter a product name and category.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 0 ||
        !Number.isFinite(price) || price < 0) {
        notify("Enter a valid quantity and price.");
        return;
    }

    const record = {
        user_id: currentUser.id,
        name,
        category,
        quantity,
        price,
        supplier: $("productSupplier").value.trim(),
        code: $("productCode").value.trim()
    };

    const { error } = await supabaseClient
        .from("products")
        .insert(record);

    if (error) {
        notify("Could not save product: " + error.message);
        return;
    }

    $("productForm").reset();
    await refreshData();
    showSection("products");
    notify("Product added successfully.");
});

/* =========================================================
   DELETE PRODUCT
========================================================= */

document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete]");
    if (!deleteButton) return;

    const product = products.find(
        (item) => item.id === deleteButton.dataset.delete
    );

    if (!product) return;

    if (!confirm(`Delete "${product.name}" from your inventory?`)) {
        return;
    }

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("user_id", currentUser.id);

    if (error) {
        notify("Could not delete product: " + error.message);
        return;
    }

    await refreshData();
    notify("Product deleted.");
});

document.addEventListener("click", (event) => {
    const sellButton = event.target.closest("[data-sell]");
    if (!sellButton) return;

    showSection("sales");
    $("saleProduct").value = sellButton.dataset.sell;
    updateSaleTotal();
    $("saleQuantity").focus();
});

/* =========================================================
   SALES
========================================================= */

function updateSaleTotal() {
    const product = products.find(
        (item) => item.id === $("saleProduct").value
    );

    const quantity = Number($("saleQuantity").value);

    setText(
        "saleTotal",
        product && quantity > 0
            ? formatMoney(Number(product.price) * quantity)
            : "₹0"
    );
}

$("saleProduct").addEventListener("change", updateSaleTotal);
$("saleQuantity").addEventListener("input", updateSaleTotal);

$("saleForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const product = products.find(
        (item) => item.id === $("saleProduct").value
    );

    const quantity = Number($("saleQuantity").value);

    if (!product) {
        notify("Select a product.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        notify("Enter a valid quantity.");
        return;
    }

    if (quantity > Number(product.quantity)) {
        notify(`Insufficient stock. Available: ${product.quantity}`);
        return;
    }

    const total = quantity * Number(product.price);

    /*
      Update the stock first. The owner filter and RLS prevent
      a user from changing another user's product.
    */
    const { data: updatedProduct, error: stockError } =
        await supabaseClient
            .from("products")
            .update({ quantity: Number(product.quantity) - quantity })
            .eq("id", product.id)
            .eq("user_id", currentUser.id)
            .gte("quantity", quantity)
            .select()
            .maybeSingle();

    if (stockError || !updatedProduct) {
        notify("Stock update failed. Refresh the inventory and try again.");
        await refreshData();
        return;
    }

    const saleRecord = {
        user_id: currentUser.id,
        product_id: product.id,
        product_name: product.name,
        customer: $("customerName").value.trim() || "Walk-in Customer",
        quantity,
        price: Number(product.price),
        total,
        payment: $("paymentMethod").value
    };

    const { error: saleError } = await supabaseClient
        .from("sales")
        .insert(saleRecord);

    if (saleError) {
        /*
          Attempt to restore the quantity if the sale record could
          not be saved. For production, use a database transaction/RPC.
        */
        await supabaseClient
            .from("products")
            .update({ quantity: Number(product.quantity) })
            .eq("id", product.id)
            .eq("user_id", currentUser.id);

        notify("Sale could not be saved: " + saleError.message);
        await refreshData();
        return;
    }

    $("saleForm").reset();
    setText("saleTotal", "₹0");
    await refreshData();
    notify("Sale completed successfully.");
});

function renderSalesTable() {
    $("salesTable").innerHTML = sales.length
        ? sales.map((sale) => `<tr>
            <td>${escapeHTML(new Date(sale.created_at).toLocaleString("en-IN"))}</td>
            <td>${escapeHTML(sale.customer || "Walk-in Customer")}</td>
            <td>${escapeHTML(sale.product_name)}</td>
            <td>${Number(sale.quantity)}</td>
            <td>${formatMoney(sale.total)}</td>
            <td>${escapeHTML(sale.payment || "Cash")}</td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="empty-row">No sales recorded yet.</td></tr>`;
}

/* =========================================================
   STOCK MANAGEMENT
========================================================= */

function updateCurrentStock() {
    const product = products.find(
        (item) => item.id === $("stockProduct").value
    );

    $("currentStock").value = product ? Number(product.quantity) : 0;
}

$("stockProduct").addEventListener("change", updateCurrentStock);

async function changeStock(direction) {
    const product = products.find(
        (item) => item.id === $("stockProduct").value
    );

    const quantity = Number($("stockQuantity").value);

    if (!product) {
        notify("Select a product.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        notify("Enter a valid whole-number quantity.");
        return;
    }

    if (direction < 0 && quantity > Number(product.quantity)) {
        notify("You cannot remove more stock than is available.");
        return;
    }

    const newQuantity = Number(product.quantity) + direction * quantity;

    const { error } = await supabaseClient
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", product.id)
        .eq("user_id", currentUser.id);

    if (error) {
        notify("Stock update failed: " + error.message);
        return;
    }

    $("stockQuantity").value = "";
    await refreshData();
    notify(direction > 0 ? "Stock added." : "Stock removed.");
}

$("addStockBtn").addEventListener("click", () => changeStock(1));
$("removeStockBtn").addEventListener("click", () => changeStock(-1));

function renderStockTable() {
    $("stockTable").innerHTML = products.length
        ? products.map((product) => `<tr>
            <td><strong>${escapeHTML(product.name)}</strong></td>
            <td>${escapeHTML(product.category)}</td>
            <td>${Number(product.quantity)}</td>
            <td>${statusHTML(product.quantity)}</td>
        </tr>`).join("")
        : `<tr><td colspan="4" class="empty-row">No products available.</td></tr>`;
}

/* =========================================================
   REPORTS
========================================================= */

function renderReportTable() {
    $("reportTable").innerHTML = products.length
        ? products.map((product) => `<tr>
            <td><strong>${escapeHTML(product.name)}</strong></td>
            <td>${Number(product.quantity)}</td>
            <td>${formatMoney(product.price)}</td>
            <td>${formatMoney(Number(product.quantity) * Number(product.price))}</td>
            <td>${statusHTML(product.quantity)}</td>
        </tr>`).join("")
        : `<tr><td colspan="5" class="empty-row">No products available.</td></tr>`;
}

/* =========================================================
   SETTINGS
========================================================= */

$("settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const value = Number($("lowStockLimit").value);

    if (!Number.isInteger(value) || value <= 0) {
        notify("Enter a valid positive stock limit.");
        return;
    }

    const { error } = await supabaseClient
        .from("user_settings")
        .upsert({
            user_id: currentUser.id,
            low_stock_limit: value
        }, { onConflict: "user_id" });

    if (error) {
        notify("Could not save settings: " + error.message);
        return;
    }

    lowStockLimit = value;
    renderEverything();
    notify("Settings saved.");
});

$("resetDataBtn").addEventListener("click", async () => {
    const confirmed = confirm(
        "Delete all your products and sales? This cannot be undone."
    );

    if (!confirmed) return;

    const { error: salesError } = await supabaseClient
        .from("sales")
        .delete()
        .eq("user_id", currentUser.id);

    if (salesError) {
        notify("Could not reset sales: " + salesError.message);
        return;
    }

    const { error: productsError } = await supabaseClient
        .from("products")
        .delete()
        .eq("user_id", currentUser.id);

    if (productsError) {
        notify("Could not reset products: " + productsError.message);
        return;
    }

    await refreshData();
    notify("Your inventory has been reset.");
});

/* =========================================================
   SEARCH EVENTS
========================================================= */

$("dashboardSearch").addEventListener("input", renderProductTables);
$("productSearch").addEventListener("input", renderProductTables);
$("dashboardCategoryFilter").addEventListener("change", renderProductTables);
$("productCategoryFilter").addEventListener("change", renderProductTables);

/* =========================================================
   RENDER
========================================================= */

function renderEverything() {
    updateDashboard();
    renderProductTables();
    renderSalesTable();
    renderStockTable();
    renderReportTable();
}

/* =========================================================
   AUTH SESSION INITIALIZATION
========================================================= */

async function initializeApp() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (data.session?.user) {
            await onAuthenticated(data.session.user);
        } else {
            setLoginVisible(true);
        }
    } catch (error) {
        console.error(error);
        setLoginVisible(true);
        $("loginMessage").textContent =
            "Unable to connect. Check your Supabase URL and publishable key.";
    }
}

async function onAuthenticated(user) {
    currentUser = user;
    setLoginVisible(false);
    updateUserDetails(user);
    await refreshData();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
        currentUser = null;
        products = [];
        sales = [];
        setLoginVisible(true);
    } else if (session?.user && event === "SIGNED_IN") {
        /*
          Defer database work so it does not run inside the auth callback.
        */
        setTimeout(() => onAuthenticated(session.user), 0);
    }
});

initializeApp();
