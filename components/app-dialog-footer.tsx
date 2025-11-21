import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Loader2 } from "lucide-react";

export default function AppDialogFooter({
  isLoading,
  onSubmit,
}: {
  isLoading: boolean;
  onSubmit: any;
}) {
  return (
    <DialogFooter>
      <Button disabled={isLoading} onClick={onSubmit}>
        {isLoading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Please wait
          </>
        ) : (
          "Save"
        )}
      </Button>
    </DialogFooter>
  );
}
