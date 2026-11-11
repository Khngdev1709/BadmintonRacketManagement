package com.project01.badmintonracketmanagement.iservice.rental;

import com.project01.badmintonracketmanagement.dto.rental.RentalContractRequest;
import com.project01.badmintonracketmanagement.dto.rental.RentalContractResponse;

import java.math.BigDecimal;
import java.util.List;

public interface IRentalService {

    /**
     * Create a rental contract: verifies 'Used' condition, calculates rental days and total fee,
     * deducts stock and persists contract with details.
     */
    RentalContractResponse createRentalContract(Integer userId, RentalContractRequest request);

    /**
     * Complete the return of rented products: adds surcharge, updates note, sets actual return date,
     * restores stock and marks status as 'Returned'.
     */
    RentalContractResponse returnRental(Integer contractId, BigDecimal surcharge, String returnNote);

    /**
     * Get rental history for a specific user, newest first.
     */
    List<RentalContractResponse> getUserRentals(Integer userId);

    /**
     * Get rental contract details by contract ID.
     */
    RentalContractResponse getRentalById(Integer contractId);
}
