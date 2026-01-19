CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('success','error','info','warning') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`actionUrl` text,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notification_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_read_idx` ON `notifications` (`read`);