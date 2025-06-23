CREATE TABLE `class_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`class_id` int NOT NULL,
	`profile_id` int NOT NULL,
	`attendance_date` date NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_profile_date_unique` UNIQUE(`class_id`,`profile_id`,`attendance_date`)
);
--> statement-breakpoint
CREATE TABLE `course_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`class_name` varchar(50) NOT NULL,
	`capacity` int,
	`location` varchar(200),
	`instructor_profile_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_class_unique` UNIQUE(`session_id`,`class_name`)
);
--> statement-breakpoint
CREATE TABLE `course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`course_id` int NOT NULL,
	`profile_id` int NOT NULL,
	`enrollment_date` timestamp NOT NULL DEFAULT (now()),
	`status` enum('enrolled','dropped','completed') NOT NULL DEFAULT 'enrolled',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_profile_unique` UNIQUE(`course_id`,`profile_id`)
);
--> statement-breakpoint
CREATE TABLE `course_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`course_id` int NOT NULL,
	`session_number` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`session_date` date NOT NULL,
	`start_time` varchar(10),
	`end_time` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `course_session_unique` UNIQUE(`course_id`,`session_number`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `class_attendances` ADD CONSTRAINT `class_attendances_class_id_course_classes_id_fk` FOREIGN KEY (`class_id`) REFERENCES `course_classes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `class_attendances` ADD CONSTRAINT `class_attendances_profile_id_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_classes` ADD CONSTRAINT `course_classes_session_id_course_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `course_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_classes` ADD CONSTRAINT `course_classes_instructor_profile_id_profiles_id_fk` FOREIGN KEY (`instructor_profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_profile_id_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_sessions` ADD CONSTRAINT `course_sessions_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;