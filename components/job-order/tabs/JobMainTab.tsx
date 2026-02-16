import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Select from "react-select";
import { compactSelectStyles } from "../utils/styles";
import { Building2, User } from "lucide-react";

interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface JobMainTabProps {
  form: any;
  parties: SelectOption[];
  processOwners: SelectOption[];
  shippers: SelectOption[];
  consignees: SelectOption[];
  localAgents: SelectOption[];
  carriers: SelectOption[];
  transporters: SelectOption[];
  terminals: SelectOption[];
  operationTypes: SelectOption[];
  operationModes: SelectOption[];
  jobLoadTypes: SelectOption[];
  jobLoads: SelectOption[];
  documentTypes: SelectOption[];
  loadingParties: boolean;
  loadingOperationTypes: boolean;
  loadingOperationModes: boolean;
  loadingJobLoadTypes: boolean;
  loadingJobLoads: boolean;
  loadingDocumentTypes: boolean;
  mode?: string;
  shippingType?: string;
  documentType?: string;
  shipperId?: number;
  consigneeId?: number;
}

export default function JobMainTab(props: JobMainTabProps) {
  const {
    form,
    parties,
    processOwners,
    shippers,
    consignees,
    localAgents,
    carriers,
    transporters,
    terminals,
    operationTypes,
    operationModes,
    jobLoadTypes,
    jobLoads,
    documentTypes,
    loadingParties,
    loadingOperationTypes,
    loadingOperationModes,
    loadingJobLoadTypes,
    loadingJobLoads,
    loadingDocumentTypes,
    mode,
    shippingType,
  } = props;

  // Watch form values for dynamic display
  const shipperValue = form.watch("shipperPartyId");
  const consigneeValue = form.watch("consigneePartyId");

  // ✅ Get shipper and consignee details
  const getPartyLabel = (partyId: number, partyList: SelectOption[]) => {
    const party = partyList.find((p: SelectOption) => p.value === partyId);
    return party?.label || "";
  };

  const shipperLabel = shipperValue
    ? getPartyLabel(shipperValue, shippers)
    : "";
  const consigneeLabel = consigneeValue
    ? getPartyLabel(consigneeValue, consignees)
    : "";

  return (
    <TabsContent value='main' className='mt-0'>
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <CardTitle className='text-base text-center'>
            Job Order Form
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Job Order Number & Customer Reference */}
          <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
            <div className='col-span-2 font-semibold'>
              <FormLabel className='text-sm'>Job Order Number</FormLabel>
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
                        value={field.value || ""}
                        className='h-8 text-xs bg-gray-100'
                        placeholder='Auto-generated'
                        readOnly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='col-span-2 text-right'>
              <FormLabel className='text-sm'>Customer Reference No</FormLabel>
            </div>
            <div className='col-span-3'>
              <FormField
                control={form.control}
                name='customerReferenceNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className='h-8 text-xs'
                        placeholder='Enter customer reference'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Job Order Date & Process Owner */}
          <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs'>Job Order Date</FormLabel>
            </div>
            <div className='col-span-3'>
              <FormField
                control={form.control}
                name='jobDate'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        value={field.value || ""}
                        className='h-8 text-xs'
                        readOnly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='col-span-2 text-right'>
              <FormLabel className='text-xs'>Process Owner</FormLabel>
            </div>
            <div className='col-span-3'>
              <FormField
                control={form.control}
                name='processOwnerId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={processOwners}
                        value={processOwners.find(
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingParties}
                        isClearable
                        placeholder='Select Process Owner'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='border-t mb-3'></div>

          {/* Scope Row with Checkboxes */}
          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs font-semibold'>Scope</FormLabel>
            </div>
            <div className='col-span-10'>
              <div className='flex gap-6'>
                <FormField
                  control={form.control}
                  name='isFreightForwarding'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='h-4 w-4'
                        />
                      </FormControl>
                      <FormLabel className='text-xs font-normal cursor-pointer'>
                        Freight
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isClearance'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='h-4 w-4'
                        />
                      </FormControl>
                      <FormLabel className='text-xs font-normal cursor-pointer'>
                        Clearance
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isTransporter'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='h-4 w-4'
                        />
                      </FormControl>
                      <FormLabel className='text-xs font-normal cursor-pointer'>
                        Transport
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isOther'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='h-4 w-4'
                        />
                      </FormControl>
                      <FormLabel className='text-xs font-normal cursor-pointer'>
                        Other
                      </FormLabel>
                    </FormItem>
                  )}
                />
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
                name='operationType'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={operationTypes}
                        value={operationTypes.find(
                          (t: SelectOption) => t.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingOperationTypes}
                        isClearable
                        placeholder='Select Direction'
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
                name='operationMode'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={operationModes}
                        value={operationModes.find(
                          (m: SelectOption) => m.value === field.value,
                        )}
                        onChange={(val) => {
                          field.onChange(val?.value);
                          if (val?.value === "AIR") {
                            form.setValue("jobSubType", "");
                            form.setValue("jobLoadType", "");
                          }
                        }}
                        styles={compactSelectStyles}
                        isLoading={loadingOperationModes}
                        isClearable
                        placeholder='Select Mode'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Shipping Type Row - Hide for AIR mode */}
          {mode !== "AIR" && (
            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Shipping Type</FormLabel>
              </div>
              <div className='col-span-3'>
                <FormField
                  control={form.control}
                  name='jobSubType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          options={jobLoadTypes}
                          value={jobLoadTypes.find(
                            (t: SelectOption) => t.value === field.value,
                          )}
                          onChange={(val) => field.onChange(val?.value)}
                          styles={compactSelectStyles}
                          isLoading={loadingJobLoadTypes}
                          isClearable
                          placeholder='Select Shipping Type'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Load Row - Show only when Shipping Type = FCL */}
          {shippingType === "FCL" && (
            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Load</FormLabel>
              </div>
              <div className='col-span-3'>
                <FormField
                  control={form.control}
                  name='jobLoadType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          options={jobLoads}
                          value={jobLoads.find(
                            (l: SelectOption) => l.value === field.value,
                          )}
                          onChange={(val) => field.onChange(val?.value)}
                          styles={compactSelectStyles}
                          isLoading={loadingJobLoads}
                          isClearable
                          placeholder='Select Load'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Document Type Row */}
          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs'>Document Type</FormLabel>
            </div>
            <div className='col-span-3'>
              <FormField
                control={form.control}
                name='jobDocumentType'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={documentTypes}
                        value={documentTypes.find(
                          (d: SelectOption) => d.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingDocumentTypes}
                        isClearable
                        placeholder='Select Document Type'
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
                        options={shippers}
                        value={shippers.find(
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingParties}
                        isClearable
                        placeholder='Select Shipper'
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
                        options={consignees}
                        value={consignees.find(
                          (p: SelectOption) => p.value === field.value,
                        )}
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        isLoading={loadingParties}
                        isClearable
                        placeholder='Select Consignee'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ✅ UPDATED: Billing Parties Information - Shows when both shipper and consignee are selected */}
          {shipperValue && consigneeValue && (
            <div className='grid grid-cols-12 gap-2 mb-3 items-start'>
              <div className='col-span-2'>
                <FormLabel className='text-xs font-semibold'>
                  Billing Parties
                </FormLabel>
              </div>
              <div className='col-span-10'>
                <div className='bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Shipper Information */}
                    <div className='bg-white rounded-lg p-3 border border-blue-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Building2 className='h-4 w-4 text-blue-600' />
                        <span className='text-xs font-semibold text-blue-900'>
                          SHIPPER
                        </span>
                      </div>
                      <div className='text-sm font-medium text-gray-900'>
                        {shipperLabel}
                      </div>
                    </div>

                    {/* Consignee Information */}
                    <div className='bg-white rounded-lg p-3 border border-green-200'>
                      <div className='flex items-center gap-2 mb-2'>
                        <User className='h-4 w-4 text-green-600' />
                        <span className='text-xs font-semibold text-green-900'>
                          CONSIGNEE
                        </span>
                      </div>
                      <div className='text-sm font-medium text-gray-900'>
                        {consigneeLabel}
                      </div>
                    </div>
                  </div>

                  {/* Combined Display */}
                  <div className='mt-3 pt-3 border-t border-gray-200'>
                    <div className='text-xs text-gray-600 mb-1'>
                      Billing Information:
                    </div>
                    <div className='text-sm font-medium text-gray-900'>
                      <span className='text-blue-700'>Shipper:</span>{" "}
                      {shipperLabel}
                      <span className='mx-2 text-gray-400'>|</span>
                      <span className='text-green-700'>Consignee:</span>{" "}
                      {consigneeLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
