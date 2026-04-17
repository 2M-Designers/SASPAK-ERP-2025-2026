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

export default async function ContractTariffPage() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "ContractTarrifId, ContractTarrifNo, ContractDate, ContractEffectiveDate, ContractExpiryDate, PartyId, CompanyId, IsGDRawMaterial, IsGDFinishedGoods, IsImport, IsExport, IsSea, IsAir, IsLand, IsFCL, IsLCL, IsBreakBulk, Remarks, CreatedBy, CreatedAt, UpdatedAt, UpdatedBy, CreateLog, UpdateLog, Version, IsActive",
    where: "",
    sortOn: "ContractTarrifNo",
    page: "1",
    pageSize: "50",
  };

  try {
    const response = await fetch(`${baseUrl}ContractTarrif/GetList`, {
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
    console.error("Failed to fetch contract tariffs:", error);

    return (
      //<Suspense fallback={<AppLoader />}>
      <ClientComponent initialData={[]} />
      //</Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
