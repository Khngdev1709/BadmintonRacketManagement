package com.project01.badmintonracketmanagement.service.rental;

import com.project01.badmintonracketmanagement.dto.rental.RentalContractRequest;
import com.project01.badmintonracketmanagement.dto.rental.RentalContractResponse;
import com.project01.badmintonracketmanagement.dto.rental.RentalItemRequest;
import com.project01.badmintonracketmanagement.entity.Product;
import com.project01.badmintonracketmanagement.entity.RentalContract;
import com.project01.badmintonracketmanagement.entity.RentalDetail;
import com.project01.badmintonracketmanagement.entity.User;
import com.project01.badmintonracketmanagement.exception.BadRequestException;
import com.project01.badmintonracketmanagement.exception.ResourceNotFoundException;
import com.project01.badmintonracketmanagement.exception.order.InsufficientStockException;
import com.project01.badmintonracketmanagement.iservice.rental.IRentalService;
import com.project01.badmintonracketmanagement.repository.auth.UserRepository;
import com.project01.badmintonracketmanagement.repository.product.ProductRepository;
import com.project01.badmintonracketmanagement.repository.rental.RentalContractRepository;
import com.project01.badmintonracketmanagement.repository.rental.RentalDetailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalService implements IRentalService {

    private static final String CONDITION_USED = "Used";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_RENTING = "Renting";
    private static final String STATUS_RETURNED = "Returned";

    private final RentalContractRepository rentalContractRepository;
    private final RentalDetailRepository rentalDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RentalContractResponse createRentalContract(Integer userId, RentalContractRequest request) {
        log.info("Creating rental contract for user ID: {}", userId);

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Rental contract must contain at least one item");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        LocalDateTime now = LocalDateTime.now();
        if (request.getExpectedReturnDate().isBefore(now)) {
            throw new BadRequestException("Expected return date must be in the future");
        }

        long rentalDays = ChronoUnit.DAYS.between(now.toLocalDate(), request.getExpectedReturnDate().toLocalDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }

        List<RentalDetail> details = new ArrayList<>();
        BigDecimal rentalFeeTotal = BigDecimal.ZERO;

        for (Map.Entry<Integer, Integer> entry : aggregateQuantities(request.getItems()).entrySet()) {
            Product product = lockProduct(entry.getKey());
            int quantity = entry.getValue();

            validateProductForRental(product, quantity);

            product.setStockQuantity(product.getStockQuantity() - quantity);

            BigDecimal pricePerDay = product.getRentalPricePerDay();
            BigDecimal itemTotal = pricePerDay
                    .multiply(BigDecimal.valueOf(quantity))
                    .multiply(BigDecimal.valueOf(rentalDays));

            rentalFeeTotal = rentalFeeTotal.add(itemTotal);

            details.add(RentalDetail.builder()
                    .product(product)
                    .quantity(quantity)
                    .pricePerDay(pricePerDay)
                    .build());
        }

        RentalContract contract = rentalContractRepository.save(RentalContract.builder()
                .user(user)
                .expectedReturnDate(request.getExpectedReturnDate())
                .depositType(request.getDepositType().trim())
                .rentalFeeTotal(rentalFeeTotal)
                .surcharge(BigDecimal.ZERO)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .status(STATUS_RENTING)
                .build());

        details.forEach(detail -> detail.setRentalContract(contract));
        rentalDetailRepository.saveAll(details);

        log.info("Rental contract ID: {} created with total fee: {} for {} days",
                contract.getId(), rentalFeeTotal, rentalDays);

        return RentalContractResponse.fromEntity(contract, details);
    }

    @Override
    @Transactional
    public RentalContractResponse returnRental(Integer contractId, BigDecimal surcharge, String returnNote) {
        log.info("Processing return for rental contract ID: {}", contractId);

        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental contract not found with ID: " + contractId));

        if (STATUS_RETURNED.equalsIgnoreCase(contract.getStatus())) {
            throw new BadRequestException("Rental contract with ID " + contractId + " has already been returned");
        }

        contract.setActualReturnDate(LocalDateTime.now());
        contract.setStatus(STATUS_RETURNED);

        if (surcharge != null && surcharge.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentSurcharge = contract.getSurcharge() != null ? contract.getSurcharge() : BigDecimal.ZERO;
            contract.setSurcharge(currentSurcharge.add(surcharge));
        }

        if (StringUtils.hasText(returnNote)) {
            String existingNote = contract.getNote();
            if (StringUtils.hasText(existingNote)) {
                contract.setNote(existingNote + " | Return note: " + returnNote.trim());
            } else {
                contract.setNote("Return note: " + returnNote.trim());
            }
        }

        List<RentalDetail> details = rentalDetailRepository.findByRentalContractIdWithProduct(contractId);
        for (RentalDetail detail : details) {
            Product product = lockProduct(detail.getProduct().getId());
            product.setStockQuantity(product.getStockQuantity() + detail.getQuantity());
        }

        RentalContract savedContract = rentalContractRepository.save(contract);
        log.info("Rental contract ID: {} successfully marked as returned with surcharge: {}",
                savedContract.getId(), savedContract.getSurcharge());

        return RentalContractResponse.fromEntity(savedContract, details);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentalContractResponse> getUserRentals(Integer userId) {
        List<RentalContract> contracts = rentalContractRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (contracts.isEmpty()) {
            return List.of();
        }

        List<Integer> contractIds = contracts.stream().map(RentalContract::getId).toList();
        Map<Integer, List<RentalDetail>> detailsByContractId = rentalDetailRepository
                .findByRentalContractIdsWithProduct(contractIds).stream()
                .collect(Collectors.groupingBy(detail -> detail.getRentalContract().getId()));

        return contracts.stream()
                .map(c -> RentalContractResponse.fromEntity(c, detailsByContractId.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RentalContractResponse getRentalById(Integer contractId) {
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Rental contract not found with ID: " + contractId));

        List<RentalDetail> details = rentalDetailRepository.findByRentalContractIdWithProduct(contractId);
        return RentalContractResponse.fromEntity(contract, details);
    }

    private Map<Integer, Integer> aggregateQuantities(List<RentalItemRequest> items) {
        return items.stream().collect(Collectors.toMap(
                RentalItemRequest::getProductId,
                RentalItemRequest::getQuantity,
                Integer::sum,
                TreeMap::new
        ));
    }

    private Product lockProduct(Integer productId) {
        return productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));
    }

    private void validateProductForRental(Product product, int quantity) {
        if (!STATUS_ACTIVE.equalsIgnoreCase(product.getStatus())) {
            throw new BadRequestException("Product '" + product.getName() + "' is not active");
        }
        if (!CONDITION_USED.equalsIgnoreCase(product.getCondition())) {
            throw new BadRequestException("Product '" + product.getName() + "' is not a 'Used' product and cannot be rented");
        }
        if (product.getRentalPricePerDay() == null) {
            throw new BadRequestException("Product '" + product.getName() + "' does not have a rental price per day");
        }
        int available = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        if (available < quantity) {
            throw new InsufficientStockException(product.getName(), available, quantity);
        }
    }
}
