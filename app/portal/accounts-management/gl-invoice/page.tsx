import ClientComponent from "./page.client";

export default async function GLInvoicePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}GLInvoice/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select:
          "GlinvoiceId, InvoiceDate, InvoiceNumber, JobId, InvoiceType, BillingPartyId, InvoiceStatus, InvoiceDescription, CurrencyId, ExchangeRate, GlVoucherId, DueDays, PartialPayment, Version",
        where: "",
        sortOn: "GlInvoiceId DESC",
        page: "1",
        pageSize: "2000",
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const initialData = await response.json();
    return <ClientComponent initialData={initialData} />;
  } catch (error) {
    console.error("Failed to fetch GL Invoice data:", error);
    return <ClientComponent initialData={[]} />;
  }
}

export const dynamic = "force-dynamic";
