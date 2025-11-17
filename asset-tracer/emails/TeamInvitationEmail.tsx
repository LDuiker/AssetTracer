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

interface TeamInvitationEmailProps {
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  inviteLink: string;
  expiresAt: string;
}

export default function TeamInvitationEmail({
  organizationName = 'AssetTracer',
  inviterName = 'Team Admin',
  inviterEmail = 'admin@example.com',
  role = 'member',
  inviteLink = 'https://assettracer.app/accept-invite?token=xxx',
  expiresAt = '7 days',
}: TeamInvitationEmailProps) {
  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    member: 'Team Member',
    viewer: 'Viewer',
  };

  const roleDescription: Record<string, string> = {
    admin: 'You\'ll have administrative access to manage the team and settings.',
    member: 'You\'ll be able to create and edit assets, invoices, and quotations.',
    viewer: 'You\'ll have read-only access to view assets and reports.',
  };

  const previewText = `${inviterName} invited you to join ${organizationName} on AssetTracer`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            👥 You've been invited to join {organizationName}
          </Heading>
          
          <Text style={text}>Hi there,</Text>
          
          <Text style={text}>
            <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join <strong>{organizationName}</strong> on AssetTracer as a <strong>{roleLabels[role] || role}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Organization</Text>
            <Text style={infoValue}>{organizationName}</Text>
            
            <Hr style={hr} />
            
            <Text style={infoLabel}>Your Role</Text>
            <Text style={infoValue}>{roleLabels[role] || role}</Text>
            <Text style={infoDescription}>{roleDescription[role] || ''}</Text>
            
            <Hr style={hr} />
            
            <Text style={infoLabel}>Invitation Expires</Text>
            <Text style={infoValue}>{expiresAt}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={textSmall}>
            Or copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{inviteLink}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,<br />
            The AssetTracer Team
          </Text>
          
          <Text style={footerSmall}>
            If you didn't expect this invitation, you can safely ignore this email.
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

const textSmall = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0 8px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const linkText = {
  color: '#3b82f6',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 24px',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
};

const infoBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
};

const infoLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
};

const infoValue = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '8px',
};

const infoDescription = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '0',
  marginBottom: '16px',
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

