
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Button variant="outline" asChild className="mb-8 group">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-muted-foreground">
          <p>Your privacy is important to us. It is Flarebee's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">1. Information We Collect</h2>
          <p>Log data: When you visit our website, our servers may automatically log the standard data provided by your web browser. It may include your computer’s Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, and other details.</p>
          <p>Device data: We may also collect data about the device you’re using to access our website. This data may include the device type, operating system, unique device identifiers, device settings, and geo-location data.</p>
          <p>Personal information: We may ask for personal information, such as your: Name, Email, Social media profiles, Date of birth, Phone/mobile number, Home/Mailing address, Work address, Payment information.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">2. Legal Bases for Processing</h2>
          <p>We will process your personal information lawfully, fairly and in a transparent manner. We collect and process information about you only where we have legal bases for doing so.</p>
          <p>These legal bases depend on the services you use and how you use them, meaning we collect and use your information only where:</p>
          <ul>
            <li>it’s necessary for the performance of a contract to which you are a party or to take steps at your request before entering into such a contract (for example, when we provide a service you request from us);</li>
            <li>it satisfies a legitimate interest (which is not overridden by your data protection interests), such as for research and development, to market and promote our services, and to protect our legal rights and interests;</li>
            <li>you give us consent to do so for a specific purpose (for example, you might consent to us sending you our newsletter); or</li>
            <li>we need to process your data to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">3. Use of Information</h2>
          <p>We may use a combination of information collected from you and from third parties for purposes including to provide, personalize, and improve your experience, to communicate with you, for security and fraud prevention, and to comply with our legal obligations. We may use your information to:</p>
          <ul>
            <li>enable you to customize or personalize your experience of our website;</li>
            <li>contact and communicate with you;</li>
            <li>for internal record keeping and administrative purposes;</li>
            <li>for analytics, market research and business development, including to operate and improve our website, associated applications and associated social media platforms;</li>
            <li>to run competitions and/or offer additional benefits to you;</li>
            <li>for advertising and marketing, including to send you promotional information about our products and services and information about third parties that we consider may be of interest to you;</li>
            <li>to comply with our legal obligations and resolve any disputes that we may have.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">4. Security of Your Personal Information</h2>
          <p>When we collect and process personal information, and while we retain this information, we will protect it within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
          <p>Although we will do our best to protect the personal information you provide to us, we advise that no method of electronic transmission or storage is 100% secure and no one can guarantee absolute data security. We will comply with laws applicable to us in respect of any data breach.</p>

          <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">5. Changes to This Policy</h2>
          <p>At our discretion, we may change our privacy policy to reflect current acceptable practices. We will take reasonable steps to let users know about changes via our website. Your continued use of this site after any changes to this policy will be regarded as acceptance of our practices around privacy and personal information.</p>
          
          <p className="mt-8">
            <em>This is a placeholder Privacy Policy page. Please replace this with your actual policy.</em>
          </p>
          <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
