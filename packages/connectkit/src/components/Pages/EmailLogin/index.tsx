import React, { useEffect } from "react";
import { useConnect } from "wagmi";
import { useOpenfort } from "../../../openfort/OpenfortProvider";
import Button from "../../Common/Button";
import Input from "../../Common/Input";
import { InnerContainer, ModalBody, PageContent } from "../../Common/Modal/styles";
import { routes, useFortKit } from "../../FortKit";
import { RecoveryMethod } from "@openfort/openfort-js";
import { OrDivider } from "../../Common/Modal";
import FitText from "../../Common/FitText";
import { AnimatePresence, Variants, motion } from 'framer-motion';
import { AuthIcon } from "../../../assets/icons";
import { TextContainer } from "../../ConnectButton/styles";
import { isPlayerVerified } from "../../../utils";
import { TextLinkButton } from "../../Common/Button/styles";

// TODO: Localize

const textVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    position: 'absolute',
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

const EmailLogin: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const { setRoute, triggerResize, log, options } = useFortKit();
  const { logInWithEmailPassword, logout, verifyEmail, requestEmailVerification } = useOpenfort();

  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<false | string>(false);

  const handleSubmit = async () => {
    setLoginLoading(true);
    logInWithEmailPassword({
      email,
      password
    }).catch((e) => {
      log("Login error:", e);
      setLoginLoading(false);
      setLoginError("Invalid email or password.");
      triggerResize();
    }).then((user) => {
      console.log("User", user);
      if (!user) {
        setLoginLoading(false);
        setLoginError("Invalid email or password.");
        triggerResize();
        return;
      }

      if (!options?.skipEmailVerification && !isPlayerVerified(user.player)) {
        setRoute(routes.EMAIL_VERIFICATION);
      } else {
        setRoute(routes.RECOVER);
      }
    });
  }

  return (
    <PageContent>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          style={{ marginTop: 0 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter your email"
          disabled={loginLoading}
        />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter your password"
          disabled={loginLoading}
        />

        {loginError && (
          <ModalBody style={{ height: 24, marginTop: 12 }} $error>
            <FitText>
              {loginError}
              <TextLinkButton
                type="button"
                onClick={() => {
                  setRoute(routes.FORGOT_PASSWORD);
                }}
              >
                Forgot password?
              </TextLinkButton>
            </FitText>
          </ModalBody>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loginLoading}
          waiting={loginLoading}
        >
          <AnimatePresence initial={false}>
            {loginLoading ? (
              <TextContainer
                key="connectedText"
                initial={'initial'}
                animate={'animate'}
                exit={'exit'}
                variants={textVariants}
              >
                Logging in...
              </TextContainer>
            ) : (
              <TextContainer
                key="connectedText"
                initial={'initial'}
                animate={'animate'}
                exit={'exit'}
                variants={textVariants}
              >
                Log in
              </TextContainer>
            )}
          </AnimatePresence>
        </Button>
      </form>
      <div style={{ marginTop: 16 }}>
        <OrDivider />
      </div>
      <Button
        onClick={() => { setRoute(routes.EMAIL_SIGNUP) }}
        disabled={loginLoading}
      >
        Sign up
      </Button>
    </PageContent >
  )
}

export default EmailLogin;
