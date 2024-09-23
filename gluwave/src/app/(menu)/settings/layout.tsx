import { Separator } from '@/components/ui/separator'
import { Metadata } from 'next'
import React from 'react'

import { SidebarNav } from './sidebar-nav'
import { Typography } from './typography'

export const metadata: Metadata = {
  title: 'Gluwave - Settings',
  description: 'Adjust your application settings',
}

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings',
  },
  {
    title: 'API Keys',
    href: '/settings/api',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-5xl mx-auto sm:px-4">
      <div className="p-4  mt-6 bg-white rounded-xl border shadow pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-0.5">
            <Typography variant="h2">Settings</Typography>
            <p className="text-muted-foreground">
              Manage your application settings.
            </p>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col sm:flex-row sm:space-x-12">
            <SidebarNav className="sm:w-1/3" items={sidebarNavItems} />
            <Separator className="my-6 sm:hidden" />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
