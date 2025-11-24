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
  unlocationId: z.number().optional(),
  parentUnlocationId: z.number().optional(),
  uncode: z.string().min(1, "UN Code is required"),
  locationName: z.string().min(1, "Location Name is required"),
  isCountry: z.boolean().default(false),
  isSeaPort: z.boolean().default(false),
  isDryPort: z.boolean().default(false),
  isTerminal: z.boolean().default(false),
  isCity: z.boolean().default(false),
  isActive: z.boolean().default(true),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

interface UNLocation {
  unlocationId: number;
  parentUnlocationId: number;
  uncode: string;
  locationName: string;
  isCountry: boolean;
  isSeaPort: boolean;
  isDryPort: boolean;
  isTerminal: boolean;
  isCity: boolean;
  isActive: boolean;
  remarks: string;
  version: number;
}

interface UNLocationDialogProps {
  type: "add" | "edit";
  defaultState: any;
  handleAddEdit: (item: any) => void;
  children?: React.ReactNode;
}

export default function UNLocationDialog({
  type,
  defaultState,
  handleAddEdit,
  children,
}: UNLocationDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parentLocations, setParentLocations] = useState<UNLocation[]>([]);
  const [loadingParentLocations, setLoadingParentLocations] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unlocationId: defaultState.unlocationId || undefined,
      parentUnlocationId: defaultState.parentUnlocationId || 0,
      uncode: defaultState.uncode || "",
      locationName: defaultState.locationName || "",
      isCountry: defaultState.isCountry || false,
      isSeaPort: defaultState.isSeaPort || false,
      isDryPort: defaultState.isDryPort || false,
      isTerminal: defaultState.isTerminal || false,
      isCity: defaultState.isCity || false,
      isActive:
        defaultState.isActive !== undefined ? defaultState.isActive : true,
      remarks: defaultState.remarks || "",
      version: defaultState.version || 0,
    },
  });

  // Fetch parent locations when dialog opens
  useEffect(() => {
    if (open) {
      fetchParentLocations();
    }
  }, [open]);

  const fetchParentLocations = async () => {
    setLoadingParentLocations(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}UNLocation/GetList`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          select:
            "UnlocationId, LocationName, ParentUnlocationId, IsCountry, IsCity",
          where: "IsActive == true",
          sortOn: "LocationName",
          page: "1",
          pageSize: "100",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setParentLocations(data);
      } else {
        throw new Error("Failed to fetch parent locations");
      }
    } catch (error) {
      console.error("Error fetching parent locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load parent locations list",
      });
    } finally {
      setLoadingParentLocations(false);
    }
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

    // Create payload - handle optional parentUnlocationId
    const payload = {
      ...values,
      parentUnlocationId:
        values.parentUnlocationId === 0 ? null : values.parentUnlocationId,
      //...(isUpdate ? { UpdatedBy: userID } : { CreatedBy: userID }),
    };

    console.log("UNLocation Payload:", payload);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BASE_URL + "UNLocation",
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
        title: `UN Location ${
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
            Add UN Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {type === "edit" ? "Edit UN Location" : "Add New UN Location"}
          </DialogTitle>
          <DialogDescription>
            {type === "edit"
              ? "Update UN location information."
              : "Add a new UN location to the system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Parent Location Dropdown */}
              <FormField
                control={form.control}
                name='parentUnlocationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Location</FormLabel>
                    <FormControl>
                      <select
                        className='w-full p-2 border rounded-md'
                        value={field.value || 0}
                        onChange={(e) => {
                          const value =
                            e.target.value === "0"
                              ? 0
                              : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                        disabled={loadingParentLocations}
                      >
                        <option value={0}>No Parent Location</option>
                        {parentLocations
                          .filter((location) =>
                            type === "edit"
                              ? location.unlocationId !==
                                defaultState.unlocationId
                              : true
                          )
                          .map((location) => (
                            <option
                              key={location.unlocationId}
                              value={location.unlocationId}
                            >
                              {location.locationName}
                              {location.isCountry && " (Country)"}
                              {location.isCity && " (City)"}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    {loadingParentLocations && (
                      <p className='text-sm text-gray-500'>
                        Loading parent locations...
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* UN Code */}
              <FormField
                control={form.control}
                name='uncode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UN Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter UN code (e.g., USNYC)'
                        {...field}
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
            </div>

            {/* Location Name */}
            <FormField
              control={form.control}
              name='locationName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter location name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Type Checkboxes */}
            <div className='space-y-4'>
              <FormLabel>Location Types</FormLabel>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {/* Is Country */}
                <FormField
                  control={form.control}
                  name='isCountry'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4'
                          />
                          <span className='text-sm font-medium'>
                            Is Country
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Sea Port */}
                <FormField
                  control={form.control}
                  name='isSeaPort'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4'
                          />
                          <span className='text-sm font-medium'>
                            Is Sea Port
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Dry Port */}
                <FormField
                  control={form.control}
                  name='isDryPort'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4'
                          />
                          <span className='text-sm font-medium'>
                            Is Dry Port
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Terminal */}
                <FormField
                  control={form.control}
                  name='isTerminal'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4'
                          />
                          <span className='text-sm font-medium'>
                            Is Terminal
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is City */}
                <FormField
                  control={form.control}
                  name='isCity'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={field.value}
                            onChange={field.onChange}
                            className='w-4 h-4'
                          />
                          <span className='text-sm font-medium'>Is City</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name='remarks'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter any remarks or notes...'
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
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={field.value}
                        onChange={field.onChange}
                        className='w-4 h-4'
                      />
                      <span className='text-sm font-medium'>
                        {field.value ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {type === "edit" ? "Update Location" : "Add Location"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
