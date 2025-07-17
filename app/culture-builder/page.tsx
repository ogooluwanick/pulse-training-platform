import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Culture Builder",
}

export default function CultureBuilderPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-3xl font-bold">Culture Builder</h1>
    </div>
  )
}
