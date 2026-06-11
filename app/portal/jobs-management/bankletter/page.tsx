import { Suspense } from "react";
import BankLetterClient from "./page.client";
import AppLoader from "@/components/app-loader";

export default function BankLetterPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <BankLetterClient />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
