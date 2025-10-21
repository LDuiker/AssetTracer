# Invoice PDF Generation

Professional invoice PDF generation using `@react-pdf/renderer`.

## Files

- `invoice-template.tsx` - React PDF template component
- `index.ts` - Barrel exports

## Usage

### 1. Generate PDF in API Route

```typescript
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/lib/pdf';
import { getInvoiceById } from '@/lib/db';

// In your API route
const invoice = await getInvoiceById(id, organizationId);
const stream = await renderToStream(<InvoiceTemplate invoice={invoice} />);

// Convert to buffer
const chunks: Uint8Array[] = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
const buffer = Buffer.concat(chunks);

// Return as response
return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
  },
});
```

### 2. Download PDF from Frontend

```typescript
// Download invoice PDF
const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.error('Failed to download PDF');
  }
};
```

### 3. Customize Company Info

```typescript
<InvoiceTemplate
  invoice={invoice}
  companyName="Your Company Name"
  companyAddress="123 Business Street\nSuite 100\nNew York, NY 10001"
  companyPhone="+1 (555) 123-4567"
  companyEmail="billing@yourcompany.com"
  companyWebsite="www.yourcompany.com"
/>
```

## Template Features

### Header Section
- Company name (with brand color)
- Company address, phone, email, website
- "INVOICE" title
- Status badge (color-coded by status)

### Invoice Details
- Invoice number
- Issue date
- Due date
- Payment date (if paid)

### Bill To Section
- Client name
- Company name (if exists)
- Full address
- Email and phone

### Line Items Table
- Professional table with headers
- Columns: Description, Quantity, Price, Amount
- Alternating row colors for readability
- Auto-formatted currency values

### Totals Section
- Subtotal
- Tax total
- **Grand Total** (highlighted)
- Amount paid (if applicable)
- Balance due (if applicable, in red)

### Notes Section
- Custom notes/instructions
- Payment terms

### Footer
- Payment terms
- Thank you message

## Styling

### Color Scheme
- Primary Blue: `#2563EB`
- Text Dark: `#333333`
- Text Medium: `#666666`
- Text Light: `#999999`
- Background: `#F9FAFB`
- Border: `#E5E7EB`

### Status Badge Colors
- **Paid**: Green (`#D1FAE5` / `#065F46`)
- **Sent**: Blue (`#DBEAFE` / `#1E40AF`)
- **Draft**: Gray (`#F3F4F6` / `#374151`)
- **Overdue**: Red (`#FEE2E2` / `#991B1B`)

### Typography
- Headers: `Helvetica-Bold`
- Body: `Helvetica`
- Base size: 10pt
- Company name: 24pt
- Invoice title: 32pt

## API Endpoint

```
GET /api/invoices/[id]/pdf
```

**Authentication**: Required

**Response**: PDF file with `Content-Disposition: attachment`

**Filename**: `invoice-{invoice_number}.pdf`

**Example**: `invoice-INV-202410-0001.pdf`

## Customization

### Add Company Logo

```typescript
import { Image } from '@react-pdf/renderer';

// In the header section
<View style={styles.header}>
  <View style={styles.companyInfo}>
    <Image
      src="/path/to/logo.png"
      style={{ width: 120, height: 40, marginBottom: 10 }}
    />
    <Text style={styles.companyName}>{companyName}</Text>
    {/* ... */}
  </View>
</View>
```

### Change Fonts

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmEU9fBBc4.woff2',
      fontWeight: 'bold',
    },
  ],
});

// In styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    // ...
  },
});
```

### Add Watermark

```typescript
// For draft invoices
{invoice.status === 'draft' && (
  <View style={{
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    transform: 'rotate(-45deg)',
  }}>
    <Text style={{
      fontSize: 72,
      color: '#E5E7EB',
      textAlign: 'center',
      fontFamily: 'Helvetica-Bold',
    }}>
      DRAFT
    </Text>
  </View>
)}
```

## Performance

- PDF generation is done server-side for security
- Average generation time: 100-300ms
- File size: 50-200KB (depends on line items)
- Supports pagination for long invoices

## Browser Support

PDF downloads work in:
- Chrome/Edge (all versions)
- Firefox (all versions)
- Safari (all versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### PDF shows blank content
- Ensure invoice data includes client and items
- Check console for rendering errors
- Verify all required fields are present

### Download doesn't start
- Check browser console for errors
- Verify user is authenticated
- Ensure invoice exists and user has access

### Styling issues
- Use only supported CSS properties
- Avoid CSS transforms (limited support)
- Test with actual data before production

