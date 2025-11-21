"use client";
import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  FileText,
  Ship,
  Package,
  DollarSign,
  Truck,
} from "lucide-react";

// Add props interface
interface JobOrderFormProps {
  onJobCreated?: () => void;
  editMode?: boolean;
  jobData?: any;
}

const JobOrderForm = ({
  onJobCreated,
  editMode = false,
  jobData,
}: JobOrderFormProps) => {
  const [activeTab, setActiveTab] = useState("main");
  const [containers, setContainers] = useState([
    {
      id: 1,
      containerNo: "AAAU-123456-7",
      size: "20ft",
      type: "GP",
      weight: "12000",
      packages: 0,
      packageType: "",
    },
  ]);
  const [lclItems, setLclItems] = useState([
    { id: 1, packages: 0, packageType: "", weight: "0.00" },
  ]);

  // Initialize form data with jobData if in edit mode
  const [formData, setFormData] = useState({
    // Main Form
    scope: { freight: true, clearance: false, transport: false, other: false },
    direction: "Import",
    mode: "Sea",
    shippingType: "FCL",
    load: "Full",
    documentType: "MBL",
    shipper: "ABC Trading Co.",
    consignee: "XYZ Imports Ltd.",
    client: "XYZ Imports Ltd.",
    billingParties: "XYZ Imports Ltd.",

    // Shipping Details
    houseDocNo: "HBL-2025-001",
    masterDocNo: "MBL-2025-001",
    carrier: "Maersk Line",
    grossWeight: "12000",
    netWeight: "11500",
    weightUom: "KG",
    portOfLoading: "Shanghai, China",
    portOfDischarge: "Karachi, Pakistan",
    placeOfDelivery: "Karachi Warehouse",
    vesselName: "MSC OSCAR",
    terminal: "KICT",
    expectedArrival: "2025-11-25",
    igmNo: "IGM-2025-12345",
    indexNo: "1234",
    freeDays: "7",
    till: "2025-12-02",
    freight: "Collect",
    blStatus: "Original",
    originAgent: "Shanghai Freight Forwarders",
    localAgent: "Karachi Logistics",

    // Commercial
    invoiceNo: "INV-2025-5678",
    invoiceDate: "2025-11-01",
    issuedBy: "ABC Trading Co.",
    shippingTerm: "FOB",
    freightCharges: "2500.00",
    lcNo: "LC-2025-9876",
    lcDate: "2025-10-15",
    lcValue: "50000.00",
    currency: "USD",
    fiNo: "FI-2025-4321",
    fiDate: "2025-11-05",
    expiryDate: "2025-12-31",
    hsCode: "8501.1000",
    itemDescription: "Electric Motors",
    origin: "China",
    qty: "100",
    dv: "50000",
    av: "52000",
    declaredValue: "50000.0000",
    assessedValue: "52000.0000",
    total: "52000.0000",
    exchangeRate: "278.5000",
    insuranceAmount: "0.00",
    landing: "1.00",
    gdNo: "GD-2025-7890",
    gdDate: "2025-11-20",
    gdType: "HC",
    collectorRate: "Rate A",

    // Deposit
    transporter: "Fast Movers Transport",
    depositor: "XYZ Imports Ltd.",
    depositAmount: "50000",
    advanceDetention: "2025-12-10",
  });

  const addContainer = () => {
    setContainers([
      ...containers,
      {
        id: containers.length + 1,
        containerNo: "",
        size: "20ft",
        type: "GP",
        weight: "",
        packages: 0,
        packageType: "",
      },
    ]);
  };

  const removeContainer = (id: number) => {
    setContainers(containers.filter((c) => c.id !== id));
  };

  const addLclItem = () => {
    setLclItems([
      ...lclItems,
      { id: lclItems.length + 1, packages: 0, packageType: "", weight: "0.00" },
    ]);
  };

  const removeLclItem = (id: number) => {
    setLclItems(lclItems.filter((i) => i.id !== id));
  };

  const tabs = [
    { id: "main", label: "Main Form", icon: FileText },
    { id: "shipping", label: "Shipping", icon: Ship },
    { id: "commercial", label: "Commercial", icon: Package },
    { id: "deposit", label: "Deposit", icon: DollarSign },
  ];

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Job Order Form
              </h1>
              <p className='text-gray-500 mt-1'>
                SASPAK ERP - Job Management Module
              </p>
            </div>
            <div className='flex gap-3'>
              <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors'>
                <Save size={18} />
                Save Job
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='flex border-b'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Form Tab */}
        {activeTab === "main" && (
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
            {/* Scope Section */}
            <div>
              <h2 className='text-lg font-semibold mb-4 text-gray-900'>
                Scope
              </h2>
              <div className='grid grid-cols-4 gap-4'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.scope.freight}
                    className='w-4 h-4 text-blue-600'
                    onChange={() => {}}
                  />
                  <span className='text-gray-700'>Freight</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.scope.clearance}
                    className='w-4 h-4 text-blue-600'
                    onChange={() => {}}
                  />
                  <span className='text-gray-700'>Clearance</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.scope.transport}
                    className='w-4 h-4 text-blue-600'
                    onChange={() => {}}
                  />
                  <span className='text-gray-700'>Transport</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.scope.other}
                    className='w-4 h-4 text-blue-600'
                    onChange={() => {}}
                  />
                  <span className='text-gray-700'>Other</span>
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Direction
                </label>
                <select
                  value={formData.direction}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Import</option>
                  <option>Export</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Mode
                </label>
                <select
                  value={formData.mode}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Sea</option>
                  <option>Air</option>
                  <option>Road</option>
                  <option>Land</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Shipping Type
                </label>
                <select
                  value={formData.shippingType}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>FCL</option>
                  <option>LCL</option>
                  <option>BB</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Load
                </label>
                <select
                  value={formData.load}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Full</option>
                  <option>Part</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Document Type
                </label>
                <select
                  value={formData.documentType}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>MBL</option>
                  <option>HBL</option>
                  <option>MAWB</option>
                  <option>HAWB</option>
                </select>
              </div>
            </div>

            {/* Parties */}
            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Shipper
                </label>
                <select
                  value={formData.shipper}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>ABC Trading Co.</option>
                  <option>Global Exports Inc.</option>
                  <option>Prime Shippers Ltd.</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Consignee
                </label>
                <select
                  value={formData.consignee}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>XYZ Imports Ltd.</option>
                  <option>National Traders</option>
                  <option>Metro Importers</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Client
                </label>
                <select
                  value={formData.client}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>XYZ Imports Ltd.</option>
                  <option>National Traders</option>
                  <option>Metro Importers</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Billing Parties
                </label>
                <input
                  type='text'
                  value={formData.billingParties}
                  readOnly
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
                />
              </div>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === "shipping" && (
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
            {/* Document Numbers */}
            <div className='grid grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  House Document No.
                </label>
                <input
                  type='text'
                  value={formData.houseDocNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value='2025-11-10'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Origin Agent
                </label>
                <input
                  type='text'
                  value={formData.originAgent}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Master Document No.
                </label>
                <input
                  type='text'
                  value={formData.masterDocNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value='2025-11-10'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Local Agent
                </label>
                <input
                  type='text'
                  value={formData.localAgent}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Carrier
                </label>
                <input
                  type='text'
                  value={formData.carrier}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Free Days
                </label>
                <input
                  type='text'
                  value={formData.freeDays}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Till
                </label>
                <input
                  type='date'
                  value={formData.till}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Weight & Ports */}
            <div className='grid grid-cols-4 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Gross Weight
                </label>
                <input
                  type='text'
                  value={formData.grossWeight}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  UOM
                </label>
                <select
                  value={formData.weightUom}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>KG</option>
                  <option>TON</option>
                  <option>LBS</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Net Weight
                </label>
                <input
                  type='text'
                  value={formData.netWeight}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  UOM
                </label>
                <select
                  value={formData.weightUom}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>KG</option>
                  <option>TON</option>
                  <option>LBS</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Port of Loading
                </label>
                <input
                  type='text'
                  value={formData.portOfLoading}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Port of Discharge
                </label>
                <input
                  type='text'
                  value={formData.portOfDischarge}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Place of Delivery
                </label>
                <input
                  type='text'
                  value={formData.placeOfDelivery}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Vessel Info */}
            <div className='grid grid-cols-4 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Vessel Name
                </label>
                <input
                  type='text'
                  value={formData.vesselName}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Terminal
                </label>
                <input
                  type='text'
                  value={formData.terminal}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Expected Arrival Date
                </label>
                <input
                  type='date'
                  value={formData.expectedArrival}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  IGM No.
                </label>
                <input
                  type='text'
                  value={formData.igmNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Free Days
                </label>
                <input
                  type='text'
                  value={formData.freeDays}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Till
                </label>
                <input
                  type='date'
                  value={formData.till}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Freight
                </label>
                <select
                  value={formData.freight}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Collect</option>
                  <option>Prepaid</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Index No.
                </label>
                <input
                  type='text'
                  value={formData.indexNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  BL Status
                </label>
                <select
                  value={formData.blStatus}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Original</option>
                  <option>SG</option>
                  <option>Telex</option>
                </select>
              </div>
            </div>

            {/* FCL Container Section */}
            <div className='border-t pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  FCL - Container Details
                </h3>
                <button
                  onClick={addContainer}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2'
                >
                  <Plus size={18} />
                  Add Container
                </button>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Container No.
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Size
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Type
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Weight
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        No. of Packages
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Package Type
                      </th>
                      <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {containers.map((container) => (
                      <tr key={container.id}>
                        <td className='px-4 py-3'>
                          <input
                            type='text'
                            value={container.containerNo}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <select
                            value={container.size}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option>20ft</option>
                            <option>40ft</option>
                            <option>40ft HC</option>
                          </select>
                        </td>
                        <td className='px-4 py-3'>
                          <select
                            value={container.type}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option>GP</option>
                            <option>HC</option>
                            <option>RF</option>
                            <option>OT</option>
                            <option>FR</option>
                          </select>
                        </td>
                        <td className='px-4 py-3'>
                          <input
                            type='text'
                            value={container.weight}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <input
                            type='number'
                            value={container.packages}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <select
                            value={container.packageType}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option value=''>Select</option>
                            <option>Cartons</option>
                            <option>Pallets</option>
                            <option>Bags</option>
                            <option>Drums</option>
                          </select>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <button
                            onClick={() => removeContainer(container.id)}
                            className='text-red-600 hover:text-red-800'
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LCL/Air Section */}
            <div className='border-t pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  LCL/Air - Package Details
                </h3>
                <button
                  onClick={addLclItem}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2'
                >
                  <Plus size={18} />
                  Add Item
                </button>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        No. of Packages (Qty)
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Package Type
                      </th>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        Weight
                      </th>
                      <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {lclItems.map((item) => (
                      <tr key={item.id}>
                        <td className='px-4 py-3'>
                          <input
                            type='number'
                            value={item.packages}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <select
                            value={item.packageType}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          >
                            <option value=''>Select</option>
                            <option>Cartons</option>
                            <option>Pallets</option>
                            <option>Bags</option>
                            <option>Drums</option>
                          </select>
                        </td>
                        <td className='px-4 py-3'>
                          <input
                            type='text'
                            value={item.weight}
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          />
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <button
                            onClick={() => removeLclItem(item.id)}
                            className='text-red-600 hover:text-red-800'
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load Type & Dangerous Goods */}
            <div className='border-t pt-6'>
              <div className='grid grid-cols-3 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    LCL/Air Load Type
                  </label>
                  <select className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                    <option>Suzuki</option>
                    <option>Mazda</option>
                    <option>Truck</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Chargeable Weight (Air Only)
                  </label>
                  <input
                    type='text'
                    placeholder='Only in case of Air'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Dangerous Goods (IsDG)
                  </label>
                  <select className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Tab */}
        {activeTab === "commercial" && (
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
            {/* Invoice Details */}
            <div className='grid grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Invoice No. (+)
                </label>
                <input
                  type='text'
                  value={formData.invoiceNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value={formData.invoiceDate}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Issued By
                </label>
                <input
                  type='text'
                  value={formData.issuedBy}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Shipping Term
                </label>
                <select
                  value={formData.shippingTerm}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>FOB</option>
                  <option>EXW</option>
                  <option>DDP</option>
                  <option>DDU</option>
                  <option>CFR</option>
                </select>
              </div>
              <div className='col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Freight Charges
                </label>
                <input
                  type='text'
                  value={formData.freightCharges}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* LC Details */}
            <div className='grid grid-cols-3 gap-6 border-t pt-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  LC No.
                </label>
                <input
                  type='text'
                  value={formData.lcNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value={formData.lcDate}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Issued By
                </label>
                <input
                  type='text'
                  value={formData.issuedBy}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  LC Value
                </label>
                <input
                  type='text'
                  value={formData.lcValue}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Currency
                </label>
                <select
                  value={formData.currency}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>USD</option>
                  <option>AED</option>
                  <option>EUR</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  FI No.
                </label>
                <input
                  type='text'
                  value={formData.fiNo}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date
                </label>
                <input
                  type='date'
                  value={formData.fiDate}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Expiry Date
                </label>
                <input
                  type='date'
                  value={formData.expiryDate}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* HS Code & Item Details */}
            <div className='border-t pt-6'>
              <div className='bg-blue-50 p-4 rounded-lg mb-4'>
                <div className='grid grid-cols-7 gap-4 items-end'>
                  <div className='col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      HS Code (9 Char)
                    </label>
                    <input
                      type='text'
                      value={formData.hsCode}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div className='col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Item Description
                    </label>
                    <input
                      type='text'
                      value={formData.itemDescription}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Origin (15 Char)
                    </label>
                    <input
                      type='text'
                      value={formData.origin}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Qty
                    </label>
                    <input
                      type='text'
                      value={formData.qty}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      DV
                    </label>
                    <input
                      type='text'
                      value={formData.dv}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>
                <div className='mt-3'>
                  <button className='text-blue-600 hover:text-blue-800 font-medium text-sm'>
                    Search by HSCode and Item Description
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Country Name
                  </label>
                  <input
                    type='text'
                    value='China'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-white'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Declared Value
                  </label>
                  <input
                    type='text'
                    value={formData.declaredValue}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-white'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Assessed Value
                  </label>
                  <input
                    type='text'
                    value={formData.assessedValue}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-white'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    AV
                  </label>
                  <input
                    type='text'
                    value={formData.av}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-white'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Total
                  </label>
                  <input
                    type='text'
                    value={formData.total}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-white'
                  />
                </div>
              </div>
            </div>

            {/* Exchange & Other Details */}
            <div className='grid grid-cols-3 gap-6 border-t pt-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Exchange Rate
                </label>
                <input
                  type='text'
                  value={formData.exchangeRate}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Insurance Amount/%
                </label>
                <input
                  type='text'
                  value={formData.insuranceAmount}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Landing (Val in %)
                </label>
                <input
                  type='text'
                  value={formData.landing}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* GD Details */}
            <div className='bg-yellow-50 p-4 rounded-lg border-t'>
              <div className='grid grid-cols-4 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    GD No.
                  </label>
                  <input
                    type='text'
                    value={formData.gdNo}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date
                  </label>
                  <input
                    type='date'
                    value={formData.gdDate}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Type
                  </label>
                  <select
                    value={formData.gdType}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option>HC</option>
                    <option>IB</option>
                    <option>EB</option>
                    <option>TI</option>
                    <option>SB</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Collector Rate
                  </label>
                  <select
                    value={formData.collectorRate}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option>Rate A</option>
                    <option>Rate B</option>
                    <option>Rate C</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === "deposit" && (
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Transporter
                </label>
                <select
                  value={formData.transporter}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>Fast Movers Transport</option>
                  <option>Quick Logistics</option>
                  <option>Express Cargo</option>
                </select>
                <p className='text-sm text-gray-500 mt-1'>From Master Data</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Depositor
                </label>
                <select
                  value={formData.depositor}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option>XYZ Imports Ltd.</option>
                  <option>ABC Trading Co.</option>
                  <option>Fast Movers Transport</option>
                </select>
                <p className='text-sm text-gray-500 mt-1'>
                  Consignee / Transporter / Agent
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Deposit Amount
                </label>
                <input
                  type='text'
                  value={formData.depositAmount}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Advance Detention - Paid Upto
                </label>
                <input
                  type='date'
                  value={formData.advanceDetention}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            <div className='border-t pt-6'>
              <div className='bg-blue-50 p-6 rounded-lg'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Deposit Summary
                </h3>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='bg-white p-4 rounded-lg shadow-sm'>
                    <p className='text-sm text-gray-600 mb-1'>
                      Total Deposit Amount
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>
                      PKR 50,000
                    </p>
                  </div>
                  <div className='bg-white p-4 rounded-lg shadow-sm'>
                    <p className='text-sm text-gray-600 mb-1'>Paid Until</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      2025-12-10
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='border-t pt-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Additional Notes
              </h3>
              <textarea
                rows={4}
                placeholder='Enter any additional notes about deposits, refunds, or special arrangements...'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              ></textarea>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='bg-white rounded-lg shadow-sm p-6 flex justify-between items-center'>
          <button className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'>
            Cancel
          </button>
          <div className='flex gap-3'>
            <button className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'>
              Save as Draft
            </button>
            <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors'>
              <Save size={18} />
              Save & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobOrderForm;
