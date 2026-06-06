import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { assets } from '../assets/assets'
import { Ticket, UserCircle, Armchair, Popcorn, CreditCard, CheckCircle, ChevronDown, Star, Zap, Play } from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const problemRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    
    target: problemRef,
    offset: ["start start", "end end"]
  })

  // Transform values for sticky scroll animations
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0])
  const scene2Opacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5, 0.6], [0, 1, 1, 0])
  const scene3Opacity = useTransform(scrollYProgress, [0.5, 0.65, 0.8], [0, 1, 1])
  
  const scene1Y = useTransform(scrollYProgress, [0, 0.3], [0, -50])
  const scene2Y = useTransform(scrollYProgress, [0.2, 0.35], [50, 0])
  const scene3Y = useTransform(scrollYProgress, [0.5, 0.65], [50, 0])

  const features = [
    {
      icon: <UserCircle className="w-8 h-8" />,
      title: "Quick Login",
      desc: "Sign in with one tap",
      span: "col-span-1"
    },
    {
      icon: <Armchair className="w-8 h-8" />,
      title: "Select Your Seats",
      desc: "Real-time seat selection with live availability",
      span: "col-span-1 md:col-span-2"
    },
    {
      icon: <Popcorn className="w-8 h-8" />,
      title: "Add Snacks",
      desc: "Pre-order beverages & popcorn",
      span: "col-span-1"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Pay Online",
      desc: "Secure UPI, Cards & Wallets",
      span: "col-span-1 md:col-span-2"
    },
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Get E-Ticket",
      desc: "Instant QR code on your phone",
      span: "col-span-1 md:col-span-2"
    }
  ]

  return (
    <div ref={containerRef} className="bg-[#09090B] text-white font-outfit overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO - THE SETUP
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1636337897543-83b55150608f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwzfHxtb3ZpZSUyMHRoZWF0ZXIlMjBxdWV1ZSUyMGNyb3dkfGVufDB8fHx8MTc3NTYyODc5M3ww&ixlib=rb-4.1.0&q=85)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-[#09090B]/80 to-[#09090B]" />
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F84565]/10 blur-[150px] pointer-events-none" />

        <div className="relative z-10 px-6 md:px-12 lg:px-24 text-left max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 bg-[#F84565]/10 border border-[#F84565]/30 text-[#F84565] px-4 py-2 rounded-full text-sm font-medium mb-6" data-testid="hero-badge">
              <Zap className="w-4 h-4" /> Friday Night Special
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.95] mb-6"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: -0.8, delay: 0.4 }}
            data-testid="hero-title"
          >
            <span className="text-white">Friday Night.</span>
            <br />
            <span className="text-[#F84565]">You've Got Plans.</span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-[#A1A1AA] font-light tracking-wide max-w-xl mb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            data-testid="hero-subtitle"
          >
            Your friends are waiting. The blockbuster is calling. 
            But the queue? That's where the story gets complicated. Let's rewrite the script.
          </motion.p>

          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <button 
              onClick={() => navigate('/home')} // 🚨 UPDATED ROUTE
              className="group flex items-center gap-3 bg-[#F84565] text-white font-bold tracking-wide rounded-full px-8 py-4 hover:bg-[#ff5a77] transition-all hover:shadow-[0_0_30px_rgba(248,69,101,0.5)] hover:-translate-y-1"
              data-testid="hero-cta-book"
            >
              <Ticket className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform" />
              Book Now
            </button>
            <button 
              onClick={() => navigate('/home')} // 🚨 UPDATED ROUTE
              className="flex items-center gap-3 bg-white/5 border border-white/10 text-white font-bold tracking-wide rounded-full px-8 py-4 hover:bg-white/10 transition-all backdrop-blur-md"
              data-testid="hero-cta-explore"
            >
              <Play className="w-5 h-5" />
              Explore Movies
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#A1A1AA]"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: THE PROBLEM (STICKY SCROLL STORYTELLING)
      ═══════════════════════════════════════════════════════════ */}
      <section ref={problemRef} className="relative h-[300vh]" data-testid="problem-section">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          
          {/* Scene 1: The Rush */}
          <motion.div 
            className="absolute inset-0 flex items-center"
            style={{ opacity: scene1Opacity, y: scene1Y }}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1636337897543-83b55150608f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwzfHxtb3ZpZSUyMHRoZWF0ZXIlMjBxdWV1ZSUyMGNyb3dkfGVufDB8fHx8MTc3NTYyODc5M3ww&ixlib=rb-4.1.0&q=85)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-[#09090B]/90 to-transparent" />
            <div className="relative z-10 px-6 md:px-12 lg:px-24 max-w-4xl">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase text-white mb-4" data-testid="problem-scene1-title">
                The Rush.
              </h2>
              <p className="text-xl md:text-2xl text-[#A1A1AA] font-light">
                Everyone's heading to the theater. Traffic is brutal. You're already running late.
              </p>
            </div>
          </motion.div>

          {/* Scene 2: The Queue */}
          <motion.div 
            className="absolute inset-0 flex items-center"
            style={{ opacity: scene2Opacity, y: scene2Y }}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1760835513867-58491f482b18?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxzb2xkJTIwb3V0JTIwc2lnbnxlbnwwfHx8fDE3NzU2Mjg4MDl8MA&ixlib=rb-4.1.0&q=85)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-[#09090B]/90 to-transparent" />
            <div className="relative z-10 px-6 md:px-12 lg:px-24 max-w-4xl">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase text-white mb-4" data-testid="problem-scene2-title">
                The Endless Queue.
              </h2>
              <p className="text-xl md:text-2xl text-[#A1A1AA] font-light">
                A massive line wraps around the block. The show starts in 10 minutes. Panic sets in.
              </p>
            </div>
          </motion.div>

          {/* Scene 3: Counter Closed */}
          <motion.div 
            className="absolute inset-0 flex items-center"
            style={{ opacity: scene3Opacity, y: scene3Y }}
          >
            <div className="absolute inset-0 bg-[#09090B]" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-950/30 via-transparent to-transparent" />
            <div className="relative z-10 px-6 md:px-12 lg:px-24 max-w-4xl">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-4" data-testid="problem-scene3-title">
                <span className="text-red-500">SOLD OUT.</span>
                <br />
                <span className="text-[#A1A1AA]">Counter Closed.</span>
              </h2>
              <p className="text-xl md:text-2xl text-[#A1A1AA] font-light">
                The worst nightmare. Tickets vanished while you waited. Plans ruined.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: THE SOLUTION - APP REVEAL
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center py-24 md:py-32 overflow-hidden" data-testid="solution-section">
        {/* Massive Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#F84565]/20 blur-[200px] pointer-events-none" />
        
        <div className="relative z-10 px-6 md:px-12 lg:px-24 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Notification Badge */}
            <motion.div 
              className="inline-flex items-center gap-3 bg-black/60 border border-[#F84565]/40 rounded-2xl px-6 py-4 mb-8 shadow-[0_0_40px_rgba(248,69,101,0.3)]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              data-testid="app-notification"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F84565] flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" /> Booking Confirmed
                </p>
                <p className="text-white font-semibold">2x VIP Seats - Friday 8PM</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <img src={assets.logo} alt="EventXpress" className="h-16 md:h-20 mx-auto filter drop-shadow-[0_0_30px_rgba(248,69,101,0.5)]" data-testid="solution-logo" />
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            data-testid="solution-title"
          >
            <span className="text-white">Enter</span>{" "}
            <span className="text-[#F84565]">EventXpress.</span>
          </motion.h2>

          <motion.p 
            className="text-xl md:text-2xl text-[#A1A1AA] font-light tracking-wide mb-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            data-testid="solution-subtitle"
          >
            Book tickets in a heartbeat, straight from your browser. Zero queues. All excitement.
          </motion.p>

          <motion.button 
            onClick={() => navigate('/home')} // 🚨 UPDATED ROUTE
            className="group flex items-center gap-3 bg-[#F84565] text-white font-bold tracking-wide rounded-full px-10 py-5 text-lg hover:bg-[#ff5a77] transition-all hover:shadow-[0_0_40px_rgba(248,69,101,0.5)] hover:-translate-y-1 mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            data-testid="solution-cta"
          >
            <Ticket className="w-6 h-6 group-hover:rotate-[-10deg] transition-transform" />
            Start Booking
          </motion.button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: FEATURES - BENTO GRID
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-6 md:px-12 lg:px-24" data-testid="features-section">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-left mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-4" data-testid="features-title">
              <span className="text-white">Seamless Flow.</span>
              <br />
              <span className="text-[#F84565]">Zero Friction.</span>
            </h2>
            <p className="text-lg text-[#A1A1AA] font-light max-w-xl">
              From login to ticket - every step designed for speed.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className={`${feature.span} bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:-translate-y-2 hover:border-[#F84565]/30 hover:shadow-[0_0_30px_rgba(248,69,101,0.1)] transition-all duration-300 group cursor-pointer`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                data-testid={`feature-card-${idx}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F84565]/10 border border-[#F84565]/30 flex items-center justify-center text-[#F84565] mb-6 group-hover:bg-[#F84565] group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A1A1AA] font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: SOCIAL PROOF & FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden" data-testid="cta-section">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1650475958723-e8d850c26f67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHRoZWF0ZXIlMjBxdWV1ZSUyMGNyb3dkfGVufDB8fHx8MTc3NTYyODc5M3ww&ixlib=rb-4.1.0&q=85)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/80 to-[#09090B]" />

        <div className="relative z-10 px-6 md:px-12 lg:px-24 w-full max-w-6xl mx-auto">
          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {[
              { value: "50K+", label: "Happy Customers" },
              { value: "50+", label: "Partner Theaters" },
              { value: "4.8", label: "User Rating", icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
              { value: "24/7", label: "Support" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center" data-testid={`stat-${idx}`}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl md:text-4xl font-black text-white">{stat.value}</span>
                  {stat.icon}
                </div>
                <p className="text-sm text-[#A1A1AA] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Main CTA */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-6" data-testid="cta-title">
              <span className="text-white">Join Thousands</span>
              <br />
              <span className="text-[#F84565]">Enjoying The Show.</span>
            </h2>
            <p className="text-xl text-[#A1A1AA] font-light mb-10 max-w-2xl mx-auto" data-testid="cta-subtitle">
              Skip the line. Secure your tickets instantly online and never miss a premiere again.
            </p>

            <motion.button 
              onClick={() => navigate('/home')} // 🚨 UPDATED ROUTE
              className="mt-6 group flex items-center gap-3 bg-[#F84565] text-white font-bold tracking-wide rounded-full px-12 py-5 text-xl hover:bg-[#ff5a77] transition-all hover:shadow-[0_0_40px_rgba(248,69,101,0.5)] hover:-translate-y-1 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="cta-book-now"
            >
              <Ticket className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
              Get Your Tickets Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER BAR
      ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 py-8 px-6 md:px-12 lg:px-24" data-testid="landing-footer">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={assets.logo} alt="Show" className="h-8" />
            <span className="text-sm text-[#A1A1AA]">© 2026 EventXpress. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing