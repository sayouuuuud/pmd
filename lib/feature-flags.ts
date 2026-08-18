export type FeatureFlags = {
  stable: {
    workspace: true
    projectUpdatesPricing: true
    personalSuggestions: true
  }
  experimental: {
    twoFactor: boolean
    clientPortal: boolean
    clientCredentials: boolean
    workspaceSharing: boolean
    resourceLibrary: boolean
    billing: boolean
    windowsAgent: boolean
    windowsSensitiveCollection: boolean
  }
}

function isEnabled(value: string | undefined) {
  return value === '1' || value === 'true'
}

/**
 * Public, non-secret product switches. These flags are UX gates only; they
 * never replace session checks, ownership checks, or server authorization.
 * Experimental capabilities are disabled unless explicitly enabled.
 */
export const featureFlags: FeatureFlags = Object.freeze({
  stable: {
    workspace: true,
    projectUpdatesPricing: true,
    personalSuggestions: true,
  },
  experimental: {
    twoFactor: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_2FA),
    clientPortal: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_CLIENT_PORTAL),
    clientCredentials: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_CLIENT_CREDENTIALS),
    workspaceSharing: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WORKSPACE_SHARING),
    resourceLibrary: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_RESOURCE_LIBRARY),
    billing: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_BILLING),
    windowsAgent: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WINDOWS_AGENT),
    windowsSensitiveCollection: isEnabled(process.env.NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WINDOWS_SENSITIVE_COLLECTION),
  },
})

export type ExperimentalFeatureName = keyof FeatureFlags['experimental']

export function isExperimentalFeatureEnabled(name: ExperimentalFeatureName) {
  return featureFlags.experimental[name]
}
