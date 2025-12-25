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
  Briefcase,
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
  DollarSign,
  Box,
  ShoppingCart,
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
import { Checkbox } from "@/components/ui/checkbox";

// Job Master Schema with ALL fields
const jobMasterSchema = z.object({
  jobId: z.number().optional(),
  companyId: z.number().default(1),
  jobNumber: z.string().min(1, "Job Number is required"),
  operationType: z.string().min(1, "Operation Type is required"),
  jobSubType: z.string().min(1, "Job Sub Type is required"),
  fclLclType: z.string().optional(),
  partyId: z.number().min(1, "Party is required"),
  shipperPartyId: z.number().optional(),
  consigneePartyId: z.number().optional(),
  notifyParty1Id: z.number().optional(),
  notifyParty2Id: z.number().optional(),
  principalId: z.number().optional(),
  overseasAgentId: z.number().optional(),
  transporterPartyId: z.number().optional(),
  depositorPartyId: z.number().optional(),
  originPortId: z.number().optional(),
  destinationPortId: z.number().optional(),
  vesselName: z.string().optional(),
  voyageNo: z.string().optional(),
  etdDate: z.string().optional(),
  etaDate: z.string().optional(),
  vesselArrival: z.string().optional(),
  deliverDate: z.string().optional(),
  freeDays: z.number().min(0).default(0),
  lastFreeDay: z.string().optional(),
  advanceRentPaidUpto: z.string().optional(),
  dispatchAddress: z.string().optional(),
  gdType: z.string().optional(),
  originalDocsReceivedOn: z.string().optional(),
  copyDocsReceivedOn: z.string().optional(),
  jobDescription: z.string().optional(),
  lcNumber: z.string().optional(),
  igmNumber: z.string().optional(),
  hblNumber: z.string().optional(),
  mawbNumber: z.string().optional(),
  hawbNumber: z.string().optional(),
  status: z.string().default("DRAFT"),
  remarks: z.string().optional(),
  createdBy: z.number().optional(),
  version: z.number().optional(),
});

// Job Equipment Schema with ALL fields
const jobEquipmentSchema = z.object({
  jobEquipmentId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional(),
  containerNo: z.string().min(1, "Container number is required"),
  containerTypeId: z.number().optional(),
  containerSizeId: z.number().optional(),
  sealNo: z.string().optional(),
  tareWeight: z.number().min(0).default(0),
  eirReceivedOn: z.string().optional(),
  rentInvoiceIssuedOn: z.string().optional(),
  containerRentFC: z.number().min(0).default(0),
  containerRentLC: z.number().min(0).default(0),
  damageDirtyFC: z.number().min(0).default(0),
  damageDirtyLC: z.number().min(0).default(0),
  refundAppliedOn: z.string().optional(),
  refundFC: z.number().min(0).default(0),
  refundLC: z.number().min(0).default(0),
  gateOutDate: z.string().optional(),
  gateInDate: z.string().optional(),
  eirSubmitted: z.boolean().default(false),
  eirDocumentId: z.number().optional(),
  status: z.string().optional(),
  version: z.number().optional(),
});

// Job Commodity Schema with ALL fields
const jobCommoditySchema = z.object({
  jobCommodityId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional(),
  description: z.string().min(1, "Description is required"),
  hsCodeId: z.number().optional(),
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  volumeCbm: z.number().min(0).default(0),
  declaredValueFC: z.number().min(0).default(0),
  declaredValueLC: z.number().min(0).default(0),
  currencyId: z.number().optional(),
  version: z.number().optional(),
});

// Job Charge Schema with ALL fields
const jobChargeSchema = z.object({
  jobChargeId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional(),
  chargeId: z.number().min(1, "Charge is required"),
  chargeBasis: z.string().optional(),
  jobEquipmentId: z.number().optional(),
  currencyId: z.number().optional(),
  exchangeRate: z.number().min(0).default(1),
  priceFC: z.number().min(0).default(0),
  priceLC: z.number().min(0).default(0),
  amountFC: z.number().min(0).default(0),
  amountLC: z.number().min(0).default(0),
  taxPercentage: z.number().min(0).default(0),
  taxFC: z.number().min(0).default(0),
  taxLC: z.number().min(0).default(0),
  isReimbursable: z.boolean().default(false),
  isVendorCost: z.boolean().default(false),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

type JobMasterFormValues = z.infer<typeof jobMasterSchema>;
type JobEquipmentFormValues = z.infer<typeof jobEquipmentSchema>;
type JobCommodityFormValues = z.infer<typeof jobCommoditySchema>;
type JobChargeFormValues = z.infer<typeof jobChargeSchema>;

const STEPS = [
  {
    id: 1,
    name: "Basic Info",
    icon: Briefcase,
    fields: [
      "jobNumber",
      "operationType",
      "jobSubType",
      "fclLclType",
      "partyId",
      "status",
    ],
  },
  {
    id: 2,
    name: "Parties",
    icon: Users,
    fields: [
      "shipperPartyId",
      "consigneePartyId",
      "notifyParty1Id",
      "notifyParty2Id",
      "principalId",
      "overseasAgentId",
      "transporterPartyId",
      "depositorPartyId",
    ],
  },
  {
    id: 3,
    name: "Routing & Vessel",
    icon: MapPin,
    fields: [
      "originPortId",
      "destinationPortId",
      "vesselName",
      "voyageNo",
      "etdDate",
      "etaDate",
      "vesselArrival",
      "deliverDate",
    ],
  },
  {
    id: 4,
    name: "Dates & Docs",
    icon: FileText,
    fields: [
      "freeDays",
      "lastFreeDay",
      "advanceRentPaidUpto",
      "gdType",
      "originalDocsReceivedOn",
      "copyDocsReceivedOn",
    ],
  },
  {
    id: 5,
    name: "Document Refs",
    icon: FileText,
    fields: [
      "lcNumber",
      "igmNumber",
      "hblNumber",
      "mawbNumber",
      "hawbNumber",
      "dispatchAddress",
    ],
  },
  {
    id: 6,
    name: "Additional Info",
    icon: FileText,
    fields: ["jobDescription", "remarks"],
  },
  { id: 7, name: "Equipment", icon: Container, fields: [] },
  { id: 8, name: "Commodity", icon: Box, fields: [] },
  { id: 9, name: "Charges", icon: DollarSign, fields: [] },
];

export default function JobForm({
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
  const [parties, setParties] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [containerSizes, setContainerSizes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [operationTypes, setOperationTypes] = useState<any[]>([]);
  const [jobSubTypes, setJobSubTypes] = useState<any[]>([]);
  const [fclLclTypes, setFclLclTypes] = useState<any[]>([]);
  const [gdTypes, setGdTypes] = useState<any[]>([]);
  const [chargeBasisOptions, setChargeBasisOptions] = useState<any[]>([]);

  // Loading states
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingContainerTypes, setLoadingContainerTypes] = useState(false);
  const [loadingContainerSizes, setLoadingContainerSizes] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingHsCodes, setLoadingHsCodes] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [loadingOperationTypes, setLoadingOperationTypes] = useState(false);
  const [loadingJobSubTypes, setLoadingJobSubTypes] = useState(false);
  const [loadingFclLclTypes, setLoadingFclLclTypes] = useState(false);
  const [loadingGdTypes, setLoadingGdTypes] = useState(false);
  const [loadingChargeBasis, setLoadingChargeBasis] = useState(false);

  // Child record management
  const [equipments, setEquipments] = useState<JobEquipmentFormValues[]>([]);
  const [commodities, setCommodities] = useState<JobCommodityFormValues[]>([]);
  const [jobCharges, setJobCharges] = useState<JobChargeFormValues[]>([]);
  
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [showCommodityForm, setShowCommodityForm] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);
  
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);
  const [editingCommodity, setEditingCommodity] = useState<number | null>(null);
  const [editingCharge, setEditingCharge] = useState<number | null>(null);

  const form = useForm<JobMasterFormValues>({
    resolver: zodResolver(jobMasterSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      status: "DRAFT",
      freeDays: 0,
      ...defaultState,
    },
  });

  const equipmentForm = useForm<JobEquipmentFormValues>({
    resolver: zodResolver(jobEquipmentSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      tareWeight: 0,
      containerRentFC: 0,
      containerRentLC: 0,
      damageDirtyFC: 0,
      damageDirtyLC: 0,
      refundFC: 0,
      refundLC: 0,
      eirSubmitted: false,
    },
  });

  const commodityForm = useForm<JobCommodityFormValues>({
    resolver: zodResolver(jobCommoditySchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      declaredValueFC: 0,
      declaredValueLC: 0,
    },
  });

  const chargeForm = useForm<JobChargeFormValues>({
    resolver: zodResolver(jobChargeSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      exchangeRate: 1,
      priceFC: 0,
      priceLC: 0,
      amountFC: 0,
      amountLC: 0,
      taxPercentage: 0,
      taxFC: 0,
      taxLC: 0,
      isReimbursable: false,
      isVendorCost: false,
    },
  });

  // Fetch functions
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
          setContainerTypes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching container types:", error);
      setContainerTypes([]);
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
          setContainerSizes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching container sizes:", error);
      setContainerSizes([]);
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
          select: "unlocationId,UNCode,LocationName,IsActive",
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
              value: loc.unlocationId,
              label: `${loc.uncode || "N/A"} - ${loc.locationName}`,
            }))
          );
        } else {
          setLocations([]);
        }
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
          setCurrencies(
            data.map((curr: any) => ({
              value: curr.currencyId,
              label: `${curr.currencyCode} - ${curr.currencyName}`,
            }))
          );
        } else {
          setCurrencies([]);
        }
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      setCurrencies([]);
    } finally {
      setLoadingCurrencies(false);
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
          select: "HsCodeId,Code,Description",
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
              value: hs.hsCodeId,
              label: `${hs.code} - ${hs.description}`,
            }))
          );
        } else {
          setHsCodes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching HS codes:", error);
      setHsCodes([]);
    } finally {
      setLoadingHsCodes(false);
    }
  };

  const fetchCharges = async () => {
    setLoadingCharges(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupCharge/GetList`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "ChargeId,ChargeName,ChargeCode",
          where: "IsActive == true",
          sortOn: "ChargeName",
          page: "1",
          pageSize: "500",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCharges(
            data.map((charge: any) => ({
              value: charge.chargeId,
              label: `${charge.chargeCode} - ${charge.chargeName}`,
            }))
          );
        } else {
          setCharges([]);
        }
      }
    } catch (error) {
      console.error("Error fetching charges:", error);
      setCharges([]);
    } finally {
      setLoadingCharges(false);
    }
  };

  const fetchOperationTypes = async () => {
    setLoadingOperationTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=Operation_Type"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          const typesArray = Object.entries(data)
            .filter(([key, value]) => typeof value === "string" && value.trim() !== "")
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          setOperationTypes(typesArray.length > 0 ? typesArray : [
            { value: "IMPORT", label: "IMPORT" },
            { value: "EXPORT", label: "EXPORT" },
            { value: "LOCAL", label: "LOCAL" },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching operation types:", error);
      setOperationTypes([
        { value: "IMPORT", label: "IMPORT" },
        { value: "EXPORT", label: "EXPORT" },
        { value: "LOCAL", label: "LOCAL" },
      ]);
    } finally {
      setLoadingOperationTypes(false);
    }
  };

  const fetchJobSubTypes = async () => {
    setLoadingJobSubTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=Job_Sub_Type"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          const typesArray = Object.entries(data)
            .filter(([key, value]) => typeof value === "string" && value.trim() !== "")
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          setJobSubTypes(typesArray.length > 0 ? typesArray : [
            { value: "SEA_FREIGHT", label: "SEA_FREIGHT" },
            { value: "AIR_FREIGHT", label: "AIR_FREIGHT" },
            { value: "LAND_FREIGHT", label: "LAND_FREIGHT" },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching job sub types:", error);
      setJobSubTypes([
        { value: "SEA_FREIGHT", label: "SEA_FREIGHT" },
        { value: "AIR_FREIGHT", label: "AIR_FREIGHT" },
        { value: "LAND_FREIGHT", label: "LAND_FREIGHT" },
      ]);
    } finally {
      setLoadingJobSubTypes(false);
    }
  };

  const fetchFclLclTypes = async () => {
    setLoadingFclLclTypes(true);
    try {
      setFclLclTypes([
        { value: "FCL", label: "FCL - Full Container Load" },
        { value: "LCL", label: "LCL - Less than Container Load" },
      ]);
    } finally {
      setLoadingFclLclTypes(false);
    }
  };

  const fetchGdTypes = async () => {
    setLoadingGdTypes(true);
    try {
      const response = await fetch(
        "http://188.245.83.20:9001/api/General/GetTypeValues?typeName=GD_Type"
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === "object") {
          const typesArray = Object.entries(data)
            .filter(([key, value]) => typeof value === "string" && value.trim() !== "")
            .map(([key, value]) => ({
              value: value as string,
              label: value as string,
            }));

          setGdTypes(typesArray.length > 0 ? typesArray : [
            { value: "GD", label: "GD" },
            { value: "TRANSSHIPMENT", label: "TRANSSHIPMENT" },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching GD types:", error);
      setGdTypes([
        { value: "GD", label: "GD" },
        { value: "TRANSSHIPMENT", label: "TRANSSHIPMENT" },
      ]);
    } finally {
      setLoadingGdTypes(false);
    }
  };

  const fetchChargeBasis = async () => {
    setLoadingChargeBasis(true);
    try {
      setChargeBasisOptions([
        { value: "PER_CONTAINER", label: "Per Container" },
        { value: "PER_SHIPMENT", label: "Per Shipment" },
        { value: "PER_TON", label: "Per Ton" },
        { value: "PER_CBM", label: "Per CBM" },
        { value: "LUMPSUM", label: "Lumpsum" },
      ]);
    } finally {
      setLoadingChargeBasis(false);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchContainerTypes();
    fetchContainerSizes();
    fetchLocations();
    fetchCurrencies();
    fetchHsCodes();
    fetchCharges();
    fetchOperationTypes();
    fetchJobSubTypes();
    fetchFclLclTypes();
    fetchGdTypes();
    fetchChargeBasis();
  }, []);

  // Equipment handlers
  const handleAddEquipment = (data: JobEquipmentFormValues) => {
    if (editingEquipment !== null) {
      const updatedEquipments = [...equipments];
      updatedEquipments[editingEquipment] = data;
      setEquipments(updatedEquipments);
      toast({ title: "Success", description: "Equipment updated successfully" });
    } else {
      setEquipments([...equipments, data]);
      toast({ title: "Success", description: "Equipment added successfully" });
    }
    equipmentForm.reset({
      companyId: 1,
      tareWeight: 0,
      containerRentFC: 0,
      containerRentLC: 0,
      damageDirtyFC: 0,
      damageDirtyLC: 0,
      refundFC: 0,
      refundLC: 0,
      eirSubmitted: false,
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
      toast({ title: "Success", description: "Equipment deleted successfully" });
    }
  };

  // Commodity handlers
  const handleAddCommodity = (data: JobCommodityFormValues) => {
    if (editingCommodity !== null) {
      const updatedCommodities = [...commodities];
      updatedCommodities[editingCommodity] = data;
      setCommodities(updatedCommodities);
      toast({ title: "Success", description: "Commodity updated successfully" });
    } else {
      setCommodities([...commodities, data]);
      toast({ title: "Success", description: "Commodity added successfully" });
    }
    commodityForm.reset({
      companyId: 1,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      declaredValueFC: 0,
      declaredValueLC: 0,
    });
    setShowCommodityForm(false);
    setEditingCommodity(null);
  };

  const handleEditCommodity = (index: number) => {
    setEditingCommodity(index);
    commodityForm.reset(commodities[index]);
    setShowCommodityForm(true);
  };

  const handleDeleteCommodity = (index: number) => {
    if (confirm("Are you sure you want to delete this commodity?")) {
      setCommodities(commodities.filter((_, i) => i !== index));
      toast({ title: "Success", description: "Commodity deleted successfully" });
    }
  };

  // Charge handlers
  const handleAddCharge = (data: JobChargeFormValues) => {
    if (editingCharge !== null) {
      const updatedCharges = [...jobCharges];
      updatedCharges[editingCharge] = data;
      setJobCharges(updatedCharges);
      toast({ title: "Success", description: "Charge updated successfully" });
    } else {
      setJobCharges([...jobCharges, data]);
      toast({ title: "Success", description: "Charge added successfully" });
    }
    chargeForm.reset({
      companyId: 1,
      exchangeRate: 1,
      priceFC: 0,
      priceLC: 0,
      amountFC: 0,
      amountLC: 0,
      taxPercentage: 0,
      taxFC: 0,
      taxLC: 0,
      isReimbursable: false,
      isVendorCost: false,
    });
    setShowChargeForm(false);
    setEditingCharge(null);
  };

  const handleEditCharge = (index: number) => {
    setEditingCharge(index);
    chargeForm.reset(jobCharges[index]);
    setShowChargeForm(true);
  };

  const handleDeleteCharge = (index: number) => {
    if (confirm("Are you sure you want to delete this charge?")) {
      setJobCharges(jobCharges.filter((_, i) => i !== index));
      toast({ title: "Success", description: "Charge deleted successfully" });
    }
  };

  // Calculate charge amounts
  const calculateChargeAmounts = () => {
    const priceFC = chargeForm.watch("priceFC") || 0;
    const exchangeRate = chargeForm.watch("exchangeRate") || 1;
    const taxPercentage = chargeForm.watch("taxPercentage") || 0;

    const priceLC = priceFC * exchangeRate;
    const taxFC = (priceFC * taxPercentage) / 100;
    const taxLC = taxFC * exchangeRate;
    const amountFC = priceFC + taxFC;
    const amountLC = priceLC + taxLC;

    chargeForm.setValue("priceLC", priceLC);
    chargeForm.setValue("taxFC", taxFC);
    chargeForm.setValue("taxLC", taxLC);
    chargeForm.setValue("amountFC", amountFC);
    chargeForm.setValue("amountLC", amountLC);
  };

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    const stepFields = STEPS[step - 1].fields;
    if (stepFields.length === 0) return true;

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

  const onSubmit = async (values: JobMasterFormValues) => {
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      const payload: any = {
        companyId: values.companyId || 1,
        jobNumber: values.jobNumber,
        operationType: values.operationType,
        jobSubType: values.jobSubType,
        fclLclType: values.fclLclType || null,
        partyId: values.partyId,
        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        notifyParty1Id: values.notifyParty1Id || null,
        notifyParty2Id: values.notifyParty2Id || null,
        principalId: values.principalId || null,
        overseasAgentId: values.overseasAgentId || null,
        transporterPartyId: values.transporterPartyId || null,
        depositorPartyId: values.depositorPartyId || null,
        originPortId: values.originPortId || null,
        destinationPortId: values.destinationPortId || null,
        vesselName: values.vesselName || null,
        voyageNo: values.voyageNo || null,
        etdDate: values.etdDate || null,
        etaDate: values.etaDate || null,
        vesselArrival: values.vesselArrival || null,
        deliverDate: values.deliverDate || null,
        freeDays: values.freeDays || 0,
        lastFreeDay: values.lastFreeDay || null,
        advanceRentPaidUpto: values.advanceRentPaidUpto || null,
        dispatchAddress: values.dispatchAddress || null,
        gdType: values.gdType || null,
        originalDocsReceivedOn: values.originalDocsReceivedOn || null,
        copyDocsReceivedOn: values.copyDocsReceivedOn || null,
        jobDescription: values.jobDescription || null,
        lcNumber: values.lcNumber || null,
        igmNumber: values.igmNumber || null,
        hblNumber: values.hblNumber || null,
        mawbNumber: values.mawbNumber || null,
        hawbNumber: values.hawbNumber || null,
        status: values.status || "DRAFT",
        remarks: values.remarks || null,
        version: values.version || 0,
        jobEquipments: equipments.map((eq) => ({
          jobEquipmentId: eq.jobEquipmentId || 0,
          companyId: eq.companyId || 1,
          jobId: values.jobId || 0,
          containerNo: eq.containerNo,
          containerTypeId: eq.containerTypeId || null,
          containerSizeId: eq.containerSizeId || null,
          sealNo: eq.sealNo || null,
          tareWeight: eq.tareWeight || 0,
          eirReceivedOn: eq.eirReceivedOn || null,
          rentInvoiceIssuedOn: eq.rentInvoiceIssuedOn || null,
          containerRentFC: eq.containerRentFC || 0,
          containerRentLC: eq.containerRentLC || 0,
          damageDirtyFC: eq.damageDirtyFC || 0,
          damageDirtyLC: eq.damageDirtyLC || 0,
          refundAppliedOn: eq.refundAppliedOn || null,
          refundFC: eq.refundFC || 0,
          refundLC: eq.refundLC || 0,
          gateOutDate: eq.gateOutDate || null,
          gateInDate: eq.gateInDate || null,
          eirSubmitted: eq.eirSubmitted || false,
          eirDocumentId: eq.eirDocumentId || null,
          status: eq.status || null,
          version: eq.version || 0,
        })),
        jobCommodities: commodities.map((comm) => ({
          jobCommodityId: comm.jobCommodityId || 0,
          companyId: comm.companyId || 1,
          jobId: values.jobId || 0,
          description: comm.description,
          hsCodeId: comm.hsCodeId || null,
          grossWeight: comm.grossWeight || 0,
          netWeight: comm.netWeight || 0,
          volumeCbm: comm.volumeCbm || 0,
          declaredValueFC: comm.declaredValueFC || 0,
          declaredValueLC: comm.declaredValueLC || 0,
          currencyId: comm.currencyId || null,
          version: comm.version || 0,
        })),
        jobCharges: jobCharges.map((charge) => ({
          jobChargeId: charge.jobChargeId || 0,
          companyId: charge.companyId || 1,
          jobId: values.jobId || 0,
          chargeId: charge.chargeId,
          chargeBasis: charge.chargeBasis || null,
          jobEquipmentId: charge.jobEquipmentId || null,
          currencyId: charge.currencyId || null,
          exchangeRate: charge.exchangeRate || 1,
          priceFC: charge.priceFC || 0,
          priceLC: charge.priceLC || 0,
          amountFC: charge.amountFC || 0,
          amountLC: charge.amountLC || 0,
          taxPercentage: charge.taxPercentage || 0,
          taxFC: charge.taxFC || 0,
          taxLC: charge.taxLC || 0,
          isReimbursable: charge.isReimbursable || false,
          isVendorCost: charge.isVendorCost || false,
          remarks: charge.remarks || null,
          version: charge.version || 0,
        })),
      };

      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      }

      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}Job`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save Job");
      }

      const result = await response.json();

      toast({
        title: "Success!",
        description: `Job ${type === "edit" ? "updated" : "created"} successfully`,
      });

      handleAddEdit(result);
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
              {type === "edit" ? "Edit Job Order" : "Create Job Order"}
            </h1>
            <p className='text-muted-foreground mt-1 text-xs'>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
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
                      {currentStep === 1 && "Enter basic job order information"}
                      {currentStep === 2 && "Select all relevant parties"}
                      {currentStep === 3 && "Enter routing and vessel details"}
                      {currentStep === 4 && "Enter dates and document information"}
                      {currentStep === 5 && "Enter document reference numbers"}
                      {currentStep === 6 && "Add job description and remarks"}
                      {currentStep === 7 && "Add equipment/container details"}
                      {currentStep === 8 && "Add commodity details"}
                      {currentStep === 9 && "Add charge details"}
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
                      name='jobNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Job Number
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter job number'
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
                      name='operationType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Operation Type
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={operationTypes}
                              value={operationTypes.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingOperationTypes ? "Loading..." : "Select Type"}
                              isLoading={loadingOperationTypes}
                              isDisabled={loadingOperationTypes}
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
                      name='jobSubType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Job Sub Type
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={jobSubTypes}
                              value={jobSubTypes.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingJobSubTypes ? "Loading..." : "Select Sub Type"}
                              isLoading={loadingJobSubTypes}
                              isDisabled={loadingJobSubTypes}
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
                      name='fclLclType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            FCL/LCL Type
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={fclLclTypes}
                              value={fclLclTypes.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder='Select FCL/LCL'
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

                    <FormField
                      control={form.control}
                      name='partyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                            Main Party
                            <span className='text-red-500 text-base'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Party"}
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
                      name='status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Status</FormLabel>
                          <FormControl>
                            <Select
                              options={[
                                { value: "DRAFT", label: "Draft" },
                                { value: "ACTIVE", label: "Active" },
                                { value: "IN_PROGRESS", label: "In Progress" },
                                { value: "COMPLETED", label: "Completed" },
                                { value: "CANCELLED", label: "Cancelled" },
                                { value: "ON_HOLD", label: "On Hold" },
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
                          <FormLabel className='text-sm font-medium'>Shipper</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Shipper"}
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
                      name='consigneePartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Consignee</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Consignee"}
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
                      name='notifyParty1Id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Notify Party 1</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Notify Party"}
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
                      name='notifyParty2Id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Notify Party 2</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Notify Party"}
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
                      name='principalId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Principal</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Principal"}
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
                      name='overseasAgentId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Overseas Agent</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Agent"}
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
                      name='transporterPartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Transporter</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Transporter"}
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
                      name='depositorPartyId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Depositor</FormLabel>
                          <FormControl>
                            <Select
                              options={parties}
                              value={parties.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingParties ? "Loading..." : "Select Depositor"}
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
                  </div>
                )}

                {/* Step 3: Routing & Vessel */}
                {currentStep === 3 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='originPortId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Origin Port</FormLabel>
                          <FormControl>
                            <Select
                              options={locations}
                              value={locations.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingLocations ? "Loading..." : "Select Origin"}
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
                      name='destinationPortId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Destination Port</FormLabel>
                          <FormControl>
                            <Select
                              options={locations}
                              value={locations.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingLocations ? "Loading..." : "Select Destination"}
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
                          <FormLabel className='text-sm font-medium'>Vessel Name</FormLabel>
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
                      name='voyageNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Voyage Number</FormLabel>
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
                      name='etdDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>ETD Date</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='etaDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>ETA Date</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='vesselArrival'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Vessel Arrival</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='deliverDate'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Deliver Date</FormLabel>
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
                )}

                {/* Step 4: Dates & Docs */}
                {currentStep === 4 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='freeDays'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Free Days</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='0'
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className='h-10 text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='lastFreeDay'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Last Free Day</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='advanceRentPaidUpto'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Advance Rent Paid Upto</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='gdType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>GD Type</FormLabel>
                          <FormControl>
                            <Select
                              options={gdTypes}
                              value={gdTypes.find((opt) => opt.value === field.value)}
                              onChange={(val) => field.onChange(val?.value)}
                              placeholder={loadingGdTypes ? "Loading..." : "Select GD Type"}
                              isClearable
                              isLoading={loadingGdTypes}
                              isDisabled={loadingGdTypes}
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
                      name='originalDocsReceivedOn'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Original Docs Received On</FormLabel>
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

                    <FormField
                      control={form.control}
                      name='copyDocsReceivedOn'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Copy Docs Received On</FormLabel>
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
                )}

                {/* Step 5: Document Refs */}
                {currentStep === 5 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    <FormField
                      control={form.control}
                      name='lcNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>LC Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter LC number'
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
                      name='igmNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>IGM Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter IGM number'
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
                          <FormLabel className='text-sm font-medium'>HBL Number</FormLabel>
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
                      name='mawbNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>MAWB Number</FormLabel>
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
                          <FormLabel className='text-sm font-medium'>HAWB Number</FormLabel>
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
                      name='dispatchAddress'
                      render={({ field }) => (
                        <FormItem className='md:col-span-2'>
                          <FormLabel className='text-sm font-medium'>Dispatch Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter dispatch address...'
                              {...field}
                              className='min-h-[80px] text-sm'
                            />
                          </FormControl>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 6: Additional Info */}
                {currentStep === 6 && (
                  <div className='grid grid-cols-1 gap-5'>
                    <FormField
                      control={form.control}
                      name='jobDescription'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Job Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter job description...'
                              {...field}
                              className='min-h-[120px] text-sm'
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-gray-500'>
                            Detailed description of the job order
                          </FormDescription>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='remarks'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>Remarks</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='Enter any additional remarks...'
                              {...field}
                              className='min-h-[120px] text-sm'
                            />
                          </FormControl>
                          <FormDescription className='text-xs text-gray-500'>
                            Additional notes or special instructions
                          </FormDescription>
                          <FormMessage className='text-xs' />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 7: Equipment */}
                {currentStep === 7 && (
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
                            companyId: 1,
                            tareWeight: 0,
                            containerRentFC: 0,
                            containerRentLC: 0,
                            damageDirtyFC: 0,
                            damageDirtyLC: 0,
                            refundFC: 0,
                            refundLC: 0,
                            eirSubmitted: false,
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
                                    <span className='text-red-500 text-base'>*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder='ABCD1234567' {...field} className='h-10 text-sm' />
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
                                  <FormLabel className='text-sm font-medium'>Container Type</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={containerTypes}
                                      value={containerTypes.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder='Select Type'
                                      isClearable
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
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
                                  <FormLabel className='text-sm font-medium'>Container Size</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={containerSizes}
                                      value={containerSizes.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder='Select Size'
                                      isClearable
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
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
                                  <FormLabel className='text-sm font-medium'>Seal Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder='Enter seal number' {...field} className='h-10 text-sm' />
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
                                  <FormLabel className='text-sm font-medium'>Tare Weight (kg)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='gateOutDate'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Gate Out Date</FormLabel>
                                  <FormControl>
                                    <Input type='date' {...field} value={field.value || ""} className='h-10 text-sm' />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='gateInDate'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Gate In Date</FormLabel>
                                  <FormControl>
                                    <Input type='date' {...field} value={field.value || ""} className='h-10 text-sm' />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='eirReceivedOn'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>EIR Received On</FormLabel>
                                  <FormControl>
                                    <Input type='date' {...field} value={field.value || ""} className='h-10 text-sm' />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='containerRentFC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Container Rent (FC)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='containerRentLC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Container Rent (LC)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='eirSubmitted'
                              render={({ field }) => (
                                <FormItem className='flex flex-row items-center space-x-2 space-y-0 mt-8'>
                                  <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className='text-sm font-medium'>EIR Submitted</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={equipmentForm.control}
                              name='status'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Status</FormLabel>
                                  <FormControl>
                                    <Input placeholder='Enter status' {...field} className='h-10 text-sm' />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              type='button'
                              onClick={equipmentForm.handleSubmit(handleAddEquipment)}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <Save className='h-4 w-4 mr-1.5' />
                              {editingEquipment !== null ? "Update" : "Add"} Equipment
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
                              <TableHead className='text-xs font-semibold'>Container No</TableHead>
                              <TableHead className='text-xs font-semibold'>Type</TableHead>
                              <TableHead className='text-xs font-semibold'>Size</TableHead>
                              <TableHead className='text-xs font-semibold'>Seal No</TableHead>
                              <TableHead className='text-xs font-semibold'>Gate Out</TableHead>
                              <TableHead className='text-xs font-semibold text-center'>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {equipments.map((equipment, index) => (
                              <TableRow key={index} className='hover:bg-gray-50'>
                                <TableCell className='text-sm font-medium'>{equipment.containerNo}</TableCell>
                                <TableCell className='text-sm'>
                                  {containerTypes.find((t) => t.value === equipment.containerTypeId)?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>
                                  {containerSizes.find((s) => s.value === equipment.containerSizeId)?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>{equipment.sealNo || "N/A"}</TableCell>
                                <TableCell className='text-sm'>
                                  {equipment.gateOutDate ? new Date(equipment.gateOutDate).toLocaleDateString() : "N/A"}
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
                                      onClick={() => handleDeleteEquipment(index)}
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
                        <p className='text-sm font-medium'>No equipment added yet</p>
                        <p className='text-xs mt-1'>Click Add Equipment to add containers</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 8: Commodity */}
                {currentStep === 8 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-semibold text-gray-900'>
                        Commodity Details ({commodities.length})
                      </h3>
                      <Button
                        type='button'
                        onClick={() => {
                          setShowCommodityForm(!showCommodityForm);
                          setEditingCommodity(null);
                          commodityForm.reset({
                            companyId: 1,
                            grossWeight: 0,
                            netWeight: 0,
                            volumeCbm: 0,
                            declaredValueFC: 0,
                            declaredValueLC: 0,
                          });
                        }}
                        size='sm'
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Add Commodity
                      </Button>
                    </div>

                    {showCommodityForm && (
                      <Card className='border-2 border-green-200 bg-green-50/30'>
                        <CardContent className='pt-5 pb-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                            <FormField
                              control={commodityForm.control}
                              name='description'
                              render={({ field }) => (
                                <FormItem className='md:col-span-3'>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Description
                                    <span className='text-red-500 text-base'>*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder='Enter commodity description...'
                                      {...field}
                                      className='min-h-[60px] text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='hsCodeId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>HS Code</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={hsCodes}
                                      value={hsCodes.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder={loadingHsCodes ? "Loading..." : "Select HS Code"}
                                      isClearable
                                      isLoading={loadingHsCodes}
                                      isDisabled={loadingHsCodes}
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='grossWeight'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Gross Weight (kg)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='netWeight'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Net Weight (kg)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='volumeCbm'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Volume (CBM)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='declaredValueFC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Declared Value (FC)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='declaredValueLC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Declared Value (LC)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={commodityForm.control}
                              name='currencyId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Currency</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={currencies}
                                      value={currencies.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder={loadingCurrencies ? "Loading..." : "Select Currency"}
                                      isClearable
                                      isLoading={loadingCurrencies}
                                      isDisabled={loadingCurrencies}
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
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
                              onClick={commodityForm.handleSubmit(handleAddCommodity)}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <Save className='h-4 w-4 mr-1.5' />
                              {editingCommodity !== null ? "Update" : "Add"} Commodity
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowCommodityForm(false);
                                setEditingCommodity(null);
                                commodityForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {commodities.length > 0 ? (
                      <div className='border rounded-lg overflow-hidden'>
                        <Table>
                          <TableHeader>
                            <TableRow className='bg-gray-50'>
                              <TableHead className='text-xs font-semibold'>Description</TableHead>
                              <TableHead className='text-xs font-semibold'>HS Code</TableHead>
                              <TableHead className='text-xs font-semibold'>Gross Weight</TableHead>
                              <TableHead className='text-xs font-semibold'>Volume</TableHead>
                              <TableHead className='text-xs font-semibold'>Value (FC)</TableHead>
                              <TableHead className='text-xs font-semibold text-center'>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {commodities.map((commodity, index) => (
                              <TableRow key={index} className='hover:bg-gray-50'>
                                <TableCell className='text-sm font-medium'>{commodity.description}</TableCell>
                                <TableCell className='text-sm'>
                                  {hsCodes.find((h) => h.value === commodity.hsCodeId)?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>{commodity.grossWeight?.toFixed(2) || "0.00"} kg</TableCell>
                                <TableCell className='text-sm'>{commodity.volumeCbm?.toFixed(2) || "0.00"} CBM</TableCell>
                                <TableCell className='text-sm'>{commodity.declaredValueFC?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell className='text-center'>
                                  <div className='flex gap-2 justify-center'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleEditCommodity(index)}
                                      className='h-8 w-8 p-0 hover:bg-blue-50'
                                    >
                                      <Box className='h-4 w-4 text-blue-600' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleDeleteCommodity(index)}
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
                        <p className='text-sm font-medium'>No commodities added yet</p>
                        <p className='text-xs mt-1'>Click Add Commodity to add items</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 9: Charges */}
                {currentStep === 9 && (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-semibold text-gray-900'>
                        Charge Details ({jobCharges.length})
                      </h3>
                      <Button
                        type='button'
                        onClick={() => {
                          setShowChargeForm(!showChargeForm);
                          setEditingCharge(null);
                          chargeForm.reset({
                            companyId: 1,
                            exchangeRate: 1,
                            priceFC: 0,
                            priceLC: 0,
                            amountFC: 0,
                            amountLC: 0,
                            taxPercentage: 0,
                            taxFC: 0,
                            taxLC: 0,
                            isReimbursable: false,
                            isVendorCost: false,
                          });
                        }}
                        size='sm'
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <Plus className='h-4 w-4 mr-1.5' />
                        Add Charge
                      </Button>
                    </div>

                    {showChargeForm && (
                      <Card className='border-2 border-green-200 bg-green-50/30'>
                        <CardContent className='pt-5 pb-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                            <FormField
                              control={chargeForm.control}
                              name='chargeId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='flex items-center gap-1.5 text-sm font-medium'>
                                    Charge
                                    <span className='text-red-500 text-base'>*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Select
                                      options={charges}
                                      value={charges.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder={loadingCharges ? "Loading..." : "Select Charge"}
                                      isLoading={loadingCharges}
                                      isDisabled={loadingCharges}
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='chargeBasis'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Charge Basis</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={chargeBasisOptions}
                                      value={chargeBasisOptions.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder='Select Basis'
                                      isClearable
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='currencyId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Currency</FormLabel>
                                  <FormControl>
                                    <Select
                                      options={currencies}
                                      value={currencies.find((opt) => opt.value === field.value)}
                                      onChange={(val) => field.onChange(val?.value)}
                                      placeholder={loadingCurrencies ? "Loading..." : "Select Currency"}
                                      isClearable
                                      isLoading={loadingCurrencies}
                                      isDisabled={loadingCurrencies}
                                      styles={{
                                        control: (base) => ({ ...base, minHeight: "40px", fontSize: "14px" }),
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='priceFC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Price (FC)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        calculateChargeAmounts();
                                      }}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='exchangeRate'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Exchange Rate</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.0001'
                                      placeholder='1.0000'
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        calculateChargeAmounts();
                                      }}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='priceLC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Price (LC)</FormLabel>
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
                                  <FormDescription className='text-xs'>Auto-calculated</FormDescription>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='taxPercentage'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Tax (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      step='0.01'
                                      placeholder='0.00'
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value));
                                        calculateChargeAmounts();
                                      }}
                                      className='h-10 text-sm'
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='taxFC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Tax (FC)</FormLabel>
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
                                  <FormDescription className='text-xs'>Auto-calculated</FormDescription>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='amountFC'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>Total Amount (FC)</FormLabel>
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
                                  <FormDescription className='text-xs'>Auto-calculated</FormDescription>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='isReimbursable'
                              render={({ field }) => (
                                <FormItem className='flex flex-row items-center space-x-2 space-y-0 mt-8'>
                                  <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className='text-sm font-medium'>Reimbursable</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='isVendorCost'
                              render={({ field }) => (
                                <FormItem className='flex flex-row items-center space-x-2 space-y-0 mt-8'>
                                  <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                  <FormLabel className='text-sm font-medium'>Vendor Cost</FormLabel>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={chargeForm.control}
                              name='remarks'
                              render={({ field }) => (
                                <FormItem className='md:col-span-3'>
                                  <FormLabel className='text-sm font-medium'>Remarks</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder='Enter remarks...' {...field} className='min-h-[60px] text-sm' />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              type='button'
                              onClick={chargeForm.handleSubmit(handleAddCharge)}
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <Save className='h-4 w-4 mr-1.5' />
                              {editingCharge !== null ? "Update" : "Add"} Charge
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowChargeForm(false);
                                setEditingCharge(null);
                                chargeForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {jobCharges.length > 0 ? (
                      <div className='border rounded-lg overflow-hidden'>
                        <Table>
                          <TableHeader>
                            <TableRow className='bg-gray-50'>
                              <TableHead className='text-xs font-semibold'>Charge</TableHead>
                              <TableHead className='text-xs font-semibold'>Basis</TableHead>
                              <TableHead className='text-xs font-semibold'>Price (FC)</TableHead>
                              <TableHead className='text-xs font-semibold'>Tax</TableHead>
                              <TableHead className='text-xs font-semibold'>Amount (FC)</TableHead>
                              <TableHead className='text-xs font-semibold text-center'>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {jobCharges.map((charge, index) => (
                              <TableRow key={index} className='hover:bg-gray-50'>
                                <TableCell className='text-sm font-medium'>
                                  {charges.find((c) => c.value === charge.chargeId)?.label || "N/A"}
                                </TableCell>
                                <TableCell className='text-sm'>{charge.chargeBasis || "N/A"}</TableCell>
                                <TableCell className='text-sm'>{charge.priceFC?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell className='text-sm'>{charge.taxFC?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell className='text-sm'>{charge.amountFC?.toFixed(2) || "0.00"}</TableCell>
                                <TableCell className='text-center'>
                                  <div className='flex gap-2 justify-center'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleEditCharge(index)}
                                      className='h-8 w-8 p-0 hover:bg-blue-50'
                                    >
                                      <DollarSign className='h-4 w-4 text-blue-600' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleDeleteCharge(index)}
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
                        <DollarSign className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                        <p className='text-sm font-medium'>No charges added yet</p>
                        <p className='text-xs mt-1'>Click Add Charge to add billing items</p>
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
                    {currentStep === 7 && (
                      <span>
                        <span className='font-medium'>{equipments.length}</span> equipment(s) added
                      </span>
                    )}
                    {currentStep === 8 && (
                      <span>
                        <span className='font-medium'>{commodities.length}</span> commodit(ies) added
                      </span>
                    )}
                    {currentStep === 9 && (
                      <span>
                        <span className='font-medium'>{jobCharges.length}</span> charge(s) added
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
                        disabled={isSubmitting}
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
                            {type === "edit" ? "Update Job" : "Create Job"}
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
