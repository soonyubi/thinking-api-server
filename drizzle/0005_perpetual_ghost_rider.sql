CREATE TABLE `organization_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`profile_id` int NOT NULL,
	`permission` varchar(100) NOT NULL,
	`granted_by_profile_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `organization_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_profile_permission_unique` UNIQUE(`organization_id`,`profile_id`,`permission`)
);
--> statement-breakpoint
ALTER TABLE `organization_permissions` ADD CONSTRAINT `organization_permissions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_permissions` ADD CONSTRAINT `organization_permissions_profile_id_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_permissions` ADD CONSTRAINT `organization_permissions_granted_by_profile_id_profiles_id_fk` FOREIGN KEY (`granted_by_profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `permission_idx` ON `organization_permissions` (`permission`);