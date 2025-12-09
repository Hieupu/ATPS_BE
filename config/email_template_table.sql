-- Table structure for table `email_template`

DROP TABLE IF EXISTS email_template;

CREATE TABLE email_template (
  TemplateID int NOT NULL AUTO_INCREMENT,
  TemplateCode varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  TemplateName varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Subject varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Body text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Description text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  EventType varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Variables json DEFAULT NULL,
  IsActive tinyint(1) NOT NULL DEFAULT '1',
  CreatedBy int DEFAULT NULL,
  CreatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy int DEFAULT NULL,
  UpdatedAt datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (TemplateID),
  UNIQUE KEY TemplateCode (TemplateCode),
  KEY idx_event_type (EventType),
  KEY idx_is_active (IsActive),
  KEY fk_email_template_created_by_idx (CreatedBy),
  KEY fk_email_template_updated_by_idx (UpdatedBy),
  CONSTRAINT fk_email_template_created_by FOREIGN KEY (CreatedBy) REFERENCES account (AccID) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_email_template_updated_by FOREIGN KEY (UpdatedBy) REFERENCES account (AccID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

