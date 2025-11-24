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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Validation Schema
const formSchema = z.object({
  unairportId: z.number().optional(),
  airportCode: z
    .string()
    .min(1, "Airport Code is required")
    .max(3, "Airport Code must be 3 characters"),
  airportName: z.string().min(1, "Airport Name is required"),
  unlocationId: z.number().min(1, "UN Location is required"),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

interface UNLocation {
  unlocationId: number;
  locationName: string;
  uncode: string;
  isCountry: boolean;
  isCity: boolean;
}

interface UNAirportDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function UNAirportDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: UNAirportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unlocations, setUnlocations] = useState<UNLocation[]>([]);
  const [loadingUnlocations, setLoadingUnlocations] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unairportId: defaultState.unairportId || undefined,
      airportCode: defaultState.airportCode || "",
      airportName: defaultState.airportName || "",
      unlocationId: defaultState.unlocationId || 0,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    },
  });

  // Fetch UN locations when dialog opens
  useEffect(() => {
    if (open) {
      fetchUnlocations();
    }
  }, [open]);

  const fetchUnlocations = async () => {
    setLoadingUnlocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UNLocation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select: "UnlocationId,LocationName,Uncode,IsCountry,IsCity",
          where: "IsActive == true",
          sortOn: "locationName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnlocations(data);
      } else {
        throw new Error("Failed to fetch UN locations");
      }
    } catch (error) {
      console.error("Error fetching UN locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load UN locations list",
      });
    } finally {
      setLoadingUnlocations(false);
    }
  };

  const getLocationType = (location: UNLocation) => {
    const types = [];
    if (location.isCountry) types.push("Country");
    if (location.isCity) types.push("City");
    return types.length > 0 ? ` (${types.join(", ")})` : "";
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const user = localStorage.getItem("user");
    let userID = 0;

    if (user) {
      try {
        const u = JSON.parse(user);
        userID = u?.userID || 0;
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }

    const isUpdate = type === "edit";

    // Create payload
    const payload = {
      ...values,
      airportCode: values.airportCode.toUpperCase(), // Ensure uppercase
      remarks: values.remarks || "",
      ...(isUpdate ? { UpdatedBy: userID } : { CreatedBy: userID }),
    };

    console.log("UNAirport Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "UNAIRPort",
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

      handleAddEdit({
        ...values,
        ...jsonData,
      });

      toast({
        title: `UN Airport ${
          type === "edit" ? "updated" : "added"
        } successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {type === "edit" ? (
          children || <Button variant='outline'>Edit</Button>
        ) : (
          <Button className='flex items-center gap-2'>
            <Plus size={16} />
            Add UN Airport
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit UN Airport" : "Add New UN Airport"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update UN airport information."
              : "Add a new UN airport to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Airport Code */}
              <FormField
                control={form.control}
                name='airportCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airport Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter airport code (e.g., JFK)'
                        {...field}
                        maxLength={3}
                        className='uppercase'
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Airport Name */}
              <FormField
                control={form.control}
                name='airportName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airport Name *</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter airport name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* UN Location Dropdown */}
            <FormField
              control={form.control}
              name='unlocationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UN Location *</FormLabel>
                  <FormControl>
                    <select
                      className='w-full p-2 border rounded-md'
                      value={field.value || 0}
                      onChange={(e) => {
                        const value =
                          e.target.value === "0" ? 0 : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                      disabled={loadingUnlocations}
                    >
                      <option value={0}>Select UN Location</option>
                      {unlocations.map((location) => (
                        <option
                          key={location.unlocationId}
                          value={location.unlocationId}
                        >
                          {location.locationName} ({location.uncode})
                          {getLocationType(location)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  {loadingUnlocations && (
                    <p className='text-sm text-gray-500'>
                      Loading UN locations...
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks or notes about this airport...'
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
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
                      {field.value ? "Active airport" : "Inactive airport"}
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
                name='unairportId'
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
                {type === "edit" ? "Update Airport" : "Add Airport"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
