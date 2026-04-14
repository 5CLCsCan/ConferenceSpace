import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

describe("shared design-system foundation", () => {
  it("exposes spec-backed semantic classes on shared primitives", () => {
    render(
      <div>
        <Button>Primary action</Button>
        <Button variant="outline">Secondary action</Button>
        <Button variant="ghost" size="icon" aria-label="Icon action">
          i
        </Button>
        <Badge>Neutral badge</Badge>
        <Input placeholder="Standard input" />
        <Select defaultValue="alpha">
          <SelectTrigger aria-label="Dense select" size="sm">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
        </Card>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>,
    )

    expect(screen.getByRole("button", { name: "Primary action" })).toHaveClass("button-primary")
    expect(screen.getByRole("button", { name: "Secondary action" })).toHaveClass("button-secondary")
    expect(screen.getByRole("button", { name: "Icon action" })).toHaveClass("control-dense")
    expect(screen.getByText("Neutral badge")).toHaveClass("badge-neutral")
    expect(screen.getByPlaceholderText("Standard input")).toHaveClass(
      "control-standard",
      "text-body",
    )
    expect(screen.getByRole("combobox", { name: "Dense select" })).toHaveClass("control-dense")
    expect(screen.getByText("Card title")).toHaveClass("text-card-header")
    expect(screen.getByText("Card description")).toHaveClass("text-supporting")
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveClass("text-ui-meta")
    expect(screen.getByText("Header")).toHaveClass("text-table-header")
  })

  it("maps button variants to semantic roles", () => {
    expect(buttonVariants({ variant: "default" })).toContain("button-primary")
    expect(buttonVariants({ variant: "outline" })).toContain("button-secondary")
    expect(buttonVariants({ variant: "ghost", size: "icon" })).toContain("control-dense")
  })
})
