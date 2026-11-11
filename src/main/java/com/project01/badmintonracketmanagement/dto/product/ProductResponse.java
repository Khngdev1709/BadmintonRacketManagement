package com.project01.badmintonracketmanagement.dto.product;

import com.project01.badmintonracketmanagement.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Integer id;
    private String name;
    private String brandName;
    private Integer categoryId;
    private String categoryName;
    private String description;
    private BigDecimal sellPrice;
    private BigDecimal rentalPricePerDay;
    private String condition;
    private Integer stockQuantity;
    private String thumbnailImage;
    private String status;
    private List<String> imageUrls;

    public static ProductResponse fromEntity(Product product, List<String> imageUrls) {
        if (product == null) {
            return null;
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brandName(product.getBrandName())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .description(product.getDescription())
                .sellPrice(product.getSellPrice())
                .rentalPricePerDay(product.getRentalPricePerDay())
                .condition(product.getCondition())
                .stockQuantity(product.getStockQuantity())
                .thumbnailImage(product.getThumbnailImage())
                .status(product.getStatus())
                .imageUrls(imageUrls)
                .build();
    }
}
