"use client";

import { Button } from "@/components/ui/button";

type PropertyEnquiryButtonProps = {
  projectName: string;
};

export function PropertyEnquiryButton({ projectName }: PropertyEnquiryButtonProps) {
  return (
    <Button
      type="button"
      variant="panel"
      className="mt-5 w-full"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("aqaar:open-lead", {
            detail: { preference: "project enquiry", selectedProject: projectName },
          }),
        );
      }}
    >
      Enquire
    </Button>
  );
}
