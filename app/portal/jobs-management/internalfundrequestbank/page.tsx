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

export default async function HomePage() {
  //process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "BankFundRequestId,BankId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,RequestorUserId,Remarks,Version",
    where: "",
    sortOn: "BankFundRequestId DESC",
    page: "1",
    pageSize: "100",
  };

  try {
    const response = await fetch(`${baseUrl}InternalBankFundsRequest/GetList`, {
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

    // Debug log to check the data structure
    console.log(
      "📦 Server-side fetched data sample:",
      initialData.slice(0, 2).map((item: any) => ({
        bankFundRequestId: item.bankFundRequestId || item.BankFundRequestId,
        bankId: item.bankId || item.BankId,
        requestorUserId: item.requestorUserId || item.RequestorUserId,
        requestedTo: item.requestedTo || item.RequestedTo,
        approvalStatus: item.approvalStatus || item.ApprovalStatus,
        remarks: item.remarks || item.Remarks,
      })),
    );

    return (
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={initialData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Failed to fetch internal funds request bank data:", error);

    return (
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={[]} />
      </Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
