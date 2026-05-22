import { getBaseUrl, getAuthHeaders } from "@/lib/api-client";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const toOption = (value: any, label: string) => ({ value, label });

async function getList(
  endpoint: string,
  select: string,
  where = "IsActive == true",
  sortOn = "",
  pageSize = "1000",
): Promise<any[]> {
  const response = await fetch(`${getBaseUrl()}${endpoint}/GetList`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      select,
      where,
      sortOn,
      page: "1",
      pageSize,
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// ─── Parties ──────────────────────────────────────────────────────────────────

export const fetchParties = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "Party",
      "PartyId,PartyCode,PartyName,IsProcessOwner,IsShipper,IsConsignee,IsPrincipal,IsShippingLine,IsTransporter,IsAgent,IsTerminal",
      "IsActive == true",
      "PartyName",
    );

    const opt = (p: any) =>
      toOption(p.partyId, `${p.partyCode} - ${p.partyName}`);

    const parties = data.map((p: any) => ({
      ...opt(p),
      isProcessOwner: p.isProcessOwner,
      isShipper: p.isShipper,
      isConsignee: p.isConsignee,
      isPrincipal: p.isPrincipal,
      isShippingLine: p.isShippingLine,
      isTransporter: p.isTransporter,
      isAgent: p.isAgent,
      isTerminal: p.isTerminal,
    }));

    return {
      parties,
      processOwners: data.filter((p: any) => p.isProcessOwner).map(opt),
      shippers: data.filter((p: any) => p.isShipper).map(opt),
      consignees: data.filter((p: any) => p.isConsignee).map(opt),
      localAgents: data.filter((p: any) => p.isAgent).map(opt),
      carriers: data.filter((p: any) => p.isShippingLine).map(opt),
      transporters: data.filter((p: any) => p.isTransporter).map(opt),
      terminals: data.filter((p: any) => p.isTerminal).map(opt),
    };
  } catch (error) {
    console.error("Error fetching parties:", error);
  } finally {
    setLoading(false);
  }

  return {
    parties: [],
    processOwners: [],
    shippers: [],
    consignees: [],
    localAgents: [],
    carriers: [],
    transporters: [],
    terminals: [],
  };
};

// ─── Type values (dropdowns backed by General/GetTypeValues) ──────────────────

export const fetchTypeValues = async (
  typeName: string,
  setLoading?: (v: boolean) => void,
) => {
  if (setLoading) setLoading(true);
  try {
    const response = await fetch(
      `${getBaseUrl()}General/GetTypeValues?typeName=${typeName}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) return [];
    const data = await response.json();

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return Object.entries(data)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([key, value]) => ({ value: key, label: value as string }));
    }
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        value: item.value ?? item.code ?? item.name,
        label: item.label ?? item.name ?? item.value,
      }));
    }
  } catch (error) {
    console.error(`Error fetching ${typeName}:`, error);
  } finally {
    if (setLoading) setLoading(false);
  }
  return [];
};

export const fetchOperationTypes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_OperationType", setLoading);

export const fetchOperationModes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_OperationMode", setLoading);

export const fetchJobLoadTypes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_LoadType", setLoading);

export const fetchJobLoads = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_Load", setLoading);

export const fetchDocumentTypes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_DocumentType", setLoading);

export const fetchBLStatus = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_BL_Status", setLoading);

export const fetchFreightTypes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Freight_Types", setLoading);

export const fetchPackageTypes = (setLoading?: (v: boolean) => void) =>
  fetchTypeValues("Job_PackageTypes", setLoading);

// ─── Setup lookups ────────────────────────────────────────────────────────────

export const fetchContainerTypes = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "SetupContainerType",
      "ContainerTypeId,TypeName,TypeCode",
      "IsActive == true",
      "TypeName",
      "100",
    );
    return data.map((t: any) =>
      toOption(t.containerTypeId, t.typeCode),
    );
  } catch (e) {
    console.error("Error fetching container types:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchContainerSizes = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "SetupContainerSize",
      "ContainerSizeId,SizeCode",
      "IsActive == true",
      "SizeCode",
      "100",
    );
    return data.map((s: any) => toOption(s.containerSizeId, s.sizeCode));
  } catch (e) {
    console.error("Error fetching container sizes:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchLocations = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "UnLocation",
      "unlocationId,UNCode,LocationName",
      "IsActive == true",
      "LocationName",
    );
    return data.map((l: any) =>
      toOption(l.unlocationId, `${l.uncode || ""} - ${l.locationName}`),
    );
  } catch (e) {
    console.error("Error fetching locations:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchCountries = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "UnLocation",
      "unlocationId,UNCode,LocationName",
      "IsActive == true && IsCountry == true",
      "LocationName",
      "500",
    );
    return data.map((c: any) =>
      toOption(c.unlocationId, `${c.uncode || ""} - ${c.locationName}`),
    );
  } catch (e) {
    console.error("Error fetching countries:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchCurrencies = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "SetupCurrency",
      "CurrencyId,CurrencyCode,CurrencyName",
      "IsActive == true",
      "CurrencyName",
      "200",
    );
    return data.map((c: any) => toOption(c.currencyId, c.currencyCode));
  } catch (e) {
    console.error("Error fetching currencies:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchVessels = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "VesselMaster",
      "VesselId,VesselCode,VesselName",
      "IsActive == true",
      "VesselName",
    );
    return data.map((v: any) =>
      toOption(v.vesselName, `${v.vesselCode} - ${v.vesselName}`),
    );
  } catch (e) {
    console.error("Error fetching vessels:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchHsCodes = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "HSCode",
      "HsCodeId,Code,Description",
      "IsActive == true",
      "Code",
      "5000",
    );
    return data.map((c: any) => ({
      value: c.hsCodeId,
      label: `${c.code} - ${c.description}`,
      code: c.code,
      description: c.description,
    }));
  } catch (e) {
    console.error("Error fetching HS codes:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchBanks = async (setLoading: (v: boolean) => void) => {
  setLoading(true);
  try {
    const data = await getList(
      "Banks",
      "BankId,BankCode,BankName",
      "IsActive == true",
      "BankName",
      "500",
    );
    return data.map((b: any) =>
      toOption(b.bankId, `${b.bankCode} - ${b.bankName}`),
    );
  } catch (e) {
    console.error("Error fetching banks:", e);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchGdClearedUnderSection = async (
  setLoading: (v: boolean) => void,
) => {
  setLoading(true);
  try {
    const data = await getList(
      "SetupGdclearedUnderSection",
      "GdclearedUnderSectionId,SectionCode,SectionName,IsActive,IsSecurityRequired",
      "IsActive == true",
      "SectionCode",
      "100",
    );
    return data.map((s: any) => ({
      value: s.gdclearedUnderSectionId,
      label: `${s.sectionCode} - ${s.sectionName}`,
      sectionCode: s.sectionCode,
      sectionName: s.sectionName,
      isSecurityRequired: s.isSecurityRequired,
    }));
  } catch (e) {
    console.error("Error fetching GD Cleared Under Section:", e);
  } finally {
    setLoading(false);
  }
  return [];
};
