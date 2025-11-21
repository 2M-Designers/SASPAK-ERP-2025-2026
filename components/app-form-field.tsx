import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import Select from "react-select";

const AppFormField = ({
  type = "text",
  name,
  label,
  control,
  placeholder = "",
  isDisabled = false,
  options = [],
  isMultiSelect = false,
  onChange = null,
}: {
  type?: string;
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  isDisabled?: boolean;
  options?: any[];
  isMultiSelect?: boolean;
  onChange?: any;
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === "select" ? (
              <Select
                isMulti={isMultiSelect}
                options={options}
                placeholder={placeholder}
                {...field}
                onChange={
                  onChange ? onChange : (value) => field.onChange(value)
                }
              />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                disabled={isDisabled}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default AppFormField;
