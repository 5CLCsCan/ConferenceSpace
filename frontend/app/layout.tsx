import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { TranslationProvider } from "@/lib/i18n/translation-context"
import { ChatbotProvider, Chatbot } from "@/components/chatbot"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="antialiased overflow-hidden h-screen" suppressHydrationWarning>
        <TranslationProvider>
          <AuthProvider>
            <ChatbotProvider>
              <div className="flex h-screen overflow-hidden">
                <main className="flex-1 transition-all duration-300 ease-out overflow-y-auto overflow-x-hidden">
                  {children}
                </main>
                <Chatbot />
              </div>
              <Toaster />
            </ChatbotProvider>
          </AuthProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}
