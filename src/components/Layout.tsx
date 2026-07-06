import type { PropsWithChildren } from 'react'
import { Header } from './Header'

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}