import { stripe } from "@/lib/stripe";

async function createProducts() {
  // Criar produto Básico
  const basicProduct = await stripe.products.create({
    name: "Plano Básico - AgroComm",
    description: "Acesso completo às cotações com histórico de 30 dias",
  });

  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 2990, // R$ 29,90
    currency: "brl",
    recurring: {
      interval: "month",
    },
  });

  // Criar produto Pro
  const proProduct = await stripe.products.create({
    name: "Plano Profissional - AgroComm",
    description: "Histórico ilimitado, alertas e API de integração",
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7990, // R$ 79,90
    currency: "brl",
    recurring: {
      interval: "month",
    },
  });

  // Criar produto Enterprise
  const enterpriseProduct = await stripe.products.create({
    name: "Plano Empresarial - AgroComm",
    description: "Solução completa para empresas com suporte dedicado",
  });

  const enterprisePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 19990, // R$ 199,90
    currency: "brl",
    recurring: {
      interval: "month",
    },
  });

  console.log("Produtos criados:");
  console.log("Basic:", { productId: basicProduct.id, priceId: basicPrice.id });
  console.log("Pro:", { productId: proProduct.id, priceId: proPrice.id });
  console.log("Enterprise:", { productId: enterpriseProduct.id, priceId: enterprisePrice.id });
}

createProducts();