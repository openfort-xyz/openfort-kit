import React, { useEffect } from "react";
import { useAccount, useChainId, useConnect } from "wagmi";
import { useOpenfort } from "../../../openfort/OpenfortProvider";
import Button from "../../Common/Button";
import Input from "../../Common/Input";
import { ModalBody, ModalHeading, PageContent } from "../../Common/Modal/styles";
import { routes, useOpenfortKit } from "../../OpenfortKit";
import { OAuthProvider, RecoveryMethod } from "@openfort/openfort-js";
import FitText from "../../Common/FitText";
import Loader from "../../Common/Loading";
import { isPlayerVerified } from "../../../utils";
import { motion, AnimatePresence } from 'framer-motion';

// TODO: Localize

const Recover: React.FC = () => {
  const [recoveryPhrase, setRecoveryPhrase] = React.useState("");
  const { handleRecovery } = useOpenfort();
  const [recoveryError, setRecoveryError] = React.useState<false | string>(false);
  const { triggerResize, options, log } = useOpenfortKit();
  const chain = useChainId();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = () => {
    setLoading(true);
    handleRecovery({
      method: RecoveryMethod.PASSWORD,
      password: recoveryPhrase,
      chainId: options?.initialChainId ?? chain,
    }).then((response) => {
      setLoading(false);
      if (response.success) {
        log("Recovery success");
      } else {
        setRecoveryError(response.error || "There was an error recovering your account");
      }
    });
  };

  useEffect(() => {
    if (recoveryError)
      triggerResize();
  }, [recoveryError]);

  return (
    <PageContent>
      <ModalHeading>Secure your account</ModalHeading>
      <ModalBody style={{ textAlign: "center" }}>
        <FitText>
          Enter the phrase to recover your account.
        </FitText>
      </ModalBody>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          value={recoveryPhrase}
          onChange={(e) => setRecoveryPhrase(e.target.value)}
          type="password"
          placeholder="Enter your recovery phrase"
          autoComplete="off"
        />

        {recoveryError && (
          <motion.div key={recoveryError} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModalBody style={{ height: 24, marginTop: 12 }} $error>
              <FitText>
                {recoveryError}
              </FitText>
            </ModalBody>
          </motion.div>
        )}
        <Button
          onClick={handleSubmit}
          waiting={loading}
          disabled={loading}
        >
          Enter
        </Button>
      </form>
    </PageContent >
  )
}

const AutomaticRecovery: React.FC = () => {
  const { needsRecovery, handleRecovery } = useOpenfort();
  const { options, log } = useOpenfortKit();
  const chain = useChainId();
  const [hasRecoveryMethod, setHasRecoveryMethod] = React.useState(false);

  useEffect(() => {
    if (!needsRecovery) {
      log("Automatic recovery enabled, configuring embedded signer");
      handleRecovery({
        method: RecoveryMethod.AUTOMATIC,
        chainId: options?.initialChainId ?? chain,
      }).then((response) => {
        if (response.error && response.error === "Missing recovery password") {
          setHasRecoveryMethod(true);
        }

      });
    }
  }, [needsRecovery]);

  if (hasRecoveryMethod) {
    return <Recover />
  }

  return (
    <PageContent>
      <Loader reason="Setting up signer" />
    </PageContent>
  )
}

const Connected: React.FC = () => {
  const { setOpen } = useOpenfortKit();

  // hide on connect
  useEffect(() => {
    setTimeout(() => {
      setOpen(false);
    }, 1000);
  }, []);

  return (
    <PageContent>
      <Loader
        isLoading={false}
        reason="Connected"
      />
    </PageContent>
  )
}

const CreateEmbeddedSigner: React.FC = () => {
  const { needsRecovery, user } = useOpenfort();
  const { triggerResize, options, walletConfig, setRoute } = useOpenfortKit();
  const [loading, setLoading] = React.useState(true);
  const [embeddedSignerLoading, setEmbeddedSignerLoading] = React.useState(true);
  const { isConnected } = useAccount();

  useEffect(() => {

    setTimeout(() => {
      setEmbeddedSignerLoading(false);
      triggerResize();
    }, 500);
  }, [])


  useEffect(() => {
    if (!user) return;

    if (!options?.skipEmailVerification && !isPlayerVerified(user)) {
      setRoute(routes.EMAIL_VERIFICATION);
      return;
    }

    if (walletConfig.linkWalletOnSignUp) {

      if (!user.linkedAccounts.find((account) => account.provider === "wallet")) {
        setRoute(routes.CONNECTORS);
        return;
      }

      if (!walletConfig.createEmbeddedSigner) {
        // Logged in without a wallet
        setRoute(routes.PROFILE);
        return;
      }
    }

    setLoading(false);
  }, [user])

  if (embeddedSignerLoading || loading) {
    return (
      <PageContent>
        <Loader reason="Setting up signer" />
      </PageContent>
    )
  }

  if (isConnected && user) {
    return <Connected />
  }

  if (walletConfig.createEmbeddedSigner && walletConfig.embeddedSignerConfiguration.recoveryMethod === RecoveryMethod.AUTOMATIC) {
    return <AutomaticRecovery />
  }

  if (needsRecovery) {
    return <Recover />
  } else {
    return (
      <PageContent>
        <Loader reason="Setting up signer" />
      </PageContent>
    )
  }
}

export default CreateEmbeddedSigner;
