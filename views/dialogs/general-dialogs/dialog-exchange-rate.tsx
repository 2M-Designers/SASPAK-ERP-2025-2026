"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z
  .object({
    exchangeRateId: z.number().optional(),
    companyId: z.number().optional(), // Taken from localStorage, default 1
    fromCurrencyId: z.number().min(1, "From Currency is required"),
    toCurrencyId: z.number().min(1, "To Currency is required"),
    rate: z.number().min(0.000001, "Exchange rate must be greater than 0"),
    effectiveDate: z.string().min(1, "Effective Date is required"),
    rateExpiryDate: z.string().optional(),
    isActive: z.boolean().default(true),
    version: z.number().default(0),
  })
  .refine((data) => data.fromCurrencyId !== data.toCurrencyId, {
    message: "From Currency and To Currency cannot be the same",
    path: ["toCurrencyId"],
  });

interface Currency {
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  symbol: string;
}

interface ExchangeRateDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function ExchangeRateDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: ExchangeRateDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchangeRateId: defaultState.exchangeRateId || undefined,
      companyId: defaultState.companyId || 1,
      fromCurrencyId: defaultState.fromCurrencyId || 0,
      toCurrencyId: defaultState.toCurrencyId || 0,
      rate: defaultState.rate || 0,
      effectiveDate: defaultState.effectiveDate || "",
      rateExpiryDate: defaultState.rateExpiryDate || "",
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      version: defaultState.version || 0,
    },
  });

  // Watch fromCurrencyId to validate against toCurrencyId
  const fromCurrencyId = form.watch("fromCurrencyId");

  // Reset form when dialog opens/closes or defaultState changes
  useEffect(() => {
    if (open) {
      // Get company ID from localStorage
      const user = localStorage.getItem("user");
      let companyId = 1; // Default value

      if (user) {
        try {
          const u = JSON.parse(user);
          companyId = u?.companyId || 1;
        } catch (error) {
          console.error("Error parsing user JSON:", error);
        }
      }

      // Format dates for input fields (YYYY-MM-DD)
      const formatDateForInput = (dateString: string | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      form.reset({
        exchangeRateId: defaultState.exchangeRateId || undefined,
        companyId: companyId, // Set from localStorage
        fromCurrencyId: defaultState.fromCurrencyId || 0,
        toCurrencyId: defaultState.toCurrencyId || 0,
        rate: defaultState.rate || 0,
        effectiveDate: formatDateForInput(defaultState.effectiveDate),
        rateExpiryDate: formatDateForInput(defaultState.rateExpiryDate),
        isActive:
          defaultState.isActive !== undefined ? defaultState.isActive : true,
        version: defaultState.version || 0,
      });

      fetchCurrencies();
    }
  }, [open, defaultState, form]);

  const fetchCurrencies = async () => {
    setLoadingCurrencies(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}SetupCurrency/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "CurrencyId,CurrencyCode,CurrencyName,Symbol",
          where: "IsActive == true",
          sortOn: "currencyCode",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrencies(data);
      } else {
        throw new Error("Failed to fetch currencies");
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load currencies list",
      });
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;
    let companyId = 1;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
        companyId = u?.companyId || 1;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Prepare payload according to requirements
    const payload: any = {
      fromCurrencyId: values.fromCurrencyId,
      toCurrencyId: values.toCurrencyId,
      rate: values.rate,
      effectiveDate: values.effectiveDate,
      rateExpiryDate: values.rateExpiryDate || null,
      isActive: values.isActive,
      version: values.version || 0,
    };

    // For add operation
    if (!isUpdate) {
      payload.companyId = companyId; // From localStorage
    } else {
      // For edit operation - include the ID
      payload.exchangeRateId = values.exchangeRateId;
      payload.companyId = values.companyId;
    }

    // Add user tracking if needed
    // if (isUpdate) {
    //   payload.updatedBy = userID;
    // } else {
    //   payload.createdBy = userID;
    // }

    console.log("Exchange Rate Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "SetupExchangeRate",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const responseData = await response.text();
      const jsonData = responseData ? JSON.parse(responseData) : null;

      if (jsonData?.statusCode >= 400) {
        throw new Error(jsonData.message || "Unknown error occurred");
      }

      setOpen(false);

      // Call the parent handler with the response data
      handleAddEdit(jsonData || values);

      toast({
        title: `Exchange rate ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      console.error("API Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to process exchange rate operation",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  const getCurrencyDisplay = (currencyId: number) => {
    const currency = currencies.find((c) => c.currencyId === currencyId);
    return currency
      ? `${currency.currencyCode} - ${currency.currencyName}`
      : "Select Currency";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add Exchange Rate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit Exchange Rate" : "Add New Exchange Rate"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update exchange rate information."
              : "Add a new exchange rate to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            {/* Display Company Info (read-only) */}
            <div className='p-3 bg-gray-50 rounded-md'>
              <div>
                <FormLabel className='text-sm font-medium text-gray-600'>
                  Company
                </FormLabel>
                <div className='mt-1 text-sm text-gray-900'>
                  {(() => {
                    const user = localStorage.getItem("user");
                    if (user) {
                      try {
                        const u = JSON.parse(user);
                        return u?.companyName || "Company 1";
                      } catch (error) {
                        return "Company 1";
                      }
                    }
                    return "Company 1";
                  })()}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* From Currency */}
              <FormField
                control={form.control}
                name='fromCurrencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Currency *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loadingCurrencies}
                      >
                        <option value={0}>Select From Currency</option>
                        {currencies.map((currency) => (
                          <option
                            key={currency.currencyId}
                            value={currency.currencyId}
                          >
                            {currency.currencyCode} - {currency.currencyName}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    {loadingCurrencies && (
                      <p className='text-sm text-gray-500'>
                        Loading currencies...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To Currency */}
              <FormField
                control={form.control}
                name='toCurrencyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Currency *</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loadingCurrencies}
                      >
                        <option value={0}>Select To Currency</option>
                        {currencies
                          .filter(
                            (currency) => currency.currencyId !== fromCurrencyId
                          )
                          .map((currency) => (
                            <option
                              key={currency.currencyId}
                              value={currency.currencyId}
                            >
                              {currency.currencyCode} - {currency.currencyName}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    {loadingCurrencies && (
                      <p className='text-sm text-gray-500'>
                        Loading currencies...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Exchange Rate */}
            <FormField
              control={form.control}
              name='rate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate *</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Enter exchange rate'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      min={0.000001}
                      step={0.000001}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Effective Date */}
              <FormField
                control={form.control}
                name='effectiveDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date *</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rate Expiry Date */}
              <FormField
                control={form.control}
                name='rateExpiryDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Is Active */}
            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                  <FormControl>
                    <input
                      type='checkbox'
                      checked={field.value}
                      onChange={field.onChange}
                      className='w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Status</FormLabel>
                    <p className='text-sm text-muted-foreground'>
                      {field.value
                        ? "Active exchange rate"
                        : "Inactive exchange rate"}
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields */}
            <div className='hidden'>
              <FormField
                control={form.control}
                name='exchangeRateId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='companyId'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='version'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type='hidden' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {type === "edit" ? "Update Exchange Rate" : "Add Exchange Rate"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
