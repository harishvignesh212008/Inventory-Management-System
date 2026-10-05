/* =====================================================
   INVENTORY MANAGEMENT SYSTEM
===================================================== */


/* ================= DATA ================= */

let products =
    JSON.parse(
        localStorage.getItem("inventoryProducts")
    ) || [];


let sales =
    JSON.parse(
        localStorage.getItem("inventorySales")
    ) || [];


let lowStockLimit =
    Number(
        localStorage.getItem("lowStockLimit")
    ) || 10;


/* ================= SAVE ================= */

function saveProducts() {

    localStorage.setItem(
        "inventoryProducts",
        JSON.stringify(products)
    );

}


function saveSales() {

    localStorage.setItem(
        "inventorySales",
        JSON.stringify(sales)
    );

}


function saveSettings() {

    localStorage.setItem(
        "lowStockLimit",
        lowStockLimit
    );

}


/* ================= STATUS ================= */

function getStatus(quantity) {

    quantity = Number(quantity);


    if (quantity === 0) {

        return {
            text: "Out of Stock",
            className: "out-stock"
        };

    }


    if (quantity < lowStockLimit) {

        return {
            text: "Low Stock",
            className: "low-stock"
        };

    }


    return {
        text: "In Stock",
        className: "in-stock"
    };

}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    let inStock = 0;

    let lowStock = 0;

    let outStock = 0;


    products.forEach(product => {

        const quantity =
            Number(product.quantity);


        if (quantity === 0) {

            outStock++;

        }

        else if (quantity < lowStockLimit) {

            lowStock++;

        }

        else {

            inStock++;

        }

    });


    document.getElementById(
        "total-products"
    ).textContent = products.length;


    document.getElementById(
        "in-stock"
    ).textContent = inStock;


    document.getElementById(
        "low-stock"
    ).textContent = lowStock;


    document.getElementById(
        "out-stock"
    ).textContent = outStock;


    /* SALES */

    let revenue = 0;

    let units = 0;


    sales.forEach(sale => {

        revenue += Number(sale.total);

        units += Number(sale.quantity);

    });


    document.getElementById(
        "dashboard-sales-count"
    ).textContent = sales.length;


    document.getElementById(
        "dashboard-revenue"
    ).textContent =
        `₹${revenue.toLocaleString("en-IN")}`;


    document.getElementById(
        "dashboard-units"
    ).textContent = units;

}


/* ================= CATEGORIES ================= */

function updateCategoryDropdowns() {

    const categories = [
        ...new Set(
            products.map(
                product => product.category
            )
        )
    ];


    const dropdowns = [

        document.getElementById(
            "dashboard-category"
        ),

        document.getElementById(
            "products-category"
        )

    ];


    dropdowns.forEach(dropdown => {

        const oldValue =
            dropdown.value;


        dropdown.innerHTML = `
            <option value="all">
                All Categories
            </option>
        `;


        categories.forEach(category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value = category;

            option.textContent = category;


            dropdown.appendChild(option);

        });


        if (
            categories.includes(oldValue)
        ) {

            dropdown.value = oldValue;

        }

    });

}


/* ================= FILTER ================= */

function filterProducts(
    search,
    category
) {

    return products.filter(product => {

        const name =
            product.name.toLowerCase();


        const matchesSearch =
            name.includes(
                search.toLowerCase()
            );


        const matchesCategory =
            category === "all" ||
            product.category === category;


        return (
            matchesSearch &&
            matchesCategory
        );

    });

}


/* ================= DASHBOARD TABLE ================= */

function displayDashboardProducts(
    productList = products
) {

    const table =
        document.getElementById(
            "dashboard-product-table"
        );


    table.innerHTML = "";


    if (productList.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6"
                    class="empty-row">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    productList.forEach(product => {

        const index =
            products.indexOf(product);


        const status =
            getStatus(
                product.quantity
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${product.name}
                </strong>
            </td>

            <td>
                ${product.category}
            </td>

            <td>
                ${product.quantity}
            </td>

            <td>
                ₹${Number(product.price)
                    .toLocaleString("en-IN")}
            </td>

            <td>
                <span class="status
                    ${status.className}">
                    ${status.text}
                </span>
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn edit-btn"
                        onclick="editProduct(${index})">
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteProduct(${index})">
                        Delete
                    </button>

                </div>

            </td>
        `;


        table.appendChild(row);

    });

}


/* ================= PRODUCTS TABLE ================= */

function displayProducts(
    productList = products
) {

    const table =
        document.getElementById(
            "products-table"
        );


    table.innerHTML = "";


    if (productList.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7"
                    class="empty-row">
                    No products found.
                </td>
            </tr>
        `;

        return;

    }


    productList.forEach(product => {

        const index =
            products.indexOf(product);


        const status =
            getStatus(
                product.quantity
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${product.name}
                </strong>
            </td>

            <td>
                ${product.category}
            </td>

            <td>
                ${product.quantity}
            </td>

            <td>
                ₹${Number(product.price)
                    .toLocaleString("en-IN")}
            </td>

            <td>
                ${product.supplier}
            </td>

            <td>

                <span class="status
                    ${status.className}">
                    ${status.text}
                </span>

            </td>

            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn edit-btn"
                        onclick="editProduct(${index})">
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteProduct(${index})">
                        Delete
                    </button>

                </div>

            </td>
        `;


        table.appendChild(row);

    });

}


/* ================= ADD PRODUCT ================= */

document
    .getElementById("product-form")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "product-name"
                ).value.trim();


            const category =
                document.getElementById(
                    "product-category"
                ).value;


            const quantity =
                Number(
                    document.getElementById(
                        "product-quantity"
                    ).value
                );


            const price =
                Number(
                    document.getElementById(
                        "product-price"
                    ).value
                );


            const supplier =
                document.getElementById(
                    "product-supplier"
                ).value.trim();


            const id =
                document.getElementById(
                    "product-id"
                ).value.trim();


            const duplicate =
                products.some(
                    product =>
                        product.id.toLowerCase() ===
                        id.toLowerCase()
                );


            if (duplicate) {

                alert(
                    "This Product ID already exists."
                );

                return;

            }


            products.push({

                id,
                name,
                category,
                quantity,
                price,
                supplier

            });


            saveProducts();


            updateEverything();


            alert(
                `${name} added successfully!`
            );


            this.reset();


            showSection("products");

        }
    );


/* ================= DELETE PRODUCT ================= */

function deleteProduct(index) {

    const product =
        products[index];


    if (
        !confirm(
            `Delete "${product.name}"?`
        )
    ) {

        return;

    }


    products.splice(index, 1);


    saveProducts();


    updateEverything();


    alert(
        "Product deleted successfully."
    );

}


/* ================= EDIT PRODUCT ================= */

function editProduct(index) {

    const product =
        products[index];


    document.getElementById(
        "edit-index"
    ).value = index;


    document.getElementById(
        "edit-name"
    ).value = product.name;


    document.getElementById(
        "edit-category"
    ).value = product.category;


    document.getElementById(
        "edit-quantity"
    ).value = product.quantity;


    document.getElementById(
        "edit-price"
    ).value = product.price;


    document.getElementById(
        "edit-supplier"
    ).value = product.supplier;


    document.getElementById(
        "edit-modal"
    ).classList.add("show");

}


/* ================= CLOSE MODAL ================= */

document
    .getElementById("close-modal")
    .addEventListener(
        "click",
        function() {

            document.getElementById(
                "edit-modal"
            ).classList.remove("show");

        }
    );


/* ================= SAVE EDIT ================= */

document
    .getElementById("edit-form")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const index =
                Number(
                    document.getElementById(
                        "edit-index"
                    ).value
                );


            products[index].name =
                document.getElementById(
                    "edit-name"
                ).value.trim();


            products[index].category =
                document.getElementById(
                    "edit-category"
                ).value;


            products[index].quantity =
                Number(
                    document.getElementById(
                        "edit-quantity"
                    ).value
                );


            products[index].price =
                Number(
                    document.getElementById(
                        "edit-price"
                    ).value
                );


            products[index].supplier =
                document.getElementById(
                    "edit-supplier"
                ).value.trim();


            saveProducts();


            updateEverything();


            document.getElementById(
                "edit-modal"
            ).classList.remove("show");


            alert(
                "Product updated successfully."
            );

        }
    );


/* ================= STOCK MANAGEMENT ================= */

function displayStockManagement() {

    const table =
        document.getElementById(
            "stock-table"
        );


    table.innerHTML = "";


    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="empty-row">
                    No products available.
                </td>
            </tr>
        `;

        return;

    }


    products.forEach(
        (product, index) => {

            const status =
                getStatus(
                    product.quantity
                );


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        ${product.name}
                    </strong>
                </td>

                <td>
                    ${product.category}
                </td>

                <td>
                    ${product.quantity}
                </td>

                <td>

                    <span class="status
                        ${status.className}">
                        ${status.text}
                    </span>

                </td>

                <td>

                    <div class="stock-controls">

                        <button
                            class="stock-btn stock-minus"
                            onclick="changeStock(${index}, -1)">
                            −
                        </button>

                        <span class="stock-number">
                            ${product.quantity}
                        </span>

                        <button
                            class="stock-btn stock-plus"
                            onclick="changeStock(${index}, 1)">
                            +
                        </button>

                    </div>

                </td>
            `;


            table.appendChild(row);

        }
    );

}


/* ================= CHANGE STOCK ================= */

function changeStock(index, amount) {

    const newQuantity =
        Number(
            products[index].quantity
        ) + amount;


    if (newQuantity < 0) {

        alert(
            "Stock cannot be below 0."
        );

        return;

    }


    products[index].quantity =
        newQuantity;


    saveProducts();


    updateEverything();

}


/* =====================================================
   SALES
===================================================== */


/* ================= SALE PRODUCT DROPDOWN ================= */

function updateSaleProducts() {

    const dropdown =
        document.getElementById(
            "sale-product"
        );


    const oldValue =
        dropdown.value;


    dropdown.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;


    products.forEach(
        (product, index) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value = index;


            option.textContent =
                `${product.name}
                (Stock: ${product.quantity})`;


            dropdown.appendChild(option);

        }
    );


    if (
        products[oldValue]
    ) {

        dropdown.value =
            oldValue;

    }

}


/* ================= SELECT SALE PRODUCT ================= */

document
    .getElementById("sale-product")
    .addEventListener(
        "change",
        updateSalePreview
    );


/* ================= SALE QUANTITY ================= */

document
    .getElementById("sale-quantity")
    .addEventListener(
        "input",
        updateSalePreview
    );


/* ================= SALE PREVIEW ================= */

function updateSalePreview() {

    const productIndex =
        document.getElementById(
            "sale-product"
        ).value;


    const quantity =
        Number(
            document.getElementById(
                "sale-quantity"
            ).value
        ) || 0;


    if (
        productIndex === ""
    ) {

        document.getElementById(
            "sale-unit-price"
        ).textContent = "₹0";


        document.getElementById(
            "sale-preview-quantity"
        ).textContent = "0";


        document.getElementById(
            "sale-total"
        ).textContent = "₹0";


        document.getElementById(
            "available-stock"
        ).textContent =
            "Available stock: 0";


        return;

    }


    const product =
        products[
            Number(productIndex)
        ];


    const price =
        Number(product.price);


    const total =
        price * quantity;


    document.getElementById(
        "sale-unit-price"
    ).textContent =
        `₹${price.toLocaleString("en-IN")}`;


    document.getElementById(
        "sale-preview-quantity"
    ).textContent =
        quantity;


    document.getElementById(
        "sale-total"
    ).textContent =
        `₹${total.toLocaleString("en-IN")}`;


    document.getElementById(
        "available-stock"
    ).textContent =
        `Available stock: ${product.quantity}`;

}


/* ================= RECORD SALE ================= */

document
    .getElementById("sale-form")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const customer =
                document.getElementById(
                    "customer-name"
                ).value.trim();


            const productIndex =
                Number(
                    document.getElementById(
                        "sale-product"
                    ).value
                );


            const quantity =
                Number(
                    document.getElementById(
                        "sale-quantity"
                    ).value
                );


            const date =
                document.getElementById(
                    "sale-date"
                ).value;


            const product =
                products[productIndex];


            if (!product) {

                alert(
                    "Please select a product."
                );

                return;

            }


            if (quantity <= 0) {

                alert(
                    "Quantity must be at least 1."
                );

                return;

            }


            /* IMPORTANT:
               Prevent selling more
               than available stock.
            */

            if (
                quantity >
                Number(product.quantity)
            ) {

                alert(
                    `Not enough stock!

Available:
${product.quantity}

Requested:
${quantity}`
                );

                return;

            }


            const total =
                quantity *
                Number(product.price);


            /* REDUCE STOCK */

            product.quantity =
                Number(product.quantity) -
                quantity;


            /* CREATE SALE */

            const sale = {

                id:
                    Date.now(),

                customer:
                    customer,

                productId:
                    product.id,

                productName:
                    product.name,

                quantity:
                    quantity,

                unitPrice:
                    Number(product.price),

                total:
                    total,

                date:
                    date

            };


            sales.unshift(sale);


            saveProducts();

            saveSales();


            updateEverything();


            alert(
                `Sale recorded successfully!

Customer:
${customer}

Product:
${product.name}

Quantity:
${quantity}

Total:
₹${total.toLocaleString("en-IN")}`
            );


            this.reset();


            setTodayDate();


            updateSalePreview();

        }
    );


/* ================= SALES TABLE ================= */

function displaySales() {

    const table =
        document.getElementById(
            "sales-table"
        );


    table.innerHTML = "";


    if (sales.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6"
                    class="empty-row">
                    No sales recorded yet.
                </td>
            </tr>
        `;

        return;

    }


    sales.forEach(
        (sale, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${sale.date}
                </td>

                <td>
                    <strong>
                        ${sale.customer}
                    </strong>
                </td>

                <td>
                    ${sale.productName}
                </td>

                <td>
                    ${sale.quantity}
                </td>

                <td>
                    ₹${Number(sale.total)
                        .toLocaleString("en-IN")}
                </td>

                <td>

                    <button
                        class="action-btn delete-btn"
                        onclick="deleteSale(${index})">
                        Delete
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


/* ================= DELETE SALE ================= */

function deleteSale(index) {

    const sale =
        sales[index];


    if (
        !confirm(
            `Delete this sale for ${sale.customer}?

The sold quantity will be returned to stock.`
        )
    ) {

        return;

    }


    /* FIND PRODUCT */

    const product =
        products.find(
            product =>
                product.id ===
                sale.productId
        );


    /* RESTORE STOCK */

    if (product) {

        product.quantity =
            Number(product.quantity) +
            Number(sale.quantity);

    }


    /* REMOVE SALE */

    sales.splice(index, 1);


    saveProducts();

    saveSales();


    updateEverything();


    alert(
        "Sale deleted and stock restored."
    );

}


/* =====================================================
   REPORTS
===================================================== */

function updateReports() {

    let inventoryValue = 0;

    let totalUnits = 0;

    let revenue = 0;


    products.forEach(product => {

        const quantity =
            Number(product.quantity);


        const price =
            Number(product.price);


        totalUnits += quantity;


        inventoryValue +=
            quantity * price;

    });


    sales.forEach(sale => {

        revenue +=
            Number(sale.total);

    });


    document.getElementById(
        "inventory-value"
    ).textContent =
        `₹${inventoryValue.toLocaleString("en-IN")}`;


    document.getElementById(
        "total-units"
    ).textContent =
        totalUnits;


    document.getElementById(
        "report-sales-count"
    ).textContent =
        sales.length;


    document.getElementById(
        "report-revenue"
    ).textContent =
        `₹${revenue.toLocaleString("en-IN")}`;


    const report =
        document.getElementById(
            "report-summary"
        );


    report.innerHTML = "";


    if (products.length === 0) {

        report.innerHTML = `
            <div class="empty-row">
                No inventory data available.
            </div>
        `;

        return;

    }


    products.forEach(product => {

        const status =
            getStatus(
                product.quantity
            );


        const value =
            Number(product.quantity) *
            Number(product.price);


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "report-summary-item";


        div.innerHTML = `

            <strong>
                ${product.name}
            </strong>

            &nbsp; | &nbsp;

            Category:
            ${product.category}

            &nbsp; | &nbsp;

            Stock:
            ${product.quantity}

            &nbsp; | &nbsp;

            Value:
            ₹${value.toLocaleString("en-IN")}

            &nbsp; | &nbsp;

            <span class="status
                ${status.className}">
                ${status.text}
            </span>
        `;


        report.appendChild(div);

    });

}


/* =====================================================
   NAVIGATION
===================================================== */

const navButtons =
    document.querySelectorAll(
        ".nav-btn"
    );


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            showSection(
                this.dataset.section
            );

        }
    );

});


function showSection(sectionName) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    const section =
        document.getElementById(
            sectionName
        );


    if (section) {

        section.classList.add(
            "active-section"
        );

    }


    navButtons.forEach(button => {

        button.classList.remove(
            "active"
        );


        if (
            button.dataset.section ===
            sectionName
        ) {

            button.classList.add(
                "active"
            );

        }

    });


    updatePageTitle(
        sectionName
    );

}


/* ================= PAGE TITLES ================= */

function updatePageTitle(section) {

    const titles = {

        dashboard: [
            "Dashboard",
            "Welcome to your inventory management system."
        ],

        products: [
            "Products",
            "View and manage all your products."
        ],

        "add-product": [
            "Add Product",
            "Add a new product to your inventory."
        ],

        stock: [
            "Stock Management",
            "Increase or decrease your product stock."
        ],

        sales: [
            "Sales / Purchases",
            "Record customer purchases and automatically update stock."
        ],

        reports: [
            "Reports",
            "View your inventory and sales reports."
        ],

        settings: [
            "Settings",
            "Manage your inventory system settings."
        ]

    };


    if (titles[section]) {

        document.getElementById(
            "page-title"
        ).textContent =
            titles[section][0];


        document.getElementById(
            "page-subtitle"
        ).textContent =
            titles[section][1];

    }

}


/* ================= ADD BUTTONS ================= */

document
    .getElementById(
        "dashboard-add-btn"
    )
    .addEventListener(
        "click",
        function() {

            showSection(
                "add-product"
            );

        }
    );


document
    .getElementById(
        "products-add-btn"
    )
    .addEventListener(
        "click",
        function() {

            showSection(
                "add-product"
            );

        }
    );


/* ================= SEARCH ================= */

document
    .getElementById(
        "dashboard-search"
    )
    .addEventListener(
        "input",
        function() {

            const category =
                document.getElementById(
                    "dashboard-category"
                ).value;


            displayDashboardProducts(
                filterProducts(
                    this.value,
                    category
                )
            );

        }
    );


document
    .getElementById(
        "dashboard-category"
    )
    .addEventListener(
        "change",
        function() {

            const search =
                document.getElementById(
                    "dashboard-search"
                ).value;


            displayDashboardProducts(
                filterProducts(
                    search,
                    this.value
                )
            );

        }
    );


document
    .getElementById(
        "products-search"
    )
    .addEventListener(
        "input",
        function() {

            const category =
                document.getElementById(
                    "products-category"
                ).value;


            displayProducts(
                filterProducts(
                    this.value,
                    category
                )
            );

        }
    );


document
    .getElementById(
        "products-category"
    )
    .addEventListener(
        "change",
        function() {

            const search =
                document.getElementById(
                    "products-search"
                ).value;


            displayProducts(
                filterProducts(
                    search,
                    this.value
                )
            );

        }
    );


/* ================= SETTINGS ================= */

document
    .getElementById(
        "low-stock-limit"
    )
    .addEventListener(
        "change",
        function() {

            let value =
                Number(this.value);


            if (value < 1) {

                value = 1;

                this.value = 1;

            }


            lowStockLimit =
                value;


            saveSettings();


            updateEverything();

        }
    );


/* ================= CLEAR INVENTORY ================= */

document
    .getElementById(
        "clear-all"
    )
    .addEventListener(
        "click",
        function() {

            if (products.length === 0) {

                alert(
                    "There are no products."
                );

                return;

            }


            if (
                !confirm(
                    "Delete ALL products?"
                )
            ) {

                return;

            }


            products = [];


            saveProducts();


            updateEverything();


            alert(
                "Inventory cleared."
            );

        }
    );


/* ================= PRINT ================= */

document
    .getElementById(
        "print-report"
    )
    .addEventListener(
        "click",
        function() {

            window.print();

        }
    );


/* ================= TODAY DATE ================= */

function setTodayDate() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    document.getElementById(
        "sale-date"
    ).value = today;

}


/* =====================================================
   UPDATE EVERYTHING
===================================================== */

function updateEverything() {

    updateDashboard();

    updateCategoryDropdowns();

    displayDashboardProducts();

    displayProducts();

    displayStockManagement();

    updateSaleProducts();

    displaySales();

    updateReports();

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        document.getElementById(
            "low-stock-limit"
        ).value =
            lowStockLimit;


        setTodayDate();


        updateEverything();

    }
);
