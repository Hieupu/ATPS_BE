-- Table structure for table `email_log`
-- Lưu log tất cả các email đã gửi trong hệ thống

DROP TABLE IF EXISTS email_log;

CREATE TABLE email_log (
  EmailLogID int NOT NULL AUTO_INCREMENT,
  TemplateID int DEFAULT NULL,
  TemplateCode varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  RecipientEmail varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  RecipientAccID int DEFAULT NULL,
  Subject varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Body text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Variables json DEFAULT NULL,
  Status enum('PENDING','SENT','FAILED','BOUNCED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  ErrorMessage text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  SentAt datetime DEFAULT NULL,
  CreatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (EmailLogID),
  KEY idx_template_id (TemplateID),
  KEY idx_template_code (TemplateCode),
  KEY idx_recipient_email (RecipientEmail),
  KEY idx_recipient_acc_id (RecipientAccID),
  KEY idx_status (Status),
  KEY idx_sent_at (SentAt),
  KEY idx_created_at (CreatedAt),
  CONSTRAINT fk_email_log_template FOREIGN KEY (TemplateID) REFERENCES email_template (TemplateID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_email_log_recipient FOREIGN KEY (RecipientAccID) REFERENCES account (AccID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

