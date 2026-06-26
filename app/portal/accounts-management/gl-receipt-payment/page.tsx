import ClientComponent from "./page.client";

interface GetListRequest {
  select: string;
  where: string;
  sortOn: string;
  page: string;
  pageSize: string;
}

export default async function GLReceiptPaymentPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "GlreceiptPaymentId, ReceiptPaymentDate, ReceiptPaymentNumber, JobId, ReceiptPaymentType, ReceiptPaymentAmount, TotalAmount, PayToPartyId, ReceiptPaymentStatus, ReceiptPaymentDescription, CurrencyId, ExchangeRate, GlVoucherId, Version",
    where: "",
    sortOn: "GlreceiptPaymentId DESC",
    page: "1",
    pageSize: "200",
  };

  try {
    const response = await fetch(`${baseUrl}GLReceiptPayment/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const initialData = await response.json();
    return <ClientComponent initialData={initialData} />;
  } catch (error) {
    console.error("Failed to fetch GL Receipt Payment data:", error);
    return <ClientComponent initialData={[]} />;
  }
}

export const dynamic = "force-dynamic";
