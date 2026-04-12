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

export default async function ExternalBankCashFundRequestPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "ExternalBankCashFundRequestId,JobId,CustomerPartyId,TotalRequestedAmount,TotalApprovedAmount,ApprovalStatus,ApprovedBy,ApprovedOn,RequestedTo,CreatedOn,CreatedBy,Version,RequestorUserId",
    where: "",
    sortOn: "ExternalBankCashFundRequestId DESC",
    page: "1",
    pageSize: "100",
  };

  try {
    const response = await fetch(
      `${baseUrl}ExternalBankCashFundRequest/GetList`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const initialData = await response.json();

    // Debug log to check the data structure
    console.log(
      "📦 Server-side fetched data sample:",
      initialData.slice(0, 2).map((item: any) => ({
        externalBankCashFundRequestId:
          item.externalBankCashFundRequestId ||
          item.ExternalBankCashFundRequestId,
        jobId: item.jobId || item.JobId,
        customerPartyId: item.customerPartyId || item.CustomerPartyId,
        requestorUserId: item.requestorUserId || item.RequestorUserId,
        requestedTo: item.requestedTo || item.RequestedTo,
        approvalStatus: item.approvalStatus || item.ApprovalStatus,
        createdBy: item.createdBy || item.CreatedBy,
      })),
    );

    return (
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={initialData} />
      </Suspense>
    );
  } catch (error) {
    console.error(
      "Failed to fetch external bank cash fund request data:",
      error,
    );

    return (
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={[]} />
      </Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
