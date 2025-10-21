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

interface MaintenanceAlert {
  type: 'invoice' | 'asset';
  title: string;
  description: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

interface MaintenanceAlertEmailProps {
  organizationName: string;
  userName: string;
  alerts: MaintenanceAlert[];
  dashboardUrl?: string;
}

export default function MaintenanceAlertEmail({
  organizationName = 'AssetTracer',
  userName = 'User',
  alerts = [
    {
      type: 'invoice',
      title: 'Invoice #INV-123 Due Soon',
      description: 'Due in 3 days',
      date: 'January 15, 2025',
      priority: 'high',
    },
  ],
  dashboardUrl = 'https://assettracer.app/dashboard',
}: MaintenanceAlertEmailProps) {
  const previewText = `${alerts.length} scheduled reminder${alerts.length !== 1 ? 's' : ''} from ${organizationName}`;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴 High Priority';
      case 'medium': return '🟡 Medium Priority';
      case 'low': return '🟢 Low Priority';
      default: return 'Priority';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📅 Scheduled Reminders</Heading>
          
          <Text style={text}>Hi {userName},</Text>
          
          <Text style={text}>
            You have {alerts.length} scheduled reminder{alerts.length !== 1 ? 's' : ''} that require your attention:
          </Text>

          {alerts.map((alert, index) => (
            <Section key={index} style={alertBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text style={alertType}>
                    {alert.type === 'invoice' ? '💰 Invoice Reminder' : '🔧 Asset Maintenance'}
                  </Text>
                  <Text style={alertTitle}>{alert.title}</Text>
                  <Text style={alertDescription}>{alert.description}</Text>
                  <Text style={alertDate}>📆 {alert.date}</Text>
                </div>
                <div style={{
                  ...priorityBadge,
                  backgroundColor: getPriorityColor(alert.priority) + '20',
                  color: getPriorityColor(alert.priority),
                }}>
                  {getPriorityLabel(alert.priority)}
                </div>
              </div>
            </Section>
          ))}

          {dashboardUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                View Dashboard
              </Button>
            </Section>
          )}

          <Text style={footer}>
            Stay on top of your scheduled tasks!<br />
            {organizationName}
          </Text>

          <Hr style={hr} />
          
          <Text style={footerSmall}>
            You received this email because you have email notifications enabled for your Business plan in AssetTracer.
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

const alertBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '16px 40px',
  padding: '20px',
};

const alertType = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  marginTop: '0',
};

const alertTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  marginTop: '8px',
  marginBottom: '4px',
};

const alertDescription = {
  color: '#6b7280',
  fontSize: '14px',
  marginTop: '0',
  marginBottom: '8px',
};

const alertDate = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  marginTop: '0',
  marginBottom: '0',
};

const priorityBadge = {
  fontSize: '11px',
  fontWeight: '600',
  padding: '4px 12px',
  borderRadius: '12px',
  whiteSpace: 'nowrap' as const,
  marginLeft: '12px',
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

