package com.project01.badmintonracketmanagement.service.product;

import com.project01.badmintonracketmanagement.dto.product.ProductRequest;
import com.project01.badmintonracketmanagement.dto.product.ProductResponse;
import com.project01.badmintonracketmanagement.dto.product.UpdateStockRequest;
import com.project01.badmintonracketmanagement.entity.Category;
import com.project01.badmintonracketmanagement.entity.Product;
import com.project01.badmintonracketmanagement.entity.ProductImage;
import com.project01.badmintonracketmanagement.exception.BadRequestException;
import com.project01.badmintonracketmanagement.exception.ResourceNotFoundException;
import com.project01.badmintonracketmanagement.repository.category.CategoryRepository;
import com.project01.badmintonracketmanagement.repository.product.ProductImageRepository;
import com.project01.badmintonracketmanagement.repository.product.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product with name: {}", request.getName());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        String thumbnail = request.getThumbnailImage();
        if (!StringUtils.hasText(thumbnail) && request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            thumbnail = request.getImageUrls().get(0);
        }

        String condition = StringUtils.hasText(request.getCondition()) ? request.getCondition().trim() : "New";
        if (!condition.equalsIgnoreCase("New") && !condition.equalsIgnoreCase("Used")) {
            throw new BadRequestException("Product condition must be either 'New' or 'Used'");
        }

        Product product = Product.builder()
                .name(request.getName().trim())
                .brandName(request.getBrandName() != null ? request.getBrandName().trim() : null)
                .category(category)
                .description(request.getDescription())
                .sellPrice(request.getSellPrice())
                .rentalPricePerDay(request.getRentalPricePerDay())
                .condition(condition)
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .thumbnailImage(thumbnail)
                .status(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "Active")
                .build();

        Product savedProduct = productRepository.save(product);
        log.info("Product saved with ID: {}", savedProduct.getId());

        List<String> savedImageUrls = new ArrayList<>();
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ProductImage> productImages = request.getImageUrls().stream()
                    .filter(StringUtils::hasText)
                    .map(url -> ProductImage.builder()
                            .product(savedProduct)
                            .imageUrl(url.trim())
                            .build())
                    .collect(Collectors.toList());

            productImageRepository.saveAll(productImages);
            savedImageUrls = productImages.stream().map(ProductImage::getImageUrl).collect(Collectors.toList());
            log.info("Saved {} images for product ID: {}", savedImageUrls.size(), savedProduct.getId());
        }

        return ProductResponse.fromEntity(savedProduct, savedImageUrls);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        Page<Product> productPage = productRepository.findAll(pageable);

        return productPage.map(product -> {
            List<String> imageUrls = productImageRepository.findByProductId(product.getId()).stream()
                    .map(ProductImage::getImageUrl)
                    .collect(Collectors.toList());
            return ProductResponse.fromEntity(product, imageUrls);
        });
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getPublicProducts(
            String keyword,
            Integer categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable) {

        boolean hasFilter = StringUtils.hasText(keyword) || categoryId != null || minPrice != null || maxPrice != null;
        Page<Product> productPage;

        if (!hasFilter) {
            productPage = productRepository.findAll(pageable);
        } else {
            Specification<Product> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (StringUtils.hasText(keyword)) {
                    String pattern = "%" + keyword.trim().toLowerCase() + "%";
                    Predicate namePredicate = cb.like(cb.lower(root.get("name")), pattern);
                    Predicate brandPredicate = cb.like(cb.lower(root.get("brandName")), pattern);
                    predicates.add(cb.or(namePredicate, brandPredicate));
                }

                if (categoryId != null) {
                    predicates.add(cb.equal(root.get("category").get("id"), categoryId));
                }

                if (minPrice != null && maxPrice != null) {
                    Predicate sellPriceCondition = cb.and(
                            cb.isNotNull(root.get("sellPrice")),
                            cb.between(root.get("sellPrice"), minPrice, maxPrice)
                    );
                    Predicate rentalPriceCondition = cb.and(
                            cb.isNotNull(root.get("rentalPricePerDay")),
                            cb.between(root.get("rentalPricePerDay"), minPrice, maxPrice)
                    );
                    predicates.add(cb.or(sellPriceCondition, rentalPriceCondition));
                } else if (minPrice != null) {
                    Predicate sellPriceCondition = cb.and(
                            cb.isNotNull(root.get("sellPrice")),
                            cb.greaterThanOrEqualTo(root.get("sellPrice"), minPrice)
                    );
                    Predicate rentalPriceCondition = cb.and(
                            cb.isNotNull(root.get("rentalPricePerDay")),
                            cb.greaterThanOrEqualTo(root.get("rentalPricePerDay"), minPrice)
                    );
                    predicates.add(cb.or(sellPriceCondition, rentalPriceCondition));
                } else if (maxPrice != null) {
                    Predicate sellPriceCondition = cb.and(
                            cb.isNotNull(root.get("sellPrice")),
                            cb.lessThanOrEqualTo(root.get("sellPrice"), maxPrice)
                    );
                    Predicate rentalPriceCondition = cb.and(
                            cb.isNotNull(root.get("rentalPricePerDay")),
                            cb.lessThanOrEqualTo(root.get("rentalPricePerDay"), maxPrice)
                    );
                    predicates.add(cb.or(sellPriceCondition, rentalPriceCondition));
                }

                if (predicates.isEmpty()) {
                    return cb.conjunction();
                }
                return cb.and(predicates.toArray(new Predicate[0]));
            };

            productPage = productRepository.findAll(spec, pageable);
        }

        return productPage.map(product -> {
            List<String> imageUrls = productImageRepository.findByProductId(product.getId()).stream()
                    .map(ProductImage::getImageUrl)
                    .collect(Collectors.toList());
            return ProductResponse.fromEntity(product, imageUrls);
        });
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        List<String> imageUrls = productImageRepository.findByProductId(product.getId()).stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

        return ProductResponse.fromEntity(product, imageUrls);
    }

    @Transactional
    public ProductResponse updateStockQuantity(Integer id, UpdateStockRequest request) {
        log.info("Updating stock quantity for product ID: {} to {}", id, request.getStockQuantity());

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setStockQuantity(request.getStockQuantity());
        Product updatedProduct = productRepository.save(product);

        List<String> imageUrls = productImageRepository.findByProductId(id).stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

        log.info("Stock quantity updated successfully for product ID: {}", id);
        return ProductResponse.fromEntity(updatedProduct, imageUrls);
    }

    @Transactional
    public ProductResponse updateCondition(Integer id, String condition) {
        log.info("Updating condition for product ID: {} to {}", id, condition);

        if (!StringUtils.hasText(condition) || 
            (!condition.equalsIgnoreCase("New") && !condition.equalsIgnoreCase("Used"))) {
            throw new BadRequestException("Product condition must be either 'New' or 'Used'");
        }

        String normalizedCondition = condition.equalsIgnoreCase("New") ? "New" : "Used";

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setCondition(normalizedCondition);
        Product updatedProduct = productRepository.save(product);

        List<String> imageUrls = productImageRepository.findByProductId(id).stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

        log.info("Condition updated successfully for product ID: {}", id);
        return ProductResponse.fromEntity(updatedProduct, imageUrls);
    }
}
