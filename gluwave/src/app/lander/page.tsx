import { Github } from '@/components/github'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function Lander() {
  return (
    <div className="flex justify-center h-screen items-center flex-col bg-gradient-to-r from-slate-200 to-blue-100">
      <Image
        src="/full_transparent.png"
        alt="logo"
        width={1000}
        height={1000}
        style={{
          maxWidth: '40rem',
          width: '100%',
          height: 'auto',
        }}
      />
      <Link href="https://app.gluwave.com">
        <Button className="flex items-center">
          Login to Gluwave
          <ArrowRight className="h-4 ml-1" />
        </Button>
      </Link>
      <Button variant="secondary" className="mt-4">
        <Link
          className="flex items-center"
          href="https://github.com/Kalhama/Gluwave"
        >
          See in Github
          <div className="w-6 h-6 ml-2">
            <Github white />
          </div>
        </Link>
      </Button>
    </div>
  )
}
