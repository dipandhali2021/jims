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
  if (!bill.isTaxable) return 0;
  
  try {
    // Try to get GST percentages from items._meta
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
  
  // Fall back to default logic if _meta is not available
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

// Define bill generation functions first before they're used
const generateGstBillHtml = (bill: Bill) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bill - ${bill.billNumber || "Manual Bill"}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5mm; 
            box-sizing: border-box;
          }
          .bill-container { 
            width: 210mm; 
            margin: 0 auto;
            border: 1px solid #99b;
            padding: 5mm;
            box-sizing: border-box;
          }
          .bill-header { 
            position: relative;
            margin-bottom: 5px; 
            padding-bottom: 5px;
            height: 90px;
          }
          .company-logo {
            position: absolute;
            left: 5px;
            top: 5px;
            width: 50px;
          }
          .bill-title { 
            color: #d00000; 
            font-size: 26px; 
            font-weight: bold; 
            margin: 0;
            text-align: center;
            padding-top: 10px;
            letter-spacing: 1px;
          }
          .bill-address {
            margin: 2px 0;
            font-size: 11px; 
            text-align: center;
            padding: 1px 0;
          }
          .contact-details {
            position: absolute;
            right: 5px;
            top: 0px;
            font-size: 11px;
            text-align: right;
            line-height: 1.5;
          }
          .bill-gstin {
            margin: 0;
            font-size: 11px;
            text-align: center;
            padding-bottom: 0;
          }
          .invoice-box {
            width: 100%;
            margin-top: 0;
          }
          .invoice-label {
            text-align: center;
            font-weight: bold;
            margin: 0;
            background-color: #000080;
            color: white;
            padding: 3px 0;
            font-size: 13px;
          }
          .invoice-jurisdiction {
            text-align: center;
            font-size: 10px;
            margin: 0;
            padding: 1px 0;
            border-bottom: 1px solid #99b;
          }
          .bill-info { 
            display: flex; 
            width: 100%; 
            margin-top: 2px;
            margin-bottom: 0;
            border: 1px solid #99b;
            border-collapse: collapse;
          }
          .bill-info-left {
            flex: 1;
            padding: 0;
            border-right: 1px solid #99b;
            vertical-align: top;
          }
          .bill-info-right {
            flex: 1;
            padding: 0;
            vertical-align: top;
          }
          .field-row {
            position: relative;
            border-bottom: 1px solid #99b;
            min-height: 20px;
            padding: 3px 8px;
          }
          .field-label {
            display: inline-block;
            font-weight: normal;
            font-size: 11px;
            color: #006;
            vertical-align: top;
          }
          .field-value {
            display: inline-block;
            font-size: 11px;
            margin-left: 5px;
          }
          .no-border {
            border-bottom: none;
          }
          .bill-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 0;
          }
          .bill-table th, .bill-table td { 
            border: 1px solid #99b; 
            padding: 3px; 
            text-align: center;
            font-size: 11px;
            height: 22px;
          }
          .bill-table th { 
            background-color: white;
            text-align: center;
            color: #006;
            font-size: 11px;
            height: 30px;
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
            border: 1px solid #99b;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-table td {
            border: 1px solid #99b;
            padding: 5px;
            text-align: right;
            font-size: 11px;
            height: 20px;
          }
          .totals-table .label {
            width: 85%;
          }
          .totals-table .value {
            width: 15%;
          }
          .bank-details {
            margin-top: 10px;
            font-size: 11px;
          }
          .signature-area {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .customer-sign {
            text-align: left;
          }
          .auth-sign {
            text-align: right;
          }
          .note {
            margin-top: 10px;
            font-size: 10px;
            text-align: right;
            font-style: italic;
          }
          .footer-thanks {
            font-size: 12px;
            text-align: center;
            margin-top: 10px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .bill-container { 
              width: 100%;
              border: none;
              padding: 5mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="bill-header">
            <div class="company-logo">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="23" fill="white" stroke="#d00000" stroke-width="1.5"/>
                <path d="M15,17 Q25,10 35,17 Q35,32 25,40 Q15,32 15,17" fill="white" stroke="#d00000" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="contact-details">
              Kanchan : 9699233831<br>
              Office : 9702033831
            </div>
            <h1 class="bill-title">OMKAR GOLD COVERING</h1>
            <p class="bill-address">Room No. C-7, Mamta Industrial Estate, Navghar Road, Near Sri Ram Jewellers, Bhayander (E), Thane - 401105.</p>
            <p class="bill-gstin">GSTIN : 27AZNPG8654N1Z1</p>
          </div>
          
          <div class="invoice-box">
            <p class="invoice-label">GST INVOICE</p>
            <p class="invoice-jurisdiction">Subject To Thane Jurisdiction</p>
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
                  <td class="particulars-column" style="text-align:left;padding-left:10px;">${item.name}</td>
                  <td>${item.hsn || "7113"}</td>
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
            </tr>
            ${bill.isTaxable ? `
            <tr>
              <td class="label">SGST</td>
              <td class="value">${bill.sgst ? bill.sgst.toFixed(2) : "0.00"}</td>
            </tr>
            <tr>
              <td class="label">CGST</td>
              <td class="value">${bill.cgst ? bill.cgst.toFixed(2) : "0.00"}</td>
            </tr>
            <tr>
              <td class="label">IGST</td>
              <td class="value">${bill.igst ? bill.igst.toFixed(2) : "0.00"}</td>
            </tr>
            ` : ""}
            <tr>
              <td class="label">G. TOTAL</td>
              <td class="value">${bill.totalAmount?.toFixed(2)}</td>
            </tr>
          </table>
          
          <div class="bank-details">
            <p>A/c. No.: 917020061582687&nbsp;&nbsp;&nbsp;&nbsp;IFSC CODE : UTIB0001842</p>
            <p style="font-size:9px;">We hereby certify that original registration certificate under the CGST Act, 2017 is in force on the date on which the tax has been paid/payable by/to us on the goods specified in the Tax invoice & made as per the particulars given above.</p>
          </div>
          
          <div class="signature-area">
            <div class="signature-box customer-sign">
              <p>Customer Sign</p>
            </div>
            <div class="signature-box">
              <p>E. & O.E.<br>Thank You !</p>
            </div>
            <div class="signature-box auth-sign">
              <p>Auth. Sign</p>
            </div>
          </div>
          
          <div class="note">
            <p>For OMKAR GOLD COVERING</p>
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
        }
        .bill-container { 
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          box-sizing: border-box;
          position: relative;
        }
        .bill-header { 
          position: relative;
          margin-bottom: 15px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .company-logo {
          position: absolute;
          left: 5px;
          top: 5px;
          width: 60px;
        }
        .om-sai-ram {
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #d00000;
          color: white;
          padding: 2px 15px;
          border-radius: 15px;
          font-weight: bold;
          font-size: 12px;
        }
        .bill-title { 
          color: #d00000; 
          font-size: 28px; 
          font-weight: bold; 
          margin: 0;
          text-align: center;
          padding-top: 30px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .bill-address {
          margin: 5px 0;
          font-size: 11px; 
          text-align: center;
        }
        .bill-specialty {
          margin: 10px 0;
          font-size: 14px;
          text-align: center;
          font-style: italic;
          font-weight: bold;
        }
        .contact-details {
          position: absolute;
          right: 5px;
          top: 10px;
          font-size: 11px;
          text-align: right;
          line-height: 1.5;
        }
        .bill-details {
          margin: 20px 0;
        }
        .bill-row {
          display: flex;
          margin-bottom: 10px;
        }
        .bill-label {
          font-weight: bold;
          margin-right: 10px;
          font-size: 13px;
        }
        .bill-value {
          flex: 1;
          border-bottom: 1px solid #000;
          font-size: 13px;
          min-height: 18px;
        }
        .bill-inline {
          display: inline-block;
          margin-right: 30px;
        }
        .bill-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .bill-table th, .bill-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
          font-size: 12px;
        }
        .bill-table th {
          font-weight: bold;
        }
        .bill-table .particulars-col {
          width: 50%;
          text-align: left;
        }
        .bill-table .qty-col,
        .bill-table .rate-col {
          width: 10%;
        }
        .bill-table .amount-col {
          width: 30%;
        }
        .amount-col-rs {
          width: 15%;
        }
        .amount-col-p {
          width: 15%;
        }
        .empty-row td {
          height: 25px;
        }
        .total-row {
          font-weight: bold;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.05;
          z-index: -1;
          width: 300px;
          height: 300px;
        }
        .signature {
          margin-top: 30px;
          text-align: right;
          color: #d00000;
          font-weight: bold;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .bill-container { 
            width: 100%;
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <!-- Watermark -->
        <div class="watermark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
            <path d="M150,20 C80,60 60,150 100,250 C120,210 150,190 180,210 C240,150 220,60 150,20 Z" 
                  fill="none" stroke="#000" stroke-width="2"/>
            <path d="M100,90 C130,70 170,70 200,90 C220,120 220,180 200,210 C170,230 130,230 100,210 C80,180 80,120 100,90 Z" 
                  fill="none" stroke="#000" stroke-width="2"/>
            <circle cx="150" cy="150" r="10" fill="#000"/>
          </svg>
        </div>

        <div class="bill-header">
          <div class="company-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
              <circle cx="50" cy="50" r="48" stroke="#d00000" stroke-width="1.5" fill="none" />
              <path d="M50,10 C30,20 20,40 20,55 C20,70 30,85 50,90 C70,85 80,70 80,55 C80,40 70,20 50,10 Z" fill="none" stroke="#d00000" stroke-width="1.5" />
              <path d="M30,35 Q50,25 70,35" stroke="#d00000" stroke-width="1.5" fill="none" />
              <path d="M30,55 Q50,45 70,55" stroke="#d00000" stroke-width="1.5" fill="none" />
              <ellipse cx="50" cy="30" rx="5" ry="3" stroke="#d00000" stroke-width="1" fill="none" />
            </svg>
          </div>
          <div class="om-sai-ram">OM SAI RAM</div>
          <div class="contact-details">
            Kanchan : 9699233831<br>
            Office : 9702033831
          </div>
          <h1 class="bill-title">OMKAR GOLD COVERING</h1>
          <p class="bill-address">Room No. C-7, Mamta Industrial Estate, Navghar Road, Near Sri Ram Jewellers, Bhayander (E), Thane - 401105.</p>
          <p class="bill-specialty">All Types of Imitation Jewellery Specialist In : Neckless</p>
        </div>
        
        <div class="bill-details">
          <div class="bill-row">
            <div class="bill-label">Buyer's Name :</div>
            <div class="bill-value">${bill.customerName || ""}</div>
          </div>
          <div class="bill-row">
            <div class="bill-inline">
              <span class="bill-label">No. :</span>
              <span class="bill-value" style="min-width: 100px; display: inline-block;">${bill.billNumber || ""}</span>
            </div>
            <div class="bill-inline" style="float:right;">
              <span class="bill-label">Date :</span>
              <span class="bill-value" style="min-width: 150px; display: inline-block;">${new Date(bill.date || "2025-05-10").toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
          </div>
        </div>
        
        <table class="bill-table">
          <thead>
            <tr>
              <th>Sr.<br>No.</th>
              <th class="particulars-col">Particulars</th>
              <th class="qty-col">Qty</th>
              <th class="rate-col">Rate</th>
              <th class="amount-col" colspan="2">Amount</th>
            </tr>
            <tr>
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
            ${Array(10 - Math.min(10, getItemsArray(bill.items).length)).fill(0).map(() => `
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
              <td colspan="4" style="text-align: right;">TOTAL</td>
              <td>${Math.floor(bill.totalAmount || 0)}</td>
              <td>${(((bill.totalAmount || 0) % 1) * 100).toFixed(0).padStart(2, '0')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="signature">
          For OMKAR GOLD COVERING
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
      // The print dialog will be triggered by the onload function in the HTML
      
      // If an onPrint callback was provided, call it
      if (onPrint) {
        onPrint();
      }
    }
  }, [bill, onPrint]);

  // If triggerPrint is true, run the print function immediately
  React.useEffect(() => {
    if (triggerPrint) {
      handlePrint();
    }
  }, [triggerPrint, bill.id, handlePrint]);
  
  // If this is used as a button component without display
  if (triggerPrint) {
    return (
      <span onClick={handlePrint}>Print Bill</span>
    );
  }
  
  // Default render with button
  return (
    <Button onClick={handlePrint} variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
      <Printer className="h-4 w-4 mr-1" />
      Print Bill
    </Button>
  );
}
