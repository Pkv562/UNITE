"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { 
  Heart, 
  Activity, 
  CalendarClock, 
  Building2, 
  BellRing, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  MapPin, 
  Phone, 
  Mail,
  Droplet,
  Target,
  Zap,
  Award,
  TrendingUp,
  Globe
} from "lucide-react";

// --- Data Configuration ---
interface FeatureItem {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const FEATURES: FeatureItem[] = [
  { 
    title: "Real-Time Inventory", 
    description: "Live blood supply tracking across all partner facilities with predictive analytics for shortage prevention.", 
    icon: Activity, 
    gradient: "from-red-500 to-rose-600" 
  },
  { 
    title: "Smart Scheduling", 
    description: "Intelligent appointment system that maximizes donor convenience and operational efficiency.", 
    icon: CalendarClock, 
    gradient: "from-blue-500 to-indigo-600" 
  },
  { 
    title: "Hospital Network", 
    description: "Seamless inter-facility blood sharing with emergency protocols and real-time coordination.", 
    icon: Building2, 
    gradient: "from-emerald-500 to-teal-600" 
  },
  { 
    title: "Emergency Alerts", 
    description: "Multi-channel notification system for critical shortages and Code Red situations.", 
    icon: BellRing, 
    gradient: "from-amber-500 to-orange-600" 
  },
  { 
    title: "Community Drives", 
    description: "End-to-end blood drive management from planning to post-event analytics.", 
    icon: Users, 
    gradient: "from-purple-500 to-violet-600" 
  },
  { 
    title: "Data Security", 
    description: "Bank-grade encryption with full DOH compliance and comprehensive audit trails.", 
    icon: ShieldCheck, 
    gradient: "from-slate-600 to-slate-700" 
  },
];

const IMPACT_STATS = [
  { value: "24/7", label: "System Uptime", icon: Zap },
  { value: "100%", label: "DOH Compliant", icon: Award },
  { value: "<2min", label: "Avg Response", icon: TrendingUp },
  { value: "6+", label: "Partner Hospitals", icon: Globe },
];

const TIMELINE = [
  { 
    year: "2023", 
    quarter: "Q4",
    title: "Discovery Phase", 
    description: "Deep collaboration with BMC staff to map workflows and identify critical pain points in blood management." 
  },
  { 
    year: "2024", 
    quarter: "Q2",
    title: "Alpha Launch", 
    description: "Deployed core inventory management system with real-time sync across three pilot facilities." 
  },
  { 
    year: "2024", 
    quarter: "Q4",
    title: "Beta Expansion", 
    description: "Added donor portal, mobile app, and emergency requisition features based on frontline feedback." 
  },
  { 
    year: "2025", 
    quarter: "Q1",
    title: "Regional Scale", 
    description: "Expanding to full Bicol network with LGU partnerships and community blood drive integration." 
  },
];

const VALUES = [
  { 
    title: "Life-Centered Design", 
    description: "Every feature is built to save time in emergencies and prevent critical shortages.",
    icon: Heart
  },
  { 
    title: "Evidence-Based", 
    description: "Decisions driven by real hospital data, not assumptions. We measure what matters.",
    icon: Target
  },
  { 
    title: "Radical Transparency", 
    description: "Open data sharing, clear audit trails, and accessible reporting for all stakeholders.",
    icon: Globe
  },
];

const FeatureCard: React.FC<FeatureItem> = ({ title, description, icon: Icon, gradient }) => {
  return (
    <Card className="group border border-slate-200/60 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all duration-500 overflow-hidden bg-white relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <CardBody className="p-6 relative z-10">
        <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-red-700 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed text-sm">
          {description}
        </p>
      </CardBody>
    </Card>
  );
};

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:wght@600;700;900&display=swap');
        
        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        h1, h2, h3, .heading-font {
          font-family: 'Fraunces', Georgia, serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-red-50/30 via-white to-white">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-100/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold animate-fade-in-up opacity-0">
              <Droplet className="w-4 h-4" />
              Bicol's Blood Banking Revolution
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] animate-fade-in-up opacity-0 stagger-1">
              Technology That{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                Saves Lives
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in-up opacity-0 stagger-2">
              UNITE connects Bicol Medical Center, partner hospitals, and community donors into one intelligent ecosystem—ensuring the right blood reaches the right patient at the right time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up opacity-0 stagger-3">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                endContent={<ArrowRight size={20} />}
                onPress={() => router.push('/auth/signup')}
              >
                Join as Donor
              </Button>
              <Button 
                size="lg" 
                variant="bordered"
                className="border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all duration-300"
                onPress={() => router.push('/auth/signin')}
              >
                Hospital Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-red-500" />
              <span className="text-red-400 font-bold uppercase tracking-wider text-sm">Our Mission</span>
              <div className="h-px w-12 bg-red-500" />
            </div>
            
            <blockquote className="text-3xl md:text-4xl text-white font-bold leading-relaxed italic">
              "To eliminate preventable deaths from blood shortages by building the Philippines' most reliable, transparent, and accessible blood management network."
            </blockquote>
            
            <div className="flex flex-wrap justify-center gap-3 pt-6">
              {["Zero Waste", "Maximum Access", "Full Transparency"].map((value) => (
                <Chip 
                  key={value} 
                  className="bg-white/10 text-white border border-white/20 backdrop-blur-sm font-medium px-4 py-2"
                  variant="flat"
                >
                  {value}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Built on Principles That Matter
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every decision we make is guided by these core values
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map((value, idx) => (
              <Card 
                key={idx} 
                className="border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white overflow-hidden"
              >
                <CardBody className="p-8 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 mb-6 group-hover:scale-110 transition-transform duration-500">
                      <value.icon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 sticky top-32">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                Our Journey
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                From listening sessions with hospital staff to a regional platform serving thousands—built step by step with frontline feedback.
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-red-600">2023</div>
                  <div className="text-sm text-slate-500 font-medium">Started</div>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="text-slate-300" />
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-red-600">2025</div>
                  <div className="text-sm text-slate-500 font-medium">Today</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-7 space-y-8">
              {TIMELINE.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex gap-6 group"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {item.quarter}
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-slate-200 to-transparent mt-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-12">
                    <div className="text-sm font-bold text-red-600 mb-2">{item.year}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-red-500" />
              <span className="text-red-600 font-bold uppercase tracking-wider text-sm">Platform Capabilities</span>
              <div className="h-px w-12 bg-red-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Six Pillars of Modern Blood Banking
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Every feature designed to reduce friction, prevent waste, and save lives in emergencies
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Built for Reliability
            </h2>
            <p className="text-xl text-slate-300">
              When lives are on the line, performance isn't optional
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {IMPACT_STATS.map((stat, idx) => (
              <div 
                key={idx} 
                className="text-center group"
              >
                <div className="mb-6 flex justify-center">
                  <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                    <stat.icon className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <div className="text-5xl md:text-6xl font-black text-white mb-3 group-hover:text-red-400 transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-white rounded-full blur-3xl" />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <Heart className="w-20 h-20 text-white/80 mx-auto mb-8 animate-pulse-slow" />
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl md:text-2xl text-red-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you're a donor, hospital, or community organizer—there's a place for you in the UNITE network.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-red-700 font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
              endContent={<ArrowRight size={20} />}
              onPress={() => router.push('/auth/signup')}
            >
              Become a Donor
            </Button>
            <Button 
              size="lg" 
              variant="bordered" 
              className="border-2 border-white text-white font-bold hover:bg-white hover:text-red-700 transition-all duration-300 px-8 py-6 text-lg"
              onPress={() => router.push('/auth/signin')}
            >
              Partner with UNITE
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl">
                  <Heart className="h-6 w-6 text-white fill-current" />
                </div>
                <span className="font-black text-2xl text-white heading-font">UNITE</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md mb-6">
                Unifying Neighborhoods In Transfusion Ecosystem—modernizing blood banking across the Bicol Region through technology, transparency, and community.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="sm" 
                  variant="flat" 
                  className="bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Privacy Policy
                </Button>
                <Button 
                  size="sm" 
                  variant="flat" 
                  className="bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Terms of Use
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-6 text-lg">Quick Links</h3>
              <ul className="space-y-4">
                {[
                  { label: "About UNITE", href: "/about" },
                  { label: "Find Blood Drives", href: "/calendar" },
                  { label: "Hospital Login", action: () => router.push('/auth/signin') },
                  { label: "Donor Portal", action: () => router.push('/auth/signup') },
                ].map((link, idx) => (
                  <li key={idx}>
                    {link.href ? (
                      <a href={link.href} className="text-slate-400 hover:text-red-400 transition-colors duration-200 flex items-center gap-2 group">
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {link.label}
                      </a>
                    ) : (
                      <button onClick={link.action} className="text-slate-400 hover:text-red-400 transition-colors duration-200 flex items-center gap-2 group">
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-6 text-lg">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-slate-400 leading-relaxed">
                    Bicol Medical Center<br />
                    Naga City, Camarines Sur<br />
                    Philippines
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-red-500 flex-shrink-0" />
                  <span className="text-slate-400">(054) 472-XXXX</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={20} className="text-red-500 flex-shrink-0" />
                  <span className="text-slate-400">support@unite-ph.org</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} UNITE Project. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for Bicol</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}