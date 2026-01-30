import { createBaseAccountSDK } from "@base-org/account";

export const baseAccountSDK = createBaseAccountSDK({
    appName: "IDRX Faucet",
});

export const baseAccountProvider = baseAccountSDK.getProvider();
