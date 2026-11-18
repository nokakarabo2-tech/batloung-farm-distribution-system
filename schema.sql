CREATE DATABASE IF NOT EXISTS batloung_farm_db;
USE batloung_farm_db;

-- 1. Suppliers Table
CREATE TABLE Suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(100) NOT NULL UNIQUE,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province ENUM('Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape') NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- 2. Fruits Table
CREATE TABLE Fruits (
    fruit_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' NOT NULL
);

-- 3. Vendors Table
CREATE TABLE Vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(100) NOT NULL,
    registration_date DATE NOT NULL DEFAULT (CURRENT_DATE)
);

-- 4. Purchases Table
CREATE TABLE Purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id) ON DELETE RESTRICT
);

-- 5. Purchase Details Table
CREATE TABLE Purchase_Details (
    purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    fruit_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10, 2) NOT NULL CHECK (unit_cost >= 0),
    packaging_size ENUM('small', 'medium', 'large') NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES Purchases(purchase_id) ON DELETE CASCADE,
    FOREIGN KEY (fruit_id) REFERENCES Fruits(fruit_id) ON DELETE RESTRICT
);

-- 6. Sales Table (Includes payment tracking for Part D)
CREATE TABLE Sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('Cash', 'Mobile Money', 'Credit') NOT NULL DEFAULT 'Cash',
    payment_status ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE RESTRICT
);

-- 7. Sales Details Table
CREATE TABLE Sales_Details (
    sales_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    fruit_id INT NOT NULL,
    packaging_size ENUM('small', 'medium', 'large') NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    FOREIGN KEY (sale_id) REFERENCES Sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (fruit_id) REFERENCES Fruits(fruit_id) ON DELETE RESTRICT
);

-- 8. Stock Table (Tracks small, medium, large separately per fruit)
CREATE TABLE Stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    packaging_size ENUM('small', 'medium', 'large') NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    UNIQUE KEY unique_fruit_size (fruit_id, packaging_size),
    FOREIGN KEY (fruit_id) REFERENCES Fruits(fruit_id) ON DELETE CASCADE
);

-- Sample Data Insertion
INSERT INTO Suppliers (business_name, contact_person, phone, province, address) VALUES
('Free State Fresh Orchards', 'Thabo Mokoena', '+27514441122', 'Free State', 'Plot 12, Bethlehem Road, Ficksburg'),
('Limpopo Tropical Growers', 'Lerato Ndlovu', '+27152903344', 'Limpopo', 'Farm 88, Tzaneen Valley'),
('Cape Valley Exports', 'Pieter van Wyk', '+27218805566', 'Western Cape', '45 Orchard Lane, Stellenbosch');

INSERT INTO Fruits (fruit_name, description, status) VALUES
('Apples', 'Crisp red and green apples', 'ACTIVE'),
('Bananas', 'Ripe yellow Cavendish bananas', 'ACTIVE'),
('Oranges', 'Sweet Valencia oranges', 'ACTIVE'),
('Mangoes', 'Kent variety mangoes', 'ACTIVE'),
('Grapes', 'Seedless red globe grapes', 'ACTIVE');

INSERT INTO Vendors (vendor_name, phone_number, location, registration_date) VALUES
('Maseru Main Circle Stall', '+26658001122', 'Maseru CBD', '2026-01-15'),
('Kingsway Fresh Corner', '+26659112233', 'Kingsway, Maseru', '2026-02-10'),
('Pioneer Gate Traders', '+26662334455', 'Pioneer Road, Maseru', '2026-03-05');

-- Initialize Stock for each fruit and packaging size
INSERT INTO Stock (fruit_id, packaging_size, available_quantity) VALUES
(1, 'small', 20), (1, 'medium', 15), (1, 'large', 6),
(2, 'small', 30), (2, 'medium', 25), (2, 'large', 10),
(3, 'small', 18), (3, 'medium', 12), (3, 'large', 8),
(4, 'small', 15), (4, 'medium', 10), (4, 'large', 5),
(5, 'small', 22), (5, 'medium', 14), (5, 'large', 7);
