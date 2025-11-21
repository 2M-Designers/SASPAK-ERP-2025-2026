import ClientComponent from "./page.client";

export default async function HomePage() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Allow self-signed certificates
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const roles = await fetch(`${baseUrl}UsersManagement/get-userGroups`)
    .then((res) => (res.ok ? res.json() : []))
    .catch((err) => console.log(err));

  const menus = await fetch(`${baseUrl}UsersManagement/get-allMenus`)
    .then((res) => (res.ok ? res.json() : []))
    .catch((err) => console.log(err));

  return <ClientComponent roles={roles} menus={menus} />;
}

export const dynamic = "force-dynamic";
