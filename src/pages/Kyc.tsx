import { type KycStatus } from "@/client";
import { StandardAlert } from "@/components/ui/standard-alert";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const kycStatusesRequiringContact: KycStatus[] = ["rejected", "requiresAction"];

export const KycRoute = () => {
  const { user, refreshUser, isUserSignedUp } = useUser();
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
    const mockKycApproved = import.meta.env.DEV && localStorage.getItem("gp-ui.mock-kyc-approved") === "true";
    if (user.kycStatus === "approved" || mockKycApproved) {
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
      // Simulate KYC verification by waiting
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In development mode, approve KYC locally
      if (import.meta.env.DEV) {
        localStorage.setItem("gp-ui.mock-kyc-approved", "true");
        toast.success("KYC information submitted successfully!");
        // Small delay before refreshing to ensure state updates
        await new Promise((resolve) => setTimeout(resolve, 500));
        refreshUser();
      } else {
        toast.success("KYC information submitted successfully!");
        refreshUser();
      }
    } catch (err) {
      setError("Error submitting KYC information");
      console.error(err);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
