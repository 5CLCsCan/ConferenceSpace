"use client"

import { Button } from "@/components/ui/button"
import { Search, Bell, Menu } from "lucide-react"
import { useState } from "react"

export function PlatformHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-muted border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-primary">ConferenceHub</h1>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
                Conferences
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
                Users
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
                System Settings
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
                Help Center
              </a>
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
            <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              A
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm font-medium text-primary py-2">
                Dashboard
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground py-2">
                Conferences
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground py-2">
                Users
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground py-2">
                System Settings
              </a>
              <a href="#" className="text-sm font-medium text-secondary hover:text-foreground py-2">
                Help Center
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
