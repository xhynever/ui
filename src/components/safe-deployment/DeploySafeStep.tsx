import { getApiV1SafeDeploy, postApiV1SafeDeploy } from "@/client";
import { useEffect, useState, useCallback, useRef } from "react";
import { extractErrorMessage } from "@/utils/errorHelpers";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

enum DeploymentStep {
  Initializing = "initializing",
  Deploying = "deploying",
  Done = "done",
}

interface DeploySafeStepProps {
  setError: (err: string) => void;
}

const DeploySafeStep = ({ setError }: DeploySafeStepProps) => {
  const { getJWT } = useAuth();
  const [step, setStep] = useState<DeploymentStep>(DeploymentStep.Initializing);
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMockButton, setShowMockButton] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshUser } = useUser();

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const checkDeploymentStatus = useCallback(() => {
    getApiV1SafeDeploy()
      .then(({ data, error }) => {
        if (error) {
          setError(extractErrorMessage(error, "An error occurred"));
          return;
        }

        if (data.status === "failed") {
          setError("An error occurred while deploying your Safe");
          setIsProcessing(false);
          stopPolling();
          return;
        }

        if (data.status === "ok") {
          setStep(DeploymentStep.Done);
          setIsProcessing(false);
          stopPolling();
          refreshUser();
          return;
        }

        if (data.status === "processing") {
          setIsProcessing(true);
          setStep(DeploymentStep.Deploying);
        }

        if (data.status === "not_deployed") {
          setStep(DeploymentStep.Deploying);
        }
      })
      .catch((err) => {
        setError(extractErrorMessage(err, "An error occurred"));
        setIsProcessing(false);
        stopPolling();
      });
  }, [setError, stopPolling, refreshUser]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(checkDeploymentStatus, 5000); // Poll every 5 seconds
  }, [checkDeploymentStatus]);

  // Initial status check
  useEffect(() => {
    if (step === DeploymentStep.Initializing) {
      checkDeploymentStatus();
    }
  }, [step, checkDeploymentStatus]);

  // Handle safe deployment when in deploying step and not processing
  useEffect(() => {
    if (step === DeploymentStep.Deploying && !isProcessing) {
      setIsProcessing(true);
      postApiV1SafeDeploy()
        .then(({ error }) => {
          if (error) {
            setError(extractErrorMessage(error, "An error occurred"));
            return;
          }
        })
        .catch((err) => {
          setError(extractErrorMessage(err, "An error occurred"));
        });
    }
  }, [step, isProcessing, setError]);

  // Poll when processing
  useEffect(() => {
    if (isProcessing) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isProcessing, startPolling, stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Show mock button after 3 seconds in dev mode
  useEffect(() => {
    if (import.meta.env.DEV && step === DeploymentStep.Deploying && isProcessing) {
      const timer = setTimeout(() => setShowMockButton(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, isProcessing]);

  const handleMockDeployment = useCallback(async () => {
    setError("");
    try {
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      const response = await fetch(
        `${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/safe-deploy-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve");
      }

      toast.success("Safe deployed (dev mode)!");
      setStep(DeploymentStep.Done);
      setIsProcessing(false);
      stopPolling();
      refreshUser();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [getJWT, setError, stopPolling, refreshUser]);

  return (
    <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0" data-testid="deploy-safe-step">
      <h2 className="text-lg font-semibold mb-4 mt-4">Configuring your Safe</h2>
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {step === DeploymentStep.Done && (
          <>
            <CheckCircle2 className="w-16 h-16 text-success" data-testid="safe-deployment-success-icon" />
            <p className="text-center text-muted-foreground" data-testid="safe-deployment-success-message">
              Your Safe account has been successfully created!
            </p>
            <Button className="mt-4" onClick={() => navigate("/")} data-testid="safe-deployment-visit-home-button">
              Visit Home
            </Button>
          </>
        )}
        {step !== DeploymentStep.Done && (
          <>
            <LoaderCircle className="w-16 h-16 animate-spin text-primary" data-testid="safe-deployment-loading-icon" />
            <p className="text-center text-muted-foreground" data-testid="safe-deployment-loading-message">
              {step === DeploymentStep.Initializing
                ? "Initializing your account..."
                : "Creating your Safe account (this may take a few minutes)..."}
            </p>

            {showMockButton && import.meta.env.DEV && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-xs">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3 font-semibold text-center">
                  🧪 Development Mode
                </p>
                <Button
                  onClick={handleMockDeployment}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Skip Deployment (Mock)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeploySafeStep;
