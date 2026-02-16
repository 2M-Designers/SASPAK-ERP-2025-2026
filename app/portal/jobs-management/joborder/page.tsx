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
      "JobId, CompanyId, JobNumber, JobDate, OperationType, OperationMode, JobDocumentType, HouseDocumentNumber, HouseDocumentDate, MasterDocumentNumber, MasterDocumentDate, isFreightForwarding, isClearance, isTransporter, isOther, JobSubType, JobLoadType, FreightType, ShipperPartyId, ConsigneePartyId, NotifyParty1Id, NotifyParty2Id, PrincipalId, OverseasAgentId, TransporterPartyId, DepositorPartyId, CarrierPartyId, TerminalPartyId, OriginPortId, DestinationPortId, PlaceOfDeliveryId, VesselName, VoyageNo, GrossWeight, NetWeight, EtdDate, EtaDate, VesselArrival, DeliverDate, FreeDays, LastFreeDay, AdvanceRentPaidUpto, DispatchAddress, GdType, OriginalDocsReceivedOn, CopyDocsReceivedOn, JobDescription, IgmNumber, IndexNo, BLStatus, Insurance, Landing, CaseSubmittedToLineOn, RentInvoiceIssuedOn, RefundBalanceReceivedOn, Status, Remarks, PoReceivedOn, PoCustomDuty, PoWharfage, PoExciseDuty, PoDeliveryOrder, PoSecurityDeposite, PoSASAdvance, JobInvoiceExchRate, CreatedBy, CreatedAt, UpdatedAt, Version, ProcessOwnerId",
    where: "",
    sortOn: "JobId desc",
    page: "1",
    pageSize: "100", // Start with a reasonable page size
  };

  try {
    const response = await fetch(`${baseUrl}Job/GetList`, {
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
