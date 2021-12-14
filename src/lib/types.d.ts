/**
 * Can be made globally available by placing this
 * inside `global.d.ts` and removing `export` keyword
 */
export interface Locals {
	userid: string;
}

/**
 * This is still used by viewThread.svelte but it should totally be refactored
 * out to use the InboxItem interface in MyMail.ts (same for write.svelte!)
 */
export interface Message {
	id: number;
	body: string;
	fromAddress: string;
	fromName: string;
	subject: string;
	toAddress: string;
	toName: string;
	fee: number;
	amount: number;
	txid: string;
	appVersion: string;
	timestamp: number;
}
