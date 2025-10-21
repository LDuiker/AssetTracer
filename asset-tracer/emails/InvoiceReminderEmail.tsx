import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface InvoiceReminderEmailProps {
  organizationName: string;
  customerName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: 'due' | 'overdue';
  invoiceUrl?: string;
}

export default function InvoiceReminderEmail({
  organizationName = 'AssetTracer',
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-001',
  amount = '1,500.00',
  currency = 'USD',
  dueDate = 'January 15, 2025',
  status = 'due',
  invoiceUrl = 'https://assettracer.app/invoices',
}: InvoiceReminderEmailProps) {
  const previewText = status === 'overdue'
    ? `Invoice ${invoiceNumber} is overdue - ${currency} ${amount}`
    : `Invoice ${invoiceNumber} is due on ${dueDate}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {status === 'overdue' ? '⚠️ Invoice Overdue' : '📋 Invoice Reminder'}
          </Heading>
          
          <Text style={text}>Hi {customerName},</Text>
          
          <Text style={text}>
            This is a {status === 'overdue' ? 'reminder that your' : 'friendly reminder that'} invoice is {status === 'overdue' ? 'overdue' : `due on ${dueDate}`}.
          </Text>

          <Section style={invoiceBox}>
            <Text style={invoiceLabel}>Invoice Number</Text>
            <Text style={invoiceValue}>{invoiceNumber}</Text>
            
            <Hr style={hr} />
            
            <Text style={invoiceLabel}>Amount Due</Text>
            <Text style={invoiceValueLarge}>{currency} {amount}</Text>
            
            <Hr style={hr} />
            
            <Text style={invoiceLabel}>Due Date</Text>
            <Text style={invoiceValue}>{dueDate}</Text>
            
            {status === 'overdue' && (
              <>
                <Hr style={hr} />
                <Text style={overdueText}>
                  ⚠️ This invoice is overdue. Please remit payment as soon as possible.
                </Text>
              </>
            )}
          </Section>

          {invoiceUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={invoiceUrl}>
                View Invoice
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Best regards,<br />
            {organizationName}
          </Text>

          <Hr style={hr} />
          
          <Text style={footerSmall}>
            You received this email because you have email notifications enabled in your AssetTracer account.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const invoiceBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const invoiceLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
};

const invoiceValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '16px',
};

const invoiceValueLarge = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
};

const overdueText = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const buttonContainer = {
  padding: '0 40px',
  marginTop: '24px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 20px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '32px 0 16px',
  padding: '0 40px',
};

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 40px',
};

