package com.project01.badmintonracketmanagement.controller.product;

import com.project01.badmintonracketmanagement.dto.ApiResponse;
import com.project01.badmintonracketmanagement.dto.product.ProductResponse;
import com.project01.badmintonracketmanagement.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor
public class PublicProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getPublicProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String sortBy) {

        Pageable pageable = createPageable(page, size, sortBy);
        Page<ProductResponse> response = productService.getPublicProducts(
                keyword, categoryId, minPrice, maxPrice, pageable
        );

        return ResponseEntity.ok(ApiResponse.success("Public products retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Integer id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product details retrieved successfully", response));
    }

    private Pageable createPageable(int page, int size, String sortBy) {
        Sort sort = Sort.by(Sort.Direction.DESC, "id");
        if (StringUtils.hasText(sortBy)) {
            String[] parts = sortBy.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            sort = Sort.by(direction, property);
        }
        return PageRequest.of(page, size, sort);
    }
}
