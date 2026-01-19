CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`prompt` text NOT NULL,
	`result` text,
	`metadata` text,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
