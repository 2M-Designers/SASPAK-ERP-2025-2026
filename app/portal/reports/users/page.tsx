import ClientComponent from "./page.client";

export default async function HomePage() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Allow self-signed certificates
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const initialData = await fetch(`${baseUrl}Utility/GetAllUsers`)
    .then((res) => (res.ok ? res.json() : []))
    .catch((err) => console.log(err));

  const roles = await fetch(`${baseUrl}UsersManagement/get-userGroups`)
    .then((res) => (res.ok ? res.json() : []))
    .catch((err) => console.log(err));

  const regulators = await fetch(`${baseUrl}Regulator/GetRegulators`)
    .then((res) => (res.ok ? res.json() : []))
    .catch((err) => console.log(err));

  return (
    <ClientComponent
      initialData={initialData}
      roles={roles.map((item: any) => ({
        value: item.RoleID,
        label: item.RoleName,
      }))}
      regulators={regulators.map((item: any) => ({
        value: item.regulatorID,
        label: item.regulatorName,
      }))}
    />
  );
}

export const dynamic = "force-dynamic";
