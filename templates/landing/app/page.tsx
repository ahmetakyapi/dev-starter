'use client'

import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
// import Pricing from '@/components/sections/Pricing'   // Fiyatlandırma — aktif et
import CTA from '@/components/sections/CTA'
import CustomCursor from '@/components/CustomCursor'

// Three.js SSR değil — mistakes.md #2
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
        <Features />
        {/* <Pricing /> */}
        <CTA />
      </main>
      <Footer />
    </>
  )
}
