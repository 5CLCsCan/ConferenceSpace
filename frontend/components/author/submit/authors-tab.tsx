"use client"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

interface Author {
  name: string
  email: string
  affiliation: string
}

interface AuthorsTabProps {
  authors: Author[]
  setAuthors: (value: Author[]) => void
  isCorresponding: boolean
  setIsCorresponding: (value: boolean) => void
}

export function AuthorsTab({
  authors,
  setAuthors,
  isCorresponding,
  setIsCorresponding,
}: AuthorsTabProps) {
  const handleAddAuthor = () => {
    setAuthors([...authors, { name: "", email: "", affiliation: "" }])
  }

  const handleUpdateAuthor = (index: number, field: keyof Author, value: string) => {
    const updated = [...authors]
    updated[index][field] = value
    setAuthors(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Authors & Affiliations</h2>
        <p className="text-sm text-gray-600">Add all co-authors in the correct order</p>
      </div>
      <div className="space-y-4">
        {authors.map((author, index) => (
          <div key={index} className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Author {index + 1} - Full name</Label>
              <Input
                placeholder="Full name"
                value={author.name}
                onChange={(e) => handleUpdateAuthor(index, "name", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Email</Label>
              <Input
                type="email"
                placeholder="Email"
                value={author.email}
                onChange={(e) => handleUpdateAuthor(index, "email", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Organization / Institution</Label>
              <Input
                placeholder="Organization / Institution"
                value={author.affiliation}
                onChange={(e) => handleUpdateAuthor(index, "affiliation", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleAddAuthor}
        className="w-full bg-transparent"
      >
        <Plus className="size-4 mr-2" />
        Add Co-Author
      </Button>
      <div className="flex items-center space-x-2 pt-4 border-t">
        <Checkbox
          id="corresponding"
          checked={isCorresponding}
          onCheckedChange={(checked) => setIsCorresponding(checked === true)}
        />
        <label
          htmlFor="corresponding"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I am the corresponding author
        </label>
      </div>
    </div>
  )
}
