import { Suspense } from "react";
import ClientComponent from "./page.client";
import AppLoader from "@/components/app-loader";

interface GetListRequest {
  select: string;
  where: string;
  sortOn: string;
  page: string;
  pageSize: string;
}

export default async function VoucherPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "VoucherId, CompanyId, BranchId, VoucherTypeId, VoucherNumber, VoucherDate, AccountingPeriodId, Narration, ReferenceNumber, Status, PostedBy, PostedAt, Version",
    where: "",
    sortOn: "VoucherId DESC",
    page: "1",
    pageSize: "100",
  };

  try {
    const response = await fetch(`${baseUrl}GLVoucher/GetList`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const initialData = await response.json();

    return (
      //<Suspense fallback={<AppLoader />}>
      <ClientComponent initialData={initialData} />
      //</Suspense>
    );
  } catch (error) {
    console.error("Failed to fetch voucher data:", error);

    return (
      //<Suspense fallback={<AppLoader />}>
      <ClientComponent initialData={[]} />
      //</Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
