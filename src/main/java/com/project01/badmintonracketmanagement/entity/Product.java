package com.project01.badmintonracketmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "Products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "Name", nullable = false, length = 200)
    private String name;

    @Column(name = "BrandName", length = 100)
    private String brandName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category;

    @Column(name = "Description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "SellPrice", precision = 18, scale = 2)
    private BigDecimal sellPrice;

    @Column(name = "RentalPricePerDay", precision = 18, scale = 2)
    private BigDecimal rentalPricePerDay;

    @Builder.Default
    @Column(name = "Condition", length = 20)
    private String condition = "New";

    @Builder.Default
    @Column(name = "StockQuantity")
    private Integer stockQuantity = 0;

    @Column(name = "ThumbnailImage", length = 500)
    private String thumbnailImage;

    @Builder.Default
    @Column(name = "Status", length = 20)
    private String status = "Active";
}
