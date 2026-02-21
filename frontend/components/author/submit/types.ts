export type StepType = "paper" | "authors" | "file" | "coi" | "review"

export interface Author {
  id: string
  firstName: string
  lastName: string
  email: string
  affiliation: string
  country: string
  isCorresponding: boolean
}
