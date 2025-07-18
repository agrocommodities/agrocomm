import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não está definida");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
  typescript: true,
});

// IDs dos produtos no Stripe (você precisa criar esses produtos no Dashboard do Stripe)
export const STRIPE_PRODUCTS = {
  basic: {
    priceId: process.env.STRIPE_PRICE_BASIC || "price_...", 
    productId: process.env.STRIPE_PRODUCT_BASIC || "prod_...",
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || "price_...",
    productId: process.env.STRIPE_PRODUCT_PRO || "prod_...",
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_...",
    productId: process.env.STRIPE_PRODUCT_ENTERPRISE || "prod_...",
  },
};

// Mapear planos para price IDs
export function getPriceIdForPlan(plan: string): string | null {
  switch (plan) {
    case "basic":
      return STRIPE_PRODUCTS.basic.priceId;
    case "pro":
      return STRIPE_PRODUCTS.pro.priceId;
    case "enterprise":
      return STRIPE_PRODUCTS.enterprise.priceId;
    default:
      return null;
  }
}