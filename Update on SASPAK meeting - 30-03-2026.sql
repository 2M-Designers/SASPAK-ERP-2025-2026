Select * from ChargesMaster

--In charges Master we need two more fields
--Selection of Cash/Payorder/Both
--Selection of Fixed/Variable
--One more option discussed in charges we required option to select that charges are Job Charges or Non Job Charges

--*Bank Fund Request*
Select * from BankFundRequestMaster
Select * from InternalBankFundsRequest

-- In Bank Fund Request 
-- Kindly add Remarks field in BankFundRequestMaster
-- Kindly add Remarks field in InternalBankFundsRequest
-- Kindly replace AccountNo field into BankId in detail

--*Cash Fund Request*
Select * from CashFundRequestMaster
Select * from InternalCashFundsRequest

-- In Cash Fund Request 
-- Kindly add Remarks field in CashFundRequestMaster
-- Kindly add Remarks field in InternalCashFundsRequest
-- Kindly add CashHeadId field in detail as well

--Only Open Job Order Status will show for fund request
--If Job Order Marked complete status then only admin have rights to add fund request against complete job order


--*External Fund Request Bank/Cash Should be one Form*
-- Same Tables like 
Select * from BankFundRequestMaster
Select * from InternalBankFundsRequest

-- The changes are
-- Replace BankId from Master to JobId
-- If required then add customername in master
-- No JobId required in detail
-- No customername required in detail
-- Change accountno field in to AccountId

--Kindly provide ExternalFundRequest APIs


--Contract Master
ContractId
ContractDate
ContractEffectiveDate
ContractExpiryDate
PartyId
BrachId (multi select)
CompanyId
GoodsType (multi select) (Raw matirial / finish goods)
Direction (Import/Export) multi select
Transport (Sea/Air etc) multi select
ShippingType (FCL/LCL) multi select
Remarks


--Contract Detail
ContractDetailId
ContractMasterId
Sno
ChargesId
Description
Value
RangeStart
RangeEnd
IsTaxableValue (Yes/No)
IsCustomValue or IsInvoiceValue 


--Funds Request User Approval Permission
--They required option to update user permissions to allow the user for Funds Request Approval 
--Jis User ko yeh allow karain gai approval only that user will come in dropdown for forwarding the request for approval - currently all users are coming to forward the request 
--I thing we need to add one permission check in our users table


--Job Status Updates
--Required one API to Update the Job Status and Job Remarks (There will be seperate log for this that how many times job status has been updated and remarks updated)
--Job Status will be filled in dropdown
--Job Status List they have already provided I will share you today
--Admin have rights to update the Job Order after Job Order completion status has marked


--Parties Setup
--In parties setup we required a selection option for multi select option of Charges
--Please add field in Parties setup to save multiple charges on parties


--Bank Request Letter
--We have discussed this in meeting I will update you on this after these changes (Reminder !!)


--For Generate Billing We have create one form where user will select Job Order and all the details 
--will be filled from Internal Fund Request and External Fund Request and Contract

-- Then User will update the variable values if required and select the Bill to Parties 

-- if multiple bill to parties selected then each party will have a seperate invoice against that job order


--Example form format is showing below


--BillMaster
InvoiceId
InvoiceNo
InvoiceDate
JobId
BillingPartyId
ShipperId
ConsigneeId
NoofPackges
GrossWeight
NetWeight
Forwarder
ShipmentReleaseDate
PlaceOfDelivery
CustomerReference
DescriptionOfGoods
LCNo
LCDate
MasterBLNo
MasterBLDate
HouseBLNo
HouseBLDate
IGMno
IndexDate
GDNo
FlightNo
Origion
Destination
Vessel
Voyage
ValueLC
ValueFC
TotalPayableAmount
BillingRemarks
PaymentMethod

--BillDetail
BillDetailId
InvoiceMasterId
Sno
ChargesId
Description
Qty
Unit
Currency
Rate
Ex-Rate
Total