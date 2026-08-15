import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto mb-8 flex w-full max-w-6xl justify-start"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowRight className="h-4 w-4" /> الرجوع للوحة التحكم</Link></div>
    <AuthForm />
  </main>
}
