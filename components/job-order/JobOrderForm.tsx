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
      companyId: 1,
      status: "Draft",
      freeDays: 0,
      grossWeight: 0,
      netWeight: 0,
      exchangeRate: 0,
      securityValue: 0,
      freightCharges: 0,
      otherCharges: 0,
      jobDate: new Date().toISOString().split("T")[0],

      // ADD THESE SCOPE CHECKBOX DEFAULTS:
      isFreightForwarding: false,
      isClearance: false,
      isTransporter: false,
      isOther: false,

      ...defaultState,
    },
  });

  const fclForm = useForm<FclContainerFormValues>({
    resolver: zodResolver(fclContainerSchema),
    defaultValues: { weight: 0, noOfPackages: 0 },
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

  // REMOVE THIS ENTIRE useEffect:
  /*
  useEffect(() => {
    if (type === "add") {
      generateJobNumber();
    }
  }, [type]);
  */

  // REMOVE THIS ENTIRE FUNCTION:
  /*
  const generateJobNumber = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Job/GenerateJobNumber`);
      if (response.ok) {
        const data = await response.text();
        const jobNumber = data.replace(/"/g, "");
        form.setValue("jobNumber", jobNumber);
      }
    } catch (error) {
      console.error("Error generating job number:", error);
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      form.setValue("jobNumber", `JOB-${timestamp}-${randomNum}`);
    }
  };
  */

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

  const onSubmit_Old = async (values: JobMasterFormValues) => {
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      const payload: any = {
        companyId: values.companyId || 1,
        jobNumber: values.jobNumber || "",
        jobDate: values.jobDate
          ? new Date(values.jobDate).toISOString()
          : new Date().toISOString(),
        // ADD THESE SCOPE FIELDS:
        isFreightForwarding: values.isFreightForwarding || false,
        isClearance: values.isClearance || false,
        isTransporter: values.isTransporter || false,
        isOther: values.isOther || false,
        operationType: values.operationType || null,
        operationMode: values.operationMode || null,
        jobDocumentType: values.jobDocumentType || null,
        houseDocumentNumber: values.houseDocumentNumber || null,
        houseDocumentDate: values.houseDocumentDate
          ? new Date(values.houseDocumentDate).toISOString()
          : null,
        masterDocumentNumber: values.masterDocumentNumber || null,
        masterDocumentDate: values.masterDocumentDate
          ? new Date(values.masterDocumentDate).toISOString()
          : null,
        jobSubType: values.jobSubType || null,
        jobLoadType: values.jobLoadType || null,
        freightType: values.freightType || null,
        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        principalId: values.processOwnerId || null,
        overseasAgentId: values.originAgentId || null,

        terminalPartyId: values.terminalId || null,
        originPortId: values.polId || null,
        destinationPortId: values.podId || null,
        placeOfDeliveryId: values.placeOfDeliveryId || null,
        vesselName: values.vesselName || null,
        grossWeight: values.grossWeight || 0,
        netWeight: parseFloat(values.netWeight?.toFixed(4)) || 0,
        freeDays: values.freeDays || 0,
        lastFreeDay: values.lastFreeDay
          ? new Date(values.lastFreeDay).toISOString()
          : null,
        gdType: values.gdType || null,
        gdNumber: values.gdNumber || null,
        gdDate: values.gdDate ? new Date(values.gdDate).toISOString() : null,
        igmNumber: values.igmNumber || null,
        indexNo: values.indexNumber || null,
        blStatus: values.blStatus || null,
        insurance: values.insurance || null,
        insuranceValue: values.insuranceValue || 0,
        landing: values.landing || null,
        exchangeRate: parseFloat(values.exchangeRate?.toFixed(4)) || 0,
        freightCharges: values.freightCharges || 0,
        otherCharges: values.otherCharges || 0,
        status: values.status || "DRAFT",
        remarks: values.remarks || null,
        version: values.version || 0,
        jobEquipments: fclContainers.map((c) => ({
          jobEquipmentId: c.jobEquipmentId || 0,
          containerNo: c.containerNo,
          containerTypeId: c.containerTypeId || null,
          containerSizeId: c.containerSizeId || null,
          tareWeight: c.weight || 0,
          version: 0,
        })),
        jobInvoices: invoices.map((inv) => ({
          jobInvoiceId: inv.invoiceId || 0,
          invoiceNumber: inv.invoiceNumber || "",
          invoiceDate: inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString()
            : null,
          issuedByPartyId: inv.invoiceIssuedByPartyId || null,
          shippingTerm: inv.shippingTerm || "",
          lcNumber: inv.lcNumber || "",
          lcValue: inv.lcValue || 0,
          lcDate: inv.lcDate ? new Date(inv.lcDate).toISOString() : null,
          lcIssuedByBankId: inv.lcIssuedByBankId || null,
          lcCurrencyid: inv.lcCurrencyId || null,
          flNumber: inv.fiNumber || "",
          flDate: inv.fiDate ? new Date(inv.fiDate).toISOString() : null,
          expiryDate: inv.fiExpiryDate
            ? new Date(inv.fiExpiryDate).toISOString()
            : null,
          version: 0,
          jobInvoiceDetails: inv.items.map((item) => ({
            jobInvoiceDetailId: item.invoiceItemId || 0,
            hsCodeId: item.hsCodeId || null,
            hsCode: item.hsCode || "",
            description: item.description || "",
            originId: item.originId || null,
            quantity: item.quantity || 0,
            dutiableValue: item.dutiableValue || 0,
            assessableValue: item.assessableValue || 0,
            totalValue: item.totalValue || 0,
            version: 0,
          })),
        })),
      };

      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      }

      console.log("Payload:", payload);

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

  // COMPLETE onSubmit FUNCTION - COPY & PASTE THIS INTO JobOrderForm.tsx

  // COMPLETE onSubmit FUNCTION - UPDATED FOR YOUR PATTERN
  // Copy & Paste this into your JobOrderForm component

  // COMPLETE onSubmit FUNCTION - WITH STATUS FIELD
  // Copy & Paste this into your JobOrderForm component

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);

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

        // Map invoice items to jobInvoiceItems
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
      // ========================================
      const jobEquipments = fclContainers.map((container) => ({
        jobEquipmentId: container.jobEquipmentId || 0,
        containerNo: container.containerNo || "",
        containerTypeId: container.containerTypeId || null,
        containerSizeId: container.containerSizeId || null,
        tareWeight: container.weight || 0,
        noOfPackages: container.noOfPackages || 0,
        packageType: container.packageType || null,
      }));

      // ========================================
      // 3. BUILD COMPLETE PAYLOAD
      // ========================================
      const payload: any = {
        // Job Main fields
        companyId: values.companyId || 1,
        jobNumber: values.jobNumber || "",
        jobDate: values.jobDate
          ? new Date(values.jobDate).toISOString()
          : new Date().toISOString(),
        indexNo: values.indexNo || null,
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

        // Shipping fields
        status: values.status || "Draft", // Default to "Draft" if not provided

        // Scope checkboxes
        isFreightForwarding: values.isFreightForwarding || false,
        isClearance: values.isClearance || false,
        isTransporter: values.isTransporter || false,
        isOther: values.isOther || false,
        insurance: values.insurance || null,

        billingPartiesInfo: values.billingPartiesInfo || null,
        jobRemarks: values.jobRemarks || null,

        // Parties
        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        notifyPartyId: values.notifyPartyId || null,
        billingToShipperId: values.billingToShipperId || null,
        billingToConsigneeId: values.billingToConsigneeId || null,

        // Shipping fields
        houseDocumentNo: values.houseDocumentNo || null,
        houseDocumentDate: values.houseDocumentDate || null,
        originAgentId: values.originAgentId || null,
        masterDocumentNo: values.masterDocumentNo || null,
        masterDocumentDate: values.masterDocumentDate || null,
        localAgentId: values.localAgentId || null,
        carrierPartyId: values.carrierPartyId || null,
        freeDays: values.freeDays || null,
        lastFreeDay: values.lastFreeDay || null,
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,
        polId: values.polId || null,
        podId: values.podId || null,
        placeOfDeliveryId: values.placeOfDeliveryId || null,
        vesselName: values.vesselName || null,
        terminalId: values.terminalId || null,
        expectedArrivalDate: values.expectedArrivalDate || null,
        igmNumber: values.igmNumber || null,
        indexNumber: values.indexNumber || null,
        freightType: values.freightType || null,
        blStatus: values.blStatus || null,

        // GD fields
        exchangeRate: values.exchangeRate || 0,
        freightCharges: values.freightCharges || 0,
        otherCharges: values.otherCharges || 0,
        insuranceValue: values.insuranceValue || 0,
        landing: values.landing || null,
        gdNumber: values.gdNumber || null,
        gdDate: values.gdDate || null,
        gdType: values.gdType || null,
        gdClearedUS: values.gdClearedUS || null,
        securityType: values.securityType || null,
        securityValue: values.securityValue || null,
        securityExpiryDate: values.securityExpiryDate || null,
        rmsChannel: values.rmsChannel || null,
        delayInClearance: values.delayInClearance || null,
        delayInDispatch: values.delayInDispatch || null,
        psqcaSamples: values.psqcaSamples || null,
        remarks: values.remarks || null,

        // Mapped arrays
        jobInvoices: jobInvoices,
        jobEquipments: jobEquipments,

        version: 0,
      };

      // Add jobId for edit mode
      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      } else {
        payload.jobId = 0;
      }

      // ========================================
      // 4. DEBUG LOGGING
      // ========================================
      console.log("=== PAYLOAD DEBUG ===");
      console.log("Type:", type);
      console.log("Status:", payload.status);
      console.log("Invoices State:", invoices);
      console.log("FCL Containers State:", fclContainers);
      console.log("Mapped jobInvoices:", jobInvoices);
      console.log("Mapped jobEquipments:", jobEquipments);
      console.log("Complete Payload:", payload);

      // ========================================
      // 5. API CALL
      // ========================================
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

  // ========================================
  // USAGE IN FORM
  // ========================================
  // <Form {...form}>
  //   <form onSubmit={form.handleSubmit(onSubmit)}>
  //     {/* Your tabs and fields */}
  //   </form>
  // </Form>

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

            {/* Submit Button */}
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
          </form>
        </Form>
      </div>
    </div>
  );
}
