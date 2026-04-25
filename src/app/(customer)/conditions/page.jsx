// FILE: src/app/(customer)/conditions/page.jsx
export const metadata = { title: 'Privacy & Conditions · Novara' }

export default function ConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-5 sm:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl font-extrabold text-primary mb-3">Privacy & Conditions</h1>
        <p className="text-sm text-muted uppercase tracking-widest font-semibold">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-invert prose-brand max-w-none text-secondary">
        <p className="lead text-lg mb-8 text-primary">
          At Novara, we take your privacy seriously. This policy describes what personal information we collect, how we use it, and your choices regarding your data when using our multi-vendor marketplace.
        </p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">1.</span> Information We Collect
          </h2>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Account Data:</strong> Name, email address, password, profile picture, and role (Buyer or Vendor).</li>
            <li><strong>Transaction Data:</strong> Purchase history, shipping addresses, order details, and payment statuses (actual card numbers are securely handled by third-party processors).</li>
            <li><strong>Communications:</strong> Messages sent between Buyers and Vendors, support requests, and chat logs.</li>
            <li><strong>Device & Usage Data:</strong> IP addresses, browser types, interaction logs, and device identifiers collected automatically to secure and improve the platform.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">2.</span> How We Use Your Information
          </h2>
          <p className="mb-4">We use the collected data to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Facilitate marketplace transactions and escrow services.</li>
            <li>Communicate with you regarding orders, support, and platform updates.</li>
            <li>Detect, prevent, and address fraud, security breaches, or technical issues.</li>
            <li>Enforce our Terms of Use and comply with legal obligations.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">3.</span> Information Sharing
          </h2>
          <p className="mb-4">
            We do not sell your personal data. We only share your data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>With Vendors:</strong> We share your necessary details (name, shipping address) with the vendor you purchase from to fulfill your order.</li>
            <li><strong>With Service Providers:</strong> Payment processors, cloud hosting providers, and email delivery services acting on our behalf.</li>
            <li><strong>For Legal Reasons:</strong> If required by law, subpoena, or to protect the rights, property, or safety of Novara, our users, or others.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">4.</span> Cookies & Tracking
          </h2>
          <p className="mb-4">
            Novara uses cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies; however, if you do not accept cookies, you may not be able to use portions of our Service.
          </p>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-surface-2 border border-border">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">5.</span> Data Security & Developer Protection
          </h2>
          <p className="mb-4">
            While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security. By using Novara, you acknowledge that the developers and operators of this platform cannot be held financially or legally liable for data breaches, unauthorized access, or loss of information that occur despite our security measures.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">6.</span> Your Rights
          </h2>
          <p className="mb-4">
            You have the right to access, update, or delete the personal information we have on you. You can usually do this directly within your account settings section. If you are unable to perform these actions yourself, please contact us to assist you.
          </p>
        </section>
      </div>
    </div>
  )
}
