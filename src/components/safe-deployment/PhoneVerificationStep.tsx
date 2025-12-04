import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { OtpInput } from "@/components/otpInput";
import { postApiV1Verification, postApiV1VerificationCheck } from "@/client";
import { useTimer } from "@/hooks/useTimer";
import { extractErrorMessage } from "@/utils/errorHelpers";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

export type PhoneVerificationStepProps = {
  onComplete: () => void;
  setError: (err: string) => void;
  onCancel?: () => void;
  onPrev?: () => void;
  title: string;
};

enum PhoneStep {
  TypePhone = "type-phone",
  VerifyPhoneNumber = "verify-phone-number",
  OtpVerification = "otp-verification",
}

const PhoneVerificationStep = ({ onComplete, setError, onCancel, onPrev, title }: PhoneVerificationStepProps) => {
  const { getJWT } = useAuth();
  const [step, setStep] = useState<PhoneStep>(PhoneStep.TypePhone);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const { timer: resendTimer, start: startResendTimer } = useTimer(60);

  const handlePhoneContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(PhoneStep.VerifyPhoneNumber);
  };

  const sendCode = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const { error, data } = await postApiV1Verification({ body: { phoneNumber: phone } });
      if (error || !data?.ok) {
        const message = extractErrorMessage(error, "Unknown error");
        setError(`Error sending code: ${message}`);
        return false;
      }
      setStep(PhoneStep.OtpVerification);
      startResendTimer();
      return true;
    } catch (err) {
      setError("Error sending code");
      console.error(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsOtpLoading(true);
    try {
      const { error, data } = await postApiV1VerificationCheck({ body: { code: otp } });
      if (error || !data?.ok) {
        const message = extractErrorMessage(error, "Unknown error");
        setError(`Error verifying code: ${message}`);
        return;
      }
      onComplete();
    } catch (_err) {
      setError("Error verifying code");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendCode = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (resendTimer > 0) return;
    await sendCode();
    startResendTimer();
  };

  const handleMockApproval = useCallback(async () => {
    setError("");
    setIsOtpLoading(true);
    try {
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      const response = await fetch(
        `${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/phone-verify-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve");
      }

      toast.success("Phone verified (dev mode)!");
      onComplete();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsOtpLoading(false);
    }
  }, [getJWT, setError, onComplete]);

  return (
    <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0" data-testid="phone-verification-step">
      {step === PhoneStep.TypePhone && (
        <>
          <h2 className="text-lg font-semibold mb-4 mt-4">{title}</h2>
          <p className="text-muted-foreground mb-4">
            A one time code will be sent to your phone. Please enter your phone number to continue.
          </p>
          <form className="space-y-4 mt-4 w-xs" onSubmit={handlePhoneContinue} data-testid="phone-input-form">
            <PhoneInput value={phone} onChange={setPhone} disabled={isSubmitting} data-testid="phone-number-input" />
            <div className="flex gap-2">
              {onPrev && (
                <Button type="button" variant="outline" onClick={onPrev} disabled={isSubmitting}>
                  ← Previous
                </Button>
              )}
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!phone || isSubmitting} data-testid="phone-continue-button" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </>
      )}
      {step === PhoneStep.VerifyPhoneNumber && (
        <form className="space-y-4 mt-4" onSubmit={handlePhoneSubmit} data-testid="phone-confirm-form">
          <p className="text-muted-foreground mb-4">This number will be used to send you a one time code:</p>
          <div className="mb-4 font-mono text-lg" data-testid="phone-number-display">
            {phone}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(PhoneStep.TypePhone)}
              disabled={isSubmitting}
              data-testid="phone-edit-button"
            >
              Edit
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} data-testid="phone-send-code-button">
              Send code
            </Button>
          </div>
        </form>
      )}
      {step === PhoneStep.OtpVerification && (
        <form className="space-y-4 mt-4" onSubmit={handleOtpSubmit} data-testid="otp-verification-form">
          <label htmlFor="otp" className="block mb-4 font-medium mt-4">
            Enter the 6-digit code sent to your phone
          </label>
          <OtpInput
            value={otp}
            onChange={setOtp}
            isLoading={isOtpLoading}
            disabled={isOtpLoading}
            data-testid="otp-input"
          />
          <div className="flex gap-2">
            {onPrev && (
              <Button type="button" variant="outline" onClick={onPrev} disabled={isOtpLoading}>
                ← Previous
              </Button>
            )}
            <Button
              type="submit"
              loading={isOtpLoading}
              disabled={isOtpLoading || otp.length !== 6}
              data-testid="otp-verify-button"
              className="flex-1"
            >
              Verify & Next →
            </Button>
          </div>
          <Button
            type="button"
            variant="link"
            onClick={handleResendCode}
            disabled={isSubmitting || isOtpLoading || resendTimer > 0}
            data-testid="otp-resend-button"
            className="w-full"
          >
            {resendTimer > 0 ? `Resend code (${resendTimer}s)` : "Resend code"}
          </Button>

          {import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3 font-semibold">
                🧪 Development Mode
              </p>
              <Button
                type="button"
                onClick={handleMockApproval}
                loading={isOtpLoading}
                disabled={isOtpLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Mock Phone Verification
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default PhoneVerificationStep;
