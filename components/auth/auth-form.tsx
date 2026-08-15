'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const requestedNext = new URLSearchParams(window.location.search).get('next')
    const destination = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/'
    const result = mode === 'signin'
      ? await authClient.signIn.email({ email, password, callbackURL: destination })
      : await authClient.signUp.email({ name, email, password, callbackURL: destination })

    setLoading(false)
    if (result.error) {
      setError(result.error.message || 'حصل خطأ. راجع البيانات وحاول مرة أخرى.')
      return
    }
    window.location.href = destination
  }

  return <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><LockKeyhole className="h-6 w-6" /></div>
      <h1 className="text-2xl font-bold">مساحتك الشخصية</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">احفظ مهامك وملاحظاتك وخطة يومك بأمان بين أجهزتك.</p>
    </div>

    <form className="space-y-4" onSubmit={submit}>
      {mode === 'signup' && <label className="block"><span className="mb-2 block text-sm font-medium">الاسم</span><div className="relative"><UserRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input required value={name} onChange={(event) => setName(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اسمك" /></div></label>}
      <label className="block"><span className="mb-2 block text-sm font-medium">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" dir="ltr" /></div></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">كلمة المرور</span><div className="relative"><LockKeyhole className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="٨ أحرف على الأقل" dir="ltr" /></div></label>
      {error && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">{error}</div>}
      <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}{mode === 'signin' ? 'دخول إلى حسابي' : 'إنشاء الحساب'}</button>
    </form>

    <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }} className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground">{mode === 'signin' ? 'لسه معندكش حساب؟ أنشئ حساب جديد' : 'عندك حساب بالفعل؟ سجل الدخول'}</button>
  </div>
}
