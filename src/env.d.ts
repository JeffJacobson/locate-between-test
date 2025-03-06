// src/env.d.ts
declare namespace NodeJS {
	interface ProcessEnv {
		NODE_TLS_REJECT_UNAUTHORIZED: string;
		DEFAULT_LRS_LAYER_URL: string;
		LRS_AND_MP_SERVICE_URL: string;
		// Add other environment variables here as needed
	}
}
