import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Asset Tracer',
  description: 'Privacy Policy for Asset Tracer - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-light-bg">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Policy for Asset Tracer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last Updated: October 28, 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to Asset Tracer ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our software-as-a-service (SaaS) platform (the "Service").
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This policy applies to all information collected through our Service, as well as any related services, sales, marketing, or events. By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this privacy policy, please do not access the Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We are a global company, and this policy is designed to comply with major international data protection regulations, including the General Data Protection Regulation (GDPR).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We collect information that you provide to us, information that is collected automatically, and information from other sources.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.1. Information You Provide to Us
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>
                  <strong>Account Information:</strong> When you register for an account, we collect personal information such as your name, email address, phone number, company name, and job title.
                </li>
                <li>
                  <strong>Payment Information:</strong> When you subscribe to a paid plan, we collect payment information through our secure payment processor, Polar.sh. We do not store your full credit card number on our servers.
                </li>
                <li>
                  <strong>Customer Data:</strong> We collect and store the data you upload to the Service, which may include information about your assets, invoices, clients, financial records, and other business-related data. You control this data.
                </li>
                <li>
                  <strong>Communications:</strong> If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.2. Information We Collect Automatically
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>
                  <strong>Usage Data:</strong> We automatically collect information about how you interact with our Service. This includes your IP address, browser type, operating system, referral URLs, device information, pages visited, and the dates/times of your visits.
                </li>
                <li>
                  <strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                2.3. Information from Third Parties
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We may receive information about you from other sources, such as third-party services and organizations. For example, if you access our Services through a third-party application, such as Google Single Sign-On, we may collect information about you from that third-party application that you have made public via your privacy settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>To Provide and Maintain our Service:</strong> To create and manage your account, process transactions, and provide you with customer support.
                </li>
                <li>
                  <strong>To Improve and Personalize our Service:</strong> To understand how our users interact with the Service and to develop new features, products, and services.
                </li>
                <li>
                  <strong>To Communicate with You:</strong> To send you service-related announcements, marketing communications, and other information about Asset Tracer. You can opt-out of marketing communications at any time.
                </li>
                <li>
                  <strong>For Security and Fraud Prevention:</strong> To monitor and prevent any fraudulent or malicious activity and to ensure the security of our Service.
                </li>
                <li>
                  <strong>To Comply with Legal Obligations:</strong> To comply with any applicable laws, regulations, legal processes, or governmental requests.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. How We Share Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell your personal information. We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>With Service Providers:</strong> We may share your information with third-party vendors and service providers that perform services for us or on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service.
                </li>
                <li>
                  <strong>For Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
                </li>
                <li>
                  <strong>For Legal Reasons:</strong> We may disclose your information if we are required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Customer Data will be retained for as long as you have an active account. If you terminate your account, your data will be deleted from our active systems within 90 days, and from our backups within 180 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Your Data Protection Rights (GDPR)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>The right to access, update or delete the information we have on you.</li>
                <li>
                  <strong>The right of rectification.</strong> You have the right to have your information rectified if that information is inaccurate or incomplete.
                </li>
                <li>
                  <strong>The right to object.</strong> You have the right to object to our processing of your Personal Data.
                </li>
                <li>
                  <strong>The right of restriction.</strong> You have the right to request that we restrict the processing of your personal information.
                </li>
                <li>
                  <strong>The right to data portability.</strong> You have the right to be provided with a copy of the information we have on you in a structured, machine-readable and commonly used format.
                </li>
                <li>
                  <strong>The right to withdraw consent.</strong> You also have the right to withdraw your consent at any time where we relied on your consent to process your personal information.
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Please note that we may ask you to verify your identity before responding to such requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those from your jurisdiction.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to the United States and process it there. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our Service is not intended for use by children under the age of 18. We do not knowingly collect personally identifiable information from children under 18. If you become aware that a child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from a child without verification of parental consent, we take steps to remove that information from our servers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@assettracer.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@assettracer.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

