"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ContactSalesModal from "./ContactSalesModal"; // Import the new modal

const ServerCard = ({ title, description, gradient, actionButton, onClick, opensContactSalesModal = false }) => {
  const router = useRouter();
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const handleButtonClick = () => {
    if (opensContactSalesModal) {
      setIsSalesModalOpen(true);
    } else if (onClick) {
      onClick();
    } else {
      router.push("/infrastructure/dedicated/overview");
    }
  };

  return (
    <> {/* Fragment to wrap card and modal */}
      <div className={`rounded-lg p-4 lg:p-6 text-white mb-4 overflow-hidden relative ${gradient}`}>
        <div className="relative z-10 flex justify-between items-center">
        <div className="flex-1">
          <h2 className="text-xl lg:text-2xl font-bold mb-2">
            {title.split(" ").map((word, i) => (
              <span
                key={i}
                className={
                  i === 1
                    ? "text-orange-400"
                    : i === 2
                    ? "text-blue-400"
                    : ""
                }
              >
                {i > 0 ? " " : ""}
                {word}
              </span>
            ))}
          </h2>
          <p className="mb-0 max-w-lg opacity-90 text-gray-100 text-xs lg:text-sm">
            {description}
          </p>
        </div>
        <button
          className="bg-purple-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs lg:text-sm whitespace-nowrap"
          onClick={handleButtonClick} // Updated onClick handler
        >
          {actionButton}
        </button>
      </div>
      <div className="absolute right-0 bottom-0 w-1/2 h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
          <path
            d="M0,50 Q25,0 50,50 T100,50"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M0,60 Q25,10 50,60 T100,60"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M0,70 Q25,20 50,70 T100,70"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    </div>
    {opensContactSalesModal && (
      <ContactSalesModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
      />
    )}
  </>
  );
};

export default ServerCard;
