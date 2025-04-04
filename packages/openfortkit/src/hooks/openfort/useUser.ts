import { useEffect, useState } from "react";
import { useOpenfort } from '../../openfort/useOpenfort';

export function useUser() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { user, getAccessToken } = useOpenfort();

  useEffect(() => {
    setAccessToken(getAccessToken())
  }, [user])

  return { user, accessToken };
}