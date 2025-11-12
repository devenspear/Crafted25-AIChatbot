import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Chat
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: November 12, 2025
        </p>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              The Crafted 2025 AI Assistant ("we", "our", or "the Service") is operated by
              Alys Beach in connection with the CRAFTED 2025 festival. We are committed to
              protecting your privacy and being transparent about the data we collect.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how we use it, and
              your rights regarding your data.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Chat Messages:</strong> The questions and messages you send to the
                AI assistant
              </li>
              <li>
                <strong>Session Data:</strong> Anonymous session identifiers to track
                conversations
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2.2 Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Device Information:</strong> Browser type, operating system, screen
                size, device type
              </li>
              <li>
                <strong>Location Data:</strong> Timezone and language preferences (not
                precise location)
              </li>
              <li>
                <strong>Performance Data:</strong> Page load times, connection type,
                network speed
              </li>
              <li>
                <strong>Usage Analytics:</strong> Pages visited, features used, session
                duration
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2.3 Information We Do NOT Collect
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Names, email addresses, or phone numbers</li>
              <li>Precise geolocation (GPS coordinates)</li>
              <li>Payment information</li>
              <li>Social security numbers or government IDs</li>
              <li>Health information</li>
              <li>IP addresses (stored temporarily for security only)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Provide Services:</strong> Answer your questions about CRAFTED 2025
                events
              </li>
              <li>
                <strong>Improve Performance:</strong> Optimize response times and user
                experience
              </li>
              <li>
                <strong>Analytics:</strong> Understand usage patterns to improve the service
              </li>
              <li>
                <strong>Security:</strong> Prevent abuse, detect anomalies, and ensure system
                security
              </li>
              <li>
                <strong>Cost Management:</strong> Monitor API usage and costs
              </li>
            </ul>
          </section>

          {/* Data Storage and Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Analytics Data:</strong> Stored for 30 days, then automatically
                deleted
              </li>
              <li>
                <strong>Session Data:</strong> Stored for 7 days
              </li>
              <li>
                <strong>Aggregate Metrics:</strong> Anonymized statistics retained for 1
                year
              </li>
              <li>
                <strong>Local Storage:</strong> User preferences stored in your browser
                (you can clear anytime)
              </li>
            </ul>
            <p className="mt-4">
              All data is stored securely using Vercel KV (Redis) with encryption in transit
              (TLS 1.3) and at rest.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate the AI assistant:</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Anthropic Claude API</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Purpose:</strong> AI-powered responses to your questions
              </li>
              <li>
                <strong>Data Shared:</strong> Your chat messages and conversation history
              </li>
              <li>
                <strong>Privacy:</strong> Anthropic does not use your data to train AI
                models
              </li>
              <li>
                <strong>Policy:</strong>{' '}
                <a
                  href="https://www.anthropic.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  anthropic.com/privacy
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Vercel (Hosting)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Purpose:</strong> Website hosting and data storage
              </li>
              <li>
                <strong>Compliance:</strong> SOC 2, GDPR compliant
              </li>
              <li>
                <strong>Policy:</strong>{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Upstash Redis</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Purpose:</strong> Analytics data storage
              </li>
              <li>
                <strong>Compliance:</strong> SOC 2, GDPR compliant
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>

            <h3 className="text-xl font-semibold mb-3">
              6.1 GDPR Rights (EU Residents)
            </h3>
            <p>If you are in the European Union, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your data ("right to be
                forgotten")
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a portable format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your data
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.2 CCPA Rights (California Residents)
            </h3>
            <p>If you are a California resident, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Know what personal information is collected</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of sale of personal information (we do not sell data)</li>
              <li>Non-discrimination for exercising your rights</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 How to Exercise Rights</h3>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a
                href="mailto:privacy@alysbeach.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                privacy@alysbeach.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Encryption:</strong> TLS 1.3 for all data transmission
              </li>
              <li>
                <strong>Rate Limiting:</strong> Protection against abuse and attacks
              </li>
              <li>
                <strong>Access Controls:</strong> Restricted access to analytics data
              </li>
              <li>
                <strong>Monitoring:</strong> Continuous security monitoring and logging
              </li>
              <li>
                <strong>Automatic Deletion:</strong> Data automatically deleted after
                retention period
              </li>
            </ul>
          </section>

          {/* Cookies and Local Storage */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Local Storage</h2>
            <p>
              We use browser local storage (not cookies) to store your preferences
              (theme, font size) and anonymous session data on your device. This data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remains on your device only</li>
              <li>Is not transmitted to servers (except session ID for analytics)</li>
              <li>Can be cleared by you at any time in browser settings</li>
              <li>Does not track you across websites</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p>
              This service is not directed at children under 13. We do not knowingly
              collect information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. International Data Transfers
            </h2>
            <p>
              Your data may be processed in the United States where our servers are
              located. By using the service, you consent to this transfer. We ensure
              appropriate safeguards are in place through our GDPR-compliant service
              providers.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last Updated" date
              at the top will reflect the most recent changes. Continued use of the service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>For questions about this Privacy Policy or our data practices:</p>
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="mb-2">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@alysbeach.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@alysbeach.com
                </a>
              </p>
              <p className="mb-2">
                <strong>Website:</strong>{' '}
                <a
                  href="https://alysbeach.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  alysbeach.com
                </a>
              </p>
              <p>
                <strong>Address:</strong> Alys Beach, 10131 E County Highway 30A, Inlet
                Beach, FL 32461
              </p>
            </div>
          </section>

          {/* Data Processing Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              13. Legal Basis for Processing (GDPR)
            </h2>
            <p>We process your data based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Legitimate Interest:</strong> Providing and improving the AI
                assistant service
              </li>
              <li>
                <strong>Consent:</strong> By using the service, you consent to data
                collection as described
              </li>
              <li>
                <strong>Contract:</strong> Necessary to provide the service you requested
              </li>
            </ul>
          </section>

          {/* Summary */}
          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Summary</h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p className="font-semibold mb-2">In Plain English:</p>
              <ul className="space-y-2">
                <li>✅ We collect anonymous usage data to improve the service</li>
                <li>✅ We don't collect your name, email, or personal information</li>
                <li>✅ Your data is automatically deleted after 30 days</li>
                <li>✅ We don't sell your data to anyone</li>
                <li>✅ You can request deletion of your data anytime</li>
                <li>✅ We use secure, GDPR-compliant services</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-gray-600 dark:text-gray-400">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
