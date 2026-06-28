// ─── Cash Fund Request ────────────────────────────────────────────────────────

export interface CashFundRequestDetailPayload {
  InternalFundsRequestCashId: number;
  JobId: number;
  HeadCoaId: number | null;
  BeneficiaryCoaId: number | null;
  HeadOfAccount: string;
  Beneficiary: string;
  RequestedAmount: number;
  ApprovedAmount: number;
  CreatedOn: string;
  CreatedBy: number;
  CashFundRequestMasterId: number;
  ChargesId: number;
  CustomerName: string;
  RequestedTo: number;
  OnAccountOfId: number | null;
  SubRequestStatus: string;
  Remarks: string;
  CostCenterId: number | null;
  CashHeadId: number | null;
  IsBankLetterReleased: boolean;
  Version: number;
}

export interface CashFundRequestPayload {
  CashFundRequestId: number;
  TotalRequestedAmount: number;
  TotalApprovedAmount: number;
  ApprovalStatus: string;
  ApprovedBy: string | null;
  ApprovedOn: string | null;
  RequestedTo: number;
  CreatedOn: string;
  CreatedBy: number;
  CashHeadId: number | null;
  RequestorUserId: number;
  Remarks: string;
  Version: number;
  InternalCashFundsRequests: CashFundRequestDetailPayload[];
}

// ─── Bank Fund Request ────────────────────────────────────────────────────────

export interface BankFundRequestDetailPayload {
  InternalFundsRequestBankId: number;
  JobId: number | null;
  HeadCoaId: number | null;
  BeneficiaryCoaId: number | null;
  HeadOfAccount: string;
  Beneficiary: string;
  AccountNo: string;
  RequestedAmount: number;
  ApprovedAmount: number;
  ChargesId: number;
  CustomerName: string;
  OnAccountOfId: number | null;
  RequestedTo: number;
  BankFundRequestMasterId: number;
  BankId: number | null;
  SubRequestStatus: string;
  Remarks: string;
  CostCenterId: number | null;
  Version: number;
  CreatedOn: string;
  CreatedBy: number;
}

export interface BankFundRequestPayload {
  BankFundRequestId: number;
  BankId: number | null;
  TotalRequestedAmount: number;
  TotalApprovedAmount: number;
  ApprovalStatus: string;
  ApprovedBy: string | null;
  ApprovedOn: string | null;
  RequestedTo: number;
  RequestorUserId: number;
  CreatedOn: string;
  CreatedBy: number;
  Remarks: string;
  Version: number;
  InternalBankFundsRequests: BankFundRequestDetailPayload[];
}
