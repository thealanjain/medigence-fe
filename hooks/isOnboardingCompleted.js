import { useEffect, useState } from "react";
import { onboardingAPI } from "@/services/api";

export default function useIsOnboardingCompleted() {
const [isBordingCompleted, setIsBordingCompleted] = useState(false);

 useEffect(() => {
     async function checkOnboardingProcess() {
       try {
         const res = await onboardingAPI.getDraft();
         const { is_complete } = res.data.data;
         setIsBordingCompleted(is_complete);
       } catch {
         setIsBordingCompleted(false);
       }
     }
     checkOnboardingProcess();
   }, []);

   return { isBordingCompleted };
}