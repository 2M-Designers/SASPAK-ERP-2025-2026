"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Compact styles for react-select
const compactSelectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "32px",
    height: "32px",
    fontSize: "13px",
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "32px",
    padding: "0 6px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "32px",
  }),
};

// Job Master Schema
const jobMasterSchema = z.object({
  jobId: z.number().optional(),
  companyId: z.number().default(1),
  jobNumber: z.string().min(1, "Required"),
  scope: z.string().optional(),
  direction: z.string().optional(),
  mode: z.string().optional(),
  shippingType: z.string().optional(),
  load: z.string().optional(),
  documentType: z.string().optional(),
  shipperPartyId: z.number().optional(),
  consigneePartyId: z.number().optional(),
  billingPartiesId: z.number().optional(),
  houseDocumentNo: z.string().optional(),
  houseDocumentDate: z.string().optional(),
  masterDocumentNo: z.string().optional(),
  masterDocumentDate: z.string().optional(),
  carrierPartyId: z.number().optional(),
  originAgentId: z.number().optional(),
  localAgentId: z.number().optional(),
  freeDays: z.number().min(0).default(0),
  till: z.string().optional(),
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  polId: z.number().optional(),
  podId: z.number().optional(),
  placeOfDeliveryId: z.number().optional(),
  vesselName: z.string().optional(),
  terminalId: z.number().optional(),
  expectedArrivalDate: z.string().optional(),
  igmNumber: z.string().optional(),
  indexNumber: z.string().optional(),
  freightType: z.string().optional(),
  blStatus: z.string().optional(),
  exchangeRate: z.number().min(0).default(0),
  insurance: z.string().optional(),
  landing: z.string().optional(),
  gdNumber: z.string().optional(),
  gdDate: z.string().optional(),
  gdType: z.string().optional(),
  gdClearedUS: z.string().optional(),
  securityType: z.string().optional(),
  securityValue: z.number().min(0).default(0),
  securityExpiryDate: z.string().optional(),
  rmsChannel: z.string().optional(),
  delayInClearance: z.string().optional(),
  delayInDispatch: z.string().optional(),
  psqcaSamples: z.string().optional(),
  remarks: z.string().optional(),
  status: z.string().default("DRAFT"),
  version: z.number().optional(),
});

// FCL Container Schema
const fclContainerSchema = z.object({
  jobEquipmentId: z.number().optional(),
  containerNo: z.string().min(1, "Required"),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),
  weight: z.number().min(0).default(0),
  noOfPackages: z.number().min(0).default(0),
  packageType: z.string().optional(),
});

// Invoice Schema (Multiple)
const invoiceSchema = z.object({
  invoiceId: z.number().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  invoiceIssuedBy: z.string().optional(),
  shippingTerm: z.string().optional(),
  lcNumber: z.string().optional(),
  lcDate: z.string().optional(),
  lcIssuedBy: z.string().optional(),
  lcValue: z.number().min(0).default(0),
  lcCurrencyId: z.number().optional(),
  fiNumber: z.string().optional(),
  fiDate: z.string().optional(),
  fiExpiryDate: z.string().optional(),
});

type JobMasterFormValues = z.infer<typeof jobMasterSchema>;
type FclContainerFormValues = z.infer<typeof fclContainerSchema>;
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

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
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [containerSizes, setContainerSizes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Loading states
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingContainerTypes, setLoadingContainerTypes] = useState(false);
  const [loadingContainerSizes, setLoadingContainerSizes] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  // Child records
  const [fclContainers, setFclContainers] = useState<FclContainerFormValues[]>(
    []
  );
  const [invoices, setInvoices] = useState<InvoiceFormValues[]>([]);

  // Form visibility
  const [showFclForm, setShowFclForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<number | null>(null);

  const form = useForm<JobMasterFormValues>({
    resolver: zodResolver(jobMasterSchema),
    mode: "onChange",
    defaultValues: {
      companyId: 1,
      status: "DRAFT",
      freeDays: 0,
      grossWeight: 0,
      netWeight: 0,
      exchangeRate: 0,
      securityValue: 0,
      ...defaultState,
    },
  });

  const fclForm = useForm<FclContainerFormValues>({
    resolver: zodResolver(fclContainerSchema),
    defaultValues: { weight: 0, noOfPackages: 0 },
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { lcValue: 0 },
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
            data.map((p: any) => ({
              value: p.partyId,
              label: `${p.partyCode} - ${p.partyName}`,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
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
            data.map((t: any) => ({
              value: t.containerTypeId,
              label: `${t.typeCode}`,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching container types:", error);
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
          setContainerSizes(
            data.map((s: any) => ({
              value: s.containerSizeId,
              label: s.sizeCode,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching container sizes:", error);
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
          setLocations(
            data.map((l: any) => ({
              value: l.unlocationId,
              label: `${l.uncode || ""} - ${l.locationName}`,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
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
            data.map((c: any) => ({
              value: c.currencyId,
              label: c.currencyCode,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchContainerTypes();
    fetchContainerSizes();
    fetchLocations();
    fetchCurrencies();
  }, []);

  // Handlers for child records
  const handleAddFcl = (data: FclContainerFormValues) => {
    setFclContainers([...fclContainers, data]);
    fclForm.reset({ weight: 0, noOfPackages: 0 });
    setShowFclForm(false);
    toast({ title: "Success", description: "Container added" });
  };

  const handleDeleteFcl = (index: number) => {
    setFclContainers(fclContainers.filter((_, i) => i !== index));
    toast({ title: "Success", description: "Container deleted" });
  };

  const handleAddInvoice = (data: InvoiceFormValues) => {
    if (editingInvoice !== null) {
      const updated = [...invoices];
      updated[editingInvoice] = data;
      setInvoices(updated);
      toast({ title: "Success", description: "Invoice updated" });
    } else {
      setInvoices([...invoices, data]);
      toast({ title: "Success", description: "Invoice added" });
    }
    invoiceForm.reset({ lcValue: 0 });
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleEditInvoice = (index: number) => {
    setEditingInvoice(index);
    invoiceForm.reset(invoices[index]);
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = (index: number) => {
    setInvoices(invoices.filter((_, i) => i !== index));
    toast({ title: "Success", description: "Invoice deleted" });
  };

  const onSubmit = async (values: JobMasterFormValues) => {
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      const payload: any = {
        companyId: values.companyId || 1,
        jobNumber: values.jobNumber,
        operationType: values.direction || null,
        jobSubType: values.mode || null,
        fclLclType: values.shippingType || null,
        partyId: values.billingPartiesId || null,
        shipperPartyId: values.shipperPartyId || null,
        consigneePartyId: values.consigneePartyId || null,
        originPortId: values.polId || null,
        destinationPortId: values.podId || null,
        vesselName: values.vesselName || null,
        freeDays: values.freeDays || 0,
        igmNumber: values.igmNumber || null,
        hblNumber: values.houseDocumentNo || null,
        mawbNumber: values.masterDocumentNo || null,
        gdType: values.gdType || null,
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
      };

      if (type === "edit" && values.jobId) {
        payload.jobId = values.jobId;
      }

      const response = await fetch(`${baseUrl}Job`, {
        method: type === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-3 py-3 max-w-[1600px]'>
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <h1 className='text-xl font-bold text-gray-900'>
            {type === "edit" ? "Edit Job Order" : "New Job Order"}
          </h1>
          <Button
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
                <TabsTrigger value='main'>Job Order Main Info</TabsTrigger>
                <TabsTrigger value='shipping'>Shipping Info</TabsTrigger>
                <TabsTrigger value='invoice'>Invoice Details</TabsTrigger>
                <TabsTrigger value='gd'>Dispatch & Completion</TabsTrigger>
              </TabsList>

              {/* Job Order Main Info Tab */}
              <TabsContent value='main' className='mt-0'>
                <Card>
                  <CardHeader className='py-3 px-4 bg-blue-50'>
                    <CardTitle className='text-base text-center'>
                      Job Order Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-4'>
                    {/* Job Order Number & Date */}
                    <div className='grid grid-cols-12 gap-2 mb-3'>
                      <div className='col-span-2 font-semibold'>
                        <FormLabel className='text-sm'>
                          Job Order Number #
                        </FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='jobNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  className='h-8 text-xs'
                                  placeholder='Auto-generated'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Job Order Date
                        </FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <Input
                          type='date'
                          defaultValue={new Date().toISOString().split("T")[0]}
                          className='h-8 text-xs'
                        />
                      </div>
                    </div>

                    <div className='border-t mb-3'></div>

                    {/* Scope Row with Checkboxes */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs font-semibold'>
                          Scope
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <div className='flex gap-4'>
                          <label className='flex items-center gap-1 text-xs'>
                            <input type='checkbox' className='h-3 w-3' />
                            Freight
                          </label>
                          <label className='flex items-center gap-1 text-xs'>
                            <input type='checkbox' className='h-3 w-3' />
                            Clearance
                          </label>
                          <label className='flex items-center gap-1 text-xs'>
                            <input type='checkbox' className='h-3 w-3' />
                            Transport
                          </label>
                          <label className='flex items-center gap-1 text-xs'>
                            <input type='checkbox' className='h-3 w-3' />
                            Other
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Direction Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Direction</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='direction'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "IMPORT", label: "Import" },
                                    { value: "EXPORT", label: "Export" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Import / Export'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Mode Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Mode</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='mode'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "SEA", label: "Sea" },
                                    { value: "AIR", label: "Air" },
                                    { value: "ROAD", label: "Road" },
                                    { value: "LAND", label: "Land" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Sea / Air / Road / Land'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Shipping Type Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Shipping Type</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='shippingType'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "FCL", label: "FCL" },
                                    { value: "LCL", label: "LCL" },
                                    { value: "BB", label: "BB" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='FCL / LCL / BB'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Load Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Load</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='load'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "FULL", label: "Full" },
                                    { value: "PART", label: "Part" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Full / Part'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Document Type Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Document Type</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='documentType'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "MBL", label: "MBL" },
                                    { value: "HBL", label: "HBL" },
                                    { value: "MAWB", label: "MAWB" },
                                    { value: "HAWB", label: "HAWB" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='MBL / HBL or MAWB / HAWB'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Shipper Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Shipper</FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='shipperPartyId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingParties}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Consignee Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Consignee</FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='consigneePartyId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingParties}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Billing Parties Row */}
                    <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Billing Parties
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='billingPartiesId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingParties}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shipping Information Tab */}
              <TabsContent value='shipping' className='mt-0'>
                <Card>
                  <CardHeader className='py-3 px-4 bg-blue-50'>
                    <CardTitle className='text-base text-center'>
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-4'>
                    {/* House Document Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          House Document No.
                        </FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='houseDocumentNo'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Date</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='houseDocumentDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='DD/MM/YYYY'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-2 text-right'>
                        <FormLabel className='text-xs'>Origin Agent</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='originAgentId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Master Document Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Master Document No.
                        </FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='masterDocumentNo'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Date</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='masterDocumentDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='DD/MM/YYYY'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-2 text-right'>
                        <FormLabel className='text-xs'>Local Agent</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='localAgentId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Carrier Row */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Carrier</FormLabel>
                      </div>
                      <div className='col-span-5'>
                        <FormField
                          control={form.control}
                          name='carrierPartyId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Free Days</FormLabel>
                      </div>
                      <div className='col-span-1'>
                        <FormField
                          control={form.control}
                          name='freeDays'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Till</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='till'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='DD/MM/YYYY'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Weight Rows */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Gross Weight</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='grossWeight'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Net Weight</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='netWeight'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Ports Rows */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Port of Loading
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='polId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={locations}
                                  value={locations.find(
                                    (l) => l.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingLocations}
                                  isClearable
                                  placeholder='Fill from Locations'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Port of Discharge
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='podId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={locations}
                                  value={locations.find(
                                    (l) => l.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingLocations}
                                  isClearable
                                  placeholder='Fill from Locations'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Place of Delivery
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='placeOfDeliveryId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={locations}
                                  value={locations.find(
                                    (l) => l.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingLocations}
                                  isClearable
                                  placeholder='Fill from Locations'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Vessel Name */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs font-semibold'>
                          Vessel Name
                        </FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='vesselName'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  className='h-8 text-xs'
                                  placeholder='Fill From Vessel Setup'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Terminal */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Terminal</FormLabel>
                      </div>
                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='terminalId'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={parties}
                                  value={parties.find(
                                    (p) => p.value === field.value
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Fill from Parties'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Expected Arrival, IGM, Index */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Expected Arrival Date
                        </FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='expectedArrivalDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='DD/MM/YYYY'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>IGM No.</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='igmNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Index No.</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='indexNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Freight & BL Status */}
                    <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Freight</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='freightType'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "COLLECT", label: "Collect" },
                                    { value: "PREPAID", label: "Prepaid" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Collect / Prepaid'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>BL Status</FormLabel>
                      </div>
                      <div className='col-span-3'>
                        <FormField
                          control={form.control}
                          name='blStatus'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "ORIGINAL", label: "Original" },
                                    { value: "SG", label: "SG" },
                                    { value: "TELEX", label: "Telex" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                  placeholder='Original / SG / Telex'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='border-t my-4'></div>

                    {/* Conditional FCL Section */}
                    {form.watch("shippingType") === "FCL" && (
                      <div className='mb-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <div className='text-sm font-semibold text-gray-700'>
                            Container Details
                          </div>
                          <Button
                            type='button'
                            size='sm'
                            onClick={() => setShowFclForm(!showFclForm)}
                            className='h-7 text-xs'
                          >
                            <Plus className='h-3 w-3 mr-1' />
                            Add Container
                          </Button>
                        </div>

                        {showFclForm && (
                          <Card className='mb-3 border-green-200'>
                            <CardContent className='p-3'>
                              <div className='grid grid-cols-7 gap-2 mb-2'>
                                <FormField
                                  control={fclForm.control}
                                  name='containerNo'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        Container No.
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={fclForm.control}
                                  name='containerSizeId'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        Container Size
                                      </FormLabel>
                                      <FormControl>
                                        <Select
                                          options={containerSizes}
                                          value={containerSizes.find(
                                            (s) => s.value === field.value
                                          )}
                                          onChange={(val) =>
                                            field.onChange(val?.value)
                                          }
                                          styles={compactSelectStyles}
                                          isClearable
                                          placeholder='Fill from API'
                                        />
                                      </FormControl>
                                      <FormLabel className='text-xs text-gray-500'>
                                        Fill from API
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={fclForm.control}
                                  name='containerTypeId'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        Container Type
                                      </FormLabel>
                                      <FormControl>
                                        <Select
                                          options={containerTypes}
                                          value={containerTypes.find(
                                            (t) => t.value === field.value
                                          )}
                                          onChange={(val) =>
                                            field.onChange(val?.value)
                                          }
                                          styles={compactSelectStyles}
                                          isClearable
                                          placeholder='Fill from API'
                                        />
                                      </FormControl>
                                      <FormLabel className='text-xs text-gray-500'>
                                        Fill from API
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={fclForm.control}
                                  name='weight'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        Weight
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          step='0.01'
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              Number(e.target.value)
                                            )
                                          }
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={fclForm.control}
                                  name='noOfPackages'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        No. of Packages
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              Number(e.target.value)
                                            )
                                          }
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={fclForm.control}
                                  name='packageType'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-xs'>
                                        Package Type
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <div className='flex items-end'>
                                  <Button
                                    type='button'
                                    onClick={fclForm.handleSubmit(handleAddFcl)}
                                    size='sm'
                                    className='h-8 text-xs w-full'
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {fclContainers.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className='text-xs'>
                                  Container No.
                                </TableHead>
                                <TableHead className='text-xs'>Size</TableHead>
                                <TableHead className='text-xs'>Type</TableHead>
                                <TableHead className='text-xs'>
                                  Weight
                                </TableHead>
                                <TableHead className='text-xs'>
                                  Packages
                                </TableHead>
                                <TableHead className='text-xs'>
                                  Package Type
                                </TableHead>
                                <TableHead className='text-xs'>
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fclContainers.map((container, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className='text-xs'>
                                    {container.containerNo}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {containerSizes.find(
                                      (s) =>
                                        s.value === container.containerSizeId
                                    )?.label || "-"}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {containerTypes.find(
                                      (t) =>
                                        t.value === container.containerTypeId
                                    )?.label || "-"}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {container.weight}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {container.noOfPackages}
                                  </TableCell>
                                  <TableCell className='text-xs'>
                                    {container.packageType || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => handleDeleteFcl(idx)}
                                      className='h-6 w-6 p-0'
                                    >
                                      <Trash2 className='h-3 w-3 text-red-600' />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}

                    {/* Conditional LCL/Air Sections */}
                    {(form.watch("shippingType") === "LCL" ||
                      form.watch("mode") === "AIR") && (
                      <>
                        <div className='mb-3'>
                          <div className='text-sm font-semibold text-gray-700 mb-2'>
                            IF shipping Type is LCL/Air
                          </div>
                          <div className='grid grid-cols-3 gap-2'>
                            <div>
                              <FormLabel className='text-xs'>
                                No. of Packages (Qty)
                              </FormLabel>
                              <Input type='number' className='h-8 text-xs' />
                            </div>
                            <div>
                              <FormLabel className='text-xs'>
                                Package Type
                              </FormLabel>
                              <Input className='h-8 text-xs' />
                            </div>
                            <div>
                              <FormLabel className='text-xs'>Weight</FormLabel>
                              <Input
                                type='number'
                                step='0.01'
                                className='h-8 text-xs'
                              />
                            </div>
                          </div>
                        </div>

                        <div className='mb-3'>
                          <div className='text-sm font-semibold text-gray-700 mb-2'>
                            IF shipping Type is LCL/Air
                          </div>
                          <div className='grid grid-cols-3 gap-2'>
                            <div>
                              <FormLabel className='text-xs'>
                                Load Type
                              </FormLabel>
                              <Select
                                options={[
                                  { value: "SUZUKI", label: "Suzuki" },
                                  { value: "MAZDA", label: "Mazda" },
                                  { value: "TRUCK", label: "Truck" },
                                ]}
                                styles={compactSelectStyles}
                                isClearable
                                placeholder='Suzuki / Mazda / Truck'
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Invoice Details Tab */}
              <TabsContent value='invoice' className='mt-0'>
                <Card>
                  <CardHeader className='py-3 px-4 bg-blue-50 flex flex-row items-center justify-between'>
                    <CardTitle className='text-base'>
                      Invoice Details (Multiple Invoices Supported)
                    </CardTitle>
                    <Button
                      type='button'
                      size='sm'
                      onClick={() => {
                        setShowInvoiceForm(!showInvoiceForm);
                        setEditingInvoice(null);
                        invoiceForm.reset({ lcValue: 0 });
                      }}
                      className='h-7 text-xs'
                    >
                      <Plus className='h-3 w-3 mr-1' />
                      Add Invoice
                    </Button>
                  </CardHeader>
                  <CardContent className='p-4'>
                    {showInvoiceForm && (
                      <Card className='mb-4 border-green-200'>
                        <CardContent className='p-3'>
                          <div className='space-y-3'>
                            {/* Invoice Section */}
                            <div className='grid grid-cols-12 gap-2 items-center'>
                              <div className='col-span-2'>
                                <FormLabel className='text-xs'>
                                  Invoice No. (+)
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='invoiceNumber'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>Date</FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='invoiceDate'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type='date'
                                          {...field}
                                          value={field.value || ""}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>
                                  Issued By
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='invoiceIssuedBy'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className='grid grid-cols-12 gap-2 items-center'>
                              <div className='col-span-2'>
                                <FormLabel className='text-xs'>
                                  Shipping Term
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='shippingTerm'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Select
                                          options={[
                                            { value: "FOB", label: "FOB" },
                                            { value: "EXW", label: "EXW" },
                                            { value: "DDP", label: "DDP" },
                                            { value: "DDU", label: "DDU" },
                                            { value: "CFR", label: "CFR" },
                                          ]}
                                          value={
                                            field.value
                                              ? {
                                                  value: field.value,
                                                  label: field.value,
                                                }
                                              : null
                                          }
                                          onChange={(val) =>
                                            field.onChange(val?.value)
                                          }
                                          styles={compactSelectStyles}
                                          isClearable
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className='border-t my-2'></div>

                            {/* LC Section */}
                            <div className='grid grid-cols-12 gap-2 items-center'>
                              <div className='col-span-2'>
                                <FormLabel className='text-xs'>
                                  LC No.
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='lcNumber'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>Date</FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='lcDate'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type='date'
                                          {...field}
                                          value={field.value || ""}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>
                                  Issued By
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='lcIssuedBy'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className='grid grid-cols-12 gap-2 items-center'>
                              <div className='col-span-2'>
                                <FormLabel className='text-xs'>
                                  LC Value
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='lcValue'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          step='0.01'
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              Number(e.target.value)
                                            )
                                          }
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>
                                  Currency
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='lcCurrencyId'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Select
                                          options={currencies}
                                          value={currencies.find(
                                            (c) => c.value === field.value
                                          )}
                                          onChange={(val) =>
                                            field.onChange(val?.value)
                                          }
                                          styles={compactSelectStyles}
                                          isClearable
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className='border-t my-2'></div>

                            {/* FI Section */}
                            <div className='grid grid-cols-12 gap-2 items-center'>
                              <div className='col-span-2'>
                                <FormLabel className='text-xs'>
                                  FI No.
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='fiNumber'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>Date</FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='fiDate'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type='date'
                                          {...field}
                                          value={field.value || ""}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='col-span-1 text-right'>
                                <FormLabel className='text-xs'>
                                  Expiry Date
                                </FormLabel>
                              </div>
                              <div className='col-span-2'>
                                <FormField
                                  control={invoiceForm.control}
                                  name='fiExpiryDate'
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type='date'
                                          {...field}
                                          value={field.value || ""}
                                          className='h-8 text-xs'
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div className='flex gap-2 mt-3'>
                            <Button
                              type='button'
                              onClick={invoiceForm.handleSubmit(
                                handleAddInvoice
                              )}
                              size='sm'
                              className='h-7 text-xs'
                            >
                              <Save className='h-3 w-3 mr-1' />
                              {editingInvoice !== null ? "Update" : "Add"}{" "}
                              Invoice
                            </Button>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                setShowInvoiceForm(false);
                                setEditingInvoice(null);
                                invoiceForm.reset({ lcValue: 0 });
                              }}
                              className='h-7 text-xs'
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {invoices.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='text-xs'>
                              Invoice No.
                            </TableHead>
                            <TableHead className='text-xs'>Date</TableHead>
                            <TableHead className='text-xs'>Issued By</TableHead>
                            <TableHead className='text-xs'>LC No.</TableHead>
                            <TableHead className='text-xs'>LC Value</TableHead>
                            <TableHead className='text-xs'>FI No.</TableHead>
                            <TableHead className='text-xs'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((inv, idx) => (
                            <TableRow key={idx}>
                              <TableCell className='text-xs'>
                                {inv.invoiceNumber || "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {inv.invoiceDate
                                  ? new Date(
                                      inv.invoiceDate
                                    ).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {inv.invoiceIssuedBy || "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {inv.lcNumber || "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {inv.lcValue || 0}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {inv.fiNumber || "-"}
                              </TableCell>
                              <TableCell>
                                <div className='flex gap-1'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleEditInvoice(idx)}
                                    className='h-6 w-6 p-0'
                                  >
                                    <Save className='h-3 w-3 text-blue-600' />
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteInvoice(idx)}
                                    className='h-6 w-6 p-0'
                                  >
                                    <Trash2 className='h-3 w-3 text-red-600' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className='text-center py-8 text-sm text-gray-500'>
                        No invoices added. Click + Add Invoice to add multiple
                        invoices.
                      </div>
                    )}

                    <div className='border-t my-4'></div>

                    {/* Additional Fields */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Exchange Rate</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='exchangeRate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.0001'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Insurance</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='insurance'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Landing</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='landing'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GD Information Tab */}
              <TabsContent value='gd' className='mt-0'>
                <Card>
                  <CardHeader className='py-3 px-4 bg-blue-50'>
                    <CardTitle className='text-base'>GD Information</CardTitle>
                  </CardHeader>
                  <CardContent className='p-4'>
                    {/* GD Section */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>GD No.</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='gdNumber'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Date</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='gdDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-1 text-right'>
                        <FormLabel className='text-xs'>Type</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='gdType'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "HC", label: "HC" },
                                    { value: "IB", label: "IB" },
                                    { value: "EB", label: "EB" },
                                    { value: "TI", label: "TI" },
                                    { value: "SB", label: "SB" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          GD Cleared U/S
                        </FormLabel>
                      </div>

                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='gdClearedUS'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "80", label: "80" },
                                    { value: "81", label: "81" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-2 text-right'>
                        <FormLabel className='text-xs'>Security Type</FormLabel>
                      </div>

                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='securityType'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className='h-8 text-xs' />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'></div>
                      <div className='col-span-1'></div>
                      <div className='col-span-2'></div>

                      <div className='col-span-2 text-right'>
                        <FormLabel className='text-xs'>Value</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='securityValue'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'></div>
                      <div className='col-span-1'></div>
                      <div className='col-span-2'></div>

                      <div className='col-span-2 text-right'>
                        <FormLabel className='text-xs'>Expiry Date</FormLabel>
                      </div>
                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='securityExpiryDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='date'
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='border-t my-3'></div>

                    {/* RMS & Delays */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>RMS Channel</FormLabel>
                      </div>

                      <div className='col-span-4'>
                        <FormField
                          control={form.control}
                          name='rmsChannel'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "GREEN", label: "Green" },
                                    {
                                      value: "YELLOW_YELLOW",
                                      label: "Yellow-Yellow",
                                    },
                                    {
                                      value: "YELLOW_RED",
                                      label: "Yellow-Red",
                                    },
                                    { value: "RED", label: "Red" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Delay in Clearance
                        </FormLabel>
                      </div>
                      <div className='col-span-1'>
                        <FormField
                          control={form.control}
                          name='delayInClearance'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='Days'
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-4'>
                        <Select
                          options={[
                            { value: "GROUNDING", label: "Grounding" },
                            { value: "EXAMINATION", label: "Examination" },
                            { value: "GROUP", label: "Group" },
                            { value: "NOC", label: "NOC" },
                          ]}
                          styles={compactSelectStyles}
                          isMulti
                          isClearable
                          placeholder='multi select'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>
                          Delay in Dispatch
                        </FormLabel>
                      </div>
                      <div className='col-span-1'>
                        <FormField
                          control={form.control}
                          name='delayInDispatch'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder='Days'
                                  className='h-8 text-xs'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='col-span-4'>
                        <Select
                          options={[
                            { value: "FI", label: "FI" },
                            { value: "OBL", label: "OBL" },
                            { value: "CLEARANCE", label: "Clearance" },
                          ]}
                          styles={compactSelectStyles}
                          isMulti
                          isClearable
                          placeholder='multi select'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>Remarks</FormLabel>
                      </div>
                      <div className='col-span-6'>
                        <FormField
                          control={form.control}
                          name='remarks'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className='text-xs min-h-[60px]'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='border-t my-3'></div>

                    {/* PSQCA Samples */}
                    <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                      <div className='col-span-2'>
                        <FormLabel className='text-xs'>PSQCA Samples</FormLabel>
                      </div>

                      <div className='col-span-2'>
                        <FormField
                          control={form.control}
                          name='psqcaSamples'
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  options={[
                                    { value: "SUBMITTED", label: "Submitted" },
                                    {
                                      value: "NOT_REQUIRED",
                                      label: "Not Required",
                                    },
                                    { value: "PENDING", label: "Pending" },
                                  ]}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isClearable
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
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
