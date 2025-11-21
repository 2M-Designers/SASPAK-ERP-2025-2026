import { Button } from "./ui/button";
import { Edit, PlusSquare } from "lucide-react";

export default function AppDialogTrigger({
  type,
  title,
  handleClick,
  isDisabled,
}: {
  type: string;
  title: string;
  handleClick: any;
  isDisabled: boolean;
}) {
  return type === "Edit" ? (
    <Edit onClick={handleClick} className='cursor-pointer' />
  ) : type === "New" ? (
    <Button variant='ghost' size='icon' onClick={handleClick} type='button'>
      <PlusSquare className='h-full w-full p-1' />
    </Button>
  ) : (
    <Button
      disabled={isDisabled}
      onClick={handleClick}
      className='bg-gray-200'
      variant='outline'
      type='button'
    >
      {title}
    </Button>
  );
}
