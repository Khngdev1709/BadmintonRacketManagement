package com.project01.badmintonracketmanagement.repository.tracking;

import com.project01.badmintonracketmanagement.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Integer> {
}
