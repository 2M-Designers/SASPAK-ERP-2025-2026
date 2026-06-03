import { Suspense } from "react";
import BankPayOrderLetterClient from "./page.client";
import AppLoader from "@/components/app-loader";

export default function BankPayOrderLetterPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <BankPayOrderLetterClient />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
