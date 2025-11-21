import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import Loader from "@/components/app-loader";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { toast } from "sonner"; // or your preferred toast library

interface RoleChangeFormProps {
  defaultState: any;
  roles: any[];
  onRoleChanged?: () => void;
}

export default function RoleChangeForm({
  defaultState,
  roles,
  onRoleChanged,
}: RoleChangeFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const router = useRouter();

  // Initialize selected role when component mounts or defaultState changes
  useEffect(() => {
    if (defaultState?.roleID && roles.length > 0) {
      const currentRole = roles.find(
        (role) => role.value === defaultState.roleID
      );
      setSelectedRole(currentRole);
    }
  }, [defaultState, roles]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset to original role when dialog closes without saving
    if (!isOpen) {
      const currentRole = roles.find(
        (role) => role.value === defaultState.roleID
      );
      setSelectedRole(currentRole);
    }
  };

  const onSubmit = async () => {
    // Validation
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    if (selectedRole.value === defaultState.roleID) {
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
        `${process.env.NEXT_PUBLIC_BASE_URL}UsersManagement/updateuserrole/${defaultState.userID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UserID: defaultState.userID,
            RoleID: selectedRole.value,
          }),
        }
      );

      if (res.ok) {
        toast.success("User role updated successfully!");

        // Refresh data
        router.refresh();

        // Notify parent component
        if (onRoleChanged) {
          onRoleChanged();
        }

        setOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to update user role");
        console.error("Failed to update role:", res.status, errorData);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("An error occurred while updating the role");
    } finally {
      setIsLoading(false);
    }
  };

  // Get current role name for display
  const currentRoleName =
    roles.find((role) => role.value === defaultState.roleID)?.label ||
    "Unknown";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='h-8 px-3 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800'
            title={`Change role from ${currentRoleName}`}
          >
            <Shield className='h-4 w-4' />
          </Button>
        </DialogTrigger>

        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Change role for <strong>{defaultState.username}</strong>. Current
              role:{" "}
              <span className='font-semibold text-blue-600'>
                {currentRoleName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>
                Select New Role
              </label>
              <Select
                options={roles}
                value={selectedRole}
                onChange={setSelectedRole}
                placeholder='Choose a role...'
                isSearchable
                isDisabled={isLoading}
                className='react-select-container'
                classNamePrefix='react-select'
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#d1d5db",
                    minHeight: "44px",
                    "&:hover": {
                      borderColor: "#93c5fd",
                    },
                    "&:focus-within": {
                      borderColor: "#3b82f6",
                      boxShadow: "0 0 0 1px #3b82f6",
                    },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                      ? "#eff6ff"
                      : "white",
                    color: state.isSelected ? "white" : "inherit",
                  }),
                }}
              />
            </div>

            {selectedRole && selectedRole.value !== defaultState.roleID && (
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
                <p className='text-sm text-blue-700'>
                  <strong>Change:</strong> {currentRoleName} →{" "}
                  <span className='font-semibold'>{selectedRole.label}</span>
                </p>
              </div>
            )}
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
              onClick={onSubmit}
              disabled={
                isLoading ||
                !selectedRole ||
                selectedRole.value === defaultState.roleID
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
                "Update Role"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && <Loader />}
    </>
  );
}
