'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { authClient } from '@/lib/auth-client'
import { featureFlags } from '@/lib/feature-flags'

function getArabicAuthError(message?: string) {
  const normalized = message?.toLowerCase() ?? ''
  if (normalized.includes('invalid_two_factor_cookie') || normalized.includes('invalid two factor cookie')) return 'انتهت جلسة التحقق بخطوتين. سجّل الدخول من جديد وابدأ التحقق مرة أخرى.'
  if (normalized.includes('invalid_backup_code') || normalized.includes('invalid backup code')) return 'رمز الاسترداد غير صحيح أو سبق استخدامه.'
  if (normalized.includes('invalid_code') || normalized.includes('invalid code') || normalized.includes('totp')) return 'رمز التحقق غير صحيح. راجع تطبيق المصادقة وحاول مرة أخرى.'
  if (normalized.includes('too_many_attempts') || normalized.includes('account_temporarily_locked')) return 'تم إيقاف محاولات التحقق مؤقتًا لأسباب أمنية. اطلب رمزًا جديدًا بعد انتهاء المهلة.'
  if (normalized.includes('already exists') || normalized.includes('already registered') || normalized.includes('user exists')) return 'هذا البريد مرتبط بحساب بالفعل. جرّب تسجيل الدخول بدلًا من إنشاء حساب جديد.'
  if (normalized.includes('invalid email') || normalized.includes('email')) return 'تأكد من كتابة بريد إلكتروني صحيح ثم حاول مرة أخرى.'
  if (normalized.includes('invalid password') || normalized.includes('incorrect') || normalized.includes('credential')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. راجع البيانات وحاول مرة أخرى.'
  if (normalized.includes('network') || normalized.includes('fetch') || normalized.includes('connection')) return 'تعذر الاتصال بالخادم الآن. تحقق من اتصالك وحاول مرة أخرى.'
  return 'تعذر إتمام العملية الآن. راجع البيانات وحاول مرة أخرى.'
}

function getSafeDestination(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [twoFactorMode, setTwoFactorMode] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorDestination, setTwoFactorDestination] = useState('/')
  const [trustDevice, setTrustDevice] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)

  useEffect(() => {
    if (!featureFlags.experimental.twoFactor) return
    const params = new URLSearchParams(window.location.search)
    const challenge = params.get('twoFactor') === '1'
    const storedDestination = window.sessionStorage.getItem('pmd-two-factor-destination')
    setTwoFactorDestination(getSafeDestination(storedDestination || params.get('next')))
    setTwoFactorMode(challenge)
  }, [])

  function clearFieldError(field: 'name' | 'email' | 'password') {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setError('')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (mode === 'signup' && !name.trim()) {
      setFieldErrors({ name: 'اكتب اسمك أولًا.' })
      return
    }
    if (!email.trim()) {
      setFieldErrors({ email: 'اكتب البريد الإلكتروني أولًا.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: 'اكتب بريدًا إلكترونيًا صحيحًا.' })
      return
    }
    if (password.length < 8) {
      setFieldErrors({ password: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل.' })
      return
    }

    setLoading(true)
    const requestedNext = new URLSearchParams(window.location.search).get('next')
    const destination = getSafeDestination(requestedNext)
    if (mode === 'signin' && featureFlags.experimental.twoFactor) {
      window.sessionStorage.setItem('pmd-two-factor-destination', destination)
    }
    const result = mode === 'signin'
      ? await authClient.signIn.email({ email, password, callbackURL: destination })
      : await authClient.signUp.email({ name, email, password, callbackURL: destination })

    setLoading(false)
    if (result.error) {
      if (mode === 'signin') window.sessionStorage.removeItem('pmd-two-factor-destination')
      setError(getArabicAuthError(result.error.message))
      return
    }
    const resultData = result.data
    const redirectedToTwoFactor = Boolean(resultData && typeof resultData === 'object' && 'twoFactorRedirect' in resultData && resultData.twoFactorRedirect)
    if (redirectedToTwoFactor) return
    window.sessionStorage.removeItem('pmd-two-factor-destination')
    router.push(destination)
  }

  async function submitTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = twoFactorCode.trim()
    setTwoFactorError('')
    if (!code) {
      setTwoFactorError('اكتب رمز التحقق أولًا.')
      return
    }
    if (!useBackupCode && !/^\d{6,8}$/.test(code)) {
      setTwoFactorError('اكتب رمز TOTP من ٦ أو ٨ أرقام.')
      return
    }
    setTwoFactorLoading(true)
    const result = useBackupCode
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice })
    setTwoFactorLoading(false)
    if (result.error) {
      setTwoFactorError(getArabicAuthError(result.error.message))
      return
    }
    window.sessionStorage.removeItem('pmd-two-factor-destination')
    router.push(twoFactorDestination)
  }

  if (twoFactorMode && featureFlags.experimental.twoFactor) {
    return <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
        <h1 className="text-2xl font-bold">تأكيد تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">أدخل الرمز من تطبيق المصادقة لإكمال الدخول إلى مساحتك.</p>
      </div>
      <form className="space-y-4" onSubmit={submitTwoFactor} noValidate>
        <label className="block" htmlFor="auth-two-factor-code"><span className="mb-2 block text-sm font-medium">{useBackupCode ? 'رمز الاسترداد' : 'رمز TOTP'}</span><Input id="auth-two-factor-code" required inputMode={useBackupCode ? 'text' : 'numeric'} value={twoFactorCode} onChange={(event) => { setTwoFactorCode(event.target.value); setTwoFactorError('') }} aria-invalid={Boolean(twoFactorError)} aria-describedby={twoFactorError ? 'auth-two-factor-error' : undefined} autoComplete="one-time-code" className="h-12 rounded-2xl px-4 text-center tracking-[0.35em]" placeholder={useBackupCode ? 'رمز الاسترداد' : '123456'} dir="ltr" /></label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} aria-label="الوثوق بهذا الجهاز لمدة ٣٠ يومًا" /> الوثوق بهذا الجهاز لمدة ٣٠ يومًا</label>
        {twoFactorError && <div id="auth-two-factor-error" role="alert" aria-live="assertive" aria-atomic="true" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">{twoFactorError}</div>}
        <Button type="submit" disabled={twoFactorLoading} className="h-12 w-full rounded-2xl px-4 text-sm font-semibold">{twoFactorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}{twoFactorLoading ? 'جاري التحقق…' : 'إكمال الدخول'}</Button>
        <Button type="button" variant="ghost" onClick={() => { setUseBackupCode((current) => !current); setTwoFactorCode(''); setTwoFactorError('') }} className="h-auto w-full rounded-2xl py-2 text-center text-sm text-muted-foreground hover:text-foreground">{useBackupCode ? 'استخدام تطبيق المصادقة بدلًا من ذلك' : 'استخدام رمز استرداد بدلًا من ذلك'}</Button>
        <Button type="button" variant="outline" onClick={() => { window.sessionStorage.removeItem('pmd-two-factor-destination'); router.replace('/login') }} className="h-11 w-full rounded-2xl">إلغاء والعودة إلى الدخول</Button>
      </form>
    </div>
  }

  return <div className="mx-auto w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><LockKeyhole className="h-6 w-6" /></div>
      <h1 className="text-2xl font-bold">مساحتك الشخصية</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">احفظ مهامك وملاحظاتك وخطة يومك بأمان بين أجهزتك.</p>
    </div>

    <form className="space-y-4" onSubmit={submit} noValidate>
      {mode === 'signup' && <label className="block" htmlFor="auth-name"><span className="mb-2 block text-sm font-medium">الاسم</span><div className="relative"><UserRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-name" required value={name} onChange={(event) => { setName(event.target.value); clearFieldError('name') }} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'auth-name-error' : undefined} autoComplete="name" className="h-12 rounded-2xl pr-10 pl-4" placeholder="اسمك" /></div>{fieldErrors.name && <p id="auth-name-error" role="alert" aria-live="assertive" aria-atomic="true" className="mt-2 text-xs text-destructive">{fieldErrors.name}</p>}</label>}
      <label className="block" htmlFor="auth-email"><span className="mb-2 block text-sm font-medium">البريد الإلكتروني</span><div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-email" required type="email" value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError('email') }} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined} autoComplete="email" className="h-12 rounded-2xl pr-10 pl-4" placeholder="you@example.com" dir="ltr" /></div>{fieldErrors.email && <p id="auth-email-error" role="alert" aria-live="assertive" aria-atomic="true" className="mt-2 text-xs text-destructive">{fieldErrors.email}</p>}</label>
      <label className="block" htmlFor="auth-password"><span className="mb-2 block text-sm font-medium">كلمة المرور</span><div className="relative"><LockKeyhole className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-password" required minLength={8} type="password" value={password} onChange={(event) => { setPassword(event.target.value); clearFieldError('password') }} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="h-12 rounded-2xl pr-10 pl-4" placeholder="٨ أحرف على الأقل" dir="ltr" /></div>{fieldErrors.password && <p id="auth-password-error" role="alert" aria-live="assertive" aria-atomic="true" className="mt-2 text-xs text-destructive">{fieldErrors.password}</p>}</label>
      {error && <div role="alert" aria-live="assertive" aria-atomic="true" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">{error}</div>}
      <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl px-4 text-sm font-semibold">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}{mode === 'signin' ? 'دخول إلى حسابي' : 'إنشاء الحساب'}</Button>
    </form>

    <Button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setFieldErrors({}) }} variant="ghost" className="mt-6 h-auto w-full rounded-2xl py-2 text-center text-sm text-muted-foreground hover:text-foreground">{mode === 'signin' ? 'لسه معندكش حساب؟ أنشئ حساب جديد' : 'عندك حساب بالفعل؟ سجل الدخول'}</Button>
  </div>
}
