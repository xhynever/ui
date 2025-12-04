import { StandardAlert } from "@/components/ui/standard-alert";
import { useUser } from "@/context/UserContext";
import { useDevMode } from "@/context/DevModeContext";
import { useEffect, useState } from "react";
import SourceOfFundsStep from "@/components/safe-deployment/SourceOfFundsStep";
import PhoneVerificationStep from "@/components/safe-deployment/PhoneVerificationStep";
import DeploySafeStep from "@/components/safe-deployment/DeploySafeStep";
import { useNavigate } from "react-router-dom";

enum ScreenStep {
  AnswerSourceOfFunds = "answer-source-of-funds",
  VerifyPhoneNumber = "verify-phone-number",
  DeploySafe = "deploy-safe",
}
export const SafeDeploymentRoute = () => {
  const [step, setStep] = useState<ScreenStep>(ScreenStep.AnswerSourceOfFunds);
  const { user, safeConfig, refreshUser: refetchUser, isUserSignedUp } = useUser();
  const { bypassNavigation } = useDevMode();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // In dev mode with bypass, skip all navigation checks
    if (import.meta.env.DEV && bypassNavigation) return;

    // If user is not signed up, redirect to register
    if (isUserSignedUp === false) {
      navigate("/register");
      return;
    }

    if (!user) return;

    // Check if user is KYC approved
    if (user.kycStatus !== "approved") {
      navigate("/kyc");
    }
  }, [user, navigate, isUserSignedUp, bypassNavigation]);

  useEffect(() => {
    if (!user || !safeConfig) return;

    if (user.isSourceOfFundsAnswered === true && step === ScreenStep.AnswerSourceOfFunds) {
      setStep(ScreenStep.VerifyPhoneNumber);
    }

    if (user.isPhoneValidated === true && step === ScreenStep.VerifyPhoneNumber) {
      setStep(ScreenStep.DeploySafe);
    }
  }, [user, safeConfig, step]);

  return (
    <div className="grid grid-cols-6 gap-4 h-full" data-testid="safe-deployment-page">
      {error && (
        <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0">
          <StandardAlert
            variant="destructive"
            title="Error"
            description={error}
            className="mt-4"
            data-testid="safe-deployment-error-alert"
          />
        </div>
      )}
      {step === ScreenStep.AnswerSourceOfFunds && (
        <SourceOfFundsStep
          onComplete={() => {
            refetchUser();
            setStep(ScreenStep.VerifyPhoneNumber);
          }}
          onPrev={() => {
            navigate("/kyc");
          }}
          setError={setError}
        />
      )}
      {step === ScreenStep.VerifyPhoneNumber && (
        <PhoneVerificationStep
          onComplete={() => {
            refetchUser();
            setStep(ScreenStep.DeploySafe);
          }}
          onPrev={() => {
            setStep(ScreenStep.AnswerSourceOfFunds);
          }}
          setError={setError}
          title="Mobile phone verification"
        />
      )}
      {step === ScreenStep.DeploySafe && <DeploySafeStep setError={setError} />}
    </div>
  );
};
