import ClientComponent from "./page.client";

export default async function GLBillPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}GLBill/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select:
          "GlbillId, BillDate, BillNumber, JobId, BillType, BillAmount, TotalAmount, PayToPartyId, BillStatus, BillDescription, CurrencyId, ExchangeRate, GlVoucherId, Version",
        where: "",
        sortOn: "GlbillId DESC",
        page: "1",
        pageSize: "200",
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const initialData = await response.json();
    return <ClientComponent initialData={initialData} />;
  } catch (error) {
    console.error("Failed to fetch GL Bill data:", error);
    return <ClientComponent initialData={[]} />;
  }
}

export const dynamic = "force-dynamic";
