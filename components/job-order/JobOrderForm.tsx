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
import GDTab from "./tabs/GDTab";
import DispatchTab from "./tabs/DispatchTab";
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
    []
  );
  const [invoices, setInvoices] = useState<InvoiceFormValues[]>([]);
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<
    InvoiceItemFormValues[]
  >([]);

  // Form visibility
  const [showFclForm, setShowFclForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoiceItemForm, setShowInvoiceItemForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<number | null>(null);
  const [editingInvoiceItem, setEditingInvoiceItem] = useState<number | null>(
    null
  );

  // Insurance state
  const [insuranceType, setInsuranceType] = useState<"1percent" | "custom">(
    "custom"
  );

  const form = useForm<JobMasterFormValues>({
    resolver: zodResolver(jobMasterSchema),
    mode: "onChange",
    defaultValues: {
      // Numbers - OK to use 0
      companyId: 1,
      freeDays: 0,
      grossWeight: 0,
      netWeight: 0,
      exchangeRate: 0,
      securityValue: 0,
      freightCharges: 0,
      otherCharges: 0,
      insuranceValue: 0,

      // Strings - MUST use empty string ""
      status: "Draft",
      jobDate: new Date().toISOString().split("T")[0],
      jobNumber: "", // ← NOT undefined
      houseDocumentNumber: "", // ← NOT undefined
      houseDocumentDate: "", // ← NOT undefined
      masterDocumentNumber: "", // ← NOT undefined
      masterDocumentDate: "", // ← NOT undefined
      igmNumber: "", // ← NOT undefined
      customerReferenceNumber: "", // ← NOT undefined
      vesselName: "", // ← NOT undefined
      lastFreeDay: "", // ← NOT undefined
      expectedArrivalDate: "", // ← NOT undefined
      gdNumber: "", // ← NOT undefined
      gdDate: "", // ← NOT undefined
      gdType: "", // ← NOT undefined
      gdClearedUS: "", // ← NOT undefined
      securityType: "", // ← NOT undefined
      securityExpiryDate: "", // ← NOT undefined
      rmsChannel: "", // ← NOT undefined
      delayInClearance: "", // ← NOT undefined
      delayInDispatch: "", // ← NOT undefined
      psqcaSamples: "", // ← NOT undefined
      remarks: "", // ← NOT undefined
      billingPartiesInfo: "", // ← NOT undefined
      jobRemarks: "", // ← NOT undefined
      insurance: "", // ← NOT undefined
      landing: "", // ← NOT undefined
      principalReference: "", // ← NOT undefined
      clientReference: "", // ← NOT undefined
      indexNo: "", // ← NOT undefined

      // Booleans - OK to use false
      isFreightForwarding: false,
      isClearance: false,
      isTransporter: false,
      isOther: false,

      // Nullable fields (dropdowns) - Use null
      operationType: null,
      operationMode: null,
      jobSubType: null,
      jobLoadType: null,
      jobDocumentType: null,
      processOwnerId: null,
      shipperPartyId: null,
      consigneePartyId: null,
      notifyPartyId: null,
      originAgentId: null,
      localAgentId: null,
      carrierPartyId: null,
      terminalId: null,
      polId: null,
      podId: null,
      placeOfDeliveryId: null,
      freightType: null,
      blstatus: null,
      version: 0,

      ...defaultState,
    },
  });

  const fclForm = useForm<FclContainerFormValues>({
    resolver: zodResolver(fclContainerSchema),
    defaultValues: {
      weight: 0,
      sealNo: "",
      gateOutDate: "",
      gateInDate: "",
      status: "",
      containerRentFc: 0, // ← Defaults to 0, so must be required
      containerRentLc: 0, // ← Defaults to 0, so must be required
      damageDirtyFc: 0, // ← Defaults to 0, so must be required
      damageDirtyLc: 0, // ← Defaults to 0, so must be required
      refundFc: 0, // ← Defaults to 0, so must be required
      refundLc: 0, // ← Defaults to 0, so must be required
      eirSubmitted: false, // ← Defaults to false, so must be required
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
  const shippingType = form.watch("jobSubType"); // FCL or LCL
  const mode = form.watch("operationMode"); // Sea, Air, Road
  const documentType = form.watch("jobDocumentType"); // HOUSE or MASTER
  const shipperPartyId = form.watch("shipperPartyId"); // Shipper Party ID
  const consigneePartyId = form.watch("consigneePartyId"); // Consignee Party ID
  const freightType = form.watch("freightType"); // COLLECT or PREPAID

  // DEBUG LOGGING FOR WATCHED VALUES
  console.log("=== WATCH VALUES DEBUG ===");
  console.log("documentType:", documentType); // Should log "HOUSE" or "MASTER" when selected
  console.log("shippingType:", shippingType); // Should log "FCL" or "LCL" when selected
  console.log("mode:", mode); // Should log "Sea", "Air", "Road" when selected
  console.log("freightType:", freightType); // Should log "COLLECT" or "PREPAID" when selected

  // Helper function to transform API dates to form format (YYYY-MM-DD)
  const formatDateForForm = (isoDate: string | null | undefined) => {
    if (!isoDate) return "";
    try {
      return new Date(isoDate).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const populateForm = (jobData: any) => {
    // Populate main form
    form.reset({
      jobId: jobData.jobId || 0,
      companyId: jobData.companyId || 1,
      jobNumber: jobData.jobNumber || "",
      jobDate: formatDateForForm(jobData.jobDate),
      status: jobData.status || "Draft",

      // ⭐ FIXED: Match API field name
      customerReferenceNumber: jobData.customerReferenceNumber || "",

      // Scope
      isFreightForwarding: jobData.isFreightForwarding || false,
      isClearance: jobData.isClearance || false,
      isTransporter: jobData.isTransporter || false,
      isOther: jobData.isOther || false,

      // Operation
      operationType: jobData.operationType || null,
      operationMode: jobData.operationMode || null,
      jobSubType: jobData.jobSubType || null,
      jobLoadType: jobData.jobLoadType || null,
      jobDocumentType: jobData.jobDocumentType || null,

      // Parties
      processOwnerId: jobData.processOwnerId || null,
      shipperPartyId: jobData.shipperPartyId || null,
      consigneePartyId: jobData.consigneePartyId || null,
      notifyPartyId: jobData.notifyPartyId || null,

      // ⭐ FIXED: Use correct field names (with "Number")
      houseDocumentNumber: jobData.houseDocumentNumber || "",
      houseDocumentDate: formatDateForForm(jobData.houseDocumentDate),
      masterDocumentNumber: jobData.masterDocumentNumber || "",
      masterDocumentDate: formatDateForForm(jobData.masterDocumentDate),

      // Agents
      originAgentId: jobData.originAgentId || null,
      localAgentId: jobData.localAgentId || null,
      carrierPartyId: jobData.carrierPartyId || null,

      // Shipping
      freeDays: jobData.freeDays || 0,
      lastFreeDay: formatDateForForm(jobData.lastFreeDay),
      grossWeight: jobData.grossWeight || 0,
      netWeight: jobData.netWeight || 0,

      // Ports (API uses different names)
      polId: jobData.originPortId || null,
      podId: jobData.destinationPortId || null,
      placeOfDeliveryId: jobData.placeOfDeliveryId || null,

      // Vessel
      vesselName: jobData.vesselName || "",
      terminalId: jobData.terminalPartyId || null,
      expectedArrivalDate: formatDateForForm(jobData.expectedArrivalDate),

      // Documentation
      igmNumber: jobData.igmNumber || "",
      indexNo: jobData.indexNo || "", // API uses indexNo

      freightType: jobData.freightType || null,

      // ⭐ FIXED: Check if API returns blStatus or blstatus
      blstatus: jobData.blstatus || jobData.blstatus || null,

      // Financial - GD
      exchangeRate: jobData.exchangeRate || 0,
      freightCharges: jobData.freightCharges || 0,
      otherCharges: jobData.otherCharges || 0,
      insuranceValue: jobData.insuranceValue || 0,
      insurance: jobData.insurance || "",
      landing: jobData.landing || "",

      // GD Details
      gdNumber: jobData.gdNumber || "",
      gdDate: formatDateForForm(jobData.gdDate),
      gdType: jobData.gdType || "",
      gdClearedUS: jobData.gdClearedUS || "",

      // Security
      securityType: jobData.securityType || "",
      securityValue: jobData.securityValue || 0,
      securityExpiryDate: formatDateForForm(jobData.securityExpiryDate),

      // RMS
      rmsChannel: jobData.rmsChannel || "",
      delayInClearance: jobData.delayInClearance || "",
      delayInDispatch: jobData.delayInDispatch || "",
      psqcaSamples: jobData.psqcaSamples || "",
      remarks: jobData.remarks || "",

      // Additional
      billingPartiesInfo: jobData.billingPartiesInfo || "",
      jobRemarks: jobData.jobRemarks || "",
      version: jobData.version || 0,
      //principalReference: jobData.principalReference || "",
      //clientReference: jobData.clientReference || "",
    });

    // Populate containers (unchanged - already correct)
    if (jobData.jobEquipments && Array.isArray(jobData.jobEquipments)) {
      const transformedContainers = jobData.jobEquipments.map(
        (equipment: any) => ({
          jobEquipmentId: equipment.jobEquipmentId || 0,
          containerNo: equipment.containerNo || "",
          containerSizeId: equipment.containerSizeId || null,
          containerTypeId: equipment.containerTypeId || null,
          weight: equipment.tareWeight || 0,

          sealNo: equipment.sealNo || "",
          eirReceivedOn: formatDateForForm(equipment.eirReceivedOn),
          eirSubmitted: equipment.eirSubmitted || false,
          eirDocumentId: equipment.eirDocumentId || null,

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
        })
      );

      setFclContainers(transformedContainers);
    }

    // Populate invoices (unchanged - already correct)
    if (jobData.jobInvoices && Array.isArray(jobData.jobInvoices)) {
      const transformedInvoices = jobData.jobInvoices.map((invoice: any) => ({
        invoiceId: invoice.jobInvoiceId || 0,
        invoiceNumber: invoice.invoiceNumber || "",
        invoiceDate: formatDateForForm(invoice.invoiceDate),
        invoiceIssuedByPartyId: invoice.issuedByPartyId || null,
        shippingTerm: invoice.shippingTerm || "",

        lcNumber: invoice.lcNumber || "",
        lcValue: invoice.lcValue || 0,
        lcDate: formatDateForForm(invoice.lcDate),
        lcIssuedByBankId: invoice.lcIssuedByBankId || null,
        lcCurrencyId: invoice.lcCurrencyid || null,

        fiNumber: invoice.flNumber || "",
        fiDate: formatDateForForm(invoice.flDate),
        fiExpiryDate: formatDateForForm(invoice.expiryDate),

        items: (invoice.jobInvoiceDetails || []).map((item: any) => ({
          invoiceItemId: item.jobInvoiceDetailId || 0,
          hsCodeId: item.hsCodeId || null,
          hsCode: item.hsCode || "",
          description: item.description || "",
          originId: item.originId || null,
          quantity: item.quantity || 0,
          dutiableValue: item.dutiableValue || 0,
          assessableValue: item.assessableValue || 0,
          totalValue: item.totalValue || 0,
        })),
      }));

      setInvoices(transformedInvoices);
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

      // Add these new API calls
      // Job Main dropdowns
      setOperationTypes(await fetchOperationTypes(setLoadingOperationTypes));
      setOperationModes(await fetchOperationModes(setLoadingOperationModes));
      setJobLoadTypes(await fetchJobLoadTypes(setLoadingJobLoadTypes));
      setJobLoads(await fetchJobLoads(setLoadingJobLoads));
      setDocumentTypes(await fetchDocumentTypes(setLoadingDocumentTypes));

      // ADD THESE NEW API CALLS FOR SHIPPING TAB:
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
        }
      }
    };

    fetchJobData();
  }, [type, defaultState?.jobId]);

  // Calculate gross weight from containers
  useEffect(() => {
    const totalWeight = fclContainers.reduce(
      (sum, container) => sum + (container.weight || 0),
      0
    );
    form.setValue("grossWeight", parseFloat(totalWeight.toFixed(4)));
  }, [fclContainers, form]);

  // Set shipping term based on freight type
  useEffect(() => {
    if (freightType === "COLLECT") {
      invoiceForm.setValue("shippingTerm", "FOB");
    } else if (freightType === "PREPAID") {
      invoiceForm.setValue("shippingTerm", "DDP");
    }
  }, [freightType, invoiceForm]);

  // Calculate insurance
  useEffect(() => {
    if (insuranceType === "1percent") {
      const totalAV = invoices.reduce((sum, inv) => {
        return (
          sum +
          inv.items.reduce((itemSum, item) => itemSum + item.assessableValue, 0)
        );
      }, 0);
      const insuranceValue = totalAV * 0.01;
      form.setValue("insuranceValue", parseFloat(insuranceValue.toFixed(2)));
      form.setValue("insurance", "1%");
    }
  }, [insuranceType, invoices, form]);

  // Set billing parties info
  useEffect(() => {
    if (shipperPartyId && consigneePartyId) {
      const shipper = parties.find((p) => p.value === shipperPartyId);
      const consignee = parties.find((p) => p.value === consigneePartyId);
      if (shipper && consignee) {
        form.setValue(
          "billingPartiesInfo",
          `Shipper: ${shipper.label} | Consignee: ${consignee.label}`
        );
      }
    } else {
      form.setValue("billingPartiesInfo", "");
    }
  }, [shipperPartyId, consigneePartyId, parties, form]);

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

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

      // Get CompanyId from localStorage
      const companyId = parseInt(localStorage.getItem("companyId") || "1");

      // ========================================
      // 1. MAP INVOICES TO jobInvoices FORMAT
      // ========================================
      const jobInvoices = invoices.map((invoice) => ({
        invoiceId: invoice.invoiceId || 0,
        invoiceNumber: invoice.invoiceNumber || "",
        invoiceDate: invoice.invoiceDate || null,
        invoiceIssuedByPartyId: invoice.invoiceIssuedByPartyId || null,
        shippingTerm: invoice.shippingTerm || null,
        lcNumber: invoice.lcNumber || null,
        lcDate: invoice.lcDate || null,
        lcIssuedByBankId: invoice.lcIssuedByBankId || null,
        lcValue: invoice.lcValue || 0,
        lcCurrencyId: invoice.lcCurrencyId || null,
        fiNumber: invoice.fiNumber || null,
        fiDate: invoice.fiDate || null,
        fiExpiryDate: invoice.fiExpiryDate || null,

        jobInvoiceItems: (invoice.items || []).map((item) => ({
          invoiceItemId: item.invoiceItemId || 0,
          hsCodeId: item.hsCodeId || null,
          hsCode: item.hsCode || "",
          description: item.description || "",
          originId: item.originId || null,
          quantity: item.quantity || 0,
          dutiableValue: item.dutiableValue || 0,
          assessableValue: item.assessableValue || 0,
          totalValue: item.totalValue || 0,
        })),
      }));

      // ========================================
      // 2. MAP FCL CONTAINERS TO jobEquipments FORMAT
      // WITH ALL REQUIRED FIELDS
      // ========================================
      const jobEquipments = fclContainers.map((container) => ({
        jobEquipmentId: container.jobEquipmentId || 0,
        companyId: companyId, // ← From localStorage
        jobId: values.jobId || 0, // Will be set properly by API

        // Basic Fields
        containerNo: container.containerNo || "",
        containerTypeId: container.containerTypeId || null,
        containerSizeId: container.containerSizeId || null,

        // Weight field mapped to TareWeight
        tareWeight: container.weight || 0,

        // Additional Fields
        sealNo: container.sealNo || null,

        // EIR Fields
        eirReceivedOn: container.eirReceivedOn
          ? new Date(container.eirReceivedOn).toISOString()
          : null,
        eirSubmitted: container.eirSubmitted || false,
        eirDocumentId: container.eirDocumentId || null,

        // Rent Fields
        rentInvoiceIssuedOn: container.rentInvoiceIssuedOn
          ? new Date(container.rentInvoiceIssuedOn).toISOString()
          : null,
        containerRentFc: container.containerRentFc || 0,
        containerRentLc: container.containerRentLc || 0,

        // Damage/Dirty Fields
        damageDirtyFc: container.damageDirtyFc || 0,
        damageDirtyLc: container.damageDirtyLc || 0,

        // Refund Fields
        refundAppliedOn: container.refundAppliedOn
          ? new Date(container.refundAppliedOn).toISOString()
          : null,
        refundFc: container.refundFc || 0,
        refundLc: container.refundLc || 0,

        // Gate Fields
        gateOutDate: container.gateOutDate
          ? new Date(container.gateOutDate).toISOString()
          : null,
        gateInDate: container.gateInDate
          ? new Date(container.gateInDate).toISOString()
          : null,

        // Status
        status: container.status || null,

        // Version
        version: 0,
      }));

      // ========================================
      // 3. BUILD COMPLETE PAYLOAD
      // ========================================
      const payload: any = {
        companyId: companyId,
        jobNumber: values.jobNumber || "",
        jobDate: values.jobDate
          ? new Date(values.jobDate).toISOString()
          : new Date().toISOString(),
        customerReferenceNumber: values.customerReferenceNumber || null,

        operationType: values.operationType || null,
        operationMode: values.operationMode || null,
        loadType: values.loadType || null,
        load: values.load || null,
        documentType: values.documentType || null,
        direction: values.direction || null,
        jobDocumentType: values.jobDocumentType || null,
        jobSubType: values.jobSubType || null,
        jobLoadType: values.jobLoadType || null,
        processOwnerId: values.processOwnerId || null,
        principalId: values.principalId || null,
        overseasAgentId: values.originAgentId || null,
        terminalPartyId: values.terminalId || null,
        originPortId: values.polId || null,
        destinationPortId: values.podId || null,
        principalReference: values.principalReference || null,
        clientReference: values.clientReference || null,

        status: values.status || "Draft",

        isFreightForwarding: values.isFreightForwarding || false,
        isClearance: values.isClearance || false,
        isTransporter: values.isTransporter || false,
        isOther: values.isOther || false,
        insurance: values.insurance || null,
        billingPartiesInfo: values.billingPartiesInfo || null,
        jobRemarks: values.jobRemarks || null,

        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        notifyPartyId: values.notifyPartyId || null,
        billingToShipperId: values.billingToShipperId || null,
        billingToConsigneeId: values.billingToConsigneeId || null,

        houseDocumentNumber: values.houseDocumentNumber || null,
        houseDocumentDate: values.houseDocumentDate
          ? new Date(values.houseDocumentDate).toISOString()
          : null,
        originAgentId: values.originAgentId || null,
        masterDocumentNumber: values.masterDocumentNumber || null,
        masterDocumentDate: values.masterDocumentDate
          ? new Date(values.masterDocumentDate).toISOString()
          : null,
        localAgentId: values.localAgentId || null,
        carrierPartyId: values.carrierPartyId || null,
        freeDays: values.freeDays || null,
        lastFreeDay: values.lastFreeDay
          ? new Date(values.lastFreeDay).toISOString()
          : null,
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,
        polId: values.polId || null,
        podId: values.podId || null,
        placeOfDeliveryId: values.placeOfDeliveryId || null,
        vesselName: values.vesselName || null,
        terminalId: values.terminalId || null,
        expectedArrivalDate: values.expectedArrivalDate
          ? new Date(values.expectedArrivalDate).toISOString()
          : null,
        igmNumber: values.igmNumber || null,
        indexNo: values.indexNo || null,
        freightType: values.freightType || null,
        blstatus: values.blstatus || null,

        exchangeRate: values.exchangeRate || 0,
        freightCharges: values.freightCharges || 0,
        otherCharges: values.otherCharges || 0,
        insuranceValue: values.insuranceValue || 0,
        landing: values.landing || null,
        gdNumber: values.gdNumber || null,
        gdDate: values.gdDate ? new Date(values.gdDate).toISOString() : null,
        gdType: values.gdType || null,
        gdClearedUS: values.gdClearedUS || null,
        securityType: values.securityType || null,
        securityValue: values.securityValue || null,
        securityExpiryDate: values.securityExpiryDate
          ? new Date(values.securityExpiryDate).toISOString()
          : null,
        rmsChannel: values.rmsChannel || null,
        delayInClearance: values.delayInClearance || null,
        delayInDispatch: values.delayInDispatch || null,
        psqcaSamples: values.psqcaSamples || null,
        remarks: values.remarks || null,

        // ⭐ UPDATED: Complete equipment payload
        jobEquipments: jobEquipments,
        jobInvoices: jobInvoices,

        version: values.version || 0,
      };

      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      } else {
        payload.jobId = 0;
      }

      console.log("=== PAYLOAD DEBUG ===");
      console.log("CompanyId from localStorage:", companyId);
      console.log("Equipment Count:", jobEquipments.length);
      console.log("Sample Equipment:", jobEquipments[0]);
      console.log("Complete Payload:", payload);

      // Add this before the fetch call
      console.log("=== UPDATE DEBUG ===");
      console.log("Edit Mode:", type === "edit");
      console.log("Job ID:", payload.jobId);
      console.log("Has houseDocumentNumber:", !!payload.houseDocumentNumber);
      console.log("Has masterDocumentNumber:", !!payload.masterDocumentNumber);
      console.log("Complete Payload:", JSON.stringify(payload, null, 2));

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      const response = await fetch(`${baseUrl}Job`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error("Failed to save job");
      }

      const result = await response.json();

      toast({
        title: "Success!",
        description: `Job ${
          type === "edit" ? "updated" : "created"
        } successfully`,
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

    // Add these new props
    operationTypes,
    operationModes,
    jobLoadTypes,
    jobLoads,
    documentTypes,

    // ADD THESE NEW SHIPPING PROPS:
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

    // Add these new loading states
    loadingOperationTypes,
    loadingOperationModes,
    loadingJobLoadTypes,
    loadingJobLoads,
    loadingDocumentTypes,

    // ADD THESE NEW LOADING STATES:
    loadingPackageTypes,
    loadingFreightTypes,
    loadingBLStatuses,

    shippingType,
    mode,
    documentType,
    freightType,
    shipperPartyId,
    consigneePartyId,
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ADD LOADING INDICATOR HERE */}
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
                <TabsList className='grid w-full grid-cols-6 mb-3'>
                  <TabsTrigger value='main'>Job Order</TabsTrigger>
                  <TabsTrigger value='shipping'>Shipping</TabsTrigger>
                  <TabsTrigger value='invoice'>Invoice</TabsTrigger>
                  <TabsTrigger value='gd'>GD Info</TabsTrigger>
                  <TabsTrigger value='dispatch'>Dispatch</TabsTrigger>
                  <TabsTrigger value='completion'>Completion</TabsTrigger>
                </TabsList>

                {/* All tabs as separate components */}
                <JobMainTab {...sharedProps} />
                <ShippingTab {...sharedProps} />
                <InvoiceTab {...sharedProps} />
                <GDTab {...sharedProps} />
                <DispatchTab {...sharedProps} />
                <CompletionTab {...sharedProps} />
              </Tabs>
            )}

            {/* Submit Button - Show only when not loading */}
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
