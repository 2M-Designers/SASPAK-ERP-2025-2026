import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Plus, Trash2 } from "lucide-react";
import { compactSelectStyles } from "../utils/styles";

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

  const handleAddFcl = (data: FclContainer) => {
    const currentContainerSizeId = data.containerSizeId;
    const currentContainerTypeId = data.containerTypeId;

    setFclContainers([...fclContainers, data]);

    fclForm.reset({
      containerNo: "",
      containerSizeId: currentContainerSizeId,
      containerTypeId: currentContainerTypeId,
      tareWeight: 0,
      sealNo: "",
      gateOutDate: "",
      gateInDate: "",
      status: "",
    });

    setShowFclForm(false);
    toast({ title: "Success", description: "Container added" });
  };

  const handleDeleteFcl = (index: number) => {
    setFclContainers(
      fclContainers.filter((_: FclContainer, i: number) => i !== index),
    );
    toast({ title: "Success", description: "Container deleted" });
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

              {fclContainers.length > 0 && (
                <Table className='mb-3'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-xs'>Container No.</TableHead>
                      <TableHead className='text-xs'>Size</TableHead>
                      <TableHead className='text-xs'>Type</TableHead>
                      <TableHead className='text-xs'>Weight</TableHead>
                      <TableHead className='text-xs'>Seal No.</TableHead>
                      <TableHead className='text-xs'>Gate Out</TableHead>
                      <TableHead className='text-xs'>Gate In</TableHead>
                      <TableHead className='text-xs'>Status</TableHead>
                      <TableHead className='text-xs'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fclContainers.map(
                      (container: FclContainer, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className='text-xs'>
                            {container.containerNo}
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
                            {container.sealNo || "-"}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {container.gateOutDate
                              ? new Date(
                                  container.gateOutDate,
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {container.gateInDate
                              ? new Date(
                                  container.gateInDate,
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {container.status || "-"}
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
                      ),
                    )}
                  </TableBody>
                </Table>
              )}

              {showFclForm && (
                <Card className='mb-3 border-green-200'>
                  <CardContent className='p-3'>
                    <div className='space-y-3'>
                      <div className='grid grid-cols-8 gap-2'>
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

                        <FormField
                          control={fclForm.control}
                          name='sealNo'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Seal No.
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='Seal'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={fclForm.control}
                          name='gateOutDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Gate Out
                              </FormLabel>
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

                        <FormField
                          control={fclForm.control}
                          name='gateInDate'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>Gate In</FormLabel>
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

                        <FormField
                          control={fclForm.control}
                          name='status'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>Status</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  className='h-8 text-xs'
                                  placeholder='Status'
                                />
                              </FormControl>
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
                          size='sm'
                          className='h-8 text-xs'
                        >
                          Add Container
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
