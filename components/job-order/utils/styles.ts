import { CSSObjectWithLabel, GroupBase, StylesConfig } from "react-select";

// Define the type for our select options
interface SelectOption {
  value: number | string;
  label: string;
  [key: string]: any;
}

// Compact styles for react-select with proper typing
export const compactSelectStyles: StylesConfig<
  SelectOption,
  false,
  GroupBase<SelectOption>
> = {
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    minHeight: "32px",
    height: "32px",
    fontSize: "13px",
  }),
  valueContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    height: "32px",
    padding: "0 6px",
  }),
  input: (base: CSSObjectWithLabel) => ({
    ...base,
    margin: "0px",
  }),
  indicatorsContainer: (base: CSSObjectWithLabel) => ({
    ...base,
    height: "32px",
  }),
};
