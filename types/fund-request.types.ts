// ─── Cash Fund Request ────────────────────────────────────────────────────────

export interface CashFundRequestDetailPayload {
  InternalFundsRequestCashId: number;
  JobId: number;
  HeadCoaId: number;
  BeneficiaryCoaId: number;
  HeadOfAccount: string;
  Beneficiary: string;
  RequestedAmount: number;
  ApprovedAmount: number;
  CreatedOn: string;
  CashFundRequestMasterId: number;
  ChargesId: number;
  CustomerName: string;
  RequestedTo: number;
  OnAccountOfId: number;
  SubRequestStatus: string;
  Remarks: string;
  CashHeadId: number;
  IsBankLetterReleased: boolean;
  Version: number;
}

export interface CashFundRequestPayload {
  CashFundRequestId: number;
  TotalRequestedAmount: number;
  TotalApprovedAmount: number;
  ApprovalStatus: string;
  ApprovedBy: string;
  ApprovedOn: string;
  RequestedTo: number;
  CreatedOn: string;
  CashHeadId: number;
  RequestorUserId: number;
  Remarks: string;
  Version: number;
  InternalCashFundsRequests: CashFundRequestDetailPayload[];
}

// ─── Bank Fund Request ────────────────────────────────────────────────────────

export interface BankFundRequestDetailPayload {
  InternalFundsRequestBankId: number;
  JobId: number | null;
  HeadCoaId: number;
  BeneficiaryCoaId: number;
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
