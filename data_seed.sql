
-- ==========================================
-- SCRIPT CHÈN DỮ LIỆU MẪU (MOCK DATA)
-- Cửa hàng Vợt Cầu Lông (VNB Sports Clone)
-- Tích hợp hình ảnh thực tế sưu tập được
-- ==========================================

-- 1. Chèn dữ liệu vào bảng Categories (Danh mục)
INSERT INTO Categories (Name, SEO_Description) VALUES 
(N'Vợt Cầu Lông', N'Các loại vợt cầu lông chính hãng từ Yonex, Lining, Victor...'),
(N'Vợt Cầu Lông Cho Thuê', N'Dịch vụ cho thuê vợt cầu lông cao cấp, giá rẻ theo ngày.'),
(N'Giày Cầu Lông', N'Giày cầu lông êm ái, bám sân tốt, chống lật cổ chân.'),
(N'Balo & Bao Vợt', N'Balo cầu lông, bao vợt đựng được nhiều đồ, tiện lợi.'),
(N'Phụ Kiện', N'Quấn cán, cước đan vợt, vớ cầu lông, bó gối...');

-- 2. Chèn dữ liệu vào bảng Products (Sản phẩm)
INSERT INTO Products (Name, BrandName, CategoryID, Description, SellPrice, RentalPricePerDay, Condition, StockQuantity, ThumbnailImage, Status) VALUES 
-- Vợt Mới (Để Bán)
(N'Vợt Cầu Lông Yonex Astrox 100ZZ', N'Yonex', 1, N'Siêu phẩm vợt tấn công mạnh mẽ nhất của Yonex, trục đặc mỏng nhất thế giới.', 4500000.00, NULL, 'New', 15, 'Yonex Astrox 100ZZ.jpg', 'Active'),
(N'Vợt Cầu Lông Yonex Astrox 88 Play', N'Yonex', 1, N'Vợt công thủ toàn diện, kết hợp sức mạnh của 88D và 88S.', 3200000.00, NULL, 'New', 20, 'Yonex astrox 88 play  combined power of 88d and 88s_why hitting on girls if u can hit on shuttles.jpg', 'Active'),
(N'Vợt Cầu Lông Yonex Nanoray 70 DX', N'Yonex', 1, N'Dòng vợt nhẹ, phản tạt nhanh, phù hợp lối đánh tốc độ.', 2800000.00, NULL, 'New', 10, 'Yonex Nanoray 70 DX Badminton Racket Review - Badminton Passion.jpg', 'Active'),
(N'Vợt Cầu Lông Yonex ZR 100 Light Aluminium', N'Yonex', 1, N'Vợt nhẹ bằng nhôm, phù hợp người mới chơi, sản xuất tại Ấn Độ.', 590000.00, NULL, 'New', 50, 'Yonex ZR 100 Light Aluminium Badminton Racquet with Full Cover _ Made in India (Black,Pack of 1).jpg', 'Active'),
(N'Vợt Cầu Lông Victor Adult', N'Victor', 1, N'Vợt cầu lông dành cho người lớn, thiết kế màu trắng trẻ trung.', 1500000.00, NULL, 'New', 12, 'Adult Badminton Rackets.jpg', 'Active'),
(N'Vợt Cầu Lông Adidas Spieler W09.1 Blue', N'Adidas', 1, N'Thiết kế màu hồng đen cá tính, khung vợt bền bỉ.', 2100000.00, NULL, 'New', 8, 'adidas Spieler W09_1 badminton racket Blue _ Smashinn.jpg', 'Active'),
(N'Vợt Cầu Lông ECO Foaming Grip Handle Qingshan', N'Qingshan', 1, N'Thân thiện môi trường, tay cầm êm ái, chịu mức đan 28lbs.', 850000.00, NULL, 'New', 15, 'ECO Foaming Grip Handle----Qingshan  4U 28lbs_#badminton#badminton#Env_ Prot#.jpg', 'Active'),

-- Vợt Cũ (Để Cho Thuê)
(N'Vợt Thuê: Yonex Arc Gama', N'Yonex', 2, N'Dụng cụ chơi cầu lông chất lượng cao, màu đỏ nổi bật. Tình trạng 90%.', 2500000.00, 100000.00, 'Used', 3, 'Vợt cầu lông Yonex Arc Gama dụng cụ chơi cầu lông chất lượng cao.jpg', 'Active'),
(N'Vợt Thuê: Lightweight Professional Badminton Racket', N'Yonex', 2, N'Vợt chuyên nghiệp siêu nhẹ màu xanh. Tình trạng 95%.', 3500000.00, 120000.00, 'Used', 2, 'Lightweight Professional Badminton Racket.jpg', 'Active'),
(N'Vợt Thuê: Yonex Arcsaber Pink', N'Yonex', 2, N'Vợt màu hồng nữ tính, dễ đánh. Tình trạng 85%, trầy nhẹ.', 2200000.00, 80000.00, 'Used', 5, 'download.jpg', 'Active');

-- 3. Nhóm Roles
INSERT INTO Roles (Name) VALUES 
('Admin'),
('Staff'),
('Customer');
