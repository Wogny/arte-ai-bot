ALTER TABLE `payments` ADD `mercadopagoPaymentId` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `mercadopagoPreferenceId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `mercadopagoCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `mercadopagoSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `stripePaymentIntentId`;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `stripeInvoiceId`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `stripeCustomerId`;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `stripeSubscriptionId`;