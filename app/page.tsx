import { Suspense } from "react";
import ClientComponent from "./page.client";
import AppLoader from "@/components/app-loader";

export default async function HomePage() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Allow self-signed certificates
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return (
    //<Suspense fallback={<AppLoader />}>
    <ClientComponent />
    //</Suspense>
  );
}

export const dynamic = "force-dynamic";
