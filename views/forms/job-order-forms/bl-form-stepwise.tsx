"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Save,
  Ship,
  Package,
  Plus,
  Trash2,
  X,
  Users,
  MapPin,
  FileText,
  Container,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// BL Master Schema with ALL new fields
const blMasterSchema = z.object({
  blMasterId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional().nullable(),
  mblNumber: z.string().min(1, "MBL Number is required"),
  hblNumber: z.string().min(1, "HBL Number is required"),
  blDate: z.string().min(1, "BL Date is required"),
  shipperPartyId: z.number().min(1, "Shipper is required"),
  consigneePartyId: z.number().min(1, "Consignee is required"),
  notifyPartyId: z.number().optional(),
  noOfPackages: z.number().min(0, "Must be 0 or greater").default(0),
  grossWeight: z.number().min(0, "Must be 0 or greater").default(0),
  netWeight: z.number().min(0, "Must be 0 or greater").default(0),
  volumeCbm: z.number().min(0, "Must be 0 or greater").default(0),
  polid: z.number().min(1, "Port of Loading is required"),
  podid: z.number().min(1, "Port of Discharge is required"),
  vesselName: z.string().min(1, "Vessel Name is required"),
  voyage: z.string().min(1, "Voyage Number is required"),
  forwardingAgentId: z.number().optional(),
  freightType: z.string().min(1, "Freight Type is required"),
  movement: z.string().min(1, "Movement Type is required"),
  blCurrencyId: z.number().min(1, "BL Currency is required"),
  placeOfIssueId: z.number().min(1, "Place of Issue is required"),
  dateOfIssue: z.string().min(1, "Date of Issue is required"),
  marksAndContainersNo: z.string().optional(),
  blNotes: z.string().optional(),
  status: z.string().default("DRAFT"),
  version: z.number().optional(),
});

// BL Equipment Schema with ALL new fields
const blEquipmentSchema = z.object({
  blEquipmentId: z.number().optional(),
  blMasterId: z.number().optional(),
  containerNo: z.string().min(1, "Container number is required"),
  volumeCbm: z.number().min(0).default(0),
  containerTypeId: z.number().min(1, "Container type is required"),
  containerSizeId: z.number().min(1, "Container size is required"),
  sealNo: z.string().optional(),
  grossWeight: z.number().min(0).default(0),
  tareWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  descriptionOfGoods: z.string().optional(),
  hsCodes: z.string().min(1, "HS Code is required"),
  freeDays: z.number().min(0).default(0),
  afterFreeDaysTarrifAmount: z.number().min(0).default(0),
  afterFreeDaysTarrifAmountLC: z.number().min(0).default(0),
  tarrifCurrencyId: z.number().min(1, "Tarrif Currency is required"),
  version: z.number().optional(),
});

type BlMasterFormValues = z.infer<typeof blMasterSchema>;
type BlEquipmentFormValues = z.infer<typeof blEquipmentSchema>;

const STEPS = [
  {
    id: 1,
    name: "Basic Info",
    icon: Ship,
    fields: [
      "mblNumber",
      "hblNumber",
      "blDate",
      "jobId",
      "status",
      "blCurrencyId",
    ],
  },
  {
    id: 2,
    name: "Parties",
    icon: Users,
    fields: [
      "shipperPartyId",
      "consigneePartyId",
      "notifyPartyId",
      "forwardingAgentId",
    ],
  },
  {
    id: 3,
    name: "Shipment",
    icon: MapPin,
    fields: [
      "polid",
      "podid",
      "vesselName",
      "voyage",
      "freightType",
      "movement",
    ],
  },
  {
    id: 4,
    name: "Issue & Cargo",
    icon: FileText,
    fields: [
      "placeOfIssueId",
      "dateOfIssue",
      "noOfPackages",
      "grossWeight",
      "netWeight",
      "volumeCbm",
    ],
  },
  {
    id: 5,
    name: "Additional Info",
    icon: FileText,
    fields: ["marksAndContainersNo", "blNotes"],
  },
  { id: 6, name: "Equipment", icon: Container, fields: [] },
];

export default function BlForm({
  type,
  defaultState,
  handleAddEdit,
}: {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: any;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Dropdown states
  const [jobs, setJobs] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [containerSizes, setContainerSizes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [forwardingAgents, setForwardingAgents] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<any[]>([]);
  const [freightTypes, setFreightTypes] = useState<any[]>([]);
  const [movementTypes, setMovementTypes] = useState<any[]>([]);

  // Loading states
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingContainerTypes, setLoadingContainerTypes] = useState(false);
  const [loadingContainerSizes, setLoadingContainerSizes] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingForwardingAgents, setLoadingForwardingAgents] = useState(false);
  const [loadingHsCodes, setLoadingHsCodes] = useState(false);
  const [loadingFreightTypes, setLoadingFreightTypes] = useState(false);
  const [loadingMovementTypes, setLoadingMovementTypes] = useState(false);

  // Equipment management
  const [equipments, setEquipments] = useState<BlEquipmentFormValues[]>([]);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);

  const form = useForm<BlMasterFormValues>({
    resolver: zodResolver(blMasterSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      status: "DRAFT",
      noOfPackages: 0,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      ...defaultState,
      blDate: defaultState?.blDate
        ? new Date(defaultState.blDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dateOfIssue: defaultState?.dateOfIssue
        ? new Date(defaultState.dateOfIssue).toISOString().split("T")[0]
        : "",
    },
  });

  const equipmentForm = useForm<BlEquipmentFormValues>({
    resolver: zodResolver(blEquipmentSchema),
    mode: "onChange",
    defaultValues: {
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      freeDays: 0,
      afterFreeDaysTarrifAmount: 0,
      afterFreeDaysTarrifAmountLC: 0,
    },
  });

  // Helper function to map API response to form values
  const mapApiResponseToFormValues = (apiData: any): BlMasterFormValues => {
    if (!apiData) return {} as BlMasterFormValues;

    // Map the equipment data from API
    if (apiData.blEquipments && Array.isArray(apiData.blEquipments)) {
      const equipmentData = apiData.blEquipments.map((equip: any) => ({
        blEquipmentId: equip.blEquipmentId || 0,
        blMasterId: equip.blMasterId || 0,
        containerNo: equip.containerNo || "",
        volumeCbm: equip.volumeCbm || 0,
        containerTypeId: equip.containerTypeId || 0,
        containerSizeId: equip.containerSizeId || 0,
        sealNo: equip.sealNo || "",
        grossWeight: equip.grossWeight || 0,
        tareWeight: equip.tareWeight || 0,
        netWeight: equip.netWeight || 0,
        descriptionOfGoods: equip.descriptionOfGoods || "",
        hsCodes: equip.hsCodes || "",
        freeDays: equip.freeDays || 0,
        afterFreeDaysTarrifAmount: equip.afterFreeDaysTarrifAmount || 0,
        afterFreeDaysTarrifAmountLC: equip.afterFreeDaysTarrifAmountLc || 0,
        tarrifCurrencyId: equip.tarrifCurrencyId || 0,
        version: equip.version || 0,
      }));
      setEquipments(equipmentData);
    }

    // Map main form data
    return {
      blMasterId: apiData.blMasterId || 0,
      companyId: apiData.companyId || 1,
      jobId: apiData.jobId || null,
      mblNumber: apiData.mblNumber || "",
      hblNumber: apiData.hblNumber || "",
      blDate: apiData.blDate
        ? new Date(apiData.blDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      shipperPartyId: apiData.shipperPartyId || 0,
      consigneePartyId: apiData.consigneePartyId || 0,
      notifyPartyId: apiData.notifyPartyId || null,
      noOfPackages: apiData.noOfPackages || 0,
      grossWeight: apiData.grossWeight || 0,
      netWeight: apiData.netWeight || 0,
      volumeCbm: apiData.volumeCbm || 0,
      polid: apiData.polid || 0,
      podid: apiData.podid || 0,
      vesselName: apiData.vesselName || "",
      voyage: apiData.voyage || "",
      forwardingAgentId: apiData.forwardingAgentId || null,
      freightType: apiData.freightType || "",
      movement: apiData.movement || "",
      blCurrencyId: apiData.blcurrencyId || 0, // Note: API uses 'blcurrencyId' but form uses 'blCurrencyId'
      placeOfIssueId: apiData.placeOfIssueId || 0,
      dateOfIssue: apiData.dateOfIssue
        ? new Date(apiData.dateOfIssue).toISOString().split("T")[0]
        : "",
      marksAndContainersNo: apiData.marksAndContainersNo || "",
      blNotes: apiData.blnotes || "", // Note: API uses 'blnotes' but form uses 'blNotes'
      status: apiData.status || "DRAFT",
      version: apiData.version || 0,
    };
  };

  // Fetch functions with proper error handling
  /*const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Job/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "JobId,JobNumber,JobDate",
          where: "Status == 'Active'",
          sortOn: "JobNumber",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setJobs(
            data.map((job: any) => ({
              value: job.jobId,
              label: `${job.jobNumber} - ${new Date(
                job.jobDate
              ).toLocaleDateString()}`,
            }))
          );
        } else {
          console.error("Jobs response is not an array:", data);
          setJobs([]);
        }
      } else {
        console.error("Failed to fetch jobs:", response.status);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };*/

  const fetchParties = async () => {
    setLoadingParties(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "PartyId,PartyCode,PartyName",
          where: "IsActive == true",
          sortOn: "PartyName",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setParties(
            data.map((party: any) => ({
              value: party.partyId,
              label: `${party.partyCode} - ${party.partyName}`,
            }))
          );
        } else {
          console.error("Parties response is not an array:", data);
          setParties([]);
        }
      } else {
        console.error("Failed to fetch parties:", response.status);
        setParties([]);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      setParties([]);
    } finally {
      setLoadingParties(false);
    }
  };

  const fetchContainerTypes = async () => {
    setLoadingContainerTypes(true);
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
          setContainerTypes(
            data.map((type: any) => ({
              value: type.containerTypeId,
              label: `${type.typeCode} - ${type.typeName}`,
            }))
          );
        } else {
          console.error("Container types response is not an array:", data);
          setContainerTypes([
            { value: 1, label: "GP - General Purpose" },
            { value: 2, label: "HC - High Cube" },
            { value: 3, label: "RF - Refrigerated" },
          ]);
        }
      } else {
        setContainerTypes([
          { value: 1, label: "GP - General Purpose" },
          { value: 2, label: "HC - High Cube" },
          { value: 3, label: "RF - Refrigerated" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching container types:", error);
      setContainerTypes([
        { value: 1, label: "GP - General Purpose" },
        { value: 2, label: "HC - High Cube" },
        { value: 3, label: "RF - Refrigerated" },
      ]);
    } finally {
      setLoadingContainerTypes(false);
    }
  };

  const fetchContainerSizes = async () => {
    setLoadingContainerSizes(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupContainerSize/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "ContainerSizeId,SizeCode,Description",
          where: "IsActive == true",
          sortOn: "SizeCode",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setContainerSizes(
            data.map((size: any) => ({
              value: size.containerSizeId,
              label: size.sizeCode,
            }))
          );
        } else {
          console.error("Container sizes response is not an array:", data);
          setContainerSizes([
            { value: 1, label: "20ft" },
            { value: 2, label: "40ft" },
            { value: 3, label: "40ft HC" },
          ]);
        }
      } else {
        setContainerSizes([
          { value: 1, label: "20ft" },
          { value: 2, label: "40ft" },
          { value: 3, label: "40ft HC" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching container sizes:", error);
      setContainerSizes([
        { value: 1, label: "20ft" },
        { value: 2, label: "40ft" },
        { value: 3, label: "40ft HC" },
      ]);
    } finally {
      setLoadingContainerSizes(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UnLocation/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "unlocationId,ParentUNLocationId,UNCode,LocationName,IsCountry,IsSeaPort,IsDryPort,IsTerminal,IsCity,IsActive,Remarks,Version",
          where: "IsActive == true",
          sortOn: "LocationName",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setLocations(
            data.map((loc: any) => ({
              value: loc.unlocationId || loc.unlocationId,
              label: `${loc.uncode || loc.uncode || "N/A"} - ${
                loc.locationName || loc.LocationName
              }`,
            }))
          );
        } else {
          console.error("Locations response is not an array:", data);
          setLocations([]);
        }
      } else {
        console.error("Failed to fetch locations:", response.status);
        setLocations([]);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupCurrency/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "CurrencyId,CurrencyCode,CurrencyName,Symbol,IsDefault,IsActive,Version",
          where: "IsActive == true",
          sortOn: "CurrencyName",
          page: "1",
          pageSize: "200",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCurrencies(
            data.map((curr: any) => ({
              value: curr.currencyId,
              label: `${curr.currencyCode} - ${curr.currencyName}`,
            }))
          );
        } else {
          console.error("Currencies response is not an array:", data);
          setCurrencies([
            { value: 1, label: "USD - US Dollar" },
            { value: 2, label: "EUR - Euro" },
            { value: 3, label: "PKR - Pakistani Rupee" },
          ]);
        }
      } else {
        setCurrencies([
          { value: 1, label: "USD - US Dollar" },
          { value: 2, label: "EUR - Euro" },
          { value: 3, label: "PKR - Pakistani Rupee" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      setCurrencies([
        { value: 1, label: "USD - US Dollar" },
        { value: 2, label: "EUR - Euro" },
        { value: 3, label: "PKR - Pakistani Rupee" },
      ]);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const fetchForwardingAgents = async () => {
    setLoadingForwardingAgents(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "PartyId,PartyCode,PartyName",
          where: "IsActive == true", //&& IsAgent == true
          sortOn: "PartyName",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setForwardingAgents(
            data.map((agent: any) => ({
              value: agent.partyId,
              label: `${agent.partyCode} - ${agent.partyName}`,
            }))
          );
        } else {
          console.error("Forwarding agents response is not an array:", data);
          setForwardingAgents([]);
        }
      } else {
        console.error("Failed to fetch forwarding agents:", response.status);
        setForwardingAgents([]);
      }
    } catch (error) {
      console.error("Error fetching forwarding agents:", error);
      setForwardingAgents([]);
    } finally {
      setLoadingForwardingAgents(false);
    }
  };

  const fetchHsCodes = async () => {
    setLoadingHsCodes(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}HsCode/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select:
            "HsCodeId,ParentHsCodeId,Code,Description,Chapter,Heading,CustomsDutyRate,SalesTaxRate,RegulatoryDutyRate,AdditionalDutyRate,UoM,IsActive,Remarks,EffectiveFrom,ValidTill,Version",
          where: "IsActive == true",
          sortOn: "Code",
          page: "1",
          pageSize: "500",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setHsCodes(
            data.map((hs: any) => ({
              value: hs.code,
              label: `${hs.code} - ${hs.description}`,
            }))
          );
        } else {
          console.error("HS Codes response is not an array:", data);
          setHsCodes([]);
        }
      } else {
        console.error("Failed to fetch HS codes:", response.status);
        setHsCodes([]);
      }
    } catch (error) {
      console.error("Error fetching HS codes:", error);
      setHsCodes([]);
    } finally {
      setLoadingHsCodes(false);
    }
  };

  const fetchFreightTypes = async () => {
    setLoadingFreightTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=Freight_Types"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          // Convert object to array, filtering out empty values
          const freightTypesArray = Object.entries(data)
            .filter(
              ([key, value]) => typeof value === "string" && value.trim() !== ""
            ) // Filter out empty values
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          if (freightTypesArray.length > 0) {
            setFreightTypes(freightTypesArray);
          } else {
            // Fallback if all values are empty
            console.error("Freight types response has no valid values:", data);
            setFreightTypes([
              { value: "PREPAID", label: "PREPAID" },
              { value: "COLLECT", label: "COLLECT" },
              { value: "THIRD_PARTY", label: "THIRD_PARTY" },
            ]);
          }
        } else {
          console.error("Freight types response is not an object:", data);
          setFreightTypes([
            { value: "PREPAID", label: "PREPAID" },
            { value: "COLLECT", label: "COLLECT" },
            { value: "THIRD_PARTY", label: "THIRD_PARTY" },
          ]);
        }
      } else {
        setFreightTypes([
          { value: "PREPAID", label: "PREPAID" },
          { value: "COLLECT", label: "COLLECT" },
          { value: "THIRD_PARTY", label: "THIRD_PARTY" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching freight types:", error);
      setFreightTypes([
        { value: "PREPAID", label: "PREPAID" },
        { value: "COLLECT", label: "COLLECT" },
        { value: "THIRD_PARTY", label: "THIRD_PARTY" },
      ]);
    } finally {
      setLoadingFreightTypes(false);
    }
  };

  const fetchMovementTypes = async () => {
    setLoadingMovementTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=Movement_Type"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          // Convert object to array, filtering out empty values
          const movementTypesArray = Object.entries(data)
            .filter(
              ([key, value]) => typeof value === "string" && value.trim() !== ""
            ) // Filter out empty values
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          if (movementTypesArray.length > 0) {
            setMovementTypes(movementTypesArray);
          } else {
            // Fallback if all values are empty
            console.error("Movement types response has no valid values:", data);
            setMovementTypes([
              { value: "PORT_TO_PORT", label: "PORT_TO_PORT" },
              { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
              { value: "DOOR_TO_PORT", label: "DOOR_TO_PORT" },
              { value: "PORT_TO_DOOR", label: "PORT_TO_DOOR" },
            ]);
          }
        } else {
          console.error("Movement types response is not an object:", data);
          setMovementTypes([
            { value: "PORT_TO_PORT", label: "PORT_TO_PORT" },
            { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
            { value: "DOOR_TO_PORT", label: "DOOR_TO_PORT" },
            { value: "PORT_TO_DOOR", label: "PORT_TO_DOOR" },
          ]);
        }
      } else {
        setMovementTypes([
          { value: "PORT_TO_PORT", label: "PORT_TO_PORT" },
          { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
          { value: "DOOR_TO_PORT", label: "DOOR_TO_PORT" },
          { value: "PORT_TO_DOOR", label: "PORT_TO_DOOR" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching movement types:", error);
      setMovementTypes([
        { value: "PORT_TO_PORT", label: "PORT_TO_PORT" },
        { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
        { value: "DOOR_TO_PORT", label: "DOOR_TO_PORT" },
        { value: "PORT_TO_DOOR", label: "PORT_TO_DOOR" },
      ]);
    } finally {
      setLoadingMovementTypes(false);
    }
  };

  useEffect(() => {
    //fetchJobs();
    fetchParties();
    fetchContainerTypes();
    fetchContainerSizes();
    fetchLocations();
    fetchCurrencies();
    fetchForwardingAgents();
    fetchHsCodes();
    fetchFreightTypes();
    fetchMovementTypes();
  }, []);

  // Set form values when defaultState changes (edit mode)
  useEffect(() => {
    if (type === "edit" && defaultState) {
      const mappedValues = mapApiResponseToFormValues(defaultState);
      form.reset(mappedValues);
    }
  }, [defaultState, type, form]);

  const calculateNetWeight = () => {
    const gross = equipmentForm.watch("grossWeight") || 0;
    const tare = equipmentForm.watch("tareWeight") || 0;
    const net = gross - tare;
    equipmentForm.setValue("netWeight", net > 0 ? net : 0);
  };

  const handleAddEquipment = (data: BlEquipmentFormValues) => {
    if (editingEquipment !== null) {
      const updatedEquipments = [...equipments];
      updatedEquipments[editingEquipment] = data;
      setEquipments(updatedEquipments);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    } else {
      setEquipments([...equipments, data]);
      toast({ title: "Success", description: "Equipment added successfully" });
    }

    equipmentForm.reset({
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      freeDays: 0,
      afterFreeDaysTarrifAmount: 0,
      afterFreeDaysTarrifAmountLC: 0,
    });
    setShowEquipmentForm(false);
    setEditingEquipment(null);
  };

  const handleEditEquipment = (index: number) => {
    setEditingEquipment(index);
    equipmentForm.reset(equipments[index]);
    setShowEquipmentForm(true);
  };

  const handleDeleteEquipment = (index: number) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      setEquipments(equipments.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
    }
  };

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    const stepFields = STEPS[step - 1].fields;
    if (stepFields.length === 0) return true; // Equipment step

    const result = await form.trigger(stepFields as any);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: BlMasterFormValues) => {
    if (equipments.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one container/equipment",
      });
      setCurrentStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // Prepare the payload with exact API field casing
      // Send null instead of 0 for optional fields when not selected
      const payload: any = {
        companyId: values.companyId || 1,
        jobId: values.jobId || null,
        mblNumber: values.mblNumber,
        HblNumber: values.hblNumber || "",
        blDate: values.blDate,
        ShipperPartyId: values.shipperPartyId,
        ConsigneePartyId: values.consigneePartyId,
        notifyPartyId: values.notifyPartyId || null,
        noOfPackages: values.noOfPackages || 0,
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,
        volumeCbm: values.volumeCbm || 0,
        polid: values.polid || 0,
        podid: values.podid || 0,
        VesselName: values.vesselName || "",
        Voyage: values.voyage || "",
        forwardingAgentId: values.forwardingAgentId || null,
        FreightType: values.freightType || "",
        Movement: values.movement || "",
        blcurrencyId: values.blCurrencyId || 0,
        placeOfIssueId: values.placeOfIssueId || 0,
        dateOfIssue: values.dateOfIssue || "",
        MarksAndContainersNo: values.marksAndContainersNo || "",
        Blnotes: values.blNotes || "",
        status: values.status || "DRAFT",
        version: values.version || 0,
        blEquipments: equipments.map((equipment) => ({
          blEquipmentId: equipment.blEquipmentId || 0,
          blMasterId: values.blMasterId || 0,
          containerNo: equipment.containerNo,
          volumeCbm: equipment.volumeCbm || 0,
          containerTypeId: equipment.containerTypeId,
          containerSizeId: equipment.containerSizeId,
          sealNo: equipment.sealNo || "",
          grossWeight: equipment.grossWeight || 0,
          tareWeight: equipment.tareWeight || 0,
          netWeight: equipment.netWeight || 0,
          descriptionOfGoods: equipment.descriptionOfGoods || "",
          hsCodes: equipment.hsCodes || "",
          freeDays: equipment.freeDays || 0,
          afterFreeDaysTarrifAmount: equipment.afterFreeDaysTarrifAmount || 0,
          afterFreeDaysTarrifAmountLc:
            equipment.afterFreeDaysTarrifAmountLC || 0,
          tarrifCurrencyId: equipment.tarrifCurrencyId || null,
          version: equipment.version || 0,
        })),
      };

      // Add blMasterId if editing
      if (type === "edit" && values.blMasterId) {
        payload.blMasterId = values.blMasterId;
      }

      // Remove any empty string values that should be null
      // Convert empty strings to null for optional fields
      if (payload.HblNumber === "") payload.HblNumber = null;
      if (payload.VesselName === "") payload.VesselName = null;
      if (payload.Voyage === "") payload.Voyage = null;
      if (payload.FreightType === "") payload.FreightType = null;
      if (payload.Movement === "") payload.Movement = null;
      if (payload.MarksAndContainersNo === "")
        payload.MarksAndContainersNo = null;
      if (payload.Blnotes === "") payload.Blnotes = null;

      // Also update equipment fields
      payload.blEquipments.forEach((equipment: any) => {
        if (equipment.sealNo === "") equipment.sealNo = null;
        if (equipment.descriptionOfGoods === "")
          equipment.descriptionOfGoods = null;
        if (equipment.hsCodes === "") equipment.hsCodes = null;
      });

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const blMasterResponse = await fetch(`${baseUrl}Bl`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!blMasterResponse.ok) {
        const errorText = await blMasterResponse.text();
        throw new Error(errorText || "Failed to save BL Master");
      }

      const blMasterResult = await blMasterResponse.json();

      toast({
        title: "Success!",
        description: `BL ${
          type === "edit" ? "updated" : "created"
        } successfully`,
      });

      handleAddEdit(blMasterResult);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50'>
      <div className='container mx-auto px-4 py-5 max-w-7xl'>
        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
              {type === "edit"
                ? "Edit Bill of Lading"
                : "Create Bill of Lading"}
            </h1>
            <p className='text-muted-foreground mt-1 text-xs'>
              Step {currentStep} of {STEPS.length}:{" "}
              {STEPS[currentStep - 1].name}
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.back()}
            disabled={isSubmitting}
            className='h-9 hover:bg-red-50 hover:text-red-600'
          >
            <X className='h-4 w-4 mr-1.5' />
            Cancel
          </Button>
        </div>

        {/* Progress Bar */}
        <div className='mb-6'>
          <Progress value={progress} className='h-2' />
        </div>

        {/* Step Indicators */}
        <div className='flex justify-between mb-6 overflow-x-auto pb-2'>
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all ${
                  isCurrent ? "scale-110" : ""
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className='h-5 w-5' />
                  ) : (
                    <StepIcon className='h-5 w-5' />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center ${
                    isCurrent ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {/* Step Content */}
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-600 rounded-lg shadow-sm'>
                    {(() => {
                      const StepIcon = STEPS[currentStep - 1].icon;
                      return <StepIcon className='h-5 w-5 text-white' />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      {STEPS[currentStep - 1].name}
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      {currentStep === 1 &&
                        "Enter basic bill of lading information"}
                      {currentStep === 2 &&
                        "Select shipper, consignee, and other parties"}
                      {currentStep === 3 &&
                        "Enter shipment routing and vessel details"}
                      {currentStep === 4 &&
                        "Enter issue information and cargo details"}
                      {currentStep === 5 &&
                        "Add marks, notes, and additional information"}
                      {currentStep === 6 && "Add container/equipment details"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='pt-6 pb-4 px-5 min-h-[400px]'>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='mblNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            MBL Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter MBL number'
                              {...field}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='hblNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            HBL Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter HBL number'
                              {...field}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='blDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            BL Date
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='date'
                              {...field}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='jobId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Job Reference
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={jobs}
                              value={jobs.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingJobs ? "Loading..." : "Select Job"
                              }
                              isClearable
                              isLoading={loadingJobs}
                              isDisabled={loadingJobs}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Status
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={[
                                { value: "DRAFT", label: "Draft" },
                                { value: "ISSUED", label: "Issued" },
                                { value: "SURRENDERED", label: "Surrendered" },
                                { value: "AMENDED", label: "Amended" },
                                { value: "CANCELLED", label: "Cancelled" },
                              ]}
                              value={{ value: field.value, label: field.value }}
                              onChange={(val) => field.onChange(val?.value)}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='blCurrencyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            BL Currency
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={currencies}
                              value={currencies.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingCurrencies
                                  ? "Loading..."
                                  : "Select Currency"
                              }
                              isClearable
                              isLoading={loadingCurrencies}
                              isDisabled={loadingCurrencies}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Parties */}
                {currentStep === 2 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='shipperPartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Shipper
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingParties ? "Loading..." : "Select Shipper"
                              }
                              isLoading={loadingParties}
                              isDisabled={loadingParties}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='consigneePartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Consignee
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingParties
                                  ? "Loading..."
                                  : "Select Consignee"
                              }
                              isLoading={loadingParties}
                              isDisabled={loadingParties}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='notifyPartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Notify Party
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingParties
                                  ? "Loading..."
                                  : "Select Notify Party"
                              }
                              isClearable
                              isLoading={loadingParties}
                              isDisabled={loadingParties}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='forwardingAgentId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Forwarding Agent
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={forwardingAgents}
                              value={forwardingAgents.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingForwardingAgents
                                  ? "Loading..."
                                  : "Select Agent"
                              }
                              isClearable
                              isLoading={loadingForwardingAgents}
                              isDisabled={loadingForwardingAgents}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Shipment */}
                {currentStep === 3 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='polid'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Port of Loading (POL)
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={locations}
                              value={locations.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingLocations ? "Loading..." : "Select POL"
                              }
                              isClearable
                              isLoading={loadingLocations}
                              isDisabled={loadingLocations}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='podid'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Port of Discharge (POD)
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={locations}
                              value={locations.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingLocations ? "Loading..." : "Select POD"
                              }
                              isClearable
                              isLoading={loadingLocations}
                              isDisabled={loadingLocations}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='vesselName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Vessel Name
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter vessel name'
                              {...field}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='voyage'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Voyage Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter voyage number'
                              {...field}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='freightType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Freight Type
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={freightTypes}
                              value={freightTypes.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingFreightTypes
                                  ? "Loading..."
                                  : "Select Freight Type"
                              }
                              isLoading={loadingFreightTypes}
                              isDisabled={loadingFreightTypes}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='movement'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Movement Type
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={movementTypes}
                              value={movementTypes.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingMovementTypes
                                  ? "Loading..."
                                  : "Select Movement"
                              }
                              isLoading={loadingMovementTypes}
                              isDisabled={loadingMovementTypes}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "40px",
                                  fontSize: "14px",
                                }),
                              }}
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Issue & Cargo */}
                {currentStep === 4 && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-sm font-semibold mb-3 text-gray-900'>
                        Issue Information
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                        <FormField
                          control={form.control}
                          name='placeOfIssueId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                Place of Issue
                                <span className='text-red-500 text-base'>
                                  *
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Select
                                  options={locations}
                                  value={locations.find(
                                    (option) => option.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  placeholder={
                                    loadingLocations
                                      ? "Loading..."
                                      : "Select Place of Issue"
                                  }
                                  isClearable
                                  isLoading={loadingLocations}
                                  isDisabled={loadingLocations}
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      minHeight: "40px",
                                      fontSize: "14px",
                                    }),
                                  }}
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='dateOfIssue'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                Date of Issue
                                <span className='text-red-500 text-base'>
                                  *
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-10 text-sm'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className='text-sm font-semibold mb-3 text-gray-900'>
                        Cargo Information
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                        <FormField
                          control={form.control}
                          name='noOfPackages'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Number of Packages
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-10 text-sm'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='grossWeight'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Gross Weight (kg)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='0.00'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-10 text-sm'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='netWeight'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Net Weight (kg)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='0.00'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-10 text-sm'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='volumeCbm'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Volume (CBM)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  placeholder='0.00'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-10 text-sm'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Additional Info */}
                {currentStep === 5 && (
                  <div className='grid grid-cols-1 gap-5'>
                    <FormField
                      control={form.control}
                      name='marksAndContainersNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Marks & Container Numbers
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter marks and container numbers...'
                              className='min-h-[120px] text-sm'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-gray-500'>
                            Shipping marks and container identification
                          </FormDescription>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='blNotes'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            BL Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter any additional notes or remarks...'
                              className='min-h-[120px] text-sm'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-gray-500'>
                            Additional remarks or special instructions
                          </FormDescription>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 6: Equipment */}
                {currentStep === 6 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-semibold text-gray-900'>
                        Container/Equipment Details ({equipments.length})
                      </h3>
                      <Button
                        type='button'
                        onClick={() => {
                          setShowEquipmentForm(!showEquipmentForm);
                          setEditingEquipment(null);
                          equipmentForm.reset({
                            grossWeight: 0,
                            tareWeight: 0,
                            netWeight: 0,
                            volumeCbm: 0,
                            freeDays: 0,
                            afterFreeDaysTarrifAmount: 0,
                            afterFreeDaysTarrifAmountLC: 0,
                          });
                        }}
                        size='sm'
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Add Equipment
                      </Button>
                    </div>

                    {showEquipmentForm && (
                      <Card className='border-2 border-green-200 bg-green-50/30'>
                        <CardContent className='pt-5 pb-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                            <FormField
                              control={equipmentForm.control}
                              name='containerNo'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Container Number
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='ABCD1234567'
                                      {...field}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='containerTypeId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Container Type
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={containerTypes}
                                      value={containerTypes.find(
                                        (opt) => opt.value === field.value
                                      )}
                                      onChange={(val) =>
                                        field.onChange(val?.value)
                                      }
                                      placeholder='Select Type'
                                      styles={{
                                        control: (base) => ({
                                          ...base,
                                          minHeight: "40px",
                                          fontSize: "14px",
                                        }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='containerSizeId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Container Size
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={containerSizes}
                                      value={containerSizes.find(
                                        (opt) => opt.value === field.value
                                      )}
                                      onChange={(val) =>
                                        field.onChange(val?.value)
                                      }
                                      placeholder='Select Size'
                                      styles={{
                                        control: (base) => ({
                                          ...base,
                                          minHeight: "40px",
                                          fontSize: "14px",
                                        }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='sealNo'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Seal Number
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='Enter seal number'
                                      {...field}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='volumeCbm'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Volume (CBM)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='grossWeight'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Gross Weight (kg)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        calculateNetWeight();
                                      }}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='tareWeight'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Tare Weight (kg)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        calculateNetWeight();
                                      }}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='netWeight'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Net Weight (kg)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      disabled
                                      className='h-10 text-sm bg-gray-100'
                                    />
                                  </FormControl>
                                  <FormDescription className='text-xs'>
                                    Auto-calculated
                                  </FormDescription>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='descriptionOfGoods'
                              render={({ field }) => (
                                <FormItem className='md:col-span-2'>
                                  <FormLabel className='text-sm font-medium'>
                                    Description of Goods
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder='Enter goods description...'
                                      {...field}
                                      className='min-h-[60px] text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='hsCodes'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    HS Codes
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={hsCodes}
                                      value={hsCodes.find(
                                        (option) => option.value === field.value
                                      )}
                                      onChange={(val) =>
                                        field.onChange(val?.value)
                                      }
                                      placeholder={
                                        loadingHsCodes
                                          ? "Loading..."
                                          : "Select HS Code"
                                      }
                                      isClearable
                                      isLoading={loadingHsCodes}
                                      isDisabled={loadingHsCodes}
                                      styles={{
                                        control: (base) => ({
                                          ...base,
                                          minHeight: "40px",
                                          fontSize: "14px",
                                        }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='freeDays'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Free Days
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      placeholder='0'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='afterFreeDaysTarrifAmount'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Tarrif Amount
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='afterFreeDaysTarrifAmountLC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Tarrif Amount LC
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='tarrifCurrencyId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Tarrif Currency
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={currencies}
                                      value={currencies.find(
                                        (option) => option.value === field.value
                                      )}
                                      onChange={(val) =>
                                        field.onChange(val?.value)
                                      }
                                      placeholder='Select Currency'
                                      isClearable
                                      styles={{
                                        control: (base) => ({
                                          ...base,
                                          minHeight: "40px",
                                          fontSize: "14px",
                                        }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              type='button'
                              onClick={equipmentForm.handleSubmit(
                                handleAddEquipment
                              )}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <Save className='h-4 w-4 mr-1.5' />
                              {editingEquipment !== null
                                ? "Update"
                                : "Add"}{" "}
                              Equipment
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowEquipmentForm(false);
                                setEditingEquipment(null);
                                equipmentForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {equipments.length > 0 ? (
                      <div className='border rounded-lg overflow-hidden'>
                        <Table>
                          <TableHeader>
                            <TableRow className='bg-gray-50'>
                              <TableHead className='text-xs font-semibold'>
                                Container No
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Type
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Size
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Volume
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Free Days
                              </TableHead>
                              <TableHead className='text-xs font-semibold text-center'>
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {equipments.map((equipment, index) => (
                              <TableRow
                                key={index}
                                className='hover:bg-gray-50'
                              >
                                <TableCell className='text-sm font-medium'>
                                  {equipment.containerNo}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {containerTypes.find(
                                    (t) => t.value === equipment.containerTypeId
                                  )?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {containerSizes.find(
                                    (s) => s.value === equipment.containerSizeId
                                  )?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.volumeCbm?.toFixed(2) || "0.00"}{" "}
                                  CBM
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.freeDays || 0}
                                </TableCell>
                                <TableCell className='text-center'>
                                  <div className='flex gap-2 justify-center'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleEditEquipment(index)}
                                      className='h-8 w-8 p-0 hover:bg-blue-50'
                                    >
                                      <Package className='h-4 w-4 text-blue-600' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        handleDeleteEquipment(index)
                                      }
                                      className='h-8 w-8 p-0 hover:bg-red-50'
                                    >
                                      <Trash2 className='h-4 w-4 text-red-600' />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className='text-center py-12 text-gray-500 border rounded-lg'>
                        <Container className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                        <p className='text-sm font-medium'>
                          No equipment added yet
                        </p>
                        <p className='text-xs mt-1'>
                          Click Add Equipment to add containers
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <Card className='border shadow-lg bg-white'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <div className='text-sm text-gray-600'>
                    {currentStep === 6 && (
                      <span>
                        <span className='font-medium'>{equipments.length}</span>{" "}
                        equipment(s) added
                      </span>
                    )}
                  </div>
                  <div className='flex gap-3'>
                    {currentStep > 1 && (
                      <Button
                        type='button'
                        variant='outline'
                        onClick={prevStep}
                        disabled={isSubmitting}
                        size='sm'
                        className='h-10'
                      >
                        <ChevronLeft className='h-4 w-4 mr-1.5' />
                        Previous
                      </Button>
                    )}

                    {currentStep < STEPS.length ? (
                      <Button
                        type='button'
                        onClick={nextStep}
                        size='sm'
                        className='h-10 bg-blue-600 hover:bg-blue-700 text-white'
                      >
                        Next
                        <ChevronRight className='h-4 w-4 ml-1.5' />
                      </Button>
                    ) : (
                      <Button
                        type='submit'
                        disabled={isSubmitting || equipments.length === 0}
                        className='gap-2 min-w-[140px] h-10 px-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50'
                        size='sm'
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className='h-4 w-4' />
                            {type === "edit" ? "Update BL" : "Create BL"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
