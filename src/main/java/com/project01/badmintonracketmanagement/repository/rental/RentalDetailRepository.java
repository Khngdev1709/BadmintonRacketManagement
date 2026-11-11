package com.project01.badmintonracketmanagement.repository.rental;

import com.project01.badmintonracketmanagement.entity.RentalDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RentalDetailRepository extends JpaRepository<RentalDetail, Integer> {

    @Query("SELECT d FROM RentalDetail d JOIN FETCH d.product WHERE d.rentalContract.id = :contractId")
    List<RentalDetail> findByRentalContractIdWithProduct(@Param("contractId") Integer contractId);

    @Query("SELECT d FROM RentalDetail d JOIN FETCH d.product WHERE d.rentalContract.id IN :contractIds")
    List<RentalDetail> findByRentalContractIdsWithProduct(@Param("contractIds") Collection<Integer> contractIds);
}
