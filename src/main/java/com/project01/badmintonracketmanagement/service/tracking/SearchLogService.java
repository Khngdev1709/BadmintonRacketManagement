package com.project01.badmintonracketmanagement.service.tracking;

import com.project01.badmintonracketmanagement.entity.SearchLog;
import com.project01.badmintonracketmanagement.repository.tracking.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchLogService {

    private final SearchLogRepository searchLogRepository;

    @Async
    public void logSearch(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return;
        }

        try {
            SearchLog searchLog = SearchLog.builder()
                    .keyword(keyword.trim())
                    .searchTime(LocalDateTime.now())
                    .build();

            searchLogRepository.save(searchLog);
            log.info("Recorded search keyword asynchronously: {}", keyword.trim());
        } catch (Exception ex) {
            log.error("Failed to asynchronously save search log for keyword '{}': {}", keyword, ex.getMessage());
        }
    }
}
