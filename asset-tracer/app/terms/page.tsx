import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Asset Tracer',
  description: 'Terms of Service for Asset Tracer - Learn about the terms and conditions for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-light-bg">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Terms of Service for Asset Tracer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last Updated: October 28, 2025
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Agreement to Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you (either an individual or an entity, "you" or "your") and Asset Tracer ("we," "us," or "our") concerning your access to and use of the Asset Tracer software-as-a-service platform (the "Service").
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing or using the Service, you agree that you have read, understood, and agree to be bound by these Terms. If you do not agree with these Terms, you must not access or use the Service.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on our website and updating the "Last Updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Eligibility
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you are using the Service on behalf of an organization or entity, you represent and warrant that you have the authority to bind that organization or entity to these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Account Registration
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                3.1. Account Creation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To access certain features of the Service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Provide accurate, current, and complete information about yourself</li>
                <li>Maintain and promptly update your account information to keep it accurate, current, and complete</li>
                <li>Maintain the security of your account by protecting your password and restricting access to your account</li>
                <li>Promptly notify us if you discover or suspect any security breach related to the Service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                3.2. Account Responsibility
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are responsible for all activities that occur under your account. You agree not to share your account credentials with any third party. We are not liable for any loss or damage arising from your failure to maintain the security of your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                3.3. Account Termination
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms or engaged in any fraudulent, abusive, or illegal activity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Subscription Plans and Billing
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.1. Subscription Plans
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Asset Tracer offers various subscription plans with different features and pricing. The details of each plan are available on our pricing page at{' '}
                <Link href="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline">
                  www.assettracer.com/pricing
                </Link>.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.2. Billing
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By subscribing to a paid plan, you agree to pay all fees associated with your chosen subscription plan. Fees are billed in advance on a monthly basis.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All fees are non-refundable except as expressly stated in these Terms or as required by applicable law.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.3. Payment Methods
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We accept payment through our secure payment processor, Polar.sh. You authorize us to charge your designated payment method for all fees incurred under your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.4. Price Changes
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to change our pricing at any time. If we increase the price of your subscription plan, we will provide you with at least 30 days' advance notice. The price change will take effect at the start of your next billing cycle after the notice period.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you do not agree to a price increase, you may cancel your subscription before the new price takes effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.5. Automatic Renewal
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your subscription will automatically renew at the end of each monthly billing cycle unless you cancel before the renewal date. You can cancel your subscription at any time through your account settings or by contacting our support team.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                4.6. Refund Policy
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We offer a 30-day money-back guarantee for new subscribers. If you are not satisfied with the Service within the first 30 days of your initial subscription, you may request a full refund by contacting our support team at{' '}
                <a href="mailto:support@assettracer.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  support@assettracer.com
                </a>.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                After the 30-day period, all fees are non-refundable. If you cancel your subscription, you will continue to have access to the Service until the end of your current billing period, but you will not receive a refund for any unused portion of your subscription.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Use of the Service
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                5.1. License Grant
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal business purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                5.2. Acceptable Use
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Use the Service in any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>Use the Service to transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
                <li>Impersonate or attempt to impersonate Asset Tracer, an Asset Tracer employee, another user, or any other person or entity</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
                <li>Use any robot, spider, or other automatic device, process, or means to access the Service for any purpose</li>
                <li>Introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful</li>
                <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service</li>
                <li>Attack the Service via a denial-of-service attack or a distributed denial-of-service attack</li>
                <li>Otherwise attempt to interfere with the proper working of the Service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                5.3. Prohibited Activities
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may not use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Store or transmit infringing, libelous, or otherwise unlawful or tortious material</li>
                <li>Store or transmit material in violation of third-party privacy rights</li>
                <li>Store or transmit malicious code</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems or networks</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Service</li>
                <li>Rent, lease, lend, sell, sublicense, assign, distribute, publish, transfer, or otherwise make available the Service to any third party</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Customer Data
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                6.1. Your Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain all rights, title, and interest in and to the data you upload, store, or transmit through the Service ("Customer Data"). You are solely responsible for the accuracy, quality, integrity, legality, reliability, and appropriateness of your Customer Data.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                6.2. Our Use of Your Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We will only use your Customer Data to provide the Service to you and as otherwise described in our{' '}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>. We will not access, use, or disclose your Customer Data except:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>As necessary to provide the Service</li>
                <li>As required by law or legal process</li>
                <li>To protect the rights, property, or safety of Asset Tracer, our users, or the public</li>
                <li>With your prior consent</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                6.3. Data Backup and Security
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement reasonable security measures to protect your Customer Data. However, we cannot guarantee that unauthorized third parties will never be able to defeat our security measures or use your Customer Data for improper purposes.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are responsible for maintaining your own backups of your Customer Data. While we perform regular backups of the Service, we are not responsible for any loss or corruption of your Customer Data.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                6.4. Data Retention
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We will retain your Customer Data for as long as your account is active or as needed to provide you the Service. If you terminate your account, we will delete your Customer Data from our active systems within 90 days and from our backups within 180 days, unless we are required to retain it by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Intellectual Property Rights
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.1. Our Intellectual Property
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Asset Tracer, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.2. Trademarks
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Asset Tracer name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Asset Tracer or its affiliates or licensors. You must not use such marks without our prior written permission.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                7.3. Feedback
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                If you provide us with any feedback, suggestions, or ideas about the Service ("Feedback"), you grant us a perpetual, irrevocable, worldwide, royalty-free license to use, modify, and incorporate such Feedback into the Service without any obligation to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Third-Party Services and Links
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service may contain links to third-party websites or services that are not owned or controlled by Asset Tracer. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You acknowledge and agree that Asset Tracer shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such third-party websites or services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Service Availability and Modifications
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                9.1. Service Availability
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We strive to provide reliable and uninterrupted access to the Service. However, we do not guarantee that the Service will be available at all times or that it will be free from errors, bugs, or interruptions.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice, for any reason, including to perform maintenance, deploy updates, or due to technical issues.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                9.2. Service Level Agreement (SLA)
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                For paid subscribers, we aim to maintain 99.5% uptime for the Service, excluding scheduled maintenance. If we fail to meet this uptime commitment, you may be eligible for service credits as described in our SLA, available at{' '}
                <Link href="/sla" className="text-blue-600 dark:text-blue-400 hover:underline">
                  www.assettracer.com/sla
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Warranties and Disclaimers
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                10.1. Limited Warranty
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We warrant that the Service will perform substantially in accordance with the documentation provided by us. If the Service does not perform as warranted, your sole remedy is for us to use commercially reasonable efforts to correct the non-conformity or, if we are unable to do so, to terminate your subscription and refund any prepaid fees for the remainder of your subscription term.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                10.2. Disclaimer of Warranties
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                EXCEPT AS EXPRESSLY PROVIDED IN THESE TERMS, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. WE DO NOT WARRANT THAT THE RESULTS OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ASSET TRACER, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE</li>
                <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE</li>
                <li>ANY CONTENT OBTAINED FROM THE SERVICE</li>
                <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY, OR $100, WHICHEVER IS GREATER.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN WARRANTIES OR DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Indemnification
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree to defend, indemnify, and hold harmless Asset Tracer, its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                <li>Your violation of these Terms</li>
                <li>Your use of the Service</li>
                <li>Your Customer Data</li>
                <li>Your violation of any rights of another party</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Term and Termination
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                13.1. Term
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms commence on the date you first access or use the Service and continue until terminated in accordance with this section.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                13.2. Termination by You
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may terminate your account at any time by contacting our support team or through your account settings. If you terminate your account, you will continue to have access to the Service until the end of your current billing period, but you will not receive a refund for any unused portion of your subscription (except as provided in our refund policy).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                13.3. Termination by Us
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may suspend or terminate your account immediately, without prior notice or liability, if:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>You breach any provision of these Terms</li>
                <li>We are required to do so by law</li>
                <li>We decide to discontinue the Service</li>
                <li>We believe your use of the Service poses a security risk or could subject us to liability</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                13.4. Effect of Termination
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Upon termination of your account:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-4">
                <li>Your right to access and use the Service will immediately cease</li>
                <li>We will delete your Customer Data from our active systems within 90 days</li>
                <li>You will remain liable for all fees incurred prior to termination</li>
                <li>Sections of these Terms that by their nature should survive termination will survive, including but not limited to intellectual property provisions, warranty disclaimers, indemnity, and limitations of liability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                14. Dispute Resolution
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                14.1. Informal Resolution
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any dispute with us, you agree to first contact us at{' '}
                <a href="mailto:support@assettracer.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  support@assettracer.com
                </a>{' '}
                and attempt to resolve the dispute informally. We will attempt to resolve the dispute informally by contacting you via email.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                14.2. Arbitration
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If we cannot resolve the dispute informally within 60 days, any dispute arising out of or relating to these Terms or the Service will be resolved through binding arbitration in accordance with the rules of [Arbitration Association/Body], rather than in court, except that you may assert claims in small claims court if your claims qualify.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                14.3. Class Action Waiver
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                YOU AND ASSET TRACER AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                15. Governing Law and Jurisdiction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Any legal action or proceeding arising out of or relating to these Terms or the Service shall be brought exclusively in the courts located in [Your Jurisdiction], and you consent to the personal jurisdiction of such courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                16. Export Controls
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The Service may be subject to export control laws and regulations. You agree to comply with all applicable export and import control laws and regulations in your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                17. Entire Agreement
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms, together with our{' '}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>{' '}
                and any other legal notices or agreements published by us on the Service, constitute the entire agreement between you and Asset Tracer concerning the Service and supersede all prior or contemporaneous agreements, understandings, and communications, whether written or oral.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                18. Severability
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will continue in full force and effect. The invalid or unenforceable provision will be deemed modified to the extent necessary to make it valid and enforceable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                19. Waiver
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                No waiver by Asset Tracer of any term or condition set forth in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                20. Assignment
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                You may not assign or transfer these Terms or your rights under these Terms, in whole or in part, without our prior written consent. We may assign these Terms at any time without notice to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                21. Force Majeure
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We shall not be liable for any failure or delay in performance under these Terms due to causes beyond our reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation facilities, fuel, energy, labor, or materials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                22. Notice
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may provide notices to you via email, regular mail, or postings on the Service. You agree that electronic notices satisfy any legal requirement that such communications be in writing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                23. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Support:</strong>{' '}
                <a href="mailto:support@assettracer.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  support@assettracer.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                24. Updates to These Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to update these Terms at any time. When we make material changes to these Terms, we will notify you by email or through a notice on our website. Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the changes.
              </p>
            </section>

            <section className="mb-8 p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                By using Asset Tracer, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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

