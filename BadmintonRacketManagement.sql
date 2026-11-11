-- 1. Nhóm Người dùng
CREATE TABLE Roles (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);

CREATE TABLE Users (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PhoneNumber VARCHAR(20),
    Address NVARCHAR(500),
    RoleID INT NOT NULL,
    FOREIGN KEY (RoleID) REFERENCES Roles(ID)
);

-- 2. Nhóm Sản phẩm (Đã gộp Brand và Variant)
CREATE TABLE Categories (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    SEO_Description NVARCHAR(500)
);

CREATE TABLE Products (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    BrandName NVARCHAR(100), -- Thay thế cho bảng Brands
    CategoryID INT NOT NULL,
    Description NVARCHAR(MAX),
    SellPrice DECIMAL(18,2),
    RentalPricePerDay DECIMAL(18,2),
    Condition VARCHAR(20) DEFAULT 'New', -- 'New' để bán, 'Used' để thuê
    StockQuantity INT DEFAULT 0, -- Quản lý tồn kho trực tiếp tại đây
    ThumbnailImage VARCHAR(500),
    Status VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (CategoryID) REFERENCES Categories(ID)
);

CREATE TABLE Product_Images (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageURL VARCHAR(500) NOT NULL,
    FOREIGN KEY (ProductID) REFERENCES Products(ID) ON DELETE CASCADE
);

-- 3. Nhóm Mua Bán
CREATE TABLE Orders (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    FinalAmount DECIMAL(18,2) NOT NULL,
    OrderStatus VARCHAR(50) DEFAULT 'Pending', 
    PaymentMethod VARCHAR(50), 
    ShippingAddress NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

CREATE TABLE Order_Details (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(ID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ID)
);

-- 4. Nhóm Cho Thuê
CREATE TABLE Rental_Contracts (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ExpectedReturnDate DATETIME NOT NULL,
    ActualReturnDate DATETIME NULL,
    DepositType VARCHAR(50) NOT NULL, 
    RentalFeeTotal DECIMAL(18,2) NOT NULL,
    Surcharge DECIMAL(18,2) DEFAULT 0, -- Gộp LateFee và DamageFee
    Note NVARCHAR(500), -- Ghi chú chung tình trạng lúc giao/nhận
    Status VARCHAR(50) DEFAULT 'Renting', -- Renting, Returned
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

CREATE TABLE Rental_Details (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    RentalContractID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    PricePerDay DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (RentalContractID) REFERENCES Rental_Contracts(ID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ID)
);

-- 5. Nhóm Tracking & Đánh giá (SEO)
CREATE TABLE Search_Logs (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Keyword NVARCHAR(200) NOT NULL,
    SearchTime DATETIME DEFAULT GETDATE()
);

CREATE TABLE Reviews (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (ProductID) REFERENCES Products(ID) ON DELETE CASCADE
);