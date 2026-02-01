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

export default async function SecurityTypesPage() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "SecurityTypeId, SecurityTypeCode, SecurityTypeName, Description, IsActive, CompanyId, CreatedBy, CreatedAt, UpdatedAt, Version",
    where: "",
    sortOn: "SecurityTypeName",
    page: "1",
    pageSize: "50",
  };

  try {
    const response = await fetch(`${baseUrl}SetupSecurityType/GetList`, {
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
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={initialData} />
      </Suspense>
    );
  } catch (error) {
    console.error("Failed to fetch security types data:", error);

    // Return empty data to prevent client component from crashing
    return (
      <Suspense fallback={<AppLoader />}>
        <ClientComponent initialData={[]} />
      </Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
