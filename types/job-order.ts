// types/job-order.ts
export interface JobOrder {
  jobId?: number;
  companyId: number;
  jobNumber: string;
  jobDate: string;
  operationType: string;
  operationMode: string;
  jobDocumentType: string;
  houseDocumentNumber: string;
  houseDocumentDate: string;
  masterDocumentNumber: string;
  masterDocumentDate: string;
  isFreightForwarding: boolean;
  isClearance: boolean;
  isTransporter: boolean;
  isOther: boolean;
  jobSubType: string;
  jobLoadType: string;
  freightType: string;
  shipperPartyId: number;
  consigneePartyId: number;
  notifyParty1Id: number;
  notifyParty2Id: number;
  principalId: number;
  overseasAgentId: number;
  transporterPartyId: number;
  depositorPartyId: number;
  carrierPartyId: number;
  terminalPartyId: number;
  originPortId: number;
  destinationPortId: number;
  placeOfDeliveryId: number;
  vesselName: string;
  voyageNo: string;
  grossWeight: number;
  netWeight: number;
  etdDate: string;
  etaDate: string;
  vesselArrival: string;
  deliverDate: string;
  freeDays: number;
  lastFreeDay: string;
  advanceRentPaidUpto: string;
  dispatchAddress: string;
  gdType: string;
  originalDocsReceivedOn: string;
  copyDocsReceivedOn: string;
  jobDescription: string;
  igmNumber: string;
  indexNo: string;
  blstatus: string;
  insurance: string;
  landing: string;
  caseSubmittedToLineOn: string;
  rentInvoiceIssuedOn: string;
  refundBalanceReceivedOn: string;
  status: string;
  remarks: string;
  poReceivedOn: string;
  poCustomDuty: number;
  poWharfage: number;
  poExciseDuty: number;
  poDeliveryOrder: number;
  poSecurityDeposite: number;
  poSasadvance: number;
  jobInvoiceExchRate: number;
  jobCharges: JobCharge[];
  jobCommodities: JobCommodity[];
  //jobEquipmentDetentionDetails: JobEquipmentDetentionDetail[];
  //jobEquipmentHandingOvers: JobEquipmentHandingOver[];
  jobEquipments: JobEquipment[];
  jobInvoices: JobInvoice[];
  version?: number;
}

export interface JobInvoice {
  jobInvoiceId?: number;
  jobId?: number;
  invoiceNumber: string;
  invoiceDate: string;
  issuedBy: string;
  shippingTerm: string;
  lcNumber: string;
  lcValue: number;
  lcDate: string;
  lcIssuedBy: string;
  lcCurrencyid: number;
  lcExchangeRate: number;
  flNumber: string;
  flDate: string;
  expiryDate: string;
  invoiceStatus: string;
  lcCurrency?: Currency;
  version?: number;
  // Additional fields for UI
  gdNumber?: string;
  gdDate?: string;
  gdType?: string;
  exchangeRate?: number;
  insuranceType?: string;
  insuranceAmount?: number;
  charges?: JobCharge[];
}

export interface JobCommodity {
  jobCommodityId?: number;
  companyId: number;
  jobId?: number;
  description: string;
  hsCodeId: number;
  grossWeight: number;
  netWeight: number;
  volumeCbm: number;
  declaredValueFc: number;
  declaredValueLc: number;
  currencyId: number;
  currency?: Currency;
  hsCode?: HsCode;
  version?: number;
  // UI fields
  origin?: number;
  quantity?: number;
  dv?: number;
  av?: number;
  totalValue?: number;
}

export interface JobCharge {
  jobChargeId?: number;
  companyId: number;
  jobId?: number;
  chargeId: number;
  chargeBasis: string;
  jobEquipmentId?: number;
  currencyId: number;
  exchangeRate: number;
  priceFc: number;
  priceLc: number;
  amountFc: number;
  amountLc: number;
  taxPercentage: number;
  taxFc: number;
  taxLc: number;
  isReimbursable: boolean;
  isVendorCost: boolean;
  remarks: string;
  version?: number;
}

export interface JobEquipment {
  jobEquipmentId?: number;
  companyId: number;
  jobId?: number;
  containerNo: string;
  containerTypeId: number;
  containerSizeId: number;
  sealNo: string;
  tareWeight: number;
  eirReceivedOn: string;
  rentInvoiceIssuedOn: string;
  containerRentFc: number;
  containerRentLc: number;
  damageDirtyFc: number;
  damageDirtyLc: number;
  refundAppliedOn: string;
  refundFc: number;
  refundLc: number;
  gateOutDate: string;
  gateInDate: string;
  eirSubmitted: boolean;
  eirDocumentId: number;
  status: string;
  version?: number;
}

export interface Currency {
  currencyId: number;
  currencyCode: string;
  isDefault: boolean;
  currencyName: string;
  symbol: string;
  isActive: boolean;
  version: number;
}

export interface HsCode {
  hsCodeId: number;
  parentHsCodeId: number;
  code: string;
  description: string;
  chapter: string;
  heading: string;
  customsDutyRate: number;
  salesTaxRate: number;
  regulatoryDutyRate: number;
  additionalDutyRate: number;
  uoM: string;
  isActive: boolean;
  remarks: string;
  effectiveFrom: string;
  validTill: string;
  version: number;
}

export interface Party {
  partyId: number;
  companyId: number;
  partyCode: string;
  partyName: string;
  partyShortName: string;
  isActive: boolean;
  isGllinked: boolean;
  isCustomer: boolean;
  isVendor: boolean;
  isCustomerVendor: boolean;
  isAgent: boolean;
  isOverseasAgent: boolean;
  isShippingLine: boolean;
  isTransporter: boolean;
  isConsignee: boolean;
  isShipper: boolean;
  isPrincipal: boolean;
  isNonGlparty: boolean;
  isInSeaImport: boolean;
  isInSeaExport: boolean;
  isInAirImport: boolean;
  isInAirExport: boolean;
  isInLogistics: boolean;
  unlocationId: number;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  ntnnumber: string;
  strnnumber: string;
  bankName: string;
  bankAccountNumber: string;
  ibannumber: string;
  creditLimitLc: number;
  creditLimitFc: number;
  allowedCreditDays: number;
  paymentTerms: string;
  glparentAccountId: number;
  glaccountId: number;
  trackIdAllowed: boolean;
  idPasswordAllowed: boolean;
  sendEmail: boolean;
  canSeeBills: boolean;
  canSeeLedger: boolean;
  isProcessOwner: boolean;
  clearanceByOps: boolean;
  clearanceByAcm: boolean;
  attradeForGdinsustrial: boolean;
  attradeForGdcommercial: boolean;
  benificiaryNameOfPo: string;
  salesRepId: number;
  docsRepId: number;
  accountsRepId: number;
  version: number;
}

export interface Bank {
  bankId: number;
  bankCode: string;
  bankName: string;
  isActive: boolean;
  version: number;
}

export interface UnLocation {
  unlocationId: number;
  parentUnlocationId: number;
  uncode: string;
  locationName: string;
  isCountry: boolean;
  isSeaPort: boolean;
  isDryPort: boolean;
  isTerminal: boolean;
  isCity: boolean;
  isActive: boolean;
  remarks: string;
  version: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  totalCount?: number;
}
