import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Bill, BillItem } from '@/hooks/use-bills';

interface PrintBillButtonProps {
  bill: Bill;
  triggerPrint?: boolean;
  onPrint?: () => void;
}

// Helper function to get items array from bill.items which might be an object or array
const getItemsArray = (items: any): BillItem[] => {
  if (!items) return [];
  
  // If items is already an array, return it
  if (Array.isArray(items)) return items;
  
  // If items is an object but contains an array (common when stored as JSON)
  if (typeof items === 'object') {
    // Look for numeric keys which would indicate it's an array-like object
    const numericKeys = Object.keys(items).filter(key => !isNaN(Number(key)));
    if (numericKeys.length > 0) {
      return numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .map(key => items[key]);
    }
    
    // Check if the object has properties that match BillItem structure
    if (!items._meta && items.name && typeof items.quantity === 'number') {
      return [items];
    }
  }
  
  // Return empty array as fallback
  return [];
};

const getGstPercentage = (bill: Bill, type: 'sgst' | 'cgst' | 'igst'): number => {
  
  // First, try to get GST percentages directly from the bill object
  const billAsAny = bill as any;
  if (type === 'sgst' && billAsAny.sgstPercentage !== undefined) {
    return parseFloat(billAsAny.sgstPercentage);
  }
  if (type === 'cgst' && billAsAny.cgstPercentage !== undefined) {
    return parseFloat(billAsAny.cgstPercentage);
  }
  if (type === 'igst' && billAsAny.igstPercentage !== undefined) {
    return parseFloat(billAsAny.igstPercentage);
  }

  try {
    // Fallback: Try to get GST percentages from items._meta
    if (bill.items && typeof bill.items === 'object') {
      const items = bill.items as any;
      if (items._meta) {
        // Use specific percentages if available
        if (type === 'sgst' && items._meta.sgstPercentage !== undefined) {
          return parseFloat(items._meta.sgstPercentage);
        }
        if (type === 'cgst' && items._meta.cgstPercentage !== undefined) {
          return parseFloat(items._meta.cgstPercentage);
        }
        if (type === 'igst' && items._meta.igstPercentage !== undefined) {
          return parseFloat(items._meta.igstPercentage);
        }
      }
    }
  } catch (error) {
    console.error('Error parsing GST percentage:', error);
  }
  
  // Final fallback to default logic if no percentages are available
  switch (type) {
    case 'sgst':
      return bill.customerState === 'Maharashtra' ? 9 : 0;
    case 'cgst':
      return bill.customerState === 'Maharashtra' ? 9 : 0;
    case 'igst':
      return bill.customerState !== 'Maharashtra' ? 18 : 0;
    default:
      return 0;
  }
};

const generateGstBillHtml = (bill: Bill) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>GST Bill - ${bill.billNumber || "Invoice"}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0;
          box-sizing: border-box;
          background-color: white;
        }
        .bill-container { 
          width: 210mm;
          height: 270mm;
          margin: 0 auto;
          padding: 10mm;
          box-sizing: border-box;
          position: relative;
          border: 1px solid #ccc;
        }
        .bill-header { 
          position: relative;
          margin-bottom: 5px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        .company-logo {
          position: absolute;
          left: 0;
          top: 0;
          width: 64px;
          height: 64px;
        }
        .company-logo img {
          width: 100%;
          height: 100%;
        }        .contact-details {
          position: absolute;
          right: 0;
          top: 5px;
          font-size: 16px;
          text-align: right;
          line-height: 1.3;
          font-weight: bold;
        }.invoice-box-top {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: fit-content;
          z-index: 10;
        }        .invoice-label-top {
          text-align: center;
          font-weight: bold;
          margin: 0 auto;
          width: fit-content;
          background-color: #0B5394;
          color: white;
          padding: 4px 10px;
          font-size: 16px;
          border-radius: 15px;
          display: block;
        }
        .invoice-jurisdiction-top {
          text-align: center;
          font-size: 13px;
          margin: 2px 0 0 0;
          padding: 0;
          display: block;
          color: #0B5394;
        }
        .bill-title { 
          color: #cc0000; 
          font-size: 36px; 
          font-weight: bold; 
          margin: 0;
          text-align: center;
          padding-top: 50px;
          letter-spacing: 1px;
        }
        .bill-address {
          margin: 3px 0;
          font-size: 16px; 
          text-align: center;
          font-weight: bold;
          padding: 0;
          color: #0B5394;
        }
        .bill-gstin {
          margin: 0;
          font-size: 14px;
          text-align: center;
          padding-bottom: 2px;
          font-weight: bold;
          color: #7B241C;
        }
        .bill-info { 
          display: flex; 
          width: 100%; 
          margin-top: 5px;
          margin-bottom: 5px;
          border: 1px solid #000;
          border-collapse: collapse;
        }
        .bill-info-left {
          flex: 1;
          padding: 0;
          border-right: 1px solid #000;
          vertical-align: top;
        }
        .bill-info-right {
          flex: 1;
          padding: 0;
          vertical-align: top;
        }
        .field-row {
          position: relative;
          border-bottom: 1px solid #000;
          min-height: 20px;
          padding: 2px 2px;
        }        .field-label {
          display: inline-block;
          font-weight: normal;
          font-size: 13px;
          color: #000080;
          vertical-align: top;
          margin-left: 2px;
          margin-right: 2px;
        }
        .field-value {
          display: inline-block;
          font-size: 13px;
          margin-left: 2px;
        }
        .no-border {
          border-bottom: none;
        }
        .bill-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 5px;
          border: 1px solid #000;
        }        .bill-table th, .bill-table td { 
          border: 1px solid #000; 
          padding: 2px; 
          text-align: center;
          font-size: 13px;
          height: 24px;
        }
        .bill-table th { 
          background-color: white;
          text-align: center;
          color: #000080;
          font-size: 13px;
          font-weight: normal;
          height: 22px;
          padding: 2px;
        }
        .sr-column {
          width: 5%;
        }
        .particulars-column {
          width: 45%;
          text-align: center !important;
        }
        .hsn-column {
          width: 10%;
        }
        .qty-column {
          width: 10%;
        }
        .rate-column {
          width: 15%;
        }
        .amount-column {
          width: 15%;
        }
        .empty-row td {
          height: 22px;
          border: 1px solid #000;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
        }
        .totals-table td {
          border: 1px solid #000;
          padding: 2px;
          text-align: right;
          font-size: 11px;
          height: 22px;
        }
        .totals-table .label {
          width: 85%;
        }        .totals-table .value {
          width: 15%;
        }        .bank-details {
          margin-top: 10px;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #ddd;
          padding-top: 8px;
          position: relative;
        }
        .account-details {
          width: 25%;
          text-align: left;
          font-size: 11px;
        }        
        .certification-text {
          width: 50%;
          font-size: 10px;
          text-align: justify;
        }
        
        .company-name-right {
          text-align: right;
          font-size: 11px;
          color: #7B241C;
          font-weight: bold;
        }
        .signature-area {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        .signature-box {
          width: 33%;
          font-size: 11px;
        }
        .customer-sign {
          text-align: left;
        }
        .center-sign {
          text-align: center;
        }
        .auth-sign {
          text-align: right;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .bill-container { 
            width: 100%;
            border: none;
            padding: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="bill-header">
          <div class="company-logo">
            <img src="/assets/logo.png" width="60" height="60" alt="Omkar Gold Covering Logo" />
          </div>
          <div class="invoice-box-top">
            <p class="invoice-label-top">GST INVOICE</p>
            <p class="invoice-jurisdiction-top">Subject To Thane Jurisdiction</p>
          </div>
          <div class="contact-details">
            Kanchan : 9699233831<br>
            Office : 9702833831
          </div>
          <h1 class="bill-title">OMKAR GOLD COVERING</h1>
          <p class="bill-address">A-101,102 NAGEE PALACE CHS LTD NAGEE PALACE NAVGHAR ROAD SAIBABA NAGAR BHAINDER EAST THANE 401105</p>
          <p class="bill-gstin">GSTIN : 27AZNPG8654N1Z1</p>
        </div>
        
        <div class="bill-info">
          <div class="bill-info-left">
            <div class="field-row">
              <span class="field-label">Name</span>
              <span class="field-value">${bill.customerName || ""}</span>
            </div>
            <div class="field-row">
              <span class="field-label">Address</span>
              <span class="field-value">${bill.customerAddress || ""}</span>
            </div>
            <div class="field-row">
              <span class="field-label">State</span>
              <span class="field-value">${bill.customerState || ""}</span>
            </div>
            <div class="field-row no-border">
              <span class="field-label">GSTIN No.</span>
              <span class="field-value">${bill.customerGSTIN || ""}</span>
            </div>
          </div>
          <div class="bill-info-right">
            <div class="field-row">
              <span class="field-label">Invoice No.</span>
              <span class="field-value">${bill.billNumber || ""}</span>
              <span class="field-label" style="margin-left: 20px;">Date</span>
              <span class="field-value">${new Date(bill.date || new Date()).toLocaleDateString('en-IN', { 
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
            <div class="field-row">
              <span class="field-label">Transportation Mode</span>
              <span class="field-value">${bill.transportMode || ""}</span>
            </div>
            <div class="field-row">
              <span class="field-label">Vehicle No.</span>
              <span class="field-value">${bill.vehicleNo || ""}</span>
            </div>
            <div class="field-row">
              <span class="field-label">Date & Time of Supply</span>
              <span class="field-value">${bill.dateOfSupply ? new Date(bill.dateOfSupply).toLocaleDateString('en-IN', { 
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : ""} ${bill.timeOfSupply || ""}</span>
            </div>
            <div class="field-row">
              <span class="field-label">Place of Supply</span>
              <span class="field-value">${bill.placeOfSupply || ""}</span>
            </div>
            <div class="field-row no-border">
              <span class="field-label">Tax is payable on Reverse Charge</span>
              <span class="field-value">${bill.isTaxable ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
        
        <table class="bill-table">
          <thead>
            <tr>
              <th class="sr-column">S.<br>No.</th>
              <th class="particulars-column">PARTICULARS</th>
              <th class="hsn-column">HSN<br>Code</th>
              <th class="qty-column">Qty.</th>
              <th class="rate-column">RATE</th>
              <th class="amount-column">AMOUNT<br>Rs.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;P.</th>
            </tr>
          </thead>
          <tbody>
            ${getItemsArray(bill.items).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="particulars-column" style="text-align:left;padding-left:5px;">${item.name}</td>
                <td>${item.hsn}</td>
                <td>${item.quantity}</td>
                <td>${item.rate?.toFixed(2)}</td>
                <td>${item.amount?.toFixed(2)}</td>
              </tr>
            `).join('')}
            ${Array(12 - Math.min(12, getItemsArray(bill.items).length)).fill(0).map(() => `
              <tr class="empty-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
          <table class="totals-table">
          <tr>
            <td class="label">TOTAL</td>
            <td class="value">${getItemsArray(bill.items).reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</td>
          </tr>          ${bill.isTaxable ? `
          <tr>
            <td class="label">SGST${getGstPercentage(bill, 'sgst') > 0 ? ` ( ${getGstPercentage(bill, 'sgst')}%)` : ""}</td>
            <td class="value">${bill.sgst ? bill.sgst.toFixed(2) : "0.00"}</td>
          </tr>
          <tr>
            <td class="label">CGST${getGstPercentage(bill, 'cgst') > 0 ? ` ( ${getGstPercentage(bill, 'cgst')}%)` : ""}</td>
            <td class="value">${bill.cgst ? bill.cgst.toFixed(2) : "0.00"}</td>
          </tr>
          <tr>
            <td class="label">IGST${getGstPercentage(bill, 'igst') > 0 ? ` ( ${getGstPercentage(bill, 'igst')}%)` : ""}</td>
            <td class="value">${bill.igst ? bill.igst.toFixed(2) : "0.00"}</td>
          </tr>
          ` : ""}
          <tr>
            <td class="label">G. TOTAL</td>
            <td class="value">${bill.totalAmount?.toFixed(2)}</td>
          </tr>
        </table>
          <div class="bank-details">
          <div class="account-details">
            <p>A/c. No.: 917020061582687<br>IFSC CODE : UTIB0001842</p>
          </div>
          <div class="certification-text">
            <p>We hereby certify that original registration certificate under the CGST Act, 2017 is in force on the date on which the tax has been paid/payable by/to us on the goods specified in the Tax invoice & made as per the particulars given above.</p>
            <div class="company-name-right">
            <p>For OMKAR GOLD COVERING</p>
            </div>
          </div>
        </div>
        
        <div class="signature-area">
          <div class="signature-box customer-sign">
            <p>Customer Sign</p>
          </div>
          <div class="signature-box center-sign">
            <p>E. & O.E.<br>Thank You !</p>
          </div>
          <div class="signature-box auth-sign">
            <p>Auth. Sign</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;
};

const generateNonGstBillHtml = (bill: Bill) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${bill.billNumber || "Manual Bill"}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0;
          box-sizing: border-box;
          background-color: white;
        }        .bill-container { 
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 3mm;
          box-sizing: border-box;
          position: relative;
          border: 1px solid #ccc;
          opacity: 1;
        }
        .bill-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/assets/bg.png');
          background-size: 100% 100%;
          background-position: top center;
          background-repeat: no-repeat;
          opacity: 0.03;
          z-index: -1;
        }        .bill-header { 
          position: relative;
          margin-bottom: 5px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }.company-logo {
          position: absolute;
          left: 0;
          top: 0;
          width: 72px;
          height: 72px;
        }        .om-sai-ram {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #cc0000;
          color: white;
          padding: 6px 20px;
          border-radius: 15px;
          font-weight: bold;
          font-size: 18px;
        }        .bill-title { 
          color: #cc0000; 
          font-size: 32px; 
          font-weight: bold; 
          margin: 0;
          text-align: center;
          padding-top: 40px;
          margin-bottom: 8px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .bill-address {
          margin: 6px 0;
          font-size: 18px; 
          text-align: center;
          line-height: 1.8;
          font-weight: 600;
          padding: 0 15px;
        }
        .bill-specialty {
          margin: 6px 0;
          font-size: 14px;
          text-align: center;
          font-weight: bold;
          padding-bottom: 5px;
        }
        .contact-details {
          position: absolute;
          right: 0;
          top: 5px;
          font-size: 15px;
          text-align: right;
          line-height: 1.6;
          font-weight: 600;
          padding: 5px 0;
        }.bill-form {
          border: 1px solid #000;
          padding: 4px;
          margin-top: 3px;
          margin-bottom: 3px;
        }
        .buyer-row {
          display: flex;
          margin-bottom: 4px;
        }
        .bill-row {
          display: flex;
          margin-bottom: 0;
          justify-content: space-between;
        }        .bill-label {
          font-weight: bold;
          margin-right: 6px;
          font-size: 15px;
        }
        .bill-value {
          flex: 1;
          border-bottom: 1px solid #000;
          font-size: 15px;
          min-height: 20px;
          padding: 2px 0;
        }
        .bill-inline {
          display: inline-block;
        }
        .bill-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 3px;
          border: 1px solid #000;
        }        .bill-table th, .bill-table td {
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          padding: 2px 4px;
          text-align: center;
          font-size: 14px;
          height: 22px;
        }
        .bill-table thead {
          border-bottom: 1px solid #000;
        }        .bill-table th {
          font-weight: normal;
          padding: 3px 6px;
          font-size: 14px;
        }
        .bill-table .subheader-row th {
          border-top: 1px solid #000;
        }        .bill-table .particulars-col {
          width: 50%;
          text-align: left;
          padding-left: 6px;
          font-size: 14px;
        }
        .bill-table .qty-col,
        .bill-table .rate-col {
          width: 10%;
          font-size: 14px;
        }
        .bill-table .amount-col {
          width: 30%;
          font-size: 14px;
        }
        .amount-col-rs {
          width: 15%;
          font-size: 14px;
        }
        .amount-col-p {
          width: 15%;
          font-size: 14px;
        }
        .empty-row td {
          height: 22px;
        }        .total-row {
          font-weight: bold;
          border-top: 1px solid #000;
          font-size: 15px;
        }
        .total-row td {
          padding-top: 4px;
          font-size: 15px;
        }        .bank-details {
          margin-top: 5px;
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #ddd;
          padding-top: 5px;
        }
        .account-details {
          width: 20%;
          text-align: left;
          font-size: 11px;
        }
        .certification-text {
          width: 60%;
          text-align: center;
          font-size: 10px;
        }
        .company-name-right {
          text-align: right;
          font-size: 11px;
          color: #7B241C;
          font-weight: bold;
        }
        .signature-area {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        .signature-box {
          width: 33%;
          font-size: 11px;
        }
        .customer-sign {
          text-align: left;
        }
        .center-sign {
          text-align: center;
        }
        .auth-sign {
          text-align: right;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .bill-container { 
            width: 100%;
            height: 100vh;
            border: none;
            padding: 4mm;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="bill-header">          <div class="company-logo">
            <img src="/assets/logo.png" width="72" height="72" alt="Omkar Gold Covering Logo" />
          </div>
          <div class="om-sai-ram">OM SAI RAM</div>
          <div class="contact-details">
            Kanchan : 9699233831<br>
            Office : 9702833831
          </div>
          <h1 class="bill-title">OMKAR GOLD COVERING</h1>
          <p class="bill-address">A-101,102 NAGEE PALACE CHS LTD NAGEE PALACE NAVGHAR ROAD SAIBABA NAGAR BHAINDER EAST THANE 401105</p>
          <p class="bill-specialty">All Types of Imitation Jewellery Specialist In : Necklaces</p>
        </div>
        
        <div class="bill-form">
          <div class="buyer-row">
            <div class="bill-label">Buyer's Name :</div>
            <div class="bill-value">${bill.customerName || ""}</div>
          </div>          <div class="bill-row">            <div class="bill-inline">
              <span class="bill-label">No. :</span>
              <span class="bill-value" style="min-width: 90px; display: inline-block; padding: 2px 6px; font-size: 15px;">${bill.billNumber || ""}</span>
            </div>
            <div class="bill-inline">
              <span class="bill-label">Date :</span>
              <span class="bill-value" style="min-width: 130px; display: inline-block; padding: 2px 6px; font-size: 15px;">
                ${new Date(bill.date || new Date()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
        
        <table class="bill-table">
          <thead>            <tr>
              <th>Sr.<br>No.</th>
              <th class="particulars-col">Particulars</th>
              <th class="qty-col">Qty</th>
              <th class="rate-col">Rate</th>
              <th class="amount-col" colspan="2">Amount</th>
            </tr>
            <tr class="subheader-row">
              <th colspan="4"></th>
              <th class="amount-col-rs">Rs.</th>
              <th class="amount-col-p">P.</th>
            </tr>
          </thead>
          <tbody>
            ${getItemsArray(bill.items).map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="particulars-col">${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.rate?.toFixed(2)}</td>
                <td>${Math.floor(item.amount || 0)}</td>
                <td>${(((item.amount || 0) % 1) * 100).toFixed(0).padStart(2, '0')}</td>
              </tr>
            `).join('')}
            ${Array(Math.max(0, 25 - getItemsArray(bill.items).length)).fill(0).map(() => `
              <tr class="empty-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><b>TOTAL</b></td>
              <td>${Math.floor(bill.totalAmount || 0)}</td>
              <td>${(((bill.totalAmount || 0) % 1) * 100).toFixed(0).padStart(2, '0')}</td>
            </tr>
          </tbody>
        </table>
          <div class="bank-details">
          <div class="account-details">
            <p>A/c. No.: 917020061582687<br>IFSC CODE : UTIB0001842</p>
          </div>
          <div class="certification-text">
            <p>We hereby certify that original registration certificate under the CGST Act, 2017 is in force on the date on which the tax has been paid/payable by/to us on the goods specified in the Tax invoice & made as per the particulars given above.</p>
          </div>
          <div class="company-name-right">
            <p>For OMKAR GOLD COVERING</p>
          </div>
        </div>
        
        <div class="signature-area">
          <div class="signature-box customer-sign">
            <p>Customer Sign</p>
          </div>
          <div class="signature-box center-sign">
            <p>E. & O.E.<br>Thank You !</p>
          </div>
          <div class="signature-box auth-sign">
            <p>Auth. Sign</p>
          </div>
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Define bill HTML generation function that calls the appropriate template
const generateBillHtml = (bill: Bill) => {
  return bill.billType === "GST" 
    ? generateGstBillHtml(bill)
    : generateNonGstBillHtml(bill);
};

// Define the component AFTER all the helper functions
export function PrintBillButton({ bill, triggerPrint = false, onPrint }: PrintBillButtonProps) {
  const handlePrint = useCallback(() => {
    const billHtml = generateBillHtml(bill);
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(billHtml);
      printWin.document.close();
      printWin.focus();
      
      if (onPrint) {
        onPrint();
      }
    }
  }, [bill, onPrint]);

  React.useEffect(() => {
    if (triggerPrint) {
      handlePrint();
    }
  }, [triggerPrint, bill.id, handlePrint]);
  
  if (triggerPrint) {
    return (
      <span onClick={handlePrint}>Print Bill</span>
    );
  }
  
  return (
    <Button onClick={handlePrint} variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
      <Printer className="h-4 w-4 mr-1" />
      Print Bill
    </Button>
  );
}
