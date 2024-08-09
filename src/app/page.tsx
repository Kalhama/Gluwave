import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/db'
import { insulin } from '@/schema'
import { CircleFadingPlus } from 'lucide-react'

export function ButtonWithIcon() {
  return (
    <Button>
      <CircleFadingPlus className="h-4 w-4 mr-2" /> Add insulin
    </Button>
  )
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonWithIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add insulin</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Input id="time" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" defaultValue="@" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default async function App() {
  const results = await db.select().from(insulin)

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center gap-4">
      <ul>
        {results.map((i) => {
          return (
            <li key={i.id}>
              {i.timestamp.toLocaleTimeString()} - {i.injected}
            </li>
          )
        })}
      </ul>

      <DialogDemo />
    </main>
  )
}
