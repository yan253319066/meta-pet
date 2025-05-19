import { baseSepolia } from '@reown/appkit/networks'
import { AppKit, createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'

const projectId = import.meta.env.VITE_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694" // this is a public projectId only to use on localhost
if (!projectId) {
    throw new Error('VITE_PROJECT_ID is not set')
}

/** @type {AppKit} */
let appKit;
/** @type {AppKit} */
export function initializeModal() {
    appKit = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [baseSepolia],
        projectId,
        // themeMode: theme.value,
        features: {
            analytics: true
        },
        metadata: {
            name: 'MetaPet',
            description: 'MetaPet',
            // url: 'https://metapet.info',
            url: 'https://reown.com/appkit',
            icons: ['/images/logo.png'],
        },
        themeVariables: {
            '--w3m-accent': '#00cc7d',
            '--w3m-font-size-master': '8px',
            '--w3m-button-border-radius': '20px',
            '--w3m-button-hover-highlight-border-radius': '20px',
            '--w3m-button-hover-highlight': 'linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%)',
            '--w3m-button-background': 'linear-gradient(135deg, var(--mt-primary) 0%, var(--mt-primary-dark) 100%)',
            '--w3m-button-hover-background': 'linear-gradient(135deg, var(--mt-primary-dark) 0%, var(--mt-primary) 100%)',
            '--w3m-button-text-color': 'var(--mt-bg)',
            '--w3m-button-hover-text-color': 'var(--mt-bg)',
            '--w3m-button-font-weight': '600',
            '--w3m-button-letter-spacing': '0.5px',
            '--w3m-button-box-shadow': '0 4px 12px rgba(0, 0, 0, 0.1)',
            '--w3m-button-hover-box-shadow': '0 6px 16px rgba(0, 0, 0, 0.15)',
            '--w3m-button-transform': 'translateY(-1px)',
            '--w3m-button-transition': 'all 0.3s ease',
            '--w3m-button-padding': '0 1.5rem',
            '--w3m-button-height': '36px',
            '--w3m-button-mobile-height': '32px',
            '--w3m-button-mobile-padding': '0 1rem',
            '--w3m-button-mobile-font-size': '0.85rem'
        }
    })
    return appKit;
}
export { appKit }