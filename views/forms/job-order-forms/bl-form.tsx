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
  Calendar,
  Hash,
  Weight,
  Box,
  Container,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define validation schema for BL Master
// Define validation schema for BL Master
const blMasterSchema = z.object({
  blMasterId: z.number().optional(),
  companyId: z.number().default(1),
  jobId: z.number().optional(),
  mblNumber: z.string().min(1, "MBL Number is required"),
  hblNumber: z.string().optional(),
  blDate: z.string().min(1, "BL Date is required"),
  shipperPartyId: z.number().min(1, "Shipper is required"),
  consigneePartyId: z.number().min(1, "Consignee is required"),
  notifyPartyId: z.number().optional(),
  noOfPackages: z
    .number()
    .min(0, "Number of packages must be 0 or greater")
    .default(0),
  grossWeight: z
    .number()
    .min(0, "Gross weight must be 0 or greater")
    .default(0),
  netWeight: z.number().min(0, "Net weight must be 0 or greater").default(0),
  volumeCbm: z.number().min(0, "Volume must be 0 or greater").default(0),
  status: z.string().default("Active"),
  // Add these fields for edit functionality
  version: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createLog: z.string().optional(),
  updateLog: z.string().optional(),
});

// Define validation schema for BL Equipment
const blEquipmentSchema = z.object({
  blEquipmentId: z.number().optional(),
  blMasterId: z.number().optional(),
  containerNo: z.string().min(1, "Container number is required"),
  containerTypeId: z.number().min(1, "Container type is required"),
  containerSizeId: z.number().min(1, "Container size is required"),
  sealNo: z.string().optional(),
  grossWeight: z.number().min(0).default(0),
  tareWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
});

type BlMasterFormValues = z.infer<typeof blMasterSchema>;
type BlEquipmentFormValues = z.infer<typeof blEquipmentSchema>;

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

  // Dropdown data states
  const [jobs, setJobs] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [containerSizes, setContainerSizes] = useState<any[]>([]);

  // Loading states
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingContainerTypes, setLoadingContainerTypes] = useState(false);
  const [loadingContainerSizes, setLoadingContainerSizes] = useState(false);

  // Equipment management
  const [equipments, setEquipments] = useState<BlEquipmentFormValues[]>(
    defaultState?.equipments || []
  );
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<number | null>(null);

  const form = useForm<BlMasterFormValues>({
    resolver: zodResolver(blMasterSchema),
    defaultValues: {
      companyId: 1,
      status: "Active",
      noOfPackages: 0,
      grossWeight: 0,
      netWeight: 0,
      volumeCbm: 0,
      version: 0,
      ...defaultState,
      blDate: defaultState?.blDate
        ? new Date(defaultState.blDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const equipmentForm = useForm<BlEquipmentFormValues>({
    resolver: zodResolver(blEquipmentSchema),
    defaultValues: {
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
    },
  });

  // Fetch Jobs
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
        setJobs(
          data.map((job: any) => ({
            value: job.jobId,
            label: `${job.jobNumber} - ${new Date(
              job.jobDate
            ).toLocaleDateString()}`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load jobs list",
      });
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch Parties
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
        setParties(
          data.map((party: any) => ({
            value: party.partyId,
            label: `${party.partyCode} - ${party.partyName}`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parties list",
      });
    } finally {
      setLoadingParties(false);
    }
  };

  // Fetch Container Types (you may need to adjust the endpoint)
  const fetchContainerTypes = async () => {
    setLoadingContainerTypes(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      // Adjust this endpoint based on your actual API
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
        setContainerTypes(
          data.map((type: any) => ({
            value: type.containerTypeId,
            label: `${type.typeCode} - ${type.typeName}`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching container types:", error);
      // Set default options if API fails
      setContainerTypes([
        { value: 1, label: "Standard" },
        { value: 2, label: "High Cube" },
        { value: 3, label: "Refrigerated" },
      ]);
    } finally {
      setLoadingContainerTypes(false);
    }
  };

  // Fetch Container Sizes
  const fetchContainerSizes = async () => {
    setLoadingContainerSizes(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      // Adjust this endpoint based on your actual API
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
        setContainerSizes(
          data.map((size: any) => ({
            value: size.containerSizeId,
            label: `${size.sizeCode} - ${size.sizeName}`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching container sizes:", error);
      // Set default options if API fails
      setContainerSizes([
        { value: 1, label: "20ft" },
        { value: 2, label: "40ft" },
        { value: 3, label: "40ft HC" },
      ]);
    } finally {
      setLoadingContainerSizes(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchParties();
    fetchContainerTypes();
    fetchContainerSizes();
  }, []);

  // Calculate net weight when gross and tare weights change
  const calculateNetWeight = () => {
    const gross = equipmentForm.watch("grossWeight") || 0;
    const tare = equipmentForm.watch("tareWeight") || 0;
    const net = gross - tare;
    equipmentForm.setValue("netWeight", net > 0 ? net : 0);
  };

  // Add or update equipment
  const handleAddEquipment = (data: BlEquipmentFormValues) => {
    if (editingEquipment !== null) {
      // Update existing equipment
      const updatedEquipments = [...equipments];
      updatedEquipments[editingEquipment] = data;
      setEquipments(updatedEquipments);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    } else {
      // Add new equipment
      setEquipments([...equipments, data]);
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
    }

    // Reset form
    equipmentForm.reset({
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
    });
    setShowEquipmentForm(false);
    setEditingEquipment(null);
  };

  // Edit equipment
  const handleEditEquipment = (index: number) => {
    setEditingEquipment(index);
    equipmentForm.reset(equipments[index]);
    setShowEquipmentForm(true);
  };

  // Delete equipment
  const handleDeleteEquipment = (index: number) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      const updatedEquipments = equipments.filter((_, i) => i !== index);
      setEquipments(updatedEquipments);
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
    }
  };

  // Submit form
  const onSubmit = async (values: BlMasterFormValues) => {
    if (equipments.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one container/equipment",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = localStorage.getItem("user");
      let userID = 0;
      let companyId = 1;
      let userName = "";

      if (user) {
        try {
          const u = JSON.parse(user);
          userID = u?.userID || 0;
          companyId = u?.companyId || 1;
          userName = u?.userName || u?.email || "";
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      const now = new Date().toISOString();

      // Prepare blEquipments array according to API structure
      const blEquipments = equipments.map((equipment) => ({
        blEquipmentId: equipment.blEquipmentId || 0,
        blMasterId: equipment.blMasterId || 0,
        containerNo: equipment.containerNo,
        containerTypeId: equipment.containerTypeId,
        containerSizeId: equipment.containerSizeId,
        sealNo: equipment.sealNo || "",
        grossWeight: equipment.grossWeight || 0,
        tareWeight: equipment.tareWeight || 0,
        netWeight: equipment.netWeight || 0,
        version: 0,
        createdAt: now,
        updatedAt: now,
        createLog: `Created by ${userName} at ${new Date().toLocaleString()}`,
        updateLog: `Updated by ${userName} at ${new Date().toLocaleString()}`,
        // You can optionally include containerSize and containerType objects if needed
        // containerSize: {},
        // containerType: {},
      }));

      // Prepare the complete payload
      const payload = {
        blMasterId: values.blMasterId || 0,
        companyId: companyId,
        jobId: values.jobId || 0,
        mblNumber: values.mblNumber,
        hblNumber: values.hblNumber || "",
        blDate: values.blDate,
        shipperPartyId: values.shipperPartyId,
        consigneePartyId: values.consigneePartyId,
        notifyPartyId: values.notifyPartyId || 0,
        noOfPackages: values.noOfPackages || 0,
        grossWeight: values.grossWeight || 0,
        netWeight: values.netWeight || 0,
        volumeCbm: values.volumeCbm || 0,
        status: values.status || "Active",
        version: 0,
        createdAt: now,
        updatedAt: now,
        createLog: `Created by ${userName} at ${new Date().toLocaleString()}`,
        updateLog: `Updated by ${userName} at ${new Date().toLocaleString()}`,
        blEquipments: blEquipments,
      };

      console.log("BL Payload:", JSON.stringify(payload, null, 2));

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}bl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData[0] || `HTTP Error: ${response.status}`
        );
      }

      const responseData = await response.json();

      toast({
        title: "Success!",
        description: `BL ${
          type === "edit" ? "updated" : "created"
        } successfully`,
      });

      handleAddEdit(responseData);

      // If you want to redirect after success
      if (type === "add") {
        router.push("/bl"); // or wherever your BL list page is
      }
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
              {type === "edit"
                ? "Update BL information"
                : "Add a new bill of lading to the system"}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {/* BL Master Information */}
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-5 border-b'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-600 rounded-lg shadow-sm'>
                    <Ship className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <CardTitle className='text-lg font-semibold text-gray-900'>
                      BL Master Information
                    </CardTitle>
                    <CardDescription className='text-xs text-gray-600'>
                      Enter the bill of lading details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 pb-4 px-5'>
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                      <FormLabel className='text-sm font-medium'>
                        HBL Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter HBL number'
                          {...field}
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                          className='react-select-container'
                          classNamePrefix='react-select'
                          isLoading={loadingJobs}
                          isDisabled={loadingJobs}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
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
                          className='react-select-container'
                          classNamePrefix='react-select'
                          isLoading={loadingParties}
                          isDisabled={loadingParties}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
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
                            loadingParties ? "Loading..." : "Select Consignee"
                          }
                          className='react-select-container'
                          classNamePrefix='react-select'
                          isLoading={loadingParties}
                          isDisabled={loadingParties}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
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
                          className='react-select-container'
                          classNamePrefix='react-select'
                          isLoading={loadingParties}
                          isDisabled={loadingParties}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                          className='h-10 text-sm border-gray-300 focus:border-blue-500'
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
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                            { value: "Completed", label: "Completed" },
                          ]}
                          value={{ value: field.value, label: field.value }}
                          onChange={(val) => field.onChange(val?.value)}
                          className='react-select-container'
                          classNamePrefix='react-select'
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "40px",
                              fontSize: "14px",
                              borderColor: "#d1d5db",
                            }),
                          }}
                        />
                      </FormControl>
                      <FormMessage className='text-xs' />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* BL Equipment Section */}
            <Card className='border shadow-sm'>
              <CardHeader className='bg-gradient-to-r from-green-50 to-teal-50 py-4 px-5 border-b'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-green-600 rounded-lg shadow-sm'>
                      <Container className='h-5 w-5 text-white' />
                    </div>
                    <div>
                      <CardTitle className='text-lg font-semibold text-gray-900'>
                        Container/Equipment Details
                      </CardTitle>
                      <CardDescription className='text-xs text-gray-600'>
                        Add containers and equipment for this BL
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type='button'
                    onClick={() => {
                      setShowEquipmentForm(!showEquipmentForm);
                      setEditingEquipment(null);
                      equipmentForm.reset({
                        grossWeight: 0,
                        tareWeight: 0,
                        netWeight: 0,
                      });
                    }}
                    size='sm'
                    className='bg-green-600 hover:bg-green-700 h-9'
                  >
                    <Plus className='h-4 w-4 mr-1.5' />
                    Add Equipment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='pt-5 pb-4 px-5'>
                {/* Equipment Form */}
                {showEquipmentForm && (
                  <Card className='mb-5 border-2 border-green-200 bg-green-50/30'>
                    <CardContent className='pt-5 pb-4'>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
                                  onChange={(val) => field.onChange(val?.value)}
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
                                  onChange={(val) => field.onChange(val?.value)}
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
                                Auto-calculated (Gross - Tare)
                              </FormDescription>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='flex gap-2 mt-4'>
                        <Button
                          type='button'
                          onClick={equipmentForm.handleSubmit(
                            handleAddEquipment
                          )}
                          size='sm'
                          className='bg-green-600 hover:bg-green-700'
                        >
                          <Save className='h-4 w-4 mr-1.5' />
                          {editingEquipment !== null ? "Update" : "Add"}{" "}
                          Equipment
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setShowEquipmentForm(false);
                            setEditingEquipment(null);
                            equipmentForm.reset({
                              grossWeight: 0,
                              tareWeight: 0,
                              netWeight: 0,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Equipment List */}
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
                            Seal No
                          </TableHead>
                          <TableHead className='text-xs font-semibold text-right'>
                            Gross (kg)
                          </TableHead>
                          <TableHead className='text-xs font-semibold text-right'>
                            Tare (kg)
                          </TableHead>
                          <TableHead className='text-xs font-semibold text-right'>
                            Net (kg)
                          </TableHead>
                          <TableHead className='text-xs font-semibold text-center'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipments.map((equipment, index) => (
                          <TableRow key={index} className='hover:bg-gray-50'>
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
                              {equipment.sealNo || "-"}
                            </TableCell>
                            <TableCell className='text-sm text-right'>
                              {equipment.grossWeight.toFixed(2)}
                            </TableCell>
                            <TableCell className='text-sm text-right'>
                              {equipment.tareWeight.toFixed(2)}
                            </TableCell>
                            <TableCell className='text-sm text-right font-medium'>
                              {equipment.netWeight.toFixed(2)}
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
                  <div className='text-center py-12 text-gray-500'>
                    <Container className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                    <p className='text-sm font-medium'>
                      No equipment added yet
                    </p>
                    <p className='text-xs mt-1'>
                      Click Add Equipment to add containers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card className='border shadow-lg bg-white'>
              <CardContent className='p-4'>
                <div className='flex justify-between items-center'>
                  <div className='text-sm text-gray-600'>
                    <span className='font-medium'>{equipments.length}</span>{" "}
                    equipment(s) added
                  </div>
                  <div className='flex gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                      size='sm'
                      className='h-10'
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={isSubmitting || equipments.length === 0}
                      className='gap-2 min-w-[140px] h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50'
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
