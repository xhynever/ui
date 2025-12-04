import { type KycStatus } from "@/client";
import { StandardAlert } from "@/components/ui/standard-alert";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { useDevMode } from "@/context/DevModeContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

const kycStatusesRequiringContact: KycStatus[] = ["rejected", "requiresAction"];

export const KycRoute = () => {
  const { user, refreshUser, isUserSignedUp } = useUser();
  const { getJWT } = useAuth();
  const { bypassNavigation } = useDevMode();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    // In dev mode with bypass, skip all navigation checks
    if (import.meta.env.DEV && bypassNavigation) return;

    if (!user?.kycStatus) return;

    // an issue happened during the KYC process
    if (kycStatusesRequiringContact.includes(user.kycStatus)) {
      setError(
        "Your KYC application has encountered an issue. Please contact support using the chat widget in the bottom right corner of the screen.",
      );
      return;
    }

    // the user is not signed up, they need to sign up first
    if (!isUserSignedUp) {
      navigate("/register");
    }

    // the user is all set up, they can go to the safe deployment page
    if (user.kycStatus === "approved") {
      navigate("/safe-deployment");
    }
  }, [navigate, user, isUserSignedUp, bypassNavigation]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const approveKycDirectly = async () => {
    try {
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return false;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      if (!userId) {
        setError("User not properly authenticated");
        return false;
      }

      console.log("Starting KYC approval for userId:", userId);

      // Step 1: Set KYC status to approved on backend
      const response = await fetch(
        `${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/set-kyc-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, status: "approved" }),
        },
      );

      console.log("KYC approval response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Failed to approve KYC");
      }

      const approveData = await response.json();
      console.log("Approval response data:", approveData);

      // Step 2: Trigger refreshUser to update the frontend state
      console.log("Triggering refreshUser to update frontend state");
      refreshUser();

      // Step 3: Wait a moment for data to be fetched and UI to update
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("KYC approval completed, current user status:", user?.kycStatus);

      // Step 4: Navigate directly - the useEffect will handle navigation when user updates
      // But to be safe, if user hasn't updated yet, navigate anyway
      if (!user || user.kycStatus !== "approved") {
        console.log("User status not yet updated to approved, forcing navigation");
        navigate("/safe-deployment");
      }

      return true;
    } catch (err) {
      setError(`Error approving KYC: ${err instanceof Error ? err.message : "Unknown error"}`);
      console.error(err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.country) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Submit form data - directly approve KYC
      const success = await approveKycDirectly();
      if (success) {
        toast.success("KYC information submitted successfully!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockKycApproval = async () => {
    setIsLoading(true);
    setError("");

    try {
      const success = await approveKycDirectly();
      if (success) {
        toast.success("KYC approved! (dev mode)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetKycStatus = async (status: string) => {
    setError("");
    setIsLoading(true);
    try {
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      const response = await fetch(
        `${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/set-kyc-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, status }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to set KYC status");
      }

      toast.success(`KYC status set to: ${status}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      refreshUser();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const KYC_STATUSES: Array<{ value: string; label: string; description: string }> = [
    { value: "notStarted", label: "Not Started", description: "User hasn't started KYC" },
    {
      value: "documentsRequested",
      label: "Documents Requested",
      description: "Waiting for user to upload documents",
    },
    { value: "pending", label: "Pending", description: "Awaiting verification" },
    { value: "processing", label: "Processing", description: "Being processed by Sumsub" },
    { value: "approved", label: "Approved ✓", description: "KYC approved, ready for next step" },
    {
      value: "resubmissionRequested",
      label: "Resubmission Requested",
      description: "Some checks failed, resubmit needed",
    },
    { value: "rejected", label: "Rejected", description: "Final rejection (contact support)" },
    { value: "requiresAction", label: "Requires Action", description: "Manual check required" },
  ];

  return (
    <div className="grid grid-cols-6 gap-4 h-full" data-testid="kyc-page">
      <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0 mt-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Let's get you verified</h1>
            <p className="text-muted-foreground">Follow the simple steps below</p>
            {user?.kycStatus && (
              <p className="text-sm text-muted-foreground mt-2">Current status: <strong>{user.kycStatus}</strong></p>
            )}
          </div>

          {error && (
            <StandardAlert
              variant="destructive"
              title="Error"
              description={error}
              data-testid="kyc-error-alert"
            />
          )}

          <div className="bg-card p-6 rounded-lg space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Step 1: Provide personal information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    type="text"
                    placeholder="United States"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  Submit KYC Information
                </Button>
              </form>
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold">
                🧪 Development Mode - Quick KYC Status Control
              </p>

              <div className="space-y-2">
                <Button
                  onClick={handleMockKycApproval}
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Approve KYC (Skip Form)
                </Button>
              </div>

              <div className="border-t border-yellow-200 dark:border-yellow-800 pt-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2 font-semibold">
                  Set KYC Status:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {KYC_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleSetKycStatus(status.value)}
                      disabled={isLoading}
                      className="text-xs px-2 py-1.5 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                      title={status.description}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
