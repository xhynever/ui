import { type KycStatus } from "@/client";
import { StandardAlert } from "@/components/ui/standard-alert";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
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
  }, [navigate, user, isUserSignedUp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const approveKycOnBackend = async () => {
    try {
      // Get JWT and extract userId
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      if (!userId) {
        setError("User not properly authenticated");
        return;
      }

      // Call backend to approve KYC
      const response = await fetch(`${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/kyc-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve KYC");
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
      const success = await approveKycOnBackend();
      if (success) {
        toast.success("KYC information submitted successfully!");
        // Small delay before refreshing
        await new Promise((resolve) => setTimeout(resolve, 500));
        refreshUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockKycApproval = async () => {
    setIsLoading(true);
    setError("");

    try {
      const success = await approveKycOnBackend();
      if (success) {
        toast.success("KYC approved (dev mode)!");
        // Small delay before refreshing
        await new Promise((resolve) => setTimeout(resolve, 500));
        refreshUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-6 gap-4 h-full" data-testid="kyc-page">
      <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0 mt-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Let's get you verified</h1>
            <p className="text-muted-foreground">Follow the simple steps below</p>
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

              {import.meta.env.DEV && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3 font-semibold">
                    🧪 Development Mode
                  </p>
                  <Button
                    onClick={handleMockKycApproval}
                    loading={isLoading}
                    disabled={isLoading}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Mock KYC Approval (Skip Form)
                  </Button>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                    Click to directly approve KYC without filling the form above
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
