import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Zap, Globe, Phone, AlertCircle, MapPin, MessageSquare } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Shield className="h-20 w-20 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Stay Safe with <span className="text-primary">Disha AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered disaster response assistant providing real-time alerts, emergency guidance,
            and instant SOS support.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Disha AI?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Real-Time Alerts"
              description="Receive instant notifications about disasters in your area based on your location"
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="AI Guidance"
              description="Get context-aware safety protocols and evacuation advice from our AI assistant"
            />
            <FeatureCard
              icon={<Phone className="h-8 w-8" />}
              title="One-Tap SOS"
              description="Emergency button to instantly alert responders and your emergency contacts"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Multilingual Support"
              description="Safety guidance available in 15+ languages for global accessibility"
            />
            <FeatureCard
              icon={<MapPin className="h-8 w-8" />}
              title="Offline Maps"
              description="Access emergency resources and evacuation routes even without internet"
            />
            <FeatureCard
              icon={<AlertCircle className="h-8 w-8" />}
              title="Risk Assessment"
              description="AI-powered risk analysis based on your location and nearby disasters"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Account"
              description="Sign up and set your location to receive personalized alerts"
            />
            <StepCard
              number="2"
              title="Get Alerts"
              description="Receive real-time notifications about disasters near you"
            />
            <StepCard
              number="3"
              title="Stay Safe"
              description="Follow AI guidance, find resources, and use SOS if needed"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Stay Safe?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust Disha AI for disaster preparedness
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
