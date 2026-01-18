"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Sparkles,
  Brain,
  Network,
  FileSearch,
  Users2,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n/translation-context"
import { LanguageSwitcher } from "@/components/language-switcher"

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// Floating particles background
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
          }}
          animate={{
            x: [null, Math.random() * 1200, Math.random() * 1200],
            y: [null, Math.random() * 800, Math.random() * 800],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 15 + Math.random() * 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

// Glowing orb component
function GlowingOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      style={{
        background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
      }}
    />
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description:
        "Intelligent reviewer assignment using expertise graphs and conflict detection algorithms.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: Network,
      title: "Knowledge Graphs",
      description:
        "Neo4j-powered relationship mapping for comprehensive COI analysis and collaboration networks.",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      icon: FileSearch,
      title: "Smart Paper Analysis",
      description:
        "Automated quality checks, topic extraction, and desk rejection screening.",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      icon: Shield,
      title: "COI Detection",
      description:
        "Multi-layered conflict of interest identification across institutional and co-authorship networks.",
      gradient: "from-orange-500 to-red-600",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description:
        "Live dashboards tracking submission flow, review progress, and decision metrics.",
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: Users2,
      title: "Role-based Workflows",
      description:
        "Tailored experiences for authors, reviewers, and conference chairs.",
      gradient: "from-amber-500 to-yellow-600",
    },
  ]

  const stats = [
    { value: 10000, label: "Papers Processed", suffix: "+" },
    { value: 50, label: "Conferences", suffix: "+" },
    { value: 95, label: "Assignment Accuracy", suffix: "%" },
    { value: 24, label: "Hour Support", suffix: "/7" },
  ]

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* Navigation */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-cyan-400 rounded-xl rotate-6 group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 bg-[#030712] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
            </div>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Conference<span className="text-primary">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#stats"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Stats
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 text-white border-0">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20">
        <GridBackground />
        <ParticleField />
        <GlowingOrb className="w-[600px] h-[600px] -top-48 -left-48" />
        <GlowingOrb className="w-[400px] h-[400px] top-1/2 -right-48" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Powering the future of academic conferences
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
            >
              Where{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Intelligence
                </span>
              </span>
              <br />
              Meets Academia
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              The next-generation platform for managing academic conferences with
              AI-driven reviewer matching, intelligent COI detection, and real-time
              collaboration tools.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
            <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 px-8 h-14 text-base font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
              <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-14 text-base"
              >
                  Explore Features
              </Button>
            </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/40"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>GDPR Ready</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/40"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <GlowingOrb className="w-[500px] h-[500px] top-0 left-1/4" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">
              Capabilities
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Built for Modern Academia
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Every tool you need to run a world-class conference, powered by
              cutting-edge AI and knowledge graph technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm h-full">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">
              Workflow
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Streamlined Process
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              From paper submission to final decisions, every step is optimized for
              efficiency and fairness.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent hidden lg:block" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Submit",
                  description: "Authors submit papers with automatic format validation and plagiarism checks.",
                },
                {
                  step: "02",
                  title: "Analyze",
                  description: "AI extracts topics, identifies expertise requirements, and flags potential COIs.",
                },
                {
                  step: "03",
                  title: "Assign",
                  description: "Smart matching algorithm assigns optimal reviewers based on expertise graphs.",
                },
                {
                  step: "04",
                  title: "Decide",
                  description: "Aggregated insights help chairs make informed, unbiased decisions.",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative text-center"
                >
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{item.step}</span>
                    </div>
                    {index < 3 && (
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 hidden lg:flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-white/20" />
            </div>
                    )}
            </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-32">
        <GlowingOrb className="w-[400px] h-[400px] bottom-0 right-0" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
              </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-cyan-500/20 to-primary/20 p-[1px]"
          >
            <div className="relative rounded-3xl bg-[#030712] px-8 py-16 sm:px-16 sm:py-24 text-center">
              <GlowingOrb className="w-[600px] h-[600px] -top-48 left-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                  Ready to Transform Your Conference?
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto text-lg mb-10">
                  Join leading academic institutions using ConferenceAI to deliver
                  exceptional conference experiences.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 px-8 h-14 text-base font-semibold"
                    >
                      Start Your Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 h-14 text-base"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-cyan-400 rounded-lg rotate-6" />
                <div className="absolute inset-0 bg-[#030712] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              <span className="font-semibold">ConferenceAI</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>

            <div className="text-sm text-white/40">
              © {new Date().getFullYear()} ConferenceAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
