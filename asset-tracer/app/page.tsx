'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Package, 
  FileText, 
  TrendingUp, 
  Check, 
  Menu, 
  X,
  Sparkles,
  BarChart3,
  Users,
  Bell,
  Download,
  Building2,
  Laptop,
  Tv,
  ArrowDown,
  PlayCircle,
  DollarSign,
  Clock,
  Settings,
  Briefcase,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const features = [
  {
    icon: DollarSign,
    title: "Quotations & Invoices",
    desc: "Create branded quotes and invoices in seconds. Share with clients instantly and track payments from your dashboard."
  },
  {
    icon: FileText,
    title: "Smart Asset Tracking",
    desc: "Organize and monitor company assets with ease. See purchase details, maintenance dates, and current status at a glance."
  },
  {
    icon: BarChart3,
    title: "Profitability Insights",
    desc: "Understand how much each asset costs versus what it earns. Make data-driven decisions effortlessly."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Invite team members to manage or view assets, invoices, and expenses — with role-based access control."
  },
  {
    icon: Clock,
    title: "Reminders & Alerts",
    desc: "Set maintenance, warranty, and renewal reminders. Stay proactive and never miss an important date."
  },
  {
    icon: Settings,
    title: "Simple Reports & Exports",
    desc: "Generate quick CSV or PDF reports for audits, compliance, or internal meetings in just one click."
  },
];

const personas = [
  {
    icon: Briefcase,
    title: "Freelancers & Consultants",
    desc: "Track your work tools, bill clients faster, and stay on top of expenses — all from one clean dashboard.",
  },
  {
    icon: Building2,
    title: "Small Businesses",
    desc: "Manage company assets, invoices, and maintenance schedules without hiring a full-time finance team.",
  },
  {
    icon: Users,
    title: "Finance & Admin Teams",
    desc: "Bring structure to scattered spreadsheets. Asset Tracer centralizes reporting and accountability for growing teams.",
  },
  {
    icon: Globe,
    title: "Nonprofits & NGOs",
    desc: "Keep donor-funded assets visible, compliant, and transparent — without the cost of heavy enterprise tools.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show welcome message after account deletion
  useEffect(() => {
    const deleted = searchParams.get('deleted');
    if (deleted === 'true') {
      toast.success('Account deleted successfully! 👋', {
        duration: 6000,
        description: 'Ready to start fresh? Create a new account below.',
      });
      
      // Scroll to pricing section after a moment
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1000);
    }
  }, [searchParams]);

  const handlePricingCta = (plan: string) => {
    if (plan === 'starter') {
      // Free plan - just go to login
      router.push('/login');
    } else {
      // Pro or Business plan - redirect to login with plan for direct checkout
      router.push(`/login?plan=${plan}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-[#2563EB]" />
                <span className="text-xl font-bold text-[#0B1226]">Asset Tracer</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-700 hover:text-[#2563EB] transition-colors font-medium">
                Features
              </Link>
              <Link href="#case-studies" className="text-gray-700 hover:text-[#2563EB] transition-colors font-medium">
                Case Studies
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-[#2563EB] transition-colors font-medium">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-700 hover:text-[#2563EB] transition-colors font-medium">
                FAQ
              </Link>
              <Button asChild className="bg-[#2563EB] hover:bg-[#1e40af] rounded-2xl">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link
                href="#features"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#case-studies"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Case Studies
              </Link>
              <Link
                href="#pricing"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Button asChild className="w-full mt-2 bg-[#2563EB] hover:bg-[#1e40af] rounded-2xl">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 text-white py-24">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')] bg-cover bg-center" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* TEXT BLOCK */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="uppercase tracking-wide text-cyan-200 text-sm font-semibold">
              FOR SMEs & GROWING TEAMS
            </span>

            <h1 className="mt-4 text-5xl font-bold leading-tight md:text-6xl">
              Track Assets. Send Quotes. <br /> Know Your Profit.
              </h1>

            <p className="mt-6 text-lg text-blue-100 leading-relaxed">
              The simplest way to manage assets, create invoices, and understand ROI — all from one lean, powerful dashboard.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all font-semibold"
                  asChild
                >
                  <Link href="/login">🚀 Start Free</Link>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex items-center justify-center px-8 py-4 border border-white/30 text-white hover:bg-white/10 rounded-xl transition-all"
                  asChild
                >
                  <Link href="#features">
                    <PlayCircle className="mr-2 w-5 h-5" />
                    View Demo
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* DASHBOARD PREVIEW */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden md:block"
          >
            <div className="relative">
              <div className="w-[600px] h-[400px] bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Dashboard Preview Content */}
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  {/* Mock Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Asset Tracer</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">JD</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock KPI Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">$22,400</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Expenses</p>
                          <p className="text-2xl font-bold text-red-600">$3,570</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Chart Area */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4">Monthly Revenue vs Expenses</h4>
                    <div className="h-32 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Interactive Chart</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-900/10 via-transparent" />
            </div>
          </motion.div>
        </div>

        {/* SCROLL CUE */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-blue-100 cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 opacity-80" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Everything You Need to Manage Assets and Money — Without the Bulk.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-16"
          >
            Asset Tracer combines simplicity and power — designed for businesses that want clarity, not complexity.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition relative p-8 text-left group border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="who-its-for" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Built for real people managing real assets.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-16"
          >
            Whether you're a solo freelancer or managing a growing team — Asset Tracer keeps your finances, equipment, and reports simple, smart, and stress-free.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {personas.map((p, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-left shadow-sm hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {p.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="case-studies" className="py-20 bg-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1226] mb-4">
              How Real Businesses Use Asset Tracer
            </h2>
            <p className="text-xl text-gray-600">
              Success stories from SMEs across Africa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Case Study 1 */}
            <Card className="border-2 hover:shadow-xl rounded-2xl bg-white">
              <CardHeader>
                <div className="h-12 w-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-[#2563EB]" />
                </div>
                <CardTitle className="text-xl">Construction Company</CardTitle>
                <p className="text-sm text-[#2563EB] font-semibold">Botswana Builders Ltd.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Problem:</p>
                  <p className="text-sm text-gray-600">Assets scattered across multiple projects and missing invoices.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Solution:</p>
                  <p className="text-sm text-gray-600">Track tools, trucks, and materials in real-time. Generate job-specific invoices instantly.</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-bold text-[#2563EB]">Result:</p>
                  <p className="text-sm text-gray-900 font-semibold">30% reduction in asset losses + faster client billing</p>
                </div>
              </CardContent>
            </Card>

            {/* Case Study 2 */}
            <Card className="border-2 hover:shadow-xl rounded-2xl bg-white">
              <CardHeader>
                <div className="h-12 w-12 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center mb-4">
                  <Laptop className="h-6 w-6 text-[#06B6D4]" />
                </div>
                <CardTitle className="text-xl">IT Services Provider</CardTitle>
                <p className="text-sm text-[#06B6D4] font-semibold">TechPro Solutions</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Problem:</p>
                  <p className="text-sm text-gray-600">Couldn't track equipment loans or calculate ROI on rented devices.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Solution:</p>
                  <p className="text-sm text-gray-600">Check in/out assets, set maintenance reminders, and compare spend vs. earnings.</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-bold text-[#06B6D4]">Result:</p>
                  <p className="text-sm text-gray-900 font-semibold">Improved billing accuracy and better asset utilization</p>
                </div>
              </CardContent>
            </Card>

            {/* Case Study 3 */}
            <Card className="border-2 hover:shadow-xl rounded-2xl bg-white">
              <CardHeader>
                <div className="h-12 w-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-4">
                  <Tv className="h-6 w-6 text-[#F97316]" />
                </div>
                <CardTitle className="text-xl">Events Company</CardTitle>
                <p className="text-sm text-[#F97316] font-semibold">StageOne Productions</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Problem:</p>
                  <p className="text-sm text-gray-600">Needed to track stage equipment and issue client quotes fast.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Solution:</p>
                  <p className="text-sm text-gray-600">Manage inventory, send quotations, and record expenses per event.</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-bold text-[#F97316]">Result:</p>
                  <p className="text-sm text-gray-900 font-semibold">5+ hours saved weekly + 40% less missed maintenance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1226] mb-4">
              Simple, Transparent Pricing — Start Free. Upgrade Anytime.
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-2 hover:border-[#2563EB] transition-all hover:shadow-xl rounded-2xl">
              <CardHeader className="pb-8">
                <Badge className="mb-4 w-fit bg-gray-100 text-gray-700 hover:bg-gray-100">Starter</Badge>
                <CardTitle className="text-2xl mb-2">Free Forever</CardTitle>
                <CardDescription className="text-base">Perfect for small businesses testing the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-4xl font-bold text-[#0B1226]">
                  $0<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Manage up to 20 assets</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 50 inventory items</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">5 quotations/invoices per month</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">1 user only</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Basic reporting (CSV export)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Community email support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-[#2563EB] hover:bg-[#1e40af] rounded-2xl" 
                  size="lg"
                  onClick={() => handlePricingCta('starter')}
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-4 border-[#2563EB] transition-all shadow-xl rounded-2xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#2563EB] text-white hover:bg-[#2563EB] px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="pb-8 pt-8">
                <Badge className="mb-4 w-fit bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/10">Pro</Badge>
                <CardTitle className="text-2xl mb-2">Growth Plan</CardTitle>
                <CardDescription className="text-base">For growing SMEs that need more room to scale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-4xl font-bold text-[#0B1226]">
                  $19<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 500 assets</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 1,000 inventory items</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Unlimited quotations/invoices</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 5 team members</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">ROI tracking (spent vs earned)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Branded PDF quotations & invoices</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Priority email support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-[#2563EB] hover:bg-[#F97316] rounded-2xl shadow-lg" 
                  size="lg"
                  onClick={() => handlePricingCta('pro')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card className="border-2 hover:border-[#2563EB] transition-all hover:shadow-xl rounded-2xl">
              <CardHeader className="pb-8">
                <Badge className="mb-4 w-fit bg-gray-100 text-gray-700 hover:bg-gray-100">Business</Badge>
                <CardTitle className="text-2xl mb-2">Scale Plan</CardTitle>
                <CardDescription className="text-base">For larger teams managing multiple sites or projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-4xl font-bold text-[#0B1226]">
                  $39<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Unlimited assets and inventory items</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Unlimited quotations/invoices</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Up to 20 team members</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Advanced reporting & analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Scheduled reminders & maintenance alerts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Role-based permissions (Admin/Staff)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-[#2563EB] mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">Premium support (chat & email)</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-[#2563EB] hover:bg-[#1e40af] rounded-2xl" 
                  size="lg"
                  onClick={() => handlePricingCta('business')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#F3F4F6]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1226] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Asset Tracer
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-1" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  What is Asset Tracer?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Asset Tracer is a lightweight web application that helps businesses track assets, manage inventory, create quotations and invoices, and measure asset profitability — all from one easy dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  How is it different from other systems?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Unlike bulky ERP systems, Asset Tracer is built for simplicity and affordability. It gives SMEs just what they need — asset visibility, financial tracking, and collaboration — without overwhelming complexity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  How much does it cost?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                You can start free with up to 20 assets. When ready, upgrade to Pro ($19/month) or Business ($39/month) for unlimited features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  How do I pay for my plan?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                We use Polar.sh — a secure, trusted payment provider that accepts all major credit cards including Visa, Mastercard, and American Express. Your payment information is encrypted and never stored on our servers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  Is my data safe?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Absolutely. Your data is protected with bank-level encryption and stored securely in the cloud. All payments are processed through Polar.sh, a trusted payment provider, ensuring your financial information is safe and secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  Can I invite my team?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Yes! The Pro plan allows up to 5 users, and the Business plan up to 20 users. Perfect for growing teams.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-7" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  Can I cancel anytime?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Absolutely. You can cancel, upgrade, or downgrade your plan at any time without penalties.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-8" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  Who is Asset Tracer for?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                Ideal for SMEs in construction, logistics, IT, retail, events, and any business that manages equipment or assets.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-9" className="border rounded-2xl px-6 bg-white hover:bg-gray-50 transition-colors">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="text-lg font-semibold text-[#0B1226] pr-4">
                  Do I need training?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-6 leading-relaxed">
                No. It's built to be intuitive — sign in with Google, add your first asset, and you're up and running in minutes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#2563EB] via-[#1e40af] to-[#0F172A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Get Started Today — It's Free.
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Track assets, send invoices, and know your numbers — all in one lean, powerful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-[#2563EB] hover:bg-blue-50 text-lg px-8 py-6 rounded-2xl shadow-xl"
              asChild
            >
              <Link href="/login">Start Free – Manage 20 Assets</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white/10 rounded-2xl"
              asChild
            >
              <Link href="#pricing">See Pricing Plans</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Cancel anytime • 5-star rated by SMEs
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-8 w-8 text-[#2563EB]" />
                <span className="text-xl font-bold text-white">Asset Tracer</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                An asset management and invoicing system built for growing businesses. Simple, powerful, and easy to use.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#case-studies" className="text-gray-400 hover:text-white transition-colors">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-700" />

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Asset Tracer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
