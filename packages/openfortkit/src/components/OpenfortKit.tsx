import { Buffer } from 'buffer';
import React, {
  ReactNode,
  createContext,
  createElement,
  useEffect,
  useState
} from 'react';
import {
  CustomAvatarProps,
  CustomTheme,
  Languages,
  Mode,
  Theme,
} from '../types';

import defaultTheme from '../styles/defaultTheme';

import { OAuthProvider, RecoveryMethod } from '@openfort/openfort-js';
import { ThemeProvider } from 'styled-components';
import { ValueOf } from 'viem/_types/types/utils';
import { WagmiContext, useAccount } from 'wagmi';
import { useChainIsSupported } from '../hooks/useChainIsSupported';
import { useChains } from '../hooks/useChains';
import {
  useConnectCallbackProps
} from '../hooks/useConnectCallback';
import { useConnector } from '../hooks/useConnectors';
import { useThemeFont } from '../hooks/useGoogleFont';
import { OpenfortProvider, OpenfortProviderProps } from '../openfort/OpenfortProvider';
import { isFamily } from '../utils/wallets';
import ConnectKitModal from './ConnectModal';
import { Web3ContextProvider } from './contexts/web3';

export const routes = {
  PROVIDERS: 'providers',
  SOCIAL_PROVIDERS: 'socialProviders',

  LOADING: 'loading',
  RECOVER: 'recover',

  EMAIL_LOGIN: 'emailLogin',
  EMAIL_SIGNUP: 'emailSignup',
  FORGOT_PASSWORD: 'forgotPassword',
  EMAIL_VERIFICATION: 'emailVerification',
  LINK_EMAIL: 'linkEmail',

  ONBOARDING: 'onboarding',
  ABOUT: 'about',

  CONNECTORS: 'connectors',
  MOBILECONNECTORS: 'mobileConnectors',


  CONNECT: 'connect',
  DOWNLOAD: 'download',
  PROFILE: 'profile',
  SWITCHNETWORKS: 'switchNetworks',
} as const;

type Connector = {
  id: string;
  type?: "wallet"
} | {
  id: OAuthProvider;
  type: "oauth";
};
type Error = string | React.ReactNode | null;

type ContextValue = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  customTheme: CustomTheme | undefined;
  setCustomTheme: React.Dispatch<React.SetStateAction<CustomTheme | undefined>>;
  lang: Languages;
  setLang: React.Dispatch<React.SetStateAction<Languages>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  route: ValueOf<typeof routes>;
  setRoute: React.Dispatch<React.SetStateAction<ValueOf<typeof routes>>>;
  connector: Connector;
  setConnector: React.Dispatch<React.SetStateAction<Connector>>;
  errorMessage: Error;
  options?: ConnectKitOptionsExtended;
  debugMode?: boolean;
  log: (...props: any) => void;
  displayError: (message: string | React.ReactNode | null, code?: any) => void;
  resize: number;
  triggerResize: () => void;
  walletConfig: FortWalletOptions;
} & useConnectCallbackProps;

export const Context = createContext<ContextValue | null>(null);

export enum AuthProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
  FACEBOOK = "facebook",

  // DISCORD = "discord",
  // EPIC_GAMES = "epic_games",
  // LINE = "line",
  // TELEGRAM = "telegram", // Telegram is not working yet

  // Extended Providers
  EMAIL = "email",
  WALLET = "wallet",
  GUEST = "guest",
}
export const socialProviders = [
  AuthProvider.GOOGLE,
  AuthProvider.TWITTER,
  AuthProvider.FACEBOOK,
]


type CommonEmbeddedSignerConfiguration = {
  /** Publishable key for the Shield API */
  shieldPublishableKey: string;
  /** Policy ID (pol_...) for the embedded signer */
  ethereumProviderPolicyId?: string;
  debug?: boolean;
}

type EncryptionSession =
  | {
    /** Function to retrieve an encryption session using a session ID */
    getEncryptionSession: () => Promise<string>;
    createEncryptedSessionEndpoint?: never;
  }
  | {
    /** API endpoint for creating an encrypted session */
    createEncryptedSessionEndpoint: string;
    getEncryptionSession?: never;
  };

/**
 * Configuration for automatic recovery, which requires an encryption session.
 */
type AutomaticRecoveryEmbeddedSignerConfiguration = {
  /** Specifies that the recovery method is automatic */
  recoveryMethod: RecoveryMethod.AUTOMATIC;
} & EncryptionSession;

type PasswordRecoveryEmbeddedSignerConfiguration = {
  /** Specifies that the recovery method is password-based */
  recoveryMethod: RecoveryMethod.PASSWORD;
} & (
    | (EncryptionSession & {
      shieldEncryptionKey?: never;
    })
    | {
      /** Required shield encryption key when no encryption session is used */
      shieldEncryptionKey: string;
      createEncryptedSessionEndpoint?: never;
      getEncryptionSession?: never;
    }
  );

/**
 * Configuration for automatic recovery.
 * - An encryption session is required.
 * 
 * Configuration for password-based recovery.
 * - An encryption session, OR
 * - A `shieldEncryptionKey` without an encryption session.
 * 
 * Encryption session can be created using either:
 * - `createEncryptedSessionEndpoint` as a string, OR
 * - `getEncryptionSession.` as a function that returns a promise.
 */
type EmbeddedSignerConfiguration = CommonEmbeddedSignerConfiguration & (
  AutomaticRecoveryEmbeddedSignerConfiguration | PasswordRecoveryEmbeddedSignerConfiguration
);

export type FortWalletOptions = {
  linkWalletOnSignUp: true;
  createEmbeddedSigner?: false;
} | {
  linkWalletOnSignUp?: boolean;
  createEmbeddedSigner: true;
  embeddedSignerConfiguration: EmbeddedSignerConfiguration;
}

export type OpenfortOptions = {
  authProviders?: AuthProvider[];
  skipEmailVerification?: boolean;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
  logo?: React.ReactNode;

  openfortUrlOverrides?: OpenfortProviderProps['overrides'];
};

export type ConnectKitOptions = {
  // language?: Languages;
  hideBalance?: boolean;
  hideTooltips?: boolean;
  // hideQuestionMarkCTA?: boolean;
  // hideNoWalletCTA?: boolean;
  hideRecentBadge?: boolean;
  walletConnectCTA?: 'link' | 'modal' | 'both';
  avoidLayoutShift?: boolean; // Avoids layout shift when the ConnectKit modal is open by adding padding to the body
  embedGoogleFonts?: boolean; // Automatically embeds Google Font of the current theme. Does not work with custom themes
  truncateLongENSAddress?: boolean;
  walletConnectName?: string;
  reducedMotion?: boolean;
  disclaimer?: ReactNode | string;
  /** Buffer Polyfill, needed for bundlers that don't provide Node polyfills (e.g CRA, Vite, etc.) */
  bufferPolyfill?: boolean;
  customAvatar?: React.FC<CustomAvatarProps>;
  initialChainId?: number;
  enforceSupportedChains?: boolean;
  // ethereumOnboardingUrl?: string;
  // walletOnboardingUrl?: string;
  // disableSiweRedirect?: boolean; // Disable redirect to SIWE page after a wallet is connected
  overlayBlur?: number; // Blur the background when the modal is open
} & OpenfortOptions;

type ConnectKitOptionsExtended = {
  language?: Languages;
  hideBalance?: boolean;
  hideTooltips?: boolean;
  hideQuestionMarkCTA?: boolean;
  hideNoWalletCTA?: boolean;
  hideRecentBadge?: boolean;
  walletConnectCTA?: 'link' | 'modal' | 'both';
  avoidLayoutShift?: boolean; // Avoids layout shift when the ConnectKit modal is open by adding padding to the body
  embedGoogleFonts?: boolean; // Automatically embeds Google Font of the current theme. Does not work with custom themes
  truncateLongENSAddress?: boolean;
  walletConnectName?: string;
  reducedMotion?: boolean;
  disclaimer?: ReactNode | string;
  bufferPolyfill?: boolean;
  customAvatar?: React.FC<CustomAvatarProps>;
  initialChainId?: number;
  enforceSupportedChains?: boolean;
  ethereumOnboardingUrl?: string;
  walletOnboardingUrl?: string;
  disableSiweRedirect?: boolean; // Disable redirect to SIWE page after a wallet is connected
  overlayBlur?: number; // Blur the background when the modal is open
} & OpenfortOptions;

type OpenfortKitProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;
  options?: ConnectKitOptions;
  debugMode?: boolean;

  publishableKey: string;
  walletConfig: FortWalletOptions;
} & useConnectCallbackProps;

/**
 * OpenfortKitProvider component provides context and configuration for ConnectKit.
 * It must be used within a WagmiProvider.
 *
 * @param {React.ReactNode} children - The child components to be wrapped by the provider.
 * @param {string} [theme='auto'] - The theme to be used, default is 'auto'.
 * @param {string} [mode='auto'] - The mode to be used, default is 'auto'.
 * @param {CustomTheme} [customTheme] - Custom theme configuration.
 * @param {ConnectKitOptions} [options] - Additional configuration options.
 * @param {Function} [onConnect] - Callback function to be called on connect.
 * @param {Function} [onDisconnect] - Callback function to be called on disconnect.
 * @param {boolean} [debugMode=false] - Enable or disable debug mode, default is false.
 * @param {OpenfortOptions} [openfortOptions] - Options for Openfort integration.
 * @throws Will throw an error if used outside of a WagmiProvider or if nested usages are detected.
 */
export const OpenfortKitProvider = ({
  children,
  theme = 'auto',
  mode = 'auto',
  customTheme,
  options,
  onConnect,
  onDisconnect,
  debugMode = false,

  publishableKey,
  walletConfig,
}: OpenfortKitProviderProps) => {
  // OpenfortKitProvider must be within a WagmiProvider
  if (!React.useContext(WagmiContext)) {
    throw Error('OpenfortKitProvider must be within a WagmiProvider');
  }

  // Only allow for mounting OpenfortKitProvider once, so we avoid weird global
  // state collisions.
  if (React.useContext(Context)) {
    throw new Error(
      'Multiple, nested usages of OpenfortKitProvider detected. Please use only one.'
    );
  }


  const chains = useChains();

  const injectedConnector = useConnector('injected');

  // Default config options
  const defaultOptions: ConnectKitOptionsExtended = {
    language: 'en-US',
    hideBalance: false,
    hideTooltips: false,
    hideQuestionMarkCTA: false,
    hideNoWalletCTA: false,
    walletConnectCTA: 'link',
    hideRecentBadge: false,
    avoidLayoutShift: true,
    embedGoogleFonts: false,
    truncateLongENSAddress: true,
    walletConnectName: undefined,
    reducedMotion: false,
    disclaimer: null,
    bufferPolyfill: true,
    customAvatar: undefined,
    initialChainId: chains?.[0]?.id,
    enforceSupportedChains: false,
    ethereumOnboardingUrl: undefined,
    walletOnboardingUrl: undefined,
    disableSiweRedirect: false,

    // Openfort options
    authProviders: [],
  };

  const opts: ConnectKitOptionsExtended = Object.assign({}, defaultOptions, options);

  if (opts.authProviders?.length === 0) {
    opts.authProviders = [
      AuthProvider.GUEST,
      AuthProvider.EMAIL,
      AuthProvider.WALLET,
    ];
  }

  if (typeof window !== 'undefined') {
    // Buffer Polyfill, needed for bundlers that don't provide Node polyfills (e.g CRA, Vite, etc.)
    if (opts.bufferPolyfill) window.Buffer = window.Buffer ?? Buffer;

    // Some bundlers may need `global` and `process.env` polyfills as well
    // Not implemented here to avoid unexpected behaviors, but leaving example here for future reference
    /*
     * window.global = window.global ?? window;
     * window.process = window.process ?? { env: {} };
     */
  }

  const [ckTheme, setTheme] = useState<Theme>(theme);
  const [ckMode, setMode] = useState<Mode>(mode);
  const [ckCustomTheme, setCustomTheme] = useState<CustomTheme | undefined>(
    customTheme ?? {}
  );
  const [ckLang, setLang] = useState<Languages>('en-US');
  const [open, setOpen] = useState<boolean>(false);
  const [connector, setConnector] = useState<ContextValue['connector']>({
    id: '',
  });
  const [route, setRoute] = useState<ValueOf<typeof routes>>(routes.LOADING);
  const [errorMessage, setErrorMessage] = useState<Error>('');

  const [resize, onResize] = useState<number>(0);

  // Include Google Font that is needed for a themes
  if (opts.embedGoogleFonts) useThemeFont(theme);

  // Other Configuration
  useEffect(() => setTheme(theme), [theme]);
  useEffect(() => setLang(opts.language || 'en-US'), [opts.language]);
  useEffect(() => setErrorMessage(null), [route, open]);

  // Check if chain is supported, elsewise redirect to switches page
  const { chain, isConnected } = useAccount();
  const isChainSupported = useChainIsSupported(chain?.id);

  useEffect(() => {
    if (isConnected && opts.enforceSupportedChains && !isChainSupported) {
      setOpen(true);
      setRoute(routes.SWITCHNETWORKS);
    }
  }, [isConnected, isChainSupported, chain, route, open]);

  // Autoconnect to Family wallet if available
  useEffect(() => {
    if (isFamily()) {
      injectedConnector?.connect();
    }
  }, [injectedConnector]);


  if (!walletConfig?.linkWalletOnSignUp && !walletConfig?.createEmbeddedSigner) {
    throw new Error("Link wallet on sign up is disabled, but no wallet option is enabled. Please enable 'linkWalletOnSignUp' or 'createEmbeddedSigner' in the wallet options.");
  }

  // if (!walletConfig) {
  //   opts.wallet = {
  //     createEmbeddedSigner: true,
  //     embeddedSignerConfiguration: {
  //       shieldPublishableKey: ,
  //       recoveryMethod: RecoveryMethod.AUTOMATIC,
  //       createEncryptedSessionEndpoint: '/api/protected-create-encryption-session',
  //     }
  //   };
  // }

  // const onLogin = () => {
  //   if (opts.wallet?.createEmbeddedSigner) {
  //     setRoute(routes.RECOVER);
  //   }
  // }


  const log = debugMode ? console.log : () => { };

  const value: ContextValue = {
    theme: ckTheme,
    setTheme,
    mode: ckMode,
    setMode,
    customTheme,
    setCustomTheme,
    lang: ckLang,
    setLang,
    open,
    setOpen,
    route,
    setRoute,
    connector,
    setConnector,
    onConnect,
    // Other configuration
    options: opts,
    errorMessage,
    debugMode,
    log,
    displayError: (message: string | React.ReactNode | null, code?: any) => {
      setErrorMessage(message);
      console.log('---------OPENFORT DEBUG---------');
      console.log(message);
      if (code) console.table(code);
      console.log('---------/OPENFORT DEBUG---------');
    },
    resize,
    triggerResize: () => onResize((prev) => prev + 1),
    walletConfig,
  };

  return createElement(
    Context.Provider,
    { value },
    <>
      <Web3ContextProvider enabled={open}>
        <OpenfortProvider
          baseConfiguration={{
            publishableKey,
          }}
          shieldConfiguration={walletConfig.createEmbeddedSigner ? {
            shieldPublishableKey: walletConfig.embeddedSignerConfiguration.shieldPublishableKey,
            shieldEncryptionKey: walletConfig.embeddedSignerConfiguration.recoveryMethod === RecoveryMethod.PASSWORD ? walletConfig.embeddedSignerConfiguration.shieldEncryptionKey : undefined,
          } : undefined}
          overrides={opts.openfortUrlOverrides}
          debugMode={debugMode}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        >
          <ThemeProvider theme={defaultTheme}>
            {children}
            <ConnectKitModal
              lang={ckLang}
              theme={ckTheme}
              mode={mode}
              customTheme={ckCustomTheme}
            />
          </ThemeProvider>
        </OpenfortProvider>
      </Web3ContextProvider>
    </>
  );
};

export const useOpenfortKit = () => {
  const context = React.useContext(Context);
  if (!context) throw Error('ConnectKit Hook must be inside a Provider.');
  return context;
};
