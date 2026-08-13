import { ImportModal } from "../import/ImportModal";

type OnboardingModalProps = {
  open: boolean;
  onComplete: () => void;
};

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  return (
    <ImportModal
      open={open}
      onboarding
      onClose={onComplete}
      onComplete={onComplete}
    />
  );
}
