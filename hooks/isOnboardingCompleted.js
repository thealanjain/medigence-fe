import { useEffect, useState } from "react";
import { onboardingAPI } from "@/services/api";

export default function useIsOnboardingCompleted() {
const [isBordingCompleted, setIsBordingCompleted] = useState(false);
const [isPatientStatusLoading, setIsPatientStatusLoading] = useState(true);

 useEffect(() => {
     async function checkOnboardingProcess() {
       try {
         setIsPatientStatusLoading(true);
         const res = await onboardingAPI.getDraft();
         const { is_complete } = res.data.data;
         setIsBordingCompleted(is_complete);
       } catch {
         setIsBordingCompleted(false);
       } finally {
         setIsPatientStatusLoading(false);
       }
     }
     checkOnboardingProcess();
   }, []);

   return { isBordingCompleted, isPatientStatusLoading };
}