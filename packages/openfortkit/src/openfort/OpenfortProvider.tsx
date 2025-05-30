import { Openfort, AuthPlayerResponse, EmbeddedState, MissingRecoveryPasswordError, RecoveryMethod, ShieldAuthentication, ShieldAuthType } from '@openfort/openfort-js';
import React, { createElement, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useOpenfortKit } from '../components/OpenfortKit/useOpenfortKit';
import { useConnect } from '../hooks/useConnect';
import { useConnectCallback, useConnectCallbackProps } from '../hooks/useConnectCallback';
import { Context } from './context';

type RecoveryProps =
  | { method: RecoveryMethod.AUTOMATIC; chainId: number }
  | { method: RecoveryMethod.PASSWORD; password: string; chainId: number };

export type ContextValue = {
  signUpGuest: () => Promise<void>;
  handleRecovery: (props: RecoveryProps) => Promise<{
    success?: boolean;
    error?: string;
  }>;
  embeddedState: EmbeddedState;

  isLoading: boolean;
  needsRecovery: boolean;
  user: AuthPlayerResponse | null;
  updateUser: () => Promise<AuthPlayerResponse | null>;

  logout: () => void;

  // from Openfort
  logInWithEmailPassword: typeof Openfort.prototype.logInWithEmailPassword;
  signUpWithEmailPassword: typeof Openfort.prototype.signUpWithEmailPassword;
  requestResetPassword: typeof Openfort.prototype.requestResetPassword;
  requestEmailVerification: typeof Openfort.prototype.requestEmailVerification;
  verifyEmail: typeof Openfort.prototype.verifyEmail;
  resetPassword: typeof Openfort.prototype.resetPassword;
  initOAuth: typeof Openfort.prototype.initOAuth;
  storeCredentials: typeof Openfort.prototype.storeCredentials;
  initSIWE: typeof Openfort.prototype.initSIWE;
  authenticateWithSIWE: typeof Openfort.prototype.authenticateWithSIWE;
  linkWallet: typeof Openfort.prototype.linkWallet;
  getAccessToken: () => Promise<string | null>;
  validateAndRefreshToken: typeof Openfort.prototype.validateAndRefreshToken;
  initLinkOAuth: typeof Openfort.prototype.initLinkOAuth;
  linkEmailPassword: typeof Openfort.prototype.linkEmailPassword;
  exportPrivateKey: typeof Openfort.prototype.exportPrivateKey;
};

const ConnectCallback = ({ onConnect, onDisconnect }: useConnectCallbackProps) => {
  useConnectCallback({
    onConnect,
    onDisconnect,
  });

  return null;
}

export type OpenfortProviderProps = {
  debugMode?: boolean;
} & ConstructorParameters<typeof Openfort>[0] & useConnectCallbackProps;

export const OpenfortProvider: React.FC<PropsWithChildren<OpenfortProviderProps>> = (
  {
    children,
    debugMode,
    onConnect,
    onDisconnect,
    ...openfortProps
  }
) => {
  const log = debugMode ? console.log : () => { };

  const { connectors, connect, reset } = useConnect();
  const { address } = useAccount();
  const [user, setUser] = useState<AuthPlayerResponse | null>(null);

  const { disconnect } = useDisconnect();
  const { walletConfig } = useOpenfortKit();

  const automaticRecovery = walletConfig.createEmbeddedSigner && walletConfig.embeddedSignerConfiguration.recoveryMethod === RecoveryMethod.AUTOMATIC;

  // ---- Openfort instance ----
  const openfort = useMemo(() => {
    log('Creating Openfort instance.');

    if (!openfortProps.baseConfiguration.publishableKey)
      throw Error('OpenfortProvider requires a publishableKey to be set in the baseConfiguration.');

    return new Openfort(openfortProps)
  }, []);

  // ---- Embedded state ----
  const [embeddedState, setEmbeddedState] = useState<EmbeddedState>(EmbeddedState.NONE);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollEmbeddedState = useCallback(async () => {
    if (!openfort) return;

    try {
      const state = openfort.getEmbeddedState();
      log("Polling embedded state", state);
      setEmbeddedState(state);
    } catch (error) {
      console.error('Error checking embedded state with Openfort:', error);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [openfort]);

  const startPollingEmbeddedState = useCallback(() => {

    if (!!pollingRef.current) return;
    log("Starting polling embedded state", pollingRef.current, !!pollingRef.current);
    pollingRef.current = setInterval(pollEmbeddedState, 300);
  }, [pollEmbeddedState]);

  const stopPollingEmbeddedState = useCallback(() => {
    log("Stopping polling embedded state");
    clearInterval(pollingRef.current || undefined);
    pollingRef.current = null;
  }, []);

  useEffect(() => {
    if (!openfort) return;

    startPollingEmbeddedState();

    return () => {
      stopPollingEmbeddedState();
    };
  }, [openfort]);

  const setUserIfNull = useCallback(async () => {
    if (!openfort) return;
    if (!user) {
      log("Getting user");
      openfort.getUser()
        .then((user) => {
          log("Setting user", user);
          setUser(user);
        }).catch((err) => {
          log("Error getting user", err);
          if (err?.response?.status === 404) {
            log("User not found, logging out");
            logout();
          } else if (err?.response?.status === 401) {
            log("User not authenticated, logging out");
            logout();
          }
        })
    }
  }, [user, openfort]);

  const updateUser = useCallback(async () => {
    if (!openfort) return null;
    return openfort.getUser()
      .then((user) => {
        log("Setting user", user);
        setUser(user);
        return user;
      }).catch((err) => {
        log("Error getting user", err);
        return null;
      })
  }, [openfort]);

  useEffect(() => {
    if (!openfort) return;
    if (!walletConfig.createEmbeddedSigner) return

    log("Getting ethereum provider");
    openfort.getEthereumProvider(
      walletConfig.embeddedSignerConfiguration.ethereumProviderPolicyId ?
        {
          policy: walletConfig.embeddedSignerConfiguration.ethereumProviderPolicyId,
        }
        : undefined
    );
  }, [openfort])

  const [isConnectedWithEmbeddedSigner, setIsConnectedWithEmbeddedSigner] = useState(false);
  useEffect(() => {
    if (!openfort) return;
    // Poll embedded signer state

    log("Embedded state update", embeddedState);

    switch (embeddedState) {
      case EmbeddedState.NONE:
      case EmbeddedState.CREATING_ACCOUNT:
        break;
      case EmbeddedState.UNAUTHENTICATED:
        setUser(null);
        break;

      case EmbeddedState.EMBEDDED_SIGNER_NOT_CONFIGURED:
        setUserIfNull();
        setIsConnectedWithEmbeddedSigner(false);

        break;
      case EmbeddedState.READY:
        setUserIfNull();

        // We cannot stop polling here because there is a bug on openfort-js
        // that makes the embedded state to be stuck on CREATING_ACCOUNT
        // stopPollingEmbeddedState();

        break;

      default:
        throw new Error(`Unknown embedded state: ${embeddedState}`);
    }
  }, [embeddedState, openfort, automaticRecovery, setUserIfNull]);

  useEffect(() => {
    // Connect to wagmi with Embedded signer
    if (address || !user) return;
    if (isConnectedWithEmbeddedSigner) return;

    if (embeddedState !== EmbeddedState.READY) return;
    const connector = connectors.find((connector) => connector.name === "Openfort")
    if (!connector) return

    log("Connecting to wagmi with Openfort");
    setIsConnectedWithEmbeddedSigner(true);
    connect({ connector });
  }, [connectors, embeddedState, address, user]);


  // ---- Recovery ----

  const getEncryptionSession = async (): Promise<string> => {
    if (!walletConfig.createEmbeddedSigner || !walletConfig.embeddedSignerConfiguration.createEncryptedSessionEndpoint) {
      throw new Error("No createEncryptedSessionEndpoint set in walletConfig");
    }

    const resp = await fetch(walletConfig.embeddedSignerConfiguration.createEncryptedSessionEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error("Failed to create encryption session");
    }

    const respJSON = await resp.json();
    return respJSON.session;
  }

  const handleRecovery = useCallback(async (props: RecoveryProps) => {
    if (!openfort) return {
      error: "Openfort not initialized",
    };
    if (!walletConfig.createEmbeddedSigner) {
      return {
        error: "Embedded signer not enabled",
      }
    }

    const { method, password, chainId } = { password: undefined, ...props };
    log(`Handling recovery with Openfort: method=${method}, password=${password}, chainId=${chainId}`);
    try {
      if (method === RecoveryMethod.AUTOMATIC) {

        const shieldAuth: ShieldAuthentication = {
          auth: ShieldAuthType.OPENFORT,
          token: openfort.getAccessToken()!,
          encryptionSession: walletConfig.embeddedSignerConfiguration.getEncryptionSession ?
            await walletConfig.embeddedSignerConfiguration.getEncryptionSession() :
            await getEncryptionSession(),
        };
        log("Configuring embedded signer with automatic recovery");
        await openfort.configureEmbeddedSigner(chainId, shieldAuth);
      } else if (method === RecoveryMethod.PASSWORD) {
        if (!password || password.length < 4) {
          throw "Password recovery must be at least 4 characters";
        }
        const shieldAuth: ShieldAuthentication = {
          auth: ShieldAuthType.OPENFORT,
          token: openfort.getAccessToken()!,
        };
        await openfort.configureEmbeddedSigner(chainId, shieldAuth, password);
      }

      return {
        success: true,
      };
    } catch (err) {
      log('Error handling recovery with Openfort:', err);
      if (err instanceof MissingRecoveryPasswordError) {
        return {
          error: "Missing recovery password",
        }
      }
      if (typeof err === 'string') {
        return {
          error: err,
        }
      }
      return {
        error: "The recovery phrase you entered is incorrect.",
      };
    }
  }, [openfort]);

  // ---- Auth functions ----

  const logout = useCallback(() => {
    if (!openfort) return;

    log('Logging out...');
    openfort.logout();
    setUser(null);
    disconnect();
    reset();
    startPollingEmbeddedState();
  }, [openfort]);

  const signUpGuest = useCallback(async () => {
    if (!openfort) return;

    try {
      log('Signing up as guest...');
      const res = await openfort.signUpGuest();
      log('Signed up as guest:', res);
    } catch (error) {
      console.error('Error logging in as guest:', error);
    }
  }, [openfort]);

  const logInWithEmailPassword: typeof Openfort.prototype.logInWithEmailPassword = useCallback(async (props) => {
    return openfort.logInWithEmailPassword(props);
  }, [openfort]);

  const signUpWithEmailPassword: typeof Openfort.prototype.signUpWithEmailPassword = useCallback(async (props) => {
    return openfort.signUpWithEmailPassword(props);
  }, [openfort]);

  const resetPassword: typeof Openfort.prototype.resetPassword = useCallback(async (props) => {
    return openfort.resetPassword(props);
  }, [openfort]);

  const requestResetPassword: typeof Openfort.prototype.requestResetPassword = useCallback(async (props) => {
    return openfort.requestResetPassword(props);
  }, [openfort]);

  const requestEmailVerification: typeof Openfort.prototype.requestEmailVerification = useCallback(async (props) => {
    return openfort.requestEmailVerification(props);
  }, [openfort]);

  const verifyEmail: typeof Openfort.prototype.verifyEmail = useCallback(async (props) => {
    return openfort.verifyEmail(props);
  }, [openfort]);

  const initOAuth: typeof Openfort.prototype.initOAuth = useCallback(async (props) => {
    return openfort.initOAuth(props);
  }, [openfort]);

  const storeCredentials: typeof Openfort.prototype.storeCredentials = useCallback(async (props) => {
    return openfort.storeCredentials(props);
  }, [openfort]);

  const initSIWE: typeof Openfort.prototype.initSIWE = useCallback(async (props) => {
    return openfort.initSIWE(props);
  }, [openfort]);

  const authenticateWithSIWE: typeof Openfort.prototype.authenticateWithSIWE = useCallback(async (props) => {
    return openfort.authenticateWithSIWE(props);
  }, [openfort]);

  const linkWallet: typeof Openfort.prototype.linkWallet = useCallback(async (props) => {
    return openfort.linkWallet(props);
  }, [openfort]);

  const getAccessToken: () => Promise<string | null> = useCallback(async () => {
    try {
      await openfort.validateAndRefreshToken();
      return openfort.getAccessToken();
    } catch (error) {
      return null;
    }
  }, [openfort]);

  const validateAndRefreshToken: typeof Openfort.prototype.validateAndRefreshToken = useCallback(async (...props) => {
    return openfort.validateAndRefreshToken(...props);
  }, [openfort]);

  const initLinkOAuth: typeof Openfort.prototype.initLinkOAuth = useCallback(async (props) => {
    return openfort.initLinkOAuth(props);
  }, [openfort]);

  const linkEmailPassword: typeof Openfort.prototype.linkEmailPassword = useCallback(async (props) => {
    return openfort.linkEmailPassword(props);
  }, [openfort]);

  const exportPrivateKey: typeof Openfort.prototype.exportPrivateKey = useCallback(async () => {
    return openfort.exportPrivateKey();
  }, [openfort]);

  // ---- Return values ----

  const isLoading = useCallback(() => {
    switch (embeddedState) {
      case EmbeddedState.NONE:
      case EmbeddedState.CREATING_ACCOUNT:
        return true;

      case EmbeddedState.UNAUTHENTICATED:
        if (user) return true; // If user is set in unauthenticated state, it means that the embedded state is not up to date, so we should wait
        return false;

      case EmbeddedState.EMBEDDED_SIGNER_NOT_CONFIGURED:
        if (!user)
          return true;

        // If automatic recovery is enabled, we should wait for the embedded signer to be ready
        return false;
      case EmbeddedState.READY:
        // We should wait for the user to be set  
        if (!address || !user)
          return true;
        else
          return false;

      default:
        return true;
    }
  }, [embeddedState, address, user]);

  const needsRecovery =
    !automaticRecovery && (
      embeddedState === EmbeddedState.EMBEDDED_SIGNER_NOT_CONFIGURED
    ) && (
      !address
    );

  const value: ContextValue = {
    signUpGuest,
    handleRecovery,
    embeddedState,
    logout,

    isLoading: isLoading(),
    needsRecovery,
    user,
    updateUser,
    requestEmailVerification,
    verifyEmail,

    // from Openfort
    signUpWithEmailPassword,
    logInWithEmailPassword,
    resetPassword,
    requestResetPassword,
    initOAuth,
    storeCredentials,
    initSIWE,
    authenticateWithSIWE,
    linkWallet,
    getAccessToken,
    validateAndRefreshToken,
    initLinkOAuth,
    linkEmailPassword,
    exportPrivateKey,
  };

  return createElement(Context.Provider, { value }, <><ConnectCallback onConnect={onConnect} onDisconnect={onDisconnect} />{children}</>);
};


