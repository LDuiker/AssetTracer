'use client';

import { useState } from 'react';
import { Check, FileText, Receipt, Sparkles, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoicePreview, QuotationPreview } from './TemplatePreview';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
  preview?: React.ReactNode;
}

interface TemplateSelectorProps {
  invoiceTemplate: 'classic' | 'compact';
  quotationTemplate: 'classic' | 'compact';
  onInvoiceSelect: (template: 'classic' | 'compact') => void;
  onQuotationSelect: (template: 'classic' | 'compact') => void;
  organization: any;
}

const templateOptions: TemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Professional & Traditional',
    color: 'from-blue-500 to-blue-600',
    icon: <FileText className="h-6 w-6 text-white" />,
    features: [
      'Traditional layout',
      'Blue accents',
      'Formal design',
      'Best for B2B',
    ],
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Modern & Minimalist',
    color: 'from-slate-700 to-slate-800',
    icon: <Sparkles className="h-6 w-6 text-white" />,
    features: [
      'Bold headers',
      'Color-coded sections',
      'Space-efficient',
      'Best for modern brands',
    ],
  },
];

export function TemplateSelector({
  invoiceTemplate,
  quotationTemplate,
  onInvoiceSelect,
  onQuotationSelect,
  organization,
}: TemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<'invoice' | 'quotation'>('invoice');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'invoice' | 'quotation'>('invoice');

  const currentTemplate = activeTab === 'invoice' ? invoiceTemplate : quotationTemplate;

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'invoice' | 'quotation')}>
        <div className="space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="invoice" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoice
              </TabsTrigger>
              <TabsTrigger value="quotation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Quotation
              </TabsTrigger>
            </TabsList>
            
            <Badge variant="outline" className="text-sm">
              Current: <span className="font-semibold capitalize ml-1">{currentTemplate}</span>
            </Badge>
          </div>

          <TabsContent value="invoice" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {templateOptions.map((template) => (
                <Card
                  key={template.id}
                  className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg group ${
                    invoiceTemplate === template.id
                      ? 'ring-2 ring-blue-500 border-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onInvoiceSelect(template.id as 'classic' | 'compact')}
                >
                  {/* Template Header */}
                  <CardHeader className={`bg-gradient-to-br ${template.color} text-white rounded-t-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white mb-0.5">{template.name}</CardTitle>
                          <CardDescription className="text-white/80 text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      {invoiceTemplate === template.id && (
                        <Badge className="bg-white text-blue-600 border-0 shadow-sm">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* Template Features */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Features:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {template.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Preview Button */}
                    <Button
                      variant="outline"
                      className="w-full group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMode('invoice');
                        setPreviewTemplate(template.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2 group-hover:text-blue-600" />
                      Preview Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quotation" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {templateOptions.map((template) => (
                <Card
                  key={template.id}
                  className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg group ${
                    quotationTemplate === template.id
                      ? 'ring-2 ring-blue-500 border-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onQuotationSelect(template.id as 'classic' | 'compact')}
                >
                  {/* Template Header */}
                  <CardHeader className={`bg-gradient-to-br ${template.color} text-white rounded-t-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                          {template.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white mb-0.5">{template.name}</CardTitle>
                          <CardDescription className="text-white/80 text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      {quotationTemplate === template.id && (
                        <Badge className="bg-white text-blue-600 border-0 shadow-sm">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* Template Features */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Features:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {template.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Preview Button */}
                    <Button
                      variant="outline"
                      className="w-full group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewMode('quotation');
                        setPreviewTemplate(template.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2 group-hover:text-blue-600" />
                      Preview Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl flex items-center gap-2">
              {templateOptions.find(t => t.id === previewTemplate)?.icon}
              {templateOptions.find(t => t.id === previewTemplate)?.name} Template Preview
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 bg-gray-100">
            <div className="bg-white rounded-lg shadow-sm inline-block min-w-full">
              {previewMode === 'invoice' ? (
                <InvoicePreview organization={organization} template={previewTemplate as 'classic' | 'compact'} />
              ) : (
                <QuotationPreview organization={organization} template={previewTemplate as 'classic' | 'compact'} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

