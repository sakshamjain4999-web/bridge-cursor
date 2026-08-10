'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient()

    // Determine the site URL dynamically based on host headers
    const hostHeader = (await headers()).get('host')
    const protocol = hostHeader?.includes('localhost') ? 'http' : 'https'
    const siteUrl = `${protocol}://${hostHeader}`

    // Use standard server-side resetPasswordForEmail with a redirect to the callback
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Password reset action error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected network error occurred. Please try again.',
    }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Password update action error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating password.',
    }
  }
}