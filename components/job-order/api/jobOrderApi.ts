// API fetch functions for Job Order Form

export const fetchParties = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}Party/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select:
          "PartyId,PartyCode,PartyName,IsProcessOwner,IsShipper,IsConsignee,IsPrincipal,IsShippingLine,IsTransporter",
        where: "IsActive == true",
        sortOn: "PartyName",
        page: "1",
        pageSize: "1000",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        // All parties
        const parties = data.map((p: any) => ({
          value: p.partyId,
          label: `${p.partyCode} - ${p.partyName}`,
          isProcessOwner: p.isProcessOwner,
          isShipper: p.isShipper,
          isConsignee: p.isConsignee,
          isPrincipal: p.isPrincipal,
          isShippingLine: p.isShippingLine,
          isTransporter: p.isTransporter,
        }));

        // Process Owners
        const processOwners = data
          .filter((p: any) => p.isProcessOwner)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Shippers
        const shippers = data
          .filter((p: any) => p.isShipper)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Consignees
        const consignees = data
          .filter((p: any) => p.isConsignee)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Local Agents (Principal)
        const localAgents = data
          .filter((p: any) => p.isPrincipal)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Carriers (Shipping Lines)
        const carriers = data
          .filter((p: any) => p.isShippingLine)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Transporters
        const transporters = data
          .filter((p: any) => p.isTransporter)
          .map((p: any) => ({
            value: p.partyId,
            label: `${p.partyCode} - ${p.partyName}`,
          }));

        // Terminals - All parties can be terminals, no specific flag
        const terminals = parties; // or you can create specific filtering if needed

        return {
          parties,
          processOwners,
          shippers,
          consignees,
          localAgents,
          carriers,
          transporters,
          terminals,
        };
      }
    }
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

// Function to fetch type values from General API
// API returns object like: {"None":"","Import":"Import","Export":"Export"}
export const fetchTypeValues = async (
  typeName: string,
  setLoading?: (loading: boolean) => void,
) => {
  if (setLoading) setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(
      `${baseUrl}General/GetTypeValues?typeName=${typeName}`,
    );
    if (response.ok) {
      const data = await response.json();

      // Check if data is an object (not an array)
      if (data && typeof data === "object" && !Array.isArray(data)) {
        // Convert object to array of options
        // Filter out empty values (like "None":"")
        return Object.entries(data)
          .filter(
            ([key, value]) =>
              value !== "" && value !== null && value !== undefined,
          )
          .map(([key, value]) => ({
            value: key,
            label: value as string,
          }));
      }

      // Fallback: if it's an array
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          value: item.value || item.code || item.name,
          label: item.label || item.name || item.value,
        }));
      }
    }
  } catch (error) {
    console.error(`Error fetching ${typeName}:`, error);
  } finally {
    if (setLoading) setLoading(false);
  }
  return [];
};

// Specific fetch functions for Job Main dropdown types
export const fetchOperationTypes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_OperationType", setLoading);
};

export const fetchOperationModes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_OperationMode", setLoading);
};

export const fetchJobLoadTypes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_LoadType", setLoading);
};

export const fetchJobLoads = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_Load", setLoading);
};

export const fetchDocumentTypes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_DocumentType", setLoading);
};

// Specific fetch functions for Shipping dropdown types
export const fetchBLStatus = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_BL_Status", setLoading);
};

export const fetchFreightTypes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Freight_Types", setLoading);
};

export const fetchPackageTypes = async (
  setLoading?: (loading: boolean) => void,
) => {
  return fetchTypeValues("Job_PackageTypes", setLoading);
};

export const fetchContainerTypes = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}SetupContainerType/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "ContainerTypeId,TypeName,TypeCode",
        where: "IsActive == true",
        sortOn: "TypeName",
        page: "1",
        pageSize: "100",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((t: any) => ({
          value: t.containerTypeId,
          label: `${t.typeCode}`,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching container types:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchContainerSizes = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}SetupContainerSize/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "ContainerSizeId,SizeCode",
        where: "IsActive == true",
        sortOn: "SizeCode",
        page: "1",
        pageSize: "100",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((s: any) => ({
          value: s.containerSizeId,
          label: s.sizeCode,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching container sizes:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchLocations = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}UnLocation/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "unlocationId,UNCode,LocationName",
        where: "IsActive == true",
        sortOn: "LocationName",
        page: "1",
        pageSize: "1000",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((l: any) => ({
          value: l.unlocationId,
          label: `${l.uncode || ""} - ${l.locationName}`,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchCountries = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}UnLocation/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "unlocationId,UNCode,LocationName",
        where: "IsActive == true && IsCountry == true",
        sortOn: "LocationName",
        page: "1",
        pageSize: "500",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          value: c.unlocationId,
          label: `${c.uncode || ""} - ${c.locationName}`,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching countries:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchCurrencies = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}SetupCurrency/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "CurrencyId,CurrencyCode,CurrencyName",
        where: "IsActive == true",
        sortOn: "CurrencyName",
        page: "1",
        pageSize: "200",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          value: c.currencyId,
          label: c.currencyCode,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching currencies:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchVessels = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}VesselMaster/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "VesselId,VesselCode,VesselName",
        where: "IsActive == true",
        sortOn: "VesselName",
        page: "1",
        pageSize: "1000",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((v: any) => ({
          value: v.vesselName,
          label: `${v.vesselCode} - ${v.vesselName}`,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching vessels:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchHsCodes = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}HSCode/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "HsCodeId,Code,Description",
        where: "IsActive == true",
        sortOn: "Code",
        page: "1",
        pageSize: "5000",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          value: c.hsCodeId,
          label: `${c.code} - ${c.description}`,
          code: c.code,
          description: c.description,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching HS codes:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

export const fetchBanks = async (setLoading: (loading: boolean) => void) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(`${baseUrl}Banks/GetList`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "BankId,BankCode,BankName",
        where: "IsActive == true",
        sortOn: "BankName",
        page: "1",
        pageSize: "500",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((b: any) => ({
          value: b.bankId,
          label: `${b.bankCode} - ${b.bankName}`,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching banks:", error);
  } finally {
    setLoading(false);
  }
  return [];
};

// ✅ NEW: Fetch GD Cleared Under Section for Completion Tab
export const fetchGdClearedUnderSection = async (
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const response = await fetch(
      `${baseUrl}SetupGdclearedUnderSection/GetList`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "GdclearedUnderSectionId,SectionCode,SectionName,IsActive,IsSecurityRequired",
          where: "IsActive == true",
          sortOn: "SectionCode",
          page: "1",
          pageSize: "100",
        }),
      },
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((section: any) => ({
          value: section.gdclearedUnderSectionId,
          label: `${section.sectionCode} - ${section.sectionName}`,
          sectionCode: section.sectionCode,
          sectionName: section.sectionName,
          isSecurityRequired: section.isSecurityRequired,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching GD Cleared Under Section:", error);
  } finally {
    setLoading(false);
  }
  return [];
};
