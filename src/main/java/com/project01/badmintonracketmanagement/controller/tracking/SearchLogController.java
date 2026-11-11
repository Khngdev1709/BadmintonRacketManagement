package com.project01.badmintonracketmanagement.controller.tracking;

import com.project01.badmintonracketmanagement.dto.ApiResponse;
import com.project01.badmintonracketmanagement.dto.tracking.SearchLogRequest;
import com.project01.badmintonracketmanagement.service.tracking.SearchLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/tracking")
@RequiredArgsConstructor
public class SearchLogController {

    private final SearchLogService searchLogService;

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Void>> trackSearch(@Valid @RequestBody SearchLogRequest request) {
        searchLogService.logSearch(request.getKeyword());
        return ResponseEntity.ok(ApiResponse.success("Search keyword tracked successfully", null));
    }
}
