// FILE: src/app/(customer)/terms/page.jsx
export const metadata = { title: 'Terms of Use · Novara' }

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-5 sm:px-8">
      <div className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl font-extrabold text-primary mb-3">Terms of Use</h1>
        <p className="text-sm text-muted uppercase tracking-widest font-semibold">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-invert prose-brand max-w-none text-secondary">
        <p className="lead text-lg mb-8 text-primary">
          Welcome to Novara. These Terms of Use govern your access to and use of our multi-vendor marketplace platform, applications, and services. Please read them carefully.
        </p>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">1.</span> Acceptance of Terms
          </h2>
          <p className="mb-4">
            By creating an account, accessing, or using the Novara platform, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the platform. These Terms constitute a legally binding agreement between you and the developers/operators of Novara ("Company", "we", "us", or "our").
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">2.</span> Marketplace Role & Disclaimer
          </h2>
          <p className="mb-4">
            Novara acts exclusively as a marketplace facilitator, providing a venue for independent vendors ("Vendors") and buyers ("Buyers") to negotiate and complete transactions. 
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>No Agency:</strong> We are not a party to the actual transactions between Buyers and Vendors. We do not manufacture, store, or inspect any of the items sold through our platform.</li>
            <li><strong>No Guarantee:</strong> We cannot guarantee the true identity, age, or nationality of a user, nor can we guarantee the quality, safety, morality, or legality of any products listed.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">3.</span> User Generated Content & Intellectual Property
          </h2>
          <p className="mb-4">
            Users may post products, reviews, videos, and other content ("User Content"). You retain all rights in, and are solely responsible for, the User Content you post.
          </p>
          <p className="mb-4">
            By posting User Content, you grant Novara a non-exclusive, worldwide, royalty-free, irrevocable, sub-licensable, perpetual license to use, display, edit, modify, reproduce, distribute, store, and prepare derivative works of your User Content to provide and promote the services.
          </p>
          <p className="mb-4 text-primary font-semibold">
            We are not responsible for copyright or intellectual property infringements committed by users. We reserve the right to remove any content that violates applicable laws or these Terms without prior notice.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">4.</span> Escrow & Payments
          </h2>
          <p className="mb-4">
            To ensure trust, Novara holds Buyer funds in an escrow-like mechanism until the transaction is confirmed or the designated delivery timeframe expires. Novara is not a bank or money services business (MSB). Payment processing is provided by third-party payment gateways. You agree to their respective terms of service when utilizing checkout features.
          </p>
        </section>

        <section className="mb-10 p-6 rounded-2xl bg-surface-2 border border-border">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">5.</span> Limitation of Liability
          </h2>
          <p className="mb-4 font-bold uppercase tracking-wide text-xs">Read Carefully:</p>
          <p className="mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOVARA, ITS DEVELOPERS, DIRECTORS, AND EMPLOYEES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES;</li>
            <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES;</li>
            <li>ANY TRANSACTIONS EXECUTED THROUGH THE PLATFORM;</li>
            <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">6.</span> Indemnification
          </h2>
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless Novara, its developers, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) arising from: (i) your use of and access to the Service; (ii) your violation of any term of these Terms; (iii) your violation of any third-party right, including without limitation any copyright, property, or privacy right.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-brand">7.</span> Termination
          </h2>
          <p className="mb-4">
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
          </p>
        </section>
      </div>
    </div>
  )
}
