/**
 * Flutterwave payment service.
 * Wraps the flutterwave-react-native SDK with SpendTrack-specific helpers.
 */
import Constants from "expo-constants";

// Expo exposes EXPO_PUBLIC_* vars via Constants.expoConfig.extra or process.env
export const FLW_PUBLIC_KEY: string =
  (Constants.expoConfig?.extra?.flwPublicKey as string) ||
  process.env.EXPO_PUBLIC_FLW_PUBLIC_KEY ||
  "FLWPUBK_TEST-d0c739a647254df5941f092338b1708b-X";

/** Generate a unique transaction reference */
export function generateTxRef(prefix = "spendtrack"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let ref = "";
  for (let i = 0; i < 12; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${Date.now()}_${ref}`;
}

export type PaymentType = "income" | "expense";

export interface FlwPaymentOptions {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  description: string;
  type: PaymentType;
}

/** Build the options object for PayWithFlutterwave */
export function buildFlwOptions(opts: FlwPaymentOptions) {
  return {
    tx_ref: generateTxRef(opts.type),
    authorization: FLW_PUBLIC_KEY,
    customer: {
      email: opts.customerEmail,
      name: opts.customerName,
      phonenumber: opts.customerPhone || "",
    },
    amount: opts.amount,
    currency: opts.currency || "RWF",
    payment_options: "card,mobilemoney,ussd",
    customizations: {
      title: "SpendTrack",
      description: opts.description,
      logo: "https://i.imgur.com/your-logo.png",
    },
  };
}

export type FlwRedirectParams = {
  status: "successful" | "cancelled";
  transaction_id?: string;
  tx_ref: string;
};
