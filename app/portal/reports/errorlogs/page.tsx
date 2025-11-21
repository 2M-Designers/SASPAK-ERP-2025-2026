import ClientComponent from "./page.client";
import AppLoader from "@/components/app-loader";

export default async function HomePage({ searchParams }: any) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // Extract query parameters (if available)

  const dateFrom = searchParams?.dateFrom || null;
  const dateTo = searchParams?.dateTo || null;

  // Construct query string dynamically
  const queryParams = new URLSearchParams();
  if (dateFrom) queryParams.append("dateFrom", dateFrom);
  if (dateTo) queryParams.append("dateTo", dateTo);

  const apiUrl = `${baseUrl}Utility/GetAllErrorLogs`;

  let initialData = [];

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      initialData = await response.json();
    }
  } catch (error) {
    console.error("Error fetching task data:", error);
  }

  return <ClientComponent initialData={initialData} />;
}

export const dynamic = "force-dynamic";
