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

interface WeeklyReportEmailProps {
  userName: string;
  weekOf: string;
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  currency: string;
  highlights: string[];
  reportsUrl?: string;
}

export default function WeeklyReportEmail({
  userName = 'User',
  weekOf = 'January 15-21, 2025',
  totalRevenue = '25,480.00',
  totalExpenses = '12,350.00',
  netProfit = '13,130.00',
  currency = 'USD',
  highlights = [
    '5 new invoices created',
    '3 payments received',
    '2 new assets added',
  ],
  reportsUrl = 'https://assettracer.app/reports',
}: WeeklyReportEmailProps) {
  const previewText = `Your weekly financial report for ${weekOf}`;
  const isProfit = parseFloat(netProfit.replace(/,/g, '')) >= 0;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📊 Weekly Financial Report</Heading>
          
          <Text style={text}>Hi {userName},</Text>
          
          <Text style={text}>
            Here&apos;s your financial summary for <strong>{weekOf}</strong>:
          </Text>

          {/* Financial Overview */}
          <Section style={statsBox}>
            <Text style={statsTitle}>Financial Overview</Text>
            
            <div style={statRow}>
              <Text style={statLabel}>Total Revenue</Text>
              <Text style={{...statValue, color: '#10b981'}}>
                +{currency} {totalRevenue}
              </Text>
            </div>
            
            <Hr style={hrThin} />
            
            <div style={statRow}>
              <Text style={statLabel}>Total Expenses</Text>
              <Text style={{...statValue, color: '#ef4444'}}>
                -{currency} {totalExpenses}
              </Text>
            </div>
            
            <Hr style={hrBold} />
            
            <div style={statRow}>
              <Text style={statLabel}>Net Profit</Text>
              <Text style={{
                ...statValueLarge,
                color: isProfit ? '#10b981' : '#ef4444',
              }}>
                {isProfit ? '+' : ''}{currency} {netProfit}
              </Text>
            </div>
          </Section>

          {/* Highlights */}
          {highlights && highlights.length > 0 && (
            <Section style={highlightsBox}>
              <Text style={highlightsTitle}>📈 This Week&apos;s Highlights</Text>
              {highlights.map((highlight, index) => (
                <div key={index} style={highlightItem}>
                  <span style={highlightBullet}>•</span>
                  <Text style={highlightText}>{highlight}</Text>
                </div>
              ))}
            </Section>
          )}

          {reportsUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={reportsUrl}>
                View Full Report
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Keep up the great work!<br />
            AssetTracer Team
          </Text>

          <Hr style={hr} />
          
          <Text style={footerSmall}>
            You received this weekly report because you have email notifications enabled for your Business plan in AssetTracer.
            Weekly reports are sent every Monday at 9 AM.
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

const statsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const statsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '16px',
};

const statRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  marginTop: '0',
  marginBottom: '0',
};

const statValue = {
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '0',
};

const statValueLarge = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '0',
};

const highlightsBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const highlightsTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '16px',
};

const highlightItem = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '8px',
};

const highlightBullet = {
  color: '#3b82f6',
  fontSize: '20px',
  fontWeight: 'bold',
  marginRight: '12px',
  lineHeight: '24px',
};

const highlightText = {
  color: '#1e40af',
  fontSize: '14px',
  marginTop: '0',
  marginBottom: '0',
  lineHeight: '24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const hrThin = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
};

const hrBold = {
  borderColor: '#d1d5db',
  borderWidth: '2px',
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

