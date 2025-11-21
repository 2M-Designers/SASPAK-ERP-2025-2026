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
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import Loader from "@/components/app-loader";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // or your preferred toast library
import { Switch } from "@/components/ui/switch"; // Alternative to checkbox for better toggle UX

const formSchema = z.object({
  IsReadOnlyMode: z.boolean(),
});

interface AccessModeFormProps {
  UserID: string;
  currentMode: boolean;
  onAccessModeChanged?: () => void;
}

export default function AccessModeForm({
  UserID,
  currentMode,
  onAccessModeChanged,
}: AccessModeFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      IsReadOnlyMode: currentMode,
    },
  });

  // Update form when currentMode changes
  useEffect(() => {
    form.reset({
      IsReadOnlyMode: currentMode,
    });
  }, [currentMode, form]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset to original mode when dialog closes without saving
    if (!isOpen) {
      form.reset({
        IsReadOnlyMode: currentMode,
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if mode actually changed
    if (values.IsReadOnlyMode === currentMode) {
      toast.info("No changes detected");
      setOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const user = localStorage.getItem("user");
      let currentUserID = null;
      if (user) {
        const parsed = JSON.parse(user);
        currentUserID = parsed?.userID;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/change-accessmode`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: UserID,
            isReadOnlyMode: values.IsReadOnlyMode,
          }),
        }
      );

      if (res.ok) {
        const modeText = values.IsReadOnlyMode ? "read-only" : "full access";
        toast.success(`Access mode changed to ${modeText} successfully!`);

        // Refresh data
        router.refresh();

        // Notify parent component
        if (onAccessModeChanged) {
          onAccessModeChanged();
        }

        setOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to change access mode");
        console.error("Failed to change access mode:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error changing access mode:", error);
      toast.error("An error occurred while changing the access mode");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentModeText = () => {
    return currentMode ? "Read Only" : "Full Access";
  };

  const getModeIcon = () => {
    return currentMode ? (
      <Lock className='h-4 w-4' />
    ) : (
      <Unlock className='h-4 w-4' />
    );
  };

  const getModeColor = () => {
    return currentMode
      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className={`h-8 px-3 ${getModeColor()}`}
            title={`Change access mode from ${getCurrentModeText()}`}
          >
            {getModeIcon()}
          </Button>
        </DialogTrigger>

        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {getModeIcon()}
              Change Access Mode
            </DialogTitle>
            <DialogDescription>
              Change access permissions for this user. Current mode:{" "}
              <span
                className={`font-semibold ${
                  currentMode ? "text-red-600" : "text-green-600"
                }`}
              >
                {getCurrentModeText()}
              </span>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='IsReadOnlyMode'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Read-Only Mode
                      </FormLabel>
                      <p className='text-sm text-muted-foreground'>
                        Restrict user to view-only permissions
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Alternative using Checkbox */}
              {/* <FormField
                control={form.control}
                name="IsReadOnlyMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Enable read-only mode
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        User will have limited access and cannot make changes to the system
                      </p>
                    </div>
                  </FormItem>
                )}
              /> */}

              {/* Mode Change Preview */}
              {form.watch("IsReadOnlyMode") !== currentMode && (
                <div
                  className={`p-3 rounded-md border ${
                    form.watch("IsReadOnlyMode")
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      form.watch("IsReadOnlyMode")
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    <strong>Change:</strong> {getCurrentModeText()} →{" "}
                    <span className='font-semibold'>
                      {form.watch("IsReadOnlyMode")
                        ? "Read Only"
                        : "Full Access"}
                    </span>
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      form.watch("IsReadOnlyMode")
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {form.watch("IsReadOnlyMode")
                      ? "User will be able to view data but cannot create, edit, or delete records."
                      : "User will have full permissions to create, edit, and delete records."}
                  </p>
                </div>
              )}

              {/* Mode Descriptions */}
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div
                  className={`p-3 rounded border ${
                    !form.watch("IsReadOnlyMode")
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <Unlock className='h-4 w-4 text-green-600' />
                    <span className='font-medium'>Full Access</span>
                  </div>
                  <ul className='text-xs text-gray-600 space-y-1'>
                    <li>• Create new records</li>
                    <li>• Edit existing records</li>
                    <li>• Delete records</li>
                    <li>• Full system access</li>
                  </ul>
                </div>

                <div
                  className={`p-3 rounded border ${
                    form.watch("IsReadOnlyMode")
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <Lock className='h-4 w-4 text-red-600' />
                    <span className='font-medium'>Read Only</span>
                  </div>
                  <ul className='text-xs text-gray-600 space-y-1'>
                    <li>• View records only</li>
                    <li>• No editing permissions</li>
                    <li>• No deletion permissions</li>
                    <li>• Limited system access</li>
                  </ul>
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className='border-gray-300 text-gray-700 hover:bg-gray-100'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={
                    isLoading || form.watch("IsReadOnlyMode") === currentMode
                  }
                  className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-6'
                >
                  {isLoading ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Access Mode"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading && <Loader />}
    </>
  );
}
