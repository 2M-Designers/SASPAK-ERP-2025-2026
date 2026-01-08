import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Select from "react-select";
import { compactSelectStyles } from "../utils/styles";

interface GDTabProps {
  form: any;
  insuranceType: "1percent" | "custom";
  setInsuranceType: (type: "1percent" | "custom") => void;
  freightType?: string;
}

export default function GDTab(props: GDTabProps) {
  const { form, insuranceType, setInsuranceType, freightType } = props;

  return (
    <TabsContent value='gd' className='mt-0'>
      <Card>
        <CardHeader className='py-3 px-4 bg-blue-50'>
          <CardTitle className='text-base text-center'>
            GD & Financial Details
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          {/* GD Section */}
          <div className='mb-4'>
            <div className='text-sm font-semibold text-gray-700 mb-3'>
              GD (Goods Declaration) Information
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>GD Number</FormLabel>
              </div>
              <div className='col-span-3'>
                <FormField
                  control={form.control}
                  name='gdNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className='h-8 text-xs'
                          placeholder='Enter GD Number'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='col-span-2 text-right'>
                <FormLabel className='text-xs'>GD Date</FormLabel>
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
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>GD Type</FormLabel>
              </div>
              <div className='col-span-3'>
                <FormField
                  control={form.control}
                  name='gdType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          options={[
                            { value: "HC", label: "HC (Home Consumption)" },
                            { value: "IB", label: "IB (Inward Bond)" },
                            { value: "EB", label: "EB (Export Bond)" },
                            { value: "TI", label: "TI (Transit In)" },
                            { value: "SB", label: "SB (Shipping Bill)" },
                          ]}
                          value={
                            field.value
                              ? { value: field.value, label: field.value }
                              : null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={compactSelectStyles}
                          isClearable
                          placeholder='Select GD Type'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='col-span-2 text-right'>
                <FormLabel className='text-xs'>Cleared U/S</FormLabel>
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
                              ? { value: field.value, label: field.value }
                              : null
                          }
                          onChange={(val) => field.onChange(val?.value)}
                          styles={compactSelectStyles}
                          isClearable
                          placeholder='80 / 81'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Security Type</FormLabel>
              </div>
              <div className='col-span-2'>
                <FormField
                  control={form.control}
                  name='securityType'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className='h-8 text-xs'
                          placeholder='Type'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='col-span-1 text-right'>
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
                          placeholder='0.00'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className='col-span-1 text-right'>
                <FormLabel className='text-xs'>Expiry</FormLabel>
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

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>RMS Channel</FormLabel>
              </div>
              <div className='col-span-3'>
                <FormField
                  control={form.control}
                  name='rmsChannel'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className='h-8 text-xs'
                          placeholder='Green/Red/Yellow'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Delay in Clearance</FormLabel>
              </div>
              <div className='col-span-8'>
                <FormField
                  control={form.control}
                  name='delayInClearance'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className='h-16 text-xs'
                          placeholder='Reason for delay if any'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Delay in Dispatch</FormLabel>
              </div>
              <div className='col-span-8'>
                <FormField
                  control={form.control}
                  name='delayInDispatch'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className='h-16 text-xs'
                          placeholder='Reason for delay if any'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>PSQCA Samples</FormLabel>
              </div>
              <div className='col-span-8'>
                <FormField
                  control={form.control}
                  name='psqcaSamples'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className='h-16 text-xs'
                          placeholder='Sample details'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Remarks</FormLabel>
              </div>
              <div className='col-span-8'>
                <FormField
                  control={form.control}
                  name='remarks'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          className='h-20 text-xs'
                          placeholder='Additional remarks'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className='border-t my-4'></div>

          {/* Financial Details Section - MOVED FROM INVOICE TAB */}
          <div className='mb-4'>
            <div className='text-sm font-semibold text-gray-700 mb-3'>
              Financial Details
            </div>

            {/* Exchange Rate */}
            <div className='grid grid-cols-12 gap-2 mb-3 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs font-semibold'>
                  Exchange Rate (4 decimals)
                </FormLabel>
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
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          className='h-8 text-xs'
                          placeholder='e.g., 277.5000'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className='col-span-6 text-xs text-gray-500'>
                Applied to all invoice values (4 decimal precision)
              </div>
            </div>

            {/* Freight/Other Charges - Dynamic Label */}
            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>
                  {freightType === "COLLECT"
                    ? "Freight Charges"
                    : "Other Charges"}
                </FormLabel>
              </div>
              <div className='col-span-2'>
                <FormField
                  control={form.control}
                  name={
                    freightType === "COLLECT"
                      ? "freightCharges"
                      : "otherCharges"
                  }
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
                          placeholder='0.00'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className='col-span-6 text-xs text-gray-500'>
                {freightType === "COLLECT"
                  ? "Freight charges when freight type is COLLECT"
                  : "Other charges when freight type is PREPAID"}
              </div>
            </div>

            {/* Insurance - 1% or Custom */}
            <div className='grid grid-cols-12 gap-2 mb-2 items-center'>
              <div className='col-span-2'>
                <FormLabel className='text-xs'>Insurance</FormLabel>
              </div>
              <div className='col-span-2'>
                <div className='flex gap-2'>
                  <label className='flex items-center gap-1 text-xs'>
                    <input
                      type='radio'
                      name='insuranceType'
                      checked={insuranceType === "1percent"}
                      onChange={() => setInsuranceType("1percent")}
                      className='h-3 w-3'
                    />
                    1%
                  </label>
                  <label className='flex items-center gap-1 text-xs'>
                    <input
                      type='radio'
                      name='insuranceType'
                      checked={insuranceType === "custom"}
                      onChange={() => setInsuranceType("custom")}
                      className='h-3 w-3'
                    />
                    Custom
                  </label>
                </div>
              </div>
              <div className='col-span-2'>
                <FormField
                  control={form.control}
                  name='insuranceValue'
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
                          placeholder='0.00'
                          readOnly={insuranceType === "1percent"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {insuranceType === "1percent" && (
                <div className='col-span-4 text-xs text-gray-500'>
                  Auto-calculated as 1% of total AV from all invoices
                </div>
              )}
            </div>

            {/* Landing */}
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
                        <Input
                          {...field}
                          className='h-8 text-xs'
                          placeholder='Landing charges'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
