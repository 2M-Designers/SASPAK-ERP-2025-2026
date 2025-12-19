import { Suspense } from "react";
import ClientComponent from "./page.client";
import AppLoader from "@/components/app-loader";

export default async function HomePage() {
  return (
    //<Suspense fallback={<AppLoader />}>
    <ClientComponent />
    //</Suspense>
  );
}

export const dynamic = "force-dynamic";
