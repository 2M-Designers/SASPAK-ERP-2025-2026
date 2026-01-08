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

// Define the option type for react-select
interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

interface JobMainTabProps {
  form: any;
  parties: SelectOption[];
  processOwners: SelectOption[];
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
    shipperId,
    consigneeId,
  } = props;

  return (
    <TabsContent value='main' className='mt-0'>
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <CardTitle className='text-base text-center'>
            Job Order Form
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          {/* Job Order Number & Date */}
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
                name='indexNo'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className='h-8 text-xs'
                        placeholder='Enter customer reference'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          {/* Status Row */}
          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs font-semibold'>Status</FormLabel>
            </div>
            <div className='col-span-3'>
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        options={[
                          { value: "Draft", label: "Draft" },
                          { value: "Active", label: "Active" },
                          { value: "InProgress", label: "In Progress" },
                          { value: "Completed", label: "Completed" },
                          { value: "Cancelled", label: "Cancelled" },
                          { value: "OnHold", label: "On Hold" },
                        ]}
                        value={
                          field.value
                            ? { value: field.value, label: field.value }
                            : { value: "Draft", label: "Draft" }
                        }
                        onChange={(val) => field.onChange(val?.value)}
                        styles={compactSelectStyles}
                        placeholder='Select Status'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className='col-span-7 text-xs text-gray-500'>
              Current status of the job order
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
                          (p: SelectOption) => p.value === field.value
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
          {/* Scope Row with Checkboxes - Now Connected to Form */}
          <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
            <div className='col-span-2'>
              <FormLabel className='text-xs font-semibold'>Scope</FormLabel>
            </div>
            <div className='col-span-10'>
              <div className='flex gap-6'>
                {/* Freight Forwarding Checkbox */}
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

                {/* Clearance Checkbox */}
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

                {/* Transport Checkbox */}
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

                {/* Other Checkbox */}
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
          {/* Direction Row - API Driven */}
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
                          (t: SelectOption) => t.value === field.value
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
          {/* Mode Row - API Driven */}
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
                          (m: SelectOption) => m.value === field.value
                        )}
                        onChange={(val) => {
                          field.onChange(val?.value);
                          // Clear shipping type and load when mode changes to AIR
                          if (val?.value === "AIR") {
                            form.setValue("shippingType", "");
                            form.setValue("load", "");
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
          {/* Shipping Type Row - API Driven - Hide for AIR mode */}
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
                            (t: SelectOption) => t.value === field.value
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
          {/* Load Row - API Driven - Show only when Shipping Type = FCL */}
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
                            (l: SelectOption) => l.value === field.value
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
          {/* Document Type Row - API Driven */}
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
                          (d: SelectOption) => d.value === field.value
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
                        options={parties}
                        value={parties.find(
                          (p: SelectOption) => p.value === field.value
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
                        options={parties}
                        value={parties.find(
                          (p: SelectOption) => p.value === field.value
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
          {/* Billing Parties Info Row - Read Only - Shows when both shipper and consignee are selected */}
          {shipperId && consigneeId && (
            <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Billing Parties</FormLabel>
              </div>
              <div className='col-span-8'>
                <div className='p-2 bg-gray-50 border rounded text-xs'>
                  {form.getValues("billingPartiesInfo") ||
                    "Billing parties information"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
