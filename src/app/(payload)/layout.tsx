import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import '@payloadcms/next/css'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  return RootLayout({ children, config, importMap, serverFunction })
}
