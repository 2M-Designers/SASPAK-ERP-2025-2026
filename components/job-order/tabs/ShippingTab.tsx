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
import { Plus, Trash2, AlertCircle, Package, Ship, Anchor } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";
import { useState, useEffect } from "react";

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
  noOfPackages?: number;
  packageType?: string;
}

interface ShippingTabProps {
  form: any;
  parties: SelectOption[];
  locations: SelectOption[];
  vessels: SelectOption[];
  containerTypes: SelectOption[];
  containerSizes: SelectOption[];
  packageTypes: SelectOption[];
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

  const [showAddMorePrompt, setShowAddMorePrompt] = useState(false);
  const [duplicateContainerNumbers, setDuplicateContainerNumbers] = useState<
    string[]
  >([]);
  const containerNoPattern = /^[A-Z]{4}[-]?\d{6,7}[-]?\d?$/;

  const checkForDuplicates = (containerNo: string): boolean => {
    return fclContainers.some(
      (container) =>
        container.containerNo.toUpperCase() === containerNo.toUpperCase(),
    );
  };

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

  useEffect(() => {
    findDuplicateContainerNumbers();
  }, [fclContainers]);

  const handleAddFcl = (data: FclContainer) => {
    if (!containerNoPattern.test(data.containerNo)) {
      toast({
        variant: "destructive",
        title: "Invalid Container Number",
        description: "Format should be: ABCU-123456-7 or ABCU1234567",
      });
      return;
    }

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

    const containerData: FclContainer = {
      ...data,
      noOfPackages: data.noOfPackages || 0,
      packageType: data.packageType || "NA",
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
      noOfPackages: 0,
      packageType: "",
    });

    setShowAddMorePrompt(true);

    toast({
      title: "Success",
      description: `Container ${data.containerNo} added successfully`,
    });
  };

  const handleAddMoreYes = () => {
    setShowAddMorePrompt(false);
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

  const isDuplicateContainer = (containerNo: string): boolean => {
    return duplicateContainerNumbers.includes(containerNo.toUpperCase());
  };

  const getDuplicateCount = (containerNo: string): number => {
    return fclContainers.filter(
      (container) =>
        container.containerNo.toUpperCase() === containerNo.toUpperCase(),
    ).length;
  };

  return (
    <TabsContent value='shipping' className='space-y-4'>
      {/* Document Information Section */}
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50 border-b'>
          <div className='flex items-center gap-2'>
            <Ship className='h-4 w-4 text-blue-600' />
            <CardTitle className='text-base'>Document Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-4 space-y-3'>
          {/* House Document Row - Conditional */}
          {documentType === "House" && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='houseDocumentNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      House Document No.
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder='Enter house document number'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='houseDocumentDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      House Document Date
                    </FormLabel>
                    <FormControl>
                      <Input type='date' {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='overseasAgentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Origin Agent
                    </FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Master Document Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              control={form.control}
              name='masterDocumentNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Master Document No.
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder='Enter master document number'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='masterDocumentDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Master Document Date
                  </FormLabel>
                  <FormControl>
                    <Input type='date' {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='principalId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Local Agent
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Carrier & Free Days */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              control={form.control}
              name='carrierPartyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>Carrier</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='freeDays'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Free Days
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='0'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='lastFreeDay'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Last Free Day
                  </FormLabel>
                  <FormControl>
                    <Input type='date' {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weight Information Section */}
      <Card>
        <CardHeader className='py-3 px-4 bg-green-50 border-b'>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-green-600' />
            <CardTitle className='text-base'>Weight Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* ✅ NEW: Chargeable Weight */}
            <FormField
              control={form.control}
              name='chargeableWeight'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Chargeable Weight (kg)
                  </FormLabel>
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
                      placeholder='0.0000'
                    />
                  </FormControl>
                  <p className='text-xs text-gray-500 mt-1'>
                    For billing purposes
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gross Weight */}
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
                      step='0.0001'
                      {...field}
                      value={field.value || 0.0}
                      className='bg-gray-100'
                      readOnly
                      placeholder='0.0000'
                    />
                  </FormControl>
                  <p className='text-xs text-gray-500 mt-1'>
                    Auto-calculated from containers
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Net Weight */}
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
                      step='0.0001'
                      {...field}
                      value={field.value || 0.0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      placeholder='0.0000'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ports & Locations Section */}
      <Card>
        <CardHeader className='py-3 px-4 bg-purple-50 border-b'>
          <div className='flex items-center gap-2'>
            <Anchor className='h-4 w-4 text-purple-600' />
            <CardTitle className='text-base'>Ports & Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-4 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='originPortId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Port of Loading
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='destinationPortId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Port of Discharge
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='placeOfDeliveryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Place of Delivery
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='terminalPartyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Terminal
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vessel & Schedule Section */}
      <Card>
        <CardHeader className='py-3 px-4 bg-orange-50 border-b'>
          <div className='flex items-center gap-2'>
            <Ship className='h-4 w-4 text-orange-600' />
            <CardTitle className='text-base'>Vessel & Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-4 space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='vesselName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Vessel Name / Flight No.
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='etaDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Expected Arrival Date
                  </FormLabel>
                  <FormControl>
                    <Input type='date' {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <FormField
              control={form.control}
              name='igmNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>IGM No.</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder='Enter IGM number'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='indexNo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Index No.
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder='Enter index number'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='freightType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium'>
                    Freight Type
                  </FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='blstatus'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium'>
                  Document Status
                </FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* FCL Container Section */}
      {shippingType === "FCL" && (
        <Card>
          <CardHeader className='py-3 px-4 bg-blue-50 border-b'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Package className='h-4 w-4 text-blue-600' />
                <CardTitle className='text-base'>Container Details</CardTitle>
                {fclContainers.length > 0 && (
                  <span className='text-xs text-gray-600 ml-2'>
                    ({fclContainers.length} container
                    {fclContainers.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <Button
                type='button'
                size='sm'
                onClick={() => setShowFclForm(!showFclForm)}
                className='h-8'
              >
                <Plus className='h-4 w-4 mr-1' />
                {showFclForm ? "Hide Form" : "Add Container"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className='p-4 space-y-3'>
            {/* Duplicate Warning */}
            {duplicateContainerNumbers.length > 0 && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
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

            {/* Container Table */}
            {fclContainers.length > 0 && (
              <div className='border rounded-lg overflow-hidden'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-gray-50'>
                        <TableHead className='font-semibold'>
                          Container No.
                        </TableHead>
                        <TableHead className='font-semibold'>Size</TableHead>
                        <TableHead className='font-semibold'>Type</TableHead>
                        <TableHead className='font-semibold text-right'>
                          Weight (kg)
                        </TableHead>
                        <TableHead className='font-semibold text-right'>
                          Packages
                        </TableHead>
                        <TableHead className='font-semibold'>
                          Package Type
                        </TableHead>
                        <TableHead className='font-semibold text-center'>
                          Actions
                        </TableHead>
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
                                isDuplicate
                                  ? "bg-red-50 hover:bg-red-100"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <TableCell className='font-mono'>
                                <div className='flex items-center gap-2'>
                                  {container.containerNo}
                                  {isDuplicate && (
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800'>
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
                              <TableCell>
                                {containerSizes.find(
                                  (s: SelectOption) =>
                                    s.value === container.containerSizeId,
                                )?.label || "-"}
                              </TableCell>
                              <TableCell>
                                {containerTypes.find(
                                  (t: SelectOption) =>
                                    t.value === container.containerTypeId,
                                )?.label || "-"}
                              </TableCell>
                              <TableCell className='text-right font-medium'>
                                {container.tareWeight.toFixed(4)}
                              </TableCell>
                              <TableCell className='text-right'>
                                {container.noOfPackages || 0}
                              </TableCell>
                              <TableCell>
                                {container.packageType || "-"}
                              </TableCell>
                              <TableCell className='text-center'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleDeleteFcl(idx)}
                                  className='h-8 w-8 p-0 hover:bg-red-50'
                                >
                                  <Trash2 className='h-4 w-4 text-red-600' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Add Container Form */}
            {(showFclForm || fclContainers.length === 0) && (
              <Card className='border-2 border-blue-200 bg-blue-50'>
                <CardContent className='p-4 space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <FormField
                      control={fclForm.control}
                      name='containerNo'
                      render={({ field }) => (
                        <FormItem className='lg:col-span-2'>
                          <FormLabel className='text-sm font-medium'>
                            Container No. *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder='ABCU-123456-7'
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                field.onChange(value);
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
                          <p className='text-xs text-gray-600'>
                            Format: ABCU-123456-7 or ABCU1234567
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fclForm.control}
                      name='containerSizeId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Size *
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={containerSizes}
                              value={containerSizes.find(
                                (s: SelectOption) => s.value === field.value,
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              styles={compactSelectStyles}
                              isLoading={loadingContainerSizes}
                              isClearable
                              placeholder='Select Size'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fclForm.control}
                      name='containerTypeId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Type *
                          </FormLabel>
                          <FormControl>
                            <Select
                              options={containerTypes}
                              value={containerTypes.find(
                                (t: SelectOption) => t.value === field.value,
                              )}
                              onChange={(val) => field.onChange(val?.value)}
                              styles={compactSelectStyles}
                              isLoading={loadingContainerTypes}
                              isClearable
                              placeholder='Select Type'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fclForm.control}
                      name='tareWeight'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Weight (kg) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.0001'
                              {...field}
                              value={field.value || 0.0}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              placeholder='0.0000'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fclForm.control}
                      name='noOfPackages'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            No. of Packages
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              value={field.value || 0}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              placeholder='0'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fclForm.control}
                      name='packageType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm font-medium'>
                            Package Type
                          </FormLabel>
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
                              placeholder='Select Type'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault();
                        fclForm.handleSubmit(handleAddFcl)();
                      }}
                      disabled={checkForDuplicates(
                        fclForm.getValues("containerNo") || "",
                      )}
                      className='min-w-[150px]'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Add Container
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {fclContainers.length === 0 && !showFclForm && (
              <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed'>
                <Package className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                <p className='text-sm font-medium mb-1'>
                  No containers added yet
                </p>
                <p className='text-xs'>
                  Click "Add Container" to add your first container
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LCL/Air Package Information */}
      {(shippingType === "LCL" || mode === "AIR") && (
        <Card>
          <CardHeader className='py-3 px-4 bg-green-50 border-b'>
            <div className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-green-600' />
              <CardTitle className='text-base'>Package Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='p-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <FormField
                control={form.control}
                name='lclPackageQty'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      No. of Packages (Qty)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder='0'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lclPackageType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Package Type
                    </FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lclPackageWeight'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Weight (kg)
                    </FormLabel>
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
                        placeholder='0.00'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lclPackageVolume'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Volume (CBM)
                    </FormLabel>
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
                        placeholder='0.000'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
