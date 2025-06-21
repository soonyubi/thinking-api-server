ALTER TABLE `organizations` ADD `main_admin_profile_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `profile_organization` ADD CONSTRAINT `profile_org_unique` UNIQUE(`profile_id`,`organization_id`);--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_main_admin_profile_id_profiles_id_fk` FOREIGN KEY (`main_admin_profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `role_in_org_idx` ON `profile_organization` (`role_in_org`);