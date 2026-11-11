package com.project01.badmintonracketmanagement.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    @Size(max = 100, message = "Brand name must not exceed 100 characters")
    private String brandName;

    @NotNull(message = "Category ID is required")
    private Integer categoryId;

    private String description;

    @DecimalMin(value = "0.0", inclusive = true, message = "Sell price must be greater than or equal to 0")
    private BigDecimal sellPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Rental price per day must be greater than or equal to 0")
    private BigDecimal rentalPricePerDay;

    @Builder.Default
    private String condition = "New";

    @Builder.Default
    @Min(value = 0, message = "Stock quantity must be greater than or equal to 0")
    private Integer stockQuantity = 0;

    private String thumbnailImage;

    @Builder.Default
    private String status = "Active";

    private List<String> imageUrls;
}
