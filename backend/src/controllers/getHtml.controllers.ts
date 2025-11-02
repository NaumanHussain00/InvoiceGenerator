import { Request, Response } from "express";

export async function getHtml(req: Request, res: Response) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #222;
      margin: 0;
      padding: 0;
    }
    .invoice-box {
      width: 210mm;
      min-height: 297mm;
      margin: auto;
      padding: 20mm;
      box-sizing: border-box;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      line-height: 24px;
      font-size: 14px;
      background: white;
    }
    @media print {
      .invoice-box {
        box-shadow: none;
        border: none;
      }
    }
    .title {
      font-size: 45px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    .company-details {
      text-align: right;
      line-height: 18px;
    }
    .details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .details div {
      width: 48%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      table-layout: fixed;
    }
    table th {
      border-bottom: 2px solid #4B00FF;
      text-align: left;
      padding: 10px 0;
      color: #4B00FF;
      text-transform: uppercase;
      font-size: 13px;
    }
    table td {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    colgroup col:nth-child(1) { width: 45%; }
    colgroup col:nth-child(2),
    colgroup col:nth-child(3),
    colgroup col:nth-child(4),
    colgroup col:nth-child(5) { width: 13.75%; }
    .totals {
      margin-top: 30px;
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .totals td {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals .total {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #000;
    }
    .highlight {
      color: #4B00FF;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="title">Invoice</div>
        <div style="font-size: 18px;">✏️ Click to edit</div>
      </div>
      <div class="company-details">
        <strong>YOUR COMPANY</strong><br />
        1234 Your Street<br />
        City, California 90210<br />
        United States<br />
        1-888-123-4567
      </div>
    </div>

    <div class="details">
      <div>
        <strong>Billed To</strong><br />
        Your Client<br />
        1234 Clients Street<br />
        City, California 90210<br />
        United States<br />
        1-888-123-8910
      </div>

      <div>
        <table style="width: 100%;">
          <tr><td>Date Issued:</td><td>26/3/2021</td></tr>
          <tr><td>Updated Date:</td><td>25/4/2021</td></tr>
          <tr><td>Invoice Number:</td><td>INV-10012</td></tr>
          <tr><td><strong>Remaining Balance:</strong></td><td><strong>$1,699.48</strong></td></tr>
        </table>
      </div>
    </div>

    <table>
      <colgroup><col /><col /><col /><col /><col /></colgroup>
      <tr>
        <th>PRODUCTS</th><th>RATE</th><th>QTY</th><th>DISCOUNT</th><th>AMOUNT</th>
      </tr>
      <tr><td>Services</td><td>$55.00</td><td>10</td><td>$5</td><td>$550.00</td></tr>
      <tr><td>Consulting</td><td>$75.00</td><td>1</td><td>$112.50</td><td>$1,125.00</td></tr>
      <tr><td>Materials</td><td>$123.39</td><td>2</td><td>$20</td><td>$123.39</td></tr>
    </table>

    <table class="totals">
      <colgroup><col /><col /><col /><col /><col /></colgroup>
      <tr><td>Subtotal</td><td></td><td></td><td></td><td>$1,798.39</td></tr>
      <tr><td>Discount</td><td></td><td></td><td>15%</td><td>$179.84</td></tr>
      <tr><td>Tax: SGST</td><td></td><td></td><td>10%</td><td>$53.95</td></tr>
      <tr><td>Tax: CGST</td><td></td><td></td><td>10%</td><td>$53.95</td></tr>
      <tr><td>Packaging: Paper</td><td></td><td></td><td></td><td>$53.95</td></tr>
      <tr><td>Transport: Truck</td><td></td><td></td><td></td><td>$53.95</td></tr>
      <tr class="total"><td>Total</td><td></td><td></td><td></td><td>$1,699.48</td></tr>
      <tr><td>Amount Paid by Customer</td><td></td><td></td><td></td><td>$169.95</td></tr>
      <tr class="highlight"><td>Remaining Balance</td><td></td><td></td><td></td><td>$169.95</td></tr>
    </table>
  </div>
</body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.send(htmlContent);
}
