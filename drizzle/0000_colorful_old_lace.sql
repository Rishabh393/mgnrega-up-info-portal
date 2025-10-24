CREATE TABLE `districts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_name` text NOT NULL,
	`district_name` text NOT NULL,
	`district_name_hindi` text,
	`district_code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `districts_district_code_unique` ON `districts` (`district_code`);--> statement-breakpoint
CREATE TABLE `performance_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`district_id` integer NOT NULL,
	`fin_year` text NOT NULL,
	`month` text NOT NULL,
	`raw_data` text,
	`metric_work_status` text,
	`metric_payment_status` text,
	`metric_trend` text,
	`metric_comparison` text,
	`active_workers` integer,
	`completed_works` integer,
	`avg_payment` integer,
	`payment_delayed` integer,
	`budget_utilization` integer,
	`monthly_trend` integer,
	`state_average` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
