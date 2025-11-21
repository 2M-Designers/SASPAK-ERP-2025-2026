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
import { Key, Eye, EyeOff } from "lucide-react";
import Loader from "@/components/app-loader";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // or your preferred toast library

const formSchema = z
  .object({
    Password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters",
      })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      }),
    ConfirmPassword: z.string().min(1, {
      message: "Please confirm your password",
    }),
  })
  .refine((data) => data.Password === data.ConfirmPassword, {
    message: "Passwords don't match",
    path: ["ConfirmPassword"],
  });

interface PasswordFormProps {
  UserID: string;
  onPasswordChanged?: () => void;
}

export default function PasswordForm({
  UserID,
  onPasswordChanged,
}: PasswordFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Password: "",
      ConfirmPassword: "",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, form]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const user = localStorage.getItem("user");
      let currentUserID = null;
      if (user) {
        const parsed = JSON.parse(user);
        currentUserID = parsed?.userID;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: UserID,
            newPassword: values.Password,
          }),
        }
      );

      if (res.ok) {
        toast.success("Password changed successfully!");

        // Refresh data
        router.refresh();

        // Notify parent component
        if (onPasswordChanged) {
          onPasswordChanged();
        }

        setOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to change password");
        console.error("Failed to change password:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An error occurred while changing the password");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-8 px-3 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800'
            title='Change password'
          >
            <Key className='h-4 w-4' />
          </Button>
        </DialogTrigger>

        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5' />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for this user. Password must be at least 8
              characters and contain uppercase, lowercase letters and numbers.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='Password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          placeholder='Enter new password'
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className='pr-10 focus:border-blue-400 focus:ring-blue-400'
                          disabled={isLoading}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                          onClick={togglePasswordVisibility}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className='h-4 w-4 text-gray-500' />
                          ) : (
                            <Eye className='h-4 w-4 text-gray-500' />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className='text-red-500 text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='ConfirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          placeholder='Confirm new password'
                          type={showConfirmPassword ? "text" : "password"}
                          {...field}
                          className='pr-10 focus:border-blue-400 focus:ring-blue-400'
                          disabled={isLoading}
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                          onClick={toggleConfirmPasswordVisibility}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className='h-4 w-4 text-gray-500' />
                          ) : (
                            <Eye className='h-4 w-4 text-gray-500' />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className='text-red-500 text-xs' />
                  </FormItem>
                )}
              />

              <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                <h4 className='text-sm font-medium text-blue-800 mb-1'>
                  Password Requirements:
                </h4>
                <ul className='text-xs text-blue-700 space-y-1'>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                    Minimum 8 characters
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                    At least one uppercase letter (A-Z)
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                    At least one lowercase letter (a-z)
                  </li>
                  <li className='flex items-center'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                    At least one number (0-9)
                  </li>
                </ul>
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
                  disabled={isLoading}
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
                      Changing...
                    </>
                  ) : (
                    "Change Password"
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
