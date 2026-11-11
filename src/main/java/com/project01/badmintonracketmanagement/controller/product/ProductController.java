package com.project01.badmintonracketmanagement.controller.product;

import com.project01.badmintonracketmanagement.dto.ApiResponse;
import com.project01.badmintonracketmanagement.dto.product.ProductRequest;
import com.project01.badmintonracketmanagement.dto.product.ProductResponse;
import com.project01.badmintonracketmanagement.dto.product.UpdateConditionRequest;
import com.project01.badmintonracketmanagement.dto.product.UpdateStockRequest;
import com.project01.badmintonracketmanagement.service.product.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ProductResponse> response = productService.getAllProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Integer id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product details retrieved successfully", response));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<ProductResponse>> updateStockQuantity(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStockRequest request) {
        ProductResponse response = productService.updateStockQuantity(id, request);
        return ResponseEntity.ok(ApiResponse.success("Stock quantity updated successfully", response));
    }

    @PatchMapping("/{id}/condition")
    public ResponseEntity<ApiResponse<ProductResponse>> updateCondition(
            @PathVariable Integer id,
            @RequestBody(required = false) UpdateConditionRequest request,
            @RequestParam(value = "condition", required = false) String conditionParam) {
        String condition = request != null && request.getCondition() != null ? request.getCondition() : conditionParam;
        ProductResponse response = productService.updateCondition(id, condition);
        return ResponseEntity.ok(ApiResponse.success("Product condition updated successfully", response));
    }
}
