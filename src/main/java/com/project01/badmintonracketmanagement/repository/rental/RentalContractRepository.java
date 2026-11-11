package com.project01.badmintonracketmanagement.repository.rental;

import com.project01.badmintonracketmanagement.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Integer> {

    List<RentalContract> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
