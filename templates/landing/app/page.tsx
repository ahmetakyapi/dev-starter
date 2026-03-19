'use client'

import dynamic from 'next/dynamic'
import Header      from '@/components/layout/Header'
import Footer      from '@/components/layout/Footer'
import Hero        from '@/components/sections/Hero'
import Logos       from '@/components/sections/Logos'
import Features    from '@/components/sections/Features'
import HowItWorks  from '@/components/sections/HowItWorks'
import Metrics     from '@/components/sections/Metrics'
import Testimonials from '@/components/sections/Testimonials'
import Pricing     from '@/components/sections/Pricing'
import CtaSection  from '@/components/sections/CTA'
import CustomCursor from '@/components/CustomCursor'

// Three.js SSR disabled — mistakes.md #2
const SceneBackground = dynamic(() => import('@/components/SceneBackground'), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  return (
    <>
      <CustomCursor />
      <SceneBackground />
      <Header />
      <main>
        <Hero />
        <Logos />
        <Features />
        <HowItWorks />
        <Metrics />
        <Testimonials />
        <Pricing />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
