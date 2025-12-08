import type React from "react"
import type { Metadata } from "next"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { TranslationProvider } from "@/lib/i18n/translation-context"
import { ChatbotProvider, Chatbot } from "@/components/chatbot"
import { ConferenceFloatingActions } from "@/components/conference/conference-floating-actions"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Conference Management System",
  description: "AI-powered academic conference management platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="antialiased overflow-hidden h-screen" suppressHydrationWarning>
        <TranslationProvider>
          <AuthProvider>
            <ChatbotProvider>
              <div className="flex h-screen overflow-hidden">
                <main className="flex-1 transition-all duration-300 ease-out overflow-y-auto overflow-x-hidden">
                  {children}
                </main>
                <Chatbot />
                <ConferenceFloatingActions />
              </div>
              <Toaster />
            </ChatbotProvider>
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}
