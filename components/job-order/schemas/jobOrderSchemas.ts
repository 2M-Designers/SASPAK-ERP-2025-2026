import * as z from "zod";

// Job Master Schema - Updated with Scope fields
export const jobMasterSchema = z.object({
  jobId: z.number().optional(),
  companyId: z.number().default(1),
  jobNumber: z.string().optional(),
  jobDate: z.string().default(new Date().toISOString().split("T")[0]),
  indexNo: z.string().optional(),
  processOwnerId: z.number().optional(),

  // Scope checkboxes
  isFreightForwarding: z.boolean().default(false),
  isClearance: z.boolean().default(false),
  isTransporter: z.boolean().default(false),
  isOther: z.boolean().default(false),

  scope: z.string().optional(),
  operationType: z.string().optional(),
  operationMode: z.string().optional(),
  jobSubType: z.string().optional(),
  jobLoadType: z.string().optional(),
  jobDocumentType: z.string().optional(),
  shipperPartyId: z.number().optional(),
  consigneePartyId: z.number().optional(),
  billingPartiesInfo: z.string().optional(),
  houseDocumentNumber: z.string().optional(),
  houseDocumentDate: z.string().optional(),
  masterDocumentNumber: z.string().optional(),
  masterDocumentDate: z.string().optional(),
  carrierPartyId: z.number().optional(),
  originAgentId: z.number().optional(),
  localAgentId: z.number().optional(),
  freeDays: z.number().min(0).default(0),
  lastFreeDay: z.string().optional(),
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  polId: z.number().optional(),
  podId: z.number().optional(),
  placeOfDeliveryId: z.number().optional(),
  vesselName: z.string().optional(),
  terminalId: z.number().optional(),
  expectedArrivalDate: z.string().optional(),
  igmNumber: z.string().optional(),
  indexNumber: z.string().optional(),
  freightType: z.string().optional(),
  blStatus: z.string().optional(),
  exchangeRate: z.number().min(0).default(0),
  insurance: z.string().optional(),
  insurancePercentage: z.number().optional(),
  insuranceValue: z.number().optional(),
  landing: z.string().optional(),
  gdNumber: z.string().optional(),
  gdDate: z.string().optional(),
  gdType: z.string().optional(),
  gdClearedUS: z.string().optional(),
  securityType: z.string().optional(),
  securityValue: z.number().min(0).default(0),
  securityExpiryDate: z.string().optional(),
  rmsChannel: z.string().optional(),
  delayInClearance: z.string().optional(),
  delayInDispatch: z.string().optional(),
  psqcaSamples: z.string().optional(),
  remarks: z.string().optional(),
  status: z.string().default("DRAFT"),
  version: z.number().optional(),
  freightCharges: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
});

// FCL Container Schema
export const fclContainerSchema = z.object({
  jobEquipmentId: z.number().optional(),
  containerNo: z.string().min(1, "Required"),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),
  weight: z.number().min(0).default(0),
  noOfPackages: z.number().min(0).default(0),
  packageType: z.string().optional(),
});

// Invoice Item Schema
export const invoiceItemSchema = z.object({
  invoiceItemId: z.number().optional(),
  hsCodeId: z.number().optional(),
  hsCode: z.string().min(1, "HS Code required"),
  description: z.string().min(1, "Description required"),
  originId: z.number().optional(),
  quantity: z.number().min(0).default(0),
  dutiableValue: z.number().min(0).default(0),
  assessableValue: z.number().min(0).default(0),
  totalValue: z.number().min(0).default(0),
});

// Invoice Schema
export const invoiceSchema = z.object({
  invoiceId: z.number().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  invoiceIssuedByPartyId: z.number().optional(),
  shippingTerm: z.string().optional(),
  lcNumber: z.string().optional(),
  lcDate: z.string().optional(),
  lcIssuedByBankId: z.number().optional(),
  lcValue: z.number().min(0).default(0),
  lcCurrencyId: z.number().optional(),
  fiNumber: z.string().optional(),
  fiDate: z.string().optional(),
  fiExpiryDate: z.string().optional(),
  items: z.array(invoiceItemSchema).default([]),
});

// Export types
export type JobMasterFormValues = z.infer<typeof jobMasterSchema>;
export type FclContainerFormValues = z.infer<typeof fclContainerSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
