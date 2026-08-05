import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oroganix.com'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about Oroganix — shipping & delivery, returns & refunds, product quality, payments, and more.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ - Frequently Asked Questions | Oroganix',
    description: 'Answers to common questions about shipping, returns, product quality, payments, and more at Oroganix.',
    type: 'website',
    url: `${SITE_URL}/faq`,
    siteName: 'Oroganix',
    images: [{ url: 'https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png', width: 1536, height: 1024, alt: 'Oroganix FAQ' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Oroganix',
    description: 'Answers to common questions about shipping, returns, product quality, payments, and more.',
    images: ['https://amzn-s3-ayurvedaeccom-bucket.s3.ap-south-1.amazonaws.com/importantlinks/logoayurveda.png'],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Are your products 100% natural and organic?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, all our products are sourced directly from certified organic farms. Each product undergoes rigorous quality testing to ensure it meets our high standards.' } },
    { '@type': 'Question', name: 'How do you ensure the quality of your Ayurvedic herbs?', acceptedAnswer: { '@type': 'Answer', text: 'We source our herbs from trusted suppliers and test each batch in certified labs for purity, potency, and absence of contaminants. We provide certificates of analysis for our premium products.' } },
    { '@type': 'Question', name: 'What is the shelf life of your products?', acceptedAnswer: { '@type': 'Answer', text: 'Most dry fruits and dehydrated products have a shelf life of 12 months. Ayurvedic herbs typically last 18-24 months. Each product is clearly labeled with manufacturing and expiry dates.' } },
    { '@type': 'Question', name: 'Do you add any preservatives or additives?', acceptedAnswer: { '@type': 'Answer', text: 'No. We do not add any artificial preservatives, colors, or flavors. Our products are 100% natural and minimally processed.' } },
    { '@type': 'Question', name: 'How long does delivery take?', acceptedAnswer: { '@type': 'Answer', text: 'Standard delivery takes 3-5 business days within India. Express delivery is available in major cities and takes 1-2 business days.' } },
    { '@type': 'Question', name: 'Do you offer free shipping?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, we offer free shipping on all orders above ₹499. For orders below ₹499, a nominal shipping fee applies.' } },
    { '@type': 'Question', name: 'Can I track my order?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Once your order is shipped, you will receive a tracking number via email and SMS. You can track your package on our website or the courier website in real-time.' } },
    { '@type': 'Question', name: 'What payment methods do you accept?', acceptedAnswer: { '@type': 'Answer', text: 'We accept Credit/Debit cards, UPI, Net Banking, Wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery (COD).' } },
    { '@type': 'Question', name: 'Is it safe to use my credit/debit card on your site?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. We use SSL encryption and secure payment gateways (Razorpay) to ensure your payment information is always safe.' } },
    { '@type': 'Question', name: 'What is your return policy?', acceptedAnswer: { '@type': 'Answer', text: 'We offer a 30-day return policy for unopened products in their original packaging. If you are not satisfied, you can return it for a full refund or exchange.' } },
    { '@type': 'Question', name: 'How long does it take to process a refund?', acceptedAnswer: { '@type': 'Answer', text: 'Once we receive your returned item, we process the refund within 5-7 business days to your original payment method.' } },
    { '@type': 'Question', name: 'Do I need an account to place an order?', acceptedAnswer: { '@type': 'Answer', text: 'No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, and enjoy faster checkout.' } },
    { '@type': 'Question', name: 'How can I contact customer support?', acceptedAnswer: { '@type': 'Answer', text: 'You can reach us via email at support@oroganix.com or through the contact page on our website. We are available Monday to Saturday, 9 AM to 6 PM.' } },
  ],
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  )
}
