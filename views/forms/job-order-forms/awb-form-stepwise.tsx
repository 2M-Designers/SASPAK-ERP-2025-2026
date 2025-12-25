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
  Plane,
  Package,
  Plus,
  Trash2,
  X,
  Users,
  MapPin,
  FileText,
  Box,
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

// AWB Master Schema with ALL new fields
const awbMasterSchema = z.object({
  awbId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional().nullable(),
  mawbNumber: z.string().min(1, "MAWB Number is required"),
  hawbNumber: z.string().min(1, "HAWB Number is required"),
  awbType: z.string().min(1, "AWB Type is required"),
  awbDate: z.string().min(1, "AWB Date is required"),
  airlinePartyId: z.number().min(1, "Airline is required"),
  shipperPartyId: z.number().min(1, "Shipper is required"),
  consigneePartyId: z.number().min(1, "Consignee is required"),
  notifyPartyId: z.number().optional(),
  noOfPackages: z.number().min(0, "Must be 0 or greater").default(0),
  grossWeight: z.number().min(0, "Must be 0 or greater").default(0),
  netWeight: z.number().min(0, "Must be 0 or greater").default(0),
  volumeCbm: z.number().min(0, "Must be 0 or greater").default(0),
  originAirportId: z.number().min(1, "Origin Airport is required"),
  destinationAirportId: z.number().min(1, "Destination Airport is required"),
  flightNumber: z.string().min(1, "Flight Number is required"),
  forwardingAgentId: z.number().optional(),
  freightType: z.string().min(1, "Freight Type is required"),
  movement: z.string().min(1, "Movement Type is required"),
  awbCurrencyId: z.number().min(1, "AWB Currency is required"),
  placeOfIssueId: z.number().min(1, "Place of Issue is required"),
  dateOfIssue: z.string().min(1, "Date of Issue is required"),
  marksAndCargoNo: z.string().optional(),
  awbNotes: z.string().optional(),
  status: z.string().default("DRAFT"),
  version: z.number().optional(),
});

// AWB Equipment Schema with ALL new fields
const awbEquipmentSchema = z.object({
  awbEquipmentId: z.number().optional(),
  awbId: z.number().optional(),
  uldNumber: z.string().min(1, "ULD number is required"),
  packageCount: z.number().min(0).default(0),
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  volumeCbm: z.number().min(0).default(0),
  dimensions: z.string().optional(),
  descriptionOfGoods: z.string().optional(),
  hsCodes: z.string().min(1, "HS Code is required"),
  freeDays: z.number().min(0).default(0),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

type AwbMasterFormValues = z.infer<typeof awbMasterSchema>;
type AwbEquipmentFormValues = z.infer<typeof awbEquipmentSchema>;

const STEPS = [
  {
    id: 1,
    name: "Basic Info",
    icon: Plane,
    fields: [
      "mawbNumber",
      "hawbNumber",
      "awbDate",
      "jobId",
      "awbType",
      "status",
      "awbCurrencyId",
    ],
  },
  {
    id: 2,
    name: "Parties",
    icon: Users,
    fields: [
      "airlinePartyId",
      "shipperPartyId",
      "consigneePartyId",
      "notifyPartyId",
      "forwardingAgentId",
    ],
  },
  {
    id: 3,
    name: "Flight & Route",
    icon: MapPin,
    fields: [
      "originAirportId",
      "destinationAirportId",
      "flightNumber",
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
    fields: ["marksAndCargoNo", "awbNotes"],
  },
  { id: 6, name: "ULD/Equipment", icon: Box, fields: [] },
];

export default function AwbForm({
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
  const [airlines, setAirlines] = useState<any[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [forwardingAgents, setForwardingAgents] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<any[]>([]);
  const [freightTypes, setFreightTypes] = useState<any[]>([]);
  const [movementTypes, setMovementTypes] = useState<any[]>([]);
  const [awbTypes, setAwbTypes] = useState<any[]>([]);

  // Loading states
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingAirlines, setLoadingAirlines] = useState(false);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingForwardingAgents, setLoadingForwardingAgents] = useState(false);
  const [loadingHsCodes, setLoadingHsCodes] = useState(false);
  const [loadingFreightTypes, setLoadingFreightTypes] = useState(false);
  const [loadingMovementTypes, setLoadingMovementTypes] = useState(false);
  const [loadingAwbTypes, setLoadingAwbTypes] = useState(false);

  // Equipment management
  const [equipments, setEquipments] = useState<AwbEquipmentFormValues[]>([]);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);

  const form = useForm<AwbMasterFormValues>({
    resolver: zodResolver(awbMasterSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      status: "DRAFT",
      noOfPackages: 0,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      ...defaultState,
      awbDate: defaultState?.awbDate
        ? new Date(defaultState.awbDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dateOfIssue: defaultState?.dateOfIssue
        ? new Date(defaultState.dateOfIssue).toISOString().split("T")[0]
        : "",
    },
  });

  const equipmentForm = useForm<AwbEquipmentFormValues>({
    resolver: zodResolver(awbEquipmentSchema),
    mode: "onChange",
    defaultValues: {
      packageCount: 0,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      freeDays: 0,
    },
  });

  // Helper function to map API response to form values
  const mapApiResponseToFormValues = (apiData: any): AwbMasterFormValues => {
    if (!apiData) return {} as AwbMasterFormValues;

    // Map the equipment data from API
    if (apiData.awbEquipments && Array.isArray(apiData.awbEquipments)) {
      const equipmentData = apiData.awbEquipments.map((equip: any) => ({
        awbEquipmentId: equip.awbEquipmentId || 0,
        awbId: equip.awbId || 0,
        uldNumber: equip.uldNumber || "",
        packageCount: equip.packageCount || 0,
        grossWeight: equip.grossWeight || 0,
        netWeight: equip.netWeight || 0,
        volumeCbm: equip.volumeCbm || 0,
        dimensions: equip.dimensions || "",
        descriptionOfGoods: equip.descriptionOfGoods || "",
        hsCodes: equip.hsCodes || "",
        freeDays: equip.freeDays || 0,
        remarks: equip.remarks || "",
        version: equip.version || 0,
      }));
      setEquipments(equipmentData);
    }

    // Map main form data
    return {
      awbId: apiData.awbId || 0,
      companyId: apiData.companyId || 1,
      jobId: apiData.jobId || null,
      mawbNumber: apiData.mawbNumber || "",
      hawbNumber: apiData.hawbNumber || "",
      awbType: apiData.awbType || "",
      awbDate: apiData.awbDate
        ? new Date(apiData.awbDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      airlinePartyId: apiData.airlinePartyId || 0,
      shipperPartyId: apiData.shipperPartyId || 0,
      consigneePartyId: apiData.consigneePartyId || 0,
      notifyPartyId: apiData.notifyPartyId || null,
      noOfPackages: apiData.noOfPackages || 0,
      grossWeight: apiData.grossWeight || 0,
      netWeight: apiData.netWeight || 0,
      volumeCbm: apiData.volumeCbm || 0,
      originAirportId: apiData.originAirportId || 0,
      destinationAirportId: apiData.destinationAirportId || 0,
      flightNumber: apiData.flightNumber || "",
      forwardingAgentId: apiData.forwardingAgentId || null,
      freightType: apiData.freightType || "",
      movement: apiData.movement || "",
      awbCurrencyId: apiData.awbCurrencyId || 0,
      placeOfIssueId: apiData.placeOfIssueId || 0,
      dateOfIssue: apiData.dateOfIssue
        ? new Date(apiData.dateOfIssue).toISOString().split("T")[0]
        : "",
      marksAndCargoNo: apiData.marksAndCargoNo || "",
      awbNotes: apiData.awbNotes || "",
      status: apiData.status || "DRAFT",
      version: apiData.version || 0,
    };
  };

  // Fetch functions with proper error handling
  const fetchJobs = async () => {
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
          setJobs([]);
        }
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

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
          setParties([]);
        }
      } else {
        setParties([]);
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      setParties([]);
    } finally {
      setLoadingParties(false);
    }
  };

  const fetchAirlines = async () => {
    setLoadingAirlines(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "PartyId,PartyCode,PartyName",
          where: "IsActive == true", // && IsAirline == true
          sortOn: "PartyName",
          page: "1",
          pageSize: "1000",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAirlines(
            data.map((airline: any) => ({
              value: airline.partyId,
              label: `${airline.partyCode} - ${airline.partyName}`,
            }))
          );
        } else {
          setAirlines([]);
        }
      } else {
        setAirlines([]);
      }
    } catch (error) {
      console.error("Error fetching airlines:", error);
      setAirlines([]);
    } finally {
      setLoadingAirlines(false);
    }
  };

  const fetchAirports = async () => {
    setLoadingAirports(true);
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
          setAirports(
            data.map((loc: any) => ({
              value: loc.unlocationId || loc.unlocationId,
              label: `${loc.uncode || loc.uncode || "N/A"} - ${
                loc.locationName || loc.LocationName
              }`,
            }))
          );
        } else {
          setAirports([]);
        }
      } else {
        setAirports([]);
      }
    } catch (error) {
      console.error("Error fetching airports:", error);
      setAirports([]);
    } finally {
      setLoadingAirports(false);
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
          where: "IsActive == true",
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
          setForwardingAgents([]);
        }
      } else {
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
          setHsCodes([]);
        }
      } else {
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
          const freightTypesArray = Object.entries(data)
            .filter(
              ([key, value]) => typeof value === "string" && value.trim() !== ""
            )
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          if (freightTypesArray.length > 0) {
            setFreightTypes(freightTypesArray);
          } else {
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
          const movementTypesArray = Object.entries(data)
            .filter(
              ([key, value]) => typeof value === "string" && value.trim() !== ""
            )
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          if (movementTypesArray.length > 0) {
            setMovementTypes(movementTypesArray);
          } else {
            setMovementTypes([
              { value: "AIRPORT_TO_AIRPORT", label: "AIRPORT_TO_AIRPORT" },
              { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
              { value: "DOOR_TO_AIRPORT", label: "DOOR_TO_AIRPORT" },
              { value: "AIRPORT_TO_DOOR", label: "AIRPORT_TO_DOOR" },
            ]);
          }
        } else {
          setMovementTypes([
            { value: "AIRPORT_TO_AIRPORT", label: "AIRPORT_TO_AIRPORT" },
            { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
            { value: "DOOR_TO_AIRPORT", label: "DOOR_TO_AIRPORT" },
            { value: "AIRPORT_TO_DOOR", label: "AIRPORT_TO_DOOR" },
          ]);
        }
      } else {
        setMovementTypes([
          { value: "AIRPORT_TO_AIRPORT", label: "AIRPORT_TO_AIRPORT" },
          { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
          { value: "DOOR_TO_AIRPORT", label: "DOOR_TO_AIRPORT" },
          { value: "AIRPORT_TO_DOOR", label: "AIRPORT_TO_DOOR" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching movement types:", error);
      setMovementTypes([
        { value: "AIRPORT_TO_AIRPORT", label: "AIRPORT_TO_AIRPORT" },
        { value: "DOOR_TO_DOOR", label: "DOOR_TO_DOOR" },
        { value: "DOOR_TO_AIRPORT", label: "DOOR_TO_AIRPORT" },
        { value: "AIRPORT_TO_DOOR", label: "AIRPORT_TO_DOOR" },
      ]);
    } finally {
      setLoadingMovementTypes(false);
    }
  };

  const fetchAwbTypes = async () => {
    setLoadingAwbTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=AWB_Type"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          const awbTypesArray = Object.entries(data)
            .filter(
              ([key, value]) => typeof value === "string" && value.trim() !== ""
            )
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          if (awbTypesArray.length > 0) {
            setAwbTypes(awbTypesArray);
          } else {
            setAwbTypes([
              { value: "MASTER", label: "MASTER" },
              { value: "HOUSE", label: "HOUSE" },
              { value: "DIRECT", label: "DIRECT" },
            ]);
          }
        } else {
          setAwbTypes([
            { value: "MASTER", label: "MASTER" },
            { value: "HOUSE", label: "HOUSE" },
            { value: "DIRECT", label: "DIRECT" },
          ]);
        }
      } else {
        setAwbTypes([
          { value: "MASTER", label: "MASTER" },
          { value: "HOUSE", label: "HOUSE" },
          { value: "DIRECT", label: "DIRECT" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching AWB types:", error);
      setAwbTypes([
        { value: "MASTER", label: "MASTER" },
        { value: "HOUSE", label: "HOUSE" },
        { value: "DIRECT", label: "DIRECT" },
      ]);
    } finally {
      setLoadingAwbTypes(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchParties();
    fetchAirlines();
    fetchAirports();
    fetchCurrencies();
    fetchForwardingAgents();
    fetchHsCodes();
    fetchFreightTypes();
    fetchMovementTypes();
    fetchAwbTypes();
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
    const net = gross; // For air cargo, net weight is typically same as gross
    equipmentForm.setValue("netWeight", net > 0 ? net : 0);
  };

  const handleAddEquipment = (data: AwbEquipmentFormValues) => {
    if (editingEquipment !== null) {
      const updatedEquipments = [...equipments];
      updatedEquipments[editingEquipment] = data;
      setEquipments(updatedEquipments);
      toast({
        title: "Success",
        description: "ULD/Equipment updated successfully",
      });
    } else {
      setEquipments([...equipments, data]);
      toast({
        title: "Success",
        description: "ULD/Equipment added successfully",
      });
    }

    equipmentForm.reset({
      packageCount: 0,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      freeDays: 0,
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
    if (confirm("Are you sure you want to delete this ULD/equipment?")) {
      setEquipments(equipments.filter((_, i) => i !== index));
      toast({
        title: "Success",
        description: "ULD/Equipment deleted successfully",
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

  const onSubmit = async (values: AwbMasterFormValues) => {
    if (equipments.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one ULD/equipment",
      });
      setCurrentStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // Prepare the payload with exact API field casing
      const payload: any = {
        companyId: values.companyId || 1,
        jobId: values.jobId || null,
        mawbNumber: values.mawbNumber,
        hawbNumber: values.hawbNumber || "",
        awbType: values.awbType || "",
        awbDate: values.awbDate,
        airlinePartyId: values.airlinePartyId,
        shipperPartyId: values.shipperPartyId,
        consigneePartyId: values.consigneePartyId,
        notifyPartyId: values.notifyPartyId || null,
        noOfPackages: values.noOfPackages || 0,
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,
        volumeCbm: values.volumeCbm || 0,
        originAirportId: values.originAirportId || 0,
        destinationAirportId: values.destinationAirportId || 0,
        flightNumber: values.flightNumber || "",
        forwardingAgentId: values.forwardingAgentId || null,
        freightType: values.freightType || "",
        movement: values.movement || "",
        awbCurrencyId: values.awbCurrencyId || 0,
        placeOfIssueId: values.placeOfIssueId || 0,
        dateOfIssue: values.dateOfIssue || "",
        marksAndCargoNo: values.marksAndCargoNo || "",
        awbNotes: values.awbNotes || "",
        status: values.status || "DRAFT",
        version: values.version || 0,
        awbEquipments: equipments.map((equipment) => ({
          awbEquipmentId: equipment.awbEquipmentId || 0,
          awbId: values.awbId || 0,
          uldNumber: equipment.uldNumber,
          packageCount: equipment.packageCount || 0,
          grossWeight: equipment.grossWeight || 0,
          netWeight: equipment.netWeight || 0,
          volumeCbm: equipment.volumeCbm || 0,
          dimensions: equipment.dimensions || "",
          descriptionOfGoods: equipment.descriptionOfGoods || "",
          hsCodes: equipment.hsCodes || "",
          freeDays: equipment.freeDays || 0,
          remarks: equipment.remarks || "",
          version: equipment.version || 0,
        })),
      };

      // Add awbId if editing
      if (type === "edit" && values.awbId) {
        payload.awbId = values.awbId;
      }

      // Convert empty strings to null for optional fields
      if (payload.hawbNumber === "") payload.hawbNumber = null;
      if (payload.flightNumber === "") payload.flightNumber = null;
      if (payload.freightType === "") payload.freightType = null;
      if (payload.movement === "") payload.movement = null;
      if (payload.marksAndCargoNo === "") payload.marksAndCargoNo = null;
      if (payload.awbNotes === "") payload.awbNotes = null;

      payload.awbEquipments.forEach((equipment: any) => {
        if (equipment.dimensions === "") equipment.dimensions = null;
        if (equipment.descriptionOfGoods === "")
          equipment.descriptionOfGoods = null;
        if (equipment.hsCodes === "") equipment.hsCodes = null;
        if (equipment.remarks === "") equipment.remarks = null;
      });

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const awbMasterResponse = await fetch(`${baseUrl}Awb`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!awbMasterResponse.ok) {
        const errorText = await awbMasterResponse.text();
        throw new Error(errorText || "Failed to save AWB Master");
      }

      const awbMasterResult = await awbMasterResponse.json();

      toast({
        title: "Success!",
        description: `AWB ${
          type === "edit" ? "updated" : "created"
        } successfully`,
      });

      handleAddEdit(awbMasterResult);
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
              {type === "edit" ? "Edit Air Waybill" : "Create Air Waybill"}
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
                        "Enter basic air waybill information"}
                      {currentStep === 2 &&
                        "Select airline, shipper, consignee, and other parties"}
                      {currentStep === 3 && "Enter flight and routing details"}
                      {currentStep === 4 &&
                        "Enter issue information and cargo details"}
                      {currentStep === 5 &&
                        "Add marks, notes, and additional information"}
                      {currentStep === 6 && "Add ULD/equipment details"}
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
                      name='mawbNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            MAWB Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter MAWB number'
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
                      name='hawbNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            HAWB Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter HAWB number'
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
                      name='awbDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            AWB Date
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
                      name='awbType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            AWB Type
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={awbTypes}
                              value={awbTypes.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingAwbTypes ? "Loading..." : "Select Type"
                              }
                              isLoading={loadingAwbTypes}
                              isDisabled={loadingAwbTypes}
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
                                { value: "MANIFESTED", label: "Manifested" },
                                { value: "DEPARTED", label: "Departed" },
                                { value: "ARRIVED", label: "Arrived" },
                                { value: "DELIVERED", label: "Delivered" },
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
                      name='awbCurrencyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            AWB Currency
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
                      name='airlinePartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Airline
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={airlines}
                              value={airlines.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingAirlines
                                  ? "Loading..."
                                  : "Select Airline"
                              }
                              isLoading={loadingAirlines}
                              isDisabled={loadingAirlines}
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

                {/* Step 3: Flight & Route */}
                {currentStep === 3 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='originAirportId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Origin Airport
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={airports}
                              value={airports.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingAirports ? "Loading..." : "Select Origin"
                              }
                              isClearable
                              isLoading={loadingAirports}
                              isDisabled={loadingAirports}
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
                      name='destinationAirportId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Destination Airport
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={airports}
                              value={airports.find(
                                (option) => option.value === field.value
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={
                                loadingAirports
                                  ? "Loading..."
                                  : "Select Destination"
                              }
                              isClearable
                              isLoading={loadingAirports}
                              isDisabled={loadingAirports}
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
                      name='flightNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Flight Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter flight number (e.g., BA123)'
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
                                  options={airports}
                                  value={airports.find(
                                    (option) => option.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  placeholder={
                                    loadingAirports
                                      ? "Loading..."
                                      : "Select Place of Issue"
                                  }
                                  isClearable
                                  isLoading={loadingAirports}
                                  isDisabled={loadingAirports}
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
                      name='marksAndCargoNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Marks & Cargo Numbers
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter marks and cargo numbers...'
                              className='min-h-[120px] text-sm'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-gray-500'>
                            Shipping marks and cargo identification
                          </FormDescription>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='awbNotes'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            AWB Notes
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
                        ULD/Equipment Details ({equipments.length})
                      </h3>
                      <Button
                        type='button'
                        onClick={() => {
                          setShowEquipmentForm(!showEquipmentForm);
                          setEditingEquipment(null);
                          equipmentForm.reset({
                            packageCount: 0,
                            grossWeight: 0,
                            netWeight: 0,
                            volumeCbm: 0,
                            freeDays: 0,
                          });
                        }}
                        size='sm'
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Add ULD/Equipment
                      </Button>
                    </div>

                    {showEquipmentForm && (
                      <Card className='border-2 border-green-200 bg-green-50/30'>
                        <CardContent className='pt-5 pb-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                            <FormField
                              control={equipmentForm.control}
                              name='uldNumber'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    ULD Number
                                    <span className='text-red-500 text-base'>
                                      *
                                    </span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='AKE12345AB'
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
                              name='packageCount'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Package Count
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
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='dimensions'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Dimensions
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='L x W x H (cm)'
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
                              name='remarks'
                              render={({ field }) => (
                                <FormItem className='md:col-span-3'>
                                  <FormLabel className='text-sm font-medium'>
                                    Remarks
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder='Enter any remarks...'
                                      {...field}
                                      className='min-h-[60px] text-sm'
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
                                ULD Number
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Packages
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Volume
                              </TableHead>
                              <TableHead className='text-xs font-semibold'>
                                Weight
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
                                  {equipment.uldNumber}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.packageCount || 0}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.volumeCbm?.toFixed(2) || "0.00"}{" "}
                                  CBM
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.grossWeight?.toFixed(2) || "0.00"}{" "}
                                  kg
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
                        <Box className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                        <p className='text-sm font-medium'>
                          No ULD/equipment added yet
                        </p>
                        <p className='text-xs mt-1'>
                          Click Add ULD/Equipment to add units
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
                        ULD/equipment(s) added
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
                            {type === "edit" ? "Update AWB" : "Create AWB"}
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
