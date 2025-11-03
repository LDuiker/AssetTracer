'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { User, Building2, Bell, Shield, Globe, Save, Loader2, Upload, X, Image as ImageIcon, CreditCard, Check, Zap, Users, Crown, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { BillingSection } from '@/components/settings/BillingSection';
import { TeamSection } from '@/components/settings/TeamSection';
import { TemplatePreview } from '@/components/settings/TemplatePreview';
import { toast } from 'sonner';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const { refetch: refetchCurrency } = useCurrency();

  // Handle tab from URL parameter (client-side only to avoid hydration issues)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    // Handle Polar.sh checkout success/cancel
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Activating your subscription...', {
        duration: 5000,
      });
      
      // Refresh organization data after successful payment
      // Poll for updated subscription status (webhooks may take a few seconds)
      const pollInterval = setInterval(() => {
        mutateOrg();
      }, 2000);
      
      // Stop polling after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);
      
      // Clear the interval when component unmounts
      return () => clearInterval(pollInterval);
    } else if (canceled === 'true') {
      toast.error('Payment canceled. Your subscription was not changed.', {
        duration: 5000,
      });
    }
    
    // Handle plan parameter from landing page
    const planParam = searchParams.get('plan');
    if (planParam && tabParam === 'billing') {
      // Show a message to the user about upgrading
      setTimeout(() => {
        if (planParam === 'pro') {
          toast.info('Ready to upgrade to Pro? Click the "Get Started" button below!', {
            duration: 6000,
          });
        } else if (planParam === 'business') {
          toast.info('Ready to upgrade to Business? Click the "Get Started" button below!', {
            duration: 6000,
          });
        }
      }, 500);
    }
  }, [searchParams]);

  // Fetch current user data
  const { data: userData, error: userError, isLoading: userLoading, mutate: mutateUser } = useSWR(
    '/api/user/profile',
    fetcher
  );

  // Initialize user settings from fetched data
  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'User',
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (userData?.user) {
      setUserSettings({
        name: userData.user.name || '',
        email: userData.user.email || '',
        phone: userData.user.phone || '',
        role: userData.user.role || 'User',
      });
    }
  }, [userData]);

  // Fetch organization data
  const { data: orgData, error: orgError, isLoading: orgLoading, mutate: mutateOrg } = useSWR(
    '/api/organization/settings',
    fetcher
  );

  // Track previous subscription tier to detect upgrades
  const [prevTier, setPrevTier] = useState<string | null>(null);
  
  // Detect subscription tier changes (from webhook updates)
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true' && orgData?.organization?.subscription_tier) {
      const currentTier = orgData.organization.subscription_tier;
      
      if (prevTier && prevTier !== currentTier && currentTier !== 'free') {
        // Subscription was successfully activated!
        const tierName = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
        toast.success(`🎉 ${tierName} subscription activated! You now have access to all premium features.`, {
          duration: 6000,
        });
      }
      
      setPrevTier(currentTier);
    }
  }, [orgData?.organization?.subscription_tier, prevTier, searchParams]);

  const [organizationSettings, setOrganizationSettings] = useState({
    name: '',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    taxRate: '0',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyPostalCode: '',
    companyCountry: '',
    companyWebsite: '',
    companyLogoUrl: '',
    defaultNotes: '',
    invoiceTerms: '',
    quotationTerms: '',
  });

  // Update organization settings when data loads
  useEffect(() => {
    if (orgData?.organization) {
      setOrganizationSettings({
        name: orgData.organization.name || '',
        currency: orgData.organization.default_currency || 'USD',
        timezone: orgData.organization.timezone || 'America/New_York',
        dateFormat: orgData.organization.date_format || 'MM/DD/YYYY',
        taxRate: String(orgData.organization.default_tax_rate || 0),
        companyEmail: orgData.organization.company_email || '',
        companyPhone: orgData.organization.company_phone || '',
        companyAddress: orgData.organization.company_address || '',
        companyCity: orgData.organization.company_city || '',
        companyState: orgData.organization.company_state || '',
        companyPostalCode: orgData.organization.company_postal_code || '',
        companyCountry: orgData.organization.company_country || '',
        companyWebsite: orgData.organization.company_website || '',
        companyLogoUrl: orgData.organization.company_logo_url || '',
        defaultNotes: orgData.organization.default_notes || '',
        invoiceTerms: orgData.organization.invoice_terms || 'Payment due within 30 days. Late payments may incur additional charges.',
        quotationTerms: orgData.organization.quotation_terms || 'This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.',
      });
    }
  }, [orgData]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
  });

  // Fetch notification preferences
  const { data: notificationData, mutate: mutateNotifications } = useSWR(
    orgData?.organization?.subscription_tier === 'business' ? '/api/notifications/preferences' : null,
    fetcher
  );

  // Update local state when notification data is loaded
  useEffect(() => {
    if (notificationData?.email_notifications_enabled !== undefined) {
      setNotificationSettings({
        emailNotifications: notificationData.email_notifications_enabled,
      });
    }
  }, [notificationData]);

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
  });

  // Load appearance settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedCompactMode = localStorage.getItem('compactMode') === 'true';
    
    setAppearanceSettings({
      theme: savedTheme,
      compactMode: savedCompactMode,
    });

    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: userSettings.name,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('Profile update failed:', error);
        const errorMessage = error.details || error.error || 'Failed to update profile';
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('Profile updated successfully:', result);
      
      toast.success('Profile updated successfully');
      mutateUser(); // Refresh user data
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/organization/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: organizationSettings.name,
          default_currency: organizationSettings.currency,
          default_tax_rate: parseFloat(organizationSettings.taxRate),
          timezone: organizationSettings.timezone,
          date_format: organizationSettings.dateFormat,
          company_email: organizationSettings.companyEmail,
          company_phone: organizationSettings.companyPhone,
          company_address: organizationSettings.companyAddress,
          company_city: organizationSettings.companyCity,
          company_state: organizationSettings.companyState,
          company_postal_code: organizationSettings.companyPostalCode,
          company_country: organizationSettings.companyCountry,
          company_website: organizationSettings.companyWebsite,
          company_logo_url: organizationSettings.companyLogoUrl,
          default_notes: organizationSettings.defaultNotes,
          invoice_terms: organizationSettings.invoiceTerms,
          quotation_terms: organizationSettings.quotationTerms,
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to update organization';
        try {
          const error = await res.json();
          console.error('Organization update failed:', error);
          
          // Handle different error formats
          if (error.details) {
            if (Array.isArray(error.details)) {
              errorMessage = error.details.map((e: any) => `${e.field}: ${e.message}`).join(', ');
            } else if (typeof error.details === 'string') {
              errorMessage = error.details;
            } else {
              errorMessage = JSON.stringify(error.details);
            }
          } else if (error.error) {
            errorMessage = error.error;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('Organization updated successfully:', result);

      toast.success('Organization settings updated successfully. Currency will update in a moment...');
      mutateOrg(); // Refresh organization data
      
      // Refetch currency settings to apply globally
      await refetchCurrency();
      
      // Show confirmation that currency is updated
      setTimeout(() => {
        toast.success('Currency and settings applied successfully!');
      }, 500);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // Update organization settings with new logo URL
      setOrganizationSettings({
        ...organizationSettings,
        companyLogoUrl: publicUrl,
      });

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setOrganizationSettings({
      ...organizationSettings,
      companyLogoUrl: '',
    });
    toast.success('Logo removed');
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email_notifications_enabled: notificationSettings.emailNotifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update notification preferences');
      }

      const result = await response.json();
      console.log('Notification preferences updated:', result);

      toast.success('Notification preferences updated successfully');
      mutateNotifications(); // Refresh notification data
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('theme', appearanceSettings.theme);
      localStorage.setItem('compactMode', String(appearanceSettings.compactMode));

      // Apply theme immediately
      if (appearanceSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (appearanceSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Simulate small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Appearance settings saved successfully');
    } catch (error) {
      console.error('Error saving appearance:', error);
      toast.error('Failed to save appearance settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Show success message with longer duration
      toast.success('🎉 Account deleted successfully! Thank you for using AssetTracer.', {
        duration: 4000,
        description: 'You can create a new account anytime.',
      });
      
      // Wait for the user to see the message
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Redirect to home page with signup parameter
      window.location.href = '/?deleted=true';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard')}
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
    <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account, organization, and application preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="flex items-center gap-2"
            disabled={orgData?.organization?.subscription_tier !== 'business'}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            {orgData?.organization?.subscription_tier !== 'business' && (
              <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 text-xs ml-1">
                Business
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32 ml-auto" />
                </div>
              ) : userError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to load profile: {userError.message}</p>
                  <Button onClick={() => mutateUser()} className="mt-4" variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userSettings.name}
                        onChange={(e) =>
                          setUserSettings({ ...userSettings, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-id">User ID</Label>
                    <Input
                      id="user-id"
                      value={userData?.user?.id || 'Loading...'}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Your unique user identifier
                    </p>
                  </div>

                  {/* Phone field - Uncomment after running SIMPLE-ADD-PHONE.sql
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={userSettings.phone}
                        onChange={(e) =>
                          setUserSettings({ ...userSettings, phone: e.target.value })
                        }
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                  */}

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage organization-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={organizationSettings.name}
                  onChange={(e) =>
                    setOrganizationSettings({
                      ...organizationSettings,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={organizationSettings.currency}
                    onValueChange={(value) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        currency: value,
                      })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      <SelectItem value="BWP">BWP - Botswana Pula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.01"
                    value={organizationSettings.taxRate}
                    onChange={(e) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        taxRate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={organizationSettings.timezone}
                    onValueChange={(value) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        timezone: value,
                      })
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Johannesburg</SelectItem>
                      <SelectItem value="Africa/Gaborone">Gaborone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={organizationSettings.dateFormat}
                    onValueChange={(value) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        dateFormat: value,
                      })
                    }
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Company Profile Section for PDFs */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Company Profile</h3>
                  <p className="text-sm text-gray-600">
                    This information will appear on invoices and quotations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Company Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      placeholder="info@company.com"
                      value={organizationSettings.companyEmail}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyEmail: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Company Phone</Label>
                    <Input
                      id="company-phone"
                      placeholder="+1 (555) 123-4567"
                      value={organizationSettings.companyPhone}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">Street Address</Label>
                  <Input
                    id="company-address"
                    placeholder="123 Main Street"
                    value={organizationSettings.companyAddress}
                    onChange={(e) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        companyAddress: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-city">City</Label>
                    <Input
                      id="company-city"
                      placeholder="New York"
                      value={organizationSettings.companyCity}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyCity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-state">State/Province</Label>
                    <Input
                      id="company-state"
                      placeholder="NY"
                      value={organizationSettings.companyState}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyState: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-postal">Postal Code</Label>
                    <Input
                      id="company-postal"
                      placeholder="10001"
                      value={organizationSettings.companyPostalCode}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyPostalCode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-country">Country</Label>
                    <Input
                      id="company-country"
                      placeholder="United States"
                      value={organizationSettings.companyCountry}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyCountry: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      placeholder="https://company.com"
                      value={organizationSettings.companyWebsite}
                      onChange={(e) =>
                        setOrganizationSettings({
                          ...organizationSettings,
                          companyWebsite: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-logo">Company Logo</Label>
                  <div className="flex flex-col gap-4">
                    {/* Logo Preview */}
                    {organizationSettings.companyLogoUrl ? (
                      <div className="relative w-full max-w-md p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={organizationSettings.companyLogoUrl}
                              alt="Company Logo"
                              className="h-20 w-auto object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">Current Logo</p>
                            <p className="text-xs text-gray-500 truncate">
                              {organizationSettings.companyLogoUrl}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">No logo uploaded</p>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="company-logo"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('company-logo')?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {organizationSettings.companyLogoUrl ? 'Change Logo' : 'Upload Logo'}
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Guidelines */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-medium">Logo Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Recommended size: <span className="font-medium">200 x 80 pixels</span></li>
                        <li>Maximum file size: <span className="font-medium">2MB</span></li>
                        <li>Supported formats: PNG, JPG, SVG, WebP</li>
                        <li>Transparent background (PNG) recommended</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Document Defaults Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Document Defaults
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set default notes and terms for invoices and quotations
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-notes">Default Notes</Label>
                  <Textarea
                    id="default-notes"
                    placeholder="These notes will appear on both invoices and quotations by default..."
                    rows={3}
                    value={organizationSettings.defaultNotes}
                    onChange={(e) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        defaultNotes: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Optional notes that will appear on all new documents (can be edited per document)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-terms">Invoice Terms & Conditions</Label>
                  <Textarea
                    id="invoice-terms"
                    placeholder="Payment due within 30 days..."
                    rows={4}
                    value={organizationSettings.invoiceTerms}
                    onChange={(e) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        invoiceTerms: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Default terms and conditions for invoices (can be customized per invoice)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quotation-terms">Quotation Terms & Conditions</Label>
                  <Textarea
                    id="quotation-terms"
                    placeholder="This quotation is valid for 30 days..."
                    rows={4}
                    value={organizationSettings.quotationTerms}
                    onChange={(e) =>
                      setOrganizationSettings({
                        ...organizationSettings,
                        quotationTerms: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Default terms and conditions for quotations (can be customized per quotation)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Template Preview Section */}
              <TemplatePreview 
                organization={{
                  name: organizationSettings.name,
                  company_email: organizationSettings.companyEmail,
                  company_phone: organizationSettings.companyPhone,
                  company_address: organizationSettings.companyAddress,
                  company_city: organizationSettings.companyCity,
                  company_state: organizationSettings.companyState,
                  company_postal_code: organizationSettings.companyPostalCode,
                  company_country: organizationSettings.companyCountry,
                  company_website: organizationSettings.companyWebsite,
                  company_logo_url: organizationSettings.companyLogoUrl,
                  default_notes: organizationSettings.defaultNotes,
                  invoice_terms: organizationSettings.invoiceTerms,
                  quotation_terms: organizationSettings.quotationTerms,
                  default_currency: organizationSettings.currency,
                  default_tax_rate: parseFloat(organizationSettings.taxRate) || 0,
                }}
              />

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveOrganization} disabled={isSaving}>
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <BillingSection />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {orgData?.organization?.subscription_tier !== 'business' ? (
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/50 dark:to-indigo-950/50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Email Notifications
                  <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    Business Only
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Upgrade to Business plan to manage email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Business Plan Includes:
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Invoice Reminders</strong> — Automated alerts for due and overdue invoices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Scheduled Reminders & Maintenance Alerts</strong> — Never miss important dates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Weekly Financial Reports</strong> — Stay on top of your business</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Unlimited Assets & Inventory</strong> — No limits on your growth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Up to 20 Team Members</strong> — Collaborate with your team</span>
                    </li>
                  </ul>
                </div>
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setActiveTab('billing')}
                    className="gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade to Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>

              {notificationSettings.emailNotifications && (
                <>
                  <Separator />
                  
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      You'll receive emails for:
                    </h4>
                    <ul className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Invoice Reminders</strong> — When invoices are due or overdue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span><strong>Scheduled Reminders & Maintenance Alerts</strong></span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Automated invoice due dates and asset maintenance schedules
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Weekly Reports</strong> — Financial summaries delivered to your inbox</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <TeamSection />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {/* Password change hidden - users authenticate via Google OAuth */}
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  This action cannot be undone. This will permanently delete:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-2">
                  <li>Your account and profile</li>
                  <li>All your organization data</li>
                  <li>All assets, inventory, and invoices</li>
                  <li>All team member access</li>
                  <li>Your active subscription (if any)</li>
                </ul>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-4">
                  ⚠️ Warning: This action is irreversible!
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}

