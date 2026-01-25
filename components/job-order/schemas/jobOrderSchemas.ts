import * as z from "zod";

// ============================================
// JOB MASTER SCHEMA - UPDATED TO MATCH DATABASE
// ============================================
export const jobMasterSchema = z.object({
  // System Fields
  jobId: z.number().optional(),
  companyId: z.number().default(1),
  version: z.number().optional(),

  // Basic Information
  jobNumber: z.string().optional(),
  jobDate: z.string().default(new Date().toISOString().split("T")[0]),
  customerReferenceNumber: z.string().optional(),
  indexNo: z.string().optional(),
  status: z.string().default("DRAFT"),

  // Scope Flags
  isFreightForwarding: z.boolean().default(false),
  isClearance: z.boolean().default(false),
  isTransporter: z.boolean().default(false),
  isOther: z.boolean().default(false),

  // Operation Details
  operationType: z.string().optional(),
  operationMode: z.string().optional(),
  jobSubType: z.string().optional(),
  jobLoadType: z.string().optional(),
  jobDocumentType: z.string().optional(),
  freightType: z.string().optional(),

  // Process Owner
  processOwnerId: z.number().optional(),

  // Party IDs (ALL 10 PARTIES)
  shipperPartyId: z.number().optional(),
  consigneePartyId: z.number().optional(),
  notifyParty1Id: z.number().optional(),
  notifyParty2Id: z.number().optional(),
  principalId: z.number().optional(),
  overseasAgentId: z.number().optional(),
  transporterPartyId: z.number().optional(),
  depositorPartyId: z.number().optional(),
  carrierPartyId: z.number().optional(),
  terminalPartyId: z.number().optional(),

  // Document Numbers
  houseDocumentNumber: z.string().optional(),
  houseDocumentDate: z.string().optional(),
  masterDocumentNumber: z.string().optional(),
  masterDocumentDate: z.string().optional(),

  // Location IDs
  originPortId: z.number().optional(),
  destinationPortId: z.number().optional(),
  placeOfDeliveryId: z.number().optional(),

  // Vessel Information
  vesselName: z.string().optional(),
  voyageNo: z.string().optional(),

  // Weight
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),

  // Dates
  etdDate: z.string().optional(),
  etaDate: z.string().optional(),
  vesselArrival: z.string().optional(),
  deliverDate: z.string().optional(),
  freeDays: z.number().min(0).default(0),
  lastFreeDay: z.string().optional(),
  advanceRentPaidUpto: z.string().optional(),

  // Address
  dispatchAddress: z.string().optional(),

  // Document Receipt Dates
  originalDocsReceivedOn: z.string().optional(),
  copyDocsReceivedOn: z.string().optional(),

  // Description & Documentation
  jobDescription: z.string().optional(),
  igmNumber: z.string().optional(),
  blstatus: z.string().optional(),

  // Financial
  jobInvoiceExchRate: z.number().min(0).default(0),
  insurance: z.string().optional(),
  landing: z.string().optional(),
  freightCharges: z.number().min(0).default(0).optional(),

  // PO (Payment Order) Fields
  poReceivedOn: z.string().optional(),
  poCustomDuty: z.number().min(0).default(0),
  poWharfage: z.number().min(0).default(0),
  poExciseDuty: z.number().min(0).default(0),
  poDeliveryOrder: z.number().min(0).default(0),
  poSecurityDeposite: z.number().min(0).default(0),
  poSasadvance: z.number().min(0).default(0),

  // GD (Goods Declaration) Fields - Note the lowercase naming
  gdnumber: z.string().optional(),
  gdType: z.string().optional(),
  gddate: z.string().optional(),
  gdcharges: z.number().min(0).default(0),
  gdclearedUs: z.string().optional(),
  gdsecurityType: z.string().optional(),
  gdsecurityValue: z.string().optional(), // Note: This is a STRING, not number
  gdsecurityExpiryDate: z.string().optional(),
  psqcaSamples: z.string().optional(), // PSQCA Samples status

  // Case & Rent Tracking
  caseSubmittedToLineOn: z.string().optional(),
  rentInvoiceIssuedOn: z.string().optional(),
  refundBalanceReceivedOn: z.string().optional(),

  // Remarks
  remarks: z.string().optional(),
});

// ============================================
// FCL CONTAINER SCHEMA - MATCHES JobEquipment TABLE
// ============================================

// Container Number Validation Pattern
// Format: ABCU-123456-7 or ABCU1234567
const containerNoPattern = /^[A-Z]{4}[-]?\d{6,7}[-]?\d?$/;

export const fclContainerSchema = z.object({
  // System Fields
  jobEquipmentId: z.number().optional(),
  companyId: z.number().optional(),
  jobId: z.number().optional(),
  version: z.number().optional(),

  // Basic Fields
  containerNo: z
    .string()
    .min(1, "Container number is required")
    .regex(containerNoPattern, "Format: ABCU-123456-7 or ABCU1234567"),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),

  // CRITICAL: Field is called 'tareWeight' in database, not 'weight'
  tareWeight: z.number().min(0, "Weight must be positive").default(0),

  sealNo: z.string().optional(),

  // EIR (Equipment Interchange Receipt) Fields
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

  // Gate Movement Fields
  gateOutDate: z.string().optional(),
  gateInDate: z.string().optional(),

  // Status
  status: z.string().optional(),
});

// ============================================
// JOB COMMODITY SCHEMA - FOR JOB LEVEL COMMODITIES
// ============================================
export const jobCommoditySchema = z.object({
  jobCommodityId: z.number().optional(),
  companyId: z.number().optional(),
  jobId: z.number().optional(),
  description: z.string().optional(),
  hsCodeId: z.number().optional(),
  grossWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  volumeCbm: z.number().min(0).default(0),
  declaredValueFc: z.number().min(0).default(0),
  declaredValueLc: z.number().min(0).default(0),
  currencyId: z.number().optional(),
  version: z.number().optional(),
});

// ============================================
// JOB CHARGE SCHEMA - NEW
// ============================================
export const jobChargeSchema = z.object({
  jobChargeId: z.number().optional(),
  companyId: z.number().optional(),
  jobId: z.number().optional(),
  chargeId: z.number().optional(),
  chargeBasis: z.string().optional(),
  jobEquipmentId: z.number().optional(),
  currencyId: z.number().optional(),
  exchangeRate: z.number().min(0).default(0),
  priceFc: z.number().min(0).default(0),
  priceLc: z.number().min(0).default(0),
  amountFc: z.number().min(0).default(0),
  amountLc: z.number().min(0).default(0),
  taxPercentage: z.number().min(0).default(0),
  taxFc: z.number().min(0).default(0),
  taxLc: z.number().min(0).default(0),
  isReimbursable: z.boolean().default(false),
  isVendorCost: z.boolean().default(false),
  remarks: z.string().optional(),
  version: z.number().optional(),
});

// ============================================
// JOB EQUIPMENT DETENTION DETAIL SCHEMA - NEW
// ============================================
export const jobEquipmentDetentionDetailSchema = z.object({
  jobEquipmentDetentionDetailId: z.number().optional(),
  jobId: z.number().optional(),
  containerNumber: z.string().optional(),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),
  netWeight: z.number().min(0).default(0),
  transporterPartyId: z.number().optional(),
  emptyDate: z.string().optional(),
  eirReceivedOn: z.string().optional(),
  condition: z.string().optional(),
  rentDays: z.number().min(0).default(0),
  rentAmountLc: z.number().min(0).default(0),
  damage: z.string().optional(),
  dirty: z.string().optional(),
  version: z.number().optional(),
});

// ============================================
// JOB EQUIPMENT HANDING OVER SCHEMA - NEW
// ============================================
export const jobEquipmentHandingOverSchema = z.object({
  jobEquipmentHandingOverId: z.number().optional(),
  jobId: z.number().optional(),
  containerNumber: z.string().optional(),
  containerSizeId: z.number().optional(),
  containerTypeId: z.number().optional(),
  netWeight: z.number().min(0).default(0),
  transporterPartyId: z.number().optional(),
  destinationLocationId: z.number().optional(),
  buyingAmountLc: z.number().min(0).default(0),
  topayAmountLc: z.number().min(0).default(0),
  dispatchDate: z.string().optional(),
  version: z.number().optional(),
});

// ============================================
// JOB GOODS DECLARATION SCHEMA - NEW
// ============================================
export const jobGoodsDeclarationSchema = z.object({
  id: z.number().optional(),
  jobId: z.number().optional(),
  unitType: z.string().optional(),
  quantity: z.number().min(0).default(0),
  cocode: z.string().optional(),
  sronumber: z.string().optional(),
  hscode: z.string().optional(),
  itemDescription: z.string().optional(),
  declaredUnitValue: z.number().min(0).default(0),
  assessedUnitValue: z.number().min(0).default(0),
  totalDeclaredValue: z.number().min(0).default(0),
  totalAssessedValue: z.number().min(0).default(0),
  customDeclaredValue: z.number().min(0).default(0),
  customAssessedValue: z.number().min(0).default(0),
  levyCd: z.number().min(0).default(0),
  levySt: z.number().min(0).default(0),
  levyRd: z.number().min(0).default(0),
  levyAsd: z.number().min(0).default(0),
  levyIt: z.number().min(0).default(0),
  rateCd: z.number().min(0).default(0),
  rateSt: z.number().min(0).default(0),
  rateRd: z.number().min(0).default(0),
  rateAsd: z.number().min(0).default(0),
  rateIt: z.number().min(0).default(0),
  payableCd: z.number().min(0).default(0),
  payableSt: z.number().min(0).default(0),
  payableRd: z.number().min(0).default(0),
  payableAsd: z.number().min(0).default(0),
  payableIt: z.number().min(0).default(0),
  version: z.number().optional(),
});

// ============================================
// JOB INVOICE COMMODITY SCHEMA - ✅ NEW FOR NESTED COMMODITIES
// ============================================
export const jobInvoiceCommoditySchema = z.object({
  jobInvoiceCommodityId: z.number().optional(),
  jobInvoiceId: z.number().optional(),
  description: z.string().min(1, "Description required"),
  hscodeId: z.number().optional(), // Note: lowercase 's' in API
  originId: z.number().optional(),
  quantity: z.number().min(0).default(0),
  dutiableValue: z.number().min(0).default(0),
  assessableValue: z.number().min(0).default(0),
  totalValueAv: z.number().min(0).default(0), // Total based on AV
  totalValueDv: z.number().min(0).default(0), // Total based on DV
  version: z.number().optional(),
});

// ============================================
// JOB INVOICE SCHEMA - ✅ UPDATED WITH NESTED COMMODITIES
// ============================================
export const jobInvoiceSchema = z.object({
  jobInvoiceId: z.number().optional(),
  jobId: z.number().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  issuedBy: z.string().optional(), // Note: API uses 'issuedBy', not 'invoiceIssuedByPartyId'
  shippingTerm: z.string().optional(),

  // LC (Letter of Credit) Fields
  lcNumber: z.string().optional(),
  lcValue: z.number().min(0).default(0),
  lcDate: z.string().optional(),
  lcIssuedBy: z.string().optional(), // Note: API uses 'lcIssuedBy', not 'lcIssuedByBankId'
  lcCurrencyid: z.number().optional(), // Note: lowercase 'id'
  lcExchangeRate: z.number().min(0).default(0),

  // FL (Form L) Fields
  flNumber: z.string().optional(), // Note: 'fl' not 'fi'
  flDate: z.string().optional(),
  expiryDate: z.string().optional(),

  invoiceStatus: z.string().optional(),
  version: z.number().optional(),

  // ✅ ADDED: Nested commodities array
  jobInvoiceCommodities: z.array(jobInvoiceCommoditySchema).optional(),
});

// ============================================
// INVOICE ITEM SCHEMA - FOR FORM COMPATIBILITY
// ============================================
export const invoiceItemSchema = z.object({
  invoiceItemId: z.number().optional(), // Maps to jobInvoiceCommodityId
  jobInvoiceId: z.number().optional(),
  hsCodeId: z.number().optional(),
  hsCode: z.string().min(1, "HS Code required"),
  description: z.string().min(1, "Description required"),
  originId: z.number().optional(),
  quantity: z.number().min(0).default(0),
  dutiableValue: z.number().min(0).default(0),
  assessableValue: z.number().min(0).default(0),
  totalValue: z.number().min(0).default(0), // Will be split into AV and DV
  version: z.number().optional(),
});

// For backward compatibility with existing invoice form
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
  lcExchangeRate: z.number().min(0).default(0),
  fiNumber: z.string().optional(),
  fiDate: z.string().optional(),
  fiExpiryDate: z.string().optional(),
  invoiceStatus: z.string().optional(),
  version: z.number().optional(),
  items: z.array(invoiceItemSchema).default([]),
});

// ============================================
// EXPORTED TYPES
// ============================================
export type JobMasterFormValues = z.infer<typeof jobMasterSchema>;
export type FclContainerFormValues = z.infer<typeof fclContainerSchema>;
export type JobCommodityFormValues = z.infer<typeof jobCommoditySchema>;
export type JobChargeFormValues = z.infer<typeof jobChargeSchema>;
export type JobEquipmentDetentionDetailFormValues = z.infer<
  typeof jobEquipmentDetentionDetailSchema
>;
export type JobEquipmentHandingOverFormValues = z.infer<
  typeof jobEquipmentHandingOverSchema
>;
export type JobGoodsDeclarationFormValues = z.infer<
  typeof jobGoodsDeclarationSchema
>;
export type JobInvoiceFormValues = z.infer<typeof jobInvoiceSchema>;
export type JobInvoiceCommodityFormValues = z.infer<
  typeof jobInvoiceCommoditySchema
>;
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;
