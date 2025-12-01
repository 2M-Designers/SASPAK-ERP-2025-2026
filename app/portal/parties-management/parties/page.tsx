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
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const requestBody: GetListRequest = {
    select:
      "PartyId, CompanyId, PartyCode, PartyName, PartyShortName, IsActive, IsGLLinked, IsCustomer, IsVendor, IsCustomerVendor, IsAgent, IsOverseasAgent, IsShippingLine, IsTransporter, IsConsignee, IsShipper, IsPrincipal, IsNonGLParty, IsInSeaImport, IsInSeaExport, IsInAirImport, IsInAirExport, IsInLogistics, UNLocationId, AddressLine1, AddressLine2, PostalCode, Phone, Fax, Email, Website, ContactPersonName, ContactPersonDesignation, ContactPersonEmail, ContactPersonPhone, NTNNumber, STRNNumber, BankName, BankAccountNumber, IBANNumber, CreditLimitLC, CreditLimitFC, AllowedCreditDays, PaymentTerms, GLParentAccountId, GLAccountId, TrackIdAllowed, IdPasswordAllowed, SendEmail, CanSeeBills, CanSeeLedger, IsProcessOwner, ClearanceByOps, ClearanceByAcm, ATTradeForGDInsustrial, ATTradeForGDCommercial, BenificiaryNameOfPO, SalesRepId, DocsRepId, AccountsRepId, CreatedBy, CreatedAt, UpdatedAt, Version",
    where: "",
    sortOn: "PartyName",
    page: "1",
    pageSize: "50", // Start with a reasonable page size
  };

  try {
    const response = await fetch(`${baseUrl}Party/GetList`, {
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
    console.error("Failed to fetch employees:", error);

    // Return empty data to prevent client component from crashing
    return (
      //<Suspense fallback={<AppLoader />}>
      <ClientComponent initialData={[]} />
      //</Suspense>
    );
  }
}

export const dynamic = "force-dynamic";
