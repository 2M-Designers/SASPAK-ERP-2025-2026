import * as z from "zod";

// Job Master Schema - Updated with Scope fields
export const jobMasterSchema = z.object({
  jobId: z.number().optional(),
  companyId: z.number().default(1),
  jobNumber: z.string().optional(),
  jobDate: z.string().default(new Date().toISOString().split("T")[0]),
  customerReferenceNumber: z.string().optional(),
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

  freightType: z.string().optional(),
  blstatus: z.string().optional(),
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
  notifyPartyId: z.number().optional().nullable(), // ← MISSING
  billingToShipperId: z.number().optional().nullable(), // ← MISSING
  billingToConsigneeId: z.number().optional().nullable(), // ← MISSING
  jobRemarks: z.string().optional().nullable(),
});

// FCL Container Schema
/*export const fclContainerSchema = z.object({
  jobEquipmentId: z.number().optional(),
  containerNo: z.string().min(1, "Required"),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),
  weight: z.number().min(0).default(0),
  noOfPackages: z.number().min(0).default(0),
  packageType: z.string().optional(),
});*/

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

// ============================================
// UPDATED FCL CONTAINER SCHEMA
// Add this to your schemas/jobOrderSchemas.ts
// ============================================

// Container Number Validation Pattern
// Format: ABCU-123456-7 or ABCU1234567
const containerNoPattern = /^[A-Z]{4}[-]?\d{6,7}[-]?\d?$/;

export const fclContainerSchema = z.object({
  jobEquipmentId: z.number().optional(),

  // Basic Fields
  containerNo: z
    .string()
    .min(1, "Container number is required")
    .regex(containerNoPattern, "Format: ABCU-123456-7 or ABCU1234567"),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),

  // Weight field (maps to TareWeight in API)
  weight: z.number().min(0, "Weight must be positive").default(0),

  // NEW: Additional Equipment Fields
  sealNo: z.string().optional(),

  // EIR Fields
  eirReceivedOn: z.string().optional(),
  eirSubmitted: z.boolean().default(false),
  eirDocumentId: z.number().optional(),

  // Rent Fields
  rentInvoiceIssuedOn: z.string().optional(),
  containerRentFc: z.number().min(0).default(0),
  containerRentLc: z.number().min(0).default(0),

  // Damage/Dirty Fields
  damageDirtyFc: z.number().min(0).default(0),
  damageDirtyLc: z.number().min(0).default(0),

  // Refund Fields
  refundAppliedOn: z.string().optional(),
  refundFc: z.number().min(0).default(0),
  refundLc: z.number().min(0).default(0),

  // Gate Fields
  gateOutDate: z.string().optional(),
  gateInDate: z.string().optional(),

  // Status (using package type)
  status: z.string().optional(),

  // No longer needed in form (removed)
  // noOfPackages: z.number().min(0).default(0),
  // packageType: z.string().optional(),
});

// Export types
export type JobMasterFormValues = z.infer<typeof jobMasterSchema>;
export type FclContainerFormValues = z.infer<typeof fclContainerSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
