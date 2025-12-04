import { useEffect, useState, useMemo, useCallback } from "react";
import { getApiV1SourceOfFunds, postApiV1SourceOfFunds, type KycQuestion } from "@/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/utils/errorHelpers";
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

export type SourceOfFundsStepProps = {
  onComplete: () => void;
  setError: (err: string) => void;
};

const SourceOfFundsStep = ({ onComplete, setError }: SourceOfFundsStepProps) => {
  const { getJWT } = useAuth();
  const [sourceOfFunds, setSourceOfFunds] = useState<KycQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getApiV1SourceOfFunds().then(({ data, error }) => {
      if (error) {
        console.error("Error fetching source of funds:", error);
        const errorMessage = extractErrorMessage(error, "Unknown error");
        setError(`Error fetching source of funds: ${errorMessage}`);
        return;
      }
      setSourceOfFunds(data);
    });
  }, [setError]);

  const handleSoFAnswer = (index: number, answer: string) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[index] = answer;
      return newAnswers;
    });
  };

  const isSourceOfFundsSubmitDisabled = useMemo(
    () => isSubmitting || answers.length !== sourceOfFunds.length || answers.some((a) => !a),
    [isSubmitting, answers, sourceOfFunds.length],
  );

  const handleSOFSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setIsSubmitting(true);
      try {
        const { error } = await postApiV1SourceOfFunds({
          body: sourceOfFunds.map((q, idx) => ({
            question: q.question,
            answer: answers[idx],
          })),
        });
        if (error) {
          const errorMessage = extractErrorMessage(error, "Failed to submit answers");
          setError(errorMessage);
          return;
        }
        onComplete();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to submit answers";
        setError(errorMsg);
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, sourceOfFunds, onComplete, setError],
  );

  const handleMockApproval = useCallback(async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const jwt = await getJWT();
      if (!jwt) {
        setError("Failed to get authentication token");
        return;
      }

      const decoded = jwtDecode(jwt) as any;
      const userId = decoded.userId;

      const response = await fetch(
        `${import.meta.env.VITE_GNOSIS_PAY_API_BASE_URL}dev/source-of-funds-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve");
      }

      toast.success("Source of Funds approved (dev mode)!");
      onComplete();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [getJWT, setError, onComplete]);

  return (
    <div className="col-span-6 lg:col-start-2 lg:col-span-4 mx-4 lg:mx-0" data-testid="source-of-funds-step">
      <h2 className="text-lg font-semibold my-4">Please answer the following questions:</h2>
      <form onSubmit={handleSOFSubmit} className="space-y-6" data-testid="source-of-funds-form">
        {sourceOfFunds.map((q, idx) => {
          const qId = `sof-q-${idx}`;
          return (
            <div key={q.question} className="mb-4" data-testid={`source-of-funds-question-${idx}`}>
              <label htmlFor={qId} className="block mb-2 font-medium">
                {q.question}
              </label>
              <Select value={answers[idx] || ""} onValueChange={(value) => handleSoFAnswer(idx, value)}>
                <SelectTrigger id={qId} className="w-full" data-testid={`source-of-funds-select-${idx}`}>
                  <SelectValue placeholder="Select an answer" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {(q.answers || []).map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
        <Button
          loading={isSubmitting}
          type="submit"
          disabled={isSourceOfFundsSubmitDisabled}
          data-testid="source-of-funds-submit-button"
        >
          Submit
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-3 font-semibold">
            🧪 Development Mode
          </p>
          <Button
            onClick={handleMockApproval}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Mock Source of Funds Approval
          </Button>
        </div>
      )}
    </div>
  );
};

export default SourceOfFundsStep;
