import { createBaseAccountSDK } from "@base-org/account";

export const baseAccountSDK = createBaseAccountSDK({
    appName: "IDRX Faucet",
    // You can add more config here as needed
});

export const baseAccountProvider = baseAccountSDK.getProvider();
