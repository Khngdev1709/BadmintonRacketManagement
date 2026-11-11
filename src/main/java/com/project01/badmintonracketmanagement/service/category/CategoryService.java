package com.project01.badmintonracketmanagement.service.category;

import com.project01.badmintonracketmanagement.dto.category.CategoryRequest;
import com.project01.badmintonracketmanagement.dto.category.CategoryResponse;
import com.project01.badmintonracketmanagement.entity.Category;
import com.project01.badmintonracketmanagement.exception.BadRequestException;
import com.project01.badmintonracketmanagement.exception.ResourceNotFoundException;
import com.project01.badmintonracketmanagement.repository.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating new category with name: {}", request.getName());

        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .seoDescription(request.getSeoDescription() != null ? request.getSeoDescription().trim() : null)
                .build();

        Category savedCategory = categoryRepository.save(category);
        log.info("Category created successfully with ID: {}", savedCategory.getId());

        return CategoryResponse.fromEntity(savedCategory);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        return CategoryResponse.fromEntity(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, CategoryRequest request) {
        log.info("Updating category with ID: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        if (categoryRepository.existsByNameAndIdNot(request.getName().trim(), id)) {
            throw new BadRequestException("Category with name '" + request.getName() + "' already exists");
        }

        category.setName(request.getName().trim());
        category.setSeoDescription(request.getSeoDescription() != null ? request.getSeoDescription().trim() : null);

        Category updatedCategory = categoryRepository.save(category);
        log.info("Category updated successfully with ID: {}", updatedCategory.getId());

        return CategoryResponse.fromEntity(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Integer id) {
        log.info("Deleting category with ID: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        try {
            categoryRepository.delete(category);
            log.info("Category deleted successfully with ID: {}", id);
        } catch (Exception ex) {
            throw new BadRequestException("Cannot delete category because it has associated records: " + ex.getMessage());
        }
    }
}
