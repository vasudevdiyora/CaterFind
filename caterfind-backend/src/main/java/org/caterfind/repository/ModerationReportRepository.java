package org.caterfind.repository;

import java.util.List;

import org.caterfind.entity.ModerationReport;
import org.caterfind.entity.ModerationReport.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModerationReportRepository extends JpaRepository<ModerationReport, Long> {

    long countByStatus(ReportStatus status);

    List<ModerationReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<ModerationReport> findAllByOrderByCreatedAtDesc();
}
