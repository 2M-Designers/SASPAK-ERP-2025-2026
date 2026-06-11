import { Suspense } from "react";
import PurchaseInvoiceClient from "./page.client";
import AppLoader from "@/components/app-loader";

export default function PurchaseInvoicePage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <PurchaseInvoiceClient />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
