import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import Script from "next/script"
import { Inter, Merriweather } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { TranslationProvider } from "@/lib/i18n/translation-context"
import { ChatbotProvider, Chatbot, ChatbotNavigationMask } from "@/components/chatbot"
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
  title: "ConferenceAI",
  description: "AI-assisted academic conference workspace",
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wr08flgvt4");
          `}
        </Script>
        <TranslationProvider>
          <AuthProvider>
            <ChatbotProvider>
              <div className="flex h-screen overflow-hidden">
                <div className="relative flex-1 overflow-hidden">
                  <main className="h-full transition-all duration-300 ease-out overflow-y-auto overflow-x-hidden">
                    {children}
                  </main>
                  <Suspense fallback={null}>
                    <ChatbotNavigationMask />
                  </Suspense>
                </div>
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
