"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import separate tab components
import JobMainTab from "./tabs/JobMainTab";
import ShippingTab from "./tabs/ShippingTab";
import InvoiceTab from "./tabs/InvoiceTab";
import GDTab from "./tabs/GDInfoTab";
import DispatchTab from "./tabs/DispatchTab";
import DetentionTab from "./tabs/DetentionTab";
import CompletionTab from "./tabs/CompletionTab";

// Import schemas and types
import {
  jobMasterSchema,
  fclContainerSchema,
  invoiceSchema,
  invoiceItemSchema,
  type JobMasterFormValues,
  type FclContainerFormValues,
  type InvoiceFormValues,
  type InvoiceItemFormValues,
} from "./schemas/jobOrderSchemas";

// Import API fetch functions
import {
  fetchParties,
  fetchContainerTypes,
  fetchContainerSizes,
  fetchLocations,
  fetchCountries,
  fetchCurrencies,
  fetchVessels,
  fetchHsCodes,
  fetchBanks,
  fetchOperationTypes,
  fetchOperationModes,
  fetchJobLoadTypes,
  fetchJobLoads,
  fetchDocumentTypes,
  fetchBLStatus,
  fetchFreightTypes,
  fetchPackageTypes,
} from "./api/jobOrderApi";

export default function JobOrderForm({
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
  const [activeTab, setActiveTab] = useState("main");
  const [isLoadingJobData, setIsLoadingJobData] = useState(false);

  // Dropdown states
  const [parties, setParties] = useState<any[]>([]);
  const [processOwners, setProcessOwners] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [containerSizes, setContainerSizes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [operationTypes, setOperationTypes] = useState<any[]>([]);
  const [operationModes, setOperationModes] = useState<any[]>([]);
  const [jobLoadTypes, setJobLoadTypes] = useState<any[]>([]);
  const [jobLoads, setJobLoads] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [packageTypes, setPackageTypes] = useState<any[]>([]);
  const [freightTypes, setFreightTypes] = useState<any[]>([]);
  const [blStatuses, setBLStatuses] = useState<any[]>([]);

  // Loading states
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingContainerTypes, setLoadingContainerTypes] = useState(false);
  const [loadingContainerSizes, setLoadingContainerSizes] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingVessels, setLoadingVessels] = useState(false);
  const [loadingHsCodes, setLoadingHsCodes] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingOperationTypes, setLoadingOperationTypes] = useState(false);
  const [loadingOperationModes, setLoadingOperationModes] = useState(false);
  const [loadingJobLoadTypes, setLoadingJobLoadTypes] = useState(false);
  const [loadingJobLoads, setLoadingJobLoads] = useState(false);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  const [loadingPackageTypes, setLoadingPackageTypes] = useState(false);
  const [loadingFreightTypes, setLoadingFreightTypes] = useState(false);
  const [loadingBLStatuses, setLoadingBLStatuses] = useState(false);

  // Child records
  const [fclContainers, setFclContainers] = useState<FclContainerFormValues[]>(
    [],
  );
  const [invoices, setInvoices] = useState<InvoiceFormValues[]>([]);
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<
    InvoiceItemFormValues[]
  >([]);
  const [goodsDeclarations, setGoodsDeclarations] = useState<any[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<any[]>([]);
  const [detentionRecords, setDetentionRecords] = useState<any[]>([]);

  // Form visibility
  const [showFclForm, setShowFclForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoiceItemForm, setShowInvoiceItemForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<number | null>(null);
  const [editingInvoiceItem, setEditingInvoiceItem] = useState<number | null>(
    null,
  );

  // Insurance state
  const [insuranceType, setInsuranceType] = useState<"1percent" | "custom">(
    "custom",
  );

  // Debug: Log whenever invoices state changes
  useEffect(() => {
    console.log("=== INVOICES STATE CHANGED ===");
    console.log("Invoices count:", invoices.length);
    if (invoices.length > 0) {
      console.log("Invoices data:", JSON.stringify(invoices, null, 2));
    }
  }, [invoices]);

  // ✅ NEW: Prevent Enter key from submitting form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Enter key from submitting form when pressed in input fields
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement).tagName !== "TEXTAREA" &&
        (e.target as HTMLElement).tagName !== "BUTTON"
      ) {
        // Check if the target is an input or select element
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.getAttribute("role") === "combobox"
        ) {
          e.preventDefault();

          // Show a subtle toast notification
          toast({
            title: "Keyboard Navigation Tip",
            description:
              "Press Tab to move to next field. Use the Save button to submit.",
            duration: 2500,
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toast]);

  // ============================================
  // MAIN FORM - ALIGNED WITH NEW SCHEMA
  // ============================================
  const form = useForm<JobMasterFormValues>({
    resolver: zodResolver(jobMasterSchema),
    mode: "onChange",
    defaultValues: {
      // System Fields
      companyId: 1,
      version: 0,

      // Basic Information
      jobNumber: "",
      jobDate: new Date().toISOString().split("T")[0],
      customerReferenceNumber: "",
      indexNo: "",
      status: "DRAFT",

      // Scope Flags
      isFreightForwarding: false,
      isClearance: false,
      isTransporter: false,
      isOther: false,

      // Operation Details
      operationType: undefined,
      operationMode: undefined,
      jobSubType: undefined,
      jobLoadType: undefined,
      jobDocumentType: undefined,
      freightType: undefined,

      // Process Owner
      processOwnerId: undefined,

      // Party IDs (ALL 10)
      shipperPartyId: undefined,
      consigneePartyId: undefined,
      notifyParty1Id: undefined,
      notifyParty2Id: undefined,
      principalId: undefined,
      overseasAgentId: undefined,
      transporterPartyId: undefined,
      depositorPartyId: undefined,
      carrierPartyId: undefined,
      terminalPartyId: undefined,

      // Document Numbers
      houseDocumentNumber: "",
      houseDocumentDate: "",
      masterDocumentNumber: "",
      masterDocumentDate: "",

      // Location IDs
      originPortId: undefined,
      destinationPortId: undefined,
      placeOfDeliveryId: undefined,

      // Vessel Information
      vesselName: "",
      voyageNo: "",

      // Weight
      grossWeight: 0,
      netWeight: 0,

      // Dates
      etdDate: "",
      etaDate: "",
      vesselArrival: "",
      deliverDate: "",
      freeDays: 0,
      lastFreeDay: "",
      advanceRentPaidUpto: "",

      // Address
      dispatchAddress: "",

      // Document Receipt Dates
      originalDocsReceivedOn: "",
      copyDocsReceivedOn: "",

      // Description & Documentation
      jobDescription: "",
      igmNumber: "",
      blstatus: undefined,

      // Financial
      jobInvoiceExchRate: 0,
      insurance: "",
      landing: "",
      freightCharges: 0,

      // PO Fields
      poReceivedOn: "",
      poCustomDuty: 0,
      poWharfage: 0,
      poExciseDuty: 0,
      poDeliveryOrder: 0,
      poSecurityDeposite: 0,
      poSasadvance: 0,

      // GD Fields
      gdnumber: "",
      gdType: "",
      gddate: "",
      gdcharges: 0,
      gdclearedUs: "",
      gdsecurityType: "",
      gdsecurityValue: "",
      gdsecurityExpiryDate: "",
      psqcaSamples: "",

      // Case & Rent
      caseSubmittedToLineOn: "",
      rentInvoiceIssuedOn: "",
      refundBalanceReceivedOn: "",

      // Remarks
      remarks: "",
      dispatchNotes: "",

      // ✅ ADD COMPLETION TAB DEFAULTS:
      gdClearedUs: "",
      gdSecurityValue: "",
      gdSecurityExpiryDate: "",
      rmsChannel: "",
      destuffingOn: "",
      gdAssignToGateOutDate: "",
      delayInClearanceDays: 0,
      delayInClearanceReason: "",
      delayInClearanceType: "",
      delayInDispatchDays: 0,
      delayInDispatchReason: "",
      delayInDispatchType: "",
      completionRemarks: "",

      ...defaultState,
    },
  });

  const fclForm = useForm<FclContainerFormValues>({
    resolver: zodResolver(fclContainerSchema),
    defaultValues: {
      tareWeight: 0,
      sealNo: "",
      gateOutDate: "",
      gateInDate: "",
      status: "",
      containerRentFc: 0,
      containerRentLc: 0,
      damageDirtyFc: 0,
      damageDirtyLc: 0,
      refundFc: 0,
      refundLc: 0,
      eirSubmitted: false,
    },
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { lcValue: 0, items: [] },
  });

  const invoiceItemForm = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      quantity: 0,
      dutiableValue: 0,
      assessableValue: 0,
      totalValue: 0,
    },
  });

  // Watch for changes
  const shippingType = form.watch("jobSubType");
  const mode = form.watch("operationMode");
  const documentType = form.watch("jobDocumentType");

  // Helper function to transform API dates to form format (YYYY-MM-DD)
  const formatDateForForm = (isoDate: string | null | undefined) => {
    if (!isoDate) return "";
    try {
      return new Date(isoDate).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // ============================================
  // POPULATE FORM - ALIGNED WITH NEW SCHEMA
  // ============================================
  const populateForm = (jobData: any) => {
    form.reset({
      // System Fields
      jobId: jobData.jobId || 0,
      companyId: jobData.companyId || 1,
      version: jobData.version || 0,

      // Basic Information
      jobNumber: jobData.jobNumber || "",
      jobDate: formatDateForForm(jobData.jobDate),
      customerReferenceNumber: jobData.customerReferenceNumber || "",
      indexNo: jobData.indexNo || "",
      status: jobData.status || "DRAFT",

      // Scope Flags
      isFreightForwarding: jobData.isFreightForwarding || false,
      isClearance: jobData.isClearance || false,
      isTransporter: jobData.isTransporter || false,
      isOther: jobData.isOther || false,

      // Operation Details
      operationType: jobData.operationType || undefined,
      operationMode: jobData.operationMode || undefined,
      jobSubType: jobData.jobSubType || undefined,
      jobLoadType: jobData.jobLoadType || undefined,
      jobDocumentType: jobData.jobDocumentType || undefined,
      freightType: jobData.freightType || undefined,

      // Process Owner
      processOwnerId: jobData.processOwnerId || undefined,

      // Party IDs (ALL 10)
      shipperPartyId: jobData.shipperPartyId || undefined,
      consigneePartyId: jobData.consigneePartyId || undefined,
      notifyParty1Id: jobData.notifyParty1Id || undefined,
      notifyParty2Id: jobData.notifyParty2Id || undefined,
      principalId: jobData.principalId || undefined,
      overseasAgentId: jobData.overseasAgentId || undefined,
      transporterPartyId: jobData.transporterPartyId || undefined,
      depositorPartyId: jobData.depositorPartyId || undefined,
      carrierPartyId: jobData.carrierPartyId || undefined,
      terminalPartyId: jobData.terminalPartyId || undefined,

      // Document Numbers
      houseDocumentNumber: jobData.houseDocumentNumber || "",
      houseDocumentDate: formatDateForForm(jobData.houseDocumentDate),
      masterDocumentNumber: jobData.masterDocumentNumber || "",
      masterDocumentDate: formatDateForForm(jobData.masterDocumentDate),

      // Location IDs
      originPortId: jobData.originPortId || undefined,
      destinationPortId: jobData.destinationPortId || undefined,
      placeOfDeliveryId: jobData.placeOfDeliveryId || undefined,

      // Vessel Information
      vesselName: jobData.vesselName || "",
      voyageNo: jobData.voyageNo || "",

      // Weight
      grossWeight: jobData.grossWeight || 0,
      netWeight: jobData.netWeight || 0,

      // Dates
      etdDate: formatDateForForm(jobData.etdDate),
      etaDate: formatDateForForm(jobData.etaDate),
      vesselArrival: formatDateForForm(jobData.vesselArrival),
      deliverDate: formatDateForForm(jobData.deliverDate),
      freeDays: jobData.freeDays || 0,
      lastFreeDay: formatDateForForm(jobData.lastFreeDay),
      advanceRentPaidUpto: formatDateForForm(jobData.advanceRentPaidUpto),

      // Address
      dispatchAddress: jobData.dispatchAddress || "",

      // Document Receipt Dates
      originalDocsReceivedOn: formatDateForForm(jobData.originalDocsReceivedOn),
      copyDocsReceivedOn: formatDateForForm(jobData.copyDocsReceivedOn),

      // Description & Documentation
      jobDescription: jobData.jobDescription || "",
      igmNumber: jobData.igmNumber || "",
      blstatus: jobData.blstatus || undefined,

      // Financial
      jobInvoiceExchRate: jobData.jobInvoiceExchRate || 0,
      insurance: jobData.insurance || "",
      landing: jobData.landing || "",
      freightCharges: jobData.freightCharges || 0,

      // PO Fields
      poReceivedOn: formatDateForForm(jobData.poReceivedOn),
      poCustomDuty: jobData.poCustomDuty || 0,
      poWharfage: jobData.poWharfage || 0,
      poExciseDuty: jobData.poExciseDuty || 0,
      poDeliveryOrder: jobData.poDeliveryOrder || 0,
      poSecurityDeposite: jobData.poSecurityDeposite || 0,
      poSasadvance: jobData.poSasadvance || 0,

      // GD Fields
      gdnumber: jobData.gdnumber || "",
      gdType: jobData.gdType || "",
      gddate: formatDateForForm(jobData.gddate),
      gdcharges: jobData.gdcharges || 0,
      gdclearedUs: jobData.gdclearedUs || "",
      gdsecurityType: jobData.gdsecurityType || "",
      gdsecurityValue: jobData.gdsecurityValue || "",
      gdsecurityExpiryDate: formatDateForForm(jobData.gdsecurityExpiryDate),
      psqcaSamples: jobData.psqcaSamples || "",

      // Case & Rent
      caseSubmittedToLineOn: formatDateForForm(jobData.caseSubmittedToLineOn),
      rentInvoiceIssuedOn: formatDateForForm(jobData.rentInvoiceIssuedOn),
      refundBalanceReceivedOn: formatDateForForm(
        jobData.refundBalanceReceivedOn,
      ),

      // Remarks
      remarks: jobData.remarks || "",
      dispatchNotes: jobData.dispatchNotes || "",

      // ✅ ADD COMPLETION TAB FIELDS:
      gdClearedUs: jobData.gdClearedUs || "",
      gdSecurityValue: jobData.gdSecurityValue || jobData.gdsecurityValue || "",
      gdSecurityExpiryDate: formatDateForForm(
        jobData.gdSecurityExpiryDate || jobData.gdsecurityExpiryDate,
      ),
      rmsChannel: jobData.rmsChannel || "",
      destuffingOn: formatDateForForm(jobData.destuffingOn),
      gdAssignToGateOutDate: formatDateForForm(jobData.gdAssignToGateOutDate),
      delayInClearanceDays: jobData.delayInClearanceDays || 0,
      delayInClearanceReason: jobData.delayInClearanceReason || "",
      delayInClearanceType: jobData.delayInClearanceType || "",
      delayInDispatchDays: jobData.delayInDispatchDays || 0,
      delayInDispatchReason: jobData.delayInDispatchReason || "",
      delayInDispatchType: jobData.delayInDispatchType || "",
      completionRemarks: jobData.completionRemarks || "",
    });

    // Populate containers
    if (jobData.jobEquipments && Array.isArray(jobData.jobEquipments)) {
      const transformedContainers = jobData.jobEquipments.map(
        (equipment: any) => ({
          jobEquipmentId: equipment.jobEquipmentId || 0,
          containerNo: equipment.containerNo || "",
          containerSizeId: equipment.containerSizeId || undefined,
          containerTypeId: equipment.containerTypeId || undefined,
          tareWeight: equipment.tareWeight || 0,
          sealNo: equipment.sealNo || "",
          eirReceivedOn: formatDateForForm(equipment.eirReceivedOn),
          eirSubmitted: equipment.eirSubmitted || false,
          eirDocumentId: equipment.eirDocumentId || undefined,
          rentInvoiceIssuedOn: formatDateForForm(equipment.rentInvoiceIssuedOn),
          containerRentFc: equipment.containerRentFc || 0,
          containerRentLc: equipment.containerRentLc || 0,
          damageDirtyFc: equipment.damageDirtyFc || 0,
          damageDirtyLc: equipment.damageDirtyLc || 0,
          refundAppliedOn: formatDateForForm(equipment.refundAppliedOn),
          refundFc: equipment.refundFc || 0,
          refundLc: equipment.refundLc || 0,
          gateOutDate: formatDateForForm(equipment.gateOutDate),
          gateInDate: formatDateForForm(equipment.gateInDate),
          status: equipment.status || "",
          version: equipment.version || 0,
        }),
      );

      setFclContainers(transformedContainers);
    }

    // Populate invoices
    if (jobData.jobInvoices && Array.isArray(jobData.jobInvoices)) {
      const transformedInvoices = jobData.jobInvoices.map((invoice: any) => ({
        invoiceId: invoice.jobInvoiceId || 0,
        invoiceNumber: invoice.invoiceNumber || "",
        invoiceDate: formatDateForForm(invoice.invoiceDate),
        invoiceIssuedByPartyId: invoice.issuedBy
          ? parseInt(invoice.issuedBy)
          : undefined,
        shippingTerm: invoice.shippingTerm || "",
        lcNumber: invoice.lcNumber || "",
        lcValue: invoice.lcValue || 0,
        lcDate: formatDateForForm(invoice.lcDate),
        lcIssuedByBankId: invoice.lcIssuedBy
          ? parseInt(invoice.lcIssuedBy)
          : undefined,
        lcCurrencyId: invoice.lcCurrencyid || undefined,
        lcExchangeRate: invoice.lcExchangeRate || 0,
        fiNumber: invoice.flNumber || "",
        fiDate: formatDateForForm(invoice.flDate),
        fiExpiryDate: formatDateForForm(invoice.expiryDate),
        invoiceStatus: invoice.invoiceStatus || "",
        version: invoice.version || 0,

        items: (
          invoice.jobInvoiceCommodities ||
          invoice.JobInvoiceCommodities ||
          []
        ).map((commodity: any) => {
          const hsCode =
            commodity.hscode?.code ||
            commodity.Hscode?.Code ||
            commodity.hscode?.Code ||
            commodity.Hscode?.code ||
            "";

          const hsCodeId =
            commodity.hscodeId || commodity.HscodeId || undefined;

          console.log("Loading commodity:", {
            id:
              commodity.jobInvoiceCommodityId ||
              commodity.JobInvoiceCommodityId,
            hsCodeId,
            hsCode,
            rawHscode: commodity.Hscode || commodity.hscode,
          });

          return {
            invoiceItemId:
              commodity.jobInvoiceCommodityId ||
              commodity.JobInvoiceCommodityId ||
              0,
            hsCodeId,
            hsCode: hsCode || hsCodeId?.toString() || "",
            description: commodity.description || commodity.Description || "",
            originId: commodity.originId || commodity.OriginId || undefined,
            quantity: commodity.quantity || commodity.Quantity || 0,
            dutiableValue:
              commodity.dutiableValue || commodity.DutiableValue || 0,
            assessableValue:
              commodity.assessableValue || commodity.AssessableValue || 0,
            totalValue: commodity.totalValueAv || commodity.TotalValueAv || 0,
            version: commodity.version || commodity.Version || 0,
          };
        }),
      }));

      setInvoices(transformedInvoices);
    }

    // Populate goods declarations
    if (
      jobData.jobGoodsDeclarations &&
      Array.isArray(jobData.jobGoodsDeclarations)
    ) {
      setGoodsDeclarations(jobData.jobGoodsDeclarations);
    }

    // Populate dispatch records
    if (
      jobData.jobEquipmentHandingOvers &&
      Array.isArray(jobData.jobEquipmentHandingOvers)
    ) {
      const transformedDispatch = jobData.jobEquipmentHandingOvers.map(
        (dispatch: any) => ({
          jobEquipmentHandingOverId: dispatch.jobEquipmentHandingOverId || 0,
          jobId: dispatch.jobId || 0,
          containerNumber: dispatch.containerNumber || "",
          containerTypeId: dispatch.containerTypeId || undefined,
          containerSizeId: dispatch.containerSizeId || undefined,
          netWeight: dispatch.netWeight || 0,
          transporterPartyId: dispatch.transporterPartyId || undefined,
          destinationLocationId: dispatch.destinationLocationId || undefined,
          buyingAmountLc: dispatch.buyingAmountLc || 0,
          topayAmountLc: dispatch.topayAmountLc || 0,
          dispatchDate: formatDateForForm(dispatch.dispatchDate),
          version: dispatch.version || 0,
          packageType: dispatch.packageType || undefined,
          quantity: dispatch.quantity || undefined,
        }),
      );
      setDispatchRecords(transformedDispatch);
    }

    // Populate detention records
    if (
      jobData.jobEquipmentDetentionDetails &&
      Array.isArray(jobData.jobEquipmentDetentionDetails)
    ) {
      const transformedDetention = jobData.jobEquipmentDetentionDetails.map(
        (detention: any) => ({
          jobEquipmentDetentionDetailId:
            detention.jobEquipmentDetentionDetailId || 0,
          jobId: detention.jobId || 0,
          containerNumber: detention.containerNumber || "",
          containerTypeId: detention.containerTypeId || undefined,
          containerSizeId: detention.containerSizeId || undefined,
          netWeight: detention.netWeight || 0,
          transport: detention.transport || "",
          emptyDate: formatDateForForm(detention.emptyDate),
          eirReceivedDate: formatDateForForm(detention.eirReceivedDate),
          condition: detention.condition || "",
          rentDays: detention.rentDays || 0,
          rentAmount: detention.rentAmount || 0,
          damageAmount: detention.damageAmount || 0,
          dirtyAmount: detention.dirtyAmount || 0,
          version: detention.version || 0,
        }),
      );
      setDetentionRecords(transformedDetention);
    }

    toast({
      title: "Success",
      description: "Job data loaded successfully",
    });
  };

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      const partiesData = await fetchParties(setLoadingParties);
      setParties(partiesData.parties);
      setProcessOwners(partiesData.processOwners);

      setContainerTypes(await fetchContainerTypes(setLoadingContainerTypes));
      setContainerSizes(await fetchContainerSizes(setLoadingContainerSizes));
      setLocations(await fetchLocations(setLoadingLocations));
      setCountries(await fetchCountries(setLoadingCountries));
      setCurrencies(await fetchCurrencies(setLoadingCurrencies));
      setVessels(await fetchVessels(setLoadingVessels));
      setHsCodes(await fetchHsCodes(setLoadingHsCodes));
      setBanks(await fetchBanks(setLoadingBanks));
      setOperationTypes(await fetchOperationTypes(setLoadingOperationTypes));
      setOperationModes(await fetchOperationModes(setLoadingOperationModes));
      setJobLoadTypes(await fetchJobLoadTypes(setLoadingJobLoadTypes));
      setJobLoads(await fetchJobLoads(setLoadingJobLoads));
      setDocumentTypes(await fetchDocumentTypes(setLoadingDocumentTypes));
      setPackageTypes(await fetchPackageTypes(setLoadingPackageTypes));
      setFreightTypes(await fetchFreightTypes(setLoadingFreightTypes));
      setBLStatuses(await fetchBLStatus(setLoadingBLStatuses));
    };

    loadData();
  }, []);

  // Fetch job data for edit mode
  useEffect(() => {
    const fetchJobData = async () => {
      if (type === "edit" && defaultState?.jobId) {
        try {
          setIsLoadingJobData(true);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
          const response = await fetch(`${baseUrl}Job/${defaultState.jobId}`);

          if (!response.ok) {
            throw new Error("Failed to fetch job data");
          }

          const jobData = await response.json();
          console.log("Fetched Job Data:", jobData);

          populateForm(jobData);
        } catch (error) {
          console.error("Error fetching job data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load job data",
          });
        } finally {
          setIsLoadingJobData(false);
        }
      }
    };

    fetchJobData();
  }, [type, defaultState?.jobId]);

  // Calculate gross weight from containers
  useEffect(() => {
    const totalWeight = fclContainers.reduce(
      (sum, container) => sum + (container.tareWeight || 0),
      0,
    );
    form.setValue("grossWeight", parseFloat(totalWeight.toFixed(4)));
  }, [fclContainers, form]);

  // Calculate total value when quantity or assessable value changes
  useEffect(() => {
    const subscription = invoiceItemForm.watch((value, { name }) => {
      if (name === "quantity" || name === "assessableValue") {
        const quantity = invoiceItemForm.getValues("quantity") || 0;
        const assessableValue =
          invoiceItemForm.getValues("assessableValue") || 0;
        const totalValue = quantity * assessableValue;
        invoiceItemForm.setValue("totalValue", totalValue);
      }
    });
    return () => subscription.unsubscribe();
  }, [invoiceItemForm]);

  // ============================================
  // ✅ NEW: HANDLE FORM SUBMISSION WITH NATIVE CONFIRMATION
  // ============================================
  const handleFormSubmit = (values: any) => {
    // Show native browser confirmation with keyboard tips
    const confirmed = window.confirm(
      "⚠️ CONFIRM SAVE\n\n" +
        "Are you sure you want to save this job order?\n\n" +
        "💡 Keyboard Navigation Tips:\n" +
        "• Press Tab to move between fields\n" +
        "• Use the Save button to submit the form\n• Press Shift+Tab to move backwards\n\n" +
        "Click OK to save, or Cancel to continue editing.",
    );

    if (confirmed) {
      onSubmit(values);
    } else {
      toast({
        title: "Save Cancelled",
        description: "You can continue editing the job order.",
        variant: "default",
      });
    }
  };

  // ============================================
  // ON SUBMIT - ALIGNED WITH NEW SCHEMA
  // ============================================
  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

      const companyId = parseInt(localStorage.getItem("companyId") || "1");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // For UPDATE operations, fetch latest data to get current version numbers
      let latestVersions: any = {};
      if (type === "edit" && values.jobId) {
        console.log("=== FETCHING LATEST VERSIONS ===");
        console.log("Job ID:", values.jobId);

        try {
          const response = await fetch(`${baseUrl}Job/${values.jobId}`);
          if (response.ok) {
            const latestData = await response.json();

            latestVersions = {
              jobVersion: latestData.version || 0,
              invoices: new Map(),
              commodities: new Map(),
              equipments: new Map(),
              goodsDeclarations: new Map(),
              dispatchRecords: new Map(),
              detentionRecords: new Map(),
            };

            // Map invoice versions
            if (latestData.jobInvoices) {
              latestData.jobInvoices.forEach((inv: any) => {
                const invId = inv.jobInvoiceId;
                latestVersions.invoices.set(invId, inv.version || 0);

                if (inv.jobInvoiceCommodities) {
                  inv.jobInvoiceCommodities.forEach((comm: any) => {
                    const commId =
                      comm.jobInvoiceCommodityId || comm.JobInvoiceCommodityId;
                    latestVersions.commodities.set(
                      commId,
                      comm.version || comm.Version || 0,
                    );
                  });
                }
              });
            }

            // Map equipment versions
            if (latestData.jobEquipments) {
              latestData.jobEquipments.forEach((eq: any) => {
                latestVersions.equipments.set(
                  eq.jobEquipmentId,
                  eq.version || 0,
                );
              });
            }

            // Map goods declaration versions
            if (latestData.jobGoodsDeclarations) {
              latestData.jobGoodsDeclarations.forEach((gd: any) => {
                latestVersions.goodsDeclarations.set(gd.id, gd.version || 0);
              });
            }

            // Map dispatch records versions
            if (latestData.jobEquipmentHandingOvers) {
              latestData.jobEquipmentHandingOvers.forEach((dispatch: any) => {
                latestVersions.dispatchRecords.set(
                  dispatch.jobEquipmentHandingOverId,
                  dispatch.version || 0,
                );
              });
            }

            // Map detention records versions
            if (latestData.jobEquipmentDetentionDetails) {
              latestData.jobEquipmentDetentionDetails.forEach(
                (detention: any) => {
                  latestVersions.detentionRecords.set(
                    detention.jobEquipmentDetentionDetailId,
                    detention.version || 0,
                  );
                },
              );
            }

            console.log("Latest versions fetched:", {
              job: latestVersions.jobVersion,
              invoices: Array.from(latestVersions.invoices.entries()),
              commodities: Array.from(latestVersions.commodities.entries()),
              equipments: Array.from(latestVersions.equipments.entries()),
              goodsDeclarations: Array.from(
                latestVersions.goodsDeclarations.entries(),
              ),
              dispatchRecords: Array.from(
                latestVersions.dispatchRecords.entries(),
              ),
              detentionRecords: Array.from(
                latestVersions.detentionRecords.entries(),
              ),
            });
          } else {
            console.warn("Failed to fetch latest versions, using form values");
          }
        } catch (error) {
          console.error("Error fetching latest versions:", error);
          console.warn("Proceeding with form version values");
        }
      }

      console.log("=== INVOICE DEBUG ===");
      console.log("Invoices array:", invoices);
      console.log("Invoices length:", invoices.length);
      console.log("Invoices detail:", JSON.stringify(invoices, null, 2));
      if (invoices.length > 0) {
        console.log("First invoice items:", invoices[0].items);
        console.log(
          "First invoice items count:",
          invoices[0].items?.length || 0,
        );
      }

      // Map invoices
      const jobInvoices = invoices.map((invoice) => {
        const invoiceId = invoice.invoiceId || 0;
        const latestInvoiceVersion =
          type === "edit" && invoiceId > 0
            ? (latestVersions.invoices?.get(invoiceId) ?? invoice.version ?? 0)
            : invoice.version || 0;

        return {
          jobInvoiceId: invoiceId,
          jobId: values.jobId || 0,
          invoiceNumber: invoice.invoiceNumber || "",
          invoiceDate: invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toISOString()
            : null,
          issuedBy: invoice.invoiceIssuedByPartyId
            ? invoice.invoiceIssuedByPartyId.toString()
            : null,
          shippingTerm: invoice.shippingTerm || null,
          lcNumber: invoice.lcNumber || null,
          lcDate: invoice.lcDate
            ? new Date(invoice.lcDate).toISOString()
            : null,
          lcIssuedBy: invoice.lcIssuedByBankId
            ? invoice.lcIssuedByBankId.toString()
            : null,
          lcValue: invoice.lcValue || 0,
          lcCurrencyid: invoice.lcCurrencyId || null,
          lcExchangeRate: invoice.lcExchangeRate || 0,
          flNumber: invoice.fiNumber || null,
          flDate: invoice.fiDate
            ? new Date(invoice.fiDate).toISOString()
            : null,
          expiryDate: invoice.fiExpiryDate
            ? new Date(invoice.fiExpiryDate).toISOString()
            : null,
          invoiceStatus: invoice.invoiceStatus || null,
          version: latestInvoiceVersion,

          jobInvoiceCommodities: (invoice.items || []).map((item) => {
            const commodityId = item.invoiceItemId || 0;
            const latestCommodityVersion =
              type === "edit" && commodityId > 0
                ? (latestVersions.commodities?.get(commodityId) ??
                  item.version ??
                  0)
                : item.version || 0;

            const hasHsCode = item.hsCodeId && item.hsCodeId > 0;

            return {
              JobInvoiceCommodityId: commodityId,
              JobInvoiceId: invoiceId,
              Description: item.description || "",
              HscodeId: hasHsCode ? item.hsCodeId : null,
              Hscode: {
                Code: hasHsCode ? item.hsCode || item.hsCodeId?.toString() : "",
              },
              OriginId:
                item.originId && item.originId > 0 ? item.originId : null,
              Origin: null,
              Quantity: item.quantity || 0,
              DutiableValue: item.dutiableValue || 0,
              AssessableValue: item.assessableValue || 0,
              TotalValueAv: (item.quantity || 0) * (item.assessableValue || 0),
              TotalValueDv: (item.quantity || 0) * (item.dutiableValue || 0),
              Version: latestCommodityVersion,
            };
          }),
        };
      });

      console.log("=== MAPPED INVOICE DEBUG ===");
      console.log("JobInvoices count:", jobInvoices.length);
      if (jobInvoices.length > 0) {
        console.log(
          "First jobInvoice:",
          JSON.stringify(jobInvoices[0], null, 2),
        );
        console.log(
          "First jobInvoice commodities count:",
          jobInvoices[0].jobInvoiceCommodities?.length || 0,
        );
        if (
          jobInvoices[0].jobInvoiceCommodities &&
          jobInvoices[0].jobInvoiceCommodities.length > 0
        ) {
          console.log(
            "First commodity:",
            jobInvoices[0].jobInvoiceCommodities[0],
          );
        }
      }

      // Map containers
      const jobEquipments = fclContainers.map((container) => {
        const equipmentId = container.jobEquipmentId || 0;
        const latestEquipmentVersion =
          type === "edit" && equipmentId > 0
            ? (latestVersions.equipments?.get(equipmentId) ??
              container.version ??
              0)
            : container.version || 0;

        return {
          jobEquipmentId: equipmentId,
          companyId: companyId,
          jobId: values.jobId || 0,
          containerNo: container.containerNo || "",
          containerTypeId: container.containerTypeId || null,
          containerSizeId: container.containerSizeId || null,
          tareWeight: container.tareWeight || 0,
          sealNo: container.sealNo || null,
          eirReceivedOn: container.eirReceivedOn
            ? new Date(container.eirReceivedOn).toISOString()
            : null,
          eirSubmitted: container.eirSubmitted || false,
          eirDocumentId: container.eirDocumentId || null,
          rentInvoiceIssuedOn: container.rentInvoiceIssuedOn
            ? new Date(container.rentInvoiceIssuedOn).toISOString()
            : null,
          containerRentFc: container.containerRentFc || 0,
          containerRentLc: container.containerRentLc || 0,
          damageDirtyFc: container.damageDirtyFc || 0,
          damageDirtyLc: container.damageDirtyLc || 0,
          refundAppliedOn: container.refundAppliedOn
            ? new Date(container.refundAppliedOn).toISOString()
            : null,
          refundFc: container.refundFc || 0,
          refundLc: container.refundLc || 0,
          gateOutDate: container.gateOutDate
            ? new Date(container.gateOutDate).toISOString()
            : null,
          gateInDate: container.gateInDate
            ? new Date(container.gateInDate).toISOString()
            : null,
          status: container.status || null,
          version: latestEquipmentVersion,
        };
      });

      // Build JobGoodsDeclarations
      let jobGoodsDeclarations: any[] = [];

      if (goodsDeclarations.length > 0) {
        jobGoodsDeclarations = goodsDeclarations.map((gd: any) => {
          const gdId = gd.id || 0;
          const latestGdVersion =
            type === "edit" && gdId !== 0 && gdId > 0
              ? (latestVersions.goodsDeclarations?.get(gdId) ?? gd.version ?? 0)
              : gd.version || 0;

          return {
            id: gdId,
            jobId: gd.jobId || values.jobId || 0,
            unitType: gd.unitType || "",
            quantity: gd.quantity || 0,
            cocode: gd.cocode || "",
            sronumber: gd.sronumber || "",
            hscode: gd.hscode || "",
            itemDescription: gd.itemDescription || "",
            declaredUnitValue: gd.declaredUnitValue || 0,
            assessedUnitValue: gd.assessedUnitValue || 0,
            totalDeclaredValue: gd.totalDeclaredValue || 0,
            totalAssessedValue: gd.totalAssessedValue || 0,
            customDeclaredValue: gd.customDeclaredValue || 0,
            customAssessedValue: gd.customAssessedValue || 0,
            levyCd: gd.levyCd || 0,
            levySt: gd.levySt || 0,
            levyRd: gd.levyRd || 0,
            levyAsd: gd.levyAsd || 0,
            levyIt: gd.levyIt || 0,
            rateCd: gd.rateCd || 0,
            rateSt: gd.rateSt || 0,
            rateRd: gd.rateRd || 0,
            rateAsd: gd.rateAsd || 0,
            rateIt: gd.rateIt || 0,
            payableCd: gd.payableCd || 0,
            payableSt: gd.payableSt || 0,
            payableRd: gd.payableRd || 0,
            payableAsd: gd.payableAsd || 0,
            payableIt: gd.payableIt || 0,
            version: latestGdVersion,
          };
        });
      } else if (type === "add") {
        const uniqueId = -Math.floor(Date.now() / 1000);

        jobGoodsDeclarations = [
          {
            id: uniqueId,
            jobId: 0,
            unitType: "",
            quantity: 0,
            cocode: "",
            sronumber: "",
            hscode: "",
            itemDescription: "",
            declaredUnitValue: 0,
            assessedUnitValue: 0,
            totalDeclaredValue: 0,
            totalAssessedValue: 0,
            customDeclaredValue: 0,
            customAssessedValue: 0,
            levyCd: 0,
            levySt: 0,
            levyRd: 0,
            levyAsd: 0,
            levyIt: 0,
            rateCd: 0,
            rateSt: 0,
            rateRd: 0,
            rateAsd: 0,
            rateIt: 0,
            payableCd: 0,
            payableSt: 0,
            payableRd: 0,
            payableAsd: 0,
            payableIt: 0,
            version: 0,
          },
        ];
      }

      // Build JobEquipmentHandingOvers (Dispatch Records)
      const jobEquipmentHandingOvers = dispatchRecords.map((dispatch: any) => {
        const dispatchId = dispatch.jobEquipmentHandingOverId || 0;
        const latestDispatchVersion =
          type === "edit" && dispatchId > 0
            ? (latestVersions.dispatchRecords?.get(dispatchId) ??
              dispatch.version ??
              0)
            : dispatch.version || 0;

        return {
          jobEquipmentHandingOverId: dispatchId,
          jobId: values.jobId || 0,
          containerNumber: dispatch.containerNumber || "",
          containerTypeId: dispatch.containerTypeId || null,
          containerSizeId: dispatch.containerSizeId || null,
          netWeight: dispatch.netWeight || 0,
          transporterPartyId: dispatch.transporterPartyId || null,
          destinationLocationId: dispatch.destinationLocationId || null,
          buyingAmountLc: dispatch.buyingAmountLc || 0,
          topayAmountLc: dispatch.topayAmountLc || 0,
          dispatchDate: dispatch.dispatchDate
            ? new Date(dispatch.dispatchDate).toISOString()
            : null,
          version: latestDispatchVersion,
          packageType: dispatch.packageType || null,
          quantity: dispatch.quantity || null,
        };
      });

      // Build JobEquipmentDetentionDetails (Completion Records)
      const jobEquipmentDetentionDetails = detentionRecords.map(
        (detention: any) => {
          const detentionId = detention.jobEquipmentDetentionDetailId || 0;
          const latestDetentionVersion =
            type === "edit" && detentionId > 0
              ? (latestVersions.detentionRecords?.get(detentionId) ??
                detention.version ??
                0)
              : detention.version || 0;

          return {
            jobEquipmentDetentionDetailId: detentionId,
            jobId: values.jobId || 0,
            containerNumber: detention.containerNumber || "",
            containerTypeId: detention.containerTypeId || null,
            containerSizeId: detention.containerSizeId || null,
            netWeight: detention.netWeight || 0,
            transport: detention.transport || null,
            emptyDate: detention.emptyDate
              ? new Date(detention.emptyDate).toISOString()
              : null,
            eirReceivedDate: detention.eirReceivedDate
              ? new Date(detention.eirReceivedDate).toISOString()
              : null,
            condition: detention.condition || null,
            rentDays: detention.rentDays || 0,
            rentAmount: detention.rentAmount || 0,
            damageAmount: detention.damageAmount || 0,
            dirtyAmount: detention.dirtyAmount || 0,
            version: latestDetentionVersion,
          };
        },
      );

      // Build complete payload matching new schema
      const payload: any = {
        companyId: companyId,

        // Basic Information
        jobNumber: values.jobNumber || "",
        jobDate: values.jobDate
          ? new Date(values.jobDate).toISOString()
          : new Date().toISOString(),
        customerReferenceNumber: values.customerReferenceNumber || "",
        indexNo: values.indexNo || "",
        status: values.status || "DRAFT",

        // Scope Flags
        isFreightForwarding: values.isFreightForwarding || false,
        isClearance: values.isClearance || false,
        isTransporter: values.isTransporter || false,
        isOther: values.isOther || false,

        // Operation Details
        operationType: values.operationType || null,
        operationMode: values.operationMode || null,
        jobSubType: values.jobSubType || null,
        jobLoadType: values.jobLoadType || null,
        jobDocumentType: values.jobDocumentType || null,
        freightType: values.freightType || null,

        // Process Owner
        processOwnerId: values.processOwnerId || null,

        // ALL 10 Party Fields
        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        notifyParty1Id: values.notifyParty1Id || null,
        notifyParty2Id: values.notifyParty2Id || null,
        principalId: values.principalId || null,
        overseasAgentId: values.overseasAgentId || null,
        transporterPartyId: values.transporterPartyId || null,
        depositorPartyId: values.depositorPartyId || null,
        carrierPartyId: values.carrierPartyId || null,
        terminalPartyId: values.terminalPartyId || null,

        // Document Numbers
        houseDocumentNumber: values.houseDocumentNumber || null,
        houseDocumentDate: values.houseDocumentDate
          ? new Date(values.houseDocumentDate).toISOString()
          : null,
        masterDocumentNumber: values.masterDocumentNumber || null,
        masterDocumentDate: values.masterDocumentDate
          ? new Date(values.masterDocumentDate).toISOString()
          : null,

        // Location IDs
        originPortId: values.originPortId || null,
        destinationPortId: values.destinationPortId || null,
        placeOfDeliveryId: values.placeOfDeliveryId || null,

        // Vessel
        vesselName: values.vesselName || null,
        voyageNo: values.voyageNo || null,

        // Weight
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,

        // Dates
        etdDate: values.etdDate ? new Date(values.etdDate).toISOString() : null,
        etaDate: values.etaDate ? new Date(values.etaDate).toISOString() : null,
        vesselArrival: values.vesselArrival
          ? new Date(values.vesselArrival).toISOString()
          : null,
        deliverDate: values.deliverDate
          ? new Date(values.deliverDate).toISOString()
          : null,
        freeDays: values.freeDays || 0,
        lastFreeDay: values.lastFreeDay
          ? new Date(values.lastFreeDay).toISOString()
          : null,
        advanceRentPaidUpto: values.advanceRentPaidUpto
          ? new Date(values.advanceRentPaidUpto).toISOString()
          : null,

        // Address
        dispatchAddress: values.dispatchAddress || null,

        // Document Dates
        originalDocsReceivedOn: values.originalDocsReceivedOn
          ? new Date(values.originalDocsReceivedOn).toISOString()
          : null,
        copyDocsReceivedOn: values.copyDocsReceivedOn
          ? new Date(values.copyDocsReceivedOn).toISOString()
          : null,

        // Description & IGM
        jobDescription: values.jobDescription || null,
        igmNumber: values.igmNumber || null,
        blstatus: values.blstatus || null,

        // Financial
        jobInvoiceExchRate: values.jobInvoiceExchRate || 0,
        insurance: values.insurance || null,
        landing: values.landing || null,
        freightCharges: values.freightCharges || 0,

        // PO Fields
        poReceivedOn: values.poReceivedOn
          ? new Date(values.poReceivedOn).toISOString()
          : null,
        poCustomDuty: values.poCustomDuty || 0,
        poWharfage: values.poWharfage || 0,
        poExciseDuty: values.poExciseDuty || 0,
        poDeliveryOrder: values.poDeliveryOrder || 0,
        poSecurityDeposite: values.poSecurityDeposite || 0,
        poSasadvance: values.poSasadvance || 0,

        // GD Fields
        gdnumber: values.gdnumber || null,
        gdType: values.gdType || null,
        gddate: values.gddate ? new Date(values.gddate).toISOString() : null,
        gdcharges: values.gdcharges || 0,
        gdclearedUs: values.gdclearedUs || null,
        gdsecurityType: values.gdsecurityType || null,
        gdsecurityValue: values.gdsecurityValue || null,
        gdsecurityExpiryDate: values.gdsecurityExpiryDate
          ? new Date(values.gdsecurityExpiryDate).toISOString()
          : null,
        psqcaSamples: values.psqcaSamples || null,

        // Case & Rent
        caseSubmittedToLineOn: values.caseSubmittedToLineOn
          ? new Date(values.caseSubmittedToLineOn).toISOString()
          : null,
        rentInvoiceIssuedOn: values.rentInvoiceIssuedOn
          ? new Date(values.rentInvoiceIssuedOn).toISOString()
          : null,
        refundBalanceReceivedOn: values.refundBalanceReceivedOn
          ? new Date(values.refundBalanceReceivedOn).toISOString()
          : null,

        // Remarks
        remarks: values.remarks || null,
        dispatchNotes: values.dispatchNotes || null,

        // ✅ ADD COMPLETION TAB FIELDS TO PAYLOAD:
        gdClearedUs: values.gdClearedUs || null,
        gdSecurityValue: values.gdSecurityValue || null,
        gdSecurityExpiryDate: values.gdSecurityExpiryDate
          ? new Date(values.gdSecurityExpiryDate).toISOString()
          : null,
        rmsChannel: values.rmsChannel || null,
        destuffingOn: values.destuffingOn
          ? new Date(values.destuffingOn).toISOString()
          : null,
        gdAssignToGateOutDate: values.gdAssignToGateOutDate
          ? new Date(values.gdAssignToGateOutDate).toISOString()
          : null,
        delayInClearanceDays: values.delayInClearanceDays || 0,
        delayInClearanceReason: values.delayInClearanceReason || null,
        delayInClearanceType: values.delayInClearanceType || null,
        delayInDispatchDays: values.delayInDispatchDays || 0,
        delayInDispatchReason: values.delayInDispatchReason || null,
        delayInDispatchType: values.delayInDispatchType || null,
        completionRemarks: values.completionRemarks || null,

        // Child Records
        jobEquipments: jobEquipments,
        jobInvoices: jobInvoices,
        jobEquipmentHandingOvers: jobEquipmentHandingOvers,
        jobEquipmentDetentionDetails: jobEquipmentDetentionDetails,
        ...(type === "add" || jobGoodsDeclarations.length > 0
          ? { jobGoodsDeclarations: jobGoodsDeclarations }
          : {}),

        // Version
        version:
          type === "edit"
            ? (latestVersions.jobVersion ?? values.version ?? 0)
            : values.version || 0,
      };

      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      } else {
        payload.jobId = 0;
      }

      console.log("=== PAYLOAD DEBUG ===");
      console.log("Mode:", type);
      console.log("JobId:", payload.jobId);
      console.log("Job Version:", payload.version);
      console.log("Complete Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${baseUrl}Job`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);

        try {
          const errorJson = JSON.parse(errorData);
          console.error("Parsed Error:", JSON.stringify(errorJson, null, 2));

          if (
            errorData.toLowerCase().includes("version") &&
            errorData.toLowerCase().includes("conflict")
          ) {
            throw new Error(
              "Version conflict detected. The record has been modified by another user.\n" +
                "Please refresh the page and try again.",
            );
          }

          if (errorJson.errors) {
            const errorMessages = Object.entries(errorJson.errors)
              .map(
                ([field, messages]: [string, any]) =>
                  `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
              )
              .join("\n");
            throw new Error(`Validation errors:\n${errorMessages}`);
          }

          throw new Error(
            errorJson.title || errorJson.message || "Failed to save job",
          );
        } catch (parseError) {
          if (
            parseError instanceof Error &&
            parseError.message.includes("Version conflict")
          ) {
            throw parseError;
          }
          throw new Error(`API Error: ${errorData.substring(0, 500)}`);
        }
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

  // Shared props for all tabs
  const sharedProps = {
    form,
    parties,
    processOwners,
    containerTypes,
    containerSizes,
    locations,
    countries,
    currencies,
    vessels,
    hsCodes,
    banks,
    operationTypes,
    operationModes,
    jobLoadTypes,
    jobLoads,
    documentTypes,
    packageTypes,
    freightTypes,
    blStatuses,
    loadingParties,
    loadingContainerTypes,
    loadingContainerSizes,
    loadingLocations,
    loadingCountries,
    loadingCurrencies,
    loadingVessels,
    loadingHsCodes,
    loadingBanks,
    loadingOperationTypes,
    loadingOperationModes,
    loadingJobLoadTypes,
    loadingJobLoads,
    loadingDocumentTypes,
    loadingPackageTypes,
    loadingFreightTypes,
    loadingBLStatuses,
    shippingType,
    mode,
    documentType,
    freightType: form.watch("freightType"),
    fclContainers,
    setFclContainers,
    fclForm,
    showFclForm,
    setShowFclForm,
    invoices,
    setInvoices,
    invoiceForm,
    showInvoiceForm,
    setShowInvoiceForm,
    currentInvoiceItems,
    setCurrentInvoiceItems,
    invoiceItemForm,
    showInvoiceItemForm,
    setShowInvoiceItemForm,
    editingInvoice,
    setEditingInvoice,
    editingInvoiceItem,
    setEditingInvoiceItem,
    goodsDeclarations,
    setGoodsDeclarations,
    dispatchRecords,
    setDispatchRecords,
    detentionRecords,
    setDetentionRecords,
    insuranceType,
    setInsuranceType,
    toast,
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-3 py-3 max-w-[1600px]'>
        {/* Header with Job Number Display for Edit Mode */}
        {type === "edit" && form.watch("jobNumber") && (
          <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center'>
            <div className='flex flex-col items-center justify-center'>
              <Badge
                variant='outline'
                className='mb-2 bg-blue-100 text-blue-800 border-blue-300'
              >
                Job Number
              </Badge>
              <h1 className='text-2xl font-bold text-blue-700'>
                {form.watch("jobNumber")}
              </h1>
            </div>
          </div>
        )}

        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <h1 className='text-xl font-bold text-gray-900'>
            {type === "edit" ? "Edit Job Order" : "New Job Order"}
          </h1>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X className='h-4 w-4 mr-1' />
            Close
          </Button>
        </div>

        <Form {...form}>
          {/* ✅ Changed from onSubmit to handleFormSubmit to show confirmation */}
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            {/* Loading Indicator */}
            {isLoadingJobData && (
              <div className='flex justify-center items-center p-8 bg-white rounded-lg border'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
                <span className='ml-2 text-sm font-medium'>
                  Loading job data...
                </span>
              </div>
            )}

            {/* Only show tabs when not loading */}
            {!isLoadingJobData && (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-7 mb-3'>
                  <TabsTrigger value='main'>Job Order</TabsTrigger>
                  <TabsTrigger value='shipping'>Shipping</TabsTrigger>
                  <TabsTrigger value='invoice'>Invoice</TabsTrigger>
                  <TabsTrigger value='gd'>GD Info</TabsTrigger>
                  <TabsTrigger value='dispatch'>Dispatch</TabsTrigger>
                  <TabsTrigger value='detention'>Detention</TabsTrigger>
                  <TabsTrigger value='completion'>Completion</TabsTrigger>
                </TabsList>

                {/* All tabs as separate components */}
                <JobMainTab {...sharedProps} />
                <ShippingTab {...sharedProps} />
                <InvoiceTab {...sharedProps} />
                <GDTab {...sharedProps} />
                <DispatchTab {...sharedProps} />
                <DetentionTab {...sharedProps} />
                <CompletionTab {...sharedProps} />
              </Tabs>
            )}

            {/* Submit Button */}
            {!isLoadingJobData && (
              <div className='flex justify-end gap-3 mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='min-w-[120px]'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      {type === "edit" ? "Update Job" : "Create Job"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
