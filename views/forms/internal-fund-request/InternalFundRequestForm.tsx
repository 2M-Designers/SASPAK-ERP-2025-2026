"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InternalFundRequestFormProps = {
  type: "add" | "edit";
  defaultState?: any;
  handleAddEdit: (data: any) => void;
};

type LineItem = {
  id: string;
  jobId: number | null;
  jobNumber: string;
  headCoaId: number | null;
  headOfAccount: string;
  beneficiaryCoaId: number | null;
  beneficiary: string;
  partiesAccount: string;
  requestedAmount: number;
  approvalStatus: string;
};

type Job = {
  jobId: number;
  jobNumber: string;
  operationType: string;
  status: string;
  shipperPartyId?: number;
  consigneePartyId?: number;
  shipperName?: string;
  consigneeName?: string;
};

type ChargesMaster = {
  chargesMasterId: number;
  chargeCode: string;
  chargeDescription: string;
};

type Party = {
  partyId: number;
  partyCode: string;
  partyName: string;
  beneficiaryFromPurchaseOrder?: string;
};

export default function InternalFundRequestForm({
  type,
  defaultState,
  handleAddEdit,
}: InternalFundRequestFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      jobId: null,
      jobNumber: "",
      headCoaId: null,
      headOfAccount: "",
      beneficiaryCoaId: null,
      beneficiary: "",
      partiesAccount: "",
      requestedAmount: 0,
      approvalStatus: "PENDING",
    },
  ]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [chargesMasters, setChargesMasters] = useState<ChargesMaster[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch Jobs (Auto filter arrived/open jobs)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Job/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "JobId, JobNumber",
            where: "",
            sortOn: "JobId DESC",
            page: "1",
            pageSize: "100",
          }),
        });

        if (response.ok) {
          const jobData = await response.json();
          // Fetch party names for jobs
          const enrichedJobs = await Promise.all(
            jobData.map(async (job: Job) => {
              const [shipperName, consigneeName] = await Promise.all([
                fetchPartyName(job.shipperPartyId),
                fetchPartyName(job.consigneePartyId),
              ]);
              return {
                ...job,
                shipperName,
                consigneeName,
              };
            }),
          );
          setJobs(enrichedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jobs",
        });
      }
    };

    const fetchChargesMasters = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}ChargesMaster/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "ChargesMasterId, ChargeCode, ChargeDescription",
            where: "",
            sortOn: "ChargeCode ASC",
            page: "1",
            pageSize: "200",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setChargesMasters(data);
        }
      } catch (error) {
        console.error("Error fetching charges:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load expense heads",
        });
      }
    };

    const fetchParties = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${baseUrl}Party/GetList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "PartyId, PartyCode, PartyName, BeneficiaryFromPurchaseOrder",
            where: "",
            sortOn: "PartyName ASC",
            page: "1",
            pageSize: "500",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setParties(data);
        }
      } catch (error) {
        console.error("Error fetching parties:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load parties",
        });
      }
    };

    fetchJobs();
    fetchChargesMasters();
    fetchParties();
  }, [toast]);

  const fetchPartyName = async (partyId?: number): Promise<string> => {
    if (!partyId) return "";
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${baseUrl}Party/${partyId}`);
      if (response.ok) {
        const data = await response.json();
        return data.partyName || data.partyCode || "";
      }
    } catch (error) {
      console.error(`Error fetching party ${partyId}:`, error);
    }
    return "";
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        jobId: null,
        jobNumber: "",
        headCoaId: null,
        headOfAccount: "",
        beneficiaryCoaId: null,
        beneficiary: "",
        partiesAccount: "",
        requestedAmount: 0,
        approvalStatus: "PENDING",
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least one line item is required",
      });
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleJobChange = async (id: string, jobId: string) => {
    const selectedJob = jobs.find((j) => j.jobId.toString() === jobId);
    if (selectedJob) {
      // Determine parties account based on operation type
      let partiesAccount = "";
      if (selectedJob.operationType === "EXPORT") {
        partiesAccount = selectedJob.shipperName || "";
      } else {
        partiesAccount = selectedJob.consigneeName || "";
      }

      updateLineItem(id, "jobId", selectedJob.jobId);
      updateLineItem(id, "jobNumber", selectedJob.jobNumber);
      updateLineItem(id, "partiesAccount", partiesAccount);
    }
  };

  const handleHeadOfAccountChange = (id: string, headCoaId: string) => {
    const selectedCharge = chargesMasters.find(
      (c) => c.chargesMasterId.toString() === headCoaId,
    );
    if (selectedCharge) {
      updateLineItem(id, "headCoaId", selectedCharge.chargesMasterId);
      updateLineItem(
        id,
        "headOfAccount",
        selectedCharge.chargeDescription || selectedCharge.chargeCode,
      );
    }
  };

  const handleBeneficiaryChange = (id: string, beneficiaryCoaId: string) => {
    const selectedParty = parties.find(
      (p) => p.partyId.toString() === beneficiaryCoaId,
    );
    if (selectedParty) {
      updateLineItem(id, "beneficiaryCoaId", selectedParty.partyId);
      updateLineItem(
        id,
        "beneficiary",
        selectedParty.beneficiaryFromPurchaseOrder ||
          selectedParty.partyName ||
          selectedParty.partyCode,
      );
    }
  };

  const validateForm = (): boolean => {
    for (const item of lineItems) {
      if (!item.jobId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select a job number for all line items",
        });
        return false;
      }
      if (!item.headCoaId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select a head of account for all line items",
        });
        return false;
      }
      if (!item.beneficiaryCoaId) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select a beneficiary for all line items",
        });
        return false;
      }
      if (!item.requestedAmount || item.requestedAmount <= 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please enter a valid amount for all line items",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // Submit each line item
      const promises = lineItems.map(async (item) => {
        const payload = {
          jobId: item.jobId,
          headCoaId: item.headCoaId,
          beneficiaryCoaId: item.beneficiaryCoaId,
          headOfAccount: item.headOfAccount,
          beneficiary: item.beneficiary,
          requestedAmount: item.requestedAmount,
          approvalStatus: item.approvalStatus,
          createdOn: new Date().toISOString(),
          version: 0,
        };

        if (type === "edit" && defaultState?.internalFundsRequestCashId) {
          // Update existing
          const response = await fetch(
            `${baseUrl}InternalFundsRequestCash/${defaultState.internalFundsRequestCashId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payload,
                internalFundsRequestCashId:
                  defaultState.internalFundsRequestCashId,
                version: defaultState.version,
              }),
            },
          );

          if (!response.ok) {
            throw new Error("Failed to update fund request");
          }

          return await response.json();
        } else {
          // Create new
          const response = await fetch(`${baseUrl}InternalFundsRequestCash`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error("Failed to create fund request");
          }

          return await response.json();
        }
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Fund request${lineItems.length > 1 ? "s" : ""} ${type === "edit" ? "updated" : "created"} successfully`,
      });

      handleAddEdit(lineItems);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${type === "edit" ? "update" : "create"} fund request`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-populate form for edit mode
  useEffect(() => {
    if (type === "edit" && defaultState) {
      setLineItems([
        {
          id: crypto.randomUUID(),
          jobId: defaultState.jobId || null,
          jobNumber: defaultState.jobNumber || "",
          headCoaId: defaultState.headCoaId || null,
          headOfAccount: defaultState.headOfAccount || "",
          beneficiaryCoaId: defaultState.beneficiaryCoaId || null,
          beneficiary: defaultState.beneficiary || "",
          partiesAccount: "",
          requestedAmount: defaultState.requestedAmount || 0,
          approvalStatus: defaultState.approvalStatus || "PENDING",
        },
      ]);
    }
  }, [type, defaultState]);

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            {type === "edit"
              ? "Edit Internal Fund Request"
              : "New Internal Fund Request"}
          </CardTitle>
          <CardDescription>
            Fill in the details for the fund request. You can add multiple line
            items for different expense heads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='border rounded-lg overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='w-12'>S. No.</TableHead>
                    <TableHead className='w-[200px]'>
                      Job No. <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='w-[200px]'>
                      Head of Account <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='w-[200px]'>
                      Beneficiary <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='w-[180px]'>Parties A/C</TableHead>
                    <TableHead className='w-[150px]'>
                      Amount <span className='text-red-500'>*</span>
                    </TableHead>
                    <TableHead className='w-12'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className='text-center font-medium'>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.jobId?.toString() || ""}
                          onValueChange={(value) =>
                            handleJobChange(item.id, value)
                          }
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Job' />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs.map((job) => (
                              <SelectItem
                                key={job.jobId}
                                value={job.jobId.toString()}
                              >
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {job.jobNumber}
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    {job.operationType} - {job.status}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.headCoaId?.toString() || ""}
                          onValueChange={(value) =>
                            handleHeadOfAccountChange(item.id, value)
                          }
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Expense Head' />
                          </SelectTrigger>
                          <SelectContent>
                            {chargesMasters.map((charge) => (
                              <SelectItem
                                key={charge.chargesMasterId}
                                value={charge.chargesMasterId.toString()}
                              >
                                <div className='flex flex-col'>
                                  <span className='font-medium'>
                                    {charge.chargeCode}
                                  </span>
                                  <span className='text-xs text-gray-500'>
                                    {charge.chargeDescription}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.beneficiaryCoaId?.toString() || ""}
                          onValueChange={(value) =>
                            handleBeneficiaryChange(item.id, value)
                          }
                        >
                          <SelectTrigger className='h-9 text-sm'>
                            <SelectValue placeholder='Select Beneficiary' />
                          </SelectTrigger>
                          <SelectContent>
                            {parties
                              .filter((p) => p.beneficiaryFromPurchaseOrder)
                              .map((party) => (
                                <SelectItem
                                  key={party.partyId}
                                  value={party.partyId.toString()}
                                >
                                  <div className='flex flex-col'>
                                    <span className='font-medium'>
                                      {party.partyName}
                                    </span>
                                    <span className='text-xs text-gray-500'>
                                      {party.beneficiaryFromPurchaseOrder}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type='text'
                          value={item.partiesAccount}
                          readOnly
                          className='h-9 text-sm bg-gray-50'
                          placeholder='Auto-filled'
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min='0'
                          step='0.01'
                          value={item.requestedAmount || ""}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "requestedAmount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className='h-9 text-sm'
                          placeholder='0.00'
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeLineItem(item.id)}
                          className='h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50'
                        >
                          <FiTrash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addLineItem}
              className='flex items-center gap-2'
            >
              <FiPlus className='h-4 w-4' />
              Add Line Item
            </Button>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <p className='text-sm font-medium text-blue-900'>
                    Total Line Items: {lineItems.length}
                  </p>
                  <p className='text-xs text-blue-700 mt-1'>
                    Total Requested Amount:{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(
                      lineItems.reduce(
                        (sum, item) => sum + (item.requestedAmount || 0),
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => handleAddEdit(null)}
          disabled={isSubmitting}
        >
          <FiX className='mr-2 h-4 w-4' />
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting || lineItems.length === 0}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {isSubmitting ? (
            <>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              Submitting...
            </>
          ) : (
            <>
              <FiSave className='mr-2 h-4 w-4' />
              {type === "edit" ? "Update Request" : "Submit Request"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
