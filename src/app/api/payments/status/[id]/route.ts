import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPaymentById } from "@/lib/mercadopago";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payment = await getPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentMethodId: payment.payment_method_id,
      paymentTypeId: payment.payment_type_id,
      pixQrCode:
        payment.point_of_interaction?.transaction_data?.qr_code ?? null,
      pixQrCodeBase64:
        payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      boletoUrl: payment.transaction_details?.external_resource_url ?? null,
    });
  } catch (err) {
    console.error("Payment status error:", err);
    return NextResponse.json(
      { error: "Erro ao consultar pagamento" },
      { status: 500 },
    );
  }
}
