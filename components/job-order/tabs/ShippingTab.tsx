import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Select from "react-select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";
import { useState, useEffect } from "react"; // Added useEffect

// Copy all existing interfaces from current file
interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface FclContainer {
  jobEquipmentId?: number;
  containerNo: string;
  containerSizeId?: number;
  containerTypeId?: number;
  tareWeight: number;
  sealNo?: string;
  eirReceivedOn?: string;
  eirSubmitted: boolean;
  eirDocumentId?: number;
  rentInvoiceIssuedOn?: string;
  containerRentFc: number;
  containerRentLc: number;
  damageDirtyFc: number;
  damageDirtyLc: number;
  refundAppliedOn?: string;
  refundFc: number;
  refundLc: number;
  gateOutDate?: string;
  gateInDate?: string;
  status?: string;
  // ✅ CHANGE: Make these fields optional to match database schema
  noOfPackages?: number; // Changed from required to optional
  packageType?: string; // Already optional
}

interface ShippingTabProps {
  form: any;
  parties: SelectOption[];
  locations: SelectOption[];
  vessels: SelectOption[];
  containerTypes: SelectOption[];
  containerSizes: SelectOption[];
  packageTypes: SelectOption[]; // ✅ API: http://188.245.83.20:9001/api/General/GetTypeValues?typeName=Job_PackageTypes
  freightTypes: SelectOption[];
  blStatuses: SelectOption[];
  loadingParties: boolean;
  loadingLocations: boolean;
  loadingVessels: boolean;
  loadingContainerTypes: boolean;
  loadingContainerSizes: boolean;
  loadingPackageTypes: boolean;
  loadingFreightTypes: boolean;
  loadingBLStatuses: boolean;
  documentType?: string;
  shippingType?: string;
  mode?: string;
  fclContainers: FclContainer[];
  setFclContainers: (containers: FclContainer[]) => void;
  fclForm: any;
  showFclForm: boolean;
  setShowFclForm: (show: boolean) => void;
  toast: any;
}

export default function ShippingTab(props: ShippingTabProps) {
  const {
    form,
    parties,
    locations,
    vessels,
    containerTypes,
    containerSizes,
    packageTypes,
    freightTypes,
    blStatuses,
    loadingParties,
    loadingLocations,
    loadingVessels,
    loadingContainerTypes,
    loadingContainerSizes,
    loadingPackageTypes,
    loadingFreightTypes,
    loadingBLStatuses,
    documentType,
    shippingType,
    mode,
    fclContainers,
    setFclContainers,
    fclForm,
    showFclForm,
    setShowFclForm,
    toast,
  } = props;

  // ✅ State for asking user if they want to add more containers
  const [showAddMorePrompt, setShowAddMorePrompt] = useState(false);

  // ✅ State to track duplicate container numbers
  const [duplicateContainerNumbers, setDuplicateContainerNumbers] = useState<
    string[]
  >([]);

  // ✅ Container number validation regex
  const containerNoPattern = /^[A-Z]{4}[-]?\d{6,7}[-]?\d?$/;

  // ✅ Function to check for duplicate container numbers
  const checkForDuplicates = (containerNo: string): boolean => {
    return fclContainers.some(
      (container) =>
        container.containerNo.toUpperCase() === containerNo.toUpperCase(),
    );
  };

  // ✅ Function to find all duplicate container numbers
  const findDuplicateContainerNumbers = () => {
    const containerNos = fclContainers.map((c) => c.containerNo.toUpperCase());
    const duplicates: string[] = [];

    containerNos.forEach((containerNo, index) => {
      if (
        containerNos.indexOf(containerNo) !== index &&
        !duplicates.includes(containerNo)
      ) {
        duplicates.push(containerNo);
      }
    });

    setDuplicateContainerNumbers(duplicates);
  };

  // ✅ Check for duplicates whenever containers change
  useEffect(() => {
    findDuplicateContainerNumbers();
  }, [fclContainers]);

  const handleAddFcl = (data: FclContainer) => {
    // ✅ Validate container number format
    if (!containerNoPattern.test(data.containerNo)) {
      toast({
        variant: "destructive",
        title: "Invalid Container Number",
        description: "Format should be: ABCU-123456-7 or ABCU1234567",
      });
      return;
    }

    // ✅ Check for duplicate container number
    if (checkForDuplicates(data.containerNo)) {
      toast({
        variant: "destructive",
        title: "Duplicate Container Number",
        description: `Container ${data.containerNo} already exists. Please use a unique container number.`,
      });
      return;
    }

    const currentContainerSizeId = data.containerSizeId;
    const currentContainerTypeId = data.containerTypeId;

    // ✅ Prepare container data with proper defaults
    const containerData: FclContainer = {
      ...data,
      noOfPackages: data.noOfPackages || 0, // Default to 0 if undefined/null
      packageType: data.packageType || "NA", // Explicitly set to undefined if empty
    };

    setFclContainers([...fclContainers, containerData]);

    fclForm.reset({
      containerNo: "",
      containerSizeId: currentContainerSizeId,
      containerTypeId: currentContainerTypeId,
      tareWeight: 0,
      sealNo: "",
      gateOutDate: "",
      gateInDate: "",
      status: "",
      // ✅ Reset with default values
      noOfPackages: 0,
      packageType: "",
    });

    // ✅ Show prompt to add more containers
    setShowAddMorePrompt(true);

    toast({
      title: "Success",
      description: `Container ${data.containerNo} added successfully`,
    });
  };

  const handleAddMoreYes = () => {
    setShowAddMorePrompt(false);
    // Form stays open (showFclForm remains true)
  };

  const handleAddMoreNo = () => {
    setShowAddMorePrompt(false);
    setShowFclForm(false);
  };

  const handleDeleteFcl = (index: number) => {
    if (confirm("Are you sure you want to delete this container?")) {
      setFclContainers(
        fclContainers.filter((_: FclContainer, i: number) => i !== index),
      );
      toast({ title: "Success", description: "Container deleted" });
    }
  };

  // ✅ Function to highlight duplicate container rows
  const isDuplicateContainer = (containerNo: string): boolean => {
    return duplicateContainerNumbers.includes(containerNo.toUpperCase());
  };

  // ✅ Function to count occurrences of a container number
  const getDuplicateCount = (containerNo: string): number => {
    return fclContainers.filter(
      (container) =>
        container.containerNo.toUpperCase() === containerNo.toUpperCase(),
    ).length;
  };

  return (
    <TabsContent value='shipping' className='mt-0'>
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <CardTitle className='text-base text-center'>
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Document Type Conditional Rendering */}
          {documentType === "House" && (
            <>
              {/* House Document Row */}
              <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
                <div className='col-span-2'>
                  <FormLabel className='text-xs'>House Document No.</FormLabel>
                </div>
                <div className='col-span-2'>
                  <FormField
                    control={form.control}
                    name='houseDocumentNumber'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
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
                    name='overseasAgentId'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            options={parties}
                            value={parties.find(
                              (p: SelectOption) => p.value === field.value,
                            )}
                            onChange={(val) => field.onChange(val?.value)}
                            styles={compactSelectStyles}
                            isClearable
                            placeholder='Select Origin Agent'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}

          {/* Master Document Row - Always shown */}
          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs'>Master Document No.</FormLabel>
            </div>
            <div className='col-span-2'>
              <FormField
                control={form.control}
                name='masterDocumentNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
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
                name='principalId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={parties}
                        value={parties.find(
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isClearable
                        placeholder='Select Local Agent'
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
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isClearable
                        placeholder='Select Carrier'
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
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className='h-8 text-xs'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='col-span-1 text-right'>
              <FormLabel className='text-xs'>Last Free Day</FormLabel>
            </div>
            <div className='col-span-2'>
              <FormField
                control={form.control}
                name='lastFreeDay'
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
                        step='0.0001'
                        {...field}
                        value={field.value || 0.0}
                        className='h-8 text-xs bg-gray-100'
                        readOnly
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
                        step='0.0001'
                        {...field}
                        value={field.value || 0.0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
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
              <FormLabel className='text-xs'>Port of Loading</FormLabel>
            </div>
            <div className='col-span-4'>
              <FormField
                control={form.control}
                name='originPortId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={locations}
                        value={locations.find(
                          (l: SelectOption) => l.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingLocations}
                        isClearable
                        placeholder='Select Port of Loading'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs'>Port of Discharge</FormLabel>
            </div>
            <div className='col-span-4'>
              <FormField
                control={form.control}
                name='destinationPortId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={locations}
                        value={locations.find(
                          (l: SelectOption) => l.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingLocations}
                        isClearable
                        placeholder='Select Port of Discharge'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs'>Place of Delivery</FormLabel>
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
                          (l: SelectOption) => l.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingLocations}
                        isClearable
                        placeholder='Select Place of Delivery'
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
              <FormLabel className='text-xs'>Vessel Name</FormLabel>
            </div>
            <div className='col-span-4'>
              <FormField
                control={form.control}
                name='vesselName'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={vessels}
                        value={vessels.find(
                          (v: SelectOption) => v.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingVessels}
                        isClearable
                        placeholder='Select Vessel'
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
                name='terminalPartyId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={parties}
                        value={parties.find(
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isClearable
                        placeholder='Select Terminal'
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
              <FormLabel className='text-xs'>Expected Arrival Date</FormLabel>
            </div>
            <div className='col-span-2'>
              <FormField
                control={form.control}
                name='etaDate'
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
                      <Input
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
              <FormLabel className='text-xs'>Index No.</FormLabel>
            </div>
            <div className='col-span-2'>
              <FormField
                control={form.control}
                name='indexNo'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
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

          {/* Freight & BL Status - API Driven */}
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
                        options={freightTypes}
                        value={freightTypes.find(
                          (f: SelectOption) => f.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingFreightTypes}
                        isClearable
                        placeholder='Select Freight Type'
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
                name='blstatus'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={blStatuses}
                        value={blStatuses.find(
                          (b: SelectOption) => b.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingBLStatuses}
                        isClearable
                        placeholder='Select BL Status'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='border-t my-4'></div>

          {/* FCL Container Section */}
          {shippingType === "FCL" && (
            <div className='mb-4'>
              {/* Header */}
              <div className='flex items-center justify-between mb-3'>
                <div className='text-sm font-semibold text-gray-700'>
                  Container Details
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    onClick={() => setShowFclForm(!showFclForm)}
                    className='h-7 text-xs'
                  >
                    <Plus className='h-3 w-3 mr-1' />
                    {showFclForm ? "Hide Form" : "Add Container"}
                  </Button>
                  {fclContainers.length > 0 && (
                    <div className='text-xs text-gray-600'>
                      ({fclContainers.length} containers)
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ DUPLICATE WARNING BANNER */}
              {duplicateContainerNumbers.length > 0 && (
                <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded'>
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertCircle className='h-4 w-4 text-red-600' />
                    <span className='text-sm font-semibold text-red-800'>
                      Duplicate Container Numbers Found
                    </span>
                  </div>
                  <div className='text-xs text-red-700'>
                    The following container numbers appear more than once:{" "}
                    <span className='font-semibold'>
                      {duplicateContainerNumbers.join(", ")}
                    </span>
                    . Please ensure each container has a unique number.
                  </div>
                </div>
              )}

              {/* ✅ TABLE ON TOP */}
              {fclContainers.length > 0 && (
                <div className='mb-3'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='text-xs'>Container No.</TableHead>
                        <TableHead className='text-xs'>Size</TableHead>
                        <TableHead className='text-xs'>Type</TableHead>
                        <TableHead className='text-xs'>Weight</TableHead>
                        <TableHead className='text-xs'>
                          No. of Packages
                        </TableHead>
                        <TableHead className='text-xs'>Package Type</TableHead>
                        <TableHead className='text-xs'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fclContainers.map(
                        (container: FclContainer, idx: number) => {
                          const isDuplicate = isDuplicateContainer(
                            container.containerNo,
                          );
                          const duplicateCount = getDuplicateCount(
                            container.containerNo,
                          );

                          return (
                            <TableRow
                              key={idx}
                              className={
                                isDuplicate ? "bg-red-50 hover:bg-red-100" : ""
                              }
                            >
                              <TableCell className='text-xs'>
                                <div className='flex items-center gap-1'>
                                  {container.containerNo}
                                  {isDuplicate && (
                                    <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-1'>
                                      Duplicate
                                    </span>
                                  )}
                                </div>
                                {isDuplicate && duplicateCount > 1 && (
                                  <div className='text-xs text-red-600 mt-1'>
                                    Appears {duplicateCount} times
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {containerSizes.find(
                                  (s: SelectOption) =>
                                    s.value === container.containerSizeId,
                                )?.label || "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {containerTypes.find(
                                  (t: SelectOption) =>
                                    t.value === container.containerTypeId,
                                )?.label || "-"}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {container.tareWeight.toFixed(4)}
                              </TableCell>
                              <TableCell className='text-xs'>
                                {container.noOfPackages || 0}
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
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ✅ ADD MORE CONTAINERS PROMPT */}
              {showAddMorePrompt && (
                <div className='mb-3 p-3 bg-blue-50 border border-blue-200 rounded flex flex-col sm:flex-row items-center justify-between'>
                  <div className='text-sm text-blue-800 mb-2 sm:mb-0'>
                    Do you want to add another container?
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      onClick={handleAddMoreYes}
                      className='h-7 text-xs bg-blue-600 hover:bg-blue-700'
                    >
                      Yes, Add More
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      onClick={handleAddMoreNo}
                      variant='outline'
                      className='h-7 text-xs'
                    >
                      No, I'm Done
                    </Button>
                  </div>
                </div>
              )}

              {/* ✅ FORM BELOW TABLE - Show when: 1) No containers OR 2) User clicks Add Container */}
              {(showFclForm || fclContainers.length === 0) && (
                <Card className='mb-3 border-green-200'>
                  <CardContent className='p-3'>
                    <div className='space-y-3'>
                      <div className='grid grid-cols-8 gap-2'>
                        <div className='col-span-2'>
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
                                    value={field.value || ""}
                                    className='h-8 text-xs'
                                    placeholder='ABCU-123456-7'
                                    onChange={(e) => {
                                      const value =
                                        e.target.value.toUpperCase();
                                      field.onChange(value);

                                      // ✅ Show warning if duplicate
                                      if (checkForDuplicates(value)) {
                                        toast({
                                          variant: "warning",
                                          title: "Warning",
                                          description:
                                            "This container number already exists",
                                          duration: 2000,
                                        });
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage className='text-xs' />
                              </FormItem>
                            )}
                          />
                          <div className='text-xs text-gray-500 mt-1'>
                            Format: ABCU-123456-7 or ABCU1234567
                          </div>
                          <div className='text-xs text-amber-600 mt-1'>
                            Note: Each container must have a unique number
                          </div>
                        </div>

                        <FormField
                          control={fclForm.control}
                          name='containerSizeId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>Size</FormLabel>
                              <FormControl>
                                <Select
                                  options={containerSizes}
                                  value={containerSizes.find(
                                    (s: SelectOption) =>
                                      s.value === field.value,
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingContainerSizes}
                                  isClearable
                                  placeholder='Size'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fclForm.control}
                          name='containerTypeId'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>Type</FormLabel>
                              <FormControl>
                                <Select
                                  options={containerTypes}
                                  value={containerTypes.find(
                                    (t: SelectOption) =>
                                      t.value === field.value,
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingContainerTypes}
                                  isClearable
                                  placeholder='Type'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fclForm.control}
                          name='tareWeight'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>Weight</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.0001'
                                  {...field}
                                  value={field.value || 0.0}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className='h-8 text-xs'
                                  placeholder='0.0000'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* ✅ ADDED: No. of Packages field */}
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
                                  value={field.value || 0}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className='h-8 text-xs'
                                  placeholder='0'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* ✅ ADDED: Package Type field */}
                        <FormField
                          control={fclForm.control}
                          name='packageType'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Package Type
                              </FormLabel>
                              <FormControl>
                                <Select
                                  options={packageTypes}
                                  value={packageTypes.find(
                                    (p: SelectOption) =>
                                      p.value === field.value,
                                  )}
                                  onChange={(val) => field.onChange(val?.value)}
                                  styles={compactSelectStyles}
                                  isLoading={loadingPackageTypes}
                                  isClearable
                                  placeholder='Select'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* ✅ EMPTY COLUMN FOR LAYOUT */}
                        <div></div>

                        {/* ✅ SUBMIT BUTTON COLUMN */}
                        <div className='flex items-end'>
                          <Button
                            type='button'
                            onClick={(e) => {
                              e.preventDefault();
                              fclForm.handleSubmit(handleAddFcl)();
                            }}
                            size='sm'
                            className='h-8 text-xs w-full'
                            disabled={checkForDuplicates(
                              fclForm.getValues("containerNo") || "",
                            )}
                          >
                            Add Container
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ✅ SHOW MESSAGE WHEN NO CONTAINERS EXIST AND FORM IS NOT VISIBLE */}
              {fclContainers.length === 0 && !showFclForm && (
                <div className='text-center py-4 text-sm text-gray-500 bg-gray-50 rounded border'>
                  No containers added yet. Click "Add Container" to add your
                  first container.
                </div>
              )}
            </div>
          )}

          {/* ✅ FIXED: LCL/Air Package Information - Now Connected to Form State */}
          {(shippingType === "LCL" || mode === "AIR") && (
            <>
              <div className='mb-3'>
                <div className='text-sm font-semibold text-gray-700 mb-2'>
                  Package Information
                </div>
                <div className='grid grid-cols-4 gap-2'>
                  {/* ✅ No. of Packages - Now connected to form */}
                  <FormField
                    control={form.control}
                    name='lclPackageQty'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>
                          No. of Packages (Qty)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            {...field}
                            value={field.value || 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className='h-8 text-xs'
                            placeholder='0'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* ✅ Package Type - Now connected to form */}
                  <FormField
                    control={form.control}
                    name='lclPackageType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>Package Type</FormLabel>
                        <FormControl>
                          <Select
                            options={packageTypes}
                            value={packageTypes.find(
                              (p: SelectOption) => p.value === field.value,
                            )}
                            onChange={(val) => field.onChange(val?.value)}
                            styles={compactSelectStyles}
                            isLoading={loadingPackageTypes}
                            isClearable
                            placeholder='Select Package Type'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* ✅ Weight - Now connected to form */}
                  <FormField
                    control={form.control}
                    name='lclPackageWeight'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            className='h-8 text-xs'
                            placeholder='0.00'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* ✅ Volume (CBM) - Added new field */}
                  <FormField
                    control={form.control}
                    name='lclPackageVolume'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>Volume (CBM)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.001'
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            className='h-8 text-xs'
                            placeholder='0.000'
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
